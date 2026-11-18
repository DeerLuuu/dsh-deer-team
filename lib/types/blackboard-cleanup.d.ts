/**
 * Host-side automatic cleanup for the durable blackboard feed.
 *
 * Old notes accumulate forever without a supervisor: the board caps at 200
 * entries, but a team that runs for months keeps 200 stale notes. This loop
 * applies the configured retention policy to every active team on a timer and
 * can also be invoked on demand (the Web panel's cleanup button).
 * @module deers-dsh-agent-team/blackboard-cleanup
 */
import type { Context } from '@deepseek-ai/cordis';
import type { BlackboardCleanupPolicy } from './blackboard.ts';
/** Resolved cleanup options: the policy plus the scan interval. */
export interface BlackboardCleanupOptions extends BlackboardCleanupPolicy {
    intervalMs: number;
}
/** Defaults used when the profile does not configure cleanup. */
export declare const DEFAULT_BLACKBOARD_CLEANUP_OPTIONS: BlackboardCleanupOptions;
/** Where the loop finds teams. */
export interface BlackboardCleanupLoopDeps {
    stateDir: string;
    workspaces: () => readonly {
        path: string;
    }[];
}
/** Installed loop handle; `scan` is public for tests and manual runs. */
export interface BlackboardCleanupLoop {
    scan: () => Promise<void>;
    dispose: () => void;
}
/**
 * Clean one team's blackboard under its lock and persist only when something
 * was removed. Used by the timer loop and by the manual cleanup route.
 */
export declare function cleanupTeamBlackboard(stateRoot: string, teamId: string, policy: BlackboardCleanupPolicy, now?: number): Promise<{
    removed: number;
    ids: string[];
    remaining: number;
}>;
/** Start the periodic cleanup. The returned disposer stops the timer. */
export declare function installBlackboardCleanupLoop(ctx: Context, options: BlackboardCleanupOptions, deps: BlackboardCleanupLoopDeps): BlackboardCleanupLoop;
