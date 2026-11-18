/**
 * Team polls: formal single- or multi-choice voting, separate from the
 * blackboard.
 *
 * A poll has explicit options, one ballot per participant, an optional
 * deadline, a threshold rule and a quorum. The captain (or the human in the Web
 * panel) creates and closes polls; every participant casts a ballot. Closing
 * evaluates the ballots once and writes an immutable decision, mirroring the
 * DeerSuperGroup poll model (single/multi, threshold, quorum, decision,
 * ballot revisions and voter types).
 * @module deers-dsh-agent-team/polls
 */
import type { PollDecision, PollState, PollThresholdRule, TeamPoll, TeamState } from './types.ts';
/** Hard cap on retained polls. */
export declare const POLL_MAX_POLLS = 50;
/** Option-count bounds. */
export declare const POLL_MIN_OPTIONS = 2;
export declare const POLL_MAX_OPTIONS = 10;
/** Field bounds. */
export declare const POLL_MAX_TITLE = 200;
export declare const POLL_MAX_DESCRIPTION = 1000;
export declare const POLL_MAX_LABEL = 120;
export declare const POLL_THRESHOLD_RULES: readonly PollThresholdRule[];
/**
 * Coerce one persisted poll store into the canonical shape, dropping invalid
 * polls/options/votes instead of failing the team record.
 */
export declare function normalizePolls(raw: unknown): PollState;
/** The team's polls, normalized; absence means no polls. */
export declare function pollsOf(team: Pick<TeamState, 'polls'>): PollState;
/** Whether a poll accepts ballots right now. */
export declare function isPollOpen(poll: TeamPoll, now?: number): boolean;
/** Effective display state (`open` / `closed` / `expired`). */
export declare function pollDisplayStatus(poll: TeamPoll, now?: number): 'open' | 'closed' | 'expired';
/** Create one poll; validates options, mode, threshold, quorum and deadline. */
export declare function createPoll(team: TeamState, input: {
    author: string;
    title: string;
    description?: string;
    options: readonly string[];
    multiSelect?: boolean;
    maxSelections?: number;
    thresholdRule?: PollThresholdRule;
    thresholdValue?: number;
    quorum?: number;
    anonymous?: boolean;
    closesAt?: number;
    now?: number;
}): TeamPoll;
/** One vote tally line. */
export interface PollOptionTally {
    id: string;
    label: string;
    votes: number;
    voters: string[];
    /** Voter identity → captain/member, when audit metadata exists. */
    voterTypes?: Record<string, 'captain' | 'member'>;
}
/** One poll as returned by a read. */
export interface PollRow {
    id: string;
    title: string;
    description?: string;
    multiSelect: boolean;
    maxSelections?: number;
    thresholdRule: PollThresholdRule;
    thresholdValue?: number;
    quorum: number;
    anonymous: boolean;
    createdBy: string;
    createdAt: number;
    closesAt?: number;
    closedAt?: number;
    closedBy?: string;
    status: 'open' | 'closed' | 'expired';
    options: PollOptionTally[];
    totalVoters: number;
    myVotes: string[];
    myRevision?: number;
    myVoterType?: 'captain' | 'member';
    decision?: PollDecision;
}
/** Ballot validation + storage for one participant. */
export declare function castPollVote(team: TeamState, input: {
    pollId: string;
    voter: string;
    /** `captain` for the human seat; defaults from the voter name. */
    voterType?: 'captain' | 'member';
    optionIds: readonly string[];
    now?: number;
}): {
    poll: TeamPoll;
    selected: string[];
    tallies: PollOptionTally[];
    revision: number;
};
/** Evaluate tallies against the poll's threshold rule and quorum. */
export declare function evaluatePoll(poll: TeamPoll): {
    totalVoters: number;
    quorum: number;
    quorumMet: boolean;
    thresholdRule: PollThresholdRule;
    thresholdValue?: number;
    tallies: PollOptionTally[];
    adoptedOptionIds: string[];
    insufficientQuorum: boolean;
    summary: string;
};
/** Close one poll (idempotent) and freeze its decision. */
export declare function closePoll(team: TeamState, pollId: string, options?: {
    closedBy?: string;
    now?: number;
}): TeamPoll;
/** Option tallies for one poll. */
export declare function tallyPoll(poll: TeamPoll): PollOptionTally[];
/** Read polls (newest first), optionally filtered by state, with the viewer's ballots. */
export declare function readPolls(team: TeamState, query?: {
    viewer?: string;
    status?: 'open' | 'closed' | 'expired';
    limit?: number;
    now?: number;
}): {
    rows: PollRow[];
    total: number;
};
/** Model-facing text for a poll read. */
export declare function renderPolls(rows: readonly PollRow[], total: number, viewer?: string): string;
/** Compact open-poll summary for digest/status. */
export declare function pollsDigest(team: Pick<TeamState, 'polls'>, now?: number): {
    open: number;
    total: number;
    items: {
        id: string;
        title: string;
        multiSelect: boolean;
        totalVoters: number;
        thresholdRule: PollThresholdRule;
        quorum: number;
        leading: {
            label: string;
            votes: number;
        }[];
    }[];
} | undefined;
