/**
 * Durable AgentTeams state types.
 *
 * A team is one directory under the state root holding `team.json` plus an
 * `inbox/` of per-agent JSONL mailboxes. Members are continuable subagents
 * whose durable child session ids are recorded in the team file, so a team
 * survives harness restarts.
 * @module deers-dsh-agent-team/types
 */

/** Task lifecycle statuses in progression order. */
export type TaskStatus =
  | 'pending'
  | 'claimed'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

/** Statuses after which a task can no longer be claimed or worked on. */
export const TERMINAL_TASK_STATUSES: readonly TaskStatus[] = ['completed', 'failed', 'cancelled']

/** Structured quality-gate kind. Absent / unknown values are treated as `work`. */
export type TaskKind =
  | 'requirements'
  | 'implementation'
  | 'verification'
  | 'review'
  | 'repair'
  | 'integration'
  | 'work'

export const TASK_KINDS: readonly TaskKind[] = [
  'requirements',
  'implementation',
  'verification',
  'review',
  'repair',
  'integration',
  'work',
]

/** Review / requirements conclusion. Only `pass` may complete those kinds. */
export type ReviewVerdict = 'pass' | 'needs_revision' | 'reject'

export const REVIEW_VERDICTS: readonly ReviewVerdict[] = ['pass', 'needs_revision', 'reject']

/** Finding severity used by review / requirements output. */
export type FindingSeverity = 'low' | 'medium' | 'high' | 'blocker'

export const FINDING_SEVERITIES: readonly FindingSeverity[] = ['low', 'medium', 'high', 'blocker']

/** One structured review finding. */
export interface ReviewFinding {
  /** Stable id, for example `SEC-001`. */
  id: string
  severity: FindingSeverity
  file?: string
  line?: number
  problem: string
  requiredFix: string
  resolved?: boolean
}

/** One acceptance criterion result recorded at completion. */
export interface AcceptanceResult {
  criterion: string
  status: 'passed' | 'failed'
  evidence?: string
}

/** One verification command result recorded at completion. */
export interface CommandResult {
  command: string
  status: 'passed' | 'failed'
  exitCode?: number
  evidence?: string
}

/** Profile / team review-loop limits. */
export interface ReviewPolicy {
  requirementsMinRounds?: number
  requirementsMaxRounds?: number
  codeMaxRounds?: number
  maxRepairAttempts?: number
  requiredReviewers?: string[]
}

/** One captain-only contract amendment recorded on a quality task. */
export interface TaskRevision {
  /** Epoch ms when the amendment was applied. */
  at: number
  /** Identity that applied it (`captain`). */
  by: string
  /** Why the previous contract was wrong; kept for the audit trail. */
  reason: string
  /** Amended contract field names (`objective`, `acceptance`, …). */
  fields: string[]
  /** Previous values of the amended fields; fields absent before are omitted. */
  previous: Record<string, unknown>
}

/** Append-only observations; never replace the terminal verdict or unlock a gate. */
export interface TaskEvidence {
  at: number
  by: string
  attempt: number
  attemptId?: string
  note?: string
  acceptanceResults?: AcceptanceResult[]
  commandsRun?: CommandResult[]
}

/** Latest member heartbeat for one long-running attempt. */
export interface TaskProgress {
  /** Optional self-reported completion percentage (0-100). */
  percent?: number
  /** Short status line ("running tests", "waiting on CI", …). */
  note?: string
  /** Epoch ms of the latest heartbeat. */
  updatedAt: number
}

/** One task of a team's task list. */
export interface TeamTask {
  /** Stable task id from the profile template; absent for ad-hoc tasks. */
  profileSeedId?: string
  /** Stable task id within the team (`t1`, `t2`, …). */
  id: string
  /** Brief title for the task. */
  subject: string
  /** What needs to be done. */
  description?: string
  status: TaskStatus
  /** Member name (or `captain`) the task is assigned to; unassigned tasks await a claim. */
  assignee?: string
  /** Task ids that must reach `completed` before this task can be claimed. */
  dependencies: string[]
  /** The worker's written result, set when the task completes or fails. */
  output?: string
  /** Monotonic execution generation. Reassignment/retry invalidates every older attempt. */
  attempt?: number
  /** Capability for the current claimed/in-progress attempt. Members must present it when updating. */
  attemptId?: string
  /** Opaque generation for a revocation/handoff that has not started its next attempt yet. */
  handoffId?: string
  /** Previous activation retained until a handoff drain succeeds (retryable). */
  handoffFromMemberId?: string
  /** A handoff is quiescing the old owner; the scheduler must not dispatch it yet. */
  reassigning?: boolean
  /** Quality-gate kind. Missing values are treated as `work`. */
  kind?: TaskKind
  /** Review / requirements / repair loop index, 1-based when present. */
  round?: number
  verdict?: ReviewVerdict
  findings?: ReviewFinding[]
  objective?: string
  inScope?: string[]
  outOfScope?: string[]
  acceptance?: string[]
  verify?: string[]
  deliverables?: string[]
  nonGoals?: string[]
  changedPaths?: string[]
  acceptanceResults?: AcceptanceResult[]
  commandsRun?: CommandResult[]
  /** Supplemental observations, attributed to their original execution generation. */
  supplementalEvidence?: TaskEvidence[]
  reviewedTaskId?: string
  reviewedAttempt?: number
  /** Repair source: the implementation / previous successful artifact. */
  sourceTaskId?: string
  sourceFindingIds?: string[]
  /** User-constraint / goal items this task claims to cover. */
  coverageOf?: string[]
  /** Captain-only contract amendments, oldest first (see amendTaskContract). */
  revisions?: TaskRevision[]
  /**
   * Optimistic-concurrency revision for CAS updates (spec §11.2). Absent
   * records count as revision 0; every applied `deers_team_update_task`
   * mutation increments it by one.
   */
  revision?: number
  createdAt: number
  updatedAt: number
  /** Latest heartbeat for a long-running attempt; absent before the first one. */
  progress?: TaskProgress
}

/** Severity of one watchdog alert. */
export type WatchdogSeverity = 'info' | 'warn' | 'critical'

/** Why the watchdog raised an alert. */
export type WatchdogAlertKind = 'stalled' | 'retrying' | 'repeat-message'

/** One watchdog finding, persisted until its task/member recovers. */
export interface WatchdogAlert {
  /** Stable id derived from kind + subject, so repeats do not duplicate. */
  id: string
  kind: WatchdogAlertKind
  severity: WatchdogSeverity
  message: string
  at: number
  taskId?: string
  member?: string
}

/** Persisted watchdog state: alerts plus the last successful scan. */
export interface WatchdogState {
  lastRunAt?: number
  alerts: WatchdogAlert[]
}

/** Member lifecycle status. */
export type MemberStatus = 'idle' | 'working' | 'removed'

/** One team member: a continuable subagent plus its team-side record. */
export interface TeamMember {
  /** Durable continuable subagent session id (empty until spawned). */
  id: string
  /** Unique display name inside the team. */
  name: string
  /** Role description, e.g. `researcher`, `engineer`, `reviewer`. */
  role?: string
  /**
   * Member persona text (spec §8.1): guidance injected into this member's
   * persona/execution prompt. Editable only while the plan is staged
   * (`deers_team_edit_member`); absent when the member has no dedicated
   * persona beyond the team defaults.
   */
  persona?: string
  /** One-line description of what this member is for; staged-phase editable. */
  description?: string
  /** Host skill names this member should use; validated against the host skill catalog at edit time. */
  skills?: string[]
  /** Resolved LLM provider route captured when this member was created. */
  provider?: string
  /** Resolved model captured when this member was created. */
  model?: string
  /** Resolved reasoning effort captured from the captain or target model default. */
  reasoningEffort?: string
  /** Prompt specific to this member's execution turns. */
  executionPrompt?: string
  /** Configured second-choice route. */
  fallback?: TeamModelFallback
  /** Active route after fallback, without changing the primary descriptor route. */
  activeProvider?: string
  activeModel?: string
  /** Whether the fallback route is currently active. */
  fallbackActive?: boolean
  joinedAt: number
  status: MemberStatus
  /** Execution admission is closed while a failed/pending handoff is drained. */
  stopping?: boolean
  /**
   * Last member-start failure, recorded so the captain can see why a member
   * never acquired a session instead of observing an unexplained `unspawned`
   * member. Cleared by the next successful start.
   */
  spawnError?: string
}

/** Kinds of entries on a team's shared blackboard. */
export type BlackboardEntryKind = 'note' | 'idea' | 'proposal' | 'decision'
/** Every supported blackboard entry kind, in display order. */
export const BLACKBOARD_ENTRY_KINDS: readonly BlackboardEntryKind[] = ['note', 'idea', 'proposal', 'decision']

/** One vote cast on a blackboard entry: upvote or downvote. */
export type BlackboardVote = 'up' | 'down'

/** One durable entry on a team's shared blackboard (a brainstorming / voting board). */
export interface BlackboardEntry {
  /** Stable id within the team (`bb-1`, `bb-2`, …). */
  id: string
  /** `captain` or a member name. */
  author: string
  kind: BlackboardEntryKind
  content: string
  createdAt: number
  /** Votes keyed by voter identity; each participant has at most one vote. */
  votes?: Record<string, BlackboardVote>
  /** Captain-pinned entries survive trimming and clear-with-keep? Pinned entries are shown first. */
  pinned?: boolean
}

/** The team's shared blackboard: an append-ordered feed plus its id counter. */
export interface BlackboardState {
  /** Monotonic entry id counter; ids are `bb-<seq>`. */
  seq: number
  entries: BlackboardEntry[]
  /** Last time automatic cleanup removed at least one entry. */
  lastCleanupAt?: number
}

/** One selectable option in a team poll. */
export interface PollOption {
  /** Stable option id within the poll (`o1`, `o2`, …). */
  id: string
  label: string
}

/** Lifecycle of a team poll. */
export type PollStatus = 'open' | 'closed'

/** How a closed poll decides which options are adopted. */
export type PollThresholdRule = 'majority' | 'gt' | 'percent'

/** Audit metadata for one ballot; selections stay in `TeamPoll.votes`. */
export interface PollBallotMeta {
  /** 1 on the first submission, +1 for every change or withdrawal. */
  revision: number
  /** `captain` is the human-facing seat; `member` is an Agent voter. */
  voterType: 'captain' | 'member'
  updatedAt: number
}

/** The decision produced when a poll closes. */
export interface PollDecision {
  /** Options that reached the configured rule; empty when none did. */
  adoptedOptionIds: string[]
  /** True when fewer ballots arrived than the configured quorum. */
  insufficientQuorum: boolean
  quorum: number
  totalVoters: number
  thresholdRule: PollThresholdRule
  thresholdValue?: number
  summary: string
  decidedAt: number
  decidedBy: string
}

/** One single- or multi-choice team poll (formal voting, separate from the blackboard). */
export interface TeamPoll {
  /** Stable poll id within the team (`poll-1`, `poll-2`, …). */
  id: string
  title: string
  description?: string
  options: PollOption[]
  /** True when a participant may select more than one option. */
  multiSelect: boolean
  /** Optional cap for multi-select polls (absent means every option). */
  maxSelections?: number
  /** Adopt rule applied when the poll closes; defaults to `majority`. */
  thresholdRule?: PollThresholdRule
  /** Absolute vote count (`gt`) or percent 1-100 (`percent`). */
  thresholdValue?: number
  /** Minimum ballots required before any option may be adopted; defaults to 1. */
  quorum?: number
  /** Hide voter names in reads; the durable ballot still keeps its identity. */
  anonymous?: boolean
  /** `captain` or a member name. */
  createdBy: string
  createdAt: number
  /** Absolute close deadline in epoch ms, when the creator supplied one. */
  closesAt?: number
  closedAt?: number
  closedBy?: string
  status: PollStatus
  /** Votes keyed by voter identity; each participant has at most one ballot. */
  votes?: Record<string, string[]>
  /** Revision / voter-type audit per voter. */
  ballotMeta?: Record<string, PollBallotMeta>
  /** Set when the poll closes; immutable afterwards. */
  decision?: PollDecision
}

/** Durable poll store attached to a team. */
export interface PollState {
  /** Monotonic poll id counter; ids are `poll-<seq>`. */
  seq: number
  polls: TeamPoll[]
}

/** One mailbox message. */
export interface TeamMessage {
  id: string
  /** `captain` or a member name. */
  from: string
  /** `captain` or a member name. */
  to: string
  content: string
  ts: number
  /** Process-local delivery lease; prevents fallback and direct delivery racing. */
  deliveryClaimedAt?: number
  /** Set after the durable message was accepted by the recipient's live Harness inbox. */
  deliveredAt?: number
  /** Set once the recipient has consumed or been shown the durable fallback. */
  readAt?: number
  /** Guidance is scoped to the recipient's execution generation, when present. */
  taskId?: string
  attemptId?: string
  /** Source execution generation, independent of the recipient guidance generation. */
  sourceTaskId?: string
  sourceAttemptId?: string
  sourceTaskStatus?: TaskStatus
  /** Cancelled delivery is retained for audit but must not wake the recipient. */
  discardedAt?: number
}

/** Snapshot of the named profile used to seed a team. */
export interface TeamModelFallback {
  provider: string
  model: string
}

/** One resolved LLM route: provider + model plus optional reasoning effort. */
export interface TeamModelRoute {
  provider: string
  model: string
  reasoningEffort?: string
}

export interface TeamProfileSnapshot {
  name: string
  description?: string
  protocol?: string
  executionPrompt?: string
  fallback?: TeamModelFallback
  /** Frozen planning mode: captain plans the graph; seed keeps template tasks. */
  taskPlanning?: 'captain' | 'seed'
  /** Frozen review-loop policy from the creating profile. */
  reviewPolicy?: ReviewPolicy
}

/** The full durable team record. */
export interface TeamState {
  /** Original team name. */
  name: string
  /** Sanitized directory id; the team's stable identity. */
  id: string
  /** Team purpose/goal. */
  description?: string
  /** Immutable named profile snapshot, when created from a profile. */
  profile?: TeamProfileSnapshot
  /** Session id of the captain agent that owns this team. */
  captainSessionId: string
  createdAt: number
  /** Teammates only; the captain is implicit (the owning session). */
  members: TeamMember[]
  tasks: TeamTask[]
  /** Monotonic task id counter. */
  taskSeq: number
  /**
   * Two-phase execution lifecycle. Missing means `running` for durable
   * compatibility with teams created before staging existed.
   */
  phase?: 'staged' | 'running'
  /**
   * Human-facing review sub-state while `phase` is `staged`. Missing staged
   * records are treated as `awaiting_review` for backward compatibility.
   * `awaiting_feedback` means the user returned to chat and the Captain must
   * ask what should change before editing this same draft.
   */
  planReviewState?: 'awaiting_review' | 'awaiting_feedback'
  /** Timestamp written only after a staged plan is explicitly approved. */
  approvedAt?: number
  /**
   * Team-default LLM route, snapshotted from the captain's current route when
   * the staged plan was approved (spec §9.3). Members without an explicit
   * model route inherit it — the hierarchy is member override > team default >
   * the captain's current route. Absent for teams approved before this field
   * existed.
   */
  defaultRoute?: TeamModelRoute
  /**
   * Human halt from the captain chat. The team remains on disk, members stay
   * available, and unfinished work is cancelled until the captain resumes.
   */
  halted?: boolean
  /** Timestamp of the latest human halt, when present. */
  haltedAt?: number
  /** Review-loop policy snapshot copied from the creating profile, when present. */
  reviewPolicy?: ReviewPolicy
  /** Set when an automatic review/repair loop hits its configured ceiling. */
  escalated?: boolean
  /**
   * Independent supervisor state: alerts raised by the watchdog loop (stalled
   * attempts, repeated failures, message loops) plus the last scan time. The
   * watchdog never mutates task state itself; it surfaces alerts the captain
   * (or the human) can act on.
   */
  watchdog?: WatchdogState
  /**
   * Shared team blackboard: an append-only feed every participant can read and
   * write, used for brainstorming sessions, idea collection and feature votes.
   * Absent on teams that never used it (and on states written before this
   * field existed); readers treat absence as an empty board.
   */
  blackboard?: BlackboardState
  /**
   * Formal team polls (single- or multi-choice). Separate from the blackboard
   * so a vote round has explicit options, one ballot per participant and a
   * close step. Absent means no poll has been created yet.
   */
  polls?: PollState
}
