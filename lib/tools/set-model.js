/**
 * `deers_team_set_model` — post-creation member model-route editing
 * (design spec §9.2).
 *
 * The route hierarchy is member explicit route > team default route
 * (`team.defaultRoute`, snapshotted from the captain's current route at
 * approval, spec §9.3) > the captain's current route. This tool writes the
 * member override layer once the team is approved; a staged roster is edited
 * through `deers_team_edit_member` instead and fails here with the
 * `TEAM_NOT_ACTIVE` reason code.
 *
 * Durability follows the plugin's existing mid-life route contract: a spawned
 * member's primary `provider`/`model` stay frozen to the subagent descriptor
 * (the cold-resume setup guard compares them), so a captain override rides the
 * same `activeProvider`/`activeModel` fields the fallback machinery uses and
 * is read back from `team.json` on the member's next composition —
 * `effectiveMemberRoute` resolves the hierarchy for every turn. A route equal
 * to the team default clears the override instead of storing one, returning
 * the member to its inherited route. Never-spawned members (no descriptor
 * yet) take the route on their primary fields, matching staged-phase editing.
 *
 * @module deers-dsh-agent-team/tools/set-model
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { join } from 'node:path';
import { effectiveMemberRoute, resolveMemberLlmSelection } from "../members.js";
import { readTeam, withTeamLock, writeTeam } from "../state.js";
/** The calling agent, or a loud failure for non-agent callers. */
function requireCaptain(exec) {
    if (!exec.agent) {
        throw new Error('deers_team tools require a calling agent (exec.agent was undefined)');
    }
    return exec.agent;
}
/** The captain's workspace directory (team state root parent). */
function workspaceOf(agent) {
    return agent.session.header.cwd ?? process.cwd();
}
/** Process-local lock key scoped by workspace state root and team id. */
function teamLockKey(stateRoot, teamId) {
    return `team:${stateRoot}:${teamId}`;
}
/** Trim a string patch field; blank input is treated as absent. */
function trimmed(value) {
    const result = value?.trim();
    return result === '' ? undefined : result;
}
/** Whether two resolved routes are the same provider, model, and effort. */
function routesEqual(a, b) {
    return a.provider === b.provider && a.model === b.model && a.reasoningEffort === b.reasoningEffort;
}
/** Apply one resolved route override to the member's durable record. */
function applyResolvedRoute(target, resolved) {
    if (target.id === '') {
        // Never-spawned members carry no subagent descriptor yet: take the route
        // on the primary fields, like staged-phase dossier editing does.
        target.provider = resolved.provider;
        target.model = resolved.model;
        target.reasoningEffort = resolved.reasoningEffort;
        delete target.activeProvider;
        delete target.activeModel;
        target.fallbackActive = false;
        return;
    }
    // Spawned members keep provider/model descriptor-frozen (the cold-resume
    // guard compares them against the subagent descriptor); mid-life overrides
    // ride the same active* fields the fallback machinery drives.
    target.activeProvider = resolved.provider;
    target.activeModel = resolved.model;
    target.fallbackActive = false;
    // A changed route resolves its own default effort: drop the stale one
    // instead of applying the old model's effort id to the new route.
    if (resolved.reasoningEffort === undefined)
        delete target.reasoningEffort;
    else
        target.reasoningEffort = resolved.reasoningEffort;
}
/** Clear the post-creation override so the member inherits again. */
function clearRouteOverride(target, defaultRoute) {
    delete target.activeProvider;
    delete target.activeModel;
    target.fallbackActive = false;
    // When the approved route is the inherited team default, restoring the
    // default effort undoes any effort an earlier override had left behind.
    if (target.provider === defaultRoute.provider && target.model === defaultRoute.model) {
        if (defaultRoute.reasoningEffort === undefined)
            delete target.reasoningEffort;
        else
            target.reasoningEffort = defaultRoute.reasoningEffort;
    }
}
/**
 * Build the `deers_team_set_model` tool definition.
 * @param ctx - the plugin context (injects `llm` for route resolution).
 * @param config - resolved tool config (supplies the `stateDir`).
 * @returns a registry-ready tool definition.
 */
export function createSetModelTool(ctx, config) {
    return defineTool({
        name: 'deers_team_set_model',
        description: 'Change one member\'s LLM model route after the team is approved (active phase). The route resolves through the same member selection path as member creation (unknown routes fail loudly) and is persisted to team.json; the change takes effect on the member\'s next turn through the mid-life route machinery. A route equal to the team default route (snapshotted from the captain at approval) clears the member\'s post-creation override instead of storing one. Staged teams must use deers_team_edit_member — calls fail with TEAM_NOT_ACTIVE.',
        parameters: {
            teamId: { type: 'string', required: true, description: 'Stable id of the caller\'s own team (the team directory under the state dir).' },
            memberName: { type: 'string', required: true, description: 'Exact member name in the running roster.' },
            route: {
                type: 'object',
                required: true,
                additionalProperties: false,
                description: 'Replacement provider/model route for this member.',
                properties: {
                    provider: { type: 'string', required: true, description: 'LLM provider route name.' },
                    model: { type: 'string', required: true, description: 'Provider-owned model id.' },
                    reasoningEffort: { type: 'string', description: 'Optional reasoning effort override; "default" selects the target model\'s default.' },
                },
            },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    team_id: { type: 'string', required: true },
                    member_name: { type: 'string', required: true },
                    role: { type: 'string' },
                    provider: { type: 'string', required: true, description: 'Effective route provider after the change.' },
                    model: { type: 'string', required: true, description: 'Effective route model after the change.' },
                    reasoning_effort: { type: 'string' },
                    override_active: { type: 'boolean', required: true, description: 'Whether the member now carries a post-creation route override.' },
                    default_route: {
                        type: 'object',
                        additionalProperties: false,
                        description: 'The team default route, when one was snapshotted at approval.',
                        properties: {
                            provider: { type: 'string', required: true },
                            model: { type: 'string', required: true },
                            reasoning_effort: { type: 'string' },
                        },
                    },
                    phase: { type: 'string', required: true },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: `Member "${value.member_name}" of team ${value.team_id} now runs on ${value.provider}/${value.model}`
                        + `${value.reasoning_effort === undefined ? '' : `, effort ${value.reasoning_effort}`}`
                        + (value.override_active
                            ? ' (explicit post-creation override)'
                            : ' (team default hierarchy: no post-creation override)')
                        + `${value.default_route === undefined ? '' : `; team default is ${value.default_route.provider}/${value.default_route.model}`}. `
                        + 'The change is persisted and takes effect on the member\'s next turn.',
                }],
        },
        async execute(args, exec) {
            const captain = requireCaptain(exec);
            const workspace = workspaceOf(captain);
            const stateRoot = join(workspace, config.stateDir);
            const memberName = args.memberName.trim();
            if (memberName === '')
                throw new Error('memberName must be a non-empty member name');
            const provider = trimmed(args.route.provider);
            const model = trimmed(args.route.model);
            if (provider === undefined || model === undefined) {
                throw new Error('route requires a non-empty provider and model');
            }
            const reasoningEffort = trimmed(args.route.reasoningEffort);
            const member = await withTeamLock(teamLockKey(stateRoot, args.teamId), async () => {
                const fresh = await readTeam(stateRoot, args.teamId);
                if (fresh === undefined)
                    throw new Error(`team "${args.teamId}" is no longer active`);
                if (fresh.captainSessionId !== captain.id) {
                    throw new Error(`only the captain of team "${fresh.name}" may perform this operation`);
                }
                if (fresh.phase === 'staged') {
                    throw new Error('TEAM_NOT_ACTIVE: use deers_team_edit_member for staged-phase editing');
                }
                const target = fresh.members.find((candidate) => candidate.name === memberName && candidate.status !== 'removed');
                if (target === undefined) {
                    throw new Error(`no active member named "${memberName}" in team "${fresh.name}"`);
                }
                // Resolve through the same member selection path as member creation,
                // so an invalid route fails loudly before anything is persisted. The
                // member's configured fallback stays armed behind the new route.
                const resolved = await resolveMemberLlmSelection(ctx, captain, {
                    provider,
                    model,
                    reasoningEffort,
                    fallback: target.fallback,
                }, exec.signal);
                const defaultRoute = fresh.defaultRoute;
                if (defaultRoute !== undefined && routesEqual(resolved, defaultRoute)) {
                    clearRouteOverride(target, defaultRoute);
                }
                else {
                    applyResolvedRoute(target, resolved);
                }
                exec.signal.throwIfAborted();
                await writeTeam(stateRoot, fresh);
                return { member: { ...target }, team: fresh };
            });
            const effective = effectiveMemberRoute(member.member, member.team.defaultRoute);
            const defaultRoute = member.team.defaultRoute;
            return {
                team_id: member.team.id,
                member_name: member.member.name,
                ...member.member.role === undefined ? {} : { role: member.member.role },
                provider: effective?.provider ?? '',
                model: effective?.model ?? '',
                ...effective?.reasoningEffort === undefined ? {} : { reasoning_effort: effective.reasoningEffort },
                override_active: member.member.activeProvider !== undefined && member.member.activeModel !== undefined,
                ...defaultRoute === undefined ? {} : {
                    default_route: {
                        provider: defaultRoute.provider,
                        model: defaultRoute.model,
                        ...defaultRoute.reasoningEffort === undefined ? {} : { reasoning_effort: defaultRoute.reasoningEffort },
                    },
                },
                phase: member.team.phase ?? 'running',
            };
        },
    });
}
