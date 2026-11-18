/**
 * Shared deer / panda / cat artwork lookup for the activity panel and the
 * conversation card. The captain is the deer; builder roles use the panda;
 * research, design and review roles use the cat.
 * @module deers-dsh-agent-team/client/artwork
 */
/** Artwork route prefix served by the plugin host half. */
export declare const ART_BASE = "/plugins/deers-dsh-agent-team/assets/";
/** One of the three team characters shipped with the plugin. */
export type TeamCharacter = 'deer' | 'panda' | 'cat';
/** Artwork variants per character: full illustration, paper cutout, sticker. */
export interface CharacterArt {
    full: string;
    paper: string;
    sticker: string;
}
/** Every character's three shipped variants. */
export declare const CHARACTER_ART: Record<TeamCharacter, CharacterArt>;
/** The captain always uses the deer. */
export declare const LEAD_ART: string;
export declare const LEAD_STICKER: string;
export declare const LEAD_FULL: string;
/**
 * Character for one member identity (name + role), defaulting to the deer.
 * @param name - the member's display name.
 * @param role - the member's role text.
 * @returns one of the three shipped characters.
 */
export declare function memberCharacter(name: string, role: string): TeamCharacter;
/**
 * Paper-cutout artwork for a member card or roster row.
 * @param name - the member's display name.
 * @param role - the member's role text.
 */
export declare function memberArtUrl(name: string, role: string): string;
/**
 * Compact sticker artwork for avatars inside the conversation card or chat.
 * @param name - the member's display name.
 * @param role - the member's role text.
 */
export declare function memberStickerUrl(name: string, role: string): string;
/**
 * Full illustration for an empty state or detail header.
 * @param name - the member's display name.
 * @param role - the member's role text.
 */
export declare function memberFullUrl(name: string, role: string): string;
