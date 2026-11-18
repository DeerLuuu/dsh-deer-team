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
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { ToolsConfig } from '../tools.ts';
/**
 * Build the `deers_team_set_model` tool definition.
 * @param ctx - the plugin context (injects `llm` for route resolution).
 * @param config - resolved tool config (supplies the `stateDir`).
 * @returns a registry-ready tool definition.
 */
export declare function createSetModelTool(ctx: Context, config: ToolsConfig): ToolDefinition;
