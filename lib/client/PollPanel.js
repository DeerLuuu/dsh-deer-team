import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Poll panel: team-wide single/multi-choice votes the human can create and
 * join. The browser acts as the captain (same authority as the captain
 * helpers), while members vote through `deers_team_vote_cast`.
 * @module deers-dsh-agent-team/client/PollPanel
 */
import { useCallback, useEffect, useState } from 'react';
import css from './PollPanel.module.css';
import { IconWarningOutline16 } from "./icons.js";
const ENDPOINT = '/plugins/deers-dsh-agent-team/polls';
function decisionOf(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return undefined;
    const record = raw;
    const rule = record['thresholdRule'] === 'gt' || record['thresholdRule'] === 'percent' ? record['thresholdRule'] : 'majority';
    return {
        adoptedOptionIds: Array.isArray(record['adoptedOptionIds'])
            ? record['adoptedOptionIds'].filter((item) => typeof item === 'string')
            : [],
        insufficientQuorum: record['insufficientQuorum'] === true,
        quorum: typeof record['quorum'] === 'number' ? record['quorum'] : 1,
        totalVoters: typeof record['totalVoters'] === 'number' ? record['totalVoters'] : 0,
        thresholdRule: rule,
        ...typeof record['thresholdValue'] === 'number' ? { thresholdValue: record['thresholdValue'] } : {},
        summary: typeof record['summary'] === 'string' ? record['summary'] : '',
        decidedAt: typeof record['decidedAt'] === 'number' ? record['decidedAt'] : 0,
        decidedBy: typeof record['decidedBy'] === 'string' ? record['decidedBy'] : 'captain',
    };
}
function optionOf(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return undefined;
    const record = raw;
    const id = typeof record['id'] === 'string' ? record['id'] : '';
    const label = typeof record['label'] === 'string' ? record['label'] : '';
    if (id === '' || label === '')
        return undefined;
    return {
        id,
        label,
        votes: typeof record['votes'] === 'number' ? record['votes'] : 0,
        voters: Array.isArray(record['voters']) ? record['voters'].filter((item) => typeof item === 'string') : [],
    };
}
function pollOf(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return undefined;
    const record = raw;
    const id = typeof record['id'] === 'string' ? record['id'] : '';
    const title = typeof record['title'] === 'string' ? record['title'] : '';
    if (id === '' || title === '')
        return undefined;
    const status = record['status'] === 'closed' || record['status'] === 'expired' ? record['status'] : 'open';
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
            ? record['options'].map(optionOf).filter((option) => option !== undefined)
            : [],
        totalVoters: typeof record['totalVoters'] === 'number' ? record['totalVoters'] : 0,
        myVotes: Array.isArray(record['myVotes']) ? record['myVotes'].filter((item) => typeof item === 'string') : [],
        ...typeof record['myRevision'] === 'number' ? { myRevision: record['myRevision'] } : {},
        ...record['myVoterType'] === 'captain' || record['myVoterType'] === 'member' ? { myVoterType: record['myVoterType'] } : {},
        ...decisionOf(record['decision']) !== undefined ? { decision: decisionOf(record['decision']) } : {},
    };
}
function timeOf(at) {
    if (!Number.isFinite(at) || at <= 0)
        return '';
    try {
        return new Date(at).toLocaleString();
    }
    catch {
        return '';
    }
}
/** One team's polls; collapsed until opened. */
export function PollPanel({ teamId, captainSessionId, t, readOnly = false, embedded = false }) {
    const [open, setOpen] = useState(embedded);
    const [polls, setPolls] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [drafts, setDrafts] = useState({});
    const [title, setTitle] = useState('');
    const [optionsText, setOptionsText] = useState('');
    const [multi, setMulti] = useState(false);
    const [maxSelections, setMaxSelections] = useState('');
    const [thresholdRule, setThresholdRule] = useState('majority');
    const [thresholdValue, setThresholdValue] = useState('');
    const [quorum, setQuorum] = useState('1');
    const [anonymous, setAnonymous] = useState(false);
    const [duration, setDuration] = useState('');
    const [creating, setCreating] = useState(false);
    const [busyPoll, setBusyPoll] = useState('');
    const [filter, setFilter] = useState('all');
    const [composerOpen, setComposerOpen] = useState(false);
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
            const rows = Array.isArray(body.polls)
                ? body.polls.map(pollOf).filter((poll) => poll !== undefined)
                : [];
            setPolls(rows);
            setTotal(typeof body.total === 'number' ? body.total : rows.length);
            setError('');
        }
        catch (failure) {
            setError(t('poll.error', { message: failure instanceof Error ? failure.message : String(failure) }));
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
    const create = useCallback(async () => {
        if (creating)
            return;
        const options = optionsText.split('\n').map((line) => line.trim()).filter((line) => line !== '');
        if (title.trim() === '' || options.length < 2) {
            setError(t('poll.noOptions'));
            return;
        }
        setCreating(true);
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
            });
            setTitle('');
            setOptionsText('');
            setMulti(false);
            setMaxSelections('');
            setThresholdRule('majority');
            setThresholdValue('');
            setQuorum('1');
            setAnonymous(false);
            setDuration('');
            await refresh();
        }
        catch (failure) {
            setError(t('poll.createFailed', { message: failure instanceof Error ? failure.message : String(failure) }));
        }
        finally {
            setCreating(false);
        }
    }, [anonymous, creating, duration, maxSelections, multi, optionsText, quorum, refresh, send, t, thresholdRule, thresholdValue, title]);
    const vote = useCallback(async (pollId, optionIds) => {
        setBusyPoll(pollId);
        try {
            await send({ action: 'vote', pollId, optionIds: [...optionIds] });
            await refresh();
        }
        catch (failure) {
            setError(t('poll.voteFailed', { message: failure instanceof Error ? failure.message : String(failure) }));
        }
        finally {
            setBusyPoll('');
        }
    }, [refresh, send, t]);
    const closePoll = useCallback(async (pollId) => {
        setBusyPoll(pollId);
        try {
            await send({ action: 'close', pollId });
            await refresh();
        }
        catch (failure) {
            setError(t('poll.closeFailed', { message: failure instanceof Error ? failure.message : String(failure) }));
        }
        finally {
            setBusyPoll('');
        }
    }, [refresh, send, t]);
    const openCount = polls.filter((poll) => poll.status === 'open').length;
    const visiblePolls = polls.filter((poll) => (filter === 'all' ? true : filter === 'open' ? poll.status === 'open' : poll.status !== 'open'));
    const draftOf = (poll) => drafts[poll.id] ?? [...poll.myVotes];
    const toggleDraft = (poll, optionId) => {
        const current = draftOf(poll);
        const cap = poll.maxSelections ?? poll.options.length;
        let next;
        if (current.includes(optionId))
            next = current.filter((id) => id !== optionId);
        else {
            if (current.length >= cap)
                return;
            next = [...current, optionId];
        }
        setDrafts((previous) => ({ ...previous, [poll.id]: next }));
    };
    return (_jsxs("section", { className: css.polls, "data-polls": true, "data-embedded": embedded || undefined, children: [!embedded && (_jsxs("button", { type: "button", className: css.toggle, onClick: () => setOpen((value) => !value), "aria-expanded": open, "data-polls-toggle": true, children: [_jsx("span", { children: t('poll.toggle', { open: openCount, total }) }), _jsx("span", { className: css.chevron, "aria-hidden": true, children: open ? '▾' : '▸' })] })), (embedded || open) && (_jsxs("div", { className: css.panel, children: [_jsxs("div", { className: css.toolbar, children: [_jsx("span", { className: css.hint, children: t('poll.captainHint') }), _jsx("button", { type: "button", className: css.linkButton, onClick: () => { void refresh(); }, disabled: loading, children: t('poll.refresh') })] }), error !== '' && (_jsxs("p", { role: "alert", className: css.error, children: [_jsx(IconWarningOutline16, {}), error] })), _jsx("div", { className: css.filters, role: "group", "aria-label": t('poll.filterAria'), children: ['all', 'open', 'closed'].map((key) => (_jsx("button", { type: "button", className: css.filterButton, "data-active": filter === key || undefined, onClick: () => setFilter(key), children: t(`poll.filter.${key}`) }, key))) }), loading && polls.length === 0 && _jsx("p", { className: css.hint, children: t('poll.loading') }), !loading && polls.length === 0 && _jsx("p", { className: css.hint, children: t('poll.empty') }), !loading && polls.length > 0 && visiblePolls.length === 0 && _jsx("p", { className: css.hint, children: t('poll.filterEmpty') }), _jsx("div", { className: css.list, children: visiblePolls.map((poll) => {
                            const draft = draftOf(poll);
                            const selectedLabel = poll.options.filter((option) => poll.myVotes.includes(option.id)).map((option) => option.label);
                            const statusLabel = poll.status === 'open' ? t('poll.open') : poll.status === 'closed' ? t('poll.closed') : t('poll.expired');
                            const ruleLabel = poll.thresholdRule === 'majority'
                                ? t('poll.threshold.majority')
                                : poll.thresholdRule === 'gt'
                                    ? `> ${poll.thresholdValue ?? 1}`
                                    : `≥ ${poll.thresholdValue ?? 50}%`;
                            const adopted = poll.decision?.adoptedOptionIds ?? [];
                            const adoptedLabels = poll.options.filter((option) => adopted.includes(option.id)).map((option) => option.label);
                            return (_jsxs("article", { className: css.card, "data-poll-status": poll.status, children: [_jsxs("header", { className: css.cardHead, children: [_jsx("span", { className: css.pollTitle, children: poll.title }), _jsx("span", { className: css.status, "data-status": poll.status, children: statusLabel }), _jsx("span", { className: css.mode, children: poll.multiSelect ? t('poll.multiLabel') : t('poll.single') }), _jsx("span", { className: css.mode, title: t('poll.thresholdRule'), children: ruleLabel }), _jsx("span", { className: css.mode, title: t('poll.quorum'), children: t('poll.quorumShort', { quorum: poll.quorum }) }), poll.anonymous && _jsx("span", { className: css.mode, children: t('poll.anonymousBadge') }), _jsx("span", { className: css.voters, children: t('poll.voters', { count: poll.totalVoters }) }), poll.status === 'open' && !readOnly && (_jsx("button", { type: "button", className: css.linkButton, disabled: busyPoll === poll.id, onClick: () => { void closePoll(poll.id); }, children: t('poll.close') }))] }), poll.description !== undefined && _jsx("p", { className: css.description, children: poll.description }), _jsx("div", { className: css.options, children: poll.options.map((option) => {
                                            const chosen = poll.multiSelect ? draft.includes(option.id) : poll.myVotes.includes(option.id);
                                            if (!readOnly && poll.status === 'open') {
                                                return (_jsxs("button", { type: "button", className: css.option, "data-chosen": chosen || undefined, disabled: busyPoll === poll.id, onClick: () => {
                                                        if (poll.multiSelect)
                                                            toggleDraft(poll, option.id);
                                                        else
                                                            void vote(poll.id, chosen ? [] : [option.id]);
                                                    }, children: [_jsx("span", { children: option.label }), _jsx("span", { className: css.count, children: option.votes })] }, option.id));
                                            }
                                            return (_jsxs("div", { className: css.optionStatic, "data-chosen": chosen || undefined, children: [_jsx("span", { children: option.label }), _jsx("span", { className: css.count, children: option.votes })] }, option.id));
                                        }) }), !readOnly && poll.status === 'open' && poll.multiSelect && (_jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.submit, disabled: busyPoll === poll.id, onClick: () => { void vote(poll.id, draft); }, children: t('poll.cast') }), _jsx("button", { type: "button", className: css.clear, disabled: busyPoll === poll.id, onClick: () => { setDrafts((previous) => ({ ...previous, [poll.id]: [] })); void vote(poll.id, []); }, children: t('poll.clear') })] })), poll.decision !== undefined && (_jsxs("p", { className: css.decision, "data-quorum": poll.decision.insufficientQuorum || undefined, children: [poll.decision.insufficientQuorum
                                                ? t('poll.decision.quorum')
                                                : adoptedLabels.length === 0
                                                    ? t('poll.decision.none')
                                                    : t('poll.decision.adopted', { value: adoptedLabels.join('、') }), _jsx("span", { className: css.decisionSummary, children: poll.decision.summary })] })), selectedLabel.length > 0 && (_jsxs("p", { className: css.hint, children: [t('poll.youVoted', { value: selectedLabel.join('、') }), poll.myRevision === undefined ? '' : ` · ${t('poll.revision', { revision: poll.myRevision })}`] }))] }, poll.id));
                        }) }), !readOnly && (composerOpen ? (_jsxs("div", { className: css.composer, children: [_jsx("div", { className: css.createTitle, children: t('poll.createTitle') }), _jsx("input", { className: css.input, value: title, placeholder: t('poll.titlePlaceholder'), onChange: (event) => setTitle(event.target.value), "aria-label": t('poll.titleLabel') }), _jsx("textarea", { className: css.textarea, rows: 3, value: optionsText, placeholder: t('poll.optionsPlaceholder'), onChange: (event) => setOptionsText(event.target.value), "aria-label": t('poll.optionsLabel') }), _jsxs("div", { className: css.composerRow, children: [_jsxs("label", { className: css.inline, children: [t('poll.thresholdRule'), _jsxs("select", { className: css.select, value: thresholdRule, onChange: (event) => setThresholdRule(event.target.value), children: [_jsx("option", { value: "majority", children: t('poll.threshold.majority') }), _jsx("option", { value: "gt", children: t('poll.threshold.gt') }), _jsx("option", { value: "percent", children: t('poll.threshold.percent') })] })] }), thresholdRule !== 'majority' && (_jsxs("label", { className: css.inline, children: [t('poll.thresholdValue'), _jsx("input", { className: css.smallInput, type: "number", min: 1, max: thresholdRule === 'percent' ? 100 : undefined, value: thresholdValue, onChange: (event) => setThresholdValue(event.target.value) })] })), _jsxs("label", { className: css.inline, children: [t('poll.quorum'), _jsx("input", { className: css.smallInput, type: "number", min: 1, value: quorum, onChange: (event) => setQuorum(event.target.value) })] }), _jsxs("label", { className: css.checkbox, children: [_jsx("input", { type: "checkbox", checked: anonymous, onChange: (event) => setAnonymous(event.target.checked) }), t('poll.anonymous')] })] }), _jsxs("div", { className: css.composerRow, children: [_jsxs("label", { className: css.checkbox, children: [_jsx("input", { type: "checkbox", checked: multi, onChange: (event) => setMulti(event.target.checked) }), t('poll.multi')] }), multi && (_jsxs("label", { className: css.inline, children: [t('poll.maxSelections'), _jsx("input", { className: css.smallInput, type: "number", min: 2, value: maxSelections, onChange: (event) => setMaxSelections(event.target.value) })] })), _jsxs("label", { className: css.inline, children: [t('poll.duration'), _jsx("input", { className: css.smallInput, type: "number", min: 0, value: duration, onChange: (event) => setDuration(event.target.value) })] }), _jsx("button", { type: "button", className: css.submit, disabled: creating, onClick: () => { void create(); }, children: creating ? t('poll.submitting') : t('poll.submit') }), _jsx("button", { type: "button", className: css.clear, onClick: () => setComposerOpen(false), children: t('poll.composeClose') })] })] })) : (_jsxs("button", { type: "button", className: css.composeToggle, onClick: () => setComposerOpen(true), children: ["+ ", t('poll.compose')] }))), readOnly && _jsx("p", { className: css.hint, children: t('poll.readOnly') })] }))] }));
}
