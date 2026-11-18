/**
 * Poll panel: team-wide single/multi-choice votes the human can create and
 * join. The browser acts as the captain (same authority as the captain
 * helpers), while members vote through `deers_team_vote_cast`.
 * @module deers-dsh-agent-team/client/PollPanel
 */
import type { AgentTeamsTranslate } from './locales.ts';
/** One team's polls; collapsed until opened. */
export declare function PollPanel({ teamId, captainSessionId, t, readOnly, embedded }: {
    readonly teamId: string;
    readonly captainSessionId: string;
    readonly t: AgentTeamsTranslate;
    readonly readOnly?: boolean;
    /** Render the full panel without its own collapse toggle (floating window). */
    readonly embedded?: boolean;
}): import("react").JSX.Element;
