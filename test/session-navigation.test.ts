import { describe, expect, it, vi } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SubagentAddress } from '@deepseek-ai/dsh-subagent/client'
import {
  currentSessionId,
  openAgentTeamMember,
  type AgentTeamsWorkspaceNavigator,
} from '../src/client/session-navigation.ts'

const parent = 'session-parent' as SessionId
const child = 'session-child' as SessionId
const address: SubagentAddress = { parentSessionId: parent, childSessionId: child, mode: 'continuable' }

/**
 * Harness 0.2.1 removed ISessions navigation ("navigation belongs to view
 * owners") and uiWorkspace.openSession is the surviving action. The workspace
 * navigator must therefore win even when an older `open()` happens to exist,
 * instead of only being reached when `open` is absent.
 */
describe('openAgentTeamMember', () => {
  it('prefers the owned workspace navigation over a legacy open()', async () => {
    const openSession = vi.fn()
    const open = vi.fn()
    const workspace: AgentTeamsWorkspaceNavigator = { openSession }
    const result = await openAgentTeamMember({ open }, parent, child, undefined, workspace)
    expect(result).toBe('subagent')
    expect(openSession).toHaveBeenCalledWith(address)
    expect(open).not.toHaveBeenCalled()
  })

  it('selects the conversation panel alongside workspace navigation', async () => {
    const openSession = vi.fn()
    const selectPanel = vi.fn()
    await openAgentTeamMember({}, parent, child, { selectPanel }, { openSession })
    expect(openSession).toHaveBeenCalledWith(address)
    expect(selectPanel).toHaveBeenCalledWith(null)
  })

  it('still uses the addressed subagent path when no workspace navigator is mounted', async () => {
    const openSubagent = vi.fn()
    const refreshSubagents = vi.fn(async () => {})
    const result = await openAgentTeamMember(
      { openSubagent, refreshSubagents, subagentAddress: () => address },
      parent, child,
    )
    expect(result).toBe('subagent')
    expect(refreshSubagents).toHaveBeenCalledWith(parent)
    expect(openSubagent).toHaveBeenCalledWith(address)
  })

  it('falls back to ordinary session navigation on hosts without either addressed path', async () => {
    const open = vi.fn()
    expect(await openAgentTeamMember({ open }, parent, child)).toBe('session')
    expect(open).toHaveBeenCalledWith(child)
  })

  it('reports a missing navigation surface instead of silently doing nothing', async () => {
    await expect(openAgentTeamMember({}, parent, child)).rejects.toThrow(/session navigation/)
  })

  it('cancels workspace navigation superseded before it happens', async () => {
    const controller = new AbortController()
    controller.abort()
    const openSession = vi.fn()
    expect(await openAgentTeamMember({}, parent, child, { beginNavigation: () => controller.signal }, { openSession })).toBe('cancelled')
    expect(openSession).not.toHaveBeenCalled()
  })
})

describe('currentSessionId', () => {
  it('reads the newest view-owned state and falls back to the retained main view', () => {
    expect(currentSessionId({ current: child, byId: {} })).toBe(child)
    expect(currentSessionId({ byId: { a: { id: parent, retainedBy: { mainView: 1 } } } })).toBe(parent)
    expect(currentSessionId({ byId: { a: { id: parent, retainedBy: {} } } })).toBeUndefined()
  })
})
