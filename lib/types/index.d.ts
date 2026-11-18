/**
 * AgentTeams for DeepSeek Harness.
 *
 * A host-plane plugin that registers the `deers_team_*` tools and one usage
 * agent-scoped usage section. Each session keeps a stable tool set and core
 * instructions. Existing business tools cover the complete team lifecycle.
 * After installation any session can
 * run multi-agent teamwork through natural language (e.g. "use AgentTeams to research X"):
 * the model creates a team (it becomes the captain), spawns members as
 * durable continuable subagents, breaks the goal into tasks with
 * dependencies, wakes members with messages, relays reports, and collects
 * results.
 *
 * Installation (bundle): `dsh plugin --profile <name> add deers-dsh-agent-team`
 * (or a local path). The bundle patch mounts this plugin row into the host
 * composition; the tools register into the shared `tools` registry and the
 * usage section into the global system prompt, so the plugin needs no realm.
 *
 * @module deers-dsh-agent-team
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { type TeamProfileConfig } from './profiles.ts';
export { TEAM_TOOL_NAMES, MEMBER_TOOL_NAMES, CAPTAIN_TOOL_NAMES } from './tool-names.ts';
export declare const name = "deers-agent-team";
export declare const inject: string[];
/** Plugin configuration. */
export interface Config {
    /**
     * State directory name under the captain's workspace; team state lives at
     * `<workspace>/<stateDir>/<teamId>/` (default `.deers-agent-team`).
     */
    stateDir?: string;
    /** `ctx.subagents` provider used to spawn members; must support continuable children and personas (default `spawn`). */
    memberProvider?: string;
    /** Optional model override applied to every member. */
    memberModel?: string;
    /** Prompt injected into member personas and automatic task assignments. */
    executionPrompt?: string;
    /** Plugin-wide fallback route for unavailable member models. */
    fallback?: import('./profiles.ts').TeamModelFallbackConfig;
    /** Member delegation depth cap (default `0`; `0` forbids delegation entirely). */
    memberMaxDepth?: number;
    /** Team size cap in members (default `12`). */
    maxMembers?: number;
    /** Named multi-role team profiles. */
    profiles?: Record<string, TeamProfileConfig>;
    /** Prompt-section order for the usage policy (default `117`, after delegation policy). */
    promptSectionOrder?: number;
    /** Keep the captain in the Router role; implementation/repair takeover is blocked unless true (default `false`). */
    captainMayImplement?: boolean;
    /** Coalesce member reports to the captain within this window; `0` disables batching (default `1200`). */
    routerBatchWindowMs?: number;
    /** Independent watchdog loop tuning. */
    watchdog?: {
        enabled?: boolean;
        intervalSeconds?: number;
        stallSeconds?: number;
        repeatWindowSeconds?: number;
        repeatThreshold?: number;
        maxAttempts?: number;
        notifyCaptain?: boolean;
    };
    /**
     * Register the deterministic `/deers-agent-team` activation surfaces (the
     * closed-namespace slash command and the plain-text gesture boundary).
     * Disable to keep the natural-language trigger as the only entry point.
     */
    slashCommand?: boolean;
}
export declare const Config: z<Config>;
/** The model-facing usage policy: when and how to drive AgentTeams. */
export declare function usageSectionText(toolNames: string, profilesText?: string): string;
export declare function apply(ctx: Context, config: Config): void;
