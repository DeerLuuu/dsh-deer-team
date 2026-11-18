/**
 * Independent team watchdog.
 *
 * The watchdog is a supervisor, not a worker: it scans durable team state on a
 * timer, raises alerts for stalled attempts, repeated failures and message
 * loops, and lets the captain (or the human) decide what to do. Pure detection
 * helpers live here so the loop and the tests share one implementation.
 * @module deers-dsh-agent-team/watchdog
 */
/** Conservative defaults: surface problems, never mutate task state. */
export const DEFAULT_WATCHDOG = {
    enabled: true,
    intervalMs: 60_000,
    stallMs: 30 * 60_000,
    repeatWindowMs: 10 * 60_000,
    repeatThreshold: 3,
    maxAttempts: 4,
    notifyCaptain: true,
};
const ACTIVE_STATUSES = new Set(['claimed', 'in_progress']);
function lastActivityOf(task) {
    return Math.max(task.progress?.updatedAt ?? 0, task.updatedAt ?? 0, task.createdAt ?? 0);
}
function minutesOf(ms) {
    const minutes = Math.max(1, Math.round(ms / 60_000));
    return minutes >= 60 ? `${Math.round(minutes / 60)}h` : `${minutes}m`;
}
function normalizeMessage(content) {
    return content.trim().replace(/\s+/gu, ' ').slice(0, 200);
}
/** Stable 32-bit hash for alert ids (no crypto dependency). */
export function stableHash(value) {
    let hash = 0x811c9dc5;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}
/** The team's active (claimed / in-progress) tasks. */
export function activeTasks(team) {
    return team.tasks.filter((task) => ACTIVE_STATUSES.has(task.status));
}
/**
 * Detect every current alert. Detection is stateless: callers merge the result
 * with persisted state to decide what is new.
 */
export function detectWatchdogAlerts(team, options, input = {}) {
    const now = input.now ?? Date.now();
    const alerts = [];
    for (const task of activeTasks(team)) {
        const idleFor = now - lastActivityOf(task);
        if (idleFor > options.stallMs) {
            const severity = idleFor > options.stallMs * 2 ? 'critical' : 'warn';
            alerts.push({
                id: `stalled:${task.id}`,
                kind: 'stalled',
                severity,
                at: now,
                taskId: task.id,
                ...task.assignee === undefined ? {} : { member: task.assignee },
                message: `Task ${task.id} (“${task.subject}”) has not reported progress for ${minutesOf(idleFor)}`
                    + `${task.assignee === undefined ? '' : ` (owner ${task.assignee})`}.`,
            });
        }
    }
    for (const task of team.tasks) {
        if ((task.attempt ?? 0) < options.maxAttempts)
            continue;
        if (task.status !== 'failed' && task.status !== 'pending')
            continue;
        alerts.push({
            id: `retrying:${task.id}`,
            kind: 'retrying',
            severity: 'warn',
            at: now,
            taskId: task.id,
            ...task.assignee === undefined ? {} : { member: task.assignee },
            message: `Task ${task.id} has used ${task.attempt ?? 0} attempts (limit ${options.maxAttempts});`
                + ' consider re-scoping it or reassigning it to another member.',
        });
    }
    const messages = (input.messages ?? []).filter((message) => now - Number(message.ts ?? 0) <= options.repeatWindowMs);
    const groups = new Map();
    for (const message of messages) {
        const content = normalizeMessage(String(message.content ?? ''));
        if (content === '')
            continue;
        const key = `${message.from}\u0000${message.to}\u0000${content}`;
        const existing = groups.get(key);
        if (existing === undefined) {
            groups.set(key, { count: 1, from: message.from, to: message.to, content });
        }
        else {
            existing.count += 1;
        }
    }
    for (const [key, group] of groups) {
        if (group.count < options.repeatThreshold)
            continue;
        alerts.push({
            id: `repeat:${stableHash(key)}`,
            kind: 'repeat-message',
            severity: 'warn',
            at: now,
            member: group.from,
            message: `${group.from} sent the same message to ${group.to} ${group.count} times`
                + ` within ${minutesOf(options.repeatWindowMs)}: “${group.content.slice(0, 120)}”.`,
        });
    }
    return alerts;
}
/**
 * Merge a fresh scan into persisted state. Unchanged alerts keep their original
 * timestamp; recovered ones disappear; brand-new ones are returned so the loop
 * notifies the captain exactly once.
 */
export function mergeWatchdogAlerts(existing, detected, now = Date.now()) {
    const previous = new Map((existing?.alerts ?? []).map((alert) => [alert.id, alert]));
    const added = [];
    const alerts = [];
    for (const alert of detected) {
        const known = previous.get(alert.id);
        if (known === undefined) {
            added.push(alert);
            alerts.push(alert);
        }
        else {
            // Keep the first-seen timestamp (age stays meaningful) and the original
            // severity, so a long-standing stall cannot spam "new" alerts each scan.
            alerts.push({ ...known, message: alert.message });
        }
    }
    alerts.sort((left, right) => right.at - left.at);
    return {
        state: { lastRunAt: now, alerts: alerts.slice(0, 20) },
        added,
    };
}
/** Render active alerts for status/digest surfaces. */
export function renderWatchdog(state) {
    const alerts = state?.alerts ?? [];
    if (alerts.length === 0)
        return [];
    return [
        `Watchdog alerts (${alerts.length}):`,
        ...alerts.slice(0, 8).map((alert) => `  - [${alert.severity}] ${alert.message}`),
    ];
}
/** One concise line for a watchdog notification prompt. */
export function watchdogPrompt(teamName, alerts) {
    return [
        `AgentTeams watchdog alert for team "${teamName}":`,
        ...alerts.slice(0, 10).map((alert) => `- [${alert.severity}] ${alert.message}`),
        '',
        'Diagnose the team (deers_team_status/digest) and decide whether to nudge, retry, reassign or escalate. The watchdog never changes task state itself.',
    ].join('\n');
}
