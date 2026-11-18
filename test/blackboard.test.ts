import { describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import {
  BLACKBOARD_MAX_CONTENT,
  BLACKBOARD_MAX_ENTRIES,
  blackboardOf,
  blackboardStatus,
  clearBlackboard,
  normalizeBlackboard,
  postBlackboardEntry,
  readBlackboard,
  renderBlackboard,
  tallyOf,
  voteBlackboardEntry,
} from '../src/blackboard.ts'
import { createBlackboardTools, appendCaptainBlackboardEntry, castCaptainBlackboardVote } from '../src/tools/blackboard.ts'
import { createTeamDir, readTeam } from '../src/state.ts'
import type { ToolsConfig } from '../src/tools.ts'
import type { TeamState } from '../src/types.ts'

const config: ToolsConfig = {
  stateDir: '.deers-agent-team',
  memberProvider: 'spawn',
  maxMembers: 8,
  profiles: {},
}

const CAPTAIN = 'session-blackboard-captain'
const MEMBER = 'session-blackboard-member'

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
  const now = 1_700_000_000_000
  return {
    name: 'blackboard-fixture',
    id: 'blackboard-fixture',
    description: 'brainstorming fixture',
    captainSessionId: CAPTAIN,
    createdAt: now,
    phase: 'running',
    members: [{
      id: MEMBER,
      name: 'alice',
      role: 'engineer',
      joinedAt: now,
      status: 'idle',
    }],
    tasks: [],
    taskSeq: 0,
  }
}

async function seedWorkspace(): Promise<{ workspace: string; stateRoot: string }> {
  const workspace = await mkdtemp(join(tmpdir(), 'deers-blackboard-'))
  const stateRoot = join(workspace, '.deers-agent-team')
  await createTeamDir(stateRoot, fixture())
  return { workspace, stateRoot }
}

function toolNamed(tools: ReturnType<typeof createBlackboardTools>, name: string) {
  const tool = tools.find((candidate) => candidate.name === name)
  if (tool === undefined) throw new Error(`missing tool ${name}`)
  return tool
}

describe('blackboard state helpers', () => {
  it('normalizes malformed persisted boards instead of throwing', () => {
    expect(normalizeBlackboard(undefined)).toEqual({ seq: 0, entries: [] })
    expect(normalizeBlackboard({ entries: 'nope' })).toEqual({ seq: 0, entries: [] })
    const normalized = normalizeBlackboard({
      seq: 7,
      entries: [
        { id: 'bb-2', author: 'alice', content: 'hello', kind: 'idea', createdAt: 5, votes: { alice: 'up', bob: 'sideways' } },
        { id: '', author: 'alice', content: 'broken' },
        { id: 'bb-3', author: 'bob', content: 'proposal', kind: 'weird' },
      ],
    })
    expect(normalized.seq).toBe(7)
    expect(normalized.entries).toHaveLength(2)
    expect(normalized.entries[0]?.kind).toBe('idea')
    expect(normalized.entries[0]?.votes).toEqual({ alice: 'up' })
    expect(normalized.entries[1]?.kind).toBe('note')
  })

  it('ignores malformed entries when the board is empty', () => {
    expect(normalizeBlackboard({ seq: -3, entries: [] })).toEqual({ seq: 0, entries: [] })
  })

  it('posts entries with monotonic ids and a kind default', () => {
    const team = fixture()
    const first = postBlackboardEntry(team, { author: 'captain', content: ' idea one ' })
    const second = postBlackboardEntry(team, { author: 'alice', content: 'idea two', kind: 'idea' })
    expect(first.id).toBe('bb-1')
    expect(first.kind).toBe('note')
    expect(first.content).toBe('idea one')
    expect(second.id).toBe('bb-2')
    expect(second.kind).toBe('idea')
    expect(blackboardOf(team).entries).toHaveLength(2)
  })

  it('rejects empty content and enforces the content cap', () => {
    const team = fixture()
    expect(() => postBlackboardEntry(team, { author: 'captain', content: '   ' })).toThrow(/must not be empty/)
    expect(() => postBlackboardEntry(team, {
      author: 'captain',
      content: 'x'.repeat(BLACKBOARD_MAX_CONTENT + 1),
    })).toThrow(/too long/)
  })

  it('trims the oldest unpinned entries but keeps pinned ones', () => {
    const team = fixture()
    postBlackboardEntry(team, { author: 'captain', content: 'pinned', pinned: true })
    for (let index = 0; index < BLACKBOARD_MAX_ENTRIES; index += 1) {
      postBlackboardEntry(team, { author: 'captain', content: `entry ${index}` })
    }
    const board = blackboardOf(team)
    expect(board.entries).toHaveLength(BLACKBOARD_MAX_ENTRIES)
    expect(board.entries.some((entry) => entry.content === 'pinned')).toBe(true)
  })

  it('records, switches and clears one vote per participant', () => {
    const team = fixture()
    postBlackboardEntry(team, { author: 'captain', content: 'proposal', kind: 'proposal' })
    const first = voteBlackboardEntry(team, { entryId: 'bb-1', voter: 'alice', vote: 'up' })
    expect(first.tally).toEqual({ up: 1, down: 0 })
    const switched = voteBlackboardEntry(team, { entryId: 'bb-1', voter: 'alice', vote: 'down' })
    expect(switched.tally).toEqual({ up: 0, down: 1 })
    const cleared = voteBlackboardEntry(team, { entryId: 'bb-1', voter: 'alice', vote: 'clear' })
    expect(cleared.tally).toEqual({ up: 0, down: 0 })
    expect(cleared.entry.votes).toBeUndefined()
    expect(() => voteBlackboardEntry(team, { entryId: 'bb-404', voter: 'alice', vote: 'up' })).toThrow(/no blackboard entry/)
  })

  it('reads a filtered suffix and reports the total', () => {
    const team = fixture()
    postBlackboardEntry(team, { author: 'captain', content: 'a', kind: 'note' })
    postBlackboardEntry(team, { author: 'alice', content: 'b', kind: 'idea' })
    postBlackboardEntry(team, { author: 'alice', content: 'c', kind: 'idea' })
    const all = readBlackboard(team, {})
    expect(all.total).toBe(3)
    expect(all.entries.map((entry) => entry.id)).toEqual(['bb-1', 'bb-2', 'bb-3'])
    const ideas = readBlackboard(team, { kind: 'idea' })
    expect(ideas.total).toBe(2)
    expect(ideas.entries.every((entry) => entry.kind === 'idea')).toBe(true)
    const limited = readBlackboard(team, { limit: 1 })
    expect(limited.entries.map((entry) => entry.id)).toEqual(['bb-3'])
    expect(limited.total).toBe(3)
    postBlackboardEntry(team, { author: 'captain', content: 'pinned note', pinned: true })
    const pinnedFirst = readBlackboard(team, { limit: 1 })
    expect(pinnedFirst.entries.map((entry) => entry.id)).toEqual(['bb-4', 'bb-3'])
    expect(pinnedFirst.total).toBe(4)
  })

  it('renders a model-facing feed with votes', () => {
    const team = fixture()
    postBlackboardEntry(team, { author: 'alice', content: 'add dark mode', kind: 'proposal' })
    voteBlackboardEntry(team, { entryId: 'bb-1', voter: 'captain', vote: 'up' })
    const read = readBlackboard(team, {})
    const text = renderBlackboard(read.entries, read.total)
    expect(text).toContain('add dark mode')
    expect(text).toContain('bb-1')
    expect(text).toContain('▲1 ▼0')
    expect(text).toContain('+captain')
  })

  it('summarizes the board for status and clears it', () => {
    const team = fixture()
    postBlackboardEntry(team, { author: 'alice', content: 'one' })
    postBlackboardEntry(team, { author: 'bob', content: 'two' })
    voteBlackboardEntry(team, { entryId: 'bb-2', voter: 'alice', vote: 'down' })
    const status = blackboardStatus(team)
    expect(status?.count).toBe(2)
    expect(status?.latest).toHaveLength(2)
    expect(status?.latest[1]).toMatchObject({ id: 'bb-2', author: 'bob', down: 1 })
    const second = blackboardOf(team).entries[1]
    expect(second === undefined ? undefined : tallyOf(second)).toEqual({ up: 0, down: 1 })
    expect(clearBlackboard(team)).toBe(2)
    expect(blackboardOf(team).entries).toHaveLength(0)
    expect(blackboardOf(team).seq).toBe(2)
  })
})

describe('blackboard tools', () => {
  it('lets the captain and members post to and read the same board', async () => {
    const { workspace, stateRoot } = await seedWorkspace()
    try {
      const tools = createBlackboardTools(fakeCtx(), config)
      const post = toolNamed(tools, 'deers_team_blackboard_post')
      const read = toolNamed(tools, 'deers_team_blackboard_read')

      const captainPost = await post.execute(
        { content: 'feature voting: dark mode', kind: 'proposal' },
        execFor(workspace, CAPTAIN),
      ) as { entry_id: string; author: string; kind: string }
      expect(captainPost.author).toBe('captain')
      expect(captainPost.kind).toBe('proposal')

      const memberPost = await post.execute(
        { content: 'add keyboard shortcuts', kind: 'idea' },
        execFor(workspace, MEMBER),
      ) as { entry_id: string; author: string }
      expect(memberPost.author).toBe('alice')

      const board = await read.execute({}, execFor(workspace, MEMBER)) as {
        total: number
        entries: { id: string; author: string; content: string }[]
      }
      expect(board.total).toBe(2)
      expect(board.entries.map((entry) => entry.author)).toEqual(['captain', 'alice'])

      const persisted = await readTeam(stateRoot, 'blackboard-fixture')
      expect(persisted?.blackboard?.entries).toHaveLength(2)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('records member votes and reflects them in captain reads', async () => {
    const { workspace } = await seedWorkspace()
    try {
      const tools = createBlackboardTools(fakeCtx(), config)
      const post = toolNamed(tools, 'deers_team_blackboard_post')
      const vote = toolNamed(tools, 'deers_team_blackboard_vote')
      const read = toolNamed(tools, 'deers_team_blackboard_read')

      await post.execute({ content: 'ship it', kind: 'proposal' }, execFor(workspace, CAPTAIN))
      const voted = await vote.execute({ entry_id: 'bb-1', vote: 'up' }, execFor(workspace, MEMBER)) as {
        votes_up: number
        votes_down: number
      }
      expect(voted.votes_up).toBe(1)
      expect(voted.votes_down).toBe(0)

      const board = await read.execute({}, execFor(workspace, CAPTAIN)) as {
        entries: { votes_up: number; voters_up: string[] }[]
      }
      expect(board.entries[0]?.voters_up).toEqual(['alice'])
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('rejects pinning and clearing from members', async () => {
    const { workspace } = await seedWorkspace()
    try {
      const tools = createBlackboardTools(fakeCtx(), config)
      const post = toolNamed(tools, 'deers_team_blackboard_post')
      const clear = toolNamed(tools, 'deers_team_blackboard_clear')

      await expect(post.execute(
        { content: 'pinned', pinned: true },
        execFor(workspace, MEMBER),
      )).rejects.toThrow(/only the captain may pin/)

      await expect(clear.execute({ confirm: true }, execFor(workspace, MEMBER)))
        .rejects.toThrow(/only the captain may clear/)
      await expect(clear.execute({ confirm: false }, execFor(workspace, CAPTAIN)))
        .rejects.toThrow(/confirm: true/)
      const cleared = await clear.execute({ confirm: true }, execFor(workspace, CAPTAIN)) as { removed: number }
      expect(cleared.removed).toBe(0)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('rejects callers without an active team', async () => {
    const { workspace } = await seedWorkspace()
    try {
      const tools = createBlackboardTools(fakeCtx(), config)
      const post = toolNamed(tools, 'deers_team_blackboard_post')
      await expect(post.execute(
        { content: 'orphan' },
        execFor(workspace, 'session-not-in-team'),
      )).rejects.toThrow(/do not lead or belong to any active team/)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})

describe('panel writes (human as captain)', () => {
  it('posts as captain, persists, and rejects other sessions', async () => {
    const { workspace, stateRoot } = await seedWorkspace()
    try {
      const posted = await appendCaptainBlackboardEntry({
        stateRoot,
        teamId: 'blackboard-fixture',
        captainId: CAPTAIN,
        content: 'idea from the human',
        kind: 'proposal',
      })
      expect(posted.author).toBe('captain')
      expect(posted.kind).toBe('proposal')
      expect(posted.count).toBe(1)

      const team = await readTeam(stateRoot, 'blackboard-fixture')
      expect(team?.blackboard?.entries[0]?.content).toBe('idea from the human')

      await expect(appendCaptainBlackboardEntry({
        stateRoot,
        teamId: 'blackboard-fixture',
        captainId: 'session-someone-else',
        content: 'not allowed',
      })).rejects.toThrow(/only the captain/)
      await expect(appendCaptainBlackboardEntry({
        stateRoot,
        teamId: 'blackboard-fixture',
        captainId: CAPTAIN,
        content: '   ',
      })).rejects.toThrow(/must not be empty/)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('votes and clears as captain with persisted tallies', async () => {
    const { workspace, stateRoot } = await seedWorkspace()
    try {
      const posted = await appendCaptainBlackboardEntry({
        stateRoot,
        teamId: 'blackboard-fixture',
        captainId: CAPTAIN,
        content: 'ship dark mode?',
        kind: 'proposal',
      })
      const up = await castCaptainBlackboardVote({
        stateRoot,
        teamId: 'blackboard-fixture',
        captainId: CAPTAIN,
        entryId: posted.entryId,
        vote: 'up',
      })
      expect(up).toEqual({ entryId: posted.entryId, votesUp: 1, votesDown: 0 })
      const down = await castCaptainBlackboardVote({
        stateRoot,
        teamId: 'blackboard-fixture',
        captainId: CAPTAIN,
        entryId: posted.entryId,
        vote: 'down',
      })
      expect(down).toEqual({ entryId: posted.entryId, votesUp: 0, votesDown: 1 })
      const cleared = await castCaptainBlackboardVote({
        stateRoot,
        teamId: 'blackboard-fixture',
        captainId: CAPTAIN,
        entryId: posted.entryId,
        vote: 'clear',
      })
      expect(cleared).toEqual({ entryId: posted.entryId, votesUp: 0, votesDown: 0 })
      await expect(castCaptainBlackboardVote({
        stateRoot,
        teamId: 'blackboard-fixture',
        captainId: CAPTAIN,
        entryId: 'bb-404',
        vote: 'up',
      })).rejects.toThrow(/no blackboard entry/)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})
