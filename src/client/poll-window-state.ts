/**
 * Shared state for the dedicated poll floating window.
 *
 * The team section's vote button opens the window; the floater registered in
 * `shell.overlay` subscribes here. Module-scoped because the client plugin has
 * exactly one instance per page.
 * @module deers-dsh-agent-team/client/poll-window-state
 */

/** Which team's polls the floater shows. */
export interface PollWindowTarget {
  teamId: string
  captainSessionId: string
  teamName: string
  /** Archived/historic teams render results without voting controls. */
  readOnly?: boolean
}

let target: PollWindowTarget | null = null
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of [...listeners]) listener()
}

/** Open (or retarget) the poll window. */
export function openPollWindow(next: PollWindowTarget): void {
  target = next
  emit()
}

/** Close the poll window. */
export function closePollWindow(): void {
  if (target === null) return
  target = null
  emit()
}

/** Current target; `useSyncExternalStore` snapshot. */
export function getPollWindow(): PollWindowTarget | null {
  return target
}

/** Subscribe to open/close/retarget. */
export function subscribePollWindow(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
