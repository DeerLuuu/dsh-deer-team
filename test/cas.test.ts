import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { CURRENT_SCHEMA_VERSION } from '../src/migrations/index.ts'
import { checkTaskRevision, bumpTaskRevision, readTeam, taskRevisionOf } from '../src/state.ts'
import { registerAgentTeamsTools, type ToolsConfig } from '../src/tools.ts'
import type { TeamState } from '../src/types.ts'

const config: ToolsConfig = {
  stateDir: '.deers-agent-team',
  memberProvider: 'spawn',
  maxMembers: 8,
  profiles: {},
}

/** Minimal ctx that satisfies registerAgentTeamsTools' install surface. */
function fakeCtx(definitions: ToolDefinition[]): Context {
  return {
    on: () => () => undefined,
    effect: (setup: () => unknown) => setup(),
    logger: { warn: () => undefined, debug: () => undefined },
    tools: { register: (definition: ToolDefinition) => definitions.push(definition) },
    agents: { get: () => undefined },
    subagents: { followup: async () => undefined, registerContinuableSetup: () => () => undefined },
  } as unknown as Context
}

function execFor(workspace: string): ToolRunContext {
  return {
    agent: {
      id: 'session-cas-test',
      options: {},
      session: { header: { cwd: workspace }, requestHeader: () => undefined },
    },
    signal: new AbortController().signal,
  } as unknown as ToolRunContext
}

function casTeam(taskOverrides: Record<string, unknown> = {}): TeamState {
  const now = 1_700_000_000_000
  return {
    name: 'cas-fixture',
    id: 'cas-fixture',
    description: 'CAS revision fixture',
    captainSessionId: 'session-cas-test',
    createdAt: now,
    // Staged keeps the trailing scheduler kick a no-op in tests.
    phase: 'staged',
    members: [],
    tasks: [{
      id: 't1',
      subject: 'CAS fixture task',
      status: 'claimed',
      assignee: 'captain',
      dependencies: [],
      attempt: 1,
      attemptId: 'attempt-1',
      kind: 'work',
      createdAt: now,
      updatedAt: now,
      ...taskOverrides,
    }],
    taskSeq: 1,
  }
}

async function seedWorkspace(team: TeamState): Promise<{ workspace: string; stateRoot: string }> {
  const workspace = await mkdtemp(join(tmpdir(), 'deers-cas-'))
  const dir = join(workspace, '.deers-agent-team', team.id)
  await mkdir(join(dir, 'inbox'), { recursive: true })
  await writeFile(join(dir, 'team.json'), JSON.stringify({ ...team, schemaVersion: CURRENT_SCHEMA_VERSION }, null, 2), 'utf8')
  return { workspace, stateRoot: join(workspace, '.deers-agent-team') }
}

/** The real deers_team_update_task definition, resolved through registration. */
function updateTaskTool(): ToolDefinition {
  const definitions: ToolDefinition[] = []
  registerAgentTeamsTools(fakeCtx(definitions), config)
  const tool = definitions.find((candidate) => candidate.name === 'deers_team_update_task')
  if (tool === undefined) throw new Error('deers_team_update_task was not registered')
  return tool
}

describe('task revision CAS (spec §11.2)', () => {
  it('pure helpers: absent revision counts as 0, bump advances it', () => {
    const now = Date.now()
    const task = { id: 't1', subject: 'x', status: 'pending', dependencies: [], createdAt: now, updatedAt: now } as import('../src/types.ts').TeamTask
    expect(taskRevisionOf(task)).toBe(0)
    expect(bumpTaskRevision(task)).toBe(1)
    expect(bumpTaskRevision(task)).toBe(2)
    expect(taskRevisionOf(task)).toBe(2)
    expect(() => checkTaskRevision(task, 2)).not.toThrow()
    expect(() => checkTaskRevision(task, 1)).toThrow('TASK_REVISION_CONFLICT: expected revision 1 but found 2')
  })

  it('rejects a stale expectedRevision with TASK_REVISION_CONFLICT and changes nothing', async () => {
    const { workspace, stateRoot } = await seedWorkspace(casTeam())
    try {
      const tool = updateTaskTool()
      await expect(tool.execute({
        task_id: 't1', status: 'in_progress', expectedRevision: 5,
      }, execFor(workspace))).rejects.toThrow('TASK_REVISION_CONFLICT: expected revision 5 but found 0')

      const team = await readTeam(stateRoot, 'cas-fixture')
      expect(team?.tasks[0]?.status).toBe('claimed')
      expect(team?.tasks[0]?.revision).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('applies the update when expectedRevision matches and increments the revision', async () => {
    const { workspace, stateRoot } = await seedWorkspace(casTeam())
    try {
      const tool = updateTaskTool()
      const result = await tool.execute({
        task_id: 't1', status: 'in_progress', expectedRevision: 0,
      }, execFor(workspace)) as Record<string, unknown>

      expect(result).toMatchObject({ task_id: 't1', status: 'in_progress', revision: 1 })
      const team = await readTeam(stateRoot, 'cas-fixture')
      expect(team?.tasks[0]?.status).toBe('in_progress')
      expect(team?.tasks[0]?.revision).toBe(1)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('without expectedRevision the update applies unconditionally (backward compatible)', async () => {
    const { workspace, stateRoot } = await seedWorkspace(casTeam({ revision: 3 }))
    try {
      const tool = updateTaskTool()
      const first = await tool.execute({ task_id: 't1', status: 'in_progress', output: 'working' }, execFor(workspace)) as Record<string, unknown>
      expect(first).toMatchObject({ status: 'in_progress', revision: 4 })

      const second = await tool.execute({ task_id: 't1', status: 'completed', output: 'done' }, execFor(workspace)) as Record<string, unknown>
      expect(second).toMatchObject({ status: 'completed', revision: 5 })

      const team = await readTeam(stateRoot, 'cas-fixture')
      expect(team?.tasks[0]?.revision).toBe(5)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('revision round-trips through team.json and guards the stored value', async () => {
    const { workspace, stateRoot } = await seedWorkspace(casTeam({ revision: 2 }))
    try {
      const team = await readTeam(stateRoot, 'cas-fixture')
      expect(team?.tasks[0]?.revision).toBe(2)

      const tool = updateTaskTool()
      await expect(tool.execute({
        task_id: 't1', status: 'in_progress', expectedRevision: 3,
      }, execFor(workspace))).rejects.toThrow('TASK_REVISION_CONFLICT: expected revision 3 but found 2')

      const result = await tool.execute({
        task_id: 't1', status: 'in_progress', expectedRevision: 2,
      }, execFor(workspace)) as Record<string, unknown>
      expect(result).toMatchObject({ revision: 3 })
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('appending supplemental evidence to a terminal task also increments the revision', async () => {
    const { workspace, stateRoot } = await seedWorkspace(casTeam({ status: 'completed', output: 'done', revision: 1 }))
    try {
      const tool = updateTaskTool()
      const result = await tool.execute({
        task_id: 't1',
        evidence_note: 'Late independent recheck',
        expectedRevision: 1,
      }, execFor(workspace)) as Record<string, unknown>

      expect(result).toMatchObject({ status: 'completed', revision: 2, evidence_count: 1 })
      const team = await readTeam(stateRoot, 'cas-fixture')
      expect(team?.tasks[0]?.revision).toBe(2)
      expect(team?.tasks[0]?.status).toBe('completed')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})
