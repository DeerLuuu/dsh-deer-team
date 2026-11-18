/**
 * Dedicated poll floating window.
 *
 * Opened from the team section's vote button, rendered in the shell overlay so
 * it stays usable while the activity panel is folded or the conversation
 * scrolls. The body is the same PollPanel used inline, in embedded mode.
 * @module deers-dsh-agent-team/client/PollFloater
 */

import { useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { PollPanel } from './PollPanel.tsx'
import css from './PollPanel.module.css'
import { closePollWindow, getPollWindow, subscribePollWindow } from './poll-window-state.ts'

/** Floating poll window; renders nothing until a team is targeted. */
export function PollFloater({ t }: PropsLocale<'agentTeams'>) {
  const target = useSyncExternalStore(subscribePollWindow, getPollWindow)
  if (target === null) return null
  return (
    <aside
      className={css.window}
      data-poll-window
      role="dialog"
      aria-label={t('poll.windowTitle', { team: target.teamName })}
    >
      <header className={css.windowHead}>
        <span className={css.windowTitle}>{t('poll.windowTitle', { team: target.teamName })}</span>
        <button
          type="button"
          className={css.windowClose}
          onClick={closePollWindow}
          aria-label={t('poll.windowClose')}
          title={t('poll.windowClose')}
        >
          ×
        </button>
      </header>
      <div className={css.windowBody}>
        <PollPanel
          teamId={target.teamId}
          captainSessionId={target.captainSessionId}
          t={t}
          readOnly={target.readOnly === true}
          embedded
        />
      </div>
    </aside>
  )
}
