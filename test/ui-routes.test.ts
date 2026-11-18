import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { CURRENT_SCHEMA_VERSION } from '../src/migrations/index.ts'
import { readTeam } from '../src/state.ts'
import { createUiRequestHandler, registerUiRoutes, uiIndexHtml, type UiRoutesDeps, type UiWorkspace } from '../src/web/ui-routes.ts'
import type { WebRouteHost } from '../src/web-routes.ts'
import type { TeamState } from '../src/types.ts'

function fakeCtx(): Context {
  return {
    agents: { get: () => undefined },
    logger: { warn: () => undefined, debug: () => undefined },
    // Host skill catalog seam (plugin inject 'skills') for skills[] patches.
    skills: { list: async () => [{ name: 'test-driven-development' }, { name: 'systematic-debugging' }] },
  } as unknown as Context
}

function team(overrides: Partial<TeamState> = {}): TeamState {
  const now = 1_700_000_000_000
  return {
    name: 'ui-fixture',
    id: 'ui-fixture',
    description: 'web ui fixture',
    captainSessionId: 'session-ui-test',
    createdAt: now,
    phase: 'staged',
    planReviewState: 'awaiting_review',
    members: [
      { id: '', name: 'alice', role: 'researcher', provider: 'deepseek', model: 'deepseek-chat', joinedAt: 1, status: 'idle' },
      { id: '', name: 'bob', role: 'engineer', provider: 'deepseek', model: 'deepseek-chat', joinedAt: 2, status: 'idle' },
    ],
    tasks: [
      { id: 't1', subject: 'First', status: 'completed', assignee: 'alice', dependencies: [], attempt: 1, createdAt: now, updatedAt: now },
      { id: 't2', subject: 'Second', status: 'failed', assignee: 'bob', dependencies: ['t1'], attempt: 1, createdAt: now, updatedAt: now },
      { id: 't3', subject: 'Third', status: 'pending', dependencies: ['t2'], attempt: 0, createdAt: now, updatedAt: now },
    ],
    taskSeq: 3,
    ...overrides,
  }
}

async function seedWorkspace(): Promise<{ workspace: string; deps: UiRoutesDeps; handler: ReturnType<typeof createUiRequestHandler> }> {
  const workspace = await mkdtemp(join(tmpdir(), 'deers-ui-'))
  const stateRoot = join(workspace, '.deers-agent-team')
  for (const state of [team(), team({ name: 'ui-running', id: 'ui-running', phase: 'running', planReviewState: undefined })]) {
    const dir = join(stateRoot, state.id)
    await mkdir(join(dir, 'inbox'), { recursive: true })
    await writeFile(join(dir, 'team.json'), JSON.stringify({ ...state, schemaVersion: CURRENT_SCHEMA_VERSION }, null, 2), 'utf8')
  }
  const workspaces: UiWorkspace[] = [{ title: 'ws', path: workspace }]
  const deps: UiRoutesDeps = { ctx: fakeCtx(), stateDir: '.deers-agent-team', workspaces: () => workspaces }
  return { workspace, deps, handler: createUiRequestHandler(deps) }
}

describe('AgentTeams web UI API', () => {
  it('GET /api/deers-agent-team/teams returns validated summaries', async () => {
    const { workspace, handler } = await seedWorkspace()
    try {
      const result = await handler('GET', '/api/deers-agent-team/teams', new URLSearchParams(), undefined)
      expect(result.status).toBe(200)
      const teams = (result.body as { teams: Array<Record<string, unknown>> }).teams
      expect(teams).toHaveLength(2)
      const summary = teams.find((row) => row['id'] === 'ui-fixture')
      expect(summary).toMatchObject({
        id: 'ui-fixture',
        name: 'ui-fixture',
        phase: 'staged',
        workspace: 'ws',
        memberCount: 2,
        taskCount: 3,
        errorCount: 1,
      })
      expect(teams.find((row) => row['id'] === 'ui-running')).toMatchObject({ phase: 'running', errorCount: 1 })
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('GET /api/deers-agent-team/teams/:id returns the full team state', async () => {
    const { workspace, handler } = await seedWorkspace()
    try {
      const result = await handler('GET', '/api/deers-agent-team/teams/ui-fixture', new URLSearchParams(), undefined)
      expect(result.status).toBe(200)
      const body = result.body as Record<string, unknown>
      expect(body['phase']).toBe('staged')
      const members = body['members'] as Array<Record<string, unknown>>
      const tasks = body['tasks'] as Array<Record<string, unknown>>
      expect(members.map((member) => member['name'])).toEqual(['alice', 'bob'])
      const third = tasks.find((task) => task['id'] === 't3')
      expect(third).toMatchObject({ status: 'pending', dependencies: ['t2'] })
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('returns 404 for an unknown team and 404/409/405 for bad requests', async () => {
    const { workspace, handler } = await seedWorkspace()
    try {
      await expect(handler('GET', '/api/deers-agent-team/teams/nope', new URLSearchParams(), undefined))
        .resolves.toMatchObject({ status: 404 })
      await expect(handler('GET', '/api/deers-agent-team/other', new URLSearchParams(), undefined))
        .resolves.toMatchObject({ status: 404 })
      await expect(handler('DELETE', '/api/deers-agent-team/teams/ui-fixture', new URLSearchParams(), undefined))
        .resolves.toMatchObject({ status: 405 })
      await expect(handler('PATCH', '/api/deers-agent-team/teams/ui-fixture/members/carol', new URLSearchParams(), { persona: 'x' }))
        .resolves.toMatchObject({ status: 404 })
      await expect(handler('PATCH', '/api/deers-agent-team/teams/ui-running/members/alice', new URLSearchParams(), { persona: 'x' }))
        .resolves.toMatchObject({ status: 409, body: { error: 'TEAM_FROZEN: member editing is only allowed during the staged planning phase' } })
      await expect(handler('PATCH', '/api/deers-agent-team/teams/ui-fixture/members/alice', new URLSearchParams(), {}))
        .resolves.toMatchObject({ status: 400 })
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })

  it('PATCH member edits the dossier in the temp workspace', async () => {
    const { workspace, handler } = await seedWorkspace()
    try {
      const result = await handler('PATCH', '/api/deers-agent-team/teams/ui-fixture/members/alice', new URLSearchParams(), {
        persona: 'Careful web-edited persona',
        skills: ['test-driven-development'],
      })
      expect(result.status).toBe(200)
      const member = (result.body as { member: Record<string, unknown> }).member
      expect(member).toMatchObject({ name: 'alice', persona: 'Careful web-edited persona', skills: ['test-driven-development'] })

      const team = await readTeam(join(workspace, '.deers-agent-team'), 'ui-fixture')
      const alice = team?.members.find((candidate) => candidate.name === 'alice')
      expect(alice?.persona).toBe('Careful web-edited persona')
      expect(alice?.skills).toEqual(['test-driven-development'])
      // The dossier edit re-arms the staged review surface, like the tool.
      expect(team?.planReviewState).toBe('awaiting_review')
      // Bob untouched.
      expect(team?.members.find((candidate) => candidate.name === 'bob')?.persona).toBeUndefined()
    } finally {
      await rm(workspace, { recursive: true, force: true })
    }
  })
})

describe('AgentTeams web UI page + registration', () => {
  it('registers the API prefix and both page paths on the web server', () => {
    const routes: Array<{ kind: string; path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }> = []
    const host: WebRouteHost = {
      register(route) {
        routes.push(route as typeof routes[number])
        return () => undefined
      },
    }
    const deps: UiRoutesDeps = { ctx: fakeCtx(), stateDir: '.deers-agent-team', workspaces: () => [] }
    const dispose = registerUiRoutes(host, deps)
    expect(routes.map((route) => [route.kind, route.path]).sort()).toEqual([
      ['exact', '/deers-agent-team'],
      ['exact', '/deers-agent-team/'],
      ['prefix', '/api/deers-agent-team'],
    ].sort())
    dispose()
  })

  it('the page handler serves the self-contained panel HTML', async () => {
    const routes: Array<{ kind: string; path: string; handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> }> = []
    const host: WebRouteHost = {
      register(route) {
        routes.push(route as typeof routes[number])
        return () => undefined
      },
    }
    const deps: UiRoutesDeps = { ctx: fakeCtx(), stateDir: '.deers-agent-team', workspaces: () => [] }
    registerUiRoutes(host, deps)
    const page = routes.find((route) => route.path === '/deers-agent-team/')
    expect(page).toBeDefined()

    let status: number | undefined
    let contentType: string | undefined
    let body = ''
    const res = {
      writeHead(code: number, headers: Record<string, string>): void {
        status = code
        contentType = headers['content-type']
      },
      end(data: string): void { body = data },
    }
    await page!.handler({ url: '/deers-agent-team/' } as unknown as IncomingMessage, res as unknown as ServerResponse)
    expect(status).toBe(200)
    expect(contentType).toContain('text/html')
    expect(body).toContain('<!DOCTYPE html>')
    // Mermaid from CDN for the DAG.
    expect(body).toContain('mermaid.min.js')
    // The page fetches the teams API on load.
    expect(body).toContain("var API = '/api/deers-agent-team'")
    expect(body).toContain("api(API + '/teams')")
    // Inline styles and vanilla JS only: no external stylesheet link tags.
    expect(body).not.toContain('<link')
    // Shared blackboard: the human can read the feed and post/vote from the page.
    expect(body).toContain('<h2>Blackboard</h2>')
    expect(body).toContain('id="board-form"')
    expect(body).toContain('id="board-author-filter"')
    expect(body).toContain('id="board-kind-filter"')
    expect(body).toContain('id="board-cleanup"')
    expect(body).toContain("'/plugins/deers-dsh-agent-team/blackboard'")
    // Poll records: the standalone panel renders the same durable polls.
    expect(body).toContain('<h2>Polls</h2>')
    expect(body).toContain('id="polls"')
    expect(body).toContain('function renderPolls()')
    // The inline page script must stay syntactically valid after template edits.
    const inlineScript = [...body.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n')
    expect(inlineScript.length).toBeGreaterThan(100)
    expect(() => new Function(inlineScript)).not.toThrow()
  })
})
