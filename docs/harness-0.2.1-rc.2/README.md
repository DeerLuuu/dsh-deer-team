# Harness 0.2.1-rc.2 migration

Target: published npm cohort `0.2.1-rc.2`. The recommended host remains `0.2.0-rc.2`; this note records why AgentTeams 0.1.29 declares the RC and what was checked.

## Why this release exists

A host upgraded from `0.2.1-alpha.2` to `0.2.1-rc.2` denied this plugin at profile startup: none of the 21 `@deepseek-ai/dsh-*` peer ranges listed `0.2.1-rc.2` (`dsh-app-boot` `evaluatePluginCompatibility` requires `semver.satisfies(runtimeVersion, range, { includePrerelease: true })` for every dsh peer). AgentTeams 0.1.29 declares the host in `compatibility.json` (track `preview`) and enumerates it in every peer range. The host remains on the `next` channel; ordinary users stay on the recommended `0.2.0-rc.2`.

> Superseded by the host line policy in AgentTeams 0.1.30: the peers now declare `^0.2.0` so `0.2.1-rc.2` — and any later `0.2.x` version — is admitted without a plugin sync. This record stays as the point where the last per-version sync happened; see `release-notes/v0.1.30.md`.

## Shared-runtime cohort

The 0.2.1-rc.2 cohort ships **stable** `@deepseek-ai/cordis@4.0.5` and `@deepseek-ai/schemastery@3.18.5` (previously the alpha cohorts shipped `4.0.5-alpha.x` / `3.18.5-alpha.x`, which required explicit prerelease alternatives in the peer ranges). The existing ranges `^4.0.2` and `^3.18.2 || 3.18.5-alpha.1 || 3.18.5-alpha.2` already match the stable releases, so no peer widening was needed for this cohort.

## Source review

Static review of every Harness surface this plugin touches, against the installed `0.2.1-rc.2` packages:

- Subagent boundary — compatible. `Symbol.for('dsh.subagent.deliverPrompt')` (`dsh-subagent/lib/types/internal.js`), `sendMessage(sender, targetId, content, options)`, `interrupt(targetSessionId, authority)`, and the alpha.2 generation `startActivation(spec)` / `drainChildren(parent, childIds)` are present with the same shapes the plugin's `harness-compat.ts` adapters target; the `startContinuable`/`drainContinuableChildren` fallbacks remain for older hosts.
- Member spawn — **breaking change, fixed in 0.1.31.** `prepareContinuable` and the `spawn` provider are unchanged, but `0.2.1-rc.2` removed `persona` and `toolFilter` from `SubagentStartRequest` **and** from `SubagentCapabilities` (now `agentOptions`/`agentPreset`/`outputSchema`/`depthLimit` only). A continuable child's composition is replayed only from a historical descriptor, so a start request can no longer dress a child. The plugin required `capabilities.persona`/`capabilities.toolFilter`, so every member spawn failed with `provider "spawn" cannot apply a member persona` and the first matrix run timed out with `memberRequests: 0`. Fix: send both fields only when the provider declares the capability (older hosts), and otherwise apply them in the member setup hook on the child's own scoped context — `deployment:persona-prefix` section from durable team state plus `tools.restrict(memberToolFilter(maxDepth, …))` — which also covers cold resume; older hosts replay both from the descriptor and never double-apply.
- Events — compatible. `agent/created` (serial), `agent/pre-step`, `agent/status`, `agent/request-error`; `Agent.followup` for the slash-command gesture boundary. `agent/session-start` stays absent (the listener is the guarded legacy branch).
- Tool registry — compatible. `defineTool`, the mandatory `ToolDefinition.output`, `ctx.tools.register`, `tools.restrict()` and `view().restrictableNames`.
- Client — compatible. `uiWorkspace.openSession`, `layout.selectPanel`/`beginNavigation`, the sidebar-right packages, and the eight injected client packages with `./client` exports.

## Verification

- `node scripts/compatibility.mjs` — eleven targets including `0.2.1-rc.2`.
- `node scripts/readme-version.mjs`, `node scripts/release-metadata.mjs` — 0.1.31 consistent.
- `pnpm typecheck` — clean; `pnpm test` — 71 tests passed.
- Runtime matrix: `scripts/harness-runtime-verify.mjs --host-version 0.2.1-rc.2 --artifact deers-dsh-agent-team-0.1.31.tgz` — result JSON archived next to this note (`runtime-matrix-result.json`); the failed 0.1.29 run is preserved as `runtime-matrix-result-0.1.29-failed.json` for the record.
