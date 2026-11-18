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
/** Thrown when durable team state cannot be migrated to the current schema version. */
export declare class MigrationError extends Error {
    /** @param message - what made the state unmigratable. */
    constructor(message: string);
}
/** The schema version this build reads and writes. */
export declare const CURRENT_SCHEMA_VERSION: number;
/**
 * Upgrade a parsed `team.json` value to the current schema version.
 * @param raw - the freshly `JSON.parse`d state value.
 * @returns the state at {@link CURRENT_SCHEMA_VERSION}; may be the input
 * object itself when no step applies.
 * @throws {@link MigrationError} when the payload is not an object, carries a
 * malformed `schemaVersion`, or comes from a newer build.
 */
export declare function migrate(raw: unknown): Record<string, unknown>;
