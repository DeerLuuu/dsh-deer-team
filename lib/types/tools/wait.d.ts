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
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { ToolsConfig } from '../tools.ts';
/** Default wait window when `timeoutMs` is omitted. */
export declare const DEFAULT_WAIT_TIMEOUT_MS = 30000;
/** Poll cadence for the change token. */
export declare const WAIT_POLL_INTERVAL_MS = 500;
/** Result of one bounded wait. */
export interface WaitResult {
    /** Whether the team state changed before the window expired. */
    changed: boolean;
    /** Whether the window expired (or the wait was aborted) without a change. */
    timedOut: boolean;
}
/**
 * The durable change token for one team: `undefined` when the team record is
 * absent (team ended or never existed), otherwise the exact `team.json`
 * content plus mailbox file stats.
 */
export declare function teamChangeToken(stateRoot: string, teamId: string): Promise<string | undefined>;
/**
 * Wait until the team's durable state changes or the window closes.
 *
 * The team disappearing mid-wait counts as a change (the team ended). A
 * missing team at call time is a caller error, not a wait outcome. An aborted
 * signal ends the wait as `timedOut` — the wait produced no usable change.
 */
export declare function waitForTeamChange(stateRoot: string, teamId: string, timeoutMs: number, options?: {
    pollIntervalMs?: number;
    signal?: AbortSignal;
}): Promise<WaitResult>;
/**
 * Build the `deers_team_wait` tool definition.
 * @param ctx - the plugin context (used for diagnostics only).
 * @param config - resolved tool config (supplies the `stateDir`).
 */
export declare function createWaitTool(ctx: Context, config: ToolsConfig): ToolDefinition;
