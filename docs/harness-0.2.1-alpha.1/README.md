# Harness 0.2.1-alpha.1 migration

Target: published npm cohort `0.2.1-alpha.1` (npm dist-tag `alpha`). The recommended host remains `0.2.0-rc.2`; this note records why an Alpha host is now declared and what was checked.

AgentTeams 0.1.23 adds `0.2.1-alpha.1` to `compatibility.json` as a `preview` target and enumerates it in every `@deepseek-ai/dsh-*` peer range. The seven earlier supported hosts and the `0.2.0-rc.2` recommendation are unchanged.

## Why this release exists

A host upgraded from `0.2.0-rc.2` to `0.2.1-alpha.1` refused to load AgentTeams 0.1.22 at profile startup. The loader evaluates plugin compatibility in `dsh-app-boot` `evaluatePluginCompatibility`: for every peer named `@deepseek-ai/dsh` or `@deepseek-ai/dsh-*` it requires

```js
semver.satisfies(runtimeVersion, range, { includePrerelease: true })
```

and denies the whole bundle — *"it stays installed but profile startup denies it"* — when no peer range matches the runtime. 0.1.22's ranges ended at `0.2.0-rc.2`, so all 21 recorded peers were unsatisfied on `0.2.1-alpha.1`. The remedy the host offers is an exact-version exemption in `<profile>/compatibility.json` (`dsh plugin allow-version`, `setProfileVersionExemption`); this release removes the need for one by declaring the host.

Reproduced against the installed runtime with dsh's own evaluator:

| Manifest | Runtime | Verdict |
| --- | --- | --- |
| `deers-dsh-agent-team@0.1.22` | `0.2.1-alpha.1` | denied, 21 unsatisfied peers, no exemption |
| `deers-dsh-agent-team@0.1.23` | `0.2.1-alpha.1` | accepted, no exemption |

## Manifest changes

- `compatibility.json`: `0.2.1-alpha.1` enters `supportedHosts` with track `preview`. `scripts/compatibility.mjs` forbids an Alpha or Beta host from being the ordinary-user recommendation, so `recommendedHost` stays `0.2.0-rc.2`.
- `package.json`: every `@deepseek-ai/dsh-*` peer enumerates the nine declared targets, now including `0.2.1-alpha.1`. `validatePackageCompatibility` requires the peer list to be exactly the declared host set, so a partial edit fails `pnpm verify`.
- Development baseline and pnpm overrides stay `0.2.0-rc.2`: `releaseMetadata` requires a stable `latest` publish to develop against the recommended host.

## Shared-runtime peers on the preview cohort

The host bundles `@deepseek-ai/cordis@4.0.5-alpha.1` and `@deepseek-ai/schemastery@3.18.5-alpha.1`. Both are prereleases of a *later* patch, and semver never lets a prerelease satisfy `^4.0.2` or `^3.18.2`, so npm aborted installation of the plugin with `ERESOLVE … peerOptional @deepseek-ai/schemastery@"^3.18.2" from deers-dsh-agent-team`. The peer ranges are now `^4.0.2 || 4.0.5-alpha.1` and `^3.18.2 || 3.18.5-alpha.1`. The host's compatibility gate only inspects `@deepseek-ai/dsh*` peers, so this changes package-manager resolution, not profile admission.

## Client navigation

`ISessions` no longer publishes navigation: `dsh-api-session-controller` states "navigation belongs to view owners", and a tree-wide search for `openSubagent`/`refreshSubagents` returns nothing. `uiWorkspace.openSession(target)` is the surviving action, and all supported hosts ship `@deepseek-ai/dsh-client-ui-workspace` (verified for every declared target, and mounted by the `dsh-web-app` patch of both `0.2.0-rc.2` and `0.2.1-alpha.1`).

Previously `openAgentTeamMember` reached the working branch only because it tested `sessions.open === undefined` first, and the workspace navigator came from an undeclared `ctx.get('uiWorkspace')` lookup whose failure was swallowed into a `console.warn` — clicking a member did nothing. The navigator is now preferred whenever present, the legacy `open`/`openSubagent` branches remain for older hosts, and `@deepseek-ai/dsh-client-ui-workspace` is declared in `dsh.client.inject` and the client `inject` array.

## Source review

Static review of every Harness surface this plugin touches, against the installed `0.2.1-alpha.1` packages:

- Subagent boundary — compatible. `Symbol.for('dsh.subagent.deliverPrompt')` (`dsh-subagent/lib/types/internal.js`), its runtime implementation (`dsh-subagent/lib/index.js`), and `sendMessage(sender, targetId, content, options)` are unchanged and match the plugin's `Deliver`/`Send` types, which is why member spawn, wake-up, and messaging keep working. `followup`, `registerContinuableSetup`, and `Symbol.for('dsh.subagent.queuePrompt')` no longer exist anywhere in the host, so those branches of `harness-compat.ts` are dead on this host and remain only for older generations.
- Member spawn — compatible. `ContinuableStartSpec`, `request.persona`/`agentOptions`/`toolFilter`, `AgentOptions`, `ToolRestriction`, and the `spawn` provider's capability set all still match `members.ts`, and `prepareContinuable` is implemented.
- Tool registry — compatible. `defineTool`, the mandatory `ToolDefinition.output`, `ctx.tools.register`, and `tools.restrict()` with `view().restrictableNames` are intact; the view accessor is now `private` in the type surface but still present at runtime, and the plugin reads it through a guarded cast.
- Session and agent events — compatible. `agent/created` (serial, with `source`), `agent/request`, `agent/pre-step`, `agent/status`, and `agent/request-error` behave as before. `agent/session-start` is gone, so that listener never fires. `Session.ownEvents()` is now `@deprecated` but still functional; the `header.seedLength` fallback beside it is unreachable, because `SessionHeader` no longer carries that field.
- LLM, commands, web server, workspace registry, and the client loader/slot API — compatible. All eight injected client packages exist at this version with a `./client` export, the six registered slot keys exist in the shipped client bundle with matching option shapes, and `dsh-client-ui-workspace` was newly declared for navigation.
- Composition — `@deepseek-ai/dsh-base` still mounts `skill`, `subagent` (provider `spawn`), `tools`, `system-prompt`, and `commands`, so the plugin's `inject` list resolves in a base-backed profile.

The skill modules, task board, scheduler, and quality gates are host-independent business logic carried over from 0.1.22.

## Release verification

- `node scripts/compatibility.mjs` — nine targets including `0.2.1-alpha.1`.
- `node scripts/release-metadata.mjs` — `value=0.1.23`, `dist_tag=latest`, `prerelease=false`.
- `node --test scripts/compatibility.test.mjs` — 11 passed; the metadata gate set (compatibility, readme-version, release-metadata) — 24 passed.
- `node scripts/readme-version.mjs` — README references match `0.1.23`.
- `pnpm typecheck` — clean; `pnpm test` — 9 files, 54 tests passed.
- Runtime matrix against the published `0.2.1-alpha.1` cohort (`scripts/harness-runtime-verify.mjs --host-version 0.2.1-alpha.1 --artifact deers-dsh-agent-team-0.1.23.tgz`) — all eight scenario groups pass: `lifecycle`, `lifecycle-cold-restore`, `fallback`, `fallback-cold-restore`, `failure`, `captain-idle-wakeup`, `progressive-entry`, `web-approval`, `protocol-compatibility`, `stability`. Members spawn, execute, report, wake the captain, and survive cold restore on the Alpha host; the client half is not covered by this matrix.
- The verifier needed one portability fix to run on Windows: it spawned a bare `npm`, which `CreateProcess` cannot resolve to `npm.cmd`, so it now runs npm's CLI through the current Node binary when that entry is locatable.
- The copied upstream fixtures asserted the upstream roster of 14 team tools, but this fork registers 18 (adding `edit_member`, `set_model`, `amend_task`, `import`). `pnpm verify:capabilities` and the `progressive-entry` fixture now derive the captain set from `TEAM_TOOL_NAMES`, which the package publishes from its root, so the counts cannot drift again.

Not verified here: real provider APIs and credentials, browser interaction, operating systems other than the one used for the matrix, and migration of live user data.
