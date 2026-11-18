/**
 * The `deers_team_*` model-facing tools.
 *
 * The captain (the agent that created the team) orchestrates: members are
 * continuable subagents it spawns and wakes. Members share the same tools and
 * drive their own task state, mirroring the Claude Code AgentTeams flow:
 * create team → add members → create tasks with dependencies → claim/assign →
 * work → report → status → delete.
 * @module deers-dsh-agent-team/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { type WatchdogOptions } from './watchdog.ts';
import { type TeamState, type TeamTask } from './types.ts';
export { steerCaptainReport } from './members.ts';
/** Resolved plugin config consumed by the tools. */
export interface ToolsConfig {
    /** State directory name under the captain's workspace. */
    stateDir: string;
    /** Member subagent provider name. */
    memberProvider: string;
    /** Optional member model override. */
    memberModel?: string;
    /** Prompt injected into member personas and assignments. */
    executionPrompt?: string;
    /** Plugin fallback route. */
    fallback?: import('./profiles.ts').TeamModelFallbackConfig;
    /** Member delegation depth cap. */
    memberMaxDepth?: number;
    /** Team size cap (members). */
    maxMembers: number;
    /** Named team profiles from the active DSH profile. */
    profiles: Record<string, import('./profiles.ts').TeamProfileConfig>;
    /** Allow captain takeover of implementation/repair tasks (Router-role policy). */
    captainMayImplement?: boolean;
    /** Coalesce captain-bound reports; 0 disables batching. */
    routerBatchWindowMs?: number;
    /** Watchdog overrides merged onto {@link DEFAULT_WATCHDOG}. */
    watchdog?: Partial<WatchdogOptions>;
    /** Periodic blackboard retention policy; defaults to 30 days with pinned/decisions kept. */
    blackboardCleanup?: import('./blackboard-cleanup.ts').BlackboardCleanupOptions;
}
/** Browser/UI mutations allowed while a plan is waiting for approval. */
export type StagedPlanMutation = {
    action: 'update_member';
    memberName: string;
    role?: string | null;
    provider: string;
    model: string;
    reasoningEffort?: string | null;
    executionPrompt?: string | null;
} | {
    action: 'update_task';
    taskId: string;
    subject: string;
    description?: string | null;
    assignee?: string | null;
    dependencies: string[];
    /** Staged-only contract fields: undefined = keep, null = clear. */
    kind?: import('./types.ts').TaskKind | null;
    round?: number | null;
    objective?: string | null;
    inScope?: string[] | null;
    outOfScope?: string[] | null;
    acceptance?: string[] | null;
    verify?: string[] | null;
    deliverables?: string[] | null;
    nonGoals?: string[] | null;
    reviewedTaskId?: string | null;
    coverageOf?: string[] | null;
} | {
    action: 'add_task';
    subject: string;
    description?: string | null;
    assignee?: string | null;
    dependencies: string[];
} | {
    action: 'remove_task';
    taskId: string;
} | {
    action: 'remove_member';
    memberName: string;
};
/** Runtime bridge shared by model-facing tools and the Web staging surface. */
export interface AgentTeamsRuntime {
    isPendingMember(agent: Agent): boolean;
    updateStagedPlan(captain: Agent, teamId: string, mutation: StagedPlanMutation, signal?: AbortSignal): Promise<TeamState>;
    updateStagedPlanBatch(captain: Agent, teamId: string, mutations: readonly StagedPlanMutation[], signal?: AbortSignal): Promise<TeamState>;
    approveStagedTeam(captain: Agent, teamId: string, signal?: AbortSignal): Promise<{
        teamId: string;
        members: number;
        tasks: number;
    }>;
    continueStagedPlanning(captain: Agent, teamId: string): Promise<{
        teamId: string;
        alreadyWaiting: boolean;
    }>;
    discardStagedTeam(captain: Agent, teamId: string): Promise<{
        teamId: string;
    }>;
    /** Web panel task operation: cancel a task, reassign a pending one, or redispatch a running attempt. */
    runTaskOperation(captain: Agent, teamId: string, taskId: string, op: 'cancel' | 'reassign' | 'redispatch', assignee: string | undefined, signal?: AbortSignal): Promise<{
        taskId: string;
        status: string;
        assignee: string;
        attempt: number;
    }>;
    /** Web panel: append one captain-authored mailbox message and try to wake the member. */
    sendCaptainMailboxMessage(captain: Agent, teamId: string, to: string, content: string, signal?: AbortSignal): Promise<{
        messageId: string;
        delivered: 'wake' | 'mailbox';
    }>;
    /** Web panel: append one captain-authored blackboard entry (the human writes as the captain). */
    postCaptainBlackboardEntry(captain: Agent, teamId: string, input: {
        content: string;
        kind?: string;
        pinned?: boolean;
    }, signal?: AbortSignal): Promise<{
        entryId: string;
        author: string;
        kind: string;
        ts: number;
        count: number;
    }>;
    /** Web panel: cast/switch/clear the captain's vote on one blackboard entry. */
    voteCaptainBlackboardEntry(captain: Agent, teamId: string, entryId: string, vote: 'up' | 'down' | 'clear', signal?: AbortSignal): Promise<{
        entryId: string;
        votesUp: number;
        votesDown: number;
    }>;
    /** Web panel: create a captain-authored poll (single or multi choice). */
    createCaptainPoll(captain: Agent, teamId: string, input: {
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
    }, signal?: AbortSignal): Promise<{
        pollId: string;
        title: string;
        multiSelect: boolean;
        options: string[];
        thresholdRule: string;
        thresholdValue?: number;
        quorum: number;
        anonymous?: boolean;
        closesAt?: number;
        count: number;
    }>;
    /** Web panel: cast or clear the captain's ballot in a poll. */
    castCaptainPollVote(captain: Agent, teamId: string, pollId: string, optionIds: readonly string[], signal?: AbortSignal): Promise<{
        pollId: string;
        selected: string[];
        totalVoters: number;
        revision: number;
    }>;
    /** Web panel: close one poll and freeze its decision. */
    closeCaptainPoll(captain: Agent, teamId: string, pollId: string, signal?: AbortSignal): Promise<{
        pollId: string;
        status: string;
        totalVoters: number;
        adopted: string[];
        insufficientQuorum: boolean;
        summary: string;
    }>;
}
/**
 * Router-role guard: by default the captain does not implement or repair.
 * Takeover stays available for a user-requested rescue, or when the profile
 * explicitly opts in with `captainMayImplement: true`.
 */
export declare function assertCaptainTakeoverAllowed(task: TeamTask, config: ToolsConfig): void;
/** Validate references and cycles before a staged graph can be saved or run.
 * Exported for tests: the approve-time per-row contract loop lives here. */
export declare function validateStagedGraph(team: TeamState, requireRunnable: boolean): void;
export declare function haltTeamWork(input: {
    ctx: Context;
    stateRoot: string;
    teamId: string;
    captain: Agent;
    signal?: AbortSignal;
}): Promise<{
    teamName: string;
    cancelledTasks: number;
    alreadyHalted: boolean;
}>;
/** Web approval has no tool result in the captain's conversation. */
export declare function stagedPlanApprovedContext(teamName: string): string;
/** Context queued after the human rejects a staged plan. */
export declare function stagedPlanDiscardContext(teamName: string): string;
/** Model-facing continuation that turns the review UI back into a conversation. */
export declare function stagedPlanFeedbackContext(teamName: string): string;
/**
 * Register every `deers_team_*` tool into the shared tools registry.
 * @param ctx - the plugin context (injects `tools`).
 * @param config - resolved tool config.
 */
export declare function registerAgentTeamsTools(ctx: Context, config: ToolsConfig): AgentTeamsRuntime;
export declare function applyQualityFollowUp(team: TeamState, closed: TeamTask): {
    created: TeamTask[];
    escalated: boolean;
};
