/**
 * Team polls: formal single- or multi-choice voting, separate from the
 * blackboard.
 *
 * A poll has explicit options, one ballot per participant, an optional
 * deadline, a threshold rule and a quorum. The captain (or the human in the Web
 * panel) creates and closes polls; every participant casts a ballot. Closing
 * evaluates the ballots once and writes an immutable decision, mirroring the
 * DeerSuperGroup poll model (single/multi, threshold, quorum, decision,
 * ballot revisions and voter types).
 * @module deers-dsh-agent-team/polls
 */

import type {
  PollBallotMeta,
  PollDecision,
  PollOption,
  PollState,
  PollThresholdRule,
  TeamPoll,
  TeamState,
} from './types.ts'

/** Hard cap on retained polls. */
export const POLL_MAX_POLLS = 50
/** Option-count bounds. */
export const POLL_MIN_OPTIONS = 2
export const POLL_MAX_OPTIONS = 10
/** Field bounds. */
export const POLL_MAX_TITLE = 200
export const POLL_MAX_DESCRIPTION = 1000
export const POLL_MAX_LABEL = 120

export const POLL_THRESHOLD_RULES: readonly PollThresholdRule[] = ['majority', 'gt', 'percent']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pollIdNumber(id: string): number {
  const match = /^poll-(\d+)$/.exec(id)
  return match === null ? 0 : Number(match[1])
}

function normalizeOption(raw: unknown, index: number): PollOption | undefined {
  if (!isRecord(raw)) return undefined
  const id = typeof raw['id'] === 'string' && raw['id'] !== '' ? raw['id'] : `o${index + 1}`
  const label = typeof raw['label'] === 'string' ? raw['label'].trim() : ''
  if (label === '') return undefined
  return { id, label: label.slice(0, POLL_MAX_LABEL) }
}

function normalizeBallot(raw: unknown, optionIds: ReadonlySet<string>, multiSelect: boolean): string[] {
  if (!Array.isArray(raw)) return []
  const picked = raw.filter((value): value is string => typeof value === 'string' && optionIds.has(value))
  const unique = [...new Set(picked)]
  return multiSelect ? unique : unique.slice(0, 1)
}

function isThresholdRule(value: unknown): value is PollThresholdRule {
  return value === 'majority' || value === 'gt' || value === 'percent'
}

function normalizeThresholdValue(rule: PollThresholdRule, raw: unknown): number | undefined {
  if (rule === 'majority' || typeof raw !== 'number' || !Number.isFinite(raw)) return undefined
  const value = Math.trunc(raw)
  if (rule === 'gt') return value >= 1 ? value : undefined
  return value >= 1 && value <= 100 ? value : undefined
}

function normalizeBallotMeta(raw: unknown): Record<string, PollBallotMeta> | undefined {
  if (!isRecord(raw)) return undefined
  const meta: Record<string, PollBallotMeta> = {}
  for (const [voter, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue
    const revision = typeof value['revision'] === 'number' && Number.isSafeInteger(value['revision']) && value['revision'] >= 1
      ? value['revision']
      : 1
    const voterType = value['voterType'] === 'captain' ? 'captain' : 'member'
    const updatedAt = typeof value['updatedAt'] === 'number' && Number.isFinite(value['updatedAt']) ? value['updatedAt'] : 0
    meta[voter] = { revision, voterType, updatedAt }
  }
  return Object.keys(meta).length === 0 ? undefined : meta
}

function normalizeDecision(raw: unknown, optionIds: ReadonlySet<string>, poll: TeamPoll): PollDecision | undefined {
  if (!isRecord(raw)) return undefined
  const rule = isThresholdRule(raw['thresholdRule']) ? raw['thresholdRule'] : (poll.thresholdRule ?? 'majority')
  const adopted = Array.isArray(raw['adoptedOptionIds'])
    ? raw['adoptedOptionIds'].filter((value): value is string => typeof value === 'string' && optionIds.has(value))
    : []
  const thresholdValue = normalizeThresholdValue(rule, raw['thresholdValue'])
  return {
    adoptedOptionIds: [...new Set(adopted)],
    insufficientQuorum: raw['insufficientQuorum'] === true,
    quorum: typeof raw['quorum'] === 'number' && Number.isFinite(raw['quorum']) ? Math.max(0, Math.trunc(raw['quorum'])) : 1,
    totalVoters: typeof raw['totalVoters'] === 'number' && Number.isFinite(raw['totalVoters']) ? Math.max(0, Math.trunc(raw['totalVoters'])) : 0,
    thresholdRule: rule,
    ...thresholdValue === undefined ? {} : { thresholdValue },
    summary: typeof raw['summary'] === 'string' ? raw['summary'].slice(0, 2000) : '',
    decidedAt: typeof raw['decidedAt'] === 'number' && Number.isFinite(raw['decidedAt']) ? raw['decidedAt'] : (poll.closedAt ?? poll.createdAt),
    decidedBy: typeof raw['decidedBy'] === 'string' ? raw['decidedBy'] : (poll.closedBy ?? poll.createdBy),
  }
}

/**
 * Coerce one persisted poll store into the canonical shape, dropping invalid
 * polls/options/votes instead of failing the team record.
 */
export function normalizePolls(raw: unknown): PollState {
  if (!isRecord(raw)) return { seq: 0, polls: [] }
  const rawPolls = Array.isArray(raw['polls']) ? raw['polls'] : []
  const polls: TeamPoll[] = []
  for (const item of rawPolls) {
    if (!isRecord(item)) continue
    const id = typeof item['id'] === 'string' && item['id'] !== '' ? item['id'] : ''
    const title = typeof item['title'] === 'string' ? item['title'].trim() : ''
    if (id === '' || title === '') continue
    const options = (Array.isArray(item['options']) ? item['options'] : [])
      .map((option, index) => normalizeOption(option, index))
      .filter((option): option is PollOption => option !== undefined)
      .slice(0, POLL_MAX_OPTIONS)
    if (options.length < POLL_MIN_OPTIONS) continue
    const optionIds = new Set(options.map((option) => option.id))
    const multiSelect = item['multiSelect'] === true
    const rawMax = typeof item['maxSelections'] === 'number' && Number.isSafeInteger(item['maxSelections'])
      ? item['maxSelections']
      : undefined
    const maxSelections = multiSelect && rawMax !== undefined
      ? Math.max(2, Math.min(options.length, rawMax))
      : undefined
    const votes: Record<string, string[]> = {}
    if (isRecord(item['votes'])) {
      for (const [voter, ballot] of Object.entries(item['votes'])) {
        const picked = normalizeBallot(ballot, optionIds, multiSelect)
        if (picked.length > 0) votes[voter] = picked
      }
    }
    const thresholdRule = isThresholdRule(item['thresholdRule']) ? item['thresholdRule'] : 'majority'
    const thresholdValue = normalizeThresholdValue(thresholdRule, item['thresholdValue'])
    const quorum = typeof item['quorum'] === 'number' && Number.isSafeInteger(item['quorum']) && item['quorum'] >= 1
      ? item['quorum']
      : 1
    const status = item['status'] === 'closed' ? 'closed' : 'open'
    const createdAt = typeof item['createdAt'] === 'number' && Number.isFinite(item['createdAt']) ? item['createdAt'] : 0
    const closesAt = typeof item['closesAt'] === 'number' && Number.isFinite(item['closesAt']) ? item['closesAt'] : undefined
    const closedAt = typeof item['closedAt'] === 'number' && Number.isFinite(item['closedAt']) ? item['closedAt'] : undefined
    const ballotMeta = normalizeBallotMeta(item['ballotMeta'])
    const poll: TeamPoll = {
      id,
      title: title.slice(0, POLL_MAX_TITLE),
      ...typeof item['description'] === 'string' && item['description'].trim() !== ''
        ? { description: item['description'].trim().slice(0, POLL_MAX_DESCRIPTION) }
        : {},
      options,
      multiSelect,
      ...maxSelections === undefined ? {} : { maxSelections },
      thresholdRule,
      ...thresholdValue === undefined ? {} : { thresholdValue },
      quorum,
      ...item['anonymous'] === true ? { anonymous: true } : {},
      createdBy: typeof item['createdBy'] === 'string' ? item['createdBy'] : 'captain',
      createdAt,
      ...closesAt === undefined ? {} : { closesAt },
      ...closedAt === undefined ? {} : { closedAt },
      ...typeof item['closedBy'] === 'string' ? { closedBy: item['closedBy'] } : {},
      status,
      ...Object.keys(votes).length === 0 ? {} : { votes },
      ...ballotMeta === undefined ? {} : { ballotMeta },
    }
    const decision = normalizeDecision(item['decision'], optionIds, poll)
    if (decision !== undefined) poll.decision = decision
    polls.push(poll)
  }
  const seq = typeof raw['seq'] === 'number' && Number.isSafeInteger(raw['seq']) && raw['seq'] >= 0
    ? raw['seq']
    : polls.reduce((max, poll) => Math.max(max, pollIdNumber(poll.id)), 0)
  return { seq, polls: polls.slice(-POLL_MAX_POLLS) }
}

/** The team's polls, normalized; absence means no polls. */
export function pollsOf(team: Pick<TeamState, 'polls'>): PollState {
  return normalizePolls(team.polls)
}

function ensurePolls(team: TeamState): PollState {
  const state = normalizePolls(team.polls)
  team.polls = state
  return state
}

/** Whether a poll accepts ballots right now. */
export function isPollOpen(poll: TeamPoll, now = Date.now()): boolean {
  if (poll.status !== 'open' || poll.closedAt !== undefined) return false
  return poll.closesAt === undefined || poll.closesAt > now
}

/** Effective display state (`open` / `closed` / `expired`). */
export function pollDisplayStatus(poll: TeamPoll, now = Date.now()): 'open' | 'closed' | 'expired' {
  if (poll.status === 'closed' || poll.closedAt !== undefined) return 'closed'
  if (poll.closesAt !== undefined && poll.closesAt <= now) return 'expired'
  return 'open'
}

/** Create one poll; validates options, mode, threshold, quorum and deadline. */
export function createPoll(team: TeamState, input: {
  author: string
  title: string
  description?: string
  options: readonly string[]
  multiSelect?: boolean
  maxSelections?: number
  thresholdRule?: PollThresholdRule
  thresholdValue?: number
  quorum?: number
  anonymous?: boolean
  closesAt?: number
  now?: number
}): TeamPoll {
  const now = input.now ?? Date.now()
  const title = String(input.title ?? '').trim()
  if (title === '') throw new Error('poll title must not be empty')
  if (title.length > POLL_MAX_TITLE) throw new Error(`poll title is too long (limit ${POLL_MAX_TITLE})`)
  const labels = input.options.map((label) => String(label ?? '').trim()).filter((label) => label !== '')
  if (labels.length < POLL_MIN_OPTIONS) throw new Error(`a poll needs at least ${POLL_MIN_OPTIONS} options`)
  if (labels.length > POLL_MAX_OPTIONS) throw new Error(`a poll supports at most ${POLL_MAX_OPTIONS} options`)
  if (new Set(labels).size !== labels.length) throw new Error('poll options must be unique')
  const options: PollOption[] = labels.map((label, index) => ({
    id: `o${index + 1}`,
    label: label.slice(0, POLL_MAX_LABEL),
  }))
  const multiSelect = input.multiSelect === true
  let maxSelections: number | undefined
  if (multiSelect && input.maxSelections !== undefined) {
    const value = Math.trunc(input.maxSelections)
    if (!Number.isFinite(value) || value < 2 || value > options.length) {
      throw new Error(`maxSelections must be between 2 and ${options.length}`)
    }
    maxSelections = value
  }
  const thresholdRule = input.thresholdRule ?? 'majority'
  if (!isThresholdRule(thresholdRule)) throw new Error('thresholdRule must be majority, gt or percent')
  let thresholdValue: number | undefined
  if (thresholdRule !== 'majority') {
    if (input.thresholdValue === undefined || !Number.isFinite(input.thresholdValue)) {
      throw new Error(`thresholdValue is required for the ${thresholdRule} threshold rule`)
    }
    const value = Math.trunc(input.thresholdValue)
    if (thresholdRule === 'gt' && value < 1) throw new Error('thresholdValue for gt must be at least 1')
    if (thresholdRule === 'percent' && (value < 1 || value > 100)) throw new Error('thresholdValue for percent must be between 1 and 100')
    thresholdValue = value
  }
  const quorum = input.quorum === undefined ? 1 : Math.trunc(input.quorum)
  if (!Number.isFinite(quorum) || quorum < 1) throw new Error('quorum must be at least 1')
  if (input.closesAt !== undefined && (!Number.isFinite(input.closesAt) || input.closesAt <= now)) {
    throw new Error('closesAt must be a future timestamp')
  }
  const state = ensurePolls(team)
  const seq = state.seq + 1
  state.seq = seq
  const description = String(input.description ?? '').trim()
  const poll: TeamPoll = {
    id: `poll-${seq}`,
    title: title.slice(0, POLL_MAX_TITLE),
    ...description === '' ? {} : { description: description.slice(0, POLL_MAX_DESCRIPTION) },
    options,
    multiSelect,
    ...maxSelections === undefined ? {} : { maxSelections },
    thresholdRule,
    ...thresholdValue === undefined ? {} : { thresholdValue },
    quorum,
    ...input.anonymous === true ? { anonymous: true } : {},
    createdBy: String(input.author),
    createdAt: now,
    ...input.closesAt === undefined ? {} : { closesAt: input.closesAt },
    status: 'open',
  }
  state.polls.push(poll)
  while (state.polls.length > POLL_MAX_POLLS) state.polls.shift()
  return poll
}

/** One vote tally line. */
export interface PollOptionTally {
  id: string
  label: string
  votes: number
  voters: string[]
  /** Voter identity → captain/member, when audit metadata exists. */
  voterTypes?: Record<string, 'captain' | 'member'>
}

/** One poll as returned by a read. */
export interface PollRow {
  id: string
  title: string
  description?: string
  multiSelect: boolean
  maxSelections?: number
  thresholdRule: PollThresholdRule
  thresholdValue?: number
  quorum: number
  anonymous: boolean
  createdBy: string
  createdAt: number
  closesAt?: number
  closedAt?: number
  closedBy?: string
  status: 'open' | 'closed' | 'expired'
  options: PollOptionTally[]
  totalVoters: number
  myVotes: string[]
  myRevision?: number
  myVoterType?: 'captain' | 'member'
  decision?: PollDecision
}

/** Ballot validation + storage for one participant. */
export function castPollVote(team: TeamState, input: {
  pollId: string
  voter: string
  /** `captain` for the human seat; defaults from the voter name. */
  voterType?: 'captain' | 'member'
  optionIds: readonly string[]
  now?: number
}): { poll: TeamPoll; selected: string[]; tallies: PollOptionTally[]; revision: number } {
  const now = input.now ?? Date.now()
  const state = ensurePolls(team)
  const poll = state.polls.find((candidate) => candidate.id === input.pollId)
  if (poll === undefined) throw new Error(`no poll "${input.pollId}" in team "${team.name}"`)
  if (!isPollOpen(poll, now)) {
    throw new Error(`poll "${poll.id}" is ${pollDisplayStatus(poll, now)}; no more ballots are accepted`)
  }
  const validIds = new Set(poll.options.map((option) => option.id))
  const selected = [...new Set(input.optionIds)]
  for (const optionId of selected) {
    if (!validIds.has(optionId)) throw new Error(`unknown poll option "${optionId}" in ${poll.id}`)
  }
  if (!poll.multiSelect) {
    if (selected.length > 1) throw new Error(`poll "${poll.id}" is single-choice; pick at most one option`)
  } else {
    const cap = poll.maxSelections ?? poll.options.length
    if (selected.length > cap) throw new Error(`poll "${poll.id}" allows at most ${cap} selections`)
  }
  const previous = poll.ballotMeta?.[input.voter]?.revision ?? 0
  const revision = previous + 1
  const voterType = input.voterType ?? (input.voter === 'captain' ? 'captain' : 'member')
  if (selected.length === 0) {
    if (poll.votes !== undefined) delete poll.votes[input.voter]
  } else {
    poll.votes = { ...(poll.votes ?? {}), [input.voter]: selected }
  }
  if (poll.votes !== undefined && Object.keys(poll.votes).length === 0) delete poll.votes
  poll.ballotMeta = { ...(poll.ballotMeta ?? {}), [input.voter]: { revision, voterType, updatedAt: now } }
  return { poll, selected, tallies: tallyPoll(poll), revision }
}

/** Evaluate tallies against the poll's threshold rule and quorum. */
export function evaluatePoll(poll: TeamPoll): {
  totalVoters: number
  quorum: number
  quorumMet: boolean
  thresholdRule: PollThresholdRule
  thresholdValue?: number
  tallies: PollOptionTally[]
  adoptedOptionIds: string[]
  insufficientQuorum: boolean
  summary: string
} {
  const tallies = tallyPoll(poll)
  const totalVoters = Object.keys(poll.votes ?? {}).length
  const quorum = poll.quorum ?? 1
  const thresholdRule = poll.thresholdRule ?? 'majority'
  const thresholdValue = poll.thresholdValue
  const quorumMet = totalVoters >= quorum
  const adoptedOptionIds: string[] = []
  if (quorumMet && totalVoters > 0) {
    for (const tally of tallies) {
      let reached = false
      if (thresholdRule === 'majority') reached = tally.votes > totalVoters / 2
      else if (thresholdRule === 'gt') reached = tally.votes > (thresholdValue ?? 1)
      else reached = (tally.votes / totalVoters) * 100 >= (thresholdValue ?? 50)
      if (reached && tally.votes > 0) adoptedOptionIds.push(tally.id)
    }
  }
  const ruleText = thresholdRule === 'majority'
    ? 'majority'
    : thresholdRule === 'gt' ? `> ${thresholdValue ?? 1} votes` : `≥ ${thresholdValue ?? 50}%`
  let summary: string
  if (!quorumMet) {
    summary = `Quorum not met: ${totalVoters}/${quorum} ballots; no option adopted (rule ${ruleText}).`
  } else if (adoptedOptionIds.length === 0) {
    summary = `No option reached ${ruleText}; none adopted (${totalVoters}/${quorum} ballots).`
  } else {
    const labels = adoptedOptionIds
      .map((id) => tallies.find((tally) => tally.id === id))
      .filter((tally): tally is PollOptionTally => tally !== undefined)
      .map((tally) => `${tally.label} (${tally.votes}/${totalVoters})`)
    summary = `Adopted: ${labels.join(', ')} — rule ${ruleText}, quorum ${quorum} met.`
  }
  return {
    totalVoters,
    quorum,
    quorumMet,
    thresholdRule,
    ...thresholdValue === undefined ? {} : { thresholdValue },
    tallies,
    adoptedOptionIds,
    insufficientQuorum: !quorumMet,
    summary,
  }
}

/** Close one poll (idempotent) and freeze its decision. */
export function closePoll(team: TeamState, pollId: string, options: {
  closedBy?: string
  now?: number
} = {}): TeamPoll {
  const now = options.now ?? Date.now()
  const state = ensurePolls(team)
  const poll = state.polls.find((candidate) => candidate.id === pollId)
  if (poll === undefined) throw new Error(`no poll "${pollId}" in team "${team.name}"`)
  if (poll.status === 'closed') return poll
  const evaluation = evaluatePoll(poll)
  const decision: PollDecision = {
    adoptedOptionIds: evaluation.adoptedOptionIds,
    insufficientQuorum: evaluation.insufficientQuorum,
    quorum: evaluation.quorum,
    totalVoters: evaluation.totalVoters,
    thresholdRule: evaluation.thresholdRule,
    ...evaluation.thresholdValue === undefined ? {} : { thresholdValue: evaluation.thresholdValue },
    summary: evaluation.summary,
    decidedAt: now,
    decidedBy: options.closedBy ?? 'captain',
  }
  poll.status = 'closed'
  poll.closedAt = now
  poll.closedBy = decision.decidedBy
  poll.decision = decision
  return poll
}

/** Option tallies for one poll. */
export function tallyPoll(poll: TeamPoll): PollOptionTally[] {
  const ballots = Object.entries(poll.votes ?? {})
  return poll.options.map((option) => {
    const voters = ballots
      .filter(([, ballot]) => ballot.includes(option.id))
      .map(([voter]) => voter)
    const voterTypes: Record<string, 'captain' | 'member'> = {}
    for (const voter of voters) {
      const meta = poll.ballotMeta?.[voter]
      voterTypes[voter] = meta?.voterType ?? (voter === 'captain' ? 'captain' : 'member')
    }
    return {
      id: option.id,
      label: option.label,
      votes: voters.length,
      voters,
      ...voters.length === 0 ? {} : { voterTypes },
    }
  })
}

/** Read polls (newest first), optionally filtered by state, with the viewer's ballots. */
export function readPolls(team: TeamState, query: {
  viewer?: string
  status?: 'open' | 'closed' | 'expired'
  limit?: number
  now?: number
} = {}): { rows: PollRow[]; total: number } {
  const now = query.now ?? Date.now()
  const state = ensurePolls(team)
  const filtered = state.polls.filter((poll) => (
    query.status === undefined || pollDisplayStatus(poll, now) === query.status
  ))
  const limit = Math.max(1, Math.min(POLL_MAX_POLLS, Math.trunc(query.limit ?? 20)))
  const rows = filtered.slice(-limit).reverse().map((poll): PollRow => {
    const tallies = tallyPoll(poll)
    const anonymous = poll.anonymous === true
    const meta = query.viewer === undefined ? undefined : poll.ballotMeta?.[query.viewer]
    return {
      id: poll.id,
      title: poll.title,
      ...poll.description === undefined ? {} : { description: poll.description },
      multiSelect: poll.multiSelect,
      ...poll.maxSelections === undefined ? {} : { maxSelections: poll.maxSelections },
      thresholdRule: poll.thresholdRule ?? 'majority',
      ...poll.thresholdValue === undefined ? {} : { thresholdValue: poll.thresholdValue },
      quorum: poll.quorum ?? 1,
      anonymous,
      createdBy: poll.createdBy,
      createdAt: poll.createdAt,
      ...poll.closesAt === undefined ? {} : { closesAt: poll.closesAt },
      ...poll.closedAt === undefined ? {} : { closedAt: poll.closedAt },
      ...poll.closedBy === undefined ? {} : { closedBy: poll.closedBy },
      status: pollDisplayStatus(poll, now),
      options: anonymous
        ? tallies.map((tally) => ({ id: tally.id, label: tally.label, votes: tally.votes, voters: [] }))
        : tallies,
      totalVoters: Object.keys(poll.votes ?? {}).length,
      myVotes: query.viewer === undefined ? [] : [...(poll.votes?.[query.viewer] ?? [])],
      ...meta === undefined ? {} : { myRevision: meta.revision, myVoterType: meta.voterType },
      ...poll.decision === undefined ? {} : { decision: poll.decision },
    }
  })
  return { rows, total: filtered.length }
}

function ruleText(row: PollRow): string {
  if (row.thresholdRule === 'majority') return 'majority'
  if (row.thresholdRule === 'gt') return `> ${row.thresholdValue ?? 1} votes`
  return `≥ ${row.thresholdValue ?? 50}%`
}

/** Model-facing text for a poll read. */
export function renderPolls(rows: readonly PollRow[], total: number, viewer?: string): string {
  if (rows.length === 0) return 'No polls yet. Create one with deers_team_vote_create.'
  const lines = [`Polls (${rows.length} of ${total}; newest first${viewer === undefined ? '' : `, viewer ${viewer}`}):`]
  for (const row of rows) {
    const mode = row.multiSelect
      ? `multi${row.maxSelections === undefined ? '' : ` (max ${row.maxSelections})`}`
      : 'single'
    const deadline = row.closesAt === undefined ? '' : ` · closes ${new Date(row.closesAt).toISOString()}`
    const anonymity = row.anonymous ? ' · anonymous' : ''
    lines.push(
      `[${row.id}] ${row.title} — ${row.status} · ${mode} · rule ${ruleText(row)} · quorum ${row.quorum}`
      + `${anonymity} · by ${row.createdBy}${deadline}`,
      ...row.options.map((option) => (
        `  - ${option.id} ${option.label}: ${option.votes}`
        + `${option.voters.length === 0 ? '' : ` (${option.voters.join(', ')})`}`
      )),
      `  ballots: ${row.totalVoters}${row.myVotes.length === 0 ? '' : ` · you voted: ${row.myVotes.join(', ')}`}`
      + `${row.myRevision === undefined ? '' : ` (revision ${row.myRevision})`}`,
    )
    if (row.decision !== undefined) {
      lines.push(`  decision: ${row.decision.adoptedOptionIds.length === 0 ? 'none adopted' : `adopted ${row.decision.adoptedOptionIds.join(', ')}`} — ${row.decision.summary}`)
    }
  }
  return lines.join('\n')
}

/** Compact open-poll summary for digest/status. */
export function pollsDigest(team: Pick<TeamState, 'polls'>, now = Date.now()): {
  open: number
  total: number
  items: {
    id: string
    title: string
    multiSelect: boolean
    totalVoters: number
    thresholdRule: PollThresholdRule
    quorum: number
    leading: { label: string; votes: number }[]
  }[]
} | undefined {
  const state = normalizePolls(team.polls)
  if (state.polls.length === 0) return undefined
  const open = state.polls.filter((poll) => isPollOpen(poll, now))
  return {
    open: open.length,
    total: state.polls.length,
    items: open.slice(-3).map((poll) => ({
      id: poll.id,
      title: poll.title,
      multiSelect: poll.multiSelect,
      totalVoters: Object.keys(poll.votes ?? {}).length,
      thresholdRule: poll.thresholdRule ?? 'majority',
      quorum: poll.quorum ?? 1,
      leading: tallyPoll(poll)
        .slice()
        .sort((left, right) => right.votes - left.votes)
        .slice(0, 2)
        .map((option) => ({ label: option.label, votes: option.votes })),
    })),
  }
}
