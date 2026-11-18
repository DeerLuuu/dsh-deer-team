/**
 * Migration step v0 → v1: stamp the initial schema version.
 * @module deers-dsh-agent-team/migrations/step-0-to-1
 */

/**
 * Upgrade a v0 team state (no `schemaVersion` field) to v1.
 *
 * v1 is the versioning baseline, so the only change is stamping
 * `schemaVersion: 1`; every existing field passes through unchanged. The step
 * is a pure function — no IO, no input mutation; writing the migrated record
 * back to `team.json` is the caller's job.
 * @param state - the v0 state object.
 * @returns a new record equal to `state` plus `schemaVersion: 1`.
 */
export function step0to1(state: Record<string, unknown>): Record<string, unknown> {
  return { ...state, schemaVersion: 1 }
}
