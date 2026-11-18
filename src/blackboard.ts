/**
 * Team blackboard: a durable shared feed for brainstorming, idea collection
 * and feature voting.
 *
 * Every participant (captain and members) can append entries and read the
 * whole feed; votes are per-participant and toggled through the tool surface.
 * The helpers here are pure state transformations over `team.blackboard`;
 * tools own locking, persistence and identity checks.
 * @module deers-dsh-agent-team/blackboard
 */

import type {
  BlackboardEntry,
  BlackboardEntryKind,
  BlackboardState,
  BlackboardVote,
  TeamState,
} from './types.ts'
import { BLACKBOARD_ENTRY_KINDS } from './types.ts'

/** Hard cap on retained entries; older (unpinned) entries are trimmed first. */
export const BLACKBOARD_MAX_ENTRIES = 200

/** Hard cap on one entry's content length. */
export const BLACKBOARD_MAX_CONTENT = 4000

/** Default and maximum number of entries a read call returns. */
export const BLACKBOARD_DEFAULT_LIMIT = 50
export const BLACKBOARD_MAX_LIMIT = 200

const KIND_SET = new Set<string>(BLACKBOARD_ENTRY_KINDS)
const VOTE_SET = new Set<string>(['up', 'down'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeVotes(raw: unknown): Record<string, BlackboardVote> | undefined {
  if (!isRecord(raw)) return undefined
  let votes: Record<string, BlackboardVote> | undefined
  for (const [voter, value] of Object.entries(raw)) {
    if (typeof value !== 'string' || !VOTE_SET.has(value)) continue
    votes ??= {}
    votes[voter] = value as BlackboardVote
  }
  return votes
}

/**
 * Coerce one persisted blackboard value into the canonical shape.
 * Invalid entries are dropped instead of bricking the whole team record.
 * @param raw - the persisted `team.blackboard` value (or anything).
 * @returns a well-formed board; an empty board when `raw` is unusable.
 */
export function normalizeBlackboard(raw: unknown): BlackboardState {
  if (!isRecord(raw)) return { seq: 0, entries: [] }
  const rawEntries = Array.isArray(raw['entries']) ? raw['entries'] : []
  const entries: BlackboardEntry[] = []
  for (const item of rawEntries) {
    if (!isRecord(item)) continue
    const id = typeof item['id'] === 'string' ? item['id'] : ''
    const author = typeof item['author'] === 'string' ? item['author'] : ''
    const content = typeof item['content'] === 'string' ? item['content'] : ''
    if (id === '' || author === '' || content === '') continue
    const kind = typeof item['kind'] === 'string' && KIND_SET.has(item['kind'])
      ? item['kind'] as BlackboardEntryKind
      : 'note'
    const createdAt = typeof item['createdAt'] === 'number' && Number.isFinite(item['createdAt'])
      ? item['createdAt']
      : 0
    const votes = normalizeVotes(item['votes'])
    entries.push({
      id,
      author,
      kind,
      content: content.slice(0, BLACKBOARD_MAX_CONTENT),
      createdAt,
      ...votes === undefined ? {} : { votes },
      ...item['pinned'] === true ? { pinned: true } : {},
    })
  }
  const seq = typeof raw['seq'] === 'number' && Number.isSafeInteger(raw['seq']) && raw['seq'] >= 0
    ? raw['seq']
    : entries.reduce((max, entry) => Math.max(max, entryIdNumber(entry.id)), 0)
  return { seq, entries }
}

function entryIdNumber(id: string): number {
  const match = /^bb-(\d+)$/.exec(id)
  return match === null ? 0 : Number(match[1])
}

/** The team's board, normalized; absence means an empty board. */
export function blackboardOf(team: Pick<TeamState, 'blackboard'>): BlackboardState {
  return normalizeBlackboard(team.blackboard)
}

/** Normalize and attach the board to the team record (mutates `team`). */
function ensureBlackboard(team: TeamState): BlackboardState {
  const board = normalizeBlackboard(team.blackboard)
  team.blackboard = board
  return board
}

function trimEntries(board: BlackboardState): void {
  while (board.entries.length > BLACKBOARD_MAX_ENTRIES) {
    const unpinned = board.entries.findIndex((entry) => entry.pinned !== true)
    board.entries.splice(unpinned === -1 ? 0 : unpinned, 1)
  }
}

/** One vote tally for an entry. */
export interface BlackboardTally {
  up: number
  down: number
}

/** Count up/down votes on one entry. */
export function tallyOf(entry: BlackboardEntry): BlackboardTally {
  let up = 0
  let down = 0
  for (const vote of Object.values(entry.votes ?? {})) {
    if (vote === 'up') up += 1
    else down += 1
  }
  return { up, down }
}

/** Append one entry to the team board; returns the stored entry. */
export function postBlackboardEntry(team: TeamState, input: {
  author: string
  kind?: string
  content: string
  pinned?: boolean
}): BlackboardEntry {
  const content = String(input.content ?? '').trim()
  if (content === '') throw new Error('blackboard content must not be empty')
  if (content.length > BLACKBOARD_MAX_CONTENT) {
    throw new Error(`blackboard content is too long (${content.length} chars); limit is ${BLACKBOARD_MAX_CONTENT}`)
  }
  const kind = input.kind !== undefined && KIND_SET.has(input.kind)
    ? input.kind as BlackboardEntryKind
    : 'note'
  const board = ensureBlackboard(team)
  const seq = board.seq + 1
  board.seq = seq
  const entry: BlackboardEntry = {
    id: `bb-${seq}`,
    author: String(input.author),
    kind,
    content,
    createdAt: Date.now(),
    ...input.pinned === true ? { pinned: true } : {},
  }
  board.entries.push(entry)
  trimEntries(board)
  return entry
}

/** Cast, switch or clear one participant's vote on an entry. */
export function voteBlackboardEntry(team: TeamState, input: {
  entryId: string
  voter: string
  vote: BlackboardVote | 'clear'
}): { entry: BlackboardEntry; tally: BlackboardTally } {
  const board = ensureBlackboard(team)
  const entry = board.entries.find((candidate) => candidate.id === input.entryId)
  if (entry === undefined) throw new Error(`no blackboard entry "${input.entryId}" in team "${team.name}"`)
  if (input.vote === 'clear') {
    if (entry.votes !== undefined) delete entry.votes[input.voter]
    if (entry.votes !== undefined && Object.keys(entry.votes).length === 0) delete entry.votes
  } else {
    entry.votes = { ...(entry.votes ?? {}), [input.voter]: input.vote }
  }
  return { entry, tally: tallyOf(entry) }
}

/** Remove every entry (captain-only at the tool layer); returns how many were removed. */
export function clearBlackboard(team: TeamState): number {
  const board = ensureBlackboard(team)
  const removed = board.entries.length
  board.entries = []
  return removed
}

/** One entry as returned by a board read. */
export interface BlackboardReadEntry {
  id: string
  author: string
  kind: BlackboardEntryKind
  content: string
  created_at: number
  pinned: boolean
  votes_up: number
  votes_down: number
  voters_up: string[]
  voters_down: string[]
}

/** Options accepted by {@link readBlackboard}. */
export interface BlackboardQuery {
  author?: string
  kind?: string
  limit?: number
}

/** Read (pinned first, then the rest oldest → newest) the board. */
export function readBlackboard(team: TeamState, query: BlackboardQuery = {}): {
  entries: BlackboardReadEntry[]
  total: number
} {
  const board = ensureBlackboard(team)
  const filtered = board.entries.filter((entry) => (
    (query.author === undefined || entry.author === query.author)
    && (query.kind === undefined || entry.kind === query.kind)
  ))
  const limit = Math.max(1, Math.min(BLACKBOARD_MAX_LIMIT, Math.trunc(query.limit ?? BLACKBOARD_DEFAULT_LIMIT)))
  // Pinned entries always lead the feed; `limit` bounds the latest unpinned
  // entries that follow (oldest → newest), so a captain's "vote now" notice
  // survives even on a long board.
  const pinned = filtered.filter((entry) => entry.pinned === true)
  const unpinned = filtered.filter((entry) => entry.pinned !== true)
  const slice = [...pinned, ...unpinned.slice(-limit)]
  const entries = slice.map((entry) => {
    const tally = tallyOf(entry)
    const voters = entry.votes ?? {}
    return {
      id: entry.id,
      author: entry.author,
      kind: entry.kind,
      content: entry.content,
      created_at: entry.createdAt,
      pinned: entry.pinned === true,
      votes_up: tally.up,
      votes_down: tally.down,
      voters_up: Object.keys(voters).filter((voter) => voters[voter] === 'up'),
      voters_down: Object.keys(voters).filter((voter) => voters[voter] === 'down'),
    }
  })
  return { entries, total: filtered.length }
}

function formatClock(createdAt: number): string {
  if (!Number.isFinite(createdAt) || createdAt <= 0) return '?'
  return new Date(createdAt).toISOString().slice(0, 16).replace('T', ' ')
}

/** Model-facing text for a board read. */
export function renderBlackboard(entries: readonly BlackboardReadEntry[], total: number): string {
  if (entries.length === 0) return 'Blackboard is empty. Post an idea with deers_team_blackboard_post.'
  const lines = [`Blackboard (showing ${entries.length} of ${total} entries; pinned first, then oldest → newest):`]
  for (const entry of entries) {
    const pin = entry.pinned ? '📌 ' : ''
    const votes = entry.votes_up + entry.votes_down === 0
      ? 'no votes'
      : `▲${entry.votes_up} ▼${entry.votes_down}`
    const voters = [
      ...entry.voters_up.map((voter) => `+${voter}`),
      ...entry.voters_down.map((voter) => `-${voter}`),
    ].join(' ')
    lines.push(
      `${pin}[${entry.id}] ${entry.kind} · ${entry.author} · ${formatClock(entry.created_at)}`,
      `  ${entry.content.replace(/\n/g, '\n  ')}`,
      `  votes: ${votes}${voters === '' ? '' : ` (${voters})`}`,
    )
  }
  return lines.join('\n')
}

/** Compact board summary for `deers_team_status`. */
export function blackboardStatus(team: Pick<TeamState, 'blackboard'>, latest = 3): {
  count: number
  latest: Array<{ id: string; author: string; kind: BlackboardEntryKind; up: number; down: number; content: string }>
} | undefined {
  const board = normalizeBlackboard(team.blackboard)
  if (board.entries.length === 0) return undefined
  const slice = board.entries.slice(-latest)
  return {
    count: board.entries.length,
    latest: slice.map((entry) => {
      const tally = tallyOf(entry)
      return {
        id: entry.id,
        author: entry.author,
        kind: entry.kind,
        up: tally.up,
        down: tally.down,
        content: entry.content.slice(0, 200),
      }
    }),
  }
}
