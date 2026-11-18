/**
 * Shared deer / panda / cat artwork lookup for the activity panel and the
 * conversation card. The captain is the deer; builder roles use the panda;
 * research, design and review roles use the cat.
 * @module deers-dsh-agent-team/client/artwork
 */
/** Artwork route prefix served by the plugin host half. */
export const ART_BASE = '/plugins/deers-dsh-agent-team/assets/';
/** Every character's three shipped variants. */
export const CHARACTER_ART = {
    deer: {
        full: `${ART_BASE}deer-full.webp`,
        paper: `${ART_BASE}deer-paper.webp`,
        sticker: `${ART_BASE}deer-sticker.png`,
    },
    panda: {
        full: `${ART_BASE}panda-full.webp`,
        paper: `${ART_BASE}panda-paper.webp`,
        sticker: `${ART_BASE}panda-sticker.png`,
    },
    cat: {
        full: `${ART_BASE}cat-full.webp`,
        paper: `${ART_BASE}cat-paper.png`,
        sticker: `${ART_BASE}cat-sticker.png`,
    },
};
/**
 * Role keyword → character. Review/research/design come first so compound
 * titles such as "QA Engineer" or "Design Researcher" do not fall into the
 * builder bucket; builders use the panda, everything else the deer.
 */
const ROLE_CHARACTER = [
    [/qa\b|test|verif|quality|secur|audit|risk|review|docs|writer|product|spec|resear|investig|explor|study|design|\bui\b|\bux\b|front|theme|accessib|测试|质量|验证|安全|审计|审查|风险|文档|撰写|文案|写作|规范|研究|调查|探索|调研|设计|前端|主题|无障碍/, 'cat'],
    [/coordinat|operator|release|deploy|\bops\b|lead|captain|协调|运营|发布|部署|运维|队长/, 'deer'],
    [/engineer|dev\b|server|backend|\bapi\b|runtime|data|analys|metric|performance|\bbuild\b|\bci\b|ship|watcher|contract|工程|后端|服务|接口|开发|代码|编程|数据|分析|指标|性能|构建/, 'panda'],
];
/** The captain always uses the deer. */
export const LEAD_ART = CHARACTER_ART.deer.paper;
export const LEAD_STICKER = CHARACTER_ART.deer.sticker;
export const LEAD_FULL = CHARACTER_ART.deer.full;
/**
 * Character for one member identity (name + role), defaulting to the deer.
 * @param name - the member's display name.
 * @param role - the member's role text.
 * @returns one of the three shipped characters.
 */
export function memberCharacter(name, role) {
    const identity = `${name} ${role}`.toLowerCase();
    for (const [pattern, character] of ROLE_CHARACTER) {
        if (pattern.test(identity))
            return character;
    }
    return 'deer';
}
/**
 * Paper-cutout artwork for a member card or roster row.
 * @param name - the member's display name.
 * @param role - the member's role text.
 */
export function memberArtUrl(name, role) {
    return CHARACTER_ART[memberCharacter(name, role)].paper;
}
/**
 * Compact sticker artwork for avatars inside the conversation card or chat.
 * @param name - the member's display name.
 * @param role - the member's role text.
 */
export function memberStickerUrl(name, role) {
    return CHARACTER_ART[memberCharacter(name, role)].sticker;
}
/**
 * Full illustration for an empty state or detail header.
 * @param name - the member's display name.
 * @param role - the member's role text.
 */
export function memberFullUrl(name, role) {
    return CHARACTER_ART[memberCharacter(name, role)].full;
}
