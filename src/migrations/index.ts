/**
 * Schema versioning for the durable team state (`team.json`).
 *
 * A state without a `schemaVersion` field is version 0 (records written
 * before versioning existed). {@link migrate} upgrades any older state to
 * {@link CURRENT_SCHEMA_VERSION} by applying one pure step per version
 * transition (see `step-<N>-to-<N+1>.ts` modules). States from a newer build
 * and non-object payloads throw {@link MigrationError} instead of degrading
 * silently — an unreadable team must fail loudly, not lose data.
 * @module deers-dsh-agent-team/migrations
 */

import { step0to1 } from './step-0-to-1.ts'

/** Thrown when durable team state cannot be migrated to the current schema version. */
export class MigrationError extends Error {
  /** @param message - what made the state unmigratable. */
  constructor(message: string) {
    super(message)
    this.name = 'MigrationError'
  }
}

/**
 * One pure migration step per version transition: `steps[i]` upgrades a
 * version-`i` state to version `i + 1`. Append new steps at the end when the
 * schema evolves; never rewrite an already-shipped step.
 */
const steps: readonly ((state: Record<string, unknown>) => Record<string, unknown>)[] = [
  step0to1,
]

/** The schema version this build reads and writes. */
export const CURRENT_SCHEMA_VERSION: number = steps.length

/** Whether a parsed JSON value is a plain object record (arrays excluded). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Upgrade a parsed `team.json` value to the current schema version.
 * @param raw - the freshly `JSON.parse`d state value.
 * @returns the state at {@link CURRENT_SCHEMA_VERSION}; may be the input
 * object itself when no step applies.
 * @throws {@link MigrationError} when the payload is not an object, carries a
 * malformed `schemaVersion`, or comes from a newer build.
 */
export function migrate(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) throw new MigrationError('state must be an object')
  const declared = raw['schemaVersion']
  let version = 0
  if (declared !== undefined) {
    if (typeof declared !== 'number' || !Number.isSafeInteger(declared) || declared < 0) {
      throw new MigrationError(`state schemaVersion ${String(declared)} is not a valid version number`)
    }
    version = declared
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new MigrationError(`state version ${version} is newer than supported`)
  }
  let state: Record<string, unknown> = raw
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = steps[version]
    if (step === undefined) {
      throw new MigrationError(`missing migration step ${version} to ${version + 1}`)
    }
    state = step(state)
    if (!isRecord(state)) {
      throw new MigrationError(`migration step ${version} to ${version + 1} produced a non-object`)
    }
    version += 1
  }
  return state
}
