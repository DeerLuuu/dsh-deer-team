/**
 * The `deers_team_blackboard_*` tools.
 *
 * The blackboard is the team's shared, durable side channel: every
 * participant (captain and members) can append entries, read the whole feed
 * and vote on proposals. It is meant for brainstorming sessions, idea
 * collection and feature votes — work that is not yet a task.
 *
 * Tools own identity resolution, locking and persistence; the pure state
 * transformations live in `../blackboard.ts`.
 * @module deers-dsh-agent-team/tools/blackboard
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
import { join } from 'node:path';
import { BLACKBOARD_DEFAULT_LIMIT, BLACKBOARD_MAX_CONTENT, BLACKBOARD_MAX_LIMIT, blackboardOf, clearBlackboard, postBlackboardEntry, readBlackboard, renderBlackboard, voteBlackboardEntry, } from "../blackboard.js";
import { CAPTAIN_KEY, findTeamByParticipant, readTeam, withTeamLock, writeTeam } from "../state.js";
/** The calling agent, or a loud failure for non-agent callers. */
function requireAgent(exec) {
    if (!exec.agent) {
        throw new Error('deers_team blackboard tools require a calling agent (exec.agent was undefined)');
    }
    return exec.agent;
}
/** The captain's workspace directory (team state root parent). */
function workspaceOf(agent) {
    return agent.session.header.cwd ?? process.cwd();
}
/** Resolved absolute state root. */
function stateRootOf(workspace, config) {
    return join(workspace, config.stateDir);
}
/** Process-local lock key scoped by workspace state root and team id. */
function teamLockKey(stateRoot, teamId) {
    return `team:${stateRoot}:${teamId}`;
}
function participantIdentityOf(team, agentId) {
    if (team.captainSessionId === agentId)
        return { kind: 'captain', name: CAPTAIN_KEY };
    const member = team.members.find((candidate) => candidate.id === agentId && candidate.status !== 'removed');
    return member === undefined ? undefined : { kind: 'member', name: member.name };
}
/**
 * Resolve the caller's team, lock it, re-read fresh state and hand the caller
 * its identity. The callback persists the team record itself.
 */
async function withCallerTeam(config, exec, fn) {
    const caller = requireAgent(exec);
    const stateRoot = stateRootOf(workspaceOf(caller), config);
    const located = await findTeamByParticipant(stateRoot, caller.id);
    if (located === undefined) {
        throw new Error('you do not lead or belong to any active team yet');
    }
    return withTeamLock(teamLockKey(stateRoot, located.id), async () => {
        const team = await readTeam(stateRoot, located.id);
        if (team === undefined)
            throw new Error(`team "${located.id}" is no longer active`);
        const identity = participantIdentityOf(team, caller.id);
        if (identity === undefined) {
            throw new Error(`you are no longer an active participant in team "${team.name}"`);
        }
        return fn({ team, identity, stateRoot });
    });
}
/** Shared entry object schema for read output. */
const readEntrySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        id: { type: 'string', required: true },
        author: { type: 'string', required: true },
        kind: { type: 'string', required: true },
        content: { type: 'string', required: true },
        created_at: { type: 'integer', required: true },
        pinned: { type: 'boolean', required: true },
        votes_up: { type: 'integer', required: true },
        votes_down: { type: 'integer', required: true },
        voters_up: { type: 'array', items: { type: 'string' }, required: true },
        voters_down: { type: 'array', items: { type: 'string' }, required: true },
    },
};
/**
 * Build the blackboard tool set. Registration order is stable: post, read,
 * vote, clear.
 * @param _ctx - host context (unused; kept for the factory shape of sibling tools).
 * @param config - resolved plugin config (state directory name).
 */
export function createBlackboardTools(_ctx, config) {
    const post = defineTool({
        name: 'deers_team_blackboard_post',
        description: 'Append one entry to the team blackboard: a durable shared feed every team member can read. Use it for brainstorming, collected ideas, feature proposals and decisions that are not yet tasks. Entries are append-only; later entries can reference earlier ids.',
        parameters: {
            content: { type: 'string', required: true, description: 'Entry text (plain text or light Markdown, up to 4000 chars).' },
            kind: { type: 'string', description: 'Entry kind: note (default), idea, proposal or decision.' },
            pinned: { type: 'boolean', description: 'Captain only: pin the entry so reads list it first and trimming keeps it.' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    team_id: { type: 'string', required: true },
                    entry_id: { type: 'string', required: true },
                    author: { type: 'string', required: true },
                    kind: { type: 'string', required: true },
                    ts: { type: 'integer', required: true },
                    count: { type: 'integer', required: true },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: `Posted ${value.entry_id} (${value.kind}) as ${value.author}; the board now has ${value.count} entries.`,
                }],
        },
        async execute(args, exec) {
            return withCallerTeam(config, exec, async ({ team, identity, stateRoot }) => {
                if (args.pinned === true && identity.kind !== 'captain') {
                    throw new Error('only the captain may pin blackboard entries');
                }
                const entry = postBlackboardEntry(team, {
                    author: identity.name,
                    kind: args.kind,
                    content: args.content,
                    pinned: args.pinned === true,
                });
                await writeTeam(stateRoot, team);
                return {
                    team_id: team.id,
                    entry_id: entry.id,
                    author: entry.author,
                    kind: entry.kind,
                    ts: entry.createdAt,
                    count: blackboardOf(team).entries.length,
                };
            });
        },
    });
    const read = defineTool({
        name: 'deers_team_blackboard_read',
        description: `Read the team blackboard, oldest entry first. Every participant sees the whole board; use it at the start of a brainstorming or voting round and before proposing a decision. Returns at most ${BLACKBOARD_MAX_LIMIT} entries (default ${BLACKBOARD_DEFAULT_LIMIT}); ids are stable for deers_team_blackboard_vote.`,
        parameters: {
            author: { type: 'string', description: 'Only entries authored by this participant ("captain" or a member name).' },
            kind: { type: 'string', description: 'Only entries of this kind: note, idea, proposal or decision.' },
            limit: { type: 'number', description: `How many latest entries to return (1-${BLACKBOARD_MAX_LIMIT}, default ${BLACKBOARD_DEFAULT_LIMIT}).` },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    team_id: { type: 'string', required: true },
                    total: { type: 'integer', required: true },
                    entries: { type: 'array', items: readEntrySchema, required: true },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: renderBlackboard(value.entries.map((entry) => ({ ...entry, kind: entry.kind })), value.total),
                }],
        },
        async execute(args, exec) {
            return withCallerTeam(config, exec, async ({ team }) => {
                const result = readBlackboard(team, {
                    author: args.author,
                    kind: args.kind,
                    limit: typeof args.limit === 'number' ? args.limit : undefined,
                });
                return { team_id: team.id, total: result.total, entries: result.entries };
            });
        },
    });
    const vote = defineTool({
        name: 'deers_team_blackboard_vote',
        description: 'Cast, switch or clear your informal up/down reaction on one blackboard entry. Each participant has at most one reaction per entry. Formal team votes (single/multi choice with explicit options) use deers_team_vote_create / cast / read / close instead. Read ids with deers_team_blackboard_read.',
        parameters: {
            entry_id: { type: 'string', required: true, description: 'Entry id from deers_team_blackboard_read (for example bb-3).' },
            vote: { type: 'string', required: true, description: 'up (support), down (oppose) or clear (remove your vote).' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    team_id: { type: 'string', required: true },
                    entry_id: { type: 'string', required: true },
                    vote: { type: 'string', required: true },
                    votes_up: { type: 'integer', required: true },
                    votes_down: { type: 'integer', required: true },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: `Vote recorded on ${value.entry_id}: ▲${value.votes_up} ▼${value.votes_down}.`,
                }],
        },
        async execute(args, exec) {
            const choice = String(args.vote ?? '').trim().toLowerCase();
            if (choice !== 'up' && choice !== 'down' && choice !== 'clear') {
                throw new Error('vote must be "up", "down" or "clear"');
            }
            return withCallerTeam(config, exec, async ({ team, identity, stateRoot }) => {
                const result = voteBlackboardEntry(team, {
                    entryId: String(args.entry_id ?? '').trim(),
                    voter: identity.name,
                    vote: choice,
                });
                await writeTeam(stateRoot, team);
                return {
                    team_id: team.id,
                    entry_id: result.entry.id,
                    vote: choice,
                    votes_up: result.tally.up,
                    votes_down: result.tally.down,
                };
            });
        },
    });
    const clear = defineTool({
        name: 'deers_team_blackboard_clear',
        description: 'Clear every entry on the team blackboard. Captain only, and destructive: use it only after the brainstorming or voting round is concluded and the captain has summarized the outcome (or the user explicitly asked to reset the board).',
        parameters: {
            confirm: { type: 'boolean', required: true, description: 'Must be true; guards against accidental wipes.' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    team_id: { type: 'string', required: true },
                    removed: { type: 'integer', required: true },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: `Cleared ${value.removed} blackboard entries.`,
                }],
        },
        async execute(args, exec) {
            if (args.confirm !== true)
                throw new Error('deers_team_blackboard_clear requires confirm: true');
            return withCallerTeam(config, exec, async ({ team, identity, stateRoot }) => {
                if (identity.kind !== 'captain')
                    throw new Error('only the captain may clear the blackboard');
                const removed = clearBlackboard(team);
                await writeTeam(stateRoot, team);
                return { team_id: team.id, removed };
            });
        },
    });
    return [post, read, vote, clear];
}
/** Content limit re-exported for tool descriptions and tests. */
export { BLACKBOARD_MAX_CONTENT };
/** Append one captain-authored entry; shared by the panel route and tests. */
export async function appendCaptainBlackboardEntry(input) {
    const content = String(input.content ?? '').trim();
    if (content === '')
        throw new Error('blackboard content must not be empty');
    return withTeamLock(teamLockKey(input.stateRoot, input.teamId), async () => {
        const team = await readTeam(input.stateRoot, input.teamId);
        if (team === undefined)
            throw new Error(`team "${input.teamId}" is no longer active`);
        if (team.captainSessionId !== input.captainId) {
            throw new Error(`only the captain of team "${team.name}" may post as the captain`);
        }
        const entry = postBlackboardEntry(team, {
            author: CAPTAIN_KEY,
            content,
            kind: input.kind,
            pinned: input.pinned === true,
        });
        await writeTeam(input.stateRoot, team);
        return { entryId: entry.id, author: entry.author, kind: entry.kind, ts: entry.createdAt, count: blackboardOf(team).entries.length };
    });
}
/** Cast or clear the captain's vote; shared by the panel route and tests. */
export async function castCaptainBlackboardVote(input) {
    return withTeamLock(teamLockKey(input.stateRoot, input.teamId), async () => {
        const team = await readTeam(input.stateRoot, input.teamId);
        if (team === undefined)
            throw new Error(`team "${input.teamId}" is no longer active`);
        if (team.captainSessionId !== input.captainId) {
            throw new Error(`only the captain of team "${team.name}" may vote as the captain`);
        }
        const result = voteBlackboardEntry(team, { entryId: input.entryId, voter: CAPTAIN_KEY, vote: input.vote });
        await writeTeam(input.stateRoot, team);
        return { entryId: result.entry.id, votesUp: result.tally.up, votesDown: result.tally.down };
    });
}
