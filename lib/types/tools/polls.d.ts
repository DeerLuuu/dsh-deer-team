/**
 * Team poll tools: captain-created single/multi-choice votes every participant
 * can join from the model side; the Web voting panel reuses the same captain
 * helpers.
 * @module deers-dsh-agent-team/tools/polls
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { ToolsConfig } from '../tools.ts';
import type { TeamPoll } from '../types.ts';
/** Captain-authored poll creation shared by the tool and the Web panel. */
export declare function createCaptainPoll(input: {
    stateRoot: string;
    teamId: string;
    captainId: string;
    title: string;
    description?: string;
    options: readonly string[];
    multiSelect?: boolean;
    maxSelections?: number;
    thresholdRule?: 'majority' | 'gt' | 'percent';
    thresholdValue?: number;
    quorum?: number;
    anonymous?: boolean;
    durationMinutes?: number;
}): Promise<{
    poll: TeamPoll;
    count: number;
}>;
/** Captain ballot shared by the Web panel (the human votes as the captain). */
export declare function castCaptainPollVote(input: {
    stateRoot: string;
    teamId: string;
    captainId: string;
    pollId: string;
    optionIds: readonly string[];
}): Promise<{
    poll: TeamPoll;
    selected: string[];
    totalVoters: number;
    revision: number;
}>;
/** Captain close shared by the Web panel. */
export declare function closeCaptainPoll(input: {
    stateRoot: string;
    teamId: string;
    captainId: string;
    pollId: string;
}): Promise<TeamPoll>;
/** Build the four poll tools. */
export declare function createPollTools(_ctx: Context, config: ToolsConfig): ToolDefinition[];
