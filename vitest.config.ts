import { defineConfig } from 'vitest/config'

/**
 * Scope vitest to the TypeScript test directory. The repo's `scripts/*.test.mjs`
 * files run under `node --test` (see package.json), not vitest — vitest's
 * default include pattern would pull them in and double-run or break them.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
})
