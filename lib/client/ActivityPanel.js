import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AgentTeams activity panel: the top-right floater monitoring every team.
 *
 * Modeled on the Claude Code desktop SessionActivityPanel: a shell-overlay
 * panel that docks at the conversation's top-right edge by default, can be
 * dragged into a floating window, resized, and folded into an activity badge.
 * On wide viewports the docked panel makes the conversation column yield
 * space; narrow viewports keep a simple inset overlay. It
 * polls the host `/plugins/deers-dsh-agent-team/state` route for
 * server-side snapshots (durable files + live subagent activity), with a
 * collapsed badge that auto-expands once when activity appears. Archived
 * teams stay available for the owning conversation after live work ends.
 *
 * The floater mounts in ui-layout's additive `shell.overlay`; it is not a
 * conversation node — the in-conversation panel was removed in favor of this
 * always-available monitor.
 * @module deers-dsh-agent-team/client/activity
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, } from 'react';
import { IconBranchOutline16, IconChevronDownOutline14, IconPanelLeftOutline16, IconStopFill16, IconWarningOutline16, } from "./icons.js";
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { currentSessionId } from "./session-navigation.js";
import { BlackboardPanel } from "./BlackboardPanel.js";
import { openPollWindow } from "./poll-window-state.js";
import { activityPanelExpandedForSession, activityPanelShouldAutoExpand, compactDagLayout, compactModelLabel, COMPACT_DAG_NODE_HEIGHT, COMPACT_DAG_NODE_WIDTH, dependencyFocusTaskId, memberRouteLabel, orderDelegationMembers, relatedTaskIds, taskModelLabel, teamIsActive, usesParallelTaskGrid, } from "./activity-model.js";
import { ACTIVITY_HALT_URL, getActivityMonitorTargetsSnapshot, getActivitySnapshotsSnapshot, startActivityPolling, subscribeActivityMonitorTargets, subscribeActivitySnapshots, } from "./activity-monitor.js";
import { LEAD_ART, memberArtUrl } from "./artwork.js";
import { OPEN_PANEL_EVENT } from "./AgentTeamsCard.js";
import { StagingPlanEditor } from "./StagingPlanEditor.js";
import { DEFAULT_PANEL_LAYOUT, PANEL_LAYOUT_STORAGE_KEY, compactPanelForBounds, dockPanelLayout, floatPanelLayout, movePanelLayout, panelMaximumHeight, panelUsesAutoHeight, parsePanelLayout, resizePanelLayout, resolvePanelGeometry, } from "./panel-geometry.js";
import css from './ActivityPanel.module.css';
/** Grace before the panel collapses once no team remains. */
const AUTOCLOSE_GRACE_MS = 2000;
/**
 * Page-settle window after mount: activity restored on page load only shows
 * the collapsed badge, so the panel never yanks the conversation column
 * right after load. New activity after this window auto-expands as usual.
 */
const AUTO_OPEN_SETTLE_MS = 4000;
/** Root marker shared with the panel CSS while the shell overlay is expanded. */
const PANEL_OPEN_ATTRIBUTE = 'data-deers-agent-team-panel-open';
/** Shared width concession consumed by the conversation root CSS. */
const PANEL_SHIFT_PROPERTY = '--deers-agent-team-panel-shift';
const PANEL_CONVERSATION_GAP = 14;
const MOVE_THRESHOLD = 4;
const CAPTAIN_ASSIGNEE = 'captain';
function initialPanelLayout() {
    if (typeof window === 'undefined')
        return DEFAULT_PANEL_LAYOUT;
    return parsePanelLayout(window.localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY));
}
function initialPanelBounds() {
    if (typeof window === 'undefined')
        return { width: 1440, height: 900, anchorRight: 1440 };
    return { width: window.innerWidth, height: window.innerHeight, anchorRight: window.innerWidth };
}
/** Initial-letter fallback for unmatched roles. */
function memberInitial(name) {
    return name.trim().slice(0, 1).toUpperCase() || '?';
}
function stableHash(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
}
const ACCENTS = [
    'var(--dsw-alias-state-business-primary)',
    'var(--dsw-alias-state-success-primary)',
    'var(--dsw-alias-state-error-primary)',
    'var(--dsw-alias-state-warn-primary)',
    'var(--dsw-alias-label-tertiary)',
];
function accentOf(id) {
    return ACCENTS[stableHash(id) % ACCENTS.length] ?? ACCENTS[0];
}
/** Badge text follows the raw task status (finer than the 4 visual states):
 * claimed/pending/failed/cancelled keep their own labels and colors. */
const TASK_STATUS_LABEL = {
    pending: 'task.status.pending',
    claimed: 'task.status.claimed',
    in_progress: 'task.status.inProgress',
    completed: 'task.status.completed',
    failed: 'task.status.failed',
    cancelled: 'task.status.cancelled',
};
function taskStatusLabel(status, t) {
    const key = TASK_STATUS_LABEL[status];
    return key === undefined ? status : t(key);
}
function formatTaskIds(ids, t) {
    return ids.join(t('format.listSeparator'));
}
function taskTitle(task, model) {
    const extras = [
        task.kind,
        task.round === undefined ? undefined : `r${task.round}`,
        task.verdict,
        model === '' ? undefined : model,
    ].filter((item) => item !== undefined);
    return extras.length === 0 ? `${task.id} · ${task.subject}` : `${task.id} · ${task.subject} · ${extras.join(' · ')}`;
}
/** Badge/bar coloring key: visual state, widened for terminal statuses. */
function taskTone(state, status) {
    if (status === 'failed')
        return 'failed';
    if (status === 'cancelled')
        return 'cancelled';
    return state;
}
function Chevron({ open }) {
    return (_jsx("svg", { className: css.chevron, "data-open": open, width: "9", height: "9", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", "aria-hidden": true, children: _jsx("path", { d: "M3.5 2l3 3-3 3" }) }));
}
function WorkGlyph({ active }) {
    return (_jsx("svg", { className: css.workGlyph, "data-active": active, width: "11", height: "11", viewBox: "0 0 11 11", fill: "currentColor", "aria-hidden": true, children: [[0, 0], [4.2, 0], [8.4, 0], [0, 4.2], [4.2, 4.2], [8.4, 4.2]].map(([x, y], index) => (_jsx("rect", { x: x, y: y, width: "2.6", height: "2.6", rx: ".6", style: { animationDelay: `${index * 0.15}s` } }, `${x}:${y}`))) }));
}
/** Collapsed badge: an always-visible corner pill while any team exists. */
function CollapsedBadge({ count, busy, onClick, t }) {
    return (_jsxs("button", { type: "button", className: css.badge, "data-deers-agent-team-collapsed": true, "data-busy": busy, onClick: onClick, "aria-label": t('activity.badgeAria', { count }), children: [_jsx("span", { className: css.badgeDot, "data-busy": busy, "aria-hidden": true }), _jsx("span", { className: css.badgeCount, children: count })] }));
}
function memberStateLabel(member, tasks, historic, t) {
    const owned = tasks.filter((task) => task.assignee === member.name);
    if (member.activity === 'working')
        return t('member.state.working');
    if (owned.some((task) => task.status === 'failed'))
        return t('member.state.failed');
    if (owned.some((task) => task.state === 'blocked'))
        return t('member.state.waiting');
    if (owned.length > 0 && owned.every((task) => task.status === 'completed'))
        return t('member.state.delivered');
    if (member.status === 'removed')
        return t(historic ? 'member.state.left' : 'member.state.removed');
    if (owned.length > 0)
        return t('member.state.pending');
    return t('member.state.unassigned');
}
function memberStatusText(member, tasks, t) {
    const owned = tasks.filter((task) => task.assignee === member.name);
    const current = owned.find((task) => task.id === member.currentTask);
    const blocked = owned.find((task) => task.state === 'blocked');
    if (member.activity === 'working' && current !== undefined) {
        const model = taskModelLabel(current, [member]);
        return model === ''
            ? t('member.status.executing', { taskId: current.id })
            : t('member.status.executingModel', { taskId: current.id, model });
    }
    if (member.activity === 'working')
        return t('member.status.working');
    if (blocked !== undefined) {
        const dependency = tasks.find((task) => blocked.dependencies.includes(task.id) && task.state !== 'completed');
        if (dependency !== undefined) {
            return t('member.status.waitingOn', {
                taskId: dependency.id,
                assignee: dependency.assignee || t('task.assignee.unclaimed'),
            });
        }
        return t('member.status.waitingPrerequisite');
    }
    if (member.total === 0)
        return t('member.status.waitingAssignment');
    if (member.done === member.total)
        return t('member.status.delivered');
    if (owned.some((task) => task.status === 'failed'))
        return t('task.detail.failed');
    if (owned.length > 0 && owned.every((task) => task.status === 'completed' || task.status === 'cancelled'))
        return t('member.status.settled');
    return t(member.activity === 'idle' ? 'member.status.idle' : 'member.status.unknown');
}
function compactTaskLabel(subject) {
    const withoutVerb = subject.replace(/^开发\s*/u, '').replace(/^\d+[-_.、\s]*/u, '');
    const head = withoutVerb.split(/[（(·：:]/u)[0]?.trim() ?? withoutVerb;
    return head.length > 18 ? `${head.slice(0, 17)}…` : head;
}
function taskSummary(team, t, discarded = false) {
    const completed = team.tasks.filter((task) => task.status === 'completed');
    const cancelled = team.tasks.filter((task) => task.status === 'cancelled');
    const running = team.tasks.filter((task) => task.state === 'running');
    const blocked = team.tasks.filter((task) => task.state === 'blocked');
    const ready = team.tasks.filter((task) => task.state === 'open' && task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled');
    const failed = team.tasks.filter((task) => task.status === 'failed');
    if (discarded)
        return t('task.summary.discarded', { count: team.tasks.length });
    if (team.tasks.length === 0)
        return t('task.summary.waitingBreakdown');
    if (team.phase === 'staged')
        return t('task.summary.staged', { count: team.tasks.length });
    if (completed.length === team.tasks.length)
        return t('task.summary.allDelivered', { count: completed.length });
    if (completed.length + cancelled.length + failed.length === team.tasks.length) {
        return t('task.summary.ended', {
            completed: completed.length,
            cancelled: cancelled.length,
            failed: failed.length,
        });
    }
    if (failed.length > 0 && running.length === 0 && ready.length === 0 && blocked.length === 0) {
        return t('task.summary.failedSettled', { count: failed.length });
    }
    if (blocked.length > 0 && running.length > 0) {
        return t('task.summary.blockedAndRunning', {
            tasks: formatTaskIds(blocked.slice(0, 3).map((task) => task.id), t),
            more: blocked.length > 3 ? t('task.summary.more', { count: blocked.length - 3 }) : '',
        });
    }
    if (running.length > 0)
        return t('task.summary.running', { tasks: formatTaskIds(running.map((task) => task.id), t) });
    if (ready.length > 0)
        return t('task.summary.ready', { tasks: formatTaskIds(ready.map((task) => task.id), t) });
    if (blocked.length > 0)
        return t('task.summary.blocked', { tasks: formatTaskIds(blocked.map((task) => task.id), t) });
    return t('task.summary.waitingSchedule');
}
function ProgressOverview({ team, t, discarded = false }) {
    const running = discarded ? 0 : team.tasks.filter((task) => task.state === 'running').length;
    const queued = discarded ? 0 : team.tasks.filter((task) => task.state === 'open').length;
    const blocked = discarded ? 0 : team.tasks.filter((task) => task.state === 'blocked').length;
    const completed = discarded ? 0 : team.tasks.filter((task) => task.status === 'completed').length;
    const settled = !discarded && team.tasks.length > 0 && team.tasks.every((task) => (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'));
    const summaryTone = discarded ? 'discarded' : blocked > 0 || team.tasks.some(task => task.status === 'failed' || task.status === 'cancelled') ? 'warning' : settled ? 'completed' : 'running';
    const percent = team.tasks.length === 0 ? 0 : Math.round((completed / team.tasks.length) * 100);
    // One readable row holds ~30 segments; beyond that wrap into further rows
    // instead of squeezing every segment towards zero width.
    const segmentRows = [];
    for (let index = 0; index < team.tasks.length; index += PROGRESS_SEGMENTS_PER_ROW) {
        segmentRows.push(team.tasks.slice(index, index + PROGRESS_SEGMENTS_PER_ROW));
    }
    return (_jsxs("section", { className: css.progressOverview, "aria-label": t('progress.aria'), "data-progress-summary": true, "data-tone": summaryTone, children: [_jsxs("header", { className: css.summaryHead, children: [_jsx("span", { className: css.progressTitle, children: t('progress.title') }), _jsxs("span", { className: css.summaryFraction, children: [completed, "/", team.tasks.length] }), _jsxs("span", { className: css.deliveryRingWrap, role: "img", "aria-label": t('progress.rate', { percent }), children: [_jsxs("svg", { className: css.deliveryRing, viewBox: "0 0 40 40", "aria-hidden": true, children: [_jsx("circle", { className: css.deliveryRingTrack, cx: "20", cy: "20", r: "16" }), _jsx("circle", { className: css.deliveryRingValue, cx: "20", cy: "20", r: "16", pathLength: 100, strokeDasharray: `${percent} ${100 - percent}` })] }), _jsxs("span", { className: css.deliveryRingLabel, children: [percent, "%"] })] })] }), _jsxs("div", { className: css.summaryStats, children: [_jsxs("span", { "data-state": "running", children: [_jsx("b", { children: running }), t('progress.runningShort')] }), _jsxs("span", { "data-state": "open", children: [_jsx("b", { children: queued }), t('progress.queuedShort')] }), _jsxs("span", { "data-state": "blocked", children: [_jsx("b", { children: blocked }), t('progress.blockedShort')] }), _jsxs("span", { "data-state": "completed", children: [_jsx("b", { children: completed }), t('progress.deliveredShort')] })] }), team.tasks.length > 0 ? (_jsx("span", { className: css.progressSegmentRows, "aria-hidden": true, children: segmentRows.map((row, index) => (_jsx("span", { className: css.progressSegments, children: row.map((task) => _jsx("span", { "data-state": discarded ? 'cancelled' : taskTone(task.state, task.status) }, task.id)) }, index))) })) : _jsx("span", { className: css.progressEmpty }), _jsxs("span", { className: css.progressSummary, "data-state": summaryTone, children: [_jsx("span", { className: css.progressSummaryDot }), _jsx("span", { children: taskSummary(team, t, discarded) })] })] }));
}
function DependencyMap({ tasks, members, t, discarded = false, workspace = false, onSelectTask, teamId = '', captainSessionId = '', storageKey, filter = 'all', onFilterChange, interactive = false }) {
    const [open, setOpen] = useState(() => storageKey === undefined ? true : readViewFlag(`dag-open:${storageKey}`, true));
    const [hoverTaskId, setHoverTaskId] = useState(null);
    const [keyboardTaskId, setKeyboardTaskId] = useState(null);
    const [pinnedTaskId, setPinnedTaskId] = useState(null);
    const hoverTimer = useRef(null);
    const focusedTaskId = dependencyFocusTaskId(pinnedTaskId, keyboardTaskId, hoverTaskId);
    const nodeWidth = workspace ? 164 : COMPACT_DAG_NODE_WIDTH;
    const nodeHeight = workspace ? 76 : COMPACT_DAG_NODE_HEIGHT;
    const layout = useMemo(() => compactDagLayout(tasks, workspace
        ? { nodeWidth: 164, nodeHeight: 76, columnGap: 36, rowGap: 16 } : undefined), [tasks, workspace]);
    const parallel = useMemo(() => usesParallelTaskGrid(tasks), [tasks]);
    const related = useMemo(() => focusedTaskId === null ? null : relatedTaskIds(focusedTaskId, tasks), [focusedTaskId, tasks]);
    // Zoom & pan for the dependency canvas (Godot-style viewport + minimap).
    const viewportRef = useRef(null);
    const canvasRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
    const panDrag = useRef(null);
    const zoomBy = useCallback((factor) => {
        const viewport = viewportRef.current;
        setZoom(current => {
            const next = Math.min(2.5, Math.max(0.35, current * factor));
            const ratio = next / current;
            const left = viewport === null ? viewportSize.w / 2 : viewport.clientWidth / 2;
            const top = viewport === null ? viewportSize.h / 2 : viewport.clientHeight / 2;
            setPan(p => ({ x: left - (left - p.x) * ratio, y: top - (top - p.y) * ratio }));
            return next;
        });
    }, [viewportSize]);
    const fitView = useCallback(() => {
        const viewport = viewportRef.current;
        const canvas = canvasRef.current;
        if (viewport === null || canvas === null)
            return;
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        if (width <= 0 || height <= 0)
            return;
        const scale = Math.min(1, viewport.clientWidth / width, viewport.clientHeight / height);
        setZoom(scale);
        setPan({
            x: Math.max(0, (viewport.clientWidth - width * scale) / 2),
            y: Math.max(0, (viewport.clientHeight - height * scale) / 2),
        });
    }, []);
    const resetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);
    useEffect(() => {
        const viewport = viewportRef.current;
        if (viewport === null || parallel || !open)
            return;
        const onWheel = (event) => {
            event.preventDefault();
            const rect = viewport.getBoundingClientRect();
            const factor = Math.exp(-event.deltaY * 0.0015);
            setZoom(current => {
                const next = Math.min(2.5, Math.max(0.35, current * factor));
                const ratio = next / current;
                const left = event.clientX - rect.left;
                const top = event.clientY - rect.top;
                setPan(p => ({ x: left - (left - p.x) * ratio, y: top - (top - p.y) * ratio }));
                return next;
            });
        };
        viewport.addEventListener('wheel', onWheel, { passive: false });
        return () => { viewport.removeEventListener('wheel', onWheel); };
    }, [open, parallel]);
    useEffect(() => {
        const viewport = viewportRef.current;
        if (viewport === null || parallel || !open)
            return;
        setViewportSize({ w: viewport.clientWidth, h: viewport.clientHeight });
        if (typeof ResizeObserver === 'undefined')
            return;
        const observer = new ResizeObserver(() => setViewportSize({ w: viewport.clientWidth, h: viewport.clientHeight }));
        observer.observe(viewport);
        return () => { observer.disconnect(); };
    }, [open, parallel]);
    const onViewportPointerDown = (event) => {
        if (parallel || event.target.closest('button') !== null)
            return;
        event.currentTarget.setPointerCapture(event.pointerId);
        panDrag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y };
    };
    const onViewportPointerMove = (event) => {
        const drag = panDrag.current;
        if (drag === null || drag.pointerId !== event.pointerId)
            return;
        setPan({ x: drag.originX + (event.clientX - drag.startX), y: drag.originY + (event.clientY - drag.startY) });
    };
    const endViewportPan = (event) => {
        if (panDrag.current !== null && panDrag.current.pointerId === event.pointerId)
            panDrag.current = null;
    };
    const onMinimapPointer = (event) => {
        const canvas = canvasRef.current;
        const viewport = viewportRef.current;
        if (canvas === null || viewport === null || layout.width <= 0 || layout.height <= 0)
            return;
        const rect = event.currentTarget.getBoundingClientRect();
        const worldX = ((event.clientX - rect.left) / rect.width) * layout.width;
        const worldY = ((event.clientY - rect.top) / rect.height) * layout.height;
        setPan({ x: viewport.clientWidth / 2 - worldX * zoom, y: viewport.clientHeight / 2 - worldY * zoom });
    };
    // Panel task operations + durable history (workspace, live teams only).
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState('');
    const [reassignTarget, setReassignTarget] = useState('');
    const [historyTaskId, setHistoryTaskId] = useState(null);
    const [historyState, setHistoryState] = useState(undefined);
    const scheduleHover = (id) => {
        if (hoverTimer.current !== null) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
        if (id === null) {
            setHoverTaskId(null);
            return;
        }
        hoverTimer.current = setTimeout(() => {
            hoverTimer.current = null;
            setHoverTaskId(id);
        }, 180);
    };
    useEffect(() => () => {
        if (hoverTimer.current !== null)
            clearTimeout(hoverTimer.current);
    }, []);
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setPinnedTaskId(null);
                onSelectTask?.(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => { window.removeEventListener('keydown', onKeyDown); };
    }, [onSelectTask]);
    useEffect(() => {
        if (storageKey !== undefined)
            storeViewFlag(`dag-open:${storageKey}`, open);
    }, [open, storageKey]);
    if (tasks.length === 0)
        return null;
    const fallbackTask = tasks.find((task) => task.state === 'blocked')
        ?? tasks.find((task) => task.state === 'running')
        ?? tasks[0];
    const detailTask = tasks.find((task) => task.id === focusedTaskId) ?? fallbackTask;
    const detailModel = taskModelLabel(detailTask, members);
    const waitingOn = detailTask.dependencies.filter((dependency) => (tasks.find((task) => task.id === dependency)?.status !== 'completed'));
    const dependents = tasks.filter((task) => task.dependencies.includes(detailTask.id));
    const historyForTask = historyState !== undefined && historyState.taskId === detailTask.id ? historyState.data : undefined;
    const runOp = async (op) => {
        if (teamId === '' || captainSessionId === '')
            return;
        setActionBusy(true);
        setActionError('');
        try {
            const response = await fetch('/plugins/deers-dsh-agent-team/task-op', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    sessionId: captainSessionId,
                    teamId,
                    taskId: detailTask.id,
                    op,
                    ...(op === 'reassign' ? { assignee: reassignTarget } : {}),
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${response.status}`);
        }
        catch (error) {
            setActionError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setActionBusy(false);
        }
    };
    const loadHistory = async () => {
        if (teamId === '' || captainSessionId === '')
            return;
        setHistoryState({ taskId: detailTask.id, data: 'loading' });
        try {
            const response = await fetch(`/plugins/deers-dsh-agent-team/history?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}&taskId=${encodeURIComponent(detailTask.id)}`);
            const body = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${response.status}`);
            setHistoryState({ taskId: detailTask.id, data: body });
        }
        catch {
            setHistoryState({ taskId: detailTask.id, data: 'error' });
        }
    };
    return (_jsxs("section", { className: css.dependencySection, "aria-label": t('dependency.aria'), "data-dependency-map": true, children: [_jsxs("header", { className: css.sectionHead, children: [_jsxs("button", { type: "button", className: css.sectionToggleTitle, onClick: () => { setOpen((current) => !current); }, "aria-expanded": open, children: [_jsx(Chevron, { open: open }), _jsx(IconBranchOutline16, {}), " ", t(parallel ? 'dependency.parallel' : 'dependency.title')] }), workspace && (_jsx("span", { className: css.taskFilterRow, role: "group", "aria-label": t('task.filterAria'), children: TASK_FILTERS.map(({ key, label }) => (_jsx("button", { type: "button", className: css.taskFilterChip, "aria-pressed": filter === key, onClick: () => onFilterChange?.(key), children: t(label) }, key))) })), _jsx("span", { className: css.sectionHint, children: pinnedTaskId === null
                            ? t(parallel ? 'dependency.hint.parallel' : workspace ? 'workspace.dependencies' : 'dependency.hint.chain')
                            : t('dependency.hint.pinned', { taskId: pinnedTaskId }) }), _jsx("span", { className: css.starMapCount, children: t('dependency.count', { count: tasks.length }) })] }), open && (_jsxs(_Fragment, { children: [_jsxs("div", { className: css.dagZoomWrap, children: [_jsx("div", { ref: viewportRef, className: css.dagViewport, "data-canvas": parallel ? 'scroll' : 'zoom', onPointerDown: onViewportPointerDown, onPointerMove: onViewportPointerMove, onPointerUp: endViewportPan, onPointerCancel: endViewportPan, children: _jsxs("div", { ref: canvasRef, className: css.dagCanvas, "data-layout": parallel ? 'parallel' : 'dependency', style: parallel ? undefined : {
                                        width: layout.width,
                                        height: layout.height,
                                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                        transformOrigin: '0 0',
                                    }, children: [!parallel && _jsx("svg", { className: css.dagEdges, width: layout.width, height: layout.height, "aria-hidden": true, children: layout.edges.map((edge) => {
                                                const active = related !== null && related.has(edge.from) && related.has(edge.to);
                                                return _jsx("path", { d: edge.path, "data-active": active, "data-dimmed": related !== null && !active }, `${edge.from}:${edge.to}`);
                                            }) }), layout.nodes.map(({ task, x, y }) => {
                                            const model = taskModelLabel(task, members);
                                            return (_jsxs("button", { type: "button", className: css.dagNode, style: parallel
                                                    ? { height: nodeHeight }
                                                    : { left: x, top: y, width: nodeWidth, height: nodeHeight }, "data-task-id": task.id, "data-state": discarded ? 'cancelled' : taskTone(task.state, task.status), "data-task-model": model || undefined, "data-focused": related?.has(task.id) ?? false, "data-dimmed": related !== null && !related.has(task.id), "data-filter-out": filter !== 'all' && !taskMatchesFilter(task, filter) || undefined, "aria-pressed": pinnedTaskId === task.id, title: taskTitle(task, model), onClick: () => { const next = pinnedTaskId === task.id ? null : task.id; setPinnedTaskId(next); onSelectTask?.(next); }, onMouseEnter: () => { scheduleHover(task.id); }, onMouseLeave: () => { scheduleHover(null); }, onFocus: () => { setKeyboardTaskId(task.id); }, onBlur: () => { setKeyboardTaskId(null); }, children: [_jsxs("span", { className: css.dagNodeHead, children: [_jsx("span", { className: css.dagNodeDot }), task.id, workspace && _jsx("span", { className: css.dagOwner, children: task.assignee || t('task.assignee.unclaimed') })] }), _jsx("span", { className: css.dagNodeLabel, children: workspace ? task.subject : compactTaskLabel(task.subject) }), task.state === 'running' && (_jsx("span", { className: css.dagRunningState, "aria-label": t('task.runningAria'), children: _jsx(WorkGlyph, { active: true }) }))] }, task.id));
                                        })] }) }), !parallel && (_jsxs(_Fragment, { children: [_jsxs("span", { className: css.dagZoomControls, children: [_jsx("button", { type: "button", onClick: () => zoomBy(1 / 1.2), "aria-label": t('dag.zoomOut'), children: "\u2212" }), _jsxs("button", { type: "button", onClick: resetView, "aria-label": t('dag.reset'), children: [Math.round(zoom * 100), "%"] }), _jsx("button", { type: "button", onClick: () => zoomBy(1.2), "aria-label": t('dag.zoomIn'), children: "+" }), _jsx("button", { type: "button", onClick: fitView, "aria-label": t('dag.fit'), children: t('dag.fit') })] }), _jsx("div", { className: css.dagMinimap, "aria-hidden": true, children: _jsxs("div", { className: css.dagMinimapCanvas, onPointerDown: onMinimapPointer, onPointerMove: onMinimapPointer, children: [layout.nodes.map(({ task, x, y }) => (_jsx("span", { className: css.dagMinimapNode, "data-state": discarded ? 'cancelled' : taskTone(task.state, task.status), style: {
                                                        left: `${layout.width <= 0 ? 0 : (x / layout.width) * 100}%`,
                                                        top: `${layout.height <= 0 ? 0 : (y / layout.height) * 100}%`,
                                                        width: `${layout.width <= 0 ? 0 : (nodeWidth / layout.width) * 100}%`,
                                                        height: `${layout.height <= 0 ? 0 : (nodeHeight / layout.height) * 100}%`,
                                                    } }, task.id))), viewportSize.w > 0 && zoom > 0 && layout.width > 0 && layout.height > 0 && (_jsx("span", { className: css.dagMinimapView, style: {
                                                        left: `${Math.max(0, (-pan.x / zoom) / layout.width * 100)}%`,
                                                        top: `${Math.max(0, (-pan.y / zoom) / layout.height * 100)}%`,
                                                        width: `${Math.min(100, (viewportSize.w / zoom) / layout.width * 100)}%`,
                                                        height: `${Math.min(100, (viewportSize.h / zoom) / layout.height * 100)}%`,
                                                    } }))] }) })] }))] }), _jsxs("section", { className: css.taskDetail, "data-task-detail": detailTask.id, children: [_jsxs("span", { className: css.taskDetailHead, children: [_jsx("span", { className: css.taskDetailId, children: detailTask.id }), _jsx("span", { className: css.taskDetailSubject, title: detailTask.subject, children: detailTask.subject.replace(/^开发\s*/u, '') }), _jsx("span", { className: css.taskDetailBadge, "data-state": discarded ? 'cancelled' : taskTone(detailTask.state, detailTask.status), children: discarded ? t('task.status.notRun') : taskStatusLabel(detailTask.status, t) }), (detailTask.attempt ?? 0) > 1 && _jsxs("span", { className: css.taskDetailAttempt, children: [t('task.history'), " #", detailTask.attempt] })] }), _jsxs("span", { className: css.taskDetailLine, children: [detailTask.assignee || t('task.assignee.unclaimed'), " \u00B7 ", discarded
                                        ? t('task.detail.notRun')
                                        : detailTask.status === 'completed'
                                            ? t('task.detail.completed')
                                            : detailTask.status === 'cancelled'
                                                ? t('task.detail.cancelled')
                                                : detailTask.status === 'failed'
                                                    ? t('task.detail.failed')
                                                    : detailTask.dependencies.length === 0
                                                        ? t('task.detail.noPrerequisite')
                                                        : waitingOn.length === 0
                                                            ? t('task.detail.ready')
                                                            : t('task.detail.waitingOn', { tasks: formatTaskIds(waitingOn, t) })] }), detailModel !== '' && (_jsx("span", { className: css.taskDetailModel, "data-task-model": detailModel, children: t('task.model', { model: detailModel }) })), _jsx("span", { className: css.taskDetailMeta, children: dependents.length === 0
                                    ? t('task.detail.noDownstream')
                                    : t('task.detail.unlocks', { tasks: formatTaskIds(dependents.map((task) => task.id), t) }) }), interactive && (_jsxs("span", { className: css.taskActions, children: [detailTask.status === 'pending' && (_jsxs(_Fragment, { children: [_jsxs("select", { className: css.taskActionSelect, value: reassignTarget, onChange: event => setReassignTarget(event.target.value), "aria-label": t('task.reassign'), children: [_jsx("option", { value: "", children: t('task.reassign.pool') }), members.filter(member => member.status !== 'removed').map(member => (_jsx("option", { value: member.name, children: member.name }, member.name))), _jsx("option", { value: "captain", children: t('task.reassign.captain') })] }), _jsx("button", { type: "button", disabled: actionBusy || reassignTarget === detailTask.assignee, onClick: () => { void runOp('reassign'); }, children: t('task.reassign') })] })), (detailTask.status === 'claimed' || detailTask.status === 'in_progress') && (_jsx("button", { type: "button", disabled: actionBusy, onClick: () => { if (window.confirm(t('task.redispatchConfirm')))
                                            void runOp('redispatch'); }, children: t('task.redispatch') })), (detailTask.status === 'pending' || detailTask.status === 'claimed' || detailTask.status === 'in_progress') && (_jsx("button", { type: "button", "data-danger": true, disabled: actionBusy, onClick: () => { if (window.confirm(t('task.cancelConfirm')))
                                            void runOp('cancel'); }, children: t('task.cancel') })), actionError !== '' && _jsx("span", { className: css.taskActionError, role: "alert", children: actionError })] })), interactive && (_jsxs("span", { className: css.taskHistoryBlock, children: [_jsxs("button", { type: "button", className: css.taskHistoryToggle, "aria-expanded": historyTaskId === detailTask.id, onClick: () => {
                                            const next = historyTaskId !== detailTask.id;
                                            setHistoryTaskId(next ? detailTask.id : null);
                                            if (next && historyForTask === undefined)
                                                void loadHistory();
                                        }, children: [_jsx(Chevron, { open: historyTaskId === detailTask.id }), t('task.history')] }), historyTaskId === detailTask.id && (historyForTask === undefined || historyForTask === 'loading' ? _jsx("span", { className: css.taskHistoryLoading, children: t('workspace.loading') })
                                        : historyForTask === 'error' ? _jsx("span", { role: "alert", children: t('task.historyFailed') }) : (_jsxs("span", { className: css.taskHistoryBody, children: [historyForTask.revisions.length > 0 && (_jsxs("span", { className: css.taskHistoryGroup, children: [_jsx("span", { className: css.taskHistoryGroupTitle, children: t('task.history.revisions') }), historyForTask.revisions.map((revision, index) => (_jsxs("span", { className: css.taskHistoryRow, title: revision.reason, children: [new Date(revision.at).toLocaleString(), " \u00B7 ", revision.by, " \u00B7 ", revision.reason] }, `${revision.at}:${index}`)))] })), historyForTask.supplementalEvidence.length > 0 && (_jsxs("span", { className: css.taskHistoryGroup, children: [_jsx("span", { className: css.taskHistoryGroupTitle, children: t('task.history.supplemental') }), historyForTask.supplementalEvidence.map((item, index) => (_jsxs("span", { className: css.taskHistoryRow, title: item.note, children: ["#", item.attempt, " \u00B7 ", item.by, " \u00B7 ", new Date(item.at).toLocaleString(), " \u00B7 ", item.note] }, `${item.at}:${index}`)))] })), historyForTask.output !== undefined && (_jsxs("span", { className: css.taskHistoryGroup, children: [_jsx("span", { className: css.taskHistoryGroupTitle, children: t('task.history.output') }), _jsx("span", { className: css.taskHistoryRow, children: historyForTask.output })] })), historyForTask.revisions.length === 0 && historyForTask.supplementalEvidence.length === 0 && historyForTask.output === undefined && (_jsx("span", { className: css.taskHistoryRow, children: t('task.historyEmpty') }))] })))] }))] })] }))] }));
}
/** Panel mailbox viewer: read one recipient's messages and (for members)
 * send a captain-authored reply that wakes the member. */
function MemberMailModal({ teamId, captainSessionId, member, onClose, t }) {
    const [messages, setMessages] = useState('loading');
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const isCaptain = member === 'captain';
    const reload = useCallback(() => {
        fetch(`/plugins/deers-dsh-agent-team/mail?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}&member=${encodeURIComponent(member)}`)
            .then(async (response) => {
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const body = await response.json();
            setMessages(Array.isArray(body.messages) ? body.messages : []);
        })
            .catch(() => setMessages('error'));
    }, [captainSessionId, teamId, member]);
    useEffect(() => { reload(); }, [reload]);
    const send = async () => {
        setSending(true);
        setSendError('');
        try {
            const response = await fetch('/plugins/deers-dsh-agent-team/message', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ sessionId: captainSessionId, teamId, to: member, content: draft }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${response.status}`);
            setDraft('');
            reload();
        }
        catch (error) {
            setSendError(error instanceof Error ? error.message : String(error));
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs(Modal, { open: true, onClose: onClose, title: t('mail.title', { name: member }), closeLabel: t('plan.cancel'), children: [_jsx("div", { className: css.mailList, children: messages === 'loading' ? _jsx("span", { className: css.mailStatus, children: t('workspace.loading') })
                    : messages === 'error' ? _jsx("span", { className: css.mailStatus, role: "alert", children: t('task.historyFailed') })
                        : messages.length === 0 ? _jsx("span", { className: css.mailStatus, children: t('mail.empty') })
                            : messages.map(message => (_jsxs("div", { className: css.mailMessage, "data-from": message.from === 'captain' ? 'captain' : 'member', children: [_jsxs("span", { className: css.mailMeta, children: [message.from, " \u2192 ", message.to, " \u00B7 ", new Date(message.ts).toLocaleString()] }), _jsx("span", { className: css.mailBody, children: message.content })] }, message.id))) }), !isCaptain ? (_jsxs("div", { className: css.mailCompose, children: [_jsx("textarea", { className: css.mailInput, value: draft, rows: 3, placeholder: t('mail.placeholder'), onChange: event => setDraft(event.target.value) }), _jsx("button", { type: "button", disabled: sending || draft.trim() === '', onClick: () => { void send(); }, children: t('mail.send') }), sendError !== '' && _jsx("span", { className: css.taskActionError, role: "alert", children: sendError })] })) : _jsx("span", { className: css.mailStatus, children: t('mail.readOnly') })] }));
}
/** Derived activity timeline: durable members/tasks/mailbox records ordered
 * newest first, fetched on first expand. */
function TeamTimeline({ teamId, captainSessionId, t }) {
    const [open, setOpen] = useState(false);
    const [entries, setEntries] = useState('loading');
    useEffect(() => {
        if (!open)
            return;
        let cancelled = false;
        setEntries('loading');
        fetch(`/plugins/deers-dsh-agent-team/timeline?sessionId=${encodeURIComponent(captainSessionId)}&teamId=${encodeURIComponent(teamId)}`)
            .then(async (response) => {
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const body = await response.json();
            if (!cancelled)
                setEntries(Array.isArray(body.entries) ? body.entries : []);
        })
            .catch(() => { if (!cancelled)
            setEntries('error'); });
        return () => { cancelled = true; };
    }, [open, teamId, captainSessionId]);
    const describe = (entry) => {
        if (entry.kind === 'member-joined')
            return t('timeline.memberJoined', { name: entry.name ?? '' });
        if (entry.kind === 'task-created')
            return t('timeline.taskCreated', { taskId: entry.taskId ?? '', assignee: entry.assignee || t('task.assignee.unclaimed') });
        if (entry.kind === 'task-status')
            return t('timeline.taskStatus', { taskId: entry.taskId ?? '', status: taskStatusLabel(entry.status ?? '', t) });
        if (entry.kind === 'message')
            return t('timeline.message', { from: entry.from ?? '', to: entry.to ?? '' });
        return entry.kind;
    };
    return (_jsxs("section", { className: css.timelineSection, "data-team-timeline": true, children: [_jsx("header", { className: css.sectionHead, children: _jsxs("button", { type: "button", className: css.sectionToggleTitle, onClick: () => { setOpen(current => !current); }, "aria-expanded": open, children: [_jsx(Chevron, { open: open }), " ", t('timeline.title')] }) }), open && (entries === 'loading' ? _jsx("span", { className: css.timelineLoading, children: t('workspace.loading') })
                : entries === 'error' ? _jsx("span", { className: css.timelineLoading, role: "alert", children: t('task.historyFailed') })
                    : entries.length === 0 ? _jsx("span", { className: css.timelineLoading, children: t('timeline.empty') })
                        : _jsx("span", { className: css.timelineRows, children: entries.map((entry, index) => (_jsxs("span", { className: css.timelineRow, "data-kind": entry.kind, children: [_jsx("span", { className: css.timelineTime, children: new Date(entry.ts).toLocaleTimeString() }), _jsx("span", { className: css.timelineText, children: describe(entry) })] }, `${entry.ts}:${entry.kind}:${index}`))) }))] }));
}
/** Workspace split state: a Godot-style draggable separator between the
 * delegation tree (left) and the dependency map (right). The chosen ratio is
 * a percentage of the team section width, persisted per browser profile. */
const WORKSPACE_SPLIT_STORAGE_KEY = 'deers-agent-team.workspace-split';
const WORKSPACE_SPLIT_DEFAULT = 38.5;
const WORKSPACE_SPLIT_MIN = 22;
const WORKSPACE_SPLIT_MAX = 78;
/** Segments per progress row: beyond this the overview wraps to a new row
 * instead of squeezing every segment towards zero width. */
const PROGRESS_SEGMENTS_PER_ROW = 30;
const TASK_FILTERS = [
    { key: 'all', label: 'task.filter.all' },
    { key: 'running', label: 'task.filter.running' },
    { key: 'blocked', label: 'task.filter.blocked' },
    { key: 'failed', label: 'task.filter.failed' },
    { key: 'completed', label: 'task.filter.completed' },
];
function taskMatchesFilter(task, filter) {
    if (filter === 'all')
        return true;
    if (filter === 'running')
        return task.state === 'running';
    if (filter === 'blocked')
        return task.state === 'blocked';
    if (filter === 'failed')
        return task.status === 'failed' || task.status === 'cancelled';
    return task.status === 'completed';
}
/** Collapsible view states persist per team so re-opening the panel restores them. */
const VIEW_FLAG_PREFIX = 'deers-agent-team.view.';
function readViewFlag(key, fallback) {
    try {
        const raw = window.localStorage.getItem(VIEW_FLAG_PREFIX + key);
        return raw === null ? fallback : raw === '1';
    }
    catch {
        return fallback;
    }
}
function storeViewFlag(key, value) {
    try {
        window.localStorage.setItem(VIEW_FLAG_PREFIX + key, value ? '1' : '0');
    }
    catch {
        /* storage unavailable: the flag stays session-only */
    }
}
function clampWorkspaceSplit(value) {
    if (!Number.isFinite(value))
        return WORKSPACE_SPLIT_DEFAULT;
    return Math.min(WORKSPACE_SPLIT_MAX, Math.max(WORKSPACE_SPLIT_MIN, value));
}
function readStoredWorkspaceSplit() {
    try {
        const raw = window.localStorage.getItem(WORKSPACE_SPLIT_STORAGE_KEY);
        return clampWorkspaceSplit(raw === null ? Number.NaN : Number(raw));
    }
    catch {
        return WORKSPACE_SPLIT_DEFAULT;
    }
}
function storeWorkspaceSplit(value) {
    try {
        window.localStorage.setItem(WORKSPACE_SPLIT_STORAGE_KEY, String(value));
    }
    catch {
        /* storage unavailable (private mode, quota): the ratio stays session-only */
    }
}
export function TeamSection({ team, modelDirectory, onContinuePlanning, onDiscarded, onNavigate, t, historic = false, workspace = false }) {
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const selectedAssignee = team.tasks.find(task => task.id === selectedTaskId)?.assignee;
    const [membersOpen, setMembersOpen] = useState(() => readViewFlag(`members-open:${team.teamId}`, workspace));
    const [taskFilter, setTaskFilter] = useState('all');
    const [mailMember, setMailMember] = useState(null);
    useEffect(() => { storeViewFlag(`members-open:${team.teamId}`, membersOpen); }, [membersOpen, team.teamId]);
    const [stopOpen, setStopOpen] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [stopError, setStopError] = useState('');
    const teamSectionRef = useRef(null);
    const [workspaceSplit, setWorkspaceSplit] = useState(readStoredWorkspaceSplit);
    const [workspaceSplitDragging, setWorkspaceSplitDragging] = useState(false);
    const workspaceSplitDrag = useRef(null);
    const workspaceSplitValue = useRef(workspaceSplit);
    const applyWorkspaceSplit = useCallback((clientX) => {
        const rect = teamSectionRef.current?.getBoundingClientRect();
        if (rect === undefined || rect.width <= 0)
            return;
        const next = clampWorkspaceSplit(((clientX - rect.left) / rect.width) * 100);
        workspaceSplitValue.current = next;
        setWorkspaceSplit(next);
    }, []);
    const onWorkspaceSplitPointerDown = useCallback((event) => {
        if (!event.isPrimary)
            return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        workspaceSplitDrag.current = event.pointerId;
        setWorkspaceSplitDragging(true);
        applyWorkspaceSplit(event.clientX);
    }, [applyWorkspaceSplit]);
    const onWorkspaceSplitPointerMove = useCallback((event) => {
        if (workspaceSplitDrag.current !== event.pointerId)
            return;
        applyWorkspaceSplit(event.clientX);
    }, [applyWorkspaceSplit]);
    const endWorkspaceSplitDrag = useCallback((event) => {
        if (workspaceSplitDrag.current !== event.pointerId)
            return;
        workspaceSplitDrag.current = null;
        setWorkspaceSplitDragging(false);
        storeWorkspaceSplit(workspaceSplitValue.current);
    }, []);
    const onWorkspaceSplitKeyDown = useCallback((event) => {
        const step = event.shiftKey ? 5 : 1.5;
        let next;
        if (event.key === 'ArrowLeft')
            next = clampWorkspaceSplit(workspaceSplitValue.current - step);
        else if (event.key === 'ArrowRight')
            next = clampWorkspaceSplit(workspaceSplitValue.current + step);
        else if (event.key === 'Home')
            next = WORKSPACE_SPLIT_DEFAULT;
        else
            return;
        event.preventDefault();
        workspaceSplitValue.current = next;
        setWorkspaceSplit(next);
        storeWorkspaceSplit(next);
    }, []);
    const discarded = historic && team.phase === 'staged';
    const stopped = !historic && team.halted === true;
    const busyCount = team.members.filter((member) => member.activity === 'working').length;
    const assignedCount = team.tasks.filter((task) => task.assignee !== '' && task.assignee !== CAPTAIN_ASSIGNEE).length;
    const captainOwned = team.tasks.filter((task) => task.assignee === CAPTAIN_ASSIGNEE
        && task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled');
    const captainBusy = captainOwned.length > 0;
    const captainTaskIds = formatTaskIds(captainOwned.map((task) => task.id), t);
    const completedCount = team.tasks.filter((task) => task.status === 'completed').length;
    const allCompleted = team.tasks.length > 0 && completedCount === team.tasks.length;
    const allSettled = team.tasks.length > 0 && team.tasks.every((task) => (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'));
    const unfinishedCount = team.tasks.filter((task) => (task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled')).length;
    const canStop = !historic && team.phase === 'running' && team.halted !== true && teamIsActive(team);
    const stopTeam = async () => {
        if (stopping)
            return;
        setStopping(true);
        setStopError('');
        try {
            const response = await fetch(ACTIVITY_HALT_URL, {
                method: 'POST',
                cache: 'no-store',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ sessionId: team.captainSessionId, teamId: team.teamId }),
            });
            if (!response.ok) {
                let message = t('team.stopRequestFailed');
                try {
                    const body = await response.json();
                    if (typeof body.error === 'string' && body.error.trim() !== '')
                        message = body.error;
                }
                catch { }
                throw new Error(message);
            }
            setStopOpen(false);
        }
        catch (error) {
            setStopError(t('team.stopFailed', { message: error instanceof Error ? error.message : String(error) }));
        }
        finally {
            setStopping(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("section", { ref: teamSectionRef, className: css.team, "data-team-id": team.teamId, "data-workspace-team": workspace || undefined, style: workspace ? { '--workspace-split': `${workspaceSplit}%` } : undefined, children: [_jsxs("header", { className: css.teamHead, children: [_jsx("span", { className: css.teamName, title: team.name, children: team.name }), _jsx("span", { className: css.phasePill, "data-phase": team.phase, "data-halted": stopped || undefined, children: t(stopped ? 'team.phase.halted' : team.phase === 'staged' ? 'team.phase.staged' : 'team.phase.running') }), historic && _jsx("span", { className: css.historicPill, children: t(discarded ? 'team.discarded' : 'team.ended') }), stopped && _jsx("span", { className: css.historicPill, children: t('team.stopped') }), _jsxs("span", { className: css.teamStats, children: [_jsx("span", { "data-stat": "members", children: t('team.stats.members', { count: team.members.length }) }), _jsx("span", { "data-stat": "tasks", children: t('team.stats.completed', { completed: completedCount, total: team.tasks.length }) }), _jsx("span", { "data-stat": "messages", children: t('team.stats.messages', { count: team.messageCount }) })] }), _jsxs("button", { type: "button", className: css.teamPollButton, "aria-label": t('poll.open'), title: t('poll.open'), "data-poll-open": true, onClick: () => openPollWindow({
                                    teamId: team.teamId,
                                    captainSessionId: team.captainSessionId,
                                    teamName: team.name,
                                    readOnly: historic,
                                }), children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDDF3" }), _jsx("span", { children: t('poll.button') })] }), canStop && (_jsx("button", { type: "button", className: css.teamStopButton, "aria-label": t('team.stop'), title: t('team.stop'), onClick: () => { setStopError(''); setStopOpen(true); }, children: _jsx(IconStopFill16, {}) }))] }), team.phase === 'staged' && !historic && modelDirectory !== undefined && onContinuePlanning !== undefined && onDiscarded !== undefined && (_jsx(StagingPlanEditor, { team: team, modelDirectory: modelDirectory, onContinuePlanning: onContinuePlanning, onDiscarded: onDiscarded, t: t })), _jsx(ProgressOverview, { team: team, t: t, discarded: discarded }), _jsx("section", { className: css.delegationSection, "aria-label": t('delegation.aria'), "data-delegation-map": true, children: _jsxs("section", { className: css.deerMembersCard, "aria-label": t('members.toggle', { count: team.members.length }), children: [_jsxs("div", { className: css.captainNode, children: [_jsx("span", { className: css.captainAvatar, children: _jsx("img", { className: css.leadAvatar, src: LEAD_ART, alt: "", "aria-hidden": true }) }), _jsxs("span", { className: css.captainInfo, children: [_jsxs("span", { className: css.captainLine, children: [_jsx("span", { className: css.captainName, children: t('captain.name') }), _jsx("span", { className: css.captainRole, children: t('captain.role') })] }), _jsx("span", { className: css.captainSummary, children: discarded
                                                        ? t('captain.summary.discarded', { tasks: team.tasks.length, members: team.members.length })
                                                        : captainBusy
                                                            ? t('captain.summary.withTakeover', { tasks: assignedCount, captainTasks: captainTaskIds })
                                                            : team.phase === 'staged'
                                                                ? t(team.planReviewState === 'awaiting_feedback'
                                                                    ? 'captain.summary.awaitingFeedback'
                                                                    : 'captain.summary.staged', { tasks: team.tasks.length, members: team.members.length })
                                                                : t('captain.summary', { tasks: assignedCount, members: team.members.length }) })] }), _jsxs("span", { className: css.captainState, "data-busy": captainBusy || busyCount > 0, children: [_jsx(WorkGlyph, { active: captainBusy || busyCount > 0 }), discarded
                                                    ? t('captain.state.discarded')
                                                    : captainBusy
                                                        ? t('captain.state.takeover', { tasks: captainTaskIds })
                                                        : team.phase === 'staged'
                                                            ? t(team.planReviewState === 'awaiting_feedback'
                                                                ? 'captain.state.awaitingFeedback'
                                                                : 'captain.state.staged')
                                                            : busyCount > 0
                                                                ? t('captain.state.working', { count: busyCount })
                                                                : t(allCompleted
                                                                    ? 'captain.state.collected'
                                                                    : allSettled
                                                                        ? 'captain.state.settled'
                                                                        : 'captain.state.waiting')] }), _jsx("button", { type: "button", className: css.memberMailButton, "aria-label": t('mail.openAria', { name: t('captain.name') }), title: t('mail.openAria', { name: t('captain.name') }), onClick: () => setMailMember('captain'), children: "\u2709" })] }), (() => {
                                    const orderedMembers = orderDelegationMembers(team.members, team.tasks);
                                    const runningMembers = orderedMembers.filter((member) => (member.activity === 'working' || member.status === 'working'
                                        || team.tasks.some((task) => task.assignee === member.name
                                            && (task.status === 'pending' || task.status === 'claimed' || task.status === 'in_progress'))));
                                    const visibleMembers = membersOpen ? orderedMembers : runningMembers;
                                    const hiddenFinishedCount = orderedMembers.length - visibleMembers.length;
                                    const expandLabel = membersOpen
                                        ? t('members.collapse')
                                        : hiddenFinishedCount > 0
                                            ? t('members.expandFinished', { count: hiddenFinishedCount })
                                            : t('members.expand');
                                    return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: css.membersToggle, onClick: () => { setMembersOpen((current) => !current); }, "aria-expanded": membersOpen, "data-members-toggle": true, children: [_jsxs("span", { children: [_jsx(Chevron, { open: membersOpen }), t('members.toggle', { count: team.members.length })] }), _jsx("span", { children: expandLabel })] }), (membersOpen || visibleMembers.length > 0) && _jsxs("div", { className: css.delegationTree, children: [team.members.length === 0 && _jsx("span", { className: css.emptyHint, children: t('members.empty') }), visibleMembers.map((member) => {
                                                        const owned = team.tasks.filter((task) => task.assignee === member.name);
                                                        const memberModel = memberRouteLabel(member);
                                                        return (_jsxs("div", { className: css.memberBlock, "data-activity": member.activity, "data-filter-out": workspace && taskFilter !== 'all' && !owned.some(task => taskMatchesFilter(task, taskFilter)) || undefined, "data-selected-member": workspace && selectedAssignee === member.name || undefined, children: [_jsx("span", { className: css.memberBranch, "aria-hidden": true, children: _jsx("span", {}) }), _jsxs("button", { type: "button", className: css.memberRow, "data-activity": member.activity, onClick: () => {
                                                                        if (member.id !== '') {
                                                                            onNavigate(team.captainSessionId, member.id);
                                                                        }
                                                                    }, children: [_jsxs("span", { className: css.memberAvatar, "data-unread": member.unread > 0, children: [_jsx("img", { className: css.memberArt, src: memberArtUrl(member.name, member.role), alt: "", "aria-hidden": true }), _jsx("span", { className: css.memberActivityDot, "data-activity": member.activity, "aria-hidden": true })] }), _jsxs("span", { className: css.memberInfo, children: [_jsxs("span", { className: css.memberLine, children: [_jsx("span", { className: css.memberName, children: member.name }), member.role !== '' && _jsx("span", { className: css.memberRole, children: member.role }), memberModel !== '' && (_jsx("span", { className: css.memberModel, role: "img", "data-member-model": memberModel, title: memberModel, "aria-label": memberModel, children: compactModelLabel(memberModel) })), _jsxs("span", { className: css.memberState, "data-activity": member.activity, children: [_jsx(WorkGlyph, { active: member.activity === 'working' }), discarded
                                                                                                    ? t('member.state.notCreated')
                                                                                                    : stopped
                                                                                                        ? t('member.state.stopped')
                                                                                                        : team.phase === 'staged'
                                                                                                            ? t('member.state.staged')
                                                                                                            : memberStateLabel(member, team.tasks, historic, t)] })] }), _jsx("span", { className: css.memberStatusLine, children: discarded
                                                                                        ? t('member.status.discarded')
                                                                                        : stopped
                                                                                            ? t('member.status.stopped')
                                                                                            : team.phase === 'staged'
                                                                                                ? t('member.status.staged')
                                                                                                : historic && owned.length > 0 && owned.every((task) => (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'))
                                                                                                    ? t('member.status.settled')
                                                                                                    : memberStatusText(member, team.tasks, t) })] }), _jsxs("span", { className: css.memberCount, children: [member.done, "/", member.total] })] }), _jsxs("div", { className: css.assignmentLine, children: [_jsx("span", { className: css.assignmentLabel, children: t(discarded
                                                                                ? 'assignment.discarded'
                                                                                : team.phase === 'staged'
                                                                                    ? 'assignment.staged'
                                                                                    : 'assignment.label') }), _jsx("span", { className: css.assignmentTasks, children: owned.length === 0
                                                                                ? _jsx("span", { className: css.taskEmpty, children: t('assignment.empty') })
                                                                                : owned.map((task) => {
                                                                                    const model = taskModelLabel(task, team.members);
                                                                                    const shortModel = compactModelLabel(model);
                                                                                    return (_jsx("span", { className: css.assignmentChip, "data-state": discarded ? 'cancelled' : taskTone(task.state, task.status), "data-task-model": model || undefined, title: taskTitle(task, model), children: task.state === 'running' && shortModel !== '' ? `${task.id} · ${shortModel}` : task.id }, task.id));
                                                                                }) }), _jsx("button", { type: "button", className: css.memberMailButton, "aria-label": t('mail.openAria', { name: member.name }), title: t('mail.openAria', { name: member.name }), onClick: () => setMailMember(member.name), children: "\u2709" })] })] }, member.id || member.name));
                                                    })] })] }));
                                })()] }) }), workspace && !historic && (_jsx("div", { role: "separator", "aria-orientation": "vertical", tabIndex: 0, className: css.workspaceSplit, "data-dragging": workspaceSplitDragging || undefined, "aria-label": t('workspace.splitLabel'), title: t('workspace.splitLabel'), onPointerDown: onWorkspaceSplitPointerDown, onPointerMove: onWorkspaceSplitPointerMove, onPointerUp: endWorkspaceSplitDrag, onPointerCancel: endWorkspaceSplitDrag, onKeyDown: onWorkspaceSplitKeyDown })), _jsx(DependencyMap, { tasks: team.tasks, members: team.members, t: t, discarded: discarded, workspace: workspace, onSelectTask: setSelectedTaskId, teamId: team.teamId, captainSessionId: team.captainSessionId, storageKey: team.teamId, filter: taskFilter, onFilterChange: setTaskFilter, interactive: workspace && !historic }), workspace && !historic && _jsx(TeamTimeline, { teamId: team.teamId, captainSessionId: team.captainSessionId, t: t }), _jsx(BlackboardPanel, { teamId: team.teamId, captainSessionId: team.captainSessionId, t: t, readOnly: historic })] }), _jsx(Modal, { open: stopOpen, onClose: () => { if (!stopping)
                    setStopOpen(false); }, title: t('team.stopTitle', { team: team.name }), closeLabel: t('plan.cancel'), description: t('team.stopDescription', { tasks: unfinishedCount, members: busyCount }), footer: (_jsxs("span", { className: css.stopModalActions, children: [_jsx("button", { type: "button", disabled: stopping, onClick: () => { setStopOpen(false); }, children: t('team.stopCancel') }), _jsxs("button", { type: "button", "data-danger": true, disabled: stopping, onClick: () => { void stopTeam(); }, children: [_jsx(IconStopFill16, {}), stopping ? t('team.stopping') : t('team.stopConfirm')] })] })), children: stopError !== '' && _jsxs("p", { className: css.stopModalError, role: "alert", children: [_jsx(IconWarningOutline16, {}), stopError] }) }), mailMember !== null && (_jsx(MemberMailModal, { teamId: team.teamId, captainSessionId: team.captainSessionId, member: mailMember, onClose: () => setMailMember(null), t: t }))] }));
}
/** Legacy conversation cards may outlive their host archive. Project their
 * durable roster through the same rebuilt panel instead of a second UI. */
export function historicCardTeam(data, owner) {
    return {
        workspace: '',
        teamId: data.teamId,
        name: data.teamName,
        captainSessionId: data.captainSessionId || owner,
        phase: 'running',
        members: data.members.map((member) => ({
            ...member,
            status: 'removed',
            activity: 'idle',
            progress: 0,
            done: 0,
            total: 0,
            currentTask: '',
            unread: 0,
        })),
        tasks: [],
        messageCount: 0,
        captainInbox: [],
    };
}
export function ActivityPanel({ sessionsList, modelDirectories, openMember, t, conversationVisible = true }) {
    // Navigating to a member's subagent transcript is an explicit departure:
    // hide the floater immediately instead of waiting out the autocollapse
    // grace, so the panel never lingers over the member session.
    const navigateToSession = (parentId, childId) => {
        setOpen(false);
        setWasActive(false);
        openMember(parentId, childId);
    };
    const [open, setOpen] = useState(false);
    const [openOwner, setOpenOwner] = useState();
    const [autoOpened, setAutoOpened] = useState(false);
    const [wasActive, setWasActive] = useState(false);
    const [historic, setHistoric] = useState(new Map());
    const [layout, setLayout] = useState(initialPanelLayout);
    const [bounds, setBounds] = useState(initialPanelBounds);
    const [interaction, setInteraction] = useState(null);
    const panelRef = useRef(null);
    const boundsRef = useRef(bounds);
    const gestureRef = useRef(null);
    const frameRef = useRef(null);
    const pendingLayoutRef = useRef(null);
    const current = currentSessionId(useSyncExternalStore(sessionsList.subscribe, sessionsList.getSnapshot));
    const autoOpenTrackerRef = useRef({ sessionId: current, restoreComplete: false, liveTeamIds: new Set() });
    const monitorTargets = useSyncExternalStore(subscribeActivityMonitorTargets, getActivityMonitorTargetsSnapshot);
    const returnToComposer = () => {
        setOpen(false);
        setOpenOwner(undefined);
        window.requestAnimationFrame(() => {
            document.querySelector('[data-composer-card] [contenteditable="true"][role="textbox"], [data-composer-card] textarea')?.focus();
        });
    };
    const { teams, archivedTeams } = useSyncExternalStore(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
    const currentTargets = useMemo(() => current === undefined ? [] : monitorTargets.filter((target) => target.sessionId === current), [current, monitorTargets]);
    const currentRef = useRef(current);
    useEffect(() => { currentRef.current = current; }, [current]);
    const mountedAtRef = useRef(performance.now());
    const expanded = conversationVisible && activityPanelExpandedForSession(open, openOwner, current);
    const geometry = useMemo(() => resolvePanelGeometry(layout, bounds), [layout, bounds]);
    const compact = compactPanelForBounds(bounds);
    const commitLayout = useCallback((next) => {
        setLayout(next);
    }, []);
    useEffect(() => {
        window.localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    }, [layout]);
    // The slot sits inside AppFrame, so all geometry is measured against the
    // shell overlay rather than the browser viewport. The conversation's real
    // right edge is the dock anchor and naturally follows sidebar/details
    // concessions without importing their hashed implementation classes.
    useLayoutEffect(() => {
        const overlay = document.querySelector('[data-shell-overlay]');
        if (overlay === null)
            return;
        const conversation = document.querySelector("[data-phase='active']");
        let frame = null;
        const measure = () => {
            frame = null;
            const overlayRect = overlay.getBoundingClientRect();
            const conversationRect = conversation?.getBoundingClientRect();
            const next = {
                width: overlayRect.width,
                height: overlayRect.height,
                anchorRight: conversationRect === undefined
                    ? overlayRect.width
                    : Math.min(Math.max(conversationRect.right - overlayRect.left, 0), overlayRect.width),
            };
            const previous = boundsRef.current;
            if (previous.width === next.width
                && previous.height === next.height
                && previous.anchorRight === next.anchorRight)
                return;
            boundsRef.current = next;
            setBounds(next);
        };
        const scheduleMeasure = () => {
            frame ??= requestAnimationFrame(measure);
        };
        measure();
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasure);
        observer?.observe(overlay);
        if (conversation !== null)
            observer?.observe(conversation);
        window.addEventListener('resize', scheduleMeasure);
        return () => {
            if (frame !== null)
                cancelAnimationFrame(frame);
            observer?.disconnect();
            window.removeEventListener('resize', scheduleMeasure);
        };
    }, [current]);
    // This shell overlay survives conversation route changes. Gate expansion by its
    // owning session during render, then clear stale state before paint. This
    // removes the old panel immediately instead of waiting for the no-team
    // autoclose grace period on the destination page.
    useLayoutEffect(() => {
        const tracker = autoOpenTrackerRef.current;
        if (tracker.sessionId !== current) {
            tracker.sessionId = current;
            tracker.restoreComplete = false;
            tracker.liveTeamIds = new Set();
            setWasActive(false);
            setAutoOpened(false);
        }
        if (openOwner === undefined || openOwner === current)
            return;
        setOpen(false);
        setOpenOwner(undefined);
    }, [current, openOwner]);
    // Only the wide docked mode asks the conversation column to yield. Floating
    // and compact modes are intentionally true overlays. The width is written as
    // one shared variable so the panel and the concession cannot drift apart.
    useLayoutEffect(() => {
        const root = document.documentElement;
        const shouldYield = expanded && geometry.mode === 'docked' && !compact;
        if (shouldYield) {
            root.setAttribute(PANEL_OPEN_ATTRIBUTE, '');
            root.style.setProperty(PANEL_SHIFT_PROPERTY, `${geometry.width + PANEL_CONVERSATION_GAP + 18}px`);
        }
        else {
            root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
            root.style.removeProperty(PANEL_SHIFT_PROPERTY);
        }
        return () => {
            root.removeAttribute(PANEL_OPEN_ATTRIBUTE);
            root.style.removeProperty(PANEL_SHIFT_PROPERTY);
        };
    }, [compact, expanded, geometry.mode, geometry.width]);
    useEffect(() => {
        if (current === undefined)
            return;
        // Cards keep live teams on the normal cadence. The current-session scope
        // also performs one cold-start discovery pass so archived/cardless teams
        // survive a browser or `dsh web` restart.
        const controller = startActivityPolling(currentTargets, { discoverySessionId: current });
        let active = true;
        const tracker = autoOpenTrackerRef.current;
        if (tracker.sessionId === current && !tracker.restoreComplete) {
            void controller.firstTick.then(() => {
                const latest = autoOpenTrackerRef.current;
                if (!active || latest.sessionId !== current || latest.restoreComplete)
                    return;
                latest.liveTeamIds = new Set(getActivitySnapshotsSnapshot().teams
                    .filter((team) => team.captainSessionId === current)
                    .map((team) => team.teamId));
                latest.restoreComplete = true;
            });
        }
        return () => {
            active = false;
            controller.stop();
        };
    }, [current, currentTargets]);
    useEffect(() => {
        const onOpenPanel = (event) => {
            const activeSession = currentRef.current;
            if (activeSession === undefined)
                return;
            setOpenOwner(activeSession);
            setOpen(true);
            const detail = event.detail;
            if (detail?.teamId !== undefined) {
                // A card from a log that predates captainSessionId belongs to the
                // session that activated it (the current one at injection time).
                const owner = detail.captainSessionId !== '' ? detail.captainSessionId : currentRef.current ?? '';
                const teamKey = `${owner}:${detail.teamId}`;
                setHistoric((previous) => {
                    const next = new Map(previous);
                    next.set(teamKey, { data: detail, owner });
                    return next;
                });
            }
        };
        window.addEventListener(OPEN_PANEL_EVENT, onOpenPanel);
        return () => {
            window.removeEventListener(OPEN_PANEL_EVENT, onOpenPanel);
        };
    }, []);
    // Teams follow the current session: live snapshots and historic card
    // summaries are visible only while their captain session is current.
    const visibleTeams = useMemo(
    // No current session (initial load): show nothing until one is picked,
    // so cross-session teams never leak into the floater.
    () => (current === undefined ? [] : teams.filter((team) => team.captainSessionId === current)), [teams, current]);
    const visibleHistoric = useMemo(() => (current === undefined ? [] : [...historic.values()].filter(({ data, owner }) => owner === current && !teams.some((live) => live.captainSessionId === current && live.teamId === data.teamId) && !archivedTeams.some((archived) => archived.captainSessionId === current && archived.teamId === data.teamId))), [historic, current, teams, archivedTeams]);
    const visibleArchived = useMemo(() => (current === undefined ? [] : archivedTeams.filter((team) => team.captainSessionId === current && !teams.some((live) => live.captainSessionId === current && live.teamId === team.teamId))), [archivedTeams, current, teams]);
    const visibleCount = visibleTeams.length + visibleArchived.length + visibleHistoric.length;
    const visibleLiveTeamIds = useMemo(() => visibleTeams.map((team) => team.teamId).sort(), [visibleTeams]);
    const visibleLiveTeamKey = visibleLiveTeamIds.join('\u0000');
    useEffect(() => {
        const tracker = autoOpenTrackerRef.current;
        const settled = performance.now() - mountedAtRef.current >= AUTO_OPEN_SETTLE_MS;
        const shouldAutoExpand = tracker.sessionId === current && activityPanelShouldAutoExpand({
            alreadyAutoOpened: autoOpened,
            pageSettled: settled,
            restoreComplete: tracker.restoreComplete,
            previousLiveTeamIds: tracker.liveTeamIds,
            currentLiveTeamIds: visibleLiveTeamIds,
        });
        if (tracker.sessionId === current && tracker.restoreComplete) {
            tracker.liveTeamIds = new Set(visibleLiveTeamIds);
        }
        if (visibleCount > 0) {
            setWasActive(true);
            // Existing state restored for a reopened conversation stays collapsed.
            // Only a live team that appears after the restore pass may auto-expand.
            if (shouldAutoExpand) {
                setOpenOwner(current);
                setOpen(true);
                setAutoOpened(true);
            }
            return;
        }
        if (!wasActive)
            return;
        const timer = setTimeout(() => {
            setOpen(false);
            setOpenOwner(undefined);
            setWasActive(false);
            // Re-arm auto-expand: a later activity (new team, new session) may
            // open the panel on its own again.
            setAutoOpened(false);
        }, AUTOCLOSE_GRACE_MS);
        return () => { clearTimeout(timer); };
    }, [visibleCount, visibleLiveTeamKey, autoOpened, wasActive, current]);
    const busy = useMemo(() => visibleTeams.some((team) => team.members.some((member) => member.activity === 'working')), [visibleTeams]);
    const hasTeams = visibleCount > 0;
    // Auto-height panels do not store their live content height. Capture the
    // rendered box when a pointer gesture starts so movement and a first manual
    // resize clamp against what the user actually sees.
    const panelGeometryForGesture = useCallback(() => {
        const measuredHeight = panelRef.current?.getBoundingClientRect().height;
        if (measuredHeight === undefined || measuredHeight <= 0)
            return geometry;
        return { ...geometry, height: measuredHeight };
    }, [geometry]);
    const flushScheduledLayout = useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        const pending = pendingLayoutRef.current;
        pendingLayoutRef.current = null;
        if (pending !== null)
            commitLayout(pending);
    }, [commitLayout]);
    const scheduleLayout = useCallback((next) => {
        pendingLayoutRef.current = next;
        frameRef.current ??= requestAnimationFrame(() => {
            frameRef.current = null;
            const pending = pendingLayoutRef.current;
            pendingLayoutRef.current = null;
            if (pending !== null)
                commitLayout(pending);
        });
    }, [commitLayout]);
    useEffect(() => () => {
        if (frameRef.current !== null)
            cancelAnimationFrame(frameRef.current);
    }, []);
    const beginMove = useCallback((event) => {
        if (compact || event.button !== 0 || event.target.closest('button') !== null)
            return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        gestureRef.current = {
            kind: 'move',
            pointerId: event.pointerId,
            originX: event.clientX,
            originY: event.clientY,
            start: panelGeometryForGesture(),
            activated: false,
        };
    }, [compact, panelGeometryForGesture]);
    const beginResize = useCallback((edge, event) => {
        if (compact || event.button !== 0 || (geometry.mode === 'docked' && edge !== 'left'))
            return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        gestureRef.current = {
            kind: 'resize',
            edge,
            pointerId: event.pointerId,
            originX: event.clientX,
            originY: event.clientY,
            start: panelGeometryForGesture(),
            activated: true,
        };
        setInteraction('resizing');
    }, [compact, geometry.mode, panelGeometryForGesture]);
    const updateGesture = useCallback((event) => {
        const gesture = gestureRef.current;
        if (gesture === null || gesture.pointerId !== event.pointerId
            || !event.currentTarget.hasPointerCapture(event.pointerId))
            return;
        const dx = event.clientX - gesture.originX;
        const dy = event.clientY - gesture.originY;
        const activeBounds = boundsRef.current;
        if (gesture.kind === 'move') {
            if (!gesture.activated && Math.hypot(dx, dy) < MOVE_THRESHOLD)
                return;
            if (!gesture.activated) {
                gesture.activated = true;
                setInteraction('dragging');
            }
            scheduleLayout(movePanelLayout(floatPanelLayout(gesture.start, activeBounds), dx, dy, activeBounds));
            return;
        }
        scheduleLayout(resizePanelLayout(gesture.start, gesture.edge ?? 'left', dx, dy, activeBounds));
    }, [scheduleLayout]);
    const endGesture = useCallback((event) => {
        const gesture = gestureRef.current;
        if (gesture === null || gesture.pointerId !== event.pointerId)
            return;
        updateGesture(event);
        flushScheduledLayout();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        gestureRef.current = null;
        setInteraction(null);
    }, [flushScheduledLayout, updateGesture]);
    const cancelGesture = useCallback((event) => {
        const gesture = gestureRef.current;
        if (gesture === null || gesture.pointerId !== event.pointerId)
            return;
        flushScheduledLayout();
        gestureRef.current = null;
        setInteraction(null);
    }, [flushScheduledLayout]);
    const toggleDock = useCallback(() => {
        const liveGeometry = panelGeometryForGesture();
        commitLayout(liveGeometry.mode === 'docked'
            ? floatPanelLayout(liveGeometry, boundsRef.current)
            : dockPanelLayout(liveGeometry, boundsRef.current));
    }, [commitLayout, panelGeometryForGesture]);
    const autoHeight = panelUsesAutoHeight(geometry, bounds);
    const panelStyle = {
        width: geometry.width,
        height: autoHeight ? 'auto' : geometry.height,
        maxHeight: panelMaximumHeight(geometry, bounds),
        transform: `translate3d(${geometry.x}px, ${geometry.y}px, 0)`,
    };
    if (!conversationVisible || (!hasTeams && !expanded))
        return null;
    return (_jsxs(_Fragment, { children: [!expanded && (_jsx(CollapsedBadge, { count: visibleCount, busy: busy, t: t, onClick: () => {
                    if (current === undefined)
                        return;
                    setOpenOwner(current);
                    setOpen(true);
                } })), expanded && (_jsxs("aside", { ref: panelRef, className: css.panel, style: panelStyle, "data-deers-agent-team-activity": true, "data-panel-mode": geometry.mode, "data-height-mode": autoHeight ? 'auto' : 'manual', "data-compact": compact || undefined, "data-dragging": interaction === 'dragging' || undefined, "data-resizing": interaction === 'resizing' || undefined, "aria-label": t('activity.panelAria'), children: [_jsxs("header", { className: css.panelHead, onPointerDown: beginMove, onPointerMove: updateGesture, onPointerUp: endGesture, onPointerCancel: cancelGesture, "data-drag-handle": !compact || undefined, children: [_jsxs("span", { className: css.panelTitle, children: [t('activity.title'), _jsx("span", { className: css.panelDot, "data-busy": busy, "aria-hidden": true })] }), _jsxs("span", { className: css.panelControls, children: [!compact && (_jsx("button", { type: "button", className: css.iconButton, "data-control": "dock", "data-mode": geometry.mode, onClick: toggleDock, "aria-label": t(geometry.mode === 'docked' ? 'activity.float' : 'activity.dockRight'), title: t(geometry.mode === 'docked' ? 'activity.float' : 'activity.dockRight'), children: _jsx(IconPanelLeftOutline16, {}) })), _jsx("button", { type: "button", className: css.iconButton, "data-control": "collapse", onClick: () => {
                                            setOpen(false);
                                            setOpenOwner(undefined);
                                        }, "aria-label": t('activity.collapse'), title: t('activity.collapse'), children: _jsx(IconChevronDownOutline14, {}) })] })] }), _jsx("div", { className: css.teams, children: visibleCount === 0
                            ? _jsx("span", { className: css.emptyHint, children: t('activity.empty') })
                            : (_jsxs(_Fragment, { children: [visibleTeams.map((team) => (_jsx(TeamSection, { team: team, modelDirectory: team.phase === 'staged'
                                            ? modelDirectories.directoryFor(team.captainSessionId)
                                            : undefined, onContinuePlanning: returnToComposer, onDiscarded: returnToComposer, onNavigate: navigateToSession, t: t }, team.teamId))), visibleArchived.map((team) => (_jsxs("div", { "data-team-id": team.teamId, "data-historic": true, className: css.archivedWrap, children: [_jsx("span", { className: css.archiveLabel, children: t(team.phase === 'staged' ? 'archive.discardedLabel' : 'archive.label') }), _jsx(TeamSection, { team: team, onNavigate: navigateToSession, t: t, historic: true })] }, `${team.captainSessionId}:${team.teamId}`))), visibleHistoric.map(({ data: team, owner }) => {
                                        const teamKey = `${owner}:${team.teamId}`;
                                        return (_jsx(TeamSection, { team: historicCardTeam(team, owner), onNavigate: navigateToSession, t: t, historic: true }, teamKey));
                                    })] })) }), !compact && (_jsx("div", { className: css.resizeHandle, "data-resize-edge": "left", onPointerDown: (event) => { beginResize('left', event); }, onPointerMove: updateGesture, onPointerUp: endGesture, onPointerCancel: cancelGesture, "aria-hidden": true })), !compact && geometry.mode === 'floating' && (_jsxs(_Fragment, { children: [_jsx("div", { className: css.resizeHandle, "data-resize-edge": "bottom", onPointerDown: (event) => { beginResize('bottom', event); }, onPointerMove: updateGesture, onPointerUp: endGesture, onPointerCancel: cancelGesture, "aria-hidden": true }), _jsx("div", { className: css.resizeHandle, "data-resize-edge": "corner", onPointerDown: (event) => { beginResize('corner', event); }, onPointerMove: updateGesture, onPointerUp: endGesture, onPointerCancel: cancelGesture, "aria-hidden": true })] }))] }))] }));
}
