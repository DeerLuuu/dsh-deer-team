/**
 * Deterministic Web UI for AgentTeams (spec: M0-T7 panel): a self-contained
 * operations page plus the JSON API it consumes.
 *
 * Routes (all behind `authenticatedWebRoutes`, so they inherit the browser
 * authentication fence of the existing plugin surfaces):
 * - `GET  /deers-agent-team/` — the single-page panel (inline CSS, vanilla JS,
 *   Mermaid.js from CDN for the task DAG).
 * - `GET  /api/deers-agent-team/teams` — summaries for every team across the
 *   host's registered workspaces.
 * - `GET  /api/deers-agent-team/teams/:id` — one full team record.
 * - `PATCH /api/deers-agent-team/teams/:id/members/:name` — staged-phase
 *   member dossier edit, sharing the exact `deers_team_edit_member` logic.
 *
 * The handler logic is factored into {@link createUiRequestHandler} so tests
 * exercise request/response semantics without a live HTTP server.
 *
 * @module deers-dsh-agent-team/web/ui-routes
 */

import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { applyMemberDossierPatch, type MemberDossierPatch } from '../tools/edit-member.ts'
import { readTeam } from '../state.ts'
import type { TeamState } from '../types.ts'
import { readJsonRequest, RequestBodyError, type WebRouteHost } from '../web-routes.ts'

const API_PREFIX = '/api/deers-agent-team'
const TEAMS_PREFIX = `${API_PREFIX}/teams/`

/** One workspace row the host workspace registry exposes. */
export interface UiWorkspace {
  readonly title: string
  readonly path: string
}

/** Construction dependencies for the UI routes. */
export interface UiRoutesDeps {
  /** Plugin context; resolves the live captain agent for PATCH routes. */
  readonly ctx: Context
  /** Team state directory name under each workspace. */
  readonly stateDir: string
  /** Registered workspaces, scanned for team state on every request. */
  readonly workspaces: () => readonly UiWorkspace[]
}

/** One handler result; serialized to JSON by the HTTP glue. */
export interface UiRouteResult {
  readonly status: number
  readonly body: unknown
}

/** Summary row of `GET /api/deers-agent-team/teams`. */
export interface UiTeamSummary {
  readonly id: string
  readonly name: string
  readonly phase: string
  readonly workspace: string
  readonly memberCount: number
  readonly taskCount: number
  readonly errorCount: number
  readonly error?: string
}

function ok(body: unknown): UiRouteResult {
  return { status: 200, body }
}

function fail(status: number, error: string): UiRouteResult {
  return { status, body: { error } }
}

function isEnoent(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT'
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Summary projection ("errorCount from validate": failed tasks, or 1 + reason when the record fails validation). */
function summarizeTeam(workspaceTitle: string, team: TeamState): UiTeamSummary {
  return {
    id: team.id,
    name: team.name,
    phase: team.phase ?? 'running',
    workspace: workspaceTitle,
    memberCount: team.members.filter((member) => member.status !== 'removed').length,
    taskCount: team.tasks.length,
    errorCount: team.tasks.filter((task) => task.status === 'failed').length,
  }
}

function invalidTeamSummary(workspaceTitle: string, teamId: string, error: unknown): UiTeamSummary {
  return {
    id: teamId,
    name: teamId,
    phase: 'invalid',
    workspace: workspaceTitle,
    memberCount: 0,
    taskCount: 0,
    errorCount: 1,
    error: errorText(error),
  }
}

async function listTeams(deps: UiRoutesDeps): Promise<UiRouteResult> {
  const teams: UiTeamSummary[] = []
  for (const workspace of deps.workspaces()) {
    const stateRoot = join(workspace.path, deps.stateDir)
    let entries
    try {
      entries = await readdir(stateRoot, { withFileTypes: true })
    } catch (error: unknown) {
      if (isEnoent(error)) continue
      return fail(500, `failed to scan workspace "${workspace.title}": ${errorText(error)}`)
    }
    for (const entry of entries) {
      // `archive/` holds deleted generations, not live teams.
      if (!entry.isDirectory() || entry.name === 'archive' || entry.name.startsWith('.')) continue
      try {
        const team = await readTeam(stateRoot, entry.name)
        if (team === undefined) teams.push(invalidTeamSummary(workspace.title, entry.name, new Error('team state failed validation')))
        else teams.push(summarizeTeam(workspace.title, team))
      } catch (error: unknown) {
        teams.push(invalidTeamSummary(workspace.title, entry.name, error))
      }
    }
  }
  return ok({ teams })
}

async function teamDetail(deps: UiRoutesDeps, workspaceFilter: string | undefined, teamId: string): Promise<UiRouteResult> {
  for (const workspace of deps.workspaces()) {
    if (workspaceFilter !== undefined && workspace.title !== workspaceFilter) continue
    const team = await readTeam(join(workspace.path, deps.stateDir), teamId).catch(() => undefined)
    if (team !== undefined) {
      return ok({ ...team, phase: team.phase ?? 'running', workspace: workspace.title })
    }
  }
  return fail(404, `team "${teamId}" not found`)
}

function parsePatchBody(body: unknown): { patch?: MemberDossierPatch; error?: string } {
  if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'request body must be a JSON object' }
  }
  const raw = body as Record<string, unknown>
  const patch: MemberDossierPatch = {}
  for (const field of ['persona', 'description'] as const) {
    const value = raw[field]
    if (value === undefined) continue
    if (typeof value !== 'string') return { error: `${field} must be a string` }
    patch[field] = value
  }
  const skills = raw['skills']
  if (skills !== undefined) {
    if (!Array.isArray(skills) || skills.some((skill) => typeof skill !== 'string')) {
      return { error: 'skills must be an array of strings' }
    }
    patch.skills = skills as string[]
  }
  const route = raw['modelRoute']
  if (route !== undefined) {
    if (typeof route !== 'object' || route === null || Array.isArray(route)) {
      return { error: 'modelRoute must be an object with provider and model' }
    }
    const record = route as Record<string, unknown>
    for (const field of ['provider', 'model', 'reasoningEffort'] as const) {
      if (record[field] !== undefined && typeof record[field] !== 'string') {
        return { error: `modelRoute.${field} must be a string` }
      }
    }
    patch.modelRoute = {
      provider: record['provider'] as string | undefined,
      model: record['model'] as string | undefined,
      ...record['reasoningEffort'] === undefined ? {} : { reasoningEffort: record['reasoningEffort'] as string },
    }
  }
  return { patch }
}

async function patchMember(deps: UiRoutesDeps, teamId: string, memberName: string, body: unknown): Promise<UiRouteResult> {
  const parsed = parsePatchBody(body)
  if (parsed.patch === undefined) return fail(400, parsed.error ?? 'invalid request body')
  const patch = parsed.patch
  if (patch.persona === undefined && patch.description === undefined
    && patch.modelRoute === undefined && patch.skills === undefined) {
    return fail(400, 'the patch is empty: provide persona, description, modelRoute, and/or skills')
  }
  for (const workspace of deps.workspaces()) {
    const stateRoot = join(workspace.path, deps.stateDir)
    const team = await readTeam(stateRoot, teamId).catch(() => undefined)
    if (team === undefined) continue
    const captain = deps.ctx.agents.get(team.captainSessionId as SessionId)
    try {
      const member = await applyMemberDossierPatch({
        ctx: deps.ctx,
        workspace: workspace.path,
        stateRoot,
        teamId,
        memberName,
        patch,
        // The authenticated browser operates with the team owner's authority.
        actingSessionId: team.captainSessionId,
        captain,
        signal: undefined,
      })
      return ok({
        ok: true,
        member: {
          name: member.name,
          persona: member.persona,
          description: member.description,
          provider: member.provider,
          model: member.model,
          reasoningEffort: member.reasoningEffort,
          skills: member.skills,
        },
      })
    } catch (error: unknown) {
      const message = errorText(error)
      return fail(message.includes('no active member named') ? 404 : 409, message)
    }
  }
  return fail(404, `team "${teamId}" not found`)
}

/**
 * The request dispatcher behind the HTTP routes. Pure with respect to the
 * deps: tests call it directly with a temp workspace, no server needed.
 */
export function createUiRequestHandler(
  deps: UiRoutesDeps,
): (method: string, pathname: string, query: URLSearchParams, body: unknown) => Promise<UiRouteResult> {
  return async (method, pathname, query, body) => {
    try {
      if (pathname === `${API_PREFIX}/teams` || pathname === TEAMS_PREFIX) {
        if (method !== 'GET' && method !== 'HEAD') return fail(405, 'method not allowed; use GET')
        return await listTeams(deps)
      }
      if (pathname.startsWith(TEAMS_PREFIX)) {
        const segments = pathname.slice(TEAMS_PREFIX.length).split('/').filter((segment) => segment !== '')
        if (segments.length === 1 && segments[0] !== undefined) {
          if (method !== 'GET' && method !== 'HEAD') return fail(405, 'method not allowed; use GET')
          return await teamDetail(deps, query.get('workspace') ?? undefined, decodeURIComponent(segments[0]))
        }
        const [teamId, kind, memberName] = segments
        if (segments.length === 3 && kind === 'members' && teamId !== undefined && memberName !== undefined) {
          if (method !== 'PATCH') return fail(405, 'method not allowed; use PATCH')
          return await patchMember(deps, decodeURIComponent(teamId), decodeURIComponent(memberName), body)
        }
      }
      return fail(404, 'not found')
    } catch (error: unknown) {
      return fail(500, errorText(error))
    }
  }
}

/**
 * The single-page panel: inline CSS, vanilla JS, Mermaid.js from CDN.
 * No framework, no external stylesheets.
 */
export function uiIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AgentTeams</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
<style>
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #0f1117; color: #e6e8ee; }
header { padding: 14px 20px; border-bottom: 1px solid #262a35; display: flex; align-items: baseline; gap: 12px; }
header h1 { font-size: 18px; margin: 0; }
header span { color: #8b93a7; font-size: 13px; }
main { display: grid; grid-template-columns: 280px 1fr; min-height: calc(100vh - 53px); }
aside { border-right: 1px solid #262a35; padding: 12px; overflow-y: auto; }
aside h2, .content h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #8b93a7; margin: 8px 4px; }
.team-item { display: block; width: 100%; text-align: left; background: transparent; color: inherit; border: 1px solid transparent; border-radius: 8px; padding: 10px 12px; margin: 2px 0; cursor: pointer; font: inherit; }
.team-item:hover { background: #191d27; }
.team-item.active { background: #1d2433; border-color: #3b82f6; }
.team-item .tid { font-weight: 600; }
.team-item .meta { color: #8b93a7; font-size: 12px; margin-top: 2px; }
.badge { display: inline-block; border-radius: 999px; padding: 1px 8px; font-size: 11px; background: #262a35; }
.badge.running { background: #14321f; color: #4ade80; }
.badge.staged { background: #33270e; color: #fbbf24; }
.badge.invalid { background: #3a1414; color: #f87171; }
.content { padding: 16px 22px; overflow-y: auto; }
.content section { margin-bottom: 26px; }
.panel { background: #14171f; border: 1px solid #262a35; border-radius: 10px; padding: 14px 16px; }
.error-text { color: #f87171; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #22262f; vertical-align: top; }
th { color: #8b93a7; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
.chip { display: inline-flex; align-items: center; gap: 6px; background: #262a35; border-radius: 999px; padding: 2px 10px; font-size: 12px; margin: 2px 4px 2px 0; }
.chip button { background: none; border: none; color: #8b93a7; cursor: pointer; font-size: 12px; padding: 0; }
.chip button:hover { color: #f87171; }
button.primary { background: #3b82f6; color: white; border: none; border-radius: 8px; padding: 8px 14px; font: inherit; cursor: pointer; }
button.primary:disabled { opacity: .5; cursor: default; }
button.subtle { background: #262a35; color: inherit; border: none; border-radius: 8px; padding: 6px 12px; font: inherit; cursor: pointer; }
button.subtle:hover { background: #31374a; }
#editor { border: none; border-radius: 12px; padding: 0; width: min(560px, 92vw); background: #14171f; color: inherit; }
#editor::backdrop { background: rgba(0,0,0,.55); }
#editor form { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
#editor h3 { margin: 0; font-size: 16px; }
#editor label { font-size: 12px; color: #8b93a7; display: flex; flex-direction: column; gap: 4px; }
#editor textarea, #editor select, #editor input[type="text"] { font: inherit; background: #0f1117; color: inherit; border: 1px solid #2c3242; border-radius: 8px; padding: 8px 10px; }
#editor textarea { min-height: 90px; resize: vertical; }
#editor .row { display: flex; gap: 10px; }
#editor .row label { flex: 1; }
#editor .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
#tag-input { flex: 1; background: transparent; border: none; color: inherit; font: inherit; outline: none; min-width: 120px; }
#skill-box { display: flex; flex-wrap: wrap; gap: 2px; background: #0f1117; border: 1px solid #2c3242; border-radius: 8px; padding: 6px 8px; cursor: text; }
#toast { position: fixed; bottom: 18px; right: 18px; padding: 10px 16px; border-radius: 10px; background: #1d2433; border: 1px solid #3b82f6; display: none; max-width: 60vw; }
#toast.error { border-color: #f87171; }
.empty { color: #8b93a7; padding: 18px 4px; }
#dag svg { max-width: 100%; height: auto; }
.legend { color: #8b93a7; font-size: 12px; margin-top: 8px; }
.board-list { list-style: none; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.board-entry { border: 1px solid #262a35; border-radius: 8px; padding: 8px 10px; background: #10131a; }
.board-meta { display: flex; align-items: baseline; gap: 8px; font-size: 13px; }
.board-time { margin-left: auto; color: #8b93a7; font-size: 11px; }
.board-content { margin-top: 4px; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; }
.board-votes { display: flex; gap: 6px; margin-top: 6px; }
.board-form { display: flex; flex-direction: column; gap: 8px; }
.board-form textarea { font: inherit; min-height: 80px; resize: vertical; background: #0f1117; color: inherit; border: 1px solid #2c3242; border-radius: 8px; padding: 8px 10px; }
.board-form .row { display: flex; align-items: center; gap: 10px; }
.board-form select { font: inherit; background: #0f1117; color: inherit; border: 1px solid #2c3242; border-radius: 8px; padding: 6px 8px; }
.poll-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.poll-entry { border: 1px solid #262a35; border-radius: 8px; padding: 8px 10px; background: #10131a; }
.poll-meta { display: flex; align-items: baseline; gap: 8px; font-size: 13px; }
.poll-time { margin-left: auto; color: #8b93a7; font-size: 11px; }
.poll-option { display: flex; justify-content: space-between; gap: 10px; margin-top: 4px; padding: 3px 6px; border-radius: 6px; background: #0f1117; font-size: 13px; }
.poll-option[data-chosen] { background: #14213d; }
.poll-decision { margin-top: 6px; padding: 5px 8px; border-left: 3px solid #3b82f6; background: #101a2e; border-radius: 6px; font-size: 12px; color: #c7d2fe; }
</style>
</head>
<body>
<header><h1>AgentTeams</h1><span>teams, tasks and member dossiers</span></header>
<main>
  <aside>
    <h2>Teams</h2>
    <div id="team-list"><div class="empty">Loading…</div></div>
  </aside>
  <div class="content" id="detail"><div class="empty">Select a team.</div></div>
</main>
<dialog id="editor">
  <form id="editor-form" method="dialog">
    <h3 id="editor-title">Edit member</h3>
    <label>Persona<textarea id="f-persona" placeholder="Guidance injected into this member's persona"></textarea></label>
    <div class="row">
      <label>Model route
        <select id="f-route"></select>
      </label>
    </div>
    <div class="row" id="custom-route" style="display:none">
      <label>Provider<input type="text" id="f-provider" placeholder="provider"></label>
      <label>Model<input type="text" id="f-model" placeholder="model"></label>
      <label>Effort<input type="text" id="f-effort" placeholder="optional"></label>
    </div>
    <label>Skills
      <div id="skill-box"><input id="tag-input" type="text" placeholder="Type a skill name and press Enter"></div>
    </label>
    <div class="actions">
      <button type="button" class="subtle" id="f-cancel">Cancel</button>
      <button type="submit" class="primary" id="f-save">Save</button>
    </div>
  </form>
</dialog>
<div id="toast"></div>
<script>
(function () {
  'use strict';
  var API = '/api/deers-agent-team';
  var state = { teams: [], team: null, editorMember: null, editorSkills: [] };
  if (window.mermaid) { try { window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' }); } catch (e) {} }

  function $(id) { return document.getElementById(id); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(message, isError) {
    var el = $('toast');
    el.textContent = message;
    el.className = isError ? 'error' : '';
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, isError ? 6000 : 3000);
  }
  function api(path, options) {
    return fetch(path, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error(body && body.error ? body.error : ('HTTP ' + res.status));
        return body;
      });
    });
  }

  function loadTeams() {
    return api(API + '/teams').then(function (body) {
      state.teams = body.teams || [];
      renderList();
    }).catch(function (error) {
      $('team-list').innerHTML = '<div class="empty error-text">' + esc(error.message) + '</div>';
    });
  }

  function renderList() {
    var host = $('team-list');
    if (!state.teams.length) { host.innerHTML = '<div class="empty">No teams found.</div>'; return; }
    host.innerHTML = '';
    state.teams.forEach(function (team) {
      var btn = document.createElement('button');
      btn.className = 'team-item' + (state.team && state.team.id === team.id ? ' active' : '');
      btn.innerHTML = '<div class="tid">' + esc(team.name) + '</div>'
        + '<div class="meta"><span class="badge ' + esc(team.phase) + '">' + esc(team.phase) + '</span> '
        + esc(team.memberCount) + ' members · ' + esc(team.taskCount) + ' tasks'
        + (team.errorCount ? ' · <span class="error-text">' + esc(team.errorCount) + ' failed</span>' : '')
        + '<br>' + esc(team.workspace) + '</div>';
      btn.addEventListener('click', function () { selectTeam(team.id, team.workspace); });
      host.appendChild(btn);
    });
  }

  function selectTeam(id, workspace) {
    var url = API + '/teams/' + encodeURIComponent(id)
      + (workspace ? '?workspace=' + encodeURIComponent(workspace) : '');
    return api(url).then(function (team) {
      state.team = team;
      renderList();
      renderDetail();
    }).catch(function (error) { toast(error.message, true); });
  }

  function statusClass(status) {
    if (status === 'completed') return 'done';
    if (status === 'failed') return 'bad';
    if (status === 'cancelled') return 'gone';
    if (status === 'in_progress') return 'run';
    return 'open';
  }

  function toMermaid(team) {
    var lines = ['flowchart TD'];
    // Task text is model-authored and may originate from untrusted content:
    // node ids are restricted to a safe charset (unsafe ids get a stable
    // generated alias) and label text is fully entity-escaped, because
    // securityLevel:'strict' only sanitizes what mermaid itself parses.
    var aliases = {};
    var aliasCount = 0;
    var safeIds = [];
    function safeId(id, index) {
      if (/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(id)) return id;
      if (aliases[id] === undefined) aliases[id] = 'task' + index + '_' + (++aliasCount);
      return aliases[id];
    }
    function mermaidEscape(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '#quot;')
        .replace(/'/g, '#39;')
        .replace(/\r?\n/g, ' ');
    }
    var ids = {};
    team.tasks.forEach(function (task) { ids[task.id] = true; });
    team.tasks.forEach(function (task, index) {
      var nodeId = safeId(task.id, index);
      safeIds.push({ raw: task.id, node: nodeId });
      lines.push(nodeId + '["' + mermaidEscape(task.id + ' · ' + task.subject) + '"]');
    });
    function nodeOf(rawId) {
      for (var i = 0; i < safeIds.length; i++) if (safeIds[i].raw === rawId) return safeIds[i].node;
      return rawId;
    }
    team.tasks.forEach(function (task) {
      (task.dependencies || []).forEach(function (dep) {
        if (ids[dep]) lines.push(nodeOf(dep) + ' --> ' + nodeOf(task.id));
      });
    });
    lines.push('classDef done fill:#14532d,stroke:#16a34a,color:#dcfce7;');
    lines.push('classDef run fill:#1e3a8a,stroke:#3b82f6,color:#dbeafe;');
    lines.push('classDef open fill:#262a35,stroke:#4b5563,color:#e6e8ee;');
    lines.push('classDef bad fill:#7f1d1d,stroke:#ef4444,color:#fee2e2;');
    lines.push('classDef gone fill:#1f2937,stroke:#4b5563,color:#9ca3af;');
    team.tasks.forEach(function (task) { lines.push('class ' + nodeOf(task.id) + ' ' + statusClass(task.status)); });
    return lines.join('\\n');
  }

  function renderDag() {
    var host = $('dag');
    if (!state.team.tasks.length) { host.innerHTML = '<div class="empty">No tasks yet.</div>'; return; }
    var code = toMermaid(state.team);
    if (!window.mermaid) {
      host.innerHTML = '<pre>' + esc(code) + '</pre><div class="legend">Mermaid.js could not be loaded; showing the graph source.</div>';
      return;
    }
    window.mermaid.render('dag' + Date.now(), code).then(function (result) {
      host.innerHTML = result.svg;
    }).catch(function (error) {
      host.innerHTML = '<pre>' + esc(code) + '</pre><div class="legend error-text">Mermaid render failed: ' + esc(error && error.message ? error.message : error) + '</div>';
    });
  }

  function routeLabel(member) {
    if (!member) return '';
    var provider = (member.provider || '').trim();
    var model = (member.model || '').trim();
    if (provider && model) return provider + '/' + model;
    return model || '(inherit)';
  }

  function renderMembers() {
    var host = $('members');
    var members = (state.team.members || []).filter(function (m) { return m.status !== 'removed'; });
    if (!members.length) { host.innerHTML = '<div class="empty">No members.</div>'; return; }
    var rows = members.map(function (member) {
      var chips = (member.skills || []).map(function (skill) { return '<span class="chip">' + esc(skill) + '</span>'; }).join('');
      return '<tr><td><strong>' + esc(member.name) + '</strong></td>'
        + '<td>' + esc(member.role || '') + '</td>'
        + '<td>' + esc(routeLabel(member)) + '</td>'
        + '<td>' + esc(member.status || '') + '</td>'
        + '<td>' + (chips || '<span style="color:#8b93a7">—</span>') + '</td>'
        + '<td><button type="button" class="subtle" data-edit="' + esc(member.name) + '">Edit</button></td></tr>';
    }).join('');
    host.innerHTML = '<table><thead><tr><th>Member</th><th>Role</th><th>Model route</th><th>Status</th><th>Skills</th><th></th></tr></thead><tbody>'
      + rows + '</tbody></table>';
    Array.prototype.forEach.call(host.querySelectorAll('[data-edit]'), function (button) {
      button.addEventListener('click', function () { openEditor(button.getAttribute('data-edit')); });
    });
  }

  function renderDetail() {
    var team = state.team;
    var detail = $('detail');
    detail.innerHTML = '<section>'
      + '<div class="panel"><strong style="font-size:16px">' + esc(team.name) + '</strong> '
      + '<span class="badge ' + esc(team.phase) + '">' + esc(team.phase) + '</span>'
      + (team.halted ? ' <span class="badge invalid">halted</span>' : '')
      + '<div class="legend">' + esc(team.description || 'No goal recorded.') + '</div>'
      + '<div class="legend">id ' + esc(team.id) + ' · workspace ' + esc(team.workspace || '') + ' · ' + (team.tasks || []).length + ' tasks</div></div></section>'
      + '<section><h2>Task graph</h2><div class="panel" id="dag"><div class="empty">Rendering…</div>'
      + '<div class="legend">pending → open · in_progress → blue · completed → green · failed → red · cancelled → grey</div></div></section>'
      + '<section><h2>Members</h2><div class="panel" id="members"></div></section>'
      + '<section><h2>Blackboard</h2><div class="panel" id="board"></div></section>'
      + '<section><h2>Polls</h2><div class="panel" id="polls"></div></section>';
    renderDag();
    renderMembers();
    renderBoard();
    renderPolls();
  }

  function boardApi(payload) {
    return api('/plugins/deers-dsh-agent-team/blackboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.assign({
        sessionId: state.team.captainSessionId,
        teamId: state.team.id,
      }, payload)),
    });
  }

  function renderBoard() {
    var host = $('board');
    var blackboard = state.team.blackboard || {};
    var entries = Array.isArray(blackboard.entries) ? blackboard.entries : [];
    var html = '';
    if (!entries.length) {
      html += '<div class="empty">The blackboard is empty. Write the first note.</div>';
    } else {
      html += '<ul class="board-list">';
      entries.forEach(function (entry) {
        var votes = entry.votes && typeof entry.votes === 'object' ? entry.votes : {};
        var up = 0;
        var down = 0;
        Object.keys(votes).forEach(function (voter) {
          if (votes[voter] === 'up') up += 1;
          else if (votes[voter] === 'down') down += 1;
        });
        var mine = votes['captain'] || '';
        var time = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '';
        html += '<li class="board-entry">'
          + '<div class="board-meta"><strong>' + esc(entry.author || '') + '</strong>'
          + ' <span class="badge">' + esc(entry.kind || 'note') + '</span>'
          + (entry.pinned ? ' <span class="badge staged">pinned</span>' : '')
          + '<span class="board-time">' + esc(time) + '</span></div>'
          + '<div class="board-content">' + esc(entry.content || '') + '</div>'
          + '<div class="board-votes">'
          + '<button type="button" class="subtle" data-vote="up" data-mine="' + esc(mine) + '" data-entry="' + esc(entry.id) + '"'
          + (mine === 'up' ? ' style="border-color:#3b82f6"' : '') + '>▲ ' + up + '</button>'
          + '<button type="button" class="subtle" data-vote="down" data-mine="' + esc(mine) + '" data-entry="' + esc(entry.id) + '"'
          + (mine === 'down' ? ' style="border-color:#3b82f6"' : '') + '>▼ ' + down + '</button>'
          + '</div></li>';
      });
      html += '</ul>';
    }
    html += '<form class="board-form" id="board-form">'
      + '<textarea id="board-content" placeholder="Write an idea, proposal or meeting note…"></textarea>'
      + '<div class="row">'
      + '<select id="board-kind">'
      + '<option value="note">note</option><option value="idea">idea</option>'
      + '<option value="proposal">proposal</option><option value="decision">decision</option>'
      + '</select>'
      + '<button type="submit" class="primary">Post</button>'
      + '</div></form>';
    host.innerHTML = html;
    var form = $('board-form');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var content = $('board-content').value;
        if (!content.trim()) return;
        var submit = form.querySelector('button[type="submit"]');
        submit.disabled = true;
        boardApi({ action: 'post', content: content, kind: $('board-kind').value }).then(function () {
          toast('Posted to the blackboard.');
          return selectTeam(state.team.id, state.team.workspace);
        }).catch(function (error) {
          toast(error.message, true);
        }).then(function () { submit.disabled = false; });
      });
    }
    Array.prototype.forEach.call(host.querySelectorAll('[data-vote]'), function (button) {
      button.addEventListener('click', function () {
        var current = button.getAttribute('data-vote');
        var mine = button.getAttribute('data-mine');
        var vote = mine === current ? 'clear' : current;
        button.disabled = true;
        boardApi({ action: 'vote', entryId: button.getAttribute('data-entry'), vote: vote }).then(function () {
          return selectTeam(state.team.id, state.team.workspace);
        }).catch(function (error) {
          toast(error.message, true);
          button.disabled = false;
        });
      });
    });
  }

  function renderPolls() {
    var host = $('polls');
    var pollsState = state.team.polls || {};
    var polls = Array.isArray(pollsState.polls) ? pollsState.polls : [];
    if (!polls.length) {
      host.innerHTML = '<div class="empty">No polls yet. Start one from the team poll window.</div>';
      return;
    }
    var html = '<ul class="poll-list">';
    polls.slice().reverse().forEach(function (poll) {
      var votes = poll.votes && typeof poll.votes === 'object' ? poll.votes : {};
      var counts = {};
      var voters = {};
      Object.keys(votes).forEach(function (voter) {
        (votes[voter] || []).forEach(function (optionId) {
          counts[optionId] = (counts[optionId] || 0) + 1;
          voters[optionId] = voters[optionId] || [];
          voters[optionId].push(voter);
        });
      });
      var status = poll.status === 'closed'
        ? 'closed'
        : (poll.closesAt && poll.closesAt <= Date.now() ? 'expired' : 'open');
      var rule = poll.thresholdRule === 'gt'
        ? '&gt; ' + (poll.thresholdValue || 1)
        : poll.thresholdRule === 'percent'
          ? '&ge; ' + (poll.thresholdValue || 50) + '%'
          : 'majority';
      html += '<li class="poll-entry">'
        + '<div class="poll-meta"><strong>' + esc(poll.title || '') + '</strong>'
        + ' <span class="badge">' + status + '</span>'
        + ' <span class="badge">' + (poll.multiSelect ? 'multi' : 'single') + '</span>'
        + ' <span class="badge">' + rule + '</span>'
        + ' <span class="badge">quorum ' + (poll.quorum || 1) + '</span>'
        + (poll.anonymous ? ' <span class="badge">anonymous</span>' : '')
        + '<span class="poll-time">' + Object.keys(votes).length + ' voters</span></div>';
      (poll.options || []).forEach(function (option) {
        var list = poll.anonymous ? [] : (voters[option.id] || []);
        html += '<div class="poll-option"><span>' + esc(option.label || '') + '</span><span>' + (counts[option.id] || 0)
          + (list.length ? ' (' + esc(list.join(', ')) + ')' : '') + '</span></div>';
      });
      if (poll.decision) {
        var adoptedLabels = (poll.options || []).filter(function (option) {
          return (poll.decision.adoptedOptionIds || []).indexOf(option.id) >= 0;
        }).map(function (option) { return option.label; });
        html += '<div class="poll-decision">'
          + (poll.decision.insufficientQuorum
            ? 'Quorum not met'
            : adoptedLabels.length ? 'Adopted: ' + esc(adoptedLabels.join(', ')) : 'No option adopted')
          + ' — ' + esc(poll.decision.summary || '') + '</div>';
      }
      html += '</li>';
    });
    host.innerHTML = html + '</ul>';
  }

  function skillChips() {
    var box = $('skill-box');
    Array.prototype.forEach.call(box.querySelectorAll('.chip'), function (chip) { chip.remove(); });
    state.editorSkills.forEach(function (skill, index) {
      var chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = esc(skill) + ' <button type="button" aria-label="remove">×</button>';
      chip.querySelector('button').addEventListener('click', function () {
        state.editorSkills.splice(index, 1);
        skillChips();
      });
      box.insertBefore(chip, $('tag-input'));
    });
  }

  function openEditor(memberName) {
    var member = (state.team.members || []).find(function (m) { return m.name === memberName; });
    if (!member) return;
    state.editorMember = member;
    state.editorSkills = (member.skills || []).slice();
    $('editor-title').textContent = 'Edit member — ' + member.name;
    $('f-persona').value = member.persona || '';
    var select = $('f-route');
    var routes = [];
    (state.team.members || []).forEach(function (m) {
      if (m.provider && m.model) {
        var label = m.provider + '/' + m.model;
        if (routes.indexOf(label) < 0) routes.push(label);
      }
    });
    var current = routeLabel(member);
    if (current !== '(inherit)' && routes.indexOf(current) < 0) routes.unshift(current);
    select.innerHTML = '<option value="__keep__">Keep current (' + esc(current) + ')</option>'
      + routes.map(function (route) { return '<option value="' + esc(route) + '">' + esc(route) + '</option>'; }).join('')
      + '<option value="__custom__">Custom…</option>';
    $('custom-route').style.display = 'none';
    $('f-provider').value = ''; $('f-model').value = ''; $('f-effort').value = '';
    skillChips();
    $('editor').showModal();
  }

  $('f-route').addEventListener('change', function () {
    $('custom-route').style.display = $('f-route').value === '__custom__' ? 'flex' : 'none';
  });
  $('skill-box').addEventListener('click', function () { $('tag-input').focus(); });
  $('tag-input').addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();
    var value = $('tag-input').value.trim().replace(/,$/, '');
    if (!value) return;
    if (state.editorSkills.indexOf(value) < 0) state.editorSkills.push(value);
    $('tag-input').value = '';
    skillChips();
  });
  $('f-cancel').addEventListener('click', function () { $('editor').close(); });
  $('editor-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var member = state.editorMember;
    if (!member) return;
    var patch = { persona: $('f-persona').value, skills: state.editorSkills.slice() };
    var route = $('f-route').value;
    if (route === '__custom__') {
      patch.modelRoute = { provider: $('f-provider').value.trim(), model: $('f-model').value.trim() };
      var effort = $('f-effort').value.trim();
      if (effort) patch.modelRoute.reasoningEffort = effort;
      if (!patch.modelRoute.provider || !patch.modelRoute.model) {
        toast('Custom model route needs a provider and a model.', true);
        return;
      }
    } else if (route !== '__keep__') {
      var parts = route.split('/');
      patch.modelRoute = { provider: parts[0] || '', model: parts.slice(1).join('/') || '' };
    }
    var save = $('f-save');
    save.disabled = true;
    api(API + '/teams/' + encodeURIComponent(state.team.id) + '/members/' + encodeURIComponent(member.name), {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(function () {
      $('editor').close();
      toast('Saved dossier for ' + member.name + '.');
      return selectTeam(state.team.id, state.team.workspace);
    }).catch(function (error) {
      toast(error.message, true);
    }).then(function () { save.disabled = false; });
  });

  loadTeams();
})();
</script>
</body>
</html>
`
}

/** Register the UI routes on the (already authentication-fenced) web server. */
export function registerUiRoutes(webServer: WebRouteHost, deps: UiRoutesDeps): () => void {
  const handle = createUiRequestHandler(deps)
  const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } as const
  const disposables: Array<() => void> = []

  disposables.push(webServer.register({
    kind: 'prefix',
    path: API_PREFIX,
    handler: async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      let body: unknown
      if (req.method === 'PATCH' || req.method === 'POST' || req.method === 'PUT') {
        try {
          body = await readJsonRequest(req)
        } catch (error: unknown) {
          res.writeHead(error instanceof RequestBodyError ? error.status : 400, jsonHeaders)
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'invalid request body' }))
          return
        }
      }
      const result = await handle(req.method ?? 'GET', url.pathname, url.searchParams, body)
      res.writeHead(result.status, jsonHeaders)
      res.end(JSON.stringify(result.body))
    },
  }))

  const page = uiIndexHtml()
  const servePage = async (_req: IncomingMessage, res: ServerResponse): Promise<void> => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(page)
  }
  disposables.push(webServer.register({ kind: 'exact', path: '/deers-agent-team/', handler: servePage }))
  disposables.push(webServer.register({ kind: 'exact', path: '/deers-agent-team', handler: servePage }))

  return () => {
    for (const dispose of disposables.reverse()) dispose()
  }
}
