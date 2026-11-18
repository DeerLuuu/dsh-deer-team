/**
 * Shared blackboard panel: the human side of the team's brainstorming feed.
 *
 * Reads `GET /plugins/deers-dsh-agent-team/blackboard` and writes through the
 * same route (post / vote / cleanup). The human acts as the captain, matching
 * the captain-authored messages the model tools already attribute to `captain`.
 * @module deers-dsh-agent-team/client/BlackboardPanel
 */

import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import css from './BlackboardPanel.module.css'
import { IconWarningOutline16 } from './icons.tsx'
import type { AgentTeamsLocaleKey, AgentTeamsTranslate } from './locales.ts'

const ENDPOINT = '/plugins/deers-dsh-agent-team/blackboard'

type EntryKind = 'note' | 'idea' | 'proposal' | 'decision'
type KindFilter = 'all' | EntryKind
type GroupBy = 'none' | 'kind' | 'author'
const KINDS: readonly EntryKind[] = ['note', 'idea', 'proposal', 'decision']
const KIND_KEY: Record<EntryKind, AgentTeamsLocaleKey> = {
  note: 'board.kind.note',
  idea: 'board.kind.idea',
  proposal: 'board.kind.proposal',
  decision: 'board.kind.decision',
}

interface CleanupInfo {
  enabled: boolean
  retentionDays: number
  keepLatest: number
  keepPinned: boolean
  keepDecisions: boolean
}

interface BoardEntry {
  id: string
  author: string
  kind: EntryKind
  content: string
  createdAt: number
  pinned: boolean
  votes: Record<string, 'up' | 'down'>
}

function kindOf(value: unknown): EntryKind {
  return KINDS.includes(value as EntryKind) ? value as EntryKind : 'note'
}

function votesOf(value: unknown): Record<string, 'up' | 'down'> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const votes: Record<string, 'up' | 'down'> = {}
  for (const [voter, vote] of Object.entries(value)) {
    if (vote === 'up' || vote === 'down') votes[voter] = vote
  }
  return votes
}

function entryOf(raw: unknown): BoardEntry | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  const id = typeof record['id'] === 'string' ? record['id'] : ''
  const content = typeof record['content'] === 'string' ? record['content'] : ''
  if (id === '' || content === '') return undefined
  return {
    id,
    author: typeof record['author'] === 'string' ? record['author'] : '',
    kind: kindOf(record['kind']),
    content,
    createdAt: typeof record['createdAt'] === 'number' ? record['createdAt'] : 0,
    pinned: record['pinned'] === true,
    votes: votesOf(record['votes']),
  }
}

function cleanupOf(raw: unknown): CleanupInfo | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  return {
    enabled: record['enabled'] === true,
    retentionDays: typeof record['retentionDays'] === 'number' ? record['retentionDays'] : 30,
    keepLatest: typeof record['keepLatest'] === 'number' ? record['keepLatest'] : 10,
    keepPinned: record['keepPinned'] !== false,
    keepDecisions: record['keepDecisions'] !== false,
  }
}

function tallyOf(votes: Record<string, 'up' | 'down'>): { up: number; down: number } {
  let up = 0
  let down = 0
  for (const vote of Object.values(votes)) {
    if (vote === 'up') up += 1
    else down += 1
  }
  return { up, down }
}

function timeOf(createdAt: number): string {
  if (!Number.isFinite(createdAt) || createdAt <= 0) return ''
  try {
    return new Date(createdAt).toLocaleString()
  } catch {
    return ''
  }
}

/** One team's blackboard, collapsed until the human opens it. */
export function BlackboardPanel({ teamId, captainSessionId, t, readOnly = false }: {
  readonly teamId: string
  readonly captainSessionId: string
  readonly t: AgentTeamsTranslate
  readonly readOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<readonly BoardEntry[]>([])
  const [cleanup, setCleanup] = useState<CleanupInfo | undefined>()
  const [lastCleanupAt, setLastCleanupAt] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState('')
  const [kind, setKind] = useState<EntryKind>('note')
  const [posting, setPosting] = useState(false)
  const [authorFilter, setAuthorFilter] = useState('all')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [query, setQuery] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [cleaning, setCleaning] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch(`${ENDPOINT}?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}`, {
        cache: 'no-store',
      })
      if (!response.ok) {
        let message = `HTTP ${response.status}`
        try {
          const body = await response.json() as { error?: unknown }
          if (typeof body.error === 'string' && body.error !== '') message = body.error
        } catch {}
        throw new Error(message)
      }
      const body = await response.json() as { entries?: unknown; cleanup?: unknown; lastCleanupAt?: unknown }
      const next = Array.isArray(body.entries) ? body.entries.map(entryOf).filter((entry): entry is BoardEntry => entry !== undefined) : []
      setEntries(next)
      setCleanup(cleanupOf(body.cleanup))
      setLastCleanupAt(typeof body.lastCleanupAt === 'number' ? body.lastCleanupAt : undefined)
      setError('')
    } catch (failure: unknown) {
      setError(t('board.error', { message: failure instanceof Error ? failure.message : String(failure) }))
    } finally {
      setLoading(false)
    }
  }, [captainSessionId, t, teamId])

  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])

  const send = useCallback(async (payload: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: captainSessionId, teamId, ...payload }),
    })
    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const body = await response.json() as { error?: unknown }
        if (typeof body.error === 'string' && body.error !== '') message = body.error
      } catch {}
      throw new Error(message)
    }
    return await response.json().catch(() => ({})) as Record<string, unknown>
  }, [captainSessionId, teamId])

  const post = useCallback(async (): Promise<void> => {
    if (posting || draft.trim() === '') return
    setPosting(true)
    setNotice('')
    try {
      await send({ action: 'post', content: draft, kind })
      setDraft('')
      await refresh()
    } catch (failure: unknown) {
      setError(t('board.postFailed', { message: failure instanceof Error ? failure.message : String(failure) }))
    } finally {
      setPosting(false)
    }
  }, [draft, kind, posting, refresh, send, t])

  const vote = useCallback(async (entryId: string, value: 'up' | 'down' | 'clear'): Promise<void> => {
    try {
      await send({ action: 'vote', entryId, vote: value })
      await refresh()
    } catch (failure: unknown) {
      setError(t('board.voteFailed', { message: failure instanceof Error ? failure.message : String(failure) }))
    }
  }, [refresh, send, t])

  const cleanupNow = useCallback(async (): Promise<void> => {
    if (cleaning) return
    setCleaning(true)
    setNotice('')
    try {
      const result = await send({ action: 'cleanup' })
      const removed = typeof result['removed'] === 'number' ? result['removed'] : 0
      setNotice(t('board.cleanupDone', { removed }))
      await refresh()
    } catch (failure: unknown) {
      setError(t('board.cleanupFailed', { message: failure instanceof Error ? failure.message : String(failure) }))
    } finally {
      setCleaning(false)
    }
  }, [cleaning, refresh, send, t])

  const authors = useMemo(() => {
    const unique = [...new Set(entries.map((entry) => entry.author))]
    return unique.sort((left, right) => (
      left === 'captain' ? -1 : right === 'captain' ? 1 : left.localeCompare(right)
    ))
  }, [entries])

  const kindCounts = useMemo(() => {
    const counts: Record<EntryKind, number> = { note: 0, idea: 0, proposal: 0, decision: 0 }
    for (const entry of entries) counts[entry.kind] += 1
    return counts
  }, [entries])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return entries.filter((entry) => (
      (authorFilter === 'all' || entry.author === authorFilter)
      && (kindFilter === 'all' || entry.kind === kindFilter)
      && (needle === '' || entry.content.toLowerCase().includes(needle) || entry.author.toLowerCase().includes(needle))
    ))
  }, [authorFilter, entries, kindFilter, query])

  const groups = useMemo((): Array<{ key: string; label: string; items: readonly BoardEntry[] }> => {
    if (groupBy === 'kind') {
      return KINDS
        .filter((item) => filtered.some((entry) => entry.kind === item))
        .map((item) => ({ key: item, label: t(KIND_KEY[item]), items: filtered.filter((entry) => entry.kind === item) }))
    }
    if (groupBy === 'author') {
      return authors
        .filter((author) => filtered.some((entry) => entry.author === author))
        .map((author) => ({
          key: author,
          label: author === 'captain' ? t('board.author.captain') : author,
          items: filtered.filter((entry) => entry.author === author),
        }))
    }
    return filtered.length === 0 ? [] : [{ key: 'all', label: '', items: filtered }]
  }, [authors, filtered, groupBy, t])

  const renderEntry = (entry: BoardEntry): ReactElement => {
    const tally = tallyOf(entry.votes)
    const mine = entry.votes['captain']
    return (
      <li key={entry.id} className={css.entry} data-kind={entry.kind}>
        <div className={css.entryHead}>
          <span className={css.author}>{entry.author === 'captain' ? t('board.author.captain') : entry.author}</span>
          <span className={css.kind}>{t(KIND_KEY[entry.kind])}</span>
          {entry.pinned && <span className={css.pinned}>{t('board.pinned')}</span>}
          <time className={css.time}>{timeOf(entry.createdAt)}</time>
        </div>
        <p className={css.content}>{entry.content}</p>
        <div className={css.votes}>
          <button
            type="button"
            className={css.voteButton}
            data-active={mine === 'up' || undefined}
            aria-label={t('board.up')}
            title={t('board.up')}
            disabled={readOnly}
            onClick={() => { void vote(entry.id, mine === 'up' ? 'clear' : 'up') }}
          >
            ▲ {tally.up}
          </button>
          <button
            type="button"
            className={css.voteButton}
            data-active={mine === 'down' || undefined}
            aria-label={t('board.down')}
            title={t('board.down')}
            disabled={readOnly}
            onClick={() => { void vote(entry.id, mine === 'down' ? 'clear' : 'down') }}
          >
            ▼ {tally.down}
          </button>
        </div>
      </li>
    )
  }

  return (
    <section className={css.board} data-blackboard>
      <button
        type="button"
        className={css.toggle}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        data-board-toggle
      >
        <span>{t('board.toggle', { count: entries.length })}</span>
        <span className={css.chevron} aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className={css.panel}>
          <div className={css.toolbar}>
            <span className={css.hint}>{t('board.captainHint')}</span>
            <span className={css.toolbarActions}>
              {!readOnly && (
                <button type="button" className={css.linkButton} onClick={() => { void cleanupNow() }} disabled={cleaning || loading}>
                  {cleaning ? t('board.cleaning') : t('board.cleanupNow')}
                </button>
              )}
              <button type="button" className={css.linkButton} onClick={() => { void refresh() }} disabled={loading}>
                {t('board.refresh')}
              </button>
            </span>
          </div>
          {cleanup !== undefined && (
            <p className={css.cleanupInfo}>
              {t('board.cleanupPolicy', {
                days: cleanup.retentionDays,
                latest: cleanup.keepLatest,
                disabled: cleanup.enabled ? '' : t('board.cleanupDisabledSuffix'),
              })}
              {lastCleanupAt === undefined ? '' : ` · ${t('board.lastCleanup', { time: timeOf(lastCleanupAt) })}`}
            </p>
          )}
          {error !== '' && (
            <p role="alert" className={css.error}>
              <IconWarningOutline16 />
              {error}
            </p>
          )}
          {notice !== '' && <p role="status" className={css.notice}>{notice}</p>}
          <div className={css.filters}>
            <input
              className={css.search}
              value={query}
              placeholder={t('board.filter.searchPlaceholder')}
              aria-label={t('board.filter.searchAria')}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className={css.select}
              value={authorFilter}
              aria-label={t('board.filter.authorAria')}
              onChange={(event) => setAuthorFilter(event.target.value)}
            >
              <option value="all">{t('board.filter.allAuthors')}</option>
              {authors.map((author) => (
                <option key={author} value={author}>{author === 'captain' ? t('board.author.captain') : author}</option>
              ))}
            </select>
            <select
              className={css.select}
              value={groupBy}
              aria-label={t('board.filter.groupAria')}
              onChange={(event) => setGroupBy(event.target.value as GroupBy)}
            >
              <option value="none">{t('board.group.none')}</option>
              <option value="kind">{t('board.group.kind')}</option>
              <option value="author">{t('board.group.author')}</option>
            </select>
          </div>
          <div className={css.kindChips} role="group" aria-label={t('board.filter.kindAria')}>
            <button
              type="button"
              className={css.chip}
              data-active={kindFilter === 'all' || undefined}
              onClick={() => setKindFilter('all')}
            >
              {t('board.filter.allKinds')} {entries.length}
            </button>
            {KINDS.map((item) => (
              <button
                key={item}
                type="button"
                className={css.chip}
                data-kind={item}
                data-active={kindFilter === item || undefined}
                onClick={() => setKindFilter(item)}
              >
                {t(KIND_KEY[item])} {kindCounts[item]}
              </button>
            ))}
          </div>
          {loading && entries.length === 0 && <p className={css.hint}>{t('board.loading')}</p>}
          {!loading && entries.length === 0 && <p className={css.hint}>{t('board.empty')}</p>}
          {!loading && entries.length > 0 && filtered.length === 0 && <p className={css.hint}>{t('board.filter.empty')}</p>}
          {groups.map((group) => (
            <div key={group.key} className={css.group}>
              {group.label !== '' && (
                <h4 className={css.groupTitle}>
                  {group.label}
                  <span>{group.items.length}</span>
                </h4>
              )}
              <ul className={css.list}>{group.items.map(renderEntry)}</ul>
            </div>
          ))}
          {readOnly ? (
            <p className={css.hint}>{t('board.readOnly')}</p>
          ) : (
            <div className={css.composer}>
              <textarea
                className={css.textarea}
                value={draft}
                rows={3}
                placeholder={t('board.placeholder')}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className={css.composerRow}>
                <label className={css.kindLabel}>
                  {t('board.kind')}
                  <select
                    className={css.select}
                    value={kind}
                    onChange={(event) => setKind(kindOf(event.target.value))}
                  >
                    {KINDS.map((item) => (
                      <option key={item} value={item}>{t(KIND_KEY[item])}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className={css.post}
                  disabled={posting || draft.trim() === ''}
                  onClick={() => { void post() }}
                >
                  {posting ? t('board.posting') : t('board.post')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
