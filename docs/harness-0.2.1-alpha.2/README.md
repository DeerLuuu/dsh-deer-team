# Harness 0.2.1-alpha.2 migration

Target: published npm cohort `0.2.1-alpha.2`. The recommended host remains `0.2.0-rc.2`; this note records why AgentTeams 0.1.24 declares the new Alpha and what was verified.

## Why this release exists

A host upgraded from `0.2.1-alpha.1` to `0.2.1-alpha.2` again denied this plugin at profile startup: none of the 21 `@deepseek-ai/dsh-*` peer ranges listed `0.2.1-alpha.2` (`dsh-app-boot` `evaluatePluginCompatibility` requires `semver.satisfies(runtimeVersion, range, { includePrerelease: true })` for every dsh peer). AgentTeams 0.1.24 declares the host in `compatibility.json` (track `preview`) and enumerates it in every peer range.

## Two real API breaks beyond the version gate

1. **Continuable lifecycle renamed.** `startContinuable` and `drainContinuableChildren` no longer exist anywhere in the 0.2.1-alpha.2 host; the replacements are `startActivation(spec & { delivery })` (the plugin uses `delivery: 'parent'`, preserving the historical parent-notification flow; the activation handle's unawaited `result` promise is neutralized) and `drainChildren(parent, childIds)` with the same arguments. The adapters live in `src/harness-compat.ts` (`startContinuableChild`, `drainTeamMemberChildren`) and fall back to the previous-generation names, so every earlier declared host keeps working. The member delegation guard now wraps every present start entry by name (`start`, `startContinuable`, `startActivation`, `prompt`), so a renamed delegation path cannot bypass the member depth budget.
2. **Shared-runtime peers resolve one cohort further.** The host declares `~4.0.5-alpha.1` cordis and `~3.18.5-alpha.1` schemastery, and npm resolves those tilde ranges to the published `4.0.5-alpha.2` / `3.18.5-alpha.2` (dist-tags `dsh-0-2-1-alpha-3`). semver never matches those against `^4.0.2` / `^3.18.2`, aborting installation with `ERESOLVE peerOptional`. The plugin's peer ranges are now `^4.0.2 || 4.0.5-alpha.1 || 4.0.5-alpha.2` and `^3.18.2 || 3.18.5-alpha.1 || 3.18.5-alpha.2`. (An existing global host install that pinned the alpha.1 generation also still satisfies the range.)

Everything else this plugin touches was verified present on the installed `0.2.1-alpha.2` packages: `Symbol.for('dsh.subagent.deliverPrompt')`, `sendMessage(sender, targetId, content, options)`, `interrupt(targetSessionId, authority)`, provider `prepareContinuable` + `capabilities.persona/toolFilter`, `agent/created` / `agent/pre-step` / `agent/status` / `agent/request-error`, `Agent.followup`, `tools.restrict().view().restrictableNames`, `Session.ownEvents()`, and the client-side `uiWorkspace.openSession`, `layout.selectPanel`/`beginNavigation`, sidebar-right services and all eight injected client packages.

## Runtime matrix evidence

`scripts/harness-runtime-verify.mjs --host-version 0.2.1-alpha.2 --artifact deers-dsh-agent-team-0.1.24.tgz` on Windows, after two Windows-side harness fixes recorded below. All ten scenario groups pass:

| Scenario | Key assertions |
| --- | --- |
| `lifecycle` | exit0, plugin tools visible, member executed, second wake, FIFO order, messages-while-busy |
| `lifecycle-cold-restore` | driver completed, same member restored, route + reasoning restored |
| `fallback` / `fallback-cold-restore` | fallback activated, reasoning reset, cold restore intact |
| `failure` | member failure surfaces, task terminal |
| `captain-idle-wakeup` | captain yielded and notified after idle |
| `progressive-entry` | all six entry cases, stable prefixes, 30 ordinary turns |
| `web-approval` | staged before approval, independent approval wake, report wake after yield, invalid/repeat approval rejected, member four tools |
| `protocol-compatibility` | legacy allowlist + cold restore, PTC discard, pruning, compaction, plan revision, archive |
| `stability` | lazy start, running plan correction, 32-message steering, read-receipt continuation, reassign, archive teardown (descendants stopped, sibling preserved, retired resume rejected), batch plan, terminal evidence, report retry, settlement dedup |

Reports live in a temporary `--report-dir`; the authoritative copy of this run's result JSON should be archived next to this note before a release tag.

## Windows harness fixes required for the matrix

- `harness-runtime-verify.mjs` scrubbed `APPDATA`/`LOCALAPPDATA`/`SystemRoot` from the child environment, which the `koffi` native build (`cnoke.cjs getCacheDirectory`) requires on Windows; `environment()` now passes them through on win32 (cache locations only, no test state).
- `fixtures/harness-runtime-stability.mjs` called `ctx.subagents.startContinuable`/`drainContinuableChildren` directly (host-side doubles); it now probes `startActivation`/`drainChildren` first, and its `settlement` team creation passes `approval: 'automatic'` explicitly now that the create default is `required`.

## Manifest changes

- `compatibility.json`: `0.2.1-alpha.2` enters `supportedHosts` with track `preview`; ten declared targets.
- `package.json`: every dsh peer enumerates the ten targets; cordis/schemastery peers widened as above; development baseline and pnpm overrides stay at `0.2.0-rc.2`.
