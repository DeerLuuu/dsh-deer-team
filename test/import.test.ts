import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ToolRunContext } from '@deepseek-ai/dsh-tools'
import { CURRENT_SCHEMA_VERSION, MigrationError } from '../src/migrations/index.ts'
import { readTeam } from '../src/state.ts'
import type { ToolsConfig } from '../src/tools.ts'
import { createImportTool } from '../src/tools/import.ts'

/** A realistic legacy (pre-versioning, no `schemaVersion`) archived record. */
function legacyTeamJson(): Record<string, unknown> {
  return {
    name: 'deerszero-baseline',
    id: 'deerszero-baseline',
    description: 'imported archive',
    captainSessionId: 'session-legacy-captain',
    createdAt: 1_700_000_000_000,
    members: [
      { id: 'session-member-a', name: 'alpha', joinedAt: 1, status: 'idle' },
      { id: '', name: 'beta', joinedAt: 2, status: 'working' },
    ],
    tasks: [
      { id: 't1', subject: 'first', status: 'completed', dependencies: [], createdAt: 1, updatedAt: 1, output: 'done' },
      { id: 't2', subject: 'second', status: 'pending', dependencies: ['t1'], createdAt: 2, updatedAt: 2 },
    ],
    taskSeq: 2,
  }
}

const config: ToolsConfig = {
  stateDir: '.deers-agent-team',
  memberProvider: 'spawn',
  maxMembers: 8,
  profiles: {},
}

function execFor(workspace: string): ToolRunContext {
  return {
    agent: { id: 'session-import-test', session: { header: { cwd: workspace } } },
    signal: new AbortController().signal,
  } as unknown as ToolRunContext
}

interface ImportResult {
  imported: boolean
  teamId: string
  memberCount: number
  taskCount: number
}

/** Materialize the archive fixture inside a fresh workspace; returns its path. */
async function seedArchive(workspace: string, payload: Record<string, unknown>): Promise<string> {
  const archive = join(workspace, '.agent-teams', 'archive', 'deerszero-baseline')
  await mkdir(archive, { recursive: true })
  await writeFile(join(archive, 'team.json'), JSON.stringify(payload, null, 2), 'utf8')
  return archive
}

async function importFrom(workspace: string, sourceDir: string): Promise<ImportResult> {
  const tool = createImportTool({} as unknown as Context, config)
  return await tool.execute({ sourceDir }, execFor(workspace)) as unknown as ImportResult
}

describe('deers_team_import', () => {
  it('imports a legacy v0 archive, creating the team dir with schemaVersion 1', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-import-ok-'))
    try {
      const archive = await seedArchive(workspace, legacyTeamJson())
      const result = await importFrom(workspace, archive)

      expect(result).toEqual({
        imported: true,
        teamId: 'deerszero-baseline',
        memberCount: 2,
        taskCount: 2,
      })

      const teamDir = join(workspace, '.deers-agent-team', 'deerszero-baseline')
      const teamJsonPath = join(teamDir, 'team.json')
      expect((await stat(teamJsonPath)).isFile()).toBe(true)
      expect((await stat(join(teamDir, 'inbox'))).isDirectory()).toBe(true)

      const written: Record<string, unknown> = JSON.parse(await readFile(teamJsonPath, 'utf8'))
      expect(written['schemaVersion']).toBe(1)
      expect(written['schemaVersion']).toBe(CURRENT_SCHEMA_VERSION)
      // Legacy content survives the import untouched.
      expect(written['name']).toBe('deerszero-baseline')
      expect(written['captainSessionId']).toBe('session-legacy-captain')

      // The archived source is left exactly as it was (still v0 on disk).
      const source: Record<string, unknown> = JSON.parse(await readFile(join(archive, 'team.json'), 'utf8'))
      expect(source['schemaVersion']).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('throws a clear error when the source directory does not exist', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-import-missing-'))
    try {
      await expect(importFrom(workspace, join(workspace, 'no-such-archive')))
        .rejects.toThrow(/does not exist/)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('throws when team.json is missing from the source directory', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-import-empty-'))
    try {
      const empty = join(workspace, 'empty-archive')
      await mkdir(empty, { recursive: true })
      await expect(importFrom(workspace, empty)).rejects.toThrow(/no team\.json/)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('propagates migration errors for archives from a newer build', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-import-newer-'))
    try {
      const archive = await seedArchive(workspace, { ...legacyTeamJson(), schemaVersion: 99 })
      await expect(importFrom(workspace, archive)).rejects.toThrow(MigrationError)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('refuses to overwrite an existing team with the same id', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-import-collide-'))
    try {
      const archive = await seedArchive(workspace, legacyTeamJson())
      await importFrom(workspace, archive)
      await expect(importFrom(workspace, archive)).rejects.toThrow(/already exists/)
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('round-trips: the imported team reads back through readTeam', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'deers-import-roundtrip-'))
    try {
      const archive = await seedArchive(workspace, legacyTeamJson())
      await importFrom(workspace, archive)

      const stateRoot = join(workspace, '.deers-agent-team')
      const team = await readTeam(stateRoot, 'deerszero-baseline')
      expect(team).toBeDefined()
      expect(team?.id).toBe('deerszero-baseline')
      expect(team?.name).toBe('deerszero-baseline')
      expect(team?.members.map((member) => member.name)).toEqual(['alpha', 'beta'])
      expect(team?.tasks.map((task) => task.id)).toEqual(['t1', 't2'])
      expect(team?.tasks[1]?.dependencies).toEqual(['t1'])
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})
