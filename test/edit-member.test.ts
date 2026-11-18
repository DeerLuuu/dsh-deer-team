import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { CURRENT_SCHEMA_VERSION } from '../src/migrations/index.ts'
import { readTeam } from '../src/state.ts'
import type { ToolsConfig } from '../src/tools.ts'
import { createEditMemberTool } from '../src/tools/edit-member.ts'
import type { TeamState } from '../src/types.ts'

const config: ToolsConfig = {
  stateDir: '.deers-agent-team',
  memberProvider: 'spawn',
  maxMembers: 8,
  profiles: {},
}

/** Host skill catalog stub (`ctx.skills`) plus the LLM seam the route resolver needs. */
function fakeCtx(skillNames: readonly string[]): Context {
  return {
    skills: {
      list: async () => skillNames.map((name) => ({ name })),
    },
    llm: {
      resolveCallConfig: async (request: { provider: string; model: string; reasoningEffort?: string }) => ({ ...request }),
    },
  } as unknown as Context
}

function execFor(workspace: string): ToolRunContext {
  return {
    agent: {
      id: 'session-edit-test',
      options: {},
      session: { header: { cwd: workspace }, requestHeader: () => undefined },
    },
    signal: new AbortController().signal,
  } as unknown as ToolRunContext
}

interface EditArgs {
  teamId: string
  memberName: string
  patch: {
    persona?: string
    description?: string
    modelRoute?: { provider: string; model: string; reasoningEffort?: string }
    skills?: string[]
  }
}

async function callEditMember(workspace: string, args: EditArgs, skillNames: readonly string[] = ['plugin-test', 'plugin-write']): Promise<Record<string, unknown>> {
  const tool = createEditMemberTool(fakeCtx(skillNames), config)
  return await tool.execute(args, execFor(workspace)) as unknown as Record<string, unknown>
}

function stagedTeam(overrides: Partial<TeamState> = {}): TeamState {
  return {
    name: 'edit-fixture',
    id: 'edit-fixture',
    description: 'per-member dossier editing fixture',
    captainSessionId: 'session-edit-test',
    createdAt: 1_700_000_000_000,
    phase: 'staged',
    planReviewState: 'awaiting_review',
    members: [
      {
        id: '',
        name: 'alice',
        role: 'researcher',
        provider: 'deepseek',
        model: 'deepseek-chat',
        reasoningEffort: 'high',
        joinedAt: 1,
        status: 'idle',
      },
      { id: '', name: 'bob', role: 'engineer', provider: 'deepseek', model: 'deepseek-chat', joinedAt: 2, status: 'idle' },
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
  const workspace = await mkdtemp(join(tmpdir(), 'deers-edit-member-'))
  await seedTeam(workspace, team)
  return { workspace }
}

async function readRawTeamJson(workspace: string, teamId: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(join(workspace, '.deers-agent-team', teamId, 'team.json'), 'utf8')) as Record<string, unknown>
}

describe('deers_team_edit_member', () => {
  it('edits a staged member persona and persists the updated dossier', async () => {
    const { workspace } = await seedWorkspace(stagedTeam({ planReviewState: 'awaiting_feedback' }))
    try {
      const result = await callEditMember(workspace, {
        teamId: 'edit-fixture',
        memberName: 'alice',
        patch: { persona: 'Careful reviewer who asks before assuming.' },
      })

      expect(result).toMatchObject({ team_id: 'edit-fixture', member_name: 'alice', persona: 'Careful reviewer who asks before assuming.', phase: 'staged' })

      const team = await readTeam(join(workspace, '.deers-agent-team'), 'edit-fixture')
      const alice = team?.members.find((member) => member.name === 'alice')
      expect(alice?.persona).toBe('Careful reviewer who asks before assuming.')
      // A chat-side dossier edit re-arms the Web review surface, like edit_plan.
      expect(team?.planReviewState).toBe('awaiting_review')

      const raw = await readRawTeamJson(workspace, 'edit-fixture')
      expect(raw['schemaVersion']).toBe(CURRENT_SCHEMA_VERSION)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('rejects an approved (running) team with TEAM_FROZEN and changes nothing', async () => {
    const { workspace } = await seedWorkspace(stagedTeam({ phase: 'running', planReviewState: undefined, approvedAt: 1_700_000_000_500 }))
    try {
      await expect(callEditMember(workspace, {
        teamId: 'edit-fixture',
        memberName: 'alice',
        patch: { persona: 'too late' },
      })).rejects.toThrow('TEAM_FROZEN: member editing is only allowed during the staged planning phase')

      const raw = await readRawTeamJson(workspace, 'edit-fixture')
      const alice = (raw['members'] as Array<Record<string, unknown>>).find((member) => member['name'] === 'alice')
      expect(alice?.['persona']).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('applies a partial patch: only modelRoute changes, persona/description/skills stay untouched', async () => {
    const { workspace } = await seedWorkspace(stagedTeam({
      members: [
        {
          id: '',
          name: 'alice',
          role: 'researcher',
          provider: 'deepseek',
          model: 'deepseek-chat',
          reasoningEffort: 'high',
          persona: 'keep persona',
          description: 'keep description',
          skills: ['plugin-test'],
          joinedAt: 1,
          status: 'idle',
        },
        { id: '', name: 'bob', role: 'engineer', provider: 'deepseek', model: 'deepseek-chat', joinedAt: 2, status: 'idle' },
      ],
    }))
    try {
      const result = await callEditMember(workspace, {
        teamId: 'edit-fixture',
        memberName: 'alice',
        patch: { modelRoute: { provider: 'openrouter', model: 'openai/gpt-5' } },
      })

      expect(result).toMatchObject({ member_name: 'alice', provider: 'openrouter', model: 'openai/gpt-5', persona: 'keep persona', description: 'keep description', skills: ['plugin-test'] })
      // A changed route resolves its own default effort: the old explicit effort is gone.
      expect(result['reasoning_effort']).toBeUndefined()

      const team = await readTeam(join(workspace, '.deers-agent-team'), 'edit-fixture')
      const alice = team?.members.find((member) => member.name === 'alice')
      expect(alice).toMatchObject({ provider: 'openrouter', model: 'openai/gpt-5', persona: 'keep persona', description: 'keep description', skills: ['plugin-test'] })
      expect(alice?.reasoningEffort).toBeUndefined()
      // The teammate is untouched.
      expect(team?.members.find((member) => member.name === 'bob')?.model).toBe('deepseek-chat')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('fails with UNKNOWN_SKILL for a name outside the host catalog and persists nothing', async () => {
    const { workspace } = await seedWorkspace(stagedTeam())
    try {
      await expect(callEditMember(workspace, {
        teamId: 'edit-fixture',
        memberName: 'alice',
        patch: { skills: ['plugin-test', 'no-such-skill'] },
      }, ['plugin-test', 'plugin-write'])).rejects.toThrow('UNKNOWN_SKILL: skill "no-such-skill" is not in the catalog')

      const alice = (await readTeam(join(workspace, '.deers-agent-team'), 'edit-fixture'))?.members.find((member) => member.name === 'alice')
      expect(alice?.skills).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('accepts valid skill names, trimmed and de-duplicated, and stores them on the member', async () => {
    const { workspace } = await seedWorkspace(stagedTeam())
    try {
      const result = await callEditMember(workspace, {
        teamId: 'edit-fixture',
        memberName: 'alice',
        patch: { skills: [' plugin-test ', 'plugin-write', 'plugin-test'] },
      }, ['plugin-test', 'plugin-write'])

      expect(result['skills']).toEqual(['plugin-test', 'plugin-write'])
      const alice = (await readTeam(join(workspace, '.deers-agent-team'), 'edit-fixture'))?.members.find((member) => member.name === 'alice')
      expect(alice?.skills).toEqual(['plugin-test', 'plugin-write'])
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('rejects unknown members and teams the caller does not captain', async () => {
    const { workspace } = await seedWorkspace(stagedTeam())
    try {
      await expect(callEditMember(workspace, {
        teamId: 'edit-fixture',
        memberName: 'carol',
        patch: { persona: 'x' },
      })).rejects.toThrow('no active member named "carol" in team "edit-fixture"')

      const stranger = createEditMemberTool(fakeCtx([]), config)
      await expect(stranger.execute({
        teamId: 'edit-fixture',
        memberName: 'alice',
        patch: { persona: 'x' },
      }, {
        agent: { id: 'session-not-captain', options: {}, session: { header: { cwd: workspace } } },
        signal: new AbortController().signal,
      } as unknown as ToolRunContext)).rejects.toThrow('only the captain of team "edit-fixture" may perform this operation')
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})
