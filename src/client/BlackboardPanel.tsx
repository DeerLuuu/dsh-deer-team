/**
 * Shared blackboard panel: the human side of the team's brainstorming feed.
 *
 * Reads `GET /plugins/deers-dsh-agent-team/blackboard` and writes through the
 * same route (post / vote). The human acts as the captain, matching the
 * captain-authored messages the model tools already attribute to `captain`.
 * @module deers-dsh-agent-team/client/BlackboardPanel
 */

import { useCallback, useEffect, useState } from 'react'
import css from './BlackboardPanel.module.css'
import { IconWarningOutline16 } from './icons.tsx'
import type { AgentTeamsLocaleKey, AgentTeamsTranslate } from './locales.ts'

const ENDPOINT = '/plugins/deers-dsh-agent-team/blackboard'

type EntryKind = 'note' | 'idea' | 'proposal' | 'decision'
const KINDS: readonly EntryKind[] = ['note', 'idea', 'proposal', 'decision']
const KIND_KEY: Record<EntryKind, AgentTeamsLocaleKey> = {
  note: 'board.kind.note',
  idea: 'board.kind.idea',
  proposal: 'board.kind.proposal',
  decision: 'board.kind.decision',
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [kind, setKind] = useState<EntryKind>('note')
  const [posting, setPosting] = useState(false)

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
      const body = await response.json() as { entries?: unknown }
      const next = Array.isArray(body.entries) ? body.entries.map(entryOf).filter((entry): entry is BoardEntry => entry !== undefined) : []
      setEntries(next)
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

  const send = useCallback(async (payload: Record<string, unknown>): Promise<void> => {
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
  }, [captainSessionId, teamId])

  const post = useCallback(async (): Promise<void> => {
    if (posting || draft.trim() === '') return
    setPosting(true)
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
            <button type="button" className={css.linkButton} onClick={() => { void refresh() }} disabled={loading}>
              {t('board.refresh')}
            </button>
          </div>
          {error !== '' && (
            <p role="alert" className={css.error}>
              <IconWarningOutline16 />
              {error}
            </p>
          )}
          {loading && entries.length === 0 && <p className={css.hint}>{t('board.loading')}</p>}
          {!loading && entries.length === 0 && <p className={css.hint}>{t('board.empty')}</p>}
          <ul className={css.list}>
            {entries.map((entry) => {
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
            })}
          </ul>
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
