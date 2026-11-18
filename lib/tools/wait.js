/**
 * `deers_team_wait` — durable wait for team progress (spec §11.1).
 *
 * Captains should yield their turn while members work instead of busy-polling
 * `deers_team_status`. This tool parks the calling turn until the durable team
 * record (or any member mailbox) changes, or the wait window expires — the
 * file-level equivalent of the official `wait_agent`, named `deers_team_wait`
 * so it cannot collide with the still-mounted official stack.
 *
 * The change detector polls a change token every 500 ms: a token is the exact
 * `team.json` content plus one `name:size:mtime` row per `inbox/*.jsonl`
 * mailbox file. That covers every durable progress signal (task updates,
 * member status changes, message arrival) without an fs.watch handle, and it
 * degrades to a plain no-op when nothing was written.
 *
 * @module deers-dsh-agent-team/tools/wait
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { readTeam } from "../state.js";
/** Default wait window when `timeoutMs` is omitted. */
export const DEFAULT_WAIT_TIMEOUT_MS = 30_000;
/** Poll cadence for the change token. */
export const WAIT_POLL_INTERVAL_MS = 500;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isEnoent(error) {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
/**
 * The durable change token for one team: `undefined` when the team record is
 * absent (team ended or never existed), otherwise the exact `team.json`
 * content plus mailbox file stats.
 */
export async function teamChangeToken(stateRoot, teamId) {
    let raw;
    try {
        raw = await readFile(join(stateRoot, teamId, 'team.json'), 'utf8');
    }
    catch (error) {
        if (isEnoent(error))
            return undefined;
        throw error;
    }
    const inboxDir = join(stateRoot, teamId, 'inbox');
    let mail;
    try {
        const entries = await readdir(inboxDir, { withFileTypes: true });
        const rows = await Promise.all(entries
            .filter((entry) => entry.isFile())
            .map(async (entry) => {
            const info = await stat(join(inboxDir, entry.name));
            return `${entry.name}:${info.size}:${info.mtimeMs}`;
        }));
        mail = rows.sort();
    }
    catch (error) {
        if (isEnoent(error))
            mail = [];
        else
            throw error;
    }
    return JSON.stringify({ team: raw, mail });
}
/**
 * Wait until the team's durable state changes or the window closes.
 *
 * The team disappearing mid-wait counts as a change (the team ended). A
 * missing team at call time is a caller error, not a wait outcome. An aborted
 * signal ends the wait as `timedOut` — the wait produced no usable change.
 */
export async function waitForTeamChange(stateRoot, teamId, timeoutMs, options = {}) {
    const pollIntervalMs = Math.max(25, options.pollIntervalMs ?? WAIT_POLL_INTERVAL_MS);
    const baseline = await teamChangeToken(stateRoot, teamId);
    if (baseline === undefined)
        throw new Error(`team "${teamId}" is no longer active`);
    const deadline = Date.now() + Math.max(0, timeoutMs);
    for (;;) {
        if (options.signal?.aborted === true)
            return { changed: false, timedOut: true };
        const remaining = deadline - Date.now();
        if (remaining <= 0)
            return { changed: false, timedOut: true };
        await sleep(Math.min(pollIntervalMs, remaining));
        const current = await teamChangeToken(stateRoot, teamId);
        // `undefined` means the team record vanished (archived/deleted): a change.
        if (current === undefined || current !== baseline)
            return { changed: true, timedOut: false };
    }
}
/** The calling agent, or a loud failure for non-agent callers. */
function requireCaptain(exec) {
    if (!exec.agent) {
        throw new Error('deers_team tools require a calling agent (exec.agent was undefined)');
    }
    return exec.agent;
}
/**
 * Build the `deers_team_wait` tool definition.
 * @param ctx - the plugin context (used for diagnostics only).
 * @param config - resolved tool config (supplies the `stateDir`).
 */
export function createWaitTool(ctx, config) {
    void ctx;
    return defineTool({
        name: 'deers_team_wait',
        description: `Durable wait: park until the team's durable state changes (task updates, member status changes, mailbox delivery) or the window expires, instead of busy-polling deers_team_status. Returns { changed, timedOut }. Default window ${DEFAULT_WAIT_TIMEOUT_MS} ms; a changed result means your snapshot is stale, so call deers_team_status once afterwards. A missing team fails loudly; a team that ends during the wait counts as changed.`,
        parameters: {
            teamId: { type: 'string', required: true, description: 'Stable id of the caller\'s own team (the team directory under the state dir).' },
            timeoutMs: { type: 'number', description: `Maximum time to wait in milliseconds (default ${DEFAULT_WAIT_TIMEOUT_MS}).` },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    changed: { type: 'boolean', required: true },
                    timedOut: { type: 'boolean', required: true },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: value.changed
                        ? 'Team state changed during the wait — refresh with deers_team_status before coordinating further.'
                        : 'No team change within the wait window; your current snapshot is still fresh.',
                }],
        },
        async execute(args, exec) {
            const caller = requireCaptain(exec);
            const workspace = caller.session.header.cwd ?? process.cwd();
            const stateRoot = join(workspace, config.stateDir);
            const teamId = args.teamId.trim();
            if (teamId === '')
                throw new Error('teamId must not be empty');
            // Authorization mirrors the participant model: only the captain or an
            // active member may park on their own team's state.
            const team = await readTeam(stateRoot, teamId);
            if (team === undefined)
                throw new Error(`team "${teamId}" is no longer active`);
            const participant = team.captainSessionId === caller.id
                || team.members.some((member) => member.id === caller.id && member.status !== 'removed');
            if (!participant)
                throw new Error(`you do not lead or belong to team "${teamId}"`);
            return await waitForTeamChange(stateRoot, teamId, args.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS, {
                signal: exec.signal,
            });
        },
    });
}
