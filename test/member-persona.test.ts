import { describe, expect, it } from 'vitest'
import { memberPersona, memberWelcome } from '../src/members.ts'
import type { TeamMember, TeamState } from '../src/types.ts'

const team: TeamState = {
  name: 'persona-fixture',
  id: 'persona-fixture',
  description: 'skill injection fixture',
  captainSessionId: 'session-persona-test',
  createdAt: 1_700_000_000_000,
  members: [],
  tasks: [],
  taskSeq: 0,
}

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return { id: '', name: 'alice', role: 'engineer', joinedAt: 1, status: 'idle', ...overrides }
}

describe('memberPersona skill injection (spec §10.2)', () => {
  it('appends the skills section for a member with skills', () => {
    const persona = memberPersona(team, member({ skills: ['test-driven-development'] }), '.deers-agent-team')
    expect(persona).toContain('## Skills you must use')
    expect(persona).toContain('- test-driven-development')
    // The section is the tail of the persona, after the working rules.
    expect(persona.trimEnd().endsWith('- test-driven-development')).toBe(true)
  })

  it('lists every assigned skill, one bullet each', () => {
    const persona = memberPersona(team, member({ skills: ['test-driven-development', 'systematic-debugging'] }), '.deers-agent-team')
    expect(persona).toContain('## Skills you must use')
    expect(persona).toContain('- test-driven-development')
    expect(persona).toContain('- systematic-debugging')
    expect(persona.indexOf('## Skills you must use')).toBeLessThan(persona.indexOf('- test-driven-development'))
  })

  it('omits the section when the member has no skills field', () => {
    const persona = memberPersona(team, member(), '.deers-agent-team')
    expect(persona).not.toContain('## Skills you must use')
    expect(persona).not.toContain('test-driven-development')
  })

  it('omits the section for an empty skills array', () => {
    const persona = memberPersona(team, member({ skills: [] }), '.deers-agent-team')
    expect(persona).not.toContain('## Skills you must use')
  })

  it('keeps the rest of the persona intact alongside the section', () => {
    const withSkills = memberPersona(team, member({ skills: ['test-driven-development'] }), '.deers-agent-team')
    const withoutSkills = memberPersona(team, member(), '.deers-agent-team')
    expect(withSkills.startsWith(withoutSkills)).toBe(true)
    expect(withSkills).toContain('deers_team_claim_task')
    expect(withSkills).toContain('.deers-agent-team/persona-fixture/')
  })

  it('does not disturb the welcome message', () => {
    const welcome = memberWelcome(team, 'alice')
    expect(welcome).not.toContain('## Skills you must use')
  })
})
