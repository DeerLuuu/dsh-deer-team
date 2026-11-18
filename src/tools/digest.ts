/**
 * Context-budget tools: `deers_team_digest` (bounded inline view) and
 * `deers_team_recall` (fetch exact detail by durable id).
 *
 * The pair implements the "Inline & Spill / Chain of Recall" memory split for
 * teams: routine captain turns read the digest; detail is pulled only when a
 * specific task, message or board entry matters.
 * @module deers-dsh-agent-team/tools/digest
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { join } from 'node:path'
import { blackboardOf } from '../blackboard.ts'
import { buildTeamDigest, renderTeamDigest } from '../digest.ts'
import { findTeamByParticipant, readMailbox, readTeam, withTeamLock } from '../state.ts'
import type { ToolsConfig } from '../tools.ts'
import type { TeamMessage, TeamState } from '../types.ts'

function requireAgent(exec: ToolRunContext): Agent {
  if (!exec.agent) throw new Error('deers_team context tools require a calling agent (exec.agent was undefined)')
  return exec.agent
}

function workspaceOf(agent: Agent): string {
  return agent.session.header.cwd ?? process.cwd()
}

function stateRootOf(workspace: string, config: ToolsConfig): string {
  return join(workspace, config.stateDir)
}

function teamLockKey(stateRoot: string, teamId: string): string {
  return `team:${stateRoot}:${teamId}`
}

async function locate(config: ToolsConfig, exec: ToolRunContext): Promise<{ caller: Agent; stateRoot: string; teamId: string }> {
  const caller = requireAgent(exec)
  const stateRoot = stateRootOf(workspaceOf(caller), config)
  const located = await findTeamByParticipant(stateRoot, caller.id)
  if (located === undefined) throw new Error('you do not lead or belong to any active team yet')
  return { caller, stateRoot, teamId: located.id }
}

/** Messages visible to this participant (oldest first, bounded by caller). */
async function recentMessages(
  stateRoot: string,
  team: TeamState,
  caller: Agent,
): Promise<{ messages: TeamMessage[]; viewer: string }> {
  const isCaptain = team.captainSessionId === caller.id
  const viewer = isCaptain ? 'captain' : (team.members.find((member) => member.id === caller.id)?.name ?? '')
  if (viewer === '') return { messages: [], viewer }
  const messages = (await readMailbox(stateRoot, team.id, viewer))
    .filter((message) => message.discardedAt === undefined)
    .slice(-20)
  return { messages, viewer }
}

function truncate(value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined
  return value.length > max ? `${value.slice(0, max)}…` : value
}

/**
 * Build both context tools. `deers_team_digest` is cheap and bounded;
 * `deers_team_recall` fetches exact detail for up to a handful of ids.
 */
export function createDigestTools(_ctx: Context, config: ToolsConfig): ToolDefinition[] {
  const digest = defineTool({
    name: 'deers_team_digest',
    description: 'Read a bounded digest of the team: member/task counts, active and blocked tasks with heartbeat age, failures, latest blackboard entries, watchdog alerts, lead-time metrics and recent messages. Prefer this over deers_team_status on routine captain turns; pull exact detail with deers_team_recall.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          team_id: { type: 'string', required: true },
          summary: { type: 'string', required: true },
          generated_at: { type: 'number', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.summary }],
    },
    async execute(_args, exec) {
      const { caller, stateRoot, teamId } = await locate(config, exec)
      const { messages } = await recentMessages(stateRoot, await readTeam(stateRoot, teamId).then((team) => {
        if (team === undefined) throw new Error(`team "${teamId}" is no longer active`)
        return team
      }), caller)
      return withTeamLock(teamLockKey(stateRoot, teamId), async () => {
        const team = await readTeam(stateRoot, teamId)
        if (team === undefined) throw new Error(`team "${teamId}" is no longer active`)
        const now = Date.now()
        return {
          team_id: team.id,
          summary: renderTeamDigest(buildTeamDigest(team, { now, messages })),
          generated_at: now,
        }
      })
    },
  })

  const recall = defineTool({
    name: 'deers_team_recall',
    description: 'Fetch exact durable detail by id: a task (contract, output, findings, revisions, evidence), a mailbox message, or a blackboard entry. Use after deers_team_digest when a specific id needs full context; at least one id is required.',
    parameters: {
      task_id: { type: 'string', description: 'Task id to recall (for example t3).' },
      message_id: { type: 'string', description: 'Mailbox message id to recall.' },
      board_id: { type: 'string', description: 'Blackboard entry id to recall (for example bb-2).' },
      limit: { type: 'number', description: 'Maximum ids to resolve (1-10, default 3).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          team_id: { type: 'string', required: true },
          task: { type: 'string' },
          message: { type: 'string' },
          board: { type: 'string' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [value.task, value.message, value.board].filter((part): part is string => typeof part === 'string' && part !== '').join('\n\n')
          || `Nothing found in team ${value.team_id}.`,
      }],
    },
    async execute(args, exec) {
      const { caller, stateRoot, teamId } = await locate(config, exec)
      const limit = Math.max(1, Math.min(10, Math.trunc(typeof args.limit === 'number' ? args.limit : 3)))
      return withTeamLock(teamLockKey(stateRoot, teamId), async () => {
        const team = await readTeam(stateRoot, teamId)
        if (team === undefined) throw new Error(`team "${teamId}" is no longer active`)
        let remaining = limit
        let taskText: string | undefined
        let messageText: string | undefined
        let boardText: string | undefined

        const taskId = typeof args.task_id === 'string' ? args.task_id.trim() : ''
        if (taskId !== '' && remaining > 0) {
          remaining -= 1
          const task = team.tasks.find((candidate) => candidate.id === taskId)
          if (task === undefined) taskText = `Task "${taskId}" not found in team "${team.name}".`
          else {
            taskText = [
              `Task ${task.id} [${task.status}] ${task.subject}`,
              `assignee: ${task.assignee ?? 'unassigned'} · kind: ${task.kind ?? 'work'} · attempt: ${task.attempt ?? 0}`
                + `${task.attemptId === undefined ? '' : ` (attempt_id ${task.attemptId})`}`,
              task.objective === undefined ? undefined : `objective: ${task.objective}`,
              task.acceptance === undefined ? undefined : `acceptance: ${task.acceptance.join(' | ')}`,
              task.verify === undefined ? undefined : `verify: ${task.verify.join(' | ')}`,
              task.inScope === undefined ? undefined : `inScope: ${task.inScope.join(', ')}`,
              task.outOfScope === undefined ? undefined : `outOfScope: ${task.outOfScope.join(', ')}`,
              task.dependencies.length === 0 ? undefined : `dependencies: ${task.dependencies.join(', ')}`,
              task.progress === undefined ? undefined : `progress: ${task.progress.percent ?? '?'}% ${task.progress.note ?? ''}`.trim(),
              task.output === undefined ? undefined : `output: ${truncate(task.output, 1200)}`,
              task.findings === undefined ? undefined : `findings: ${JSON.stringify(task.findings).slice(0, 1200)}`,
              task.acceptanceResults === undefined ? undefined : `acceptanceResults: ${JSON.stringify(task.acceptanceResults).slice(0, 800)}`,
              task.commandsRun === undefined ? undefined : `commandsRun: ${JSON.stringify(task.commandsRun).slice(0, 800)}`,
              task.changedPaths === undefined ? undefined : `changedPaths: ${task.changedPaths.join(', ')}`,
              task.revisions === undefined ? undefined : `revisions: ${JSON.stringify(task.revisions).slice(0, 800)}`,
              `createdAt: ${new Date(task.createdAt).toISOString()} · updatedAt: ${new Date(task.updatedAt).toISOString()}`,
            ].filter((line): line is string => line !== undefined).join('\n')
          }
        }

        const messageId = typeof args.message_id === 'string' ? args.message_id.trim() : ''
        if (messageId !== '' && remaining > 0) {
          remaining -= 1
          // Mailbox visibility follows the status tool: the captain reads every
          // inbox; a member may recall only its own mailbox.
          const isCaptain = team.captainSessionId === caller.id
          const member = team.members.find((candidate) => candidate.id === caller.id && candidate.status !== 'removed')
          const owners = isCaptain
            ? ['captain', ...team.members.filter((item) => item.status !== 'removed').map((item) => item.name)]
            : member === undefined ? [] : [member.name]
          let found: { message: TeamMessage; owner: string } | undefined
          for (const owner of owners) {
            const messages = await readMailbox(stateRoot, team.id, owner)
            const message = messages.find((candidate) => candidate.id === messageId)
            if (message !== undefined) { found = { message, owner }; break }
          }
          messageText = found === undefined
            ? `Message "${messageId}" not found in team "${team.name}".`
            : [
                `Message ${found.message.id} (${found.owner} inbox)`,
                `${found.message.from} → ${found.message.to} at ${new Date(found.message.ts).toISOString()}`,
                truncate(found.message.content, 2000) ?? '',
                found.message.taskId === undefined ? undefined : `task: ${found.message.taskId} · attempt: ${found.message.attemptId ?? ''}`,
              ].filter((line): line is string => line !== undefined).join('\n')
        }

        const boardId = typeof args.board_id === 'string' ? args.board_id.trim() : ''
        if (boardId !== '' && remaining > 0) {
          remaining -= 1
          const entry = blackboardOf(team).entries.find((candidate) => candidate.id === boardId)
          boardText = entry === undefined
            ? `Blackboard entry "${boardId}" not found in team "${team.name}".`
            : [
                `Blackboard ${entry.id} [${entry.kind}] by ${entry.author}${entry.pinned === true ? ' (pinned)' : ''}`,
                truncate(entry.content, 2000) ?? '',
                `votes: ${JSON.stringify(entry.votes ?? {})}`,
              ].join('\n')
        }

        if (taskText === undefined && messageText === undefined && boardText === undefined) {
          throw new Error('pass at least one of task_id, message_id or board_id')
        }
        return {
          team_id: team.id,
          ...taskText === undefined ? {} : { task: taskText },
          ...messageText === undefined ? {} : { message: messageText },
          ...boardText === undefined ? {} : { board: boardText },
        }
      })
    },
  })

  return [digest, recall]
}
