/**
 * `deers_team_progress`: member heartbeats for long-running attempts.
 *
 * The watchdog uses the latest heartbeat to distinguish "still working" from
 * "stalled"; without it the only signal is the last state transition. Progress
 * updates never change task status, so they are safe to call from inside a long
 * tool sequence.
 * @module deers-dsh-agent-team/tools/progress
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { join } from 'node:path'
import { appendTeamEvent } from '../events.ts'
import { findTeamByParticipant, readTeam, withTeamLock, writeTeam } from '../state.ts'
import type { ToolsConfig } from '../tools.ts'
import type { TeamState } from '../types.ts'

function requireAgent(exec: ToolRunContext): Agent {
  if (!exec.agent) {
    throw new Error('deers_team_progress requires a calling agent (exec.agent was undefined)')
  }
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

/** Build the progress-heartbeat tool. */
export function createProgressTool(_ctx: Context, config: ToolsConfig): ToolDefinition {
  return defineTool({
    name: 'deers_team_progress',
    description: 'Report a heartbeat for your currently claimed task while a long step is running (tests, builds, browsing, waiting on CI). The watchdog treats a claimed/in-progress task without a heartbeat for a while as stalled. This never changes task status: keep the attempt_id from claim_task and call it periodically with a short note and optional percent.',
    parameters: {
      task_id: { type: 'string', required: true, description: 'Task id you are working on (for example t3).' },
      attempt_id: { type: 'string', required: true, description: 'Current attempt capability returned by claim_task/reassign_task.' },
      percent: { type: 'number', description: 'Optional self-reported completion percentage (0-100).' },
      note: { type: 'string', description: 'Optional short status line, for example "running pnpm test".' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          task_id: { type: 'string', required: true },
          status: { type: 'string', required: true },
          percent: { type: 'number' },
          note: { type: 'string' },
          updated_at: { type: 'number', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Heartbeat recorded for ${value.task_id}`
          + `${value.percent === undefined ? '' : ` at ${value.percent}%`}`
          + `${value.note === undefined ? '' : `: ${value.note}`}.`,
      }],
    },
    async execute(args, exec) {
      const caller = requireAgent(exec)
      const stateRoot = stateRootOf(workspaceOf(caller), config)
      const located = await findTeamByParticipant(stateRoot, caller.id)
      if (located === undefined) throw new Error('you do not lead or belong to any active team yet')
      return withTeamLock(teamLockKey(stateRoot, located.id), async () => {
        const team: TeamState | undefined = await readTeam(stateRoot, located.id)
        if (team === undefined) throw new Error(`team "${located.id}" is no longer active`)
        const member = team.members.find((candidate) => candidate.id === caller.id && candidate.status !== 'removed')
        if (member === undefined) {
          throw new Error('only the working member reports progress; the captain should inspect deers_team_digest/status instead')
        }
        const task = team.tasks.find((candidate) => candidate.id === args.task_id)
        if (task === undefined) throw new Error(`no task "${args.task_id}" in team "${team.name}"`)
        if (task.assignee !== member.name) throw new Error(`task ${task.id} is assigned to ${task.assignee ?? 'nobody'}, not ${member.name}`)
        if (task.attemptId !== args.attempt_id) throw new Error('stale or foreign attempt_id; claim the task again before reporting progress')
        if (task.status !== 'claimed' && task.status !== 'in_progress') {
          throw new Error(`task ${task.id} is ${task.status}; progress heartbeats only apply to claimed/in_progress attempts`)
        }
        const now = Date.now()
        const note = typeof args.note === 'string' && args.note.trim() !== '' ? args.note.trim().slice(0, 500) : undefined
        const percent = typeof args.percent === 'number' && Number.isFinite(args.percent)
          ? Math.max(0, Math.min(100, Math.round(args.percent)))
          : undefined
        task.progress = {
          updatedAt: now,
          ...percent === undefined ? {} : { percent },
          ...note === undefined ? {} : { note },
        }
        task.updatedAt = now
        await writeTeam(stateRoot, team)
        appendTeamEvent(_ctx, caller.session, 'deers-agent-team/task-progress', {
          teamId: team.id,
          taskId: task.id,
          member: member.name,
          ...percent === undefined ? {} : { percent },
          ...note === undefined ? {} : { note },
          ts: now,
        })
        return {
          task_id: task.id,
          status: task.status,
          ...percent === undefined ? {} : { percent },
          ...note === undefined ? {} : { note },
          updated_at: now,
        }
      })
    },
  })
}
