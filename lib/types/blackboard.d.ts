/**
 * Team blackboard: a durable shared feed for brainstorming, idea collection
 * and feature voting.
 *
 * Every participant (captain and members) can append entries and read the
 * whole feed; votes are per-participant and toggled through the tool surface.
 * The helpers here are pure state transformations over `team.blackboard`;
 * tools own locking, persistence and identity checks.
 * @module deers-dsh-agent-team/blackboard
 */
import type { BlackboardEntry, BlackboardEntryKind, BlackboardState, BlackboardVote, TeamState } from './types.ts';
/** Hard cap on retained entries; older (unpinned) entries are trimmed first. */
export declare const BLACKBOARD_MAX_ENTRIES = 200;
/** Hard cap on one entry's content length. */
export declare const BLACKBOARD_MAX_CONTENT = 4000;
/** Default and maximum number of entries a read call returns. */
export declare const BLACKBOARD_DEFAULT_LIMIT = 50;
export declare const BLACKBOARD_MAX_LIMIT = 200;
/** Automatic cleanup policy for the durable blackboard feed. */
export interface BlackboardCleanupPolicy {
    enabled: boolean;
    /** Entries older than this many days become eligible for removal. */
    retentionDays: number;
    /** The newest N entries are always retained regardless of age. */
    keepLatest: number;
    /** Pinned entries survive cleanup. */
    keepPinned: boolean;
    /** Decision entries survive cleanup (durable decisions). */
    keepDecisions: boolean;
}
/** Default cleanup: 30 days, newest 10, pinned and decisions retained. */
export declare const DEFAULT_BLACKBOARD_CLEANUP: BlackboardCleanupPolicy;
/**
 * Coerce one persisted blackboard value into the canonical shape.
 * Invalid entries are dropped instead of bricking the whole team record.
 * @param raw - the persisted `team.blackboard` value (or anything).
 * @returns a well-formed board; an empty board when `raw` is unusable.
 */
export declare function normalizeBlackboard(raw: unknown): BlackboardState;
/** The team's board, normalized; absence means an empty board. */
export declare function blackboardOf(team: Pick<TeamState, 'blackboard'>): BlackboardState;
/** One vote tally for an entry. */
export interface BlackboardTally {
    up: number;
    down: number;
}
/** Count up/down votes on one entry. */
export declare function tallyOf(entry: BlackboardEntry): BlackboardTally;
/** Append one entry to the team board; returns the stored entry. */
export declare function postBlackboardEntry(team: TeamState, input: {
    author: string;
    kind?: string;
    content: string;
    pinned?: boolean;
}): BlackboardEntry;
/** Cast, switch or clear one participant's vote on an entry. */
export declare function voteBlackboardEntry(team: TeamState, input: {
    entryId: string;
    voter: string;
    vote: BlackboardVote | 'clear';
}): {
    entry: BlackboardEntry;
    tally: BlackboardTally;
};
/** Remove every entry (captain-only at the tool layer); returns how many were removed. */
export declare function clearBlackboard(team: TeamState): number;
/**
 * Apply the automatic cleanup policy to one board.
 *
 * Entries older than `retentionDays` are removed unless they are among the
 * newest `keepLatest`, pinned, or a decision (when those protections are on).
 * The board id sequence is never reset, so ids stay stable for references.
 * @param team - the team whose board is cleaned (mutated).
 * @param policy - the resolved cleanup policy.
 * @param now - reference time for the retention cutoff.
 * @returns removed count and ids; `lastCleanupAt` is stamped only when something was removed.
 */
export declare function cleanupBlackboard(team: TeamState, policy?: BlackboardCleanupPolicy, now?: number): {
    removed: number;
    ids: string[];
};
/** One entry as returned by a board read. */
export interface BlackboardReadEntry {
    id: string;
    author: string;
    kind: BlackboardEntryKind;
    content: string;
    created_at: number;
    pinned: boolean;
    votes_up: number;
    votes_down: number;
    voters_up: string[];
    voters_down: string[];
}
/** Options accepted by {@link readBlackboard}. */
export interface BlackboardQuery {
    author?: string;
    kind?: string;
    /** Case-insensitive substring over content and author. */
    q?: string;
    limit?: number;
}
/** Read (pinned first, then the rest oldest → newest) the board. */
export declare function readBlackboard(team: TeamState, query?: BlackboardQuery): {
    entries: BlackboardReadEntry[];
    total: number;
};
/** Model-facing text for a board read. */
export declare function renderBlackboard(entries: readonly BlackboardReadEntry[], total: number): string;
/** Compact board summary for `deers_team_status`. */
export declare function blackboardStatus(team: Pick<TeamState, 'blackboard'>, latest?: number): {
    count: number;
    latest: Array<{
        id: string;
        author: string;
        kind: BlackboardEntryKind;
        up: number;
        down: number;
        content: string;
    }>;
} | undefined;
