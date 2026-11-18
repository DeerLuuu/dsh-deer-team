import { describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { buildTeamDigest, renderTeamDigest } from '../src/digest.ts'
import { batchCaptainReport, configureCaptainBatching, disposeCaptainBatching } from '../src/notify-batch.ts'
import { createTeamDir, appendMailbox, createMessage, readTeam } from '../src/state.ts'
import type { ToolsConfig } from '../src/tools.ts'
import { assertCaptainTakeoverAllowed } from '../src/tools.ts'
import { createDigestTools } from '../src/tools/digest.ts'
import { createProgressTool } from '../src/tools/progress.ts'
import type { TeamMessage, TeamState } from '../src/types.ts'
import { installWatchdogLoop } from '../src/watchdog-loop.ts'
import {
  DEFAULT_WATCHDOG,
  detectWatchdogAlerts,
  mergeWatchdogAlerts,
  renderWatchdog,
} from '../src/watchdog.ts'

const config: ToolsConfig = {
  stateDir: '.deers-agent-team',
  memberProvider: 'spawn',
  maxMembers: 8,
  profiles: {},
}

const CAPTAIN = 'session-captain'
const MEMBER = 'session-alice'
const NOW = 1_800_000_000_000

function fakeCtx(): Context {
  return { logger: { warn: () => undefined, debug: () => undefined } } as unknown as Context
}

function execFor(workspace: string, sessionId: string): ToolRunContext {
  return {
    agent: {
      id: sessionId,
      options: {},
      session: { header: { cwd: workspace }, requestHeader: () => undefined },
    },
    signal: new AbortController().signal,
  } as unknown as ToolRunContext
}

function fixture(): TeamState {
  return {
    name: 'watchdog-fixture',
    id: 'watchdog-fixture',
    description: 'watchdog/digest fixture',
    captainSessionId: CAPTAIN,
    createdAt: NOW - 10 * 60_000,
    phase: 'running',
    members: [{ id: MEMBER, name: 'alice', role: 'engineer', joinedAt: NOW, status: 'working' }],
    tasks: [
      {
        id: 't1',
        subject: 'long running test',
        status: 'in_progress',
        assignee: 'alice',
        dependencies: [],
        attempt: 1,
        attemptId: 'a1',
        progress: { percent: 40, note: 'running pnpm test', updatedAt: NOW - 2 * 60 * 60_000 },
        createdAt: NOW - 3 * 60 * 60_000,
        updatedAt: NOW - 2 * 60 * 60_000,
      },
      {
        id: 't2',
        subject: 'failed migration',
        status: 'failed',
        dependencies: [],
        attempt: 5,
        createdAt: NOW - 4 * 60 * 60_000,
        updatedAt: NOW - 3 * 60 * 60_000,
      },
      {
        id: 't3',
        subject: 'blocked follow-up',
        status: 'pending',
        dependencies: ['t1'],
        attempt: 0,
        createdAt: NOW - 30 * 60_000,
        updatedAt: NOW - 30 * 60_000,
      },
      {
        id: 't4',
        subject: 'finished earlier',
        status: 'completed',
        dependencies: [],
        attempt: 1,
        createdAt: NOW - 60 * 60_000,
        updatedAt: NOW - 30 * 60_000,
      },
    ],
    taskSeq: 4,
    blackboard: { seq: 1, entries: [{ id: 'bb-1', author: 'alice', kind: 'idea', content: 'try a cache', createdAt: NOW - 60_000 }] },
  }
}

function repeatedMessages(count: number): TeamMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `m${index + 1}`,
    from: 'alice',
    to: 'captain',
    content: 'ping captain: tests still running',
    ts: NOW - index * 1000,
  }))
}

describe('watchdog detection', () => {
  it('detects stalled attempts, exhausted retries and repeated messages', () => {
    const alerts = detectWatchdogAlerts(fixture(), DEFAULT_WATCHDOG, {
      now: NOW,
      messages: repeatedMessages(3),
    })
    const kinds = alerts.map((alert) => `${alert.kind}:${alert.taskId ?? alert.member}`)
    expect(kinds).toContain('stalled:t1')
    expect(kinds).toContain('retrying:t2')
    expect(alerts.some((alert) => alert.kind === 'repeat-message')).toBe(true)
  })

  it('does not alert on fresh work or below-threshold repeats', () => {
    const fresh: TeamState = {
      ...fixture(),
      tasks: [{ ...fixture().tasks[0]!, progress: { updatedAt: NOW - 60_000 } }],
    }
    const alerts = detectWatchdogAlerts(fresh, DEFAULT_WATCHDOG, { now: NOW, messages: repeatedMessages(2) })
    expect(alerts).toHaveLength(0)
  })

  it('merges scans: keeps first-seen timestamps, adds new, clears recovered', () => {
    const first = detectWatchdogAlerts(fixture(), DEFAULT_WATCHDOG, { now: NOW, messages: [] })
    const firstMerge = mergeWatchdogAlerts(undefined, first, NOW)
    expect(firstMerge.added).toHaveLength(first.length)
    const recovered: TeamState = { ...fixture(), tasks: [] }
    const secondMerge = mergeWatchdogAlerts(firstMerge.state, detectWatchdogAlerts(recovered, DEFAULT_WATCHDOG, { now: NOW, messages: [] }), NOW + 1000)
    expect(secondMerge.state.alerts).toHaveLength(0)
    expect(renderWatchdog(secondMerge.state)).toEqual([])
  })

  it('persists alerts from a scan and wakes the captain only for new ones', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-watchdog-'))
    try {
      const stateRoot = join(workspace, '.deers-agent-team')
      const team = fixture()
      const recent = Date.now()
      team.createdAt = recent - 10 * 60_000
      const active = team.tasks[0]
      if (active === undefined) throw new Error('fixture task missing')
      active.createdAt = recent - 3 * 60 * 60_000
      active.updatedAt = recent - 2 * 60 * 60_000
      active.progress = { percent: 40, note: 'running tests', updatedAt: recent - 2 * 60 * 60_000 }
      team.tasks[3]!.createdAt = recent - 60 * 60_000
      team.tasks[3]!.updatedAt = recent - 30 * 60_000
      team.tasks[1]!.createdAt = recent - 4 * 60 * 60_000
      team.tasks[1]!.updatedAt = recent - 3 * 60 * 60_000
      team.tasks[2]!.createdAt = recent - 30 * 60_000
      team.tasks[2]!.updatedAt = recent - 30 * 60_000
      await createTeamDir(stateRoot, team)
      const steered: string[] = []
      const captain = {
        id: CAPTAIN,
        status: 'idle',
        steer: (message: { content: Array<{ type: string; text?: string }> }) => {
          steered.push(message.content.map((block) => block.text ?? '').join(''))
        },
      }
      const loop = installWatchdogLoop(fakeCtx(), { ...DEFAULT_WATCHDOG, intervalMs: 60_000 }, {
        stateDir: '.deers-agent-team',
        workspaces: () => [{ path: workspace }],
        captainFor: () => captain as never,
      })
      await loop.scan()
      const saved = await readTeam(stateRoot, 'watchdog-fixture')
      expect(saved?.watchdog?.alerts.some((alert) => alert.kind === 'stalled')).toBe(true)
      expect(steered).toHaveLength(1)
      expect(steered[0]).toContain('watchdog alert')
      await loop.scan()
      expect(steered).toHaveLength(1)
      loop.dispose()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})

describe('digest', () => {
  it('summarizes active, blocked, failed tasks and board entries within bounds', () => {
    const team = fixture()
    team.watchdog = {
      lastRunAt: NOW,
      alerts: [{
        id: 'stalled:t1',
        kind: 'stalled',
        severity: 'warn',
        message: 'Task t1 has not reported progress for 2h',
        at: NOW,
        taskId: 't1',
        member: 'alice',
      }],
    }
    const digest = buildTeamDigest(team, { now: NOW })
    expect(digest.tasks.active.map((task) => task.id)).toEqual(['t1'])
    expect(digest.tasks.blocked.map((task) => task.id)).toEqual(['t3'])
    expect(digest.tasks.failed.map((task) => task.id)).toEqual(['t2'])
    expect(digest.board?.latest[0]?.id).toBe('bb-1')
    const text = renderTeamDigest(digest)
    expect(text).toContain('Active:')
    expect(text).toContain('Watchdog alerts')
    expect(text.length).toBeLessThanOrEqual(2600)
  })
})

describe('progress heartbeat', () => {
  it('records a member heartbeat and rejects stale attempts or captains', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-progress-'))
    try {
      const stateRoot = join(workspace, '.deers-agent-team')
      const team = fixture()
      team.tasks[0]!.status = 'in_progress'
      await createTeamDir(stateRoot, team)
      const tool = createProgressTool(fakeCtx(), config)
      const result = await tool.execute(
        { task_id: 't1', attempt_id: 'a1', percent: 55, note: 'halfway' },
        execFor(workspace, MEMBER),
      ) as { percent: number; note: string }
      expect(result.percent).toBe(55)
      const saved = await readTeam(stateRoot, 'watchdog-fixture')
      expect(saved?.tasks[0]?.progress?.note).toBe('halfway')
      await expect(tool.execute(
        { task_id: 't1', attempt_id: 'stale' },
        execFor(workspace, MEMBER),
      )).rejects.toThrow(/stale or foreign attempt_id/)
      await expect(tool.execute(
        { task_id: 't1', attempt_id: 'a1' },
        execFor(workspace, CAPTAIN),
      )).rejects.toThrow(/only the working member/)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})

describe('captain router-role guard', () => {
  it('blocks implementation/repair takeover unless enabled', () => {
    const implementation = { id: 't1', kind: 'implementation', subject: 'x' } as never
    expect(() => assertCaptainTakeoverAllowed(implementation, { ...config, captainMayImplement: false }))
      .toThrow(/captainMayImplement=false/)
    expect(() => assertCaptainTakeoverAllowed(implementation, { ...config, captainMayImplement: true })).not.toThrow()
    const work = { id: 't2', kind: 'work', subject: 'x' } as never
    expect(() => assertCaptainTakeoverAllowed(work, { ...config, captainMayImplement: false })).not.toThrow()
  })
})

describe('digest/recall mailbox scoping', () => {
  it('lets the captain recall any inbox but keeps members to their own mailbox', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-recall-'))
    try {
      const stateRoot = join(workspace, '.deers-agent-team')
      const team = fixture()
      team.members.push({ id: 'session-bob', name: 'bob', role: 'reviewer', joinedAt: NOW, status: 'idle' })
      await createTeamDir(stateRoot, team)
      const secret = createMessage('bob', 'captain', 'captain-only secret')
      await appendMailbox(stateRoot, team.id, 'captain', secret)
      const aliceToBob = createMessage('alice', 'bob', 'alice to bob')
      await appendMailbox(stateRoot, team.id, 'bob', aliceToBob)

      const tools = createDigestTools(fakeCtx(), config)
      const recall = tools.find((tool) => tool.name === 'deers_team_recall')
      if (recall === undefined) throw new Error('recall tool missing')

      const asCaptain = await recall.execute({ message_id: secret.id }, execFor(workspace, CAPTAIN)) as { message?: string }
      expect(asCaptain.message).toContain('captain-only secret')

      const asAlice = await recall.execute({ message_id: secret.id }, execFor(workspace, MEMBER)) as { message?: string }
      expect(asAlice.message).toContain('not found')

      const asAliceToBob = await recall.execute({ message_id: aliceToBob.id }, execFor(workspace, MEMBER)) as { message?: string }
      expect(asAliceToBob.message).toContain('not found')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})

describe('report batching', () => {
  it('coalesces idle-captain reports into one steer and flushes on dispose', async () => {
    const captured: string[] = []
    const captain = {
      id: 'captain-batch',
      status: 'idle',
      steer: (message: { content: Array<{ type: string; text?: string }> }) => {
        captured.push(message.content.map((block) => block.text ?? '').join(''))
      },
    } as never
    configureCaptainBatching({ windowMs: 40, maxItems: 8 })
    expect(batchCaptainReport(captain, 'alice', 'first report')).toBe(true)
    expect(batchCaptainReport(captain, 'bob', 'second report')).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(captured).toHaveLength(1)
    expect(captured[0]).toContain('first report')
    expect(captured[0]).toContain('second report')
    disposeCaptainBatching()
    configureCaptainBatching({ windowMs: 0 })
  })
})
