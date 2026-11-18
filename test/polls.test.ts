import { describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import {
  castPollVote,
  closePoll,
  createPoll,
  normalizePolls,
  pollsDigest,
  readPolls,
  renderPolls,
} from '../src/polls.ts'
import { createTeamDir, readTeam } from '../src/state.ts'
import type { ToolsConfig } from '../src/tools.ts'
import {
  castCaptainPollVote,
  closeCaptainPoll,
  createCaptainPoll,
  createPollTools,
} from '../src/tools/polls.ts'
import type { TeamState } from '../src/types.ts'

const config: ToolsConfig = {
  stateDir: '.deers-agent-team',
  memberProvider: 'spawn',
  maxMembers: 8,
  profiles: {},
}

const CAPTAIN = 'session-poll-captain'
const ALICE = 'session-poll-alice'
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
    name: 'poll-fixture',
    id: 'poll-fixture',
    description: 'poll fixture',
    captainSessionId: CAPTAIN,
    createdAt: NOW,
    phase: 'running',
    members: [{ id: ALICE, name: 'alice', role: 'engineer', joinedAt: NOW, status: 'idle' }],
    tasks: [],
    taskSeq: 0,
  }
}

describe('poll state helpers', () => {
  it('creates single- and multi-choice polls with validation', () => {
    const team = fixture()
    const single = createPoll(team, { author: 'captain', title: 'Lunch?', options: ['Pizza', 'Noodles'], now: NOW })
    expect(single.id).toBe('poll-1')
    expect(single.multiSelect).toBe(false)
    expect(single.options.map((option) => option.id)).toEqual(['o1', 'o2'])
    const multi = createPoll(team, {
      author: 'captain',
      title: 'Features?',
      options: ['A', 'B', 'C'],
      multiSelect: true,
      maxSelections: 2,
      now: NOW,
    })
    expect(multi.maxSelections).toBe(2)
    expect(() => createPoll(team, { author: 'captain', title: '', options: ['A', 'B'] })).toThrow(/title/)
    expect(() => createPoll(team, { author: 'captain', title: 'x', options: ['A'] })).toThrow(/at least 2 options/)
    expect(() => createPoll(team, { author: 'captain', title: 'x', options: ['A', 'A'] })).toThrow(/unique/)
    expect(() => createPoll(team, { author: 'captain', title: 'x', options: ['A', 'B'], multiSelect: true, maxSelections: 5 })).toThrow(/maxSelections/)
  })

  it('casts single-choice ballots, switches and clears them', () => {
    const team = fixture()
    const poll = createPoll(team, { author: 'captain', title: 'Pick', options: ['A', 'B'], now: NOW })
    expect(castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1'], now: NOW }).selected).toEqual(['o1'])
    expect(castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o2'], now: NOW }).tallies[1]?.votes).toBe(1)
    expect(() => castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1', 'o2'], now: NOW }))
      .toThrow(/single-choice/)
    expect(castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: [], now: NOW }).selected).toEqual([])
    expect(readPolls(team, { now: NOW }).rows[0]?.totalVoters).toBe(0)
  })

  it('enforces the multi-choice cap and rejects unknown options', () => {
    const team = fixture()
    const poll = createPoll(team, {
      author: 'captain',
      title: 'Pick many',
      options: ['A', 'B', 'C'],
      multiSelect: true,
      maxSelections: 2,
      now: NOW,
    })
    expect(castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1', 'o2'], now: NOW }).selected).toEqual(['o1', 'o2'])
    expect(() => castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1', 'o2', 'o3'], now: NOW }))
      .toThrow(/at most 2/)
    expect(() => castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o9'], now: NOW }))
      .toThrow(/unknown poll option/)
  })

  it('closes polls, rejects late ballots and expires by deadline', () => {
    const team = fixture()
    const poll = createPoll(team, { author: 'captain', title: 'Close me', options: ['A', 'B'], now: NOW })
    expect(closePoll(team, poll.id, { now: NOW }).status).toBe('closed')
    expect(() => castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1'], now: NOW }))
      .toThrow(/closed/)
    expect(closePoll(team, poll.id, { now: NOW + 1 }).status).toBe('closed')

    const expiring = createPoll(team, {
      author: 'captain',
      title: 'Expire me',
      options: ['A', 'B'],
      closesAt: NOW + 60_000,
      now: NOW,
    })
    expect(() => castPollVote(team, { pollId: expiring.id, voter: 'alice', optionIds: ['o1'], now: NOW + 120_000 }))
      .toThrow(/expired/)
  })

  it('adopts options with the majority, gt and percent rules', () => {
    const majority = fixture()
    const mPoll = createPoll(majority, { author: 'captain', title: 'M', options: ['A', 'B'], now: NOW })
    castPollVote(majority, { pollId: mPoll.id, voter: 'captain', optionIds: ['o1'], now: NOW })
    castPollVote(majority, { pollId: mPoll.id, voter: 'alice', optionIds: ['o1'], now: NOW })
    castPollVote(majority, { pollId: mPoll.id, voter: 'bob', optionIds: ['o2'], now: NOW })
    const mDecision = closePoll(majority, mPoll.id, { now: NOW }).decision
    expect(mDecision?.adoptedOptionIds).toEqual(['o1'])
    expect(mDecision?.insufficientQuorum).toBe(false)

    const tie = fixture()
    const tiePoll = createPoll(tie, { author: 'captain', title: 'Tie', options: ['A', 'B'], now: NOW })
    castPollVote(tie, { pollId: tiePoll.id, voter: 'alice', optionIds: ['o1'], now: NOW })
    castPollVote(tie, { pollId: tiePoll.id, voter: 'bob', optionIds: ['o2'], now: NOW })
    expect(closePoll(tie, tiePoll.id, { now: NOW }).decision?.adoptedOptionIds).toEqual([])

    const gt = fixture()
    const gtPoll = createPoll(gt, {
      author: 'captain', title: 'GT', options: ['A', 'B'], thresholdRule: 'gt', thresholdValue: 1, now: NOW,
    })
    castPollVote(gt, { pollId: gtPoll.id, voter: 'alice', optionIds: ['o1'], now: NOW })
    castPollVote(gt, { pollId: gtPoll.id, voter: 'bob', optionIds: ['o1'], now: NOW })
    expect(closePoll(gt, gtPoll.id, { now: NOW }).decision?.adoptedOptionIds).toEqual(['o1'])

    const gtShort = fixture()
    const gtShortPoll = createPoll(gtShort, {
      author: 'captain', title: 'GT short', options: ['A', 'B'], thresholdRule: 'gt', thresholdValue: 1, now: NOW,
    })
    castPollVote(gtShort, { pollId: gtShortPoll.id, voter: 'alice', optionIds: ['o1'], now: NOW })
    expect(closePoll(gtShort, gtShortPoll.id, { now: NOW }).decision?.adoptedOptionIds).toEqual([])

    const percent = fixture()
    const pPoll = createPoll(percent, {
      author: 'captain', title: 'Percent', options: ['A', 'B'], thresholdRule: 'percent', thresholdValue: 60, now: NOW,
    })
    castPollVote(percent, { pollId: pPoll.id, voter: 'alice', optionIds: ['o1'], now: NOW })
    castPollVote(percent, { pollId: pPoll.id, voter: 'bob', optionIds: ['o2'], now: NOW })
    expect(closePoll(percent, pPoll.id, { now: NOW }).decision?.adoptedOptionIds).toEqual([])
  })

  it('does not adopt anything when quorum is not met', () => {
    const team = fixture()
    const poll = createPoll(team, {
      author: 'captain', title: 'Quorum', options: ['A', 'B'], quorum: 3, now: NOW,
    })
    castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1'], now: NOW })
    castPollVote(team, { pollId: poll.id, voter: 'bob', optionIds: ['o1'], now: NOW })
    const decision = closePoll(team, poll.id, { now: NOW }).decision
    expect(decision?.insufficientQuorum).toBe(true)
    expect(decision?.adoptedOptionIds).toEqual([])
    expect(decision?.summary).toMatch(/Quorum not met/)
  })

  it('tracks ballot revisions across changes and withdrawals', () => {
    const team = fixture()
    const poll = createPoll(team, { author: 'captain', title: 'Rev', options: ['A', 'B'], now: NOW })
    expect(castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1'], now: NOW }).revision).toBe(1)
    expect(castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o2'], now: NOW }).revision).toBe(2)
    expect(castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: [], now: NOW }).revision).toBe(3)
    const row = readPolls(team, { viewer: 'alice', now: NOW }).rows[0]
    expect(row?.myVotes).toEqual([])
    expect(row?.myRevision).toBe(3)
    expect(castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1'], now: NOW }).revision).toBe(4)
    expect(readPolls(team, { viewer: 'alice', now: NOW }).rows[0]?.myVoterType).toBe('member')
    expect(readPolls(team, { viewer: 'captain', now: NOW }).rows[0]?.myVoterType).toBeUndefined()
  })

  it('hides voter names when the poll is anonymous', () => {
    const team = fixture()
    const poll = createPoll(team, { author: 'captain', title: 'Anon', options: ['A', 'B'], anonymous: true, now: NOW })
    castPollVote(team, { pollId: poll.id, voter: 'alice', optionIds: ['o1'], now: NOW })
    const row = readPolls(team, { viewer: 'alice', now: NOW }).rows[0]
    expect(row?.anonymous).toBe(true)
    expect(row?.totalVoters).toBe(1)
    expect(row?.options[0]?.votes).toBe(1)
    expect(row?.options[0]?.voters).toEqual([])
    const text = renderPolls(readPolls(team, { now: NOW }).rows, 1)
    expect(text).toContain('anonymous')
    expect(text).not.toContain('alice')
  })

  it('normalizes malformed persisted polls and renders tallies', () => {
    const normalized = normalizePolls({
      seq: 3,
      polls: [
        { id: 'poll-1', title: 'ok', options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }], multiSelect: true, votes: { alice: ['o1', 'o2', 'zzz'], bob: ['o6'] } },
        { id: 'bad', title: '', options: [] },
      ],
    })
    expect(normalized.polls).toHaveLength(1)
    expect(normalized.polls[0]?.votes).toEqual({ alice: ['o1', 'o2'] })
    const team = fixture()
    team.polls = normalized
    const { rows } = readPolls(team, { viewer: 'alice', now: NOW })
    const text = renderPolls(rows, rows.length, 'alice')
    expect(text).toContain('A: 1')
    expect(rows[0]?.myVotes).toEqual(['o1', 'o2'])
  })

  it('summarizes open polls for the digest', () => {
    const team = fixture()
    createPoll(team, { author: 'captain', title: 'Open', options: ['A', 'B'], now: NOW })
    const digest = pollsDigest(team, NOW)
    expect(digest?.open).toBe(1)
    expect(digest?.items[0]?.title).toBe('Open')
  })
})

describe('poll tools and captain helpers', () => {
  it('lets the captain create a poll and a member vote, but not create/close', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-polls-'))
    try {
      const stateRoot = join(workspace, '.deers-agent-team')
      await createTeamDir(stateRoot, fixture())
      const tools = createPollTools(fakeCtx(), config)
      const create = tools.find((tool) => tool.name === 'deers_team_vote_create')
      const cast = tools.find((tool) => tool.name === 'deers_team_vote_cast')
      const read = tools.find((tool) => tool.name === 'deers_team_vote_read')
      const close = tools.find((tool) => tool.name === 'deers_team_vote_close')
      if (create === undefined || cast === undefined || read === undefined || close === undefined) throw new Error('poll tools missing')

      const created = await create.execute(
        {
          title: 'Ship feature?',
          options: ['Yes', 'No'],
          multi_select: false,
          threshold_rule: 'gt',
          threshold_value: 1,
          quorum: 2,
          anonymous: true,
        },
        execFor(workspace, CAPTAIN),
      ) as { poll_id: string; multi_select: boolean; threshold_rule: string; quorum: number; anonymous?: boolean }
      expect(created.poll_id).toBe('poll-1')
      expect(created.multi_select).toBe(false)
      expect(created.threshold_rule).toBe('gt')
      expect(created.quorum).toBe(2)
      expect(created.anonymous).toBe(true)

      await expect(create.execute(
        { title: 'Member poll', options: ['A', 'B'] },
        execFor(workspace, ALICE),
      )).rejects.toThrow(/only the captain may create/)

      const ballot = await cast.execute(
        { poll_id: created.poll_id, option_ids: ['o1'] },
        execFor(workspace, ALICE),
      ) as { selected: string[]; total_voters: number; revision: number }
      expect(ballot.selected).toEqual(['o1'])
      expect(ballot.total_voters).toBe(1)
      expect(ballot.revision).toBe(1)

      const summary = await read.execute({}, execFor(workspace, ALICE)) as { summary: string }
      expect(summary.summary).toContain('Yes: 1')
      expect(summary.summary).toContain('alice')
      expect(summary.summary).toContain('anonymous')

      await expect(close.execute({ poll_id: created.poll_id }, execFor(workspace, ALICE)))
        .rejects.toThrow(/only the captain may close/)
      const closed = await close.execute({ poll_id: created.poll_id }, execFor(workspace, CAPTAIN)) as {
        status: string
        adopted: string[]
        insufficient_quorum: boolean
        summary: string
      }
      expect(closed.status).toBe('closed')
      expect(closed.insufficient_quorum).toBe(true)
      expect(closed.adopted).toEqual([])
      expect(closed.summary).toMatch(/Quorum not met/)

      const saved = await readTeam(stateRoot, 'poll-fixture')
      expect(saved?.polls?.polls[0]?.status).toBe('closed')
      expect(saved?.polls?.polls[0]?.decision?.insufficientQuorum).toBe(true)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('exposes captain helpers used by the Web panel', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-poll-panel-'))
    try {
      const stateRoot = join(workspace, '.deers-agent-team')
      await createTeamDir(stateRoot, fixture())
      const created = await createCaptainPoll({
        stateRoot,
        teamId: 'poll-fixture',
        captainId: CAPTAIN,
        title: 'Panel poll',
        options: ['One', 'Two'],
        multiSelect: true,
        maxSelections: 2,
        thresholdRule: 'percent',
        thresholdValue: 50,
        quorum: 2,
      })
      expect(created.poll.id).toBe('poll-1')
      expect(created.poll.thresholdRule).toBe('percent')
      expect(created.poll.quorum).toBe(2)
      const voted = await castCaptainPollVote({
        stateRoot,
        teamId: 'poll-fixture',
        captainId: CAPTAIN,
        pollId: created.poll.id,
        optionIds: ['o1', 'o2'],
      })
      expect(voted.selected).toEqual(['o1', 'o2'])
      expect(voted.revision).toBe(1)
      await expect(castCaptainPollVote({
        stateRoot,
        teamId: 'poll-fixture',
        captainId: 'session-someone-else',
        pollId: created.poll.id,
        optionIds: ['o1'],
      })).rejects.toThrow(/only the captain/)
      const closed = await closeCaptainPoll({
        stateRoot,
        teamId: 'poll-fixture',
        captainId: CAPTAIN,
        pollId: created.poll.id,
      })
      expect(closed.status).toBe('closed')
      expect(closed.decision?.insufficientQuorum).toBe(true)
      expect(closed.decision?.adoptedOptionIds).toEqual([])
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})
