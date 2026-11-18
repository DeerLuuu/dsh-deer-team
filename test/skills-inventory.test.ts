import { describe, expect, it } from 'vitest'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The plugin vendors the @firefly0621/dsh-superpowers skill set (see
 * NOTICE.md) as the default skill catalog offered to team members. The DSH
 * host discovers each skill as `<name>/SKILL.md` under `skills/` (mirrored to
 * `.dsh/skills/` and linked from `.agents/skills/<name>`), so these invariants
 * guard the vendored content itself.
 */
const skillsRoot = join(fileURLToPath(new URL('..', import.meta.url)), 'skills')

/** Upstream fork meta skills that must not ship in the vendored skill set. */
const forbiddenUpstreamSkills = ['plugin-upgrade', 'dsh-plugin-development']

async function skillDirectoryNames(): Promise<string[]> {
  const entries = await readdir(skillsRoot, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}

describe('vendored superpowers skill set', () => {
  it('ships the full superpowers skill set (at least 42 skill directories)', async () => {
    const names = await skillDirectoryNames()
    expect(names.length).toBeGreaterThanOrEqual(42)
  })

  it('keeps the using-superpowers bootstrap skill', async () => {
    const bootstrap = join(skillsRoot, 'using-superpowers', 'SKILL.md')
    await expect(stat(bootstrap)).resolves.toMatchObject({ isFile: expect.any(Function) })
  })

  it('removed the upstream DSH plugin-development meta skills', async () => {
    const names = await skillDirectoryNames()
    for (const forbidden of forbiddenUpstreamSkills) {
      const leftovers = names.filter((name) => name.includes(forbidden))
      expect(leftovers, `upstream meta skill still present: ${leftovers.join(', ')}`).toEqual([])
    }
  })
})
