/**
 * The `deers_team_blackboard_*` tools.
 *
 * The blackboard is the team's shared, durable side channel: every
 * participant (captain and members) can append entries, read the whole feed
 * and vote on proposals. It is meant for brainstorming sessions, idea
 * collection and feature votes — work that is not yet a task.
 *
 * Tools own identity resolution, locking and persistence; the pure state
 * transformations live in `../blackboard.ts`.
 * @module deers-dsh-agent-team/tools/blackboard
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import { BLACKBOARD_MAX_CONTENT } from '../blackboard.ts';
import type { ToolsConfig } from '../tools.ts';
/**
 * Build the blackboard tool set. Registration order is stable: post, read,
 * vote, clear.
 * @param _ctx - host context (unused; kept for the factory shape of sibling tools).
 * @param config - resolved plugin config (state directory name).
 */
export declare function createBlackboardTools(_ctx: Context, config: ToolsConfig): ToolDefinition[];
/** Content limit re-exported for tool descriptions and tests. */
export { BLACKBOARD_MAX_CONTENT };
/** Target of a captain-authored blackboard write from the Web panel. */
export interface CaptainBlackboardTarget {
    stateRoot: string;
    teamId: string;
    captainId: string;
}
/** Append one captain-authored entry; shared by the panel route and tests. */
export declare function appendCaptainBlackboardEntry(input: CaptainBlackboardTarget & {
    content: string;
    kind?: string;
    pinned?: boolean;
}): Promise<{
    entryId: string;
    author: string;
    kind: string;
    ts: number;
    count: number;
}>;
/** Cast or clear the captain's vote; shared by the panel route and tests. */
export declare function castCaptainBlackboardVote(input: CaptainBlackboardTarget & {
    entryId: string;
    vote: 'up' | 'down' | 'clear';
}): Promise<{
    entryId: string;
    votesUp: number;
    votesDown: number;
}>;
