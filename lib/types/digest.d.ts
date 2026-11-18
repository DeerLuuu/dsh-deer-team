/**
 * Bounded team digest ("Inline" context) for long-running teams.
 *
 * `deers_team_status` is the full snapshot; this module produces the compact
 * version the captain can request every turn without pulling every task,
 * mailbox and board entry into context. Detail stays reachable through
 * `deers_team_recall`.
 * @module deers-dsh-agent-team/digest
 */
import type { TeamMessage, TeamState } from './types.ts';
/** One compact task row. */
export interface DigestTaskRow {
    id: string;
    subject: string;
    status: string;
    assignee: string;
    kind: string;
    attempt: number;
    /** Minutes since the task last changed or reported progress. */
    ageMinutes: number;
    /** Dependency ids that are still not completed (blocked pending tasks only). */
    blockedBy?: string[];
    progress?: {
        percent?: number;
        note?: string;
        ageMinutes: number;
    };
}
/** Compact team digest. */
export interface TeamDigest {
    team_id: string;
    team_name: string;
    phase: string;
    halted: boolean;
    escalated: boolean;
    members: {
        total: number;
        busy: number;
    };
    tasks: {
        total: number;
        counts: Record<string, number>;
        active: DigestTaskRow[];
        blocked: DigestTaskRow[];
        failed: DigestTaskRow[];
    };
    board?: {
        count: number;
        latest: {
            id: string;
            author: string;
            kind: string;
            up: number;
            down: number;
            content: string;
        }[];
    };
    polls?: {
        open: number;
        total: number;
        items: {
            id: string;
            title: string;
            multiSelect: boolean;
            totalVoters: number;
            thresholdRule: string;
            quorum: number;
            leading: {
                label: string;
                votes: number;
            }[];
        }[];
    };
    watchdog: string[];
    metrics: {
        completed: number;
        avgLeadMinutes: number | null;
        attempts: number;
    };
    recentMessages: {
        from: string;
        to: string;
        content: string;
        ts: number;
    }[];
}
/** Build one bounded digest from durable state. */
export declare function buildTeamDigest(team: TeamState, input?: {
    now?: number;
    messages?: readonly TeamMessage[];
}): TeamDigest;
/** Render the digest as bounded model-facing text. */
export declare function renderTeamDigest(digest: TeamDigest, maxChars?: number): string;
