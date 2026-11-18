/**
 * Context-budget tools: `deers_team_digest` (bounded inline view) and
 * `deers_team_recall` (fetch exact detail by durable id).
 *
 * The pair implements the "Inline & Spill / Chain of Recall" memory split for
 * teams: routine captain turns read the digest; detail is pulled only when a
 * specific task, message or board entry matters.
 * @module deers-dsh-agent-team/tools/digest
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { ToolsConfig } from '../tools.ts';
/**
 * Build both context tools. `deers_team_digest` is cheap and bounded;
 * `deers_team_recall` fetches exact detail for up to a handful of ids.
 */
export declare function createDigestTools(_ctx: Context, config: ToolsConfig): ToolDefinition[];
