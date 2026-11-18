/**
 * Host-side automatic cleanup for the durable blackboard feed.
 *
 * Old notes accumulate forever without a supervisor: the board caps at 200
 * entries, but a team that runs for months keeps 200 stale notes. This loop
 * applies the configured retention policy to every active team on a timer and
 * can also be invoked on demand (the Web panel's cleanup button).
 * @module deers-dsh-agent-team/blackboard-cleanup
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_BLACKBOARD_CLEANUP, cleanupBlackboard, } from "./blackboard.js";
import { readTeam, withTeamLock, writeTeam } from "./state.js";
/** Defaults used when the profile does not configure cleanup. */
export const DEFAULT_BLACKBOARD_CLEANUP_OPTIONS = {
    ...DEFAULT_BLACKBOARD_CLEANUP,
    intervalMs: 60 * 60 * 1000,
};
function policyOf(options) {
    return {
        enabled: options.enabled,
        retentionDays: options.retentionDays,
        keepLatest: options.keepLatest,
        keepPinned: options.keepPinned,
        keepDecisions: options.keepDecisions,
    };
}
/**
 * Clean one team's blackboard under its lock and persist only when something
 * was removed. Used by the timer loop and by the manual cleanup route.
 */
export async function cleanupTeamBlackboard(stateRoot, teamId, policy, now = Date.now()) {
    return withTeamLock(`team:${stateRoot}:${teamId}`, async () => {
        const team = await readTeam(stateRoot, teamId);
        if (team === undefined)
            throw new Error(`team "${teamId}" is no longer active`);
        const result = cleanupBlackboard(team, policy, now);
        if (result.removed > 0)
            await writeTeam(stateRoot, team);
        return { ...result, remaining: team.blackboard?.entries.length ?? 0 };
    });
}
/** Start the periodic cleanup. The returned disposer stops the timer. */
export function installBlackboardCleanupLoop(ctx, options, deps) {
    let disposed = false;
    let running = false;
    async function scan() {
        if (disposed || running || !options.enabled)
            return;
        running = true;
        try {
            for (const workspace of deps.workspaces()) {
                const stateRoot = join(workspace.path, deps.stateDir);
                let entries;
                try {
                    entries = await readdir(stateRoot, { withFileTypes: true });
                }
                catch {
                    continue;
                }
                for (const entry of entries) {
                    if (!entry.isDirectory() || entry.name === 'archive' || entry.name.startsWith('.'))
                        continue;
                    let team;
                    try {
                        team = await readTeam(stateRoot, entry.name);
                    }
                    catch (error) {
                        ctx.logger.warn(`deers-agent-team: blackboard cleanup could not read team "${entry.name}": ${String(error)}`);
                        continue;
                    }
                    if (team === undefined)
                        continue;
                    try {
                        await cleanupTeamBlackboard(stateRoot, team.id, policyOf(options));
                    }
                    catch (error) {
                        ctx.logger.warn(`deers-agent-team: blackboard cleanup failed for team "${team.id}": ${String(error)}`);
                    }
                }
            }
        }
        finally {
            running = false;
        }
    }
    const timerService = typeof ctx.get === 'function'
        ? ctx.get('timer')
        : undefined;
    const timer = typeof timerService?.interval === 'function'
        ? timerService.interval(() => { void scan(); }, options.intervalMs)
        : undefined;
    if (timer === undefined) {
        ctx.logger.warn('deers-agent-team: timer service unavailable; blackboard cleanup runs only on manual cleanup');
    }
    return {
        scan,
        dispose: () => {
            disposed = true;
            try {
                timer?.();
            }
            catch {
                // Disposal must not throw during plugin teardown.
            }
        },
    };
}
