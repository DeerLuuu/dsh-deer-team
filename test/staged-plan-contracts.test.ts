/** Regression tests for staged-plan contract validation (v0.1.24 incident):
 * a plan row must never overlap itself, serialized same-scope rows must pass,
 * and `repair` cannot be planned because its contract cannot exist yet. */
import { describe, expect, it } from 'vitest'
import { validateStagedGraph } from '../src/tools.ts'
import { validateCreateTask } from '../src/quality-gates.ts'
import { resolveTeamProfile } from '../src/profiles.ts'
import type { TeamState, TeamTask } from '../src/types.ts'

const editorScope = ['editor/script', 'editor/doc', 'editor/gui/code_editor.cpp']

function implementation(id: string, dependencies: string[], inScope: string[] = editorScope): TeamTask {
  return {
    id,
    subject: `Task ${id}`,
    status: 'pending',
    dependencies,
    kind: 'implementation',
    objective: `Objective of ${id}`,
    acceptance: [`acceptance of ${id}`],
    verify: [`node -e "verify ${id}"`],
    inScope,
    attempt: 0,
    revision: 0,
    createdAt: 0,
    updatedAt: 0,
  } as unknown as TeamTask
}

function team(tasks: TeamTask[]): TeamState {
  return {
    name: 'regression',
    id: 'regression',
    captainSessionId: 'captain',
    createdAt: 0,
    phase: 'staged',
    planReviewState: 'awaiting_review',
    members: [{ id: '', name: 'worker', joinedAt: 0, status: 'idle' }],
    tasks,
    taskSeq: tasks.length,
  } as unknown as TeamState
}

describe('staged plan approve-time validation', () => {
  it('never reports a row overlapping itself', () => {
    const state = team([implementation('t1', [])])
    expect(() => validateStagedGraph(state, true)).not.toThrow()
  })

  it('accepts serialized same-scope rows in both dependency directions', () => {
    const ancestorFirst = team([
      implementation('t1', []),
      implementation('t2', ['t1']),
    ])
    expect(() => validateStagedGraph(ancestorFirst, true)).not.toThrow()
    // Transitive chain t3 → t2 → t1 sharing one scope stays serialized.
    const chained = team([
      implementation('t1', []),
      implementation('t2', ['t1']),
      implementation('t3', ['t2']),
    ])
    expect(() => validateStagedGraph(chained, true)).not.toThrow()
  })

  it('rejects genuinely concurrent same-scope rows and names the other row', () => {
    const state = team([
      implementation('t1', []),
      implementation('t2', []),
    ])
    // The approve loop validates rows in order, so the first conflicting row is
    // reported; either perspective is a correct diagnosis of the same conflict.
    expect(() => validateStagedGraph(state, true)).toThrow(/staged task "t[12]": inScope overlaps t[12] at/)
  })

  it('reports a contract violation with the exact row and a fix hint', () => {
    const state = team([{ ...implementation('t1', []), kind: 'repair' } as unknown as TeamTask])
    expect(() => validateStagedGraph(state, true)).toThrow(/staged task "t1": repair tasks require sourceTaskId/)
  })

  it('requires a review row to list its reviewed task in dependencies', () => {
    const state = team([
      implementation('t1', []),
      {
        ...implementation('t2', []),
        kind: 'review',
        reviewedTaskId: 't1',
        dependencies: [],
      } as unknown as TeamTask,
    ])
    expect(() => validateStagedGraph(state, true)).toThrow(/staged task "t2": review tasks must list their reviewed task "t1" in dependencies/)
  })
})

describe('validateCreateTask serialization exemptions', () => {
  const base = team([
    implementation('t1', []),
    implementation('t2', ['t1']),
  ])

  it('exempts an ancestor row via the dependency closure (selfId path)', () => {
    const gate = validateCreateTask(base, {
      subject: 'Task t2',
      kind: 'implementation',
      objective: 'Objective of t2',
      acceptance: ['acceptance of t2'],
      verify: ['node -e "verify t2"'],
      dependencies: ['t1'],
      inScope: editorScope,
      selfId: 't2',
    })
    expect(gate.ok).toBe(true)
  })

  it('exempts a descendant row when validating the ancestor (selfId reverse path)', () => {
    const gate = validateCreateTask(base, {
      subject: 'Task t1',
      kind: 'implementation',
      objective: 'Objective of t1',
      acceptance: ['acceptance of t1'],
      verify: ['node -e "verify t1"'],
      dependencies: [],
      inScope: editorScope,
      selfId: 't1',
    })
    expect(gate.ok).toBe(true)
  })

  it('does not compare a row with itself', () => {
    const only = team([implementation('t1', [])])
    const gate = validateCreateTask(only, {
      subject: 'Task t1',
      kind: 'implementation',
      objective: 'Objective of t1',
      acceptance: ['acceptance of t1'],
      verify: ['node -e "verify t1"'],
      dependencies: [],
      inScope: editorScope,
      selfId: 't1',
    })
    expect(gate.ok).toBe(true)
  })
})

describe('plan/profile rows cannot be repairs', () => {
  it('rejects kind=repair with an actionable message', () => {
    expect(() => resolveTeamProfile({
      plan: {
        members: [{ name: 'worker' }],
        tasks: [{ id: 'fix', subject: 'Fix it', assignee: 'worker', kind: 'repair' as never }],
      },
    }, 'plan', 8)).toThrow(/repair.*cannot be planned/)
  })

  it('accepts an implementation row with a full contract', () => {
    const profile = resolveTeamProfile({
      plan: {
        members: [{ name: 'worker' }],
        tasks: [{ id: 'impl', subject: 'Implement', assignee: 'worker', kind: 'implementation', objective: 'Ship it', acceptance: ['works'], verify: ['node -e 0'], inScope: ['src/'] }],
      },
    }, 'plan', 8)
    expect(profile.tasks[0]!.kind).toBe('implementation')
  })
})
