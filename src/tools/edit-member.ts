/**
 * `deers_team_edit_member` — granular per-member dossier editing during the
 * staged planning phase (design spec §8).
 *
 * A staged member's dossier is `{ name, persona, description, modelRoute,
 * skills }` (spec §8.1). This tool applies a partial patch to exactly one
 * member of the caller's own team while `team.phase === 'staged'`; after
 * approval the dossier is frozen and every call fails with the `TEAM_FROZEN`
 * reason code. `persona`/`description`/`skills` are stored on the member
 * record for the spawn-time persona injection (spec §10.2, a later M0 task);
 * `modelRoute` resolves through the same member LLM selection path as
 * `deers_team_add_member` / `deers_team_edit_plan`, so an invalid route fails
 * loudly before it can reach a child spawn.
 *
 * `skills[]` entries are validated against the host skill catalog
 * (`ctx.skills`, made visible by the plugin's `'skills'` inject); an unknown
 * name fails with the `UNKNOWN_SKILL` reason code and nothing is persisted.
 *
 * @module deers-dsh-agent-team/tools/edit-member
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { join } from 'node:path'
import { resolveMemberLlmSelection } from '../members.ts'
import { readTeam, withTeamLock, writeTeam } from '../state.ts'
import type { ToolsConfig } from '../tools.ts'
import type { TeamMember } from '../types.ts'

/**
 * Structural view of the host skill registry. Kept local (instead of a hard
 * `@deepseek-ai/dsh-skill` dependency) so the plugin keeps its optional-peer
 * surface across the supported harness versions; the shape mirrors the
 * lookup the host `skill` tool itself performs.
 */
interface HostSkillCatalog {
  list(options?: {
    cwd?: string | undefined
    signal?: AbortSignal | undefined
    /** Viewing scope (the calling agent), mirroring the host skill tool. */
    scope?: unknown
  }): Promise<readonly { readonly name: string }[]>
}

/** The calling agent, or a loud failure for non-agent callers. */
function requireCaptain(exec: ToolRunContext): Agent {
  if (!exec.agent) {
    throw new Error('deers_team tools require a calling agent (exec.agent was undefined)')
  }
  return exec.agent
}

/** The captain's workspace directory (team state root parent). */
function workspaceOf(agent: Agent): string {
  return agent.session.header.cwd ?? process.cwd()
}

/** Process-local lock key scoped by workspace state root and team id. */
function teamLockKey(stateRoot: string, teamId: string): string {
  return `team:${stateRoot}:${teamId}`
}

/** Trim a string patch field; blank input clears the stored optional field. */
function trimmedOrCleared(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed === undefined || trimmed === '' ? undefined : trimmed
}

/**
 * Validate a `skills[]` patch against the host skill catalog.
 * Names are trimmed and de-duplicated in request order; an empty array skips
 * discovery entirely (clearing the member's skills). The first unknown name
 * fails with the `UNKNOWN_SKILL` reason code before anything is persisted.
 * `captain` is only the catalog viewing scope and may be absent on surfaces
 * without a live captain session (the Web UI PATCH route).
 */
async function validatedSkills(
  ctx: Context,
  captain: Agent | undefined,
  workspace: string,
  requested: readonly string[],
  signal: AbortSignal,
): Promise<string[]> {
  const names: string[] = []
  for (const entry of requested) {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new Error('every skills[] entry must be a non-empty string')
    }
    const name = entry.trim()
    if (!names.includes(name)) names.push(name)
  }
  if (names.length === 0) return []
  const catalog = (ctx as Context & { skills?: HostSkillCatalog }).skills
  if (catalog === undefined || typeof catalog.list !== 'function') {
    throw new Error('the host skill catalog is unavailable (ctx.skills is not registered in this composition)')
  }
  const known = new Set((await catalog.list({ cwd: workspace, signal, scope: captain })).map((skill) => skill.name))
  for (const name of names) {
    if (!known.has(name)) {
      throw new Error(`UNKNOWN_SKILL: skill "${name}" is not in the catalog`)
    }
  }
  return names
}

/**
 * Partial member-dossier patch; every field is optional and only present
 * fields are applied. Shared by `deers_team_edit_member` and the Web UI
 * `PATCH /api/deers-agent-team/teams/:id/members/:name` route.
 */
export interface MemberDossierPatch {
  persona?: string
  description?: string
  modelRoute?: { provider?: string; model?: string; reasoningEffort?: string }
  skills?: string[]
}

/**
 * Apply one member dossier patch inside the team lock (spec §8).
 *
 * The staged-only, captain-authorized editing path shared by the
 * `deers_team_edit_member` tool (the caller is the live captain agent) and the
 * Web UI PATCH route (the authenticated browser operates on the team's own
 * captain authority; the live captain agent is resolved for route resolution).
 *
 * @param options.ctx - plugin context (skill catalog + llm seam).
 * @param options.workspace - the team's workspace directory (skill catalog cwd).
 * @param options.stateRoot - resolved absolute state root.
 * @param options.teamId - the team's stable id.
 * @param options.memberName - exact member name in the staged roster.
 * @param options.patch - partial dossier patch.
 * @param options.actingSessionId - session id claiming captain authority; must
 *   equal the team's durable `captainSessionId`.
 * @param options.captain - live captain agent; required for `modelRoute`
 *   patches (route resolution reads the captain's session), used as the skill
 *   catalog scope otherwise.
 * @param options.signal - caller cancellation.
 * @returns the updated member snapshot.
 */
export async function applyMemberDossierPatch(options: {
  ctx: Context
  workspace: string
  stateRoot: string
  teamId: string
  memberName: string
  patch: MemberDossierPatch
  actingSessionId: string
  captain: Agent | undefined
  signal: AbortSignal | undefined
}): Promise<TeamMember> {
  const memberName = options.memberName.trim()
  if (memberName === '') throw new Error('memberName must be a non-empty member name')

  return await withTeamLock(teamLockKey(options.stateRoot, options.teamId), async (): Promise<TeamMember> => {
    const fresh = await readTeam(options.stateRoot, options.teamId)
    if (fresh === undefined) throw new Error(`team "${options.teamId}" is no longer active`)
    if (fresh.captainSessionId !== options.actingSessionId) {
      throw new Error(`only the captain of team "${fresh.name}" may perform this operation`)
    }
    if (fresh.phase !== 'staged') {
      throw new Error('TEAM_FROZEN: member editing is only allowed during the staged planning phase')
    }
    if (fresh.halted === true) throw new Error(`team "${fresh.name}" is halted, not awaiting plan approval`)
    const target = fresh.members.find((candidate) => candidate.name === memberName && candidate.status !== 'removed')
    if (target === undefined) {
      throw new Error(`no active member named "${memberName}" in team "${fresh.name}"`)
    }
    if (target.id !== '') throw new Error(`staged member "${target.name}" was already spawned`)

    const patch = options.patch
    if (patch.persona !== undefined) {
      const persona = trimmedOrCleared(patch.persona)
      if (persona === undefined) delete target.persona
      else target.persona = persona
    }
    if (patch.description !== undefined) {
      const description = trimmedOrCleared(patch.description)
      if (description === undefined) delete target.description
      else target.description = description
    }
    if (patch.modelRoute !== undefined) {
      const provider = patch.modelRoute.provider?.trim() ?? ''
      const model = patch.modelRoute.model?.trim() ?? ''
      if (provider === '' || model === '') {
        throw new Error('modelRoute requires a non-empty provider and model')
      }
      if (options.captain === undefined) {
        throw new Error('model route changes require the captain session to be attached')
      }
      const selection = await resolveMemberLlmSelection(options.ctx, options.captain, {
        provider,
        model,
        reasoningEffort: trimmedOrCleared(patch.modelRoute.reasoningEffort),
        fallback: target.fallback,
      }, options.signal ?? new AbortController().signal)
      target.provider = selection.provider
      target.model = selection.model
      target.reasoningEffort = selection.reasoningEffort
    }
    if (patch.skills !== undefined) {
      const skills = await validatedSkills(options.ctx, options.captain, options.workspace, patch.skills, options.signal ?? new AbortController().signal)
      if (skills.length === 0) delete target.skills
      else target.skills = skills
    }

    // A dossier edit re-arms the Web review surface, exactly like a staged
    // edit_plan batch: the user must approve the new draft.
    fresh.planReviewState = 'awaiting_review'
    options.signal?.throwIfAborted()
    await writeTeam(options.stateRoot, fresh)
    return { ...target }
  })
}

/**
 * Build the `deers_team_edit_member` tool definition.
 * @param ctx - the plugin context (the plugin's inject list includes
 *   `'skills'`, so `ctx.skills` is available for catalog validation).
 * @param config - resolved tool config (supplies the `stateDir`).
 * @returns a registry-ready tool definition.
 */
export function createEditMemberTool(ctx: Context, config: ToolsConfig): ToolDefinition {
  return defineTool({
    name: 'deers_team_edit_member',
    description: 'Edit one member\'s dossier (persona, description, modelRoute, skills) during the staged planning phase. Partial update: only the fields present in patch change, other members and other fields are untouched; an empty patch returns the member unchanged. skills[] names are validated against the host skill catalog (unknown names fail with UNKNOWN_SKILL and nothing is saved). modelRoute replaces the member\'s provider/model route (reasoningEffort optional; omitting it lets the target model pick its default). Once the plan is approved the roster is frozen: calls fail with TEAM_FROZEN — edit during the staged phase or via edit_plan for running-team task fixes.',
    parameters: {
      teamId: { type: 'string', required: true, description: 'Stable id of the caller\'s own team (the team directory under the state dir).' },
      memberName: { type: 'string', required: true, description: 'Exact member name in the staged roster.' },
      patch: {
        type: 'object',
        required: true,
        additionalProperties: false,
        description: 'Partial override; every field is optional and only present fields are applied.',
        properties: {
          persona: { type: 'string', description: 'Member persona text injected into that member\'s persona/execution prompt. Empty string clears it.' },
          description: { type: 'string', description: 'One-line description of what this member is for. Empty string clears it.' },
          modelRoute: {
            type: 'object',
            additionalProperties: false,
            description: 'Replacement provider/model route for this member.',
            properties: {
              provider: { type: 'string', required: true, description: 'LLM provider route name.' },
              model: { type: 'string', required: true, description: 'Provider-owned model id.' },
              reasoningEffort: { type: 'string', description: 'Optional reasoning effort override; "default" selects the target model\'s default.' },
            },
          },
          skills: { type: 'array', items: { type: 'string' }, description: 'Host skill names this member should use; validated against the host skill catalog. An empty array clears the list.' },
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          team_id: { type: 'string', required: true },
          member_name: { type: 'string', required: true },
          persona: { type: 'string' },
          description: { type: 'string' },
          provider: { type: 'string', required: true },
          model: { type: 'string', required: true },
          reasoning_effort: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          phase: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Member "${value.member_name}" dossier updated in staged plan ${value.team_id} `
          + `(${value.provider}/${value.model}${value.reasoning_effort === undefined ? '' : `, effort ${value.reasoning_effort}`}`
          + `${value.persona === undefined ? '' : '; persona set'}${value.description === undefined ? '' : '; description set'}`
          + `${value.skills === undefined ? '' : `; skills: ${value.skills.join(', ')}`}). `
          + 'No member was spawned and nothing was scheduled; the plan still awaits approval.',
      }],
    },
    async execute(args, exec) {
      const captain = requireCaptain(exec)
      const workspace = workspaceOf(captain)
      const stateRoot = join(workspace, config.stateDir)

      const member = await applyMemberDossierPatch({
        ctx,
        workspace,
        stateRoot,
        teamId: args.teamId,
        memberName: args.memberName,
        patch: args.patch,
        actingSessionId: captain.id,
        captain,
        signal: exec.signal,
      })

      return {
        team_id: args.teamId,
        member_name: member.name,
        ...member.persona === undefined ? {} : { persona: member.persona },
        ...member.description === undefined ? {} : { description: member.description },
        provider: member.provider ?? '',
        model: member.model ?? '',
        ...member.reasoningEffort === undefined ? {} : { reasoning_effort: member.reasoningEffort },
        ...member.skills === undefined ? {} : { skills: [...member.skills] },
        phase: 'staged',
      }
    },
  })
}
