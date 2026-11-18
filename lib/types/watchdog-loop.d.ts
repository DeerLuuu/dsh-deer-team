/**
 * Host-side watchdog loop.
 *
 * Scans every active team on a timer, merges detected alerts into durable team
 * state, and wakes the captain once per newly raised alert. The loop is a
 * supervisor only: it never reassigns, cancels or mutates task state.
 * @module deers-dsh-agent-team/watchdog-loop
 */
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { Context } from '@deepseek-ai/cordis';
import type { TeamState, WatchdogAlert } from './types.ts';
import { type WatchdogOptions } from './watchdog.ts';
/** Where the loop finds teams and who to wake. */
export interface WatchdogLoopDeps {
    stateDir: string;
    workspaces: () => readonly {
        path: string;
    }[];
    captainFor: (sessionId: string) => (Pick<Agent, 'id' | 'steer'> & {
        status?: string;
    }) | undefined;
    onNewAlerts?: (team: TeamState, alerts: readonly WatchdogAlert[]) => void;
}
/** Installed loop handle; `scan` is public for tests and manual runs. */
export interface WatchdogLoop {
    scan: () => Promise<void>;
    dispose: () => void;
}
/** Start the periodic scan. The returned disposer stops the timer. */
export declare function installWatchdogLoop(ctx: Context, options: WatchdogOptions, deps: WatchdogLoopDeps): WatchdogLoop;
