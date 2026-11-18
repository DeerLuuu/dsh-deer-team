/**
 * Shared state for the dedicated poll floating window.
 *
 * The team section's vote button opens the window; the floater registered in
 * `shell.overlay` subscribes here. Module-scoped because the client plugin has
 * exactly one instance per page.
 * @module deers-dsh-agent-team/client/poll-window-state
 */
let target = null;
const listeners = new Set();
function emit() {
    for (const listener of [...listeners])
        listener();
}
/** Open (or retarget) the poll window. */
export function openPollWindow(next) {
    target = next;
    emit();
}
/** Close the poll window. */
export function closePollWindow() {
    if (target === null)
        return;
    target = null;
    emit();
}
/** Current target; `useSyncExternalStore` snapshot. */
export function getPollWindow() {
    return target;
}
/** Subscribe to open/close/retarget. */
export function subscribePollWindow(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
