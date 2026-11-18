/**
 * Shared blackboard panel: the human side of the team's brainstorming feed.
 *
 * Reads `GET /plugins/deers-dsh-agent-team/blackboard` and writes through the
 * same route (post / vote / cleanup). The human acts as the captain, matching
 * the captain-authored messages the model tools already attribute to `captain`.
 * @module deers-dsh-agent-team/client/BlackboardPanel
 */
import type { AgentTeamsTranslate } from './locales.ts';
/** One team's blackboard, collapsed until the human opens it. */
export declare function BlackboardPanel({ teamId, captainSessionId, t, readOnly }: {
    readonly teamId: string;
    readonly captainSessionId: string;
    readonly t: AgentTeamsTranslate;
    readonly readOnly?: boolean;
}): import("react").JSX.Element;
