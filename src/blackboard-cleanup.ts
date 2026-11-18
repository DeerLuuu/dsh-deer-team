/**
 * Host-side automatic cleanup for the durable blackboard feed.
 *
 * Old notes accumulate forever without a supervisor: the board caps at 200
 * entries, but a team that runs for months keeps 200 stale notes. This loop
 * applies the configured retention policy to every active team on a timer and
 * can also be invoked on demand (the Web panel's cleanup button).
 * @module deers-dsh-agent-team/blackboard-cleanup
 */

import type { Context } from '@deepseek-ai/cordis'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { BlackboardCleanupPolicy } from './blackboard.ts'
import {
  DEFAULT_BLACKBOARD_CLEANUP,
  cleanupBlackboard,
} from './blackboard.ts'
import { readTeam, withTeamLock, writeTeam } from './state.ts'
import type { TeamState } from './types.ts'

/** Resolved cleanup options: the policy plus the scan interval. */
export interface BlackboardCleanupOptions extends BlackboardCleanupPolicy {
  intervalMs: number
}

/** Defaults used when the profile does not configure cleanup. */
export const DEFAULT_BLACKBOARD_CLEANUP_OPTIONS: BlackboardCleanupOptions = {
  ...DEFAULT_BLACKBOARD_CLEANUP,
  intervalMs: 60 * 60 * 1000,
}

/** Where the loop finds teams. */
export interface BlackboardCleanupLoopDeps {
  stateDir: string
  workspaces: () => readonly { path: string }[]
}

/** Installed loop handle; `scan` is public for tests and manual runs. */
export interface BlackboardCleanupLoop {
  scan: () => Promise<void>
  dispose: () => void
}

function policyOf(options: BlackboardCleanupOptions): BlackboardCleanupPolicy {
  return {
    enabled: options.enabled,
    retentionDays: options.retentionDays,
    keepLatest: options.keepLatest,
    keepPinned: options.keepPinned,
    keepDecisions: options.keepDecisions,
  }
}

/**
 * Clean one team's blackboard under its lock and persist only when something
 * was removed. Used by the timer loop and by the manual cleanup route.
 */
export async function cleanupTeamBlackboard(
  stateRoot: string,
  teamId: string,
  policy: BlackboardCleanupPolicy,
  now = Date.now(),
): Promise<{ removed: number; ids: string[]; remaining: number }> {
  return withTeamLock(`team:${stateRoot}:${teamId}`, async () => {
    const team = await readTeam(stateRoot, teamId)
    if (team === undefined) throw new Error(`team "${teamId}" is no longer active`)
    const result = cleanupBlackboard(team, policy, now)
    if (result.removed > 0) await writeTeam(stateRoot, team)
    return { ...result, remaining: team.blackboard?.entries.length ?? 0 }
  })
}

/** Start the periodic cleanup. The returned disposer stops the timer. */
export function installBlackboardCleanupLoop(
  ctx: Context,
  options: BlackboardCleanupOptions,
  deps: BlackboardCleanupLoopDeps,
): BlackboardCleanupLoop {
  let disposed = false
  let running = false

  async function scan(): Promise<void> {
    if (disposed || running || !options.enabled) return
    running = true
    try {
      for (const workspace of deps.workspaces()) {
        const stateRoot = join(workspace.path, deps.stateDir)
        let entries
        try {
          entries = await readdir(stateRoot, { withFileTypes: true })
        } catch {
          continue
        }
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.name === 'archive' || entry.name.startsWith('.')) continue
          let team: TeamState | undefined
          try {
            team = await readTeam(stateRoot, entry.name)
          } catch (error: unknown) {
            ctx.logger.warn(`deers-agent-team: blackboard cleanup could not read team "${entry.name}": ${String(error)}`)
            continue
          }
          if (team === undefined) continue
          try {
            await cleanupTeamBlackboard(stateRoot, team.id, policyOf(options))
          } catch (error: unknown) {
            ctx.logger.warn(`deers-agent-team: blackboard cleanup failed for team "${team.id}": ${String(error)}`)
          }
        }
      }
    } finally {
      running = false
    }
  }

  const timerService = typeof ctx.get === 'function'
    ? (ctx.get('timer') as {
        interval?: (callback: () => void, delay: number) => () => void
      } | undefined)
    : undefined
  const timer: (() => void) | undefined = typeof timerService?.interval === 'function'
    ? timerService.interval(() => { void scan() }, options.intervalMs)
    : undefined
  if (timer === undefined) {
    ctx.logger.warn('deers-agent-team: timer service unavailable; blackboard cleanup runs only on manual cleanup')
  }

  return {
    scan,
    dispose: () => {
      disposed = true
      try {
        timer?.()
      } catch {
        // Disposal must not throw during plugin teardown.
      }
    },
  }
}
