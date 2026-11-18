import { describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { createTeamDir, readTeam, writeTeam } from '../src/state.ts'
import type { ToolsConfig } from '../src/tools.ts'
import { DEFAULT_WAIT_TIMEOUT_MS, createWaitTool, teamChangeToken, waitForTeamChange } from '../src/tools/wait.ts'
import type { TeamState } from '../src/types.ts'

const config: ToolsConfig = {
  stateDir: '.deers-agent-team',
  memberProvider: 'spawn',
  maxMembers: 8,
  profiles: {},
}

function fakeCtx(): Context {
  return { logger: { warn: () => undefined, debug: () => undefined } } as unknown as Context
}

function execFor(workspace: string): ToolRunContext {
  return {
    agent: {
      id: 'session-wait-test',
      options: {},
      session: { header: { cwd: workspace }, requestHeader: () => undefined },
    },
    signal: new AbortController().signal,
  } as unknown as ToolRunContext
}

function waitTeam(): TeamState {
  const now = 1_700_000_000_000
  return {
    name: 'wait-fixture',
    id: 'wait-fixture',
    description: 'durable wait fixture',
    captainSessionId: 'session-wait-test',
    createdAt: now,
    phase: 'running',
    members: [],
    tasks: [{
      id: 't1',
      subject: 'Wait fixture task',
      status: 'in_progress',
      assignee: 'captain',
      dependencies: [],
      attempt: 1,
      attemptId: 'attempt-1',
      createdAt: now,
      updatedAt: now,
    }],
    taskSeq: 1,
  }
}

async function seedWorkspace(): Promise<{ workspace: string; stateRoot: string }> {
  const workspace = await mkdtemp(join(tmpdir(), 'deers-wait-'))
  const stateRoot = join(workspace, '.deers-agent-team')
  await createTeamDir(stateRoot, waitTeam())
  return { workspace, stateRoot }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('deers_team_wait (spec §11.1)', () => {
  it('uses the documented default window', () => {
    expect(DEFAULT_WAIT_TIMEOUT_MS).toBe(30_000)
    expect(createWaitTool(fakeCtx(), config).name).toBe('deers_team_wait')
  })

  it('returns changed:true when the team record changes during the wait', async () => {
    const { workspace, stateRoot } = await seedWorkspace()
    try {
      const tool = createWaitTool(fakeCtx(), config)
      const pending = tool.execute({ teamId: 'wait-fixture', timeoutMs: 5_000 }, execFor(workspace))
      // Let the waiter capture its baseline before mutating the team.
      await sleep(150)
      const team = await readTeam(stateRoot, 'wait-fixture')
      if (team === undefined) throw new Error('fixture team vanished')
      const task = team.tasks[0]
      if (task === undefined) throw new Error('fixture task missing')
      task.status = 'completed'
      task.output = 'finished while the captain waited'
      await writeTeam(stateRoot, team)
      await expect(pending).resolves.toEqual({ changed: true, timedOut: false })
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }, 15_000)

  it('returns changed:true when only a mailbox changes (spec: message arrival)', async () => {
    const { workspace, stateRoot } = await seedWorkspace()
    try {
      const tool = createWaitTool(fakeCtx(), config)
      const pending = tool.execute({ teamId: 'wait-fixture', timeoutMs: 5_000 }, execFor(workspace))
      await sleep(150)
      const { appendMailbox, createMessage } = await import('../src/state.ts')
      await appendMailbox(stateRoot, 'wait-fixture', 'captain', createMessage('alice', 'captain', 'progress ping'))
      await expect(pending).resolves.toEqual({ changed: true, timedOut: false })
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }, 15_000)

  it('times out with changed:false when nothing changes', async () => {
    const { workspace } = await seedWorkspace()
    try {
      const tool = createWaitTool(fakeCtx(), config)
      const started = Date.now()
      await expect(tool.execute({ teamId: 'wait-fixture', timeoutMs: 400 }, execFor(workspace)))
        .resolves.toEqual({ changed: false, timedOut: true })
      expect(Date.now() - started).toBeGreaterThanOrEqual(350)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }, 15_000)

  it('fails loudly when the team does not exist', async () => {
    const { workspace } = await seedWorkspace()
    try {
      const tool = createWaitTool(fakeCtx(), config)
      await expect(tool.execute({ teamId: 'no-such-team', timeoutMs: 100 }, execFor(workspace)))
        .rejects.toThrow('team "no-such-team" is no longer active')
      await expect(waitForTeamChange(join(workspace, '.deers-agent-team'), 'no-such-team', 100))
        .rejects.toThrow('no longer active')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }, 15_000)

  it('treats the team ending during the wait as a change', async () => {
    const { workspace, stateRoot } = await seedWorkspace()
    try {
      const pending = waitForTeamChange(stateRoot, 'wait-fixture', 5_000, { pollIntervalMs: 50 })
      await sleep(150)
      const { removeTeamDir } = await import('../src/state.ts')
      await removeTeamDir(stateRoot, 'wait-fixture')
      await expect(pending).resolves.toEqual({ changed: true, timedOut: false })
      expect(await teamChangeToken(stateRoot, 'wait-fixture')).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }, 15_000)

  it('aborts as timedOut when the caller cancels the wait', async () => {
    const { workspace, stateRoot } = await seedWorkspace()
    try {
      const controller = new AbortController()
      const pending = waitForTeamChange(stateRoot, 'wait-fixture', 10_000, {
        pollIntervalMs: 5_000,
        signal: controller.signal,
      })
      controller.abort()
      await expect(pending).resolves.toEqual({ changed: false, timedOut: true })
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  }, 15_000)
})
