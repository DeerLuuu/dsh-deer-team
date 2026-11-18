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
