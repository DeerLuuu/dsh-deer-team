/**
 * `deers_team_progress`: member heartbeats for long-running attempts.
 *
 * The watchdog uses the latest heartbeat to distinguish "still working" from
 * "stalled"; without it the only signal is the last state transition. Progress
 * updates never change task status, so they are safe to call from inside a long
 * tool sequence.
 * @module deers-dsh-agent-team/tools/progress
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { ToolsConfig } from '../tools.ts';
/** Build the progress-heartbeat tool. */
export declare function createProgressTool(_ctx: Context, config: ToolsConfig): ToolDefinition;
