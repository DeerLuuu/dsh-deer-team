/**
 * Bounded team digest ("Inline" context) for long-running teams.
 *
 * `deers_team_status` is the full snapshot; this module produces the compact
 * version the captain can request every turn without pulling every task,
 * mailbox and board entry into context. Detail stays reachable through
 * `deers_team_recall`.
 * @module deers-dsh-agent-team/digest
 */
import { blackboardOf } from "./blackboard.js";
import { pollsDigest } from "./polls.js";
import { taskKindOf } from "./quality-gates.js";
import { renderWatchdog } from "./watchdog.js";
const ACTIVE = new Set(['claimed', 'in_progress']);
const FAILED = new Set(['failed', 'cancelled']);
function ageMinutes(now, at) {
    if (!Number.isFinite(at) || at <= 0)
        return 0;
    return Math.max(0, Math.round((now - at) / 60_000));
}
function rowOf(task, team, now) {
    const pending = task.dependencies.filter((dependency) => {
        const dependencyTask = team.tasks.find((candidate) => candidate.id === dependency);
        return dependencyTask !== undefined && dependencyTask.status !== 'completed';
    });
    const progress = task.progress === undefined ? undefined : {
        ...task.progress.percent === undefined ? {} : { percent: task.progress.percent },
        ...task.progress.note === undefined ? {} : { note: task.progress.note },
        ageMinutes: ageMinutes(now, task.progress.updatedAt),
    };
    return {
        id: task.id,
        subject: task.subject,
        status: task.status,
        assignee: task.assignee ?? '',
        kind: taskKindOf(task),
        attempt: task.attempt ?? 0,
        ageMinutes: ageMinutes(now, Math.max(task.updatedAt ?? 0, task.progress?.updatedAt ?? 0)),
        ...task.status === 'pending' && pending.length > 0 ? { blockedBy: pending } : {},
        ...progress === undefined ? {} : { progress },
    };
}
/** Build one bounded digest from durable state. */
export function buildTeamDigest(team, input = {}) {
    const now = input.now ?? Date.now();
    const counts = {};
    for (const task of team.tasks)
        counts[task.status] = (counts[task.status] ?? 0) + 1;
    const active = team.tasks.filter((task) => ACTIVE.has(task.status)).map((task) => rowOf(task, team, now));
    const blocked = team.tasks
        .filter((task) => task.status === 'pending' && task.dependencies.some((dependency) => (team.tasks.find((candidate) => candidate.id === dependency)?.status !== 'completed')))
        .map((task) => rowOf(task, team, now));
    const failed = team.tasks.filter((task) => FAILED.has(task.status)).map((task) => rowOf(task, team, now));
    const completed = team.tasks.filter((task) => task.status === 'completed');
    const leadTimes = completed
        .map((task) => (task.updatedAt ?? 0) - (task.createdAt ?? 0))
        .filter((value) => Number.isFinite(value) && value >= 0);
    const board = blackboardOf(team);
    const polls = pollsDigest(team, now);
    const messages = [...(input.messages ?? [])].slice(-5);
    return {
        team_id: team.id,
        team_name: team.name,
        phase: team.phase ?? 'running',
        halted: team.halted === true,
        escalated: team.escalated === true,
        members: {
            total: team.members.filter((member) => member.status !== 'removed').length,
            busy: team.members.filter((member) => member.status === 'working').length,
        },
        tasks: {
            total: team.tasks.length,
            counts,
            active: active.slice(0, 8),
            blocked: blocked.slice(0, 6),
            failed: failed.slice(0, 6),
        },
        ...board.entries.length === 0 ? {} : {
            board: {
                count: board.entries.length,
                latest: board.entries.slice(-3).map((entry) => {
                    const votes = Object.values(entry.votes ?? {});
                    return {
                        id: entry.id,
                        author: entry.author,
                        kind: entry.kind,
                        up: votes.filter((vote) => vote === 'up').length,
                        down: votes.filter((vote) => vote === 'down').length,
                        content: entry.content.slice(0, 200),
                    };
                }),
            },
        },
        ...polls === undefined ? {} : { polls },
        watchdog: renderWatchdog(team.watchdog),
        metrics: {
            completed: completed.length,
            avgLeadMinutes: leadTimes.length === 0 ? null : Math.round(leadTimes.reduce((sum, value) => sum + value, 0) / leadTimes.length / 60_000),
            attempts: team.tasks.reduce((sum, task) => sum + (task.attempt ?? 0), 0),
        },
        recentMessages: messages.map((message) => ({
            from: message.from,
            to: message.to,
            content: String(message.content ?? '').slice(0, 160),
            ts: Number(message.ts ?? 0),
        })),
    };
}
/** Render the digest as bounded model-facing text. */
export function renderTeamDigest(digest, maxChars = 2600) {
    const lines = [
        `Team "${digest.team_name}" [${digest.phase}${digest.halted ? ', halted' : ''}${digest.escalated ? ', escalated' : ''}]`,
        `Members: ${digest.members.total} (${digest.members.busy} working) · Tasks: ${digest.tasks.total}`
            + ` (${Object.entries(digest.tasks.counts).map(([status, count]) => `${status} ${count}`).join(', ') || 'none'})`,
    ];
    const metrics = digest.metrics;
    lines.push(`Metrics: completed ${metrics.completed} · avg lead ${metrics.avgLeadMinutes === null ? 'n/a' : `${metrics.avgLeadMinutes}m`} · attempts ${metrics.attempts}`);
    if (digest.tasks.active.length > 0) {
        lines.push('Active:');
        for (const row of digest.tasks.active) {
            const progressText = row.progress === undefined
                ? ''
                : `${row.progress.percent === undefined ? '' : `${row.progress.percent}% `}${row.progress.note ?? ''}`.trim();
            const progress = progressText === '' ? '' : ` · ${progressText}`;
            lines.push(`  - ${row.id} [${row.status}/${row.kind}] ${row.subject} → ${row.assignee || 'unassigned'}, attempt ${row.attempt}, idle ${row.ageMinutes}m${progress}`);
        }
    }
    else {
        lines.push('Active: none');
    }
    if (digest.tasks.blocked.length > 0) {
        lines.push('Blocked:', ...digest.tasks.blocked.map((row) => `  - ${row.id} waiting on ${row.blockedBy?.join(', ') ?? 'dependencies'}`));
    }
    if (digest.tasks.failed.length > 0) {
        lines.push('Failed/cancelled:', ...digest.tasks.failed.map((row) => `  - ${row.id} ${row.status} (attempt ${row.attempt}): ${row.subject}`));
    }
    if (digest.board !== undefined) {
        lines.push(`Blackboard (${digest.board.count} entries, latest):`, ...digest.board.latest.map((entry) => (`  - ${entry.id} [${entry.kind}] ${entry.author} ▲${entry.up} ▼${entry.down}: ${entry.content}`)));
    }
    if (digest.polls !== undefined && digest.polls.open > 0) {
        lines.push(`Open polls (${digest.polls.open} of ${digest.polls.total}):`, ...digest.polls.items.map((poll) => (`  - ${poll.id} ${poll.title} · ${poll.multiSelect ? 'multi' : 'single'} · ${poll.totalVoters} voters`
            + ` · rule ${poll.thresholdRule} · quorum ${poll.quorum}`
            + ` · leading ${poll.leading.map((option) => `${option.label} ${option.votes}`).join(', ') || 'none'}`)));
    }
    if (digest.watchdog.length > 0)
        lines.push(...digest.watchdog);
    if (digest.recentMessages.length > 0) {
        lines.push('Recent messages:', ...digest.recentMessages.map((message) => `  - ${message.from} → ${message.to}: ${message.content}`));
    }
    const text = lines.join('\n');
    return text.length > maxChars ? `${text.slice(0, maxChars)}\n…(digest truncated; use deers_team_recall for details)` : text;
}
