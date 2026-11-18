/**
 * AgentTeams session event types — pure types only, zero imports.
 *
 * This file intentionally imports nothing: both the host program (the
 * emitter in `events.ts`) and the browser program (the Conversation Node
 * definition) must be able to load these types and the `SessionEventMap`
 * declaration merge without pulling in host-side `Context` augmentations
 * (dsh-session's index declares `Context.sessions: SessionStore`, which
 * collides with the browser runtime's `ISessions` under the same name).
 * @module deers-dsh-agent-team/event-types
 */

/** Opens one team record: the captain created the team. */
export interface AgentTeamsTeamCreatedData {
  readonly teamId: string
  /** The captain session that owns this team (UI follows it). */
  readonly captainSessionId: string
  readonly name: string
  readonly description?: string
  readonly profile?: string
}

/** Records one member after its continuable subagent is spawned. */
export interface AgentTeamsMemberAddedData {
  readonly teamId: string
  readonly memberId: string
  readonly name: string
  readonly role?: string
}

/** Marks one member removed. */
export interface AgentTeamsMemberRemovedData {
  readonly teamId: string
  readonly memberId: string
}

/** Records one task in the team's task list. */
export interface AgentTeamsTaskCreatedData {
  readonly teamId: string
  readonly taskId: string
  readonly subject: string
  readonly dependencies: readonly string[]
  readonly assignee?: string
  readonly kind?: string
  readonly round?: number
}

/** Records one task status/assignee/output transition. */
export interface AgentTeamsTaskUpdatedData {
  readonly teamId: string
  readonly taskId: string
  readonly status: string
  readonly assignee?: string
  readonly output?: string
  readonly attempt?: number
  readonly attemptId?: string
  readonly verdict?: string
  readonly round?: number
}

/** Records one member heartbeat on a long-running attempt. */
export interface AgentTeamsTaskProgressData {
  readonly teamId: string
  readonly taskId: string
  readonly member?: string
  readonly percent?: number
  readonly note?: string
  readonly ts: number
}

/** Records one captain-only contract amendment on a task. */
export interface AgentTeamsTaskAmendedData {
  readonly teamId: string
  readonly taskId: string
  /** Amended contract field names (`objective`, `inScope`, …). */
  readonly fields: readonly string[]
  /** Why the previous contract was wrong. */
  readonly reason: string
}

/** Records a human halt from the captain chat. */
export interface AgentTeamsTeamHaltedData {
  readonly teamId: string
  readonly cancelledTasks: number
}

/** Records an explicit captain resume of a halted team. */
export interface AgentTeamsTeamResumedData {
  readonly teamId: string
  readonly reason: string
}

/** Closes one team record: the team was deleted. */
export interface AgentTeamsTeamDeletedData {
  readonly teamId: string
}

/** Records a staged plan that the user rejected before any member was spawned. */
export interface AgentTeamsPlanDiscardedData {
  readonly teamId: string
}

/** Records one mailbox message sent between team agents. */
export interface AgentTeamsMessageSentData {
  readonly teamId: string
  readonly messageId: string
  /** `captain` or a member name. */
  readonly from: string
  /** `captain` or a member name. */
  readonly to: string
  readonly content: string
  readonly ts: number
}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /**
     * Opens one team record.
     * @param data - stable team identity and display name.
     */
    'deers-agent-team/team-created': AgentTeamsTeamCreatedData
    /**
     * Records one team member.
     * @param data - team identity, member child session, and display identity.
     */
    'deers-agent-team/member-added': AgentTeamsMemberAddedData
    /**
     * Records one member removal.
     * @param data - team identity and the member's child session id.
     */
    'deers-agent-team/member-removed': AgentTeamsMemberRemovedData
    /**
     * Records one task creation.
     * @param data - team identity, task id, subject, dependencies, assignee.
     */
    'deers-agent-team/task-created': AgentTeamsTaskCreatedData
    /**
     * Records one task transition.
     * @param data - team identity, task id, and the new status/assignee/output.
     */
    'deers-agent-team/task-updated': AgentTeamsTaskUpdatedData
    /**
     * Records one captain-only contract amendment.
     * @param data - team identity, task id, amended field names, and reason.
     */
    'deers-agent-team/task-amended': AgentTeamsTaskAmendedData
    /**
     * Records one member heartbeat on a long-running attempt.
     * @param data - team identity, task id, member, percent/note and timestamp.
     */
    'deers-agent-team/task-progress': AgentTeamsTaskProgressData
    /**
     * Records one mailbox message.
     * @param data - team identity, sender, recipient, and content.
     */
    'deers-agent-team/message-sent': AgentTeamsMessageSentData
    /**
     * Records a human halt from the captain chat.
     * @param data - team identity and how many unfinished tasks were cancelled.
     */
    'deers-agent-team/team-halted': AgentTeamsTeamHaltedData
    /**
     * Records an explicit captain resume.
     * @param data - team identity and the resume reason.
     */
    'deers-agent-team/team-resumed': AgentTeamsTeamResumedData
    /**
     * Closes one team record after deletion.
     * @param data - stable team identity.
     */
    'deers-agent-team/team-deleted': AgentTeamsTeamDeletedData
    /**
     * Closes a staged plan rejected during pre-run review.
     * @param data - stable team identity.
     */
    'deers-agent-team/plan-discarded': AgentTeamsPlanDiscardedData
  }
}

/** The full set of `deers-agent-team/*` event names. */
export type AgentTeamsEventType =
  | 'deers-agent-team/team-created'
  | 'deers-agent-team/member-added'
  | 'deers-agent-team/member-removed'
  | 'deers-agent-team/task-created'
  | 'deers-agent-team/task-updated'
  | 'deers-agent-team/task-amended'
  | 'deers-agent-team/task-progress'
  | 'deers-agent-team/message-sent'
  | 'deers-agent-team/team-halted'
  | 'deers-agent-team/team-resumed'
  | 'deers-agent-team/team-deleted'
  | 'deers-agent-team/plan-discarded'
