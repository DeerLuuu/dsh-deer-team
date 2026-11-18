import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Dedicated poll floating window.
 *
 * Opened from the team section's vote button, rendered in the shell overlay so
 * it stays usable while the activity panel is folded or the conversation
 * scrolls. The body is the same PollPanel used inline, in embedded mode.
 * @module deers-dsh-agent-team/client/PollFloater
 */
import { useSyncExternalStore } from 'react';
import { PollPanel } from "./PollPanel.js";
import css from './PollPanel.module.css';
import { closePollWindow, getPollWindow, subscribePollWindow } from "./poll-window-state.js";
/** Floating poll window; renders nothing until a team is targeted. */
export function PollFloater({ t }) {
    const target = useSyncExternalStore(subscribePollWindow, getPollWindow);
    if (target === null)
        return null;
    return (_jsxs("aside", { className: css.window, "data-poll-window": true, role: "dialog", "aria-label": t('poll.windowTitle', { team: target.teamName }), children: [_jsxs("header", { className: css.windowHead, children: [_jsx("span", { className: css.windowTitle, children: t('poll.windowTitle', { team: target.teamName }) }), _jsx("button", { type: "button", className: css.windowClose, onClick: closePollWindow, "aria-label": t('poll.windowClose'), title: t('poll.windowClose'), children: "\u00D7" })] }), _jsx("div", { className: css.windowBody, children: _jsx(PollPanel, { teamId: target.teamId, captainSessionId: target.captainSessionId, t: t, readOnly: target.readOnly === true, embedded: true }) })] }));
}
