import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Shared blackboard panel: the human side of the team's brainstorming feed.
 *
 * Reads `GET /plugins/deers-dsh-agent-team/blackboard` and writes through the
 * same route (post / vote). The human acts as the captain, matching the
 * captain-authored messages the model tools already attribute to `captain`.
 * @module deers-dsh-agent-team/client/BlackboardPanel
 */
import { useCallback, useEffect, useState } from 'react';
import css from './BlackboardPanel.module.css';
import { IconWarningOutline16 } from "./icons.js";
const ENDPOINT = '/plugins/deers-dsh-agent-team/blackboard';
const KINDS = ['note', 'idea', 'proposal', 'decision'];
const KIND_KEY = {
    note: 'board.kind.note',
    idea: 'board.kind.idea',
    proposal: 'board.kind.proposal',
    decision: 'board.kind.decision',
};
function kindOf(value) {
    return KINDS.includes(value) ? value : 'note';
}
function votesOf(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return {};
    const votes = {};
    for (const [voter, vote] of Object.entries(value)) {
        if (vote === 'up' || vote === 'down')
            votes[voter] = vote;
    }
    return votes;
}
function entryOf(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return undefined;
    const record = raw;
    const id = typeof record['id'] === 'string' ? record['id'] : '';
    const content = typeof record['content'] === 'string' ? record['content'] : '';
    if (id === '' || content === '')
        return undefined;
    return {
        id,
        author: typeof record['author'] === 'string' ? record['author'] : '',
        kind: kindOf(record['kind']),
        content,
        createdAt: typeof record['createdAt'] === 'number' ? record['createdAt'] : 0,
        pinned: record['pinned'] === true,
        votes: votesOf(record['votes']),
    };
}
function tallyOf(votes) {
    let up = 0;
    let down = 0;
    for (const vote of Object.values(votes)) {
        if (vote === 'up')
            up += 1;
        else
            down += 1;
    }
    return { up, down };
}
function timeOf(createdAt) {
    if (!Number.isFinite(createdAt) || createdAt <= 0)
        return '';
    try {
        return new Date(createdAt).toLocaleString();
    }
    catch {
        return '';
    }
}
/** One team's blackboard, collapsed until the human opens it. */
export function BlackboardPanel({ teamId, captainSessionId, t, readOnly = false }) {
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [draft, setDraft] = useState('');
    const [kind, setKind] = useState('note');
    const [posting, setPosting] = useState(false);
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${ENDPOINT}?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}`, {
                cache: 'no-store',
            });
            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const body = await response.json();
                    if (typeof body.error === 'string' && body.error !== '')
                        message = body.error;
                }
                catch { }
                throw new Error(message);
            }
            const body = await response.json();
            const next = Array.isArray(body.entries) ? body.entries.map(entryOf).filter((entry) => entry !== undefined) : [];
            setEntries(next);
            setError('');
        }
        catch (failure) {
            setError(t('board.error', { message: failure instanceof Error ? failure.message : String(failure) }));
        }
        finally {
            setLoading(false);
        }
    }, [captainSessionId, t, teamId]);
    useEffect(() => {
        if (open)
            void refresh();
    }, [open, refresh]);
    const send = useCallback(async (payload) => {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            cache: 'no-store',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId: captainSessionId, teamId, ...payload }),
        });
        if (!response.ok) {
            let message = `HTTP ${response.status}`;
            try {
                const body = await response.json();
                if (typeof body.error === 'string' && body.error !== '')
                    message = body.error;
            }
            catch { }
            throw new Error(message);
        }
    }, [captainSessionId, teamId]);
    const post = useCallback(async () => {
        if (posting || draft.trim() === '')
            return;
        setPosting(true);
        try {
            await send({ action: 'post', content: draft, kind });
            setDraft('');
            await refresh();
        }
        catch (failure) {
            setError(t('board.postFailed', { message: failure instanceof Error ? failure.message : String(failure) }));
        }
        finally {
            setPosting(false);
        }
    }, [draft, kind, posting, refresh, send, t]);
    const vote = useCallback(async (entryId, value) => {
        try {
            await send({ action: 'vote', entryId, vote: value });
            await refresh();
        }
        catch (failure) {
            setError(t('board.voteFailed', { message: failure instanceof Error ? failure.message : String(failure) }));
        }
    }, [refresh, send, t]);
    return (_jsxs("section", { className: css.board, "data-blackboard": true, children: [_jsxs("button", { type: "button", className: css.toggle, onClick: () => setOpen((current) => !current), "aria-expanded": open, "data-board-toggle": true, children: [_jsx("span", { children: t('board.toggle', { count: entries.length }) }), _jsx("span", { className: css.chevron, "aria-hidden": true, children: open ? '▾' : '▸' })] }), open && (_jsxs("div", { className: css.panel, children: [_jsxs("div", { className: css.toolbar, children: [_jsx("span", { className: css.hint, children: t('board.captainHint') }), _jsx("button", { type: "button", className: css.linkButton, onClick: () => { void refresh(); }, disabled: loading, children: t('board.refresh') })] }), error !== '' && (_jsxs("p", { role: "alert", className: css.error, children: [_jsx(IconWarningOutline16, {}), error] })), loading && entries.length === 0 && _jsx("p", { className: css.hint, children: t('board.loading') }), !loading && entries.length === 0 && _jsx("p", { className: css.hint, children: t('board.empty') }), _jsx("ul", { className: css.list, children: entries.map((entry) => {
                            const tally = tallyOf(entry.votes);
                            const mine = entry.votes['captain'];
                            return (_jsxs("li", { className: css.entry, "data-kind": entry.kind, children: [_jsxs("div", { className: css.entryHead, children: [_jsx("span", { className: css.author, children: entry.author === 'captain' ? t('board.author.captain') : entry.author }), _jsx("span", { className: css.kind, children: t(KIND_KEY[entry.kind]) }), entry.pinned && _jsx("span", { className: css.pinned, children: t('board.pinned') }), _jsx("time", { className: css.time, children: timeOf(entry.createdAt) })] }), _jsx("p", { className: css.content, children: entry.content }), _jsxs("div", { className: css.votes, children: [_jsxs("button", { type: "button", className: css.voteButton, "data-active": mine === 'up' || undefined, "aria-label": t('board.up'), title: t('board.up'), disabled: readOnly, onClick: () => { void vote(entry.id, mine === 'up' ? 'clear' : 'up'); }, children: ["\u25B2 ", tally.up] }), _jsxs("button", { type: "button", className: css.voteButton, "data-active": mine === 'down' || undefined, "aria-label": t('board.down'), title: t('board.down'), disabled: readOnly, onClick: () => { void vote(entry.id, mine === 'down' ? 'clear' : 'down'); }, children: ["\u25BC ", tally.down] })] })] }, entry.id));
                        }) }), readOnly ? (_jsx("p", { className: css.hint, children: t('board.readOnly') })) : (_jsxs("div", { className: css.composer, children: [_jsx("textarea", { className: css.textarea, value: draft, rows: 3, placeholder: t('board.placeholder'), onChange: (event) => setDraft(event.target.value) }), _jsxs("div", { className: css.composerRow, children: [_jsxs("label", { className: css.kindLabel, children: [t('board.kind'), _jsx("select", { className: css.select, value: kind, onChange: (event) => setKind(kindOf(event.target.value)), children: KINDS.map((item) => (_jsx("option", { value: item, children: t(KIND_KEY[item]) }, item))) })] }), _jsx("button", { type: "button", className: css.post, disabled: posting || draft.trim() === '', onClick: () => { void post(); }, children: posting ? t('board.posting') : t('board.post') })] })] }))] }))] }));
}
