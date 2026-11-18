/**
 * Host-side watchdog loop.
 *
 * Scans every active team on a timer, merges detected alerts into durable team
 * state, and wakes the captain once per newly raised alert. The loop is a
 * supervisor only: it never reassigns, cancels or mutates task state.
 * @module deers-dsh-agent-team/watchdog-loop
 */

import type { Agent } from '@deepseek-ai/dsh-agent'
import type { Context } from '@deepseek-ai/cordis'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { steerCaptainReport } from './members.ts'
import { readMailbox, readTeam, withTeamLock, writeTeam } from './state.ts'
import type { TeamMessage, TeamState, WatchdogAlert } from './types.ts'
import {
  detectWatchdogAlerts,
  mergeWatchdogAlerts,
  watchdogPrompt,
  type WatchdogOptions,
} from './watchdog.ts'

/** Where the loop finds teams and who to wake. */
export interface WatchdogLoopDeps {
  stateDir: string
  workspaces: () => readonly { path: string }[]
  captainFor: (sessionId: string) => (Pick<Agent, 'id' | 'steer'> & { status?: string }) | undefined
  onNewAlerts?: (team: TeamState, alerts: readonly WatchdogAlert[]) => void
}

/** Installed loop handle; `scan` is public for tests and manual runs. */
export interface WatchdogLoop {
  scan: () => Promise<void>
  dispose: () => void
}

async function collectMessages(stateRoot: string, team: TeamState): Promise<TeamMessage[]> {
  const owners = ['captain', ...team.members.filter((member) => member.status !== 'removed').map((member) => member.name)]
  const messages: TeamMessage[] = []
  for (const owner of owners) {
    try {
      messages.push(...(await readMailbox(stateRoot, team.id, owner)).filter((message) => message.discardedAt === undefined))
    } catch {
      // One damaged inbox must not disable the whole scan.
    }
  }
  return messages.slice(-200)
}

/** Start the periodic scan. The returned disposer stops the timer. */
export function installWatchdogLoop(
  ctx: Context,
  options: WatchdogOptions,
  deps: WatchdogLoopDeps,
): WatchdogLoop {
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
            ctx.logger.warn(`deers-agent-team: watchdog could not read team "${entry.name}": ${String(error)}`)
            continue
          }
          if (team === undefined || team.halted === true) continue
          try {
            const messages = await collectMessages(stateRoot, team)
            const detected = detectWatchdogAlerts(team, options, { messages })
            const merged = mergeWatchdogAlerts(team.watchdog, detected)
            const before = JSON.stringify(team.watchdog?.alerts ?? [])
            const after = JSON.stringify(merged.state.alerts)
            if (before !== after || team.watchdog?.lastRunAt === undefined) {
              await withTeamLock(`team:${stateRoot}:${team.id}`, async () => {
                const fresh = await readTeam(stateRoot, team.id)
                if (fresh === undefined) return
                fresh.watchdog = merged.state
                await writeTeam(stateRoot, fresh)
              })
            }
            if (merged.added.length > 0) {
              deps.onNewAlerts?.(team, merged.added)
              if (options.notifyCaptain) {
                const captain = deps.captainFor(team.captainSessionId)
                if (captain !== undefined) {
                  steerCaptainReport(captain, 'watchdog', watchdogPrompt(team.name, merged.added))
                }
              }
            }
          } catch (error: unknown) {
            ctx.logger.warn(`deers-agent-team: watchdog scan failed for team "${team.id}": ${String(error)}`)
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
    ctx.logger.warn('deers-agent-team: timer service unavailable; watchdog runs only on manual scan')
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
