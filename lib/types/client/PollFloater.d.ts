/**
 * Dedicated poll floating window.
 *
 * Opened from the team section's vote button, rendered in the shell overlay so
 * it stays usable while the activity panel is folded or the conversation
 * scrolls. The body is the same PollPanel used inline, in embedded mode.
 * @module deers-dsh-agent-team/client/PollFloater
 */
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
/** Floating poll window; renders nothing until a team is targeted. */
export declare function PollFloater({ t }: PropsLocale<'agentTeams'>): import("react").JSX.Element | null;
