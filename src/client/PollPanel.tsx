/**
 * Poll panel: team-wide single/multi-choice votes the human can create and
 * join. The browser acts as the captain (same authority as the captain
 * helpers), while members vote through `deers_team_vote_cast`.
 * @module deers-dsh-agent-team/client/PollPanel
 */

import { useCallback, useEffect, useState } from 'react'
import css from './PollPanel.module.css'
import { IconWarningOutline16 } from './icons.tsx'
import type { AgentTeamsTranslate } from './locales.ts'

const ENDPOINT = '/plugins/deers-dsh-agent-team/polls'

interface PollOption {
  id: string
  label: string
  votes: number
  voters: string[]
}

interface PollDecision {
  adoptedOptionIds: string[]
  insufficientQuorum: boolean
  quorum: number
  totalVoters: number
  thresholdRule: 'majority' | 'gt' | 'percent'
  thresholdValue?: number
  summary: string
  decidedAt: number
  decidedBy: string
}

interface PollRow {
  id: string
  title: string
  description?: string
  multiSelect: boolean
  maxSelections?: number
  thresholdRule: 'majority' | 'gt' | 'percent'
  thresholdValue?: number
  quorum: number
  anonymous: boolean
  createdBy: string
  createdAt: number
  closesAt?: number
  closedAt?: number
  closedBy?: string
  status: 'open' | 'closed' | 'expired'
  options: PollOption[]
  totalVoters: number
  myVotes: string[]
  myRevision?: number
  myVoterType?: 'captain' | 'member'
  decision?: PollDecision
}

function decisionOf(raw: unknown): PollDecision | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  const rule = record['thresholdRule'] === 'gt' || record['thresholdRule'] === 'percent' ? record['thresholdRule'] : 'majority'
  return {
    adoptedOptionIds: Array.isArray(record['adoptedOptionIds'])
      ? record['adoptedOptionIds'].filter((item): item is string => typeof item === 'string')
      : [],
    insufficientQuorum: record['insufficientQuorum'] === true,
    quorum: typeof record['quorum'] === 'number' ? record['quorum'] : 1,
    totalVoters: typeof record['totalVoters'] === 'number' ? record['totalVoters'] : 0,
    thresholdRule: rule,
    ...typeof record['thresholdValue'] === 'number' ? { thresholdValue: record['thresholdValue'] } : {},
    summary: typeof record['summary'] === 'string' ? record['summary'] : '',
    decidedAt: typeof record['decidedAt'] === 'number' ? record['decidedAt'] : 0,
    decidedBy: typeof record['decidedBy'] === 'string' ? record['decidedBy'] : 'captain',
  }
}

function optionOf(raw: unknown): PollOption | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  const id = typeof record['id'] === 'string' ? record['id'] : ''
  const label = typeof record['label'] === 'string' ? record['label'] : ''
  if (id === '' || label === '') return undefined
  return {
    id,
    label,
    votes: typeof record['votes'] === 'number' ? record['votes'] : 0,
    voters: Array.isArray(record['voters']) ? record['voters'].filter((item): item is string => typeof item === 'string') : [],
  }
}

function pollOf(raw: unknown): PollRow | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  const id = typeof record['id'] === 'string' ? record['id'] : ''
  const title = typeof record['title'] === 'string' ? record['title'] : ''
  if (id === '' || title === '') return undefined
  const status = record['status'] === 'closed' || record['status'] === 'expired' ? record['status'] : 'open'
  return {
    id,
    title,
    ...typeof record['description'] === 'string' && record['description'] !== ''
      ? { description: record['description'] }
      : {},
    multiSelect: record['multiSelect'] === true,
    ...typeof record['maxSelections'] === 'number' ? { maxSelections: record['maxSelections'] } : {},
    thresholdRule: record['thresholdRule'] === 'gt' || record['thresholdRule'] === 'percent' ? record['thresholdRule'] : 'majority',
    ...typeof record['thresholdValue'] === 'number' ? { thresholdValue: record['thresholdValue'] } : {},
    quorum: typeof record['quorum'] === 'number' ? record['quorum'] : 1,
    anonymous: record['anonymous'] === true,
    createdBy: typeof record['createdBy'] === 'string' ? record['createdBy'] : 'captain',
    createdAt: typeof record['createdAt'] === 'number' ? record['createdAt'] : 0,
    ...typeof record['closesAt'] === 'number' ? { closesAt: record['closesAt'] } : {},
    ...typeof record['closedAt'] === 'number' ? { closedAt: record['closedAt'] } : {},
    ...typeof record['closedBy'] === 'string' ? { closedBy: record['closedBy'] } : {},
    status,
    options: Array.isArray(record['options'])
      ? record['options'].map(optionOf).filter((option): option is PollOption => option !== undefined)
      : [],
    totalVoters: typeof record['totalVoters'] === 'number' ? record['totalVoters'] : 0,
    myVotes: Array.isArray(record['myVotes']) ? record['myVotes'].filter((item): item is string => typeof item === 'string') : [],
    ...typeof record['myRevision'] === 'number' ? { myRevision: record['myRevision'] } : {},
    ...record['myVoterType'] === 'captain' || record['myVoterType'] === 'member' ? { myVoterType: record['myVoterType'] } : {},
    ...decisionOf(record['decision']) !== undefined ? { decision: decisionOf(record['decision']) } : {},
  }
}

function timeOf(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return ''
  try {
    return new Date(at).toLocaleString()
  } catch {
    return ''
  }
}

/** One team's polls; collapsed until opened. */
export function PollPanel({ teamId, captainSessionId, t, readOnly = false, embedded = false }: {
  readonly teamId: string
  readonly captainSessionId: string
  readonly t: AgentTeamsTranslate
  readonly readOnly?: boolean
  /** Render the full panel without its own collapse toggle (floating window). */
  readonly embedded?: boolean
}) {
  const [open, setOpen] = useState(embedded)
  const [polls, setPolls] = useState<readonly PollRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})
  const [title, setTitle] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [multi, setMulti] = useState(false)
  const [maxSelections, setMaxSelections] = useState('')
  const [thresholdRule, setThresholdRule] = useState<'majority' | 'gt' | 'percent'>('majority')
  const [thresholdValue, setThresholdValue] = useState('')
  const [quorum, setQuorum] = useState('1')
  const [anonymous, setAnonymous] = useState(false)
  const [duration, setDuration] = useState('')
  const [creating, setCreating] = useState(false)
  const [busyPoll, setBusyPoll] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [composerOpen, setComposerOpen] = useState(false)

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
      const body = await response.json() as { polls?: unknown; total?: unknown }
      const rows = Array.isArray(body.polls)
        ? body.polls.map(pollOf).filter((poll): poll is PollRow => poll !== undefined)
        : []
      setPolls(rows)
      setTotal(typeof body.total === 'number' ? body.total : rows.length)
      setError('')
    } catch (failure: unknown) {
      setError(t('poll.error', { message: failure instanceof Error ? failure.message : String(failure) }))
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

  const create = useCallback(async (): Promise<void> => {
    if (creating) return
    const options = optionsText.split('\n').map((line) => line.trim()).filter((line) => line !== '')
    if (title.trim() === '' || options.length < 2) {
      setError(t('poll.noOptions'))
      return
    }
    setCreating(true)
    try {
      await send({
        action: 'create',
        title: title.trim(),
        options,
        multiSelect: multi,
        ...multi && maxSelections.trim() !== '' ? { maxSelections: Number(maxSelections) } : {},
        thresholdRule,
        ...thresholdRule !== 'majority' && thresholdValue.trim() !== '' ? { thresholdValue: Number(thresholdValue) } : {},
        ...quorum.trim() !== '' ? { quorum: Number(quorum) } : {},
        anonymous,
        ...duration.trim() !== '' && Number(duration) > 0 ? { durationMinutes: Number(duration) } : {},
      })
      setTitle('')
      setOptionsText('')
      setMulti(false)
      setMaxSelections('')
      setThresholdRule('majority')
      setThresholdValue('')
      setQuorum('1')
      setAnonymous(false)
      setDuration('')
      await refresh()
    } catch (failure: unknown) {
      setError(t('poll.createFailed', { message: failure instanceof Error ? failure.message : String(failure) }))
    } finally {
      setCreating(false)
    }
  }, [anonymous, creating, duration, maxSelections, multi, optionsText, quorum, refresh, send, t, thresholdRule, thresholdValue, title])

  const vote = useCallback(async (pollId: string, optionIds: readonly string[]): Promise<void> => {
    setBusyPoll(pollId)
    try {
      await send({ action: 'vote', pollId, optionIds: [...optionIds] })
      await refresh()
    } catch (failure: unknown) {
      setError(t('poll.voteFailed', { message: failure instanceof Error ? failure.message : String(failure) }))
    } finally {
      setBusyPoll('')
    }
  }, [refresh, send, t])

  const closePoll = useCallback(async (pollId: string): Promise<void> => {
    setBusyPoll(pollId)
    try {
      await send({ action: 'close', pollId })
      await refresh()
    } catch (failure: unknown) {
      setError(t('poll.closeFailed', { message: failure instanceof Error ? failure.message : String(failure) }))
    } finally {
      setBusyPoll('')
    }
  }, [refresh, send, t])

  const openCount = polls.filter((poll) => poll.status === 'open').length
  const visiblePolls = polls.filter((poll) => (
    filter === 'all' ? true : filter === 'open' ? poll.status === 'open' : poll.status !== 'open'
  ))
  const draftOf = (poll: PollRow): string[] => drafts[poll.id] ?? [...poll.myVotes]
  const toggleDraft = (poll: PollRow, optionId: string): void => {
    const current = draftOf(poll)
    const cap = poll.maxSelections ?? poll.options.length
    let next: string[]
    if (current.includes(optionId)) next = current.filter((id) => id !== optionId)
    else {
      if (current.length >= cap) return
      next = [...current, optionId]
    }
    setDrafts((previous) => ({ ...previous, [poll.id]: next }))
  }

  return (
    <section className={css.polls} data-polls data-embedded={embedded || undefined}>
      {!embedded && (
        <button
          type="button"
          className={css.toggle}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          data-polls-toggle
        >
          <span>{t('poll.toggle', { open: openCount, total })}</span>
          <span className={css.chevron} aria-hidden>{open ? '▾' : '▸'}</span>
        </button>
      )}
      {(embedded || open) && (
        <div className={css.panel}>
          <div className={css.toolbar}>
            <span className={css.hint}>{t('poll.captainHint')}</span>
            <button type="button" className={css.linkButton} onClick={() => { void refresh() }} disabled={loading}>
              {t('poll.refresh')}
            </button>
          </div>
          {error !== '' && (
            <p role="alert" className={css.error}>
              <IconWarningOutline16 />
              {error}
            </p>
          )}
          <div className={css.filters} role="group" aria-label={t('poll.filterAria')}>
            {(['all', 'open', 'closed'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={css.filterButton}
                data-active={filter === key || undefined}
                onClick={() => setFilter(key)}
              >
                {t(`poll.filter.${key}` as 'poll.filter.all' | 'poll.filter.open' | 'poll.filter.closed')}
              </button>
            ))}
          </div>
          {loading && polls.length === 0 && <p className={css.hint}>{t('poll.loading')}</p>}
          {!loading && polls.length === 0 && <p className={css.hint}>{t('poll.empty')}</p>}
          {!loading && polls.length > 0 && visiblePolls.length === 0 && <p className={css.hint}>{t('poll.filterEmpty')}</p>}
          <div className={css.list}>
            {visiblePolls.map((poll) => {
              const draft = draftOf(poll)
              const selectedLabel = poll.options.filter((option) => poll.myVotes.includes(option.id)).map((option) => option.label)
              const statusLabel = poll.status === 'open' ? t('poll.open') : poll.status === 'closed' ? t('poll.closed') : t('poll.expired')
              const ruleLabel = poll.thresholdRule === 'majority'
                ? t('poll.threshold.majority')
                : poll.thresholdRule === 'gt'
                  ? `> ${poll.thresholdValue ?? 1}`
                  : `≥ ${poll.thresholdValue ?? 50}%`
              const adopted = poll.decision?.adoptedOptionIds ?? []
              const adoptedLabels = poll.options.filter((option) => adopted.includes(option.id)).map((option) => option.label)
              return (
                <article key={poll.id} className={css.card} data-poll-status={poll.status}>
                  <header className={css.cardHead}>
                    <span className={css.pollTitle}>{poll.title}</span>
                    <span className={css.status} data-status={poll.status}>{statusLabel}</span>
                    <span className={css.mode}>{poll.multiSelect ? t('poll.multiLabel') : t('poll.single')}</span>
                    <span className={css.mode} title={t('poll.thresholdRule')}>{ruleLabel}</span>
                    <span className={css.mode} title={t('poll.quorum')}>{t('poll.quorumShort', { quorum: poll.quorum })}</span>
                    {poll.anonymous && <span className={css.mode}>{t('poll.anonymousBadge')}</span>}
                    <span className={css.voters}>{t('poll.voters', { count: poll.totalVoters })}</span>
                    {poll.status === 'open' && !readOnly && (
                      <button type="button" className={css.linkButton} disabled={busyPoll === poll.id} onClick={() => { void closePoll(poll.id) }}>
                        {t('poll.close')}
                      </button>
                    )}
                  </header>
                  {poll.description !== undefined && <p className={css.description}>{poll.description}</p>}
                  <div className={css.options}>
                    {poll.options.map((option) => {
                      const chosen = poll.multiSelect ? draft.includes(option.id) : poll.myVotes.includes(option.id)
                      if (!readOnly && poll.status === 'open') {
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={css.option}
                            data-chosen={chosen || undefined}
                            disabled={busyPoll === poll.id}
                            onClick={() => {
                              if (poll.multiSelect) toggleDraft(poll, option.id)
                              else void vote(poll.id, chosen ? [] : [option.id])
                            }}
                          >
                            <span>{option.label}</span>
                            <span className={css.count}>{option.votes}</span>
                          </button>
                        )
                      }
                      return (
                        <div key={option.id} className={css.optionStatic} data-chosen={chosen || undefined}>
                          <span>{option.label}</span>
                          <span className={css.count}>{option.votes}</span>
                        </div>
                      )
                    })}
                  </div>
                  {!readOnly && poll.status === 'open' && poll.multiSelect && (
                    <div className={css.actions}>
                      <button type="button" className={css.submit} disabled={busyPoll === poll.id} onClick={() => { void vote(poll.id, draft) }}>
                        {t('poll.cast')}
                      </button>
                      <button type="button" className={css.clear} disabled={busyPoll === poll.id} onClick={() => { setDrafts((previous) => ({ ...previous, [poll.id]: [] })); void vote(poll.id, []) }}>
                        {t('poll.clear')}
                      </button>
                    </div>
                  )}
                  {poll.decision !== undefined && (
                    <p className={css.decision} data-quorum={poll.decision.insufficientQuorum || undefined}>
                      {poll.decision.insufficientQuorum
                        ? t('poll.decision.quorum')
                        : adoptedLabels.length === 0
                          ? t('poll.decision.none')
                          : t('poll.decision.adopted', { value: adoptedLabels.join('、') })}
                      <span className={css.decisionSummary}>{poll.decision.summary}</span>
                    </p>
                  )}
                  {selectedLabel.length > 0 && (
                    <p className={css.hint}>
                      {t('poll.youVoted', { value: selectedLabel.join('、') })}
                      {poll.myRevision === undefined ? '' : ` · ${t('poll.revision', { revision: poll.myRevision })}`}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
          {!readOnly && (
            composerOpen ? (
              <div className={css.composer}>
                <div className={css.createTitle}>{t('poll.createTitle')}</div>
                <input
                  className={css.input}
                  value={title}
                  placeholder={t('poll.titlePlaceholder')}
                  onChange={(event) => setTitle(event.target.value)}
                  aria-label={t('poll.titleLabel')}
                />
                <textarea
                  className={css.textarea}
                  rows={3}
                  value={optionsText}
                  placeholder={t('poll.optionsPlaceholder')}
                  onChange={(event) => setOptionsText(event.target.value)}
                  aria-label={t('poll.optionsLabel')}
                />
                <div className={css.composerRow}>
                  <label className={css.inline}>
                    {t('poll.thresholdRule')}
                    <select
                      className={css.select}
                      value={thresholdRule}
                      onChange={(event) => setThresholdRule(event.target.value as 'majority' | 'gt' | 'percent')}
                    >
                      <option value="majority">{t('poll.threshold.majority')}</option>
                      <option value="gt">{t('poll.threshold.gt')}</option>
                      <option value="percent">{t('poll.threshold.percent')}</option>
                    </select>
                  </label>
                  {thresholdRule !== 'majority' && (
                    <label className={css.inline}>
                      {t('poll.thresholdValue')}
                      <input
                        className={css.smallInput}
                        type="number"
                        min={1}
                        max={thresholdRule === 'percent' ? 100 : undefined}
                        value={thresholdValue}
                        onChange={(event) => setThresholdValue(event.target.value)}
                      />
                    </label>
                  )}
                  <label className={css.inline}>
                    {t('poll.quorum')}
                    <input
                      className={css.smallInput}
                      type="number"
                      min={1}
                      value={quorum}
                      onChange={(event) => setQuorum(event.target.value)}
                    />
                  </label>
                  <label className={css.checkbox}>
                    <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                    {t('poll.anonymous')}
                  </label>
                </div>
                <div className={css.composerRow}>
                  <label className={css.checkbox}>
                    <input type="checkbox" checked={multi} onChange={(event) => setMulti(event.target.checked)} />
                    {t('poll.multi')}
                  </label>
                  {multi && (
                    <label className={css.inline}>
                      {t('poll.maxSelections')}
                      <input
                        className={css.smallInput}
                        type="number"
                        min={2}
                        value={maxSelections}
                        onChange={(event) => setMaxSelections(event.target.value)}
                      />
                    </label>
                  )}
                  <label className={css.inline}>
                    {t('poll.duration')}
                    <input
                      className={css.smallInput}
                      type="number"
                      min={0}
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                    />
                  </label>
                  <button type="button" className={css.submit} disabled={creating} onClick={() => { void create() }}>
                    {creating ? t('poll.submitting') : t('poll.submit')}
                  </button>
                  <button type="button" className={css.clear} onClick={() => setComposerOpen(false)}>
                    {t('poll.composeClose')}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className={css.composeToggle} onClick={() => setComposerOpen(true)}>
                + {t('poll.compose')}
              </button>
            )
          )}
          {readOnly && <p className={css.hint}>{t('poll.readOnly')}</p>}
        </div>
      )}
    </section>
  )
}
