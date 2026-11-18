/**
 * `deers_team_import` — bring an archived legacy team directory into this
 * plugin's state root.
 *
 * The source is an old-format team directory (for example
 * `<workspace>/.agent-teams/archive/<teamId>` left behind by the pre-fork
 * `@nanmicoder/dsh-agent-teams` plugin). The durable record is read, upgraded
 * to the current schema with {@link migrate}, validated into a
 * {@link TeamState} with `coerceTeamState`, and written under
 * `<workspace>/<stateDir>/<teamId>/team.json` through the same
 * `createTeamDir` path every live team uses — so the imported team is
 * immediately readable by `readTeam`, the activity snapshot, and the Web
 * surface. The archived source directory is never modified.
 * @module deers-dsh-agent-team/tools/import
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { migrate } from '../migrations/index.ts'
import { coerceTeamState, createTeamDir, readTeam, sanitizeKey, withTeamLock } from '../state.ts'
import type { ToolsConfig } from '../tools.ts'

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

/** Resolved absolute state root. */
function stateRootOf(workspace: string, config: ToolsConfig): string {
  return join(workspace, config.stateDir)
}

/** Process-local lock key scoped by workspace state root and team id. */
function teamLockKey(stateRoot: string, teamId: string): string {
  return `team:${stateRoot}:${teamId}`
}

/** Remove the optional UTF-8 BOM some editors prepend to JSON text. */
function stripLeadingBom(value: string): string {
  return value.charCodeAt(0) === 0xFEFF ? value.slice(1) : value
}

/**
 * Build the `deers_team_import` tool definition.
 * @param ctx - the plugin context (reserved for diagnostics; the tool itself
 *   is pure filesystem work on the caller's workspace).
 * @param config - resolved tool config (supplies the destination `stateDir`).
 * @returns a registry-ready tool definition.
 */
export function createImportTool(ctx: Context, config: ToolsConfig): ToolDefinition {
  // `ctx` keeps the factory signature stable across tools; diagnostics stay in
  // the thrown errors so the model sees one actionable message per failure.
  void ctx
  return defineTool({
    name: 'deers_team_import',
    description: 'Import an archived old-format team directory (e.g. a pre-fork .agent-teams archive) into this plugin\'s state root. Reads <sourceDir>/team.json, migrates it to the current schema, validates it, and writes it as a live team under <workspace>/<stateDir>/<teamId>/. The source directory is not modified. Fails loudly when the source directory or team.json is missing, when the payload cannot be migrated, or when a team with the same id already exists.',
    parameters: {
      sourceDir: {
        type: 'string',
        required: true,
        description: 'Absolute path to the archived team directory containing team.json (e.g. <workspace>/.agent-teams/archive/deerszero-baseline).',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          imported: { type: 'boolean', required: true },
          teamId: { type: 'string', required: true },
          memberCount: { type: 'number', required: true },
          taskCount: { type: 'number', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Imported archived team "${value.teamId}" into the current workspace's state root (${value.memberCount} members, ${value.taskCount} tasks). The imported record is a snapshot of the legacy team; its captain session belongs to the old workspace.`,
      }],
    },
    async execute(args, exec) {
      const captain = requireCaptain(exec)
      const workspace = workspaceOf(captain)
      const stateRoot = stateRootOf(workspace, config)
      const sourceDir = args.sourceDir.trim()
      if (sourceDir === '') {
        throw new Error('sourceDir must be a non-empty absolute path to the archived team directory')
      }

      let sourceStat
      try {
        sourceStat = await stat(sourceDir)
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(`import failed: source directory "${sourceDir}" does not exist`)
        }
        throw error
      }
      if (!sourceStat.isDirectory()) {
        throw new Error(`import failed: source "${sourceDir}" is not a directory`)
      }

      let raw: string
      try {
        raw = await readFile(join(sourceDir, 'team.json'), 'utf8')
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(`import failed: no team.json in "${sourceDir}" — an archived team directory must contain team.json`)
        }
        throw error
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(stripLeadingBom(raw))
      } catch (error: unknown) {
        throw new Error(`import failed: team.json in "${sourceDir}" is not valid JSON (${String(error)})`)
      }

      // Upgrade the legacy payload to the current schema. MigrationError
      // (corrupt or newer-version payloads) propagates on purpose: an
      // unreadable archive must fail loudly, not import a degraded record.
      const migrated = migrate(parsed)

      // Accept the record's own identity (falling back to its display name)
      // as the destination team id, normalized exactly like deers_team_create
      // normalizes a team name. Rewriting keeps the `id === directory name`
      // invariant readTeam depends on, even for dirty legacy ids.
      const rawId = typeof migrated['id'] === 'string' && migrated['id'].trim() !== ''
        ? migrated['id']
        : typeof migrated['name'] === 'string' ? migrated['name'] : ''
      const teamId = sanitizeKey(rawId)
      if (teamId === '') {
        throw new Error(`import failed: archived team state in "${sourceDir}" has no usable id or name`)
      }
      const normalized: Record<string, unknown> = migrated['id'] === teamId ? migrated : { ...migrated, id: teamId }
      const team = coerceTeamState(normalized, teamId)
      if (team === undefined) {
        throw new Error(`import failed: migrated team state in "${sourceDir}" is not a valid AgentTeams record`)
      }

      exec.signal.throwIfAborted()
      await withTeamLock(teamLockKey(stateRoot, teamId), async () => {
        const existing = await readTeam(stateRoot, teamId)
        if (existing !== undefined) {
          throw new Error(`import failed: team id "${teamId}" already exists under ${stateRoot} — remove or archive it before importing`)
        }
        await createTeamDir(stateRoot, team)
      })

      return {
        imported: true,
        teamId: team.id,
        memberCount: team.members.length,
        taskCount: team.tasks.length,
      }
    },
  })
}
