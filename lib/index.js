/**
 * AgentTeams for DeepSeek Harness.
 *
 * A host-plane plugin that registers the `deers_team_*` tools and one usage
 * agent-scoped usage section. Each session keeps a stable tool set and core
 * instructions. Existing business tools cover the complete team lifecycle.
 * After installation any session can
 * run multi-agent teamwork through natural language (e.g. "use AgentTeams to research X"):
 * the model creates a team (it becomes the captain), spawns members as
 * durable continuable subagents, breaks the goal into tasks with
 * dependencies, wakes members with messages, relays reports, and collects
 * results.
 *
 * Installation (bundle): `dsh plugin --profile <name> add deers-dsh-agent-team`
 * (or a local path). The bundle patch mounts this plugin row into the host
 * composition; the tools register into the shared `tools` registry and the
 * usage section into the global system prompt, so the plugin needs no realm.
 *
 * @module deers-dsh-agent-team
 */
import z from '@deepseek-ai/schemastery';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { haltTeamWork, stagedPlanApprovedContext, registerAgentTeamsTools, } from "./tools.js";
import { installAgentTeamsGestureBoundary, registerAgentTeamsCommand } from "./command.js";
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectArchivedTeamsActivity, collectTeamsActivity } from "./snapshot.js";
import { blackboardOf, DEFAULT_BLACKBOARD_CLEANUP } from "./blackboard.js";
import { cleanupTeamBlackboard } from "./blackboard-cleanup.js";
import { readPolls } from "./polls.js";
import { findTeamByCaptain, readArchivedTeam, readMailbox, readTeam } from "./state.js";
import { formatProfilesForPrompt } from "./profiles.js";
import { installTeamCapabilities } from "./capabilities.js";
import { TEAM_TOOL_NAMES } from "./tool-names.js";
// The stable business API names are part of the package's published surface so
// verification tooling (and any host-side integration test) can derive the
// captain/member tool sets instead of hard-coding a count that drifts whenever
// an operation is added.
export { TEAM_TOOL_NAMES, MEMBER_TOOL_NAMES, CAPTAIN_TOOL_NAMES } from "./tool-names.js";
import { authenticatedWebRoutes, readJsonRequest, RequestBodyError } from "./web-routes.js";
import { registerUiRoutes } from "./web/ui-routes.js";
/** Web-server service key candidates, newest first. */
const WEB_SERVER_KEYS = ['webServer', 'httpServer'];
/** Workspace registry service key candidates, newest first. */
const WORKSPACE_KEYS = ['workspaceRegistry', 'workspace'];
export const name = 'deers-agent-team';
// `skills` exposes the host skill registry (`ctx.skills`) so member skill
// assignments can be validated against the real catalog at edit time.
export const inject = ['tools', 'llm', 'subagents', 'systemPrompt', 'agents', 'skills'];
// `z.object()` has an implicit `{}` default in Schemastery.  Fallback routes
// are optional, so model absence explicitly; otherwise a missing route is
// validated as an empty object and fails on the required provider/model keys.
const fallbackRouteConfig = z.union([
    z.object({ provider: z.string().required(), model: z.string().required() }),
    z.const(undefined),
]);
export const Config = z.object({
    stateDir: z.string().default('.deers-agent-team'),
    memberProvider: z.string().default('spawn'),
    memberModel: z.string(),
    executionPrompt: z.string(),
    fallback: fallbackRouteConfig,
    profiles: z.dict(z.object({
        description: z.string(),
        protocol: z.string(),
        executionPrompt: z.string(),
        fallback: fallbackRouteConfig,
        members: z.array(z.object({
            name: z.string().required(),
            role: z.string(),
            provider: z.string(),
            model: z.string(),
            reasoning_effort: z.string(),
            executionPrompt: z.string(),
            fallback: fallbackRouteConfig,
        })).min(1).required(),
        taskPlanning: z.union([z.const('captain'), z.const('seed')]),
        reviewPolicy: z.object({
            requirementsMinRounds: z.natural().min(1),
            requirementsMaxRounds: z.natural().min(1),
            codeMaxRounds: z.natural().min(1),
            maxRepairAttempts: z.natural().min(1),
            requiredReviewers: z.array(z.string()),
        }),
        tasks: z.array(z.object({
            id: z.string().required(),
            subject: z.string().required(),
            description: z.string(),
            assignee: z.string(),
            dependencies: z.array(z.string()),
        })),
    })).default({}),
    memberMaxDepth: z.natural().default(0),
    maxMembers: z.natural().min(1).default(12),
    promptSectionOrder: z.natural().default(117),
    slashCommand: z.boolean().default(true),
    /** Keep the captain in the Router role: block implementation/repair takeover unless true. */
    captainMayImplement: z.boolean().default(false),
    /** Coalesce member reports to the captain; 0 disables batching. */
    routerBatchWindowMs: z.natural().default(1200),
    watchdog: z.object({
        enabled: z.boolean().default(true),
        intervalSeconds: z.natural().min(5).default(60),
        stallSeconds: z.natural().min(60).default(1800),
        repeatWindowSeconds: z.natural().min(60).default(600),
        repeatThreshold: z.natural().min(2).default(3),
        maxAttempts: z.natural().min(1).default(4),
        notifyCaptain: z.boolean().default(true),
    }),
    blackboardCleanup: z.object({
        /** Enable periodic removal of stale blackboard entries. */
        enabled: z.boolean().default(true),
        intervalSeconds: z.natural().min(60).default(3600),
        /** Entries older than this many days become eligible for removal. */
        retentionDays: z.natural().min(1).default(30),
        /** The newest N entries are always retained. */
        keepLatest: z.natural().default(10),
        /** Pinned entries survive cleanup. */
        keepPinned: z.boolean().default(true),
        /** Decision entries survive cleanup. */
        keepDecisions: z.boolean().default(true),
    }).default({}),
});
/** The model-facing usage policy: when and how to drive AgentTeams. */
export function usageSectionText(toolNames, profilesText = '') {
    return `AgentTeams captain protocol:
1. Inspect current team state when needed, using deers_team_status. Continue existing work without duplicating its roster/tasks. Create only when no current team exists, with the user's goal as description and approval="required"; automatic approval requires an explicit request to run immediately. Staged plans never spawn or schedule work.
2. Add each needed role once; members inherit your model route unless another is requested/needed. A requested profile goes to create({profile}); it supplies its roster. Seed profiles also supply tasks; captain-planning profiles require your DAG. Do not duplicate either.
3. Build the complete smallest useful DAG while staged. For an ordinary research/audit plan, pass the roster and dependency graph together in create({plan:{members,tasks}}) to avoid repeated setup rounds. Every task needs a subject; pass kind and assignee explicitly when the plan specifies them. Titles, descriptions and member roles do not set these fields. Dependencies represent prerequisites. Give every required contributor a task or explicit message. Present the plan and end your turn for review; never approve in that planning turn. Approve only after a later explicit user approval or the Web action.
4. Respect Web approve/return/discard control messages. On return, ask what to change before editing; after the answer, use one atomic deers_team_edit_plan batch (edit downstream references before removals), summarize and await review again. Never inspect or edit .deers-agent-team state files or plugin source code to revise plans. Discard does not authorize a replacement.
5. The scheduler dispatches ready tasks after approval. Delegate; do not duplicate slow work or send messages merely to start a stage. Handle reports/user work, then yield when waiting is all that remains: reports wake you automatically. Use status after a delivery or user request, never busy-poll or wait for unassigned members.
6. Tasks carry attempt_id capabilities. Use the current attempt_id; stale means ownership changed. Pause members only on explicit request; later guidance via send_message continues that same attempt. Retry, transfer or take over through reassign_task first; it revokes the old attempt and waits for quiescence. Prefer a member. The captain stays in the Router role: implementation/repair takeover is blocked by default (captainMayImplement=false) unless the user explicitly asks and the profile enables it. Every takeover is one ready task at a time, finished in this turn; never yield with captain-owned work open.
7. In a running team, correct never-started pending tasks with edit_plan update_task; preserve dependency and ownership contracts instead of cancelling and recreating the graph. A captain can cancel a never-started pending task directly. Active attempts still require reassign_task. Quality kinds (requirements, implementation, verification, review, repair, integration) require objective + acceptance; implementation/repair also require inScope + verify. Derive paths/commands from the workspace/profile, never assume src/ or pnpm test. Review/requirements complete only with verdict=pass; needs_revision/reject fail with findings. Never approve your own implementation or ask for a deliberate failure. When a quality contract itself is wrong (a verify command that cannot pass, an inScope that forbids the file the objective requires), fix it with deers_team_amend_task — captain-only, non-terminal tasks only, frozen after a passing review, and every amendment is recorded in the task's revisions ledger — instead of letting the worker dead-lock or game the gate.
8. When full quality mode is requested: requirements → implementation → verification → review → integration. Plan the entire DAG while staged, including implementation before requirements finishes and integration depending on review round 1. Failed review automatically adds repair + next review and rewires pending downstream gates. Do not recreate this loop, omit integration or depend on a failed task. Review acceptance judges the latest implementation. Do not put smoke-test scripts into task instructions.
9. Halted means the user stopped work (including the captain turn). Resume only on a later explicit user request with a reason, via deers_team_resume or create_task({resume:true,resumeReason}); creating tasks alone never resumes. Escalated means the review loop hit its limit, not a halt. Deployment requires explicit user confirmation.
10. Wait for all required tasks to be terminal and members idle/ready, present results, then delete/archive unless the user wants to continue. Never discard unfinished work without authorization.
11. For brainstorming, idea collection and feature voting, use the shared blackboard: deers_team_blackboard_post to add entries (kind note/idea/proposal/decision), deers_team_blackboard_read to see everyone's entries, deers_team_blackboard_vote to up/down vote proposals. Members can post and vote too. Keep the board for discussion that is not yet a task; convert agreed outcomes into tasks. Clear it with deers_team_blackboard_clear only after the round is concluded and summarized.
12. While a long step runs (tests, builds, CI), the working member reports deers_team_progress with the current attempt_id plus a short note/optional percent. The watchdog treats a claimed/in-progress task without a heartbeat for too long as stalled; the captain never reports heartbeats for a member.
13. On routine turns prefer deers_team_digest (bounded: counts, active/blocked tasks, progress age, blackboard highlights, watchdog alerts, lead-time metrics, recent messages) over the full deers_team_status; pull exact detail with deers_team_recall by task_id/message_id/board_id only when an id actually matters.
14. Watchdog alerts in status/digest are signals, not actions: diagnose, then nudge, retry, reassign or escalate yourself. Do not let identical nudges loop; if the same alert persists after intervention, report it to the user instead of retrying forever.
15. Formal voting uses polls, not blackboard votes: the captain starts one with deers_team_vote_create (single-choice by default; multi_select=true for multi-choice, with optional max_selections and duration_minutes), every participant casts a ballot with deers_team_vote_cast, results come from deers_team_vote_read, and the captain closes it with deers_team_vote_close. Keep blackboard votes for informal reactions only.
Tools: ${toolNames}${profilesText === '' ? '' : `\n\n${profilesText}`}`;
}
export function apply(ctx, config) {
    const resolved = {
        stateDir: config.stateDir ?? '.deers-agent-team',
        memberProvider: config.memberProvider ?? 'spawn',
        memberModel: config.memberModel,
        executionPrompt: config.executionPrompt,
        fallback: config.fallback,
        memberMaxDepth: config.memberMaxDepth ?? 0,
        maxMembers: config.maxMembers ?? 12,
        profiles: config.profiles ?? {},
        captainMayImplement: config.captainMayImplement ?? false,
        routerBatchWindowMs: config.routerBatchWindowMs ?? 1200,
        watchdog: {
            enabled: config.watchdog?.enabled ?? true,
            intervalMs: (config.watchdog?.intervalSeconds ?? 60) * 1000,
            stallMs: (config.watchdog?.stallSeconds ?? 1800) * 1000,
            repeatWindowMs: (config.watchdog?.repeatWindowSeconds ?? 600) * 1000,
            repeatThreshold: config.watchdog?.repeatThreshold ?? 3,
            maxAttempts: config.watchdog?.maxAttempts ?? 4,
            notifyCaptain: config.watchdog?.notifyCaptain ?? true,
        },
        blackboardCleanup: {
            enabled: config.blackboardCleanup?.enabled ?? true,
            intervalMs: (config.blackboardCleanup?.intervalSeconds ?? 3600) * 1000,
            retentionDays: config.blackboardCleanup?.retentionDays ?? 30,
            keepLatest: config.blackboardCleanup?.keepLatest ?? 10,
            keepPinned: config.blackboardCleanup?.keepPinned ?? true,
            keepDecisions: config.blackboardCleanup?.keepDecisions ?? true,
        },
    };
    // Provider registration is a sibling plugin's effect (`subagent-spawn` /
    // `subagent-fork` rows), which can land after this mount under the Loader's
    // concurrent activation — so capability validation happens at the first
    // member spawn (`spawnMember`), the earliest point the provider list is
    // settled, rather than here.
    const agentTeamsRuntime = registerAgentTeamsTools(ctx, resolved);
    installTeamCapabilities(ctx, {
        stateDir: resolved.stateDir,
        isPendingMember: agentTeamsRuntime.isPendingMember,
        order: config.promptSectionOrder,
        // Keep the bounded profile directory available without extra tool calls.
        // installTeamCapabilities snapshots this once; no business state rewrites it.
        captainPrompt: () => usageSectionText(TEAM_TOOL_NAMES.join(', '), formatProfilesForPrompt(config.profiles)),
    });
    // Deterministic activation surfaces: the closed-namespace `/deers-agent-team`
    // host command (surfaces in the Web GUI slash menu via the Harness
    // ui-commands client) and the plain-text gesture boundary for surfaces
    // without command adjudication (headless CLI). Both default on; a profile
    // can disable them to keep the natural-language trigger exclusive.
    //
    // `commands` is registered lazily (not a required inject): it ships in the
    // base bundle of every standard profile, but a minimal composition that
    // omits the command registry keeps the plugin fully functional — the fiber
    // never pends on it and simply never gains the slash command.
    if (config.slashCommand ?? true) {
        ctx.inject(['commands'], (commandCtx) => {
            registerAgentTeamsCommand(commandCtx, () => config.profiles ?? {});
        });
        installAgentTeamsGestureBoundary(ctx, () => config.profiles ?? {});
    }
    // The activity panel data/artwork routes need the Web server and the
    // workspace registry, which headless profiles do not mount; under
    // concurrent activation they may also bind after this plugin. Register the
    // routes lazily: try now, then on each service binding event. In a webless
    // profile the plugin stays tool-only and never blocks boot.
    let webRegistered = false;
    const registerWebSurface = () => {
        if (webRegistered)
            return;
        const rawWebServer = (ctx.get(WEB_SERVER_KEYS[0]) ?? ctx.get(WEB_SERVER_KEYS[1]));
        const workspaceRegistry = (ctx.get(WORKSPACE_KEYS[0]) ?? ctx.get(WORKSPACE_KEYS[1]));
        if (rawWebServer === undefined || workspaceRegistry === undefined)
            return;
        const webServer = authenticatedWebRoutes(rawWebServer, () => ctx.get('connection'));
        webRegistered = true;
        // Activity panel data route: the browser floater polls this for team
        // snapshots (disk truth + live subagent activity). Mirrors the Claude
        // Code desktop watcher's server-side snapshot pattern.
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/state',
            handler: async (req, res) => {
                const url = new URL(req.url ?? '/', 'http://x');
                const roots = workspaceRegistry.list().map((workspace) => ({
                    workspace: workspace.title,
                    stateRoot: join(workspace.path, resolved.stateDir),
                }));
                // ?archived=1 serves teams moved to archive/ (post-delete review).
                const snapshots = url.searchParams.get('archived') === '1'
                    ? await collectArchivedTeamsActivity(ctx, roots)
                    : await collectTeamsActivity(ctx, roots);
                const body = JSON.stringify({ teams: snapshots });
                res.writeHead(200, {
                    'content-type': 'application/json; charset=utf-8',
                    'cache-control': 'no-store',
                });
                res.end(body);
            },
        }), 'deers-agent-team: activity route');
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/halt',
            handler: async (req, res) => {
                if (req.method !== 'POST') {
                    res.writeHead(405, { allow: 'POST', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                let payload;
                try {
                    payload = await readJsonRequest(req);
                }
                catch (error) {
                    res.writeHead(error instanceof RequestBodyError ? error.status : 400, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'invalid request body' }));
                    return;
                }
                const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';
                const teamId = typeof payload.teamId === 'string' ? payload.teamId.trim() : '';
                if (sessionId === '' || teamId === '') {
                    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: 'sessionId and teamId are required' }));
                    return;
                }
                const captain = ctx.agents.get(sessionId);
                if (captain === undefined) {
                    res.writeHead(409, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: 'captain session is not attached' }));
                    return;
                }
                const workspace = captain.session.header.cwd ?? process.cwd();
                const stateRoot = join(workspace, resolved.stateDir);
                const team = await findTeamByCaptain(stateRoot, captain.id);
                if (team === undefined || team.id !== teamId) {
                    res.writeHead(404, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: 'team not found for this captain' }));
                    return;
                }
                try {
                    const result = await haltTeamWork({
                        ctx,
                        stateRoot,
                        teamId,
                        captain,
                    });
                    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify(result));
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: halt failed for ${teamId}: ${String(error)}`);
                    res.writeHead(500, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: 'failed to stop the team' }));
                }
            },
        }), 'deers-agent-team: halt route');
        // Shared captain+team resolution for the panel operation routes below.
        const resolveCaptainTeam = async (sessionId, teamId) => {
            const captain = ctx.agents.get(sessionId);
            if (captain === undefined)
                return { ok: false, status: 409, error: 'captain session is not attached' };
            const stateRoot = join(captain.session.header.cwd ?? process.cwd(), resolved.stateDir);
            const team = await findTeamByCaptain(stateRoot, captain.id);
            if (team === undefined || team.id !== teamId)
                return { ok: false, status: 404, error: 'team not found for this captain' };
            return { ok: true, captain, stateRoot };
        };
        const writeJson = (res, status, body) => {
            res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
            res.end(JSON.stringify(body));
        };
        const capText = (value, max = 2000) => value === undefined ? undefined : value.length > max ? `${value.slice(0, max)}…` : value;
        // Panel task operations: cancel / reassign / redispatch.
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/task-op',
            handler: async (req, res) => {
                if (req.method !== 'POST') {
                    res.writeHead(405, { allow: 'POST', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                let payload;
                try {
                    payload = await readJsonRequest(req);
                }
                catch (error) {
                    writeJson(res, error instanceof RequestBodyError ? error.status : 400, { error: error instanceof Error ? error.message : 'invalid request body' });
                    return;
                }
                const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';
                const teamId = typeof payload.teamId === 'string' ? payload.teamId.trim() : '';
                const taskId = typeof payload.taskId === 'string' ? payload.taskId.trim() : '';
                const op = typeof payload.op === 'string' ? payload.op.trim() : '';
                const assignee = typeof payload.assignee === 'string' ? payload.assignee : undefined;
                if (sessionId === '' || teamId === '' || taskId === '' || !['cancel', 'reassign', 'redispatch'].includes(op)) {
                    writeJson(res, 400, { error: 'sessionId, teamId, taskId and a valid op are required' });
                    return;
                }
                const resolvedTeam = await resolveCaptainTeam(sessionId, teamId);
                if (!resolvedTeam.ok) {
                    writeJson(res, resolvedTeam.status, { error: resolvedTeam.error });
                    return;
                }
                try {
                    const result = await agentTeamsRuntime.runTaskOperation(resolvedTeam.captain, teamId, taskId, op, assignee);
                    writeJson(res, 200, result);
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: panel task-op ${op} failed for ${teamId}/${taskId}: ${String(error)}`);
                    writeJson(res, 409, { error: error instanceof Error ? error.message : 'task operation failed' });
                }
            },
        }), 'deers-agent-team: task-op route');
        // Panel mailbox read: one recipient's non-discarded messages, oldest first.
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/mail',
            handler: async (req, res) => {
                if (req.method !== 'GET') {
                    res.writeHead(405, { allow: 'GET', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                const url = new URL(req.url ?? '/', 'http://x');
                const sessionId = url.searchParams.get('sessionId')?.trim() ?? '';
                const teamId = url.searchParams.get('teamId')?.trim() ?? '';
                const member = url.searchParams.get('member')?.trim() ?? '';
                if (sessionId === '' || teamId === '' || member === '') {
                    writeJson(res, 400, { error: 'sessionId, teamId and member are required' });
                    return;
                }
                const resolvedTeam = await resolveCaptainTeam(sessionId, teamId);
                if (!resolvedTeam.ok) {
                    writeJson(res, resolvedTeam.status, { error: resolvedTeam.error });
                    return;
                }
                try {
                    const team = await readTeam(resolvedTeam.stateRoot, teamId);
                    if (team === undefined) {
                        writeJson(res, 404, { error: 'team not found' });
                        return;
                    }
                    const recipient = member === 'captain'
                        ? team.captainSessionId !== resolvedTeam.captain.id ? undefined : 'captain'
                        : team.members.some(item => item.name === member && item.status !== 'removed') ? member : undefined;
                    if (recipient === undefined) {
                        writeJson(res, 404, { error: 'recipient not found in this team' });
                        return;
                    }
                    const messages = (await readMailbox(resolvedTeam.stateRoot, teamId, recipient))
                        .filter(message => message.discardedAt === undefined)
                        .slice(-200)
                        .map(message => ({
                        id: message.id,
                        from: message.from,
                        to: message.to,
                        ts: message.ts,
                        content: capText(message.content, 4000) ?? '',
                        ...message.readAt !== undefined ? { readAt: message.readAt } : {},
                        ...message.deliveredAt !== undefined ? { deliveredAt: message.deliveredAt } : {},
                        ...message.sourceTaskId !== undefined ? { sourceTaskId: message.sourceTaskId } : {},
                    }));
                    writeJson(res, 200, { messages });
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: mail read failed for ${teamId}/${member}: ${String(error)}`);
                    writeJson(res, 500, { error: 'failed to read the mailbox' });
                }
            },
        }), 'deers-agent-team: mail route');
        // Panel: send one captain-authored mailbox message (and wake the member).
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/message',
            handler: async (req, res) => {
                if (req.method !== 'POST') {
                    res.writeHead(405, { allow: 'POST', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                let payload;
                try {
                    payload = await readJsonRequest(req);
                }
                catch (error) {
                    writeJson(res, error instanceof RequestBodyError ? error.status : 400, { error: error instanceof Error ? error.message : 'invalid request body' });
                    return;
                }
                const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';
                const teamId = typeof payload.teamId === 'string' ? payload.teamId.trim() : '';
                const to = typeof payload.to === 'string' ? payload.to.trim() : '';
                const content = typeof payload.content === 'string' ? payload.content : '';
                if (sessionId === '' || teamId === '' || to === '' || content.trim() === '') {
                    writeJson(res, 400, { error: 'sessionId, teamId, to and content are required' });
                    return;
                }
                const resolvedTeam = await resolveCaptainTeam(sessionId, teamId);
                if (!resolvedTeam.ok) {
                    writeJson(res, resolvedTeam.status, { error: resolvedTeam.error });
                    return;
                }
                try {
                    const result = await agentTeamsRuntime.sendCaptainMailboxMessage(resolvedTeam.captain, teamId, to, content);
                    writeJson(res, 200, result);
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: panel message failed for ${teamId}/${to}: ${String(error)}`);
                    writeJson(res, 409, { error: error instanceof Error ? error.message : 'failed to send the message' });
                }
            },
        }), 'deers-agent-team: message route');
        // Panel blackboard: read the whole shared board for the human viewer.
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/blackboard',
            handler: async (req, res) => {
                const url = new URL(req.url ?? '/', 'http://x');
                const sessionId = url.searchParams.get('sessionId')?.trim() ?? '';
                const teamId = url.searchParams.get('teamId')?.trim() ?? '';
                if (teamId === '') {
                    writeJson(res, 400, { error: 'teamId is required' });
                    return;
                }
                if (req.method === 'GET') {
                    // Read-only viewing must work even when the captain agent is cold or
                    // archived: scan the registered workspaces instead of requiring a
                    // live captain session.
                    try {
                        for (const workspace of workspaceRegistry.list()) {
                            const stateRoot = join(workspace.path, resolved.stateDir);
                            const team = await readTeam(stateRoot, teamId).catch(() => undefined)
                                ?? await readArchivedTeam(stateRoot, teamId).catch(() => undefined);
                            if (team === undefined)
                                continue;
                            const board = blackboardOf(team);
                            const cleanup = resolved.blackboardCleanup ?? { ...DEFAULT_BLACKBOARD_CLEANUP, intervalMs: 60 * 60 * 1000 };
                            writeJson(res, 200, {
                                seq: board.seq,
                                lastCleanupAt: board.lastCleanupAt,
                                cleanup: {
                                    enabled: cleanup.enabled,
                                    retentionDays: cleanup.retentionDays,
                                    keepLatest: cleanup.keepLatest,
                                    keepPinned: cleanup.keepPinned,
                                    keepDecisions: cleanup.keepDecisions,
                                },
                                entries: board.entries.map(entry => ({
                                    id: entry.id,
                                    author: entry.author,
                                    kind: entry.kind,
                                    content: capText(entry.content, 4000) ?? '',
                                    createdAt: entry.createdAt,
                                    pinned: entry.pinned === true,
                                    votes: entry.votes ?? {},
                                })),
                            });
                            return;
                        }
                        writeJson(res, 404, { error: 'team not found' });
                    }
                    catch (error) {
                        ctx.logger.warn(`deers-agent-team: blackboard read failed for ${teamId}: ${String(error)}`);
                        writeJson(res, 500, { error: 'failed to read the blackboard' });
                    }
                    return;
                }
                if (req.method !== 'POST') {
                    res.writeHead(405, { allow: 'GET, POST', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                if (sessionId === '') {
                    writeJson(res, 400, { error: 'sessionId is required' });
                    return;
                }
                let payload;
                try {
                    payload = await readJsonRequest(req);
                }
                catch (error) {
                    writeJson(res, error instanceof RequestBodyError ? error.status : 400, { error: error instanceof Error ? error.message : 'invalid request body' });
                    return;
                }
                const resolvedTeam = await resolveCaptainTeam(sessionId, teamId);
                if (!resolvedTeam.ok) {
                    writeJson(res, resolvedTeam.status, { error: resolvedTeam.error });
                    return;
                }
                const cleanupPolicy = resolved.blackboardCleanup ?? { ...DEFAULT_BLACKBOARD_CLEANUP, intervalMs: 60 * 60 * 1000 };
                try {
                    if (payload.action === 'cleanup') {
                        // Manual cleanup works even when the periodic policy is disabled.
                        const result = await cleanupTeamBlackboard(resolvedTeam.stateRoot, teamId, { ...cleanupPolicy, enabled: true });
                        writeJson(res, 200, result);
                        return;
                    }
                    if (payload.action !== 'vote') {
                        const content = typeof payload.content === 'string' ? payload.content : '';
                        const kind = typeof payload.kind === 'string' ? payload.kind : undefined;
                        if (content.trim() === '') {
                            writeJson(res, 400, { error: 'content is required' });
                            return;
                        }
                        const result = await agentTeamsRuntime.postCaptainBlackboardEntry(resolvedTeam.captain, teamId, {
                            content,
                            kind,
                            pinned: payload.pinned === true,
                        });
                        void cleanupTeamBlackboard(resolvedTeam.stateRoot, teamId, cleanupPolicy).catch(() => undefined);
                        writeJson(res, 200, result);
                        return;
                    }
                    const entryId = typeof payload.entryId === 'string' ? payload.entryId.trim() : '';
                    const vote = payload.vote === 'up' || payload.vote === 'down' || payload.vote === 'clear' ? payload.vote : '';
                    if (entryId === '' || vote === '') {
                        writeJson(res, 400, { error: 'entryId and vote (up/down/clear) are required' });
                        return;
                    }
                    const result = await agentTeamsRuntime.voteCaptainBlackboardEntry(resolvedTeam.captain, teamId, entryId, vote);
                    void cleanupTeamBlackboard(resolvedTeam.stateRoot, teamId, cleanupPolicy).catch(() => undefined);
                    writeJson(res, 200, result);
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: blackboard request failed for ${teamId}: ${String(error)}`);
                    writeJson(res, 409, { error: error instanceof Error ? error.message : 'blackboard request failed' });
                }
            },
        }), 'deers-agent-team: blackboard route');
        // Panel polls: captain-created single/multi-choice votes the human joins.
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/polls',
            handler: async (req, res) => {
                const url = new URL(req.url ?? '/', 'http://x');
                const sessionId = url.searchParams.get('sessionId')?.trim() ?? '';
                const teamId = url.searchParams.get('teamId')?.trim() ?? '';
                if (teamId === '') {
                    writeJson(res, 400, { error: 'teamId is required' });
                    return;
                }
                if (req.method === 'GET') {
                    try {
                        for (const workspace of workspaceRegistry.list()) {
                            const stateRoot = join(workspace.path, resolved.stateDir);
                            const team = await readTeam(stateRoot, teamId).catch(() => undefined)
                                ?? await readArchivedTeam(stateRoot, teamId).catch(() => undefined);
                            if (team === undefined)
                                continue;
                            const { rows, total } = readPolls(team, { viewer: 'captain', now: Date.now() });
                            writeJson(res, 200, { total, polls: rows });
                            return;
                        }
                        writeJson(res, 404, { error: 'team not found' });
                    }
                    catch (error) {
                        ctx.logger.warn(`deers-agent-team: poll read failed for ${teamId}: ${String(error)}`);
                        writeJson(res, 500, { error: 'failed to read polls' });
                    }
                    return;
                }
                if (req.method !== 'POST') {
                    res.writeHead(405, { allow: 'GET, POST', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                if (sessionId === '') {
                    writeJson(res, 400, { error: 'sessionId is required' });
                    return;
                }
                let payload;
                try {
                    payload = await readJsonRequest(req);
                }
                catch (error) {
                    writeJson(res, error instanceof RequestBodyError ? error.status : 400, { error: error instanceof Error ? error.message : 'invalid request body' });
                    return;
                }
                const resolvedTeam = await resolveCaptainTeam(sessionId, teamId);
                if (!resolvedTeam.ok) {
                    writeJson(res, resolvedTeam.status, { error: resolvedTeam.error });
                    return;
                }
                try {
                    const action = typeof payload.action === 'string' ? payload.action : '';
                    if (action === 'create') {
                        const options = Array.isArray(payload.options)
                            ? payload.options.filter((option) => typeof option === 'string')
                            : [];
                        const result = await agentTeamsRuntime.createCaptainPoll(resolvedTeam.captain, teamId, {
                            title: typeof payload.title === 'string' ? payload.title : '',
                            description: typeof payload.description === 'string' ? payload.description : undefined,
                            options,
                            multiSelect: payload.multiSelect === true,
                            maxSelections: typeof payload.maxSelections === 'number' ? payload.maxSelections : undefined,
                            thresholdRule: payload.thresholdRule === 'gt' || payload.thresholdRule === 'percent' || payload.thresholdRule === 'majority'
                                ? payload.thresholdRule
                                : undefined,
                            thresholdValue: typeof payload.thresholdValue === 'number' ? payload.thresholdValue : undefined,
                            quorum: typeof payload.quorum === 'number' ? payload.quorum : undefined,
                            anonymous: payload.anonymous === true,
                            durationMinutes: typeof payload.durationMinutes === 'number' ? payload.durationMinutes : undefined,
                        });
                        writeJson(res, 200, result);
                        return;
                    }
                    const pollId = typeof payload.pollId === 'string' ? payload.pollId.trim() : '';
                    if (pollId === '') {
                        writeJson(res, 400, { error: 'pollId is required' });
                        return;
                    }
                    if (action === 'vote') {
                        const optionIds = Array.isArray(payload.optionIds)
                            ? payload.optionIds.filter((option) => typeof option === 'string')
                            : [];
                        const result = await agentTeamsRuntime.castCaptainPollVote(resolvedTeam.captain, teamId, pollId, optionIds);
                        writeJson(res, 200, result);
                        return;
                    }
                    if (action === 'close') {
                        const result = await agentTeamsRuntime.closeCaptainPoll(resolvedTeam.captain, teamId, pollId);
                        writeJson(res, 200, result);
                        return;
                    }
                    writeJson(res, 400, { error: 'action must be create, vote or close' });
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: poll request failed for ${teamId}: ${String(error)}`);
                    writeJson(res, 409, { error: error instanceof Error ? error.message : 'poll request failed' });
                }
            },
        }), 'deers-agent-team: polls route');
        // Panel task history: durable attempt evidence, revisions, supplemental notes.
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/history',
            handler: async (req, res) => {
                if (req.method !== 'GET') {
                    res.writeHead(405, { allow: 'GET', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                const url = new URL(req.url ?? '/', 'http://x');
                const sessionId = url.searchParams.get('sessionId')?.trim() ?? '';
                const teamId = url.searchParams.get('teamId')?.trim() ?? '';
                const taskId = url.searchParams.get('taskId')?.trim() ?? '';
                if (sessionId === '' || teamId === '' || taskId === '') {
                    writeJson(res, 400, { error: 'sessionId, teamId and taskId are required' });
                    return;
                }
                const resolvedTeam = await resolveCaptainTeam(sessionId, teamId);
                if (!resolvedTeam.ok) {
                    writeJson(res, resolvedTeam.status, { error: resolvedTeam.error });
                    return;
                }
                try {
                    const team = await readTeam(resolvedTeam.stateRoot, teamId);
                    const task = team?.tasks.find(item => item.id === taskId);
                    if (team === undefined || task === undefined) {
                        writeJson(res, 404, { error: 'task not found' });
                        return;
                    }
                    writeJson(res, 200, {
                        taskId: task.id,
                        attempt: task.attempt ?? 0,
                        status: task.status,
                        output: capText(task.output),
                        revisions: (task.revisions ?? []).map(revision => ({
                            at: revision.at,
                            by: revision.by,
                            reason: capText(revision.reason, 300) ?? '',
                            fields: revision.fields ?? [],
                        })),
                        supplementalEvidence: (task.supplementalEvidence ?? []).map(item => ({
                            at: item.at,
                            by: item.by,
                            attempt: item.attempt,
                            note: capText(item.note, 1200) ?? '',
                        })),
                        findings: (task.findings ?? []).map(finding => ({
                            id: finding.id,
                            severity: finding.severity,
                            problem: capText(finding.problem, 400) ?? '',
                            resolved: finding.resolved === true,
                        })),
                    });
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: history read failed for ${teamId}/${taskId}: ${String(error)}`);
                    writeJson(res, 500, { error: 'failed to read the task history' });
                }
            },
        }), 'deers-agent-team: history route');
        // Panel activity timeline: derived from durable state (members, tasks, mailboxes).
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/timeline',
            handler: async (req, res) => {
                if (req.method !== 'GET') {
                    res.writeHead(405, { allow: 'GET', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                const url = new URL(req.url ?? '/', 'http://x');
                const sessionId = url.searchParams.get('sessionId')?.trim() ?? '';
                const teamId = url.searchParams.get('teamId')?.trim() ?? '';
                if (sessionId === '' || teamId === '') {
                    writeJson(res, 400, { error: 'sessionId and teamId are required' });
                    return;
                }
                const resolvedTeam = await resolveCaptainTeam(sessionId, teamId);
                if (!resolvedTeam.ok) {
                    writeJson(res, resolvedTeam.status, { error: resolvedTeam.error });
                    return;
                }
                try {
                    const team = await readTeam(resolvedTeam.stateRoot, teamId);
                    if (team === undefined) {
                        writeJson(res, 404, { error: 'team not found' });
                        return;
                    }
                    const entries = [];
                    for (const member of team.members) {
                        entries.push({ ts: member.joinedAt, kind: 'member-joined', name: member.name });
                    }
                    for (const task of team.tasks) {
                        entries.push({ ts: task.createdAt, kind: 'task-created', taskId: task.id, subject: task.subject, assignee: task.assignee ?? '' });
                        entries.push({ ts: task.updatedAt, kind: 'task-status', taskId: task.id, status: task.status, attempt: task.attempt ?? 0 });
                    }
                    const boxes = ['captain', ...team.members.filter(member => member.status !== 'removed').map(member => member.name)];
                    for (const box of boxes) {
                        try {
                            for (const message of await readMailbox(resolvedTeam.stateRoot, teamId, box)) {
                                if (message.discardedAt !== undefined)
                                    continue;
                                entries.push({ ts: message.ts, kind: 'message', from: message.from, to: message.to, messageId: message.id });
                            }
                        }
                        catch { /* one unreadable mailbox must not kill the timeline */ }
                    }
                    entries.sort((a, b) => b.ts - a.ts);
                    writeJson(res, 200, { entries: entries.slice(0, 300) });
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: timeline failed for ${teamId}: ${String(error)}`);
                    writeJson(res, 500, { error: 'failed to build the timeline' });
                }
            },
        }), 'deers-agent-team: timeline route');
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/deers-dsh-agent-team/plan',
            handler: async (req, res) => {
                if (req.method !== 'POST') {
                    res.writeHead(405, { allow: 'POST', 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                let payload;
                try {
                    payload = await readJsonRequest(req);
                }
                catch (error) {
                    res.writeHead(error instanceof RequestBodyError ? error.status : 400, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'invalid request body' }));
                    return;
                }
                const sessionId = typeof payload['sessionId'] === 'string' ? payload['sessionId'].trim() : '';
                const teamId = typeof payload['teamId'] === 'string' ? payload['teamId'].trim() : '';
                const action = typeof payload['action'] === 'string' ? payload['action'] : '';
                if (sessionId === '' || teamId === '' || action === '') {
                    res.writeHead(400, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: 'sessionId, teamId, and action are required' }));
                    return;
                }
                const captain = ctx.agents.get(sessionId);
                if (captain === undefined) {
                    res.writeHead(409, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: 'captain session is not attached' }));
                    return;
                }
                const workspace = captain.session.header.cwd ?? process.cwd();
                const stateRoot = join(workspace, resolved.stateDir);
                const team = await findTeamByCaptain(stateRoot, captain.id);
                if (team === undefined || team.id !== teamId) {
                    res.writeHead(404, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: 'team not found for this captain' }));
                    return;
                }
                try {
                    if (action === 'approve') {
                        const approved = await agentTeamsRuntime.approveStagedTeam(captain, teamId);
                        // The browser receives the HTTP result, so the model needs its own
                        // control message. steer wakes an idle captain or joins its next
                        // step; the tool approve path already returns to the model itself.
                        try {
                            captain.steer(createUserMessage({
                                content: [{ type: 'text', text: stagedPlanApprovedContext(team.name) }],
                                source: { kind: 'deers-agent-team' },
                            }));
                        }
                        catch (error) {
                            // Approval is already committed. Do not report a failed approval
                            // and invite a retry that could duplicate the user's action.
                            ctx.logger.warn(`deers-agent-team: approval notification failed for ${teamId}: ${String(error)}`);
                        }
                        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                        res.end(JSON.stringify({ ok: true, phase: 'running', ...approved }));
                        return;
                    }
                    if (action === 'continue') {
                        const continued = await agentTeamsRuntime.continueStagedPlanning(captain, teamId);
                        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                        res.end(JSON.stringify({ ok: true, phase: 'staged', review: 'awaiting_feedback', ...continued }));
                        return;
                    }
                    if (action === 'discard') {
                        const discarded = await agentTeamsRuntime.discardStagedTeam(captain, teamId);
                        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                        res.end(JSON.stringify({ ok: true, phase: 'archived', ...discarded }));
                        return;
                    }
                    const dependencies = Array.isArray(payload['dependencies'])
                        ? payload['dependencies'].filter((item) => typeof item === 'string')
                        : [];
                    let mutation;
                    if (action === 'update_member') {
                        if (typeof payload['memberName'] !== 'string'
                            || typeof payload['provider'] !== 'string'
                            || typeof payload['model'] !== 'string')
                            throw new Error('memberName, provider, and model are required');
                        mutation = {
                            action,
                            memberName: payload['memberName'],
                            provider: payload['provider'],
                            model: payload['model'],
                            ...typeof payload['role'] === 'string' || payload['role'] === null ? { role: payload['role'] } : {},
                            ...typeof payload['reasoningEffort'] === 'string' || payload['reasoningEffort'] === null
                                ? { reasoningEffort: payload['reasoningEffort'] }
                                : {},
                            ...typeof payload['executionPrompt'] === 'string' || payload['executionPrompt'] === null
                                ? { executionPrompt: payload['executionPrompt'] }
                                : {},
                        };
                    }
                    else if (action === 'update_task') {
                        if (typeof payload['taskId'] !== 'string' || typeof payload['subject'] !== 'string') {
                            throw new Error('taskId and subject are required');
                        }
                        mutation = {
                            action,
                            taskId: payload['taskId'],
                            subject: payload['subject'],
                            dependencies,
                            ...typeof payload['description'] === 'string' || payload['description'] === null
                                ? { description: payload['description'] }
                                : {},
                            ...typeof payload['assignee'] === 'string' || payload['assignee'] === null
                                ? { assignee: payload['assignee'] }
                                : {},
                        };
                    }
                    else if (action === 'add_task') {
                        if (typeof payload['subject'] !== 'string')
                            throw new Error('subject is required');
                        mutation = {
                            action,
                            subject: payload['subject'],
                            dependencies,
                            ...typeof payload['description'] === 'string' || payload['description'] === null
                                ? { description: payload['description'] }
                                : {},
                            ...typeof payload['assignee'] === 'string' || payload['assignee'] === null
                                ? { assignee: payload['assignee'] }
                                : {},
                        };
                    }
                    else if (action === 'remove_task') {
                        if (typeof payload['taskId'] !== 'string')
                            throw new Error('taskId is required');
                        mutation = { action, taskId: payload['taskId'] };
                    }
                    else {
                        throw new Error(`unknown plan action "${action}"`);
                    }
                    const updated = await agentTeamsRuntime.updateStagedPlan(captain, teamId, mutation);
                    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ ok: true, phase: updated.phase, members: updated.members.length, tasks: updated.tasks.length }));
                }
                catch (error) {
                    res.writeHead(409, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'plan operation failed' }));
                }
            },
        }), 'deers-agent-team: plan route');
        // Deer, panda and cat character artwork: serve the packaged illustrations to
        // the activity panel. An explicit allowlist guards the route (no path
        // traversal); the images ship with the bundle (files: assets/).
        const artDir = fileURLToPath(new URL('../assets/deers-agent-team/', import.meta.url));
        const ART_ALLOWLIST = new Set([
            'deer-full.webp', 'deer-paper.webp', 'deer-sticker.png',
            'panda-full.webp', 'panda-paper.webp', 'panda-sticker.png',
            'cat-full.webp', 'cat-paper.png', 'cat-sticker.png',
        ]);
        ctx.effect(() => webServer.register({
            kind: 'prefix',
            path: '/plugins/deers-dsh-agent-team/assets',
            handler: async (req, res) => {
                let name;
                try {
                    name = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname.split('/').pop() ?? '');
                }
                catch {
                    // Malformed percent-encoding: treat as an unknown asset, not a 400.
                    res.writeHead(404);
                    res.end();
                    return;
                }
                if (!ART_ALLOWLIST.has(name)) {
                    res.writeHead(404);
                    res.end();
                    return;
                }
                try {
                    const data = await readFile(join(artDir, name));
                    res.writeHead(200, {
                        'content-type': 'image/png',
                        'cache-control': 'public, max-age=86400',
                    });
                    res.end(data);
                }
                catch (error) {
                    ctx.logger.warn(`deers-agent-team: artwork read failed for ${name}: ${String(error)}`);
                    res.writeHead(404);
                    res.end();
                }
            },
        }), 'deers-agent-team: artwork route');
        // Standalone operations panel (spec: M0-T7): team list, Mermaid task DAG,
        // and staged-phase member dossier editing. Registered on the same
        // authentication-fenced web server wrapper as the routes above.
        ctx.effect(() => registerUiRoutes(webServer, {
            ctx,
            stateDir: resolved.stateDir,
            workspaces: () => workspaceRegistry.list().map((workspace) => ({ title: workspace.title, path: workspace.path })),
        }), 'deers-agent-team: ui routes');
    };
    registerWebSurface();
    ctx.on('internal/service', (name) => {
        if (WEB_SERVER_KEYS.includes(name)
            || WORKSPACE_KEYS.includes(name)) {
            registerWebSurface();
        }
    });
}
