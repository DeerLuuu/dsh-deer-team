import { describe, expect, it } from 'vitest'
import { CURRENT_SCHEMA_VERSION, MigrationError, migrate } from '../src/migrations/index.ts'
import { step0to1 } from '../src/migrations/step-0-to-1.ts'

/** A realistic v0 team record (pre-versioning shape, no `schemaVersion`). */
function v0State(): Record<string, unknown> {
  return {
    name: 'deerszero-baseline',
    id: 'deerszero-baseline',
    description: 'imported archive',
    captainSessionId: 'session-1',
    createdAt: 1_700_000_000_000,
    phase: 'staged',
    planReviewState: 'awaiting_review',
    members: [{ id: 'm1', name: 'alpha', joinedAt: 1, status: 'idle' }],
    tasks: [{ id: 't1', subject: 'first', status: 'pending', dependencies: [], createdAt: 1, updatedAt: 1 }],
    taskSeq: 2,
  }
}

describe('step0to1', () => {
  it('stamps schemaVersion 1 and keeps every existing field', () => {
    const v0 = v0State()
    expect(step0to1(v0)).toEqual({ ...v0, schemaVersion: 1 })
  })

  it('is pure: the input object is not mutated', () => {
    const v0 = v0State()
    const snapshot = structuredClone(v0)
    step0to1(v0)
    expect(v0).toEqual(snapshot)
  })
})

describe('migrate', () => {
  it('upgrades a v0 object (no schemaVersion) to version 1, keeping all fields', () => {
    const v0 = v0State()
    expect(migrate(v0)).toEqual({ ...v0, schemaVersion: 1 })
  })

  it('treats an explicit schemaVersion 0 like v0', () => {
    expect(migrate({ name: 'x', schemaVersion: 0 })).toEqual({ name: 'x', schemaVersion: 1 })
  })

  it('passes an already-current object through unchanged (no double migration)', () => {
    const v1 = { ...v0State(), schemaVersion: CURRENT_SCHEMA_VERSION }
    const result = migrate(v1)
    expect(result).toEqual(v1)
    expect(result).toBe(v1)
  })

  it('throws MigrationError for a version newer than supported', () => {
    expect(() => migrate({ name: 'x', schemaVersion: 99 })).toThrow(MigrationError)
    expect(() => migrate({ name: 'x', schemaVersion: 99 })).toThrow('state version 99 is newer than supported')
  })

  it('throws MigrationError for non-object input', () => {
    for (const bad of [null, undefined, 42, 'team', true, [], [{ schemaVersion: 1 }]]) {
      expect(() => migrate(bad)).toThrow(MigrationError)
    }
    expect(() => migrate(null)).toThrow('state must be an object')
  })

  it('throws MigrationError for malformed schemaVersion values (bad data)', () => {
    for (const bad of ['1', null, 1.5, -1, Number.NaN]) {
      expect(() => migrate({ name: 'x', schemaVersion: bad })).toThrow(MigrationError)
    }
  })
})
