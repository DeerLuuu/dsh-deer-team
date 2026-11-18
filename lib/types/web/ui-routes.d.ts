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
import type { Context } from '@deepseek-ai/cordis';
import { type WebRouteHost } from '../web-routes.ts';
/** One workspace row the host workspace registry exposes. */
export interface UiWorkspace {
    readonly title: string;
    readonly path: string;
}
/** Construction dependencies for the UI routes. */
export interface UiRoutesDeps {
    /** Plugin context; resolves the live captain agent for PATCH routes. */
    readonly ctx: Context;
    /** Team state directory name under each workspace. */
    readonly stateDir: string;
    /** Registered workspaces, scanned for team state on every request. */
    readonly workspaces: () => readonly UiWorkspace[];
}
/** One handler result; serialized to JSON by the HTTP glue. */
export interface UiRouteResult {
    readonly status: number;
    readonly body: unknown;
}
/** Summary row of `GET /api/deers-agent-team/teams`. */
export interface UiTeamSummary {
    readonly id: string;
    readonly name: string;
    readonly phase: string;
    readonly workspace: string;
    readonly memberCount: number;
    readonly taskCount: number;
    readonly errorCount: number;
    readonly error?: string;
}
/**
 * The request dispatcher behind the HTTP routes. Pure with respect to the
 * deps: tests call it directly with a temp workspace, no server needed.
 */
export declare function createUiRequestHandler(deps: UiRoutesDeps): (method: string, pathname: string, query: URLSearchParams, body: unknown) => Promise<UiRouteResult>;
/**
 * The single-page panel: inline CSS, vanilla JS, Mermaid.js from CDN.
 * No framework, no external stylesheets.
 */
export declare function uiIndexHtml(): string;
/** Register the UI routes on the (already authentication-fenced) web server. */
export declare function registerUiRoutes(webServer: WebRouteHost, deps: UiRoutesDeps): () => void;
