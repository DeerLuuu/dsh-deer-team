/**
 * Team poll tools: captain-created single/multi-choice votes every participant
 * can join from the model side; the Web voting panel reuses the same captain
 * helpers.
 * @module deers-dsh-agent-team/tools/polls
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { join } from 'node:path'
import {
  castPollVote,
  closePoll,
  createPoll,
  pollsOf,
  readPolls,
  renderPolls,
} from '../polls.ts'
import { CAPTAIN_KEY, findTeamByParticipant, readTeam, withTeamLock, writeTeam } from '../state.ts'
import type { ToolsConfig } from '../tools.ts'
import type { TeamPoll, TeamState } from '../types.ts'

function requireAgent(exec: ToolRunContext): Agent {
  if (!exec.agent) throw new Error('deers_team vote tools require a calling agent (exec.agent was undefined)')
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

type ParticipantIdentity =
  | { kind: 'captain'; name: typeof CAPTAIN_KEY }
  | { kind: 'member'; name: string }

function participantIdentityOf(team: TeamState, agentId: string): ParticipantIdentity | undefined {
  if (team.captainSessionId === agentId) return { kind: 'captain', name: CAPTAIN_KEY }
  const member = team.members.find((candidate) => candidate.id === agentId && candidate.status !== 'removed')
  return member === undefined ? undefined : { kind: 'member', name: member.name }
}

async function withCallerTeam<T>(
  config: ToolsConfig,
  exec: ToolRunContext,
  fn: (context: { team: TeamState; identity: ParticipantIdentity; stateRoot: string }) => Promise<T>,
): Promise<T> {
  const caller = requireAgent(exec)
  const stateRoot = stateRootOf(workspaceOf(caller), config)
  const located = await findTeamByParticipant(stateRoot, caller.id)
  if (located === undefined) throw new Error('you do not lead or belong to any active team yet')
  return withTeamLock(teamLockKey(stateRoot, located.id), async () => {
    const team = await readTeam(stateRoot, located.id)
    if (team === undefined) throw new Error(`team "${located.id}" is no longer active`)
    const identity = participantIdentityOf(team, caller.id)
    if (identity === undefined) throw new Error(`you are no longer an active participant in team "${team.name}"`)
    return fn({ team, identity, stateRoot })
  })
}

/** Captain-authored poll creation shared by the tool and the Web panel. */
export async function createCaptainPoll(input: {
  stateRoot: string
  teamId: string
  captainId: string
  title: string
  description?: string
  options: readonly string[]
  multiSelect?: boolean
  maxSelections?: number
  thresholdRule?: 'majority' | 'gt' | 'percent'
  thresholdValue?: number
  quorum?: number
  anonymous?: boolean
  durationMinutes?: number
}): Promise<{ poll: TeamPoll; count: number }> {
  return withTeamLock(teamLockKey(input.stateRoot, input.teamId), async () => {
    const team = await readTeam(input.stateRoot, input.teamId)
    if (team === undefined) throw new Error(`team "${input.teamId}" is no longer active`)
    if (team.captainSessionId !== input.captainId) {
      throw new Error(`only the captain of team "${team.name}" may create a poll`)
    }
    const now = Date.now()
    const poll = createPoll(team, {
      author: CAPTAIN_KEY,
      title: input.title,
      description: input.description,
      options: input.options,
      multiSelect: input.multiSelect,
      maxSelections: input.maxSelections,
      thresholdRule: input.thresholdRule,
      thresholdValue: input.thresholdValue,
      quorum: input.quorum,
      anonymous: input.anonymous,
      closesAt: input.durationMinutes === undefined || input.durationMinutes <= 0
        ? undefined
        : now + Math.trunc(input.durationMinutes) * 60_000,
      now,
    })
    await writeTeam(input.stateRoot, team)
    return { poll, count: pollsOf(team).polls.length }
  })
}

/** Captain ballot shared by the Web panel (the human votes as the captain). */
export async function castCaptainPollVote(input: {
  stateRoot: string
  teamId: string
  captainId: string
  pollId: string
  optionIds: readonly string[]
}): Promise<{ poll: TeamPoll; selected: string[]; totalVoters: number; revision: number }> {
  return withTeamLock(teamLockKey(input.stateRoot, input.teamId), async () => {
    const team = await readTeam(input.stateRoot, input.teamId)
    if (team === undefined) throw new Error(`team "${input.teamId}" is no longer active`)
    if (team.captainSessionId !== input.captainId) {
      throw new Error(`only the captain of team "${team.name}" may vote as the captain`)
    }
    const result = castPollVote(team, {
      pollId: input.pollId,
      voter: CAPTAIN_KEY,
      voterType: 'captain',
      optionIds: input.optionIds,
    })
    await writeTeam(input.stateRoot, team)
    return {
      poll: result.poll,
      selected: result.selected,
      totalVoters: Object.keys(result.poll.votes ?? {}).length,
      revision: result.revision,
    }
  })
}

/** Captain close shared by the Web panel. */
export async function closeCaptainPoll(input: {
  stateRoot: string
  teamId: string
  captainId: string
  pollId: string
}): Promise<TeamPoll> {
  return withTeamLock(teamLockKey(input.stateRoot, input.teamId), async () => {
    const team = await readTeam(input.stateRoot, input.teamId)
    if (team === undefined) throw new Error(`team "${input.teamId}" is no longer active`)
    if (team.captainSessionId !== input.captainId) {
      throw new Error(`only the captain of team "${team.name}" may close a poll`)
    }
    const poll = closePoll(team, input.pollId, { closedBy: CAPTAIN_KEY })
    await writeTeam(input.stateRoot, team)
    return poll
  })
}

/** Build the four poll tools. */
export function createPollTools(_ctx: Context, config: ToolsConfig): ToolDefinition[] {
  const create = defineTool({
    name: 'deers_team_vote_create',
    description: 'Start a formal team poll (captain only). Single-choice by default; set multi_select=true (optionally max_selections) for multi-choice. Configure the adoption rule (majority default, gt absolute votes, percent), the quorum (minimum ballots), and optional anonymity. Every participant casts one ballot; close it with deers_team_vote_close to freeze a decision. Use polls for feature votes or decisions instead of blackboard reactions.',
    parameters: {
      title: { type: 'string', required: true, description: 'Poll question or title.' },
      options: { type: 'array', items: { type: 'string' }, required: true, description: '2-10 unique option labels.' },
      multi_select: { type: 'boolean', description: 'Allow more than one selection (default false = single-choice).' },
      max_selections: { type: 'number', description: 'Multi-choice cap between 2 and the option count (optional).' },
      threshold_rule: { type: 'string', description: 'Adoption rule at close: majority (default), gt (absolute vote count) or percent (1-100 share of voters).' },
      threshold_value: { type: 'number', description: 'Required for gt/percent: absolute votes for gt, percent 1-100 for percent.' },
      quorum: { type: 'number', description: 'Minimum ballots before any option can be adopted (default 1).' },
      anonymous: { type: 'boolean', description: 'Hide voter names in read results; ballots stay auditable in team state.' },
      description: { type: 'string', description: 'Optional context shown with the poll.' },
      duration_minutes: { type: 'number', description: 'Optional auto-close deadline in minutes from now.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          poll_id: { type: 'string', required: true },
          title: { type: 'string', required: true },
          multi_select: { type: 'boolean', required: true },
          options: { type: 'array', items: { type: 'string' }, required: true },
          threshold_rule: { type: 'string', required: true },
          threshold_value: { type: 'number' },
          quorum: { type: 'number', required: true },
          anonymous: { type: 'boolean' },
          closes_at: { type: 'number' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Poll ${value.poll_id} created: “${value.title}” (${value.multi_select ? 'multi-choice' : 'single-choice'}; options ${value.options.join(' / ')}; rule ${value.threshold_rule}; quorum ${value.quorum}${value.anonymous === true ? '; anonymous' : ''})`
          + `${value.closes_at === undefined ? '' : `, closes ${new Date(value.closes_at).toISOString()}`}. Participants: deers_team_vote_cast; results: deers_team_vote_read.`,
      }],
    },
    async execute(args, exec) {
      return withCallerTeam(config, exec, async ({ team, identity, stateRoot }) => {
        if (identity.kind !== 'captain') throw new Error('only the captain may create a poll')
        const rule = args.threshold_rule
        if (rule !== undefined && rule !== 'majority' && rule !== 'gt' && rule !== 'percent') {
          throw new Error('threshold_rule must be majority, gt or percent')
        }
        const now = Date.now()
        const poll = createPoll(team, {
          author: CAPTAIN_KEY,
          title: args.title,
          description: args.description,
          options: args.options,
          multiSelect: args.multi_select === true,
          maxSelections: args.max_selections,
          thresholdRule: rule,
          thresholdValue: args.threshold_value,
          quorum: args.quorum,
          anonymous: args.anonymous === true,
          closesAt: args.duration_minutes === undefined || args.duration_minutes <= 0
            ? undefined
            : now + Math.trunc(args.duration_minutes) * 60_000,
          now,
        })
        await writeTeam(stateRoot, team)
        return {
          poll_id: poll.id,
          title: poll.title,
          multi_select: poll.multiSelect,
          options: poll.options.map((option) => `${option.id}: ${option.label}`),
          threshold_rule: poll.thresholdRule ?? 'majority',
          ...poll.thresholdValue === undefined ? {} : { threshold_value: poll.thresholdValue },
          quorum: poll.quorum ?? 1,
          ...poll.anonymous === true ? { anonymous: true } : {},
          ...poll.closesAt === undefined ? {} : { closes_at: poll.closesAt },
        }
      })
    },
  })

  const cast = defineTool({
    name: 'deers_team_vote_cast',
    description: 'Cast, change or clear your ballot in a team poll. Single-choice polls accept exactly one option id; multi-choice polls accept up to their cap. Pass an empty option_ids array to withdraw your ballot. Read poll ids and option ids with deers_team_vote_read.',
    parameters: {
      poll_id: { type: 'string', required: true, description: 'Poll id (for example poll-1).' },
      option_ids: { type: 'array', items: { type: 'string' }, required: true, description: 'Option ids (for example ["o1"] or ["o1","o3"]); [] clears your ballot.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          poll_id: { type: 'string', required: true },
          selected: { type: 'array', items: { type: 'string' }, required: true },
          total_voters: { type: 'number', required: true },
          revision: { type: 'number', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.selected.length === 0
          ? `Ballot cleared on ${value.poll_id} (revision ${value.revision}; ${value.total_voters} voters total).`
          : `Ballot recorded on ${value.poll_id}: ${value.selected.join(', ')} (revision ${value.revision}; ${value.total_voters} voters total).`,
      }],
    },
    async execute(args, exec) {
      return withCallerTeam(config, exec, async ({ team, identity, stateRoot }) => {
        const result = castPollVote(team, {
          pollId: args.poll_id,
          voter: identity.name,
          voterType: identity.kind,
          optionIds: args.option_ids,
        })
        await writeTeam(stateRoot, team)
        return {
          poll_id: result.poll.id,
          selected: result.selected,
          total_voters: Object.keys(result.poll.votes ?? {}).length,
          revision: result.revision,
        }
      })
    },
  })

  const read = defineTool({
    name: 'deers_team_vote_read',
    description: 'Read team polls with per-option tallies, voter names and your own ballot. Newest first; filter by status (open/closed/expired) or read one poll by id. Works for every participant.',
    parameters: {
      poll_id: { type: 'string', description: 'Read only this poll id.' },
      status: { type: 'string', description: 'Filter: open, closed or expired.' },
      limit: { type: 'number', description: 'How many latest polls to return (1-50, default 20).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          team_id: { type: 'string', required: true },
          summary: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.summary }],
    },
    async execute(args, exec) {
      return withCallerTeam(config, exec, async ({ team, identity }) => {
        const status = args.status === 'open' || args.status === 'closed' || args.status === 'expired'
          ? args.status
          : undefined
        const now = Date.now()
        const pollId = typeof args.poll_id === 'string' ? args.poll_id.trim() : ''
        if (pollId !== '') {
          const poll = pollsOf(team).polls.find((candidate) => candidate.id === pollId)
          if (poll === undefined) throw new Error(`no poll "${pollId}" in team "${team.name}"`)
          const rows = readPolls(team, { viewer: identity.name, status, now }).rows
            .filter((row) => row.id === pollId)
          return { team_id: team.id, summary: renderPolls(rows, rows.length, identity.name) }
        }
        const { rows, total } = readPolls(team, {
          viewer: identity.name,
          status,
          limit: typeof args.limit === 'number' ? args.limit : 20,
          now,
        })
        return { team_id: team.id, summary: renderPolls(rows, total, identity.name) }
      })
    },
  })

  const close = defineTool({
    name: 'deers_team_vote_close',
    description: 'Close a team poll and freeze its decision (captain only). The close evaluates every ballot against the poll threshold and quorum, records adopted options and a summary, and rejects further ballots. Closing is idempotent.',
    parameters: {
      poll_id: { type: 'string', required: true, description: 'Poll id to close.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          poll_id: { type: 'string', required: true },
          status: { type: 'string', required: true },
          total_voters: { type: 'number', required: true },
          adopted: { type: 'array', items: { type: 'string' }, required: true },
          insufficient_quorum: { type: 'boolean', required: true },
          summary: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Poll ${value.poll_id} is now ${value.status} with ${value.total_voters} voters. `
          + `${value.adopted.length === 0 ? 'No option adopted' : `Adopted ${value.adopted.join(', ')}`}`
          + `${value.insufficient_quorum ? ' (quorum not met)' : ''}. ${value.summary}`,
      }],
    },
    async execute(args, exec) {
      return withCallerTeam(config, exec, async ({ team, identity, stateRoot }) => {
        if (identity.kind !== 'captain') throw new Error('only the captain may close a poll')
        const poll = closePoll(team, args.poll_id, { closedBy: CAPTAIN_KEY })
        await writeTeam(stateRoot, team)
        const decision = poll.decision
        return {
          poll_id: poll.id,
          status: poll.status,
          total_voters: decision?.totalVoters ?? Object.keys(poll.votes ?? {}).length,
          adopted: decision?.adoptedOptionIds ?? [],
          insufficient_quorum: decision?.insufficientQuorum ?? false,
          summary: decision?.summary ?? '',
        }
      })
    },
  })

  return [create, cast, read, close]
}
