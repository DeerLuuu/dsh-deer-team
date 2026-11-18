import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { CURRENT_SCHEMA_VERSION } from '../src/migrations/index.ts'
import { effectiveMemberRoute } from '../src/members.ts'
import { readTeam } from '../src/state.ts'
import type { ToolsConfig } from '../src/tools.ts'
import { createSetModelTool } from '../src/tools/set-model.ts'
import type { TeamMember, TeamState } from '../src/types.ts'

const config: ToolsConfig = {
  stateDir: '.deers-agent-team',
  memberProvider: 'spawn',
  maxMembers: 8,
  profiles: {},
}

/** The LLM seam the route resolver needs (echo resolution, like approval). */
function fakeCtx(): Context {
  return {
    llm: {
      resolveCallConfig: async (request: { provider: string; model: string; reasoningEffort?: string }) => ({ ...request }),
    },
  } as unknown as Context
}

function execFor(workspace: string, agentId = 'session-set-test'): ToolRunContext {
  return {
    agent: {
      id: agentId,
      options: {},
      session: { header: { cwd: workspace }, requestHeader: () => undefined },
    },
    signal: new AbortController().signal,
  } as unknown as ToolRunContext
}

interface SetModelArgs {
  teamId: string
  memberName: string
  route: { provider: string; model: string; reasoningEffort?: string }
}

async function callSetModel(workspace: string, args: SetModelArgs, agentId = 'session-set-test'): Promise<Record<string, unknown>> {
  const tool = createSetModelTool(fakeCtx(), config)
  return await tool.execute(args, execFor(workspace, agentId)) as unknown as Record<string, unknown>
}

function runningTeam(overrides: Partial<TeamState> = {}): TeamState {
  return {
    name: 'set-model-fixture',
    id: 'set-model-fixture',
    description: 'post-creation model settings fixture',
    captainSessionId: 'session-set-test',
    createdAt: 1_700_000_000_000,
    phase: 'running',
    approvedAt: 1_700_000_000_500,
    defaultRoute: { provider: 'deepseek', model: 'deepseek-chat', reasoningEffort: 'high' },
    members: [
      {
        id: 'child-alice',
        name: 'alice',
        role: 'researcher',
        provider: 'deepseek',
        model: 'deepseek-chat',
        reasoningEffort: 'high',
        joinedAt: 1,
        status: 'idle',
      },
      { id: 'child-bob', name: 'bob', role: 'engineer', provider: 'deepseek', model: 'deepseek-chat', reasoningEffort: 'high', joinedAt: 2, status: 'idle' },
    ],
    tasks: [],
    taskSeq: 0,
    ...overrides,
  }
}

/** Materialize a team record (with its inbox dir) inside a fresh workspace. */
async function seedTeam(workspace: string, team: TeamState): Promise<void> {
  const dir = join(workspace, '.deers-agent-team', team.id)
  await mkdir(join(dir, 'inbox'), { recursive: true })
  await writeFile(join(dir, 'team.json'), JSON.stringify({ ...team, schemaVersion: CURRENT_SCHEMA_VERSION }, null, 2), 'utf8')
}

async function seedWorkspace(team: TeamState): Promise<{ workspace: string }> {
  const workspace = await mkdtemp(join(tmpdir(), 'deers-set-model-'))
  await seedTeam(workspace, team)
  return { workspace }
}

async function readRawTeamJson(workspace: string, teamId: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(join(workspace, '.deers-agent-team', teamId, 'team.json'), 'utf8')) as Record<string, unknown>
}

describe('deers_team_set_model', () => {
  it('sets a new route on an active team and persists the post-creation override', async () => {
    const { workspace } = await seedWorkspace(runningTeam())
    try {
      const result = await callSetModel(workspace, {
        teamId: 'set-model-fixture',
        memberName: 'alice',
        route: { provider: 'openrouter', model: 'openai/gpt-5' },
      })

      expect(result).toMatchObject({
        team_id: 'set-model-fixture',
        member_name: 'alice',
        role: 'researcher',
        provider: 'openrouter',
        model: 'openai/gpt-5',
        override_active: true,
        phase: 'running',
      })
      // A changed route resolves its own default effort.
      expect(result['reasoning_effort']).toBeUndefined()
      expect(result['default_route']).toMatchObject({ provider: 'deepseek', model: 'deepseek-chat', reasoning_effort: 'high' })

      const team = await readTeam(join(workspace, '.deers-agent-team'), 'set-model-fixture')
      const alice = team?.members.find((member) => member.name === 'alice')
      // The override rides the active* fields; the primary (descriptor-frozen)
      // route is untouched so the cold-resume guard keeps passing.
      expect(alice).toMatchObject({
        provider: 'deepseek',
        model: 'deepseek-chat',
        activeProvider: 'openrouter',
        activeModel: 'openai/gpt-5',
        fallbackActive: false,
      })
      expect(alice?.reasoningEffort).toBeUndefined()
      // The teammate is untouched, and the team default survives round-trips.
      expect(team?.members.find((member) => member.name === 'bob')).toMatchObject({ provider: 'deepseek', model: 'deepseek-chat' })
      expect(team?.defaultRoute).toMatchObject({ provider: 'deepseek', model: 'deepseek-chat', reasoningEffort: 'high' })

      const raw = await readRawTeamJson(workspace, 'set-model-fixture')
      expect(raw['schemaVersion']).toBe(CURRENT_SCHEMA_VERSION)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('rejects a staged team with TEAM_NOT_ACTIVE and changes nothing', async () => {
    const { workspace } = await seedWorkspace(runningTeam({
      phase: 'staged',
      planReviewState: 'awaiting_review',
      approvedAt: undefined,
    }))
    try {
      await expect(callSetModel(workspace, {
        teamId: 'set-model-fixture',
        memberName: 'alice',
        route: { provider: 'openrouter', model: 'openai/gpt-5' },
      })).rejects.toThrow('TEAM_NOT_ACTIVE: use deers_team_edit_member for staged-phase editing')

      const alice = (await readRawTeamJson(workspace, 'set-model-fixture'))['members'] as Array<Record<string, unknown>>
      expect(alice.find((member) => member['name'] === 'alice')).toMatchObject({ provider: 'deepseek', model: 'deepseek-chat' })
      expect(alice.find((member) => member['name'] === 'alice')?.['activeProvider']).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('clears the override when the requested route matches the team default', async () => {
    const { workspace } = await seedWorkspace(runningTeam({
      members: [
        {
          id: 'child-alice',
          name: 'alice',
          role: 'researcher',
          provider: 'deepseek',
          model: 'deepseek-chat',
          reasoningEffort: 'high',
          activeProvider: 'openrouter',
          activeModel: 'openai/gpt-5',
          fallbackActive: false,
          joinedAt: 1,
          status: 'idle',
        },
      ],
    }))
    try {
      const result = await callSetModel(workspace, {
        teamId: 'set-model-fixture',
        memberName: 'alice',
        route: { provider: 'deepseek', model: 'deepseek-chat', reasoningEffort: 'high' },
      })

      expect(result).toMatchObject({
        member_name: 'alice',
        provider: 'deepseek',
        model: 'deepseek-chat',
        reasoning_effort: 'high',
        override_active: false,
      })

      const alice = (await readTeam(join(workspace, '.deers-agent-team'), 'set-model-fixture'))?.members.find((member) => member.name === 'alice')
      expect(alice?.activeProvider).toBeUndefined()
      expect(alice?.activeModel).toBeUndefined()
      expect(alice?.fallbackActive).toBe(false)
      // The inherited default effort is restored after the override is gone.
      expect(alice?.reasoningEffort).toBe('high')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('resolves the hierarchy member override > explicit route > team default', () => {
    const defaultRoute = { provider: 'deepseek', model: 'deepseek-chat', reasoningEffort: 'high' }
    // A member without an explicit route inherits the team default.
    expect(effectiveMemberRoute({ id: 'x', name: 'carol', joinedAt: 1, status: 'idle' }, defaultRoute))
      .toEqual(defaultRoute)
    // An explicit (creation/approval) route outranks the team default.
    expect(effectiveMemberRoute({ id: 'x', name: 'dave', provider: 'p', model: 'm', joinedAt: 1, status: 'idle' }, defaultRoute))
      .toEqual({ provider: 'p', model: 'm' })
    // A post-creation override (active*) outranks both.
    expect(effectiveMemberRoute({
      id: 'x', name: 'erin', provider: 'p', model: 'm', activeProvider: 'q', activeModel: 'n', joinedAt: 1, status: 'idle',
    }, defaultRoute)).toEqual({ provider: 'q', model: 'n' })
    // A fallback-active override carries no effort id (target default rules).
    expect(effectiveMemberRoute({
      id: 'x', name: 'frank', provider: 'p', model: 'm', reasoningEffort: 'high', activeProvider: 'q', activeModel: 'n', fallbackActive: true, joinedAt: 1, status: 'idle',
    }, defaultRoute)).toEqual({ provider: 'q', model: 'n' })
    // Nothing anywhere: legacy descriptor behavior.
    expect(effectiveMemberRoute({ id: 'x', name: 'gina', joinedAt: 1, status: 'idle' })).toBeUndefined()
    expect(effectiveMemberRoute(undefined, defaultRoute)).toEqual(defaultRoute)
  })

  it('gives a never-spawned member the route on its primary fields', async () => {
    const { workspace } = await seedWorkspace(runningTeam({
      members: [
        { id: '', name: 'carol', role: 'writer', provider: 'deepseek', model: 'deepseek-chat', joinedAt: 3, status: 'idle' },
      ],
    }))
    try {
      const result = await callSetModel(workspace, {
        teamId: 'set-model-fixture',
        memberName: 'carol',
        route: { provider: 'openrouter', model: 'openai/gpt-5', reasoningEffort: 'low' },
      })

      expect(result).toMatchObject({
        member_name: 'carol',
        provider: 'openrouter',
        model: 'openai/gpt-5',
        reasoning_effort: 'low',
        override_active: false,
      })
      const carol = (await readTeam(join(workspace, '.deers-agent-team'), 'set-model-fixture'))?.members.find((member) => member.name === 'carol')
      expect(carol).toMatchObject({ provider: 'openrouter', model: 'openai/gpt-5', reasoningEffort: 'low' })
      expect(carol?.activeProvider).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('rejects unknown members, non-captain callers, and empty route fields', async () => {
    const { workspace } = await seedWorkspace(runningTeam())
    try {
      await expect(callSetModel(workspace, {
        teamId: 'set-model-fixture',
        memberName: 'zed',
        route: { provider: 'openrouter', model: 'openai/gpt-5' },
      })).rejects.toThrow('no active member named "zed" in team "set-model-fixture"')

      await expect(callSetModel(workspace, {
        teamId: 'set-model-fixture',
        memberName: 'alice',
        route: { provider: 'openrouter', model: 'openai/gpt-5' },
      }, 'session-not-captain')).rejects.toThrow('only the captain of team "set-model-fixture" may perform this operation')

      await expect(callSetModel(workspace, {
        teamId: 'set-model-fixture',
        memberName: 'alice',
        route: { provider: ' ', model: 'openai/gpt-5' },
      })).rejects.toThrow('route requires a non-empty provider and model')

      const alice = (await readTeam(join(workspace, '.deers-agent-team'), 'set-model-fixture'))?.members.find((member) => member.name === 'alice')
      expect(alice?.activeProvider).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})
