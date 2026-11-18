# Harness 0.2.2-rc.4 verification

This is the exact host generation used to validate AgentTeams 0.6.2 on this machine.

## Host identity

- CLI package: `@deepseek-ai/dsh@0.2.2-rc.4` (npm global install)
- Process: `node .../@deepseek-ai/dsh/lib/bin.js web`
- Compatibility policy: host line `^0.2.0`, recommended target `0.2.2-rc.4`
- The 0.2.2 generation removed the private `dsh.subagent.queuePrompt` / `deliverPrompt` symbols and the targeted child-drain method.

## Why this host needed a plugin fix

The previous compatibility layer required either the private queue/deliver symbols or `followup` plus `sendMessage`, so the host half failed activation with:

```text
deers-agent-team: unsupported Harness subagent contract
(cannot install complete retired-member guard)
```

AgentTeams 0.3.2+ uses the public contract instead:

- `sendMessage` delivers to a running, idle or cold-resumed member;
- `drainDescendants([captain])` releases the team tree when targeted drain is absent;
- child setup falls back to the `agent/created` edge when `registerContinuableSetup` is absent;
- the retired-member guard wraps every delivery path that actually exists.

## Evidence collected

- Host plugin entry `include:deers-agent-team` reports `fiberPhase: "active"`.
- All `deers_team_*` tools are registered (29 business tools).
- `deers_team_status` responds with the expected "no active team" error rather than an unknown-tool error.
- `node scripts/compatibility.mjs` lists `0.2.2-rc.4` as the recommended target on host line `^0.2.0`.
- `node --test scripts/compatibility.test.mjs` passes.
- Character/dashboard client bundle loads and both `shell.overlay` entries (`deers-agent-team-activity`, `deers-agent-team-polls`) are active.

## Version note

Earlier documentation incorrectly claimed a `0.3.2-rc.2` / `0.3.2-alpha.*` host line. No such host is installed or declared by this plugin's peers; the actual running host is `0.2.2-rc.4` on the `0.2.x` line. The README tables, install commands and compatibility policy now reflect the real targets.
