/**
 * Independent team watchdog.
 *
 * The watchdog is a supervisor, not a worker: it scans durable team state on a
 * timer, raises alerts for stalled attempts, repeated failures and message
 * loops, and lets the captain (or the human) decide what to do. Pure detection
 * helpers live here so the loop and the tests share one implementation.
 * @module deers-dsh-agent-team/watchdog
 */
import type { TeamMessage, TeamState, WatchdogAlert, WatchdogState } from './types.ts';
/** Resolved watchdog configuration. */
export interface WatchdogOptions {
    enabled: boolean;
    /** Scan period. */
    intervalMs: number;
    /** An active attempt without a heartbeat for this long is stalled. */
    stallMs: number;
    /** Look-back window for duplicate-message detection. */
    repeatWindowMs: number;
    /** Identical messages (same sender/recipient/content) at or above this count alert. */
    repeatThreshold: number;
    /** An attempt count at or above this value alerts while the task is not progressing. */
    maxAttempts: number;
    /** Push newly raised alerts to the captain when it is live. */
    notifyCaptain: boolean;
}
/** Conservative defaults: surface problems, never mutate task state. */
export declare const DEFAULT_WATCHDOG: WatchdogOptions;
/** Stable 32-bit hash for alert ids (no crypto dependency). */
export declare function stableHash(value: string): string;
/** The team's active (claimed / in-progress) tasks. */
export declare function activeTasks(team: TeamState): TeamState['tasks'];
/**
 * Detect every current alert. Detection is stateless: callers merge the result
 * with persisted state to decide what is new.
 */
export declare function detectWatchdogAlerts(team: TeamState, options: WatchdogOptions, input?: {
    now?: number;
    messages?: readonly TeamMessage[];
}): WatchdogAlert[];
/**
 * Merge a fresh scan into persisted state. Unchanged alerts keep their original
 * timestamp; recovered ones disappear; brand-new ones are returned so the loop
 * notifies the captain exactly once.
 */
export declare function mergeWatchdogAlerts(existing: WatchdogState | undefined, detected: readonly WatchdogAlert[], now?: number): {
    state: WatchdogState;
    added: WatchdogAlert[];
};
/** Render active alerts for status/digest surfaces. */
export declare function renderWatchdog(state: WatchdogState | undefined): string[];
/** One concise line for a watchdog notification prompt. */
export declare function watchdogPrompt(teamName: string, alerts: readonly WatchdogAlert[]): string;
