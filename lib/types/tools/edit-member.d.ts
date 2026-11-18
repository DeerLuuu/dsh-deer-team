/**
 * `deers_team_edit_member` — granular per-member dossier editing during the
 * staged planning phase (design spec §8).
 *
 * A staged member's dossier is `{ name, persona, description, modelRoute,
 * skills }` (spec §8.1). This tool applies a partial patch to exactly one
 * member of the caller's own team while `team.phase === 'staged'`; after
 * approval the dossier is frozen and every call fails with the `TEAM_FROZEN`
 * reason code. `persona`/`description`/`skills` are stored on the member
 * record for the spawn-time persona injection (spec §10.2, a later M0 task);
 * `modelRoute` resolves through the same member LLM selection path as
 * `deers_team_add_member` / `deers_team_edit_plan`, so an invalid route fails
 * loudly before it can reach a child spawn.
 *
 * `skills[]` entries are validated against the host skill catalog
 * (`ctx.skills`, made visible by the plugin's `'skills'` inject); an unknown
 * name fails with the `UNKNOWN_SKILL` reason code and nothing is persisted.
 *
 * @module deers-dsh-agent-team/tools/edit-member
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { ToolsConfig } from '../tools.ts';
import type { TeamMember } from '../types.ts';
/**
 * Partial member-dossier patch; every field is optional and only present
 * fields are applied. Shared by `deers_team_edit_member` and the Web UI
 * `PATCH /api/deers-agent-team/teams/:id/members/:name` route.
 */
export interface MemberDossierPatch {
    persona?: string;
    description?: string;
    modelRoute?: {
        provider?: string;
        model?: string;
        reasoningEffort?: string;
    };
    skills?: string[];
}
/**
 * Apply one member dossier patch inside the team lock (spec §8).
 *
 * The staged-only, captain-authorized editing path shared by the
 * `deers_team_edit_member` tool (the caller is the live captain agent) and the
 * Web UI PATCH route (the authenticated browser operates on the team's own
 * captain authority; the live captain agent is resolved for route resolution).
 *
 * @param options.ctx - plugin context (skill catalog + llm seam).
 * @param options.workspace - the team's workspace directory (skill catalog cwd).
 * @param options.stateRoot - resolved absolute state root.
 * @param options.teamId - the team's stable id.
 * @param options.memberName - exact member name in the staged roster.
 * @param options.patch - partial dossier patch.
 * @param options.actingSessionId - session id claiming captain authority; must
 *   equal the team's durable `captainSessionId`.
 * @param options.captain - live captain agent; required for `modelRoute`
 *   patches (route resolution reads the captain's session), used as the skill
 *   catalog scope otherwise.
 * @param options.signal - caller cancellation.
 * @returns the updated member snapshot.
 */
export declare function applyMemberDossierPatch(options: {
    ctx: Context;
    workspace: string;
    stateRoot: string;
    teamId: string;
    memberName: string;
    patch: MemberDossierPatch;
    actingSessionId: string;
    captain: Agent | undefined;
    signal: AbortSignal | undefined;
}): Promise<TeamMember>;
/**
 * Build the `deers_team_edit_member` tool definition.
 * @param ctx - the plugin context (the plugin's inject list includes
 *   `'skills'`, so `ctx.skills` is available for catalog validation).
 * @param config - resolved tool config (supplies the `stateDir`).
 * @returns a registry-ready tool definition.
 */
export declare function createEditMemberTool(ctx: Context, config: ToolsConfig): ToolDefinition;
