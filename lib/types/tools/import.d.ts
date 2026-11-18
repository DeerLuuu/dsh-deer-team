/**
 * `deers_team_import` — bring an archived legacy team directory into this
 * plugin's state root.
 *
 * The source is an old-format team directory (for example
 * `<workspace>/.agent-teams/archive/<teamId>` left behind by the pre-fork
 * `@nanmicoder/dsh-agent-teams` plugin). The durable record is read, upgraded
 * to the current schema with {@link migrate}, validated into a
 * {@link TeamState} with `coerceTeamState`, and written under
 * `<workspace>/<stateDir>/<teamId>/team.json` through the same
 * `createTeamDir` path every live team uses — so the imported team is
 * immediately readable by `readTeam`, the activity snapshot, and the Web
 * surface. The archived source directory is never modified.
 * @module deers-dsh-agent-team/tools/import
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { ToolsConfig } from '../tools.ts';
/**
 * Build the `deers_team_import` tool definition.
 * @param ctx - the plugin context (reserved for diagnostics; the tool itself
 *   is pure filesystem work on the caller's workspace).
 * @param config - resolved tool config (supplies the destination `stateDir`).
 * @returns a registry-ready tool definition.
 */
export declare function createImportTool(ctx: Context, config: ToolsConfig): ToolDefinition;
