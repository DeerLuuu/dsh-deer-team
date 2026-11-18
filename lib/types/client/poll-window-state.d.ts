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
    teamId: string;
    captainSessionId: string;
    teamName: string;
    /** Archived/historic teams render results without voting controls. */
    readOnly?: boolean;
}
/** Open (or retarget) the poll window. */
export declare function openPollWindow(next: PollWindowTarget): void;
/** Close the poll window. */
export declare function closePollWindow(): void;
/** Current target; `useSyncExternalStore` snapshot. */
export declare function getPollWindow(): PollWindowTarget | null;
/** Subscribe to open/close/retarget. */
export declare function subscribePollWindow(listener: () => void): () => void;
