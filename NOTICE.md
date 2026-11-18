# NOTICE

This plugin vendors its team-member skill set from
[`@firefly0621/dsh-superpowers`](https://www.npmjs.com/package/@firefly0621/dsh-superpowers)
(version 0.1.0-rc.30), licensed under the [MIT License](./skills/LICENSE.superpowers).

Specifically:

- `skills/` — the 42 general development process skills (each
  `<name>/SKILL.md` plus supporting references/scripts).
- `.dsh/skills/` — byte-identical mirror of `skills/` (keep in sync with
  `pnpm sync:skill`); this is the directory the DSH host discovers for this
  project.
- `.agents/skills/<name>` — discovery links (git symlinks) pointing at
  `../../skills/<name>`.

These replace the DSH plugin-development meta skills inherited from the
`@nanmicoder/dsh-agent-teams` upstream, which are not intended as the default
skill set for team members. The superpowers skill content remains under its
original MIT license; this notice and `skills/LICENSE.superpowers` provide the
required attribution. Changes to the vendored skills are tracked in this
repository like any other source file.
