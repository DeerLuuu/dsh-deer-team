/**
 * Captain report coalescing ("Router batching").
 *
 * Member reports and `send_message` deliveries to the captain are normally one
 * steering message each. Under load that wakes the Router once per report;
 * this batcher collects reports for a short window and injects one combined
 * message instead. Messages stay durable in the mailbox either way, so a failed
 * steer only delays the live wake, never loses the report.
 * @module deers-dsh-agent-team/notify-batch
 */
import { createUserMessage } from '@deepseek-ai/dsh-llm';
const state = { windowMs: 0, maxItems: 8 };
const queues = new Map();
/** Update batching options (called once from the plugin config). */
export function configureCaptainBatching(options) {
    if (options.windowMs !== undefined)
        state.windowMs = Math.max(0, Math.trunc(options.windowMs));
    if (options.maxItems !== undefined)
        state.maxItems = Math.max(1, Math.trunc(options.maxItems));
}
/** Current effective window (0 = disabled). */
export function captainBatchWindowMs() {
    return state.windowMs;
}
function steer(captain, from, content, receipt) {
    try {
        captain.steer(createUserMessage({
            content: [{ type: 'text', text: receipt ?? `AgentTeams message from member ${from}:\n\n${content}` }],
            source: { kind: 'deers-agent-team' },
        }));
        return true;
    }
    catch {
        return false;
    }
}
function flush(key) {
    const queue = queues.get(key);
    if (queue === undefined)
        return;
    if (queue.timer !== null)
        clearTimeout(queue.timer);
    queues.delete(key);
    if (queue.items.length === 0)
        return;
    if (queue.items.length === 1) {
        const item = queue.items[0];
        if (item !== undefined)
            steer(queue.captain, item.from, item.content, item.receipt);
        return;
    }
    const body = [
        `AgentTeams: ${queue.items.length} reports (coalesced over ${state.windowMs}ms)`,
        '',
        ...queue.items.map((item, index) => `${index + 1}) from ${item.from}: ${item.content}`),
    ].join('\n');
    steer(queue.captain, 'batch', body, body);
}
/**
 * Deliver one captain report, coalescing when enabled.
 *
 * Running captains receive the steer immediately (their next step already
 * exists); idle captains are batched for up to `windowMs` so a burst of
 * reports wakes them once.
 * @returns whether the report was accepted (queued or steered directly).
 */
export function batchCaptainReport(captain, from, content, receipt) {
    if (state.windowMs <= 0 || captain.status === 'running') {
        return steer(captain, from, content, receipt);
    }
    const key = String(captain.id);
    let queue = queues.get(key);
    if (queue === undefined) {
        queue = { captain, items: [], timer: null };
        queues.set(key, queue);
    }
    queue.captain = captain;
    queue.items.push({ from, content, receipt });
    if (queue.items.length >= state.maxItems) {
        flush(key);
        return true;
    }
    if (queue.timer === null) {
        queue.timer = setTimeout(() => flush(key), state.windowMs);
        if (typeof queue.timer === 'object' && typeof queue.timer.unref === 'function') {
            queue.timer.unref();
        }
    }
    return true;
}
/** Flush one captain queue, or every queue when no id is supplied. */
export function flushCaptainReports(captainId) {
    if (captainId !== undefined) {
        flush(String(captainId));
        return;
    }
    for (const key of [...queues.keys()])
        flush(key);
}
/** Flush and forget every queued report (plugin teardown). */
export function disposeCaptainBatching() {
    flushCaptainReports();
    queues.clear();
}
