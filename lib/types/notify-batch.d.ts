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
import type { Agent } from '@deepseek-ai/dsh-agent';
/** Batching configuration; `windowMs <= 0` disables coalescing. */
export interface CaptainBatchOptions {
    windowMs: number;
    maxItems: number;
}
/** Update batching options (called once from the plugin config). */
export declare function configureCaptainBatching(options: Partial<CaptainBatchOptions>): void;
/** Current effective window (0 = disabled). */
export declare function captainBatchWindowMs(): number;
/**
 * Deliver one captain report, coalescing when enabled.
 *
 * Running captains receive the steer immediately (their next step already
 * exists); idle captains are batched for up to `windowMs` so a burst of
 * reports wakes them once.
 * @returns whether the report was accepted (queued or steered directly).
 */
export declare function batchCaptainReport(captain: Pick<Agent, 'id' | 'steer'> & {
    status?: string;
}, from: string, content: string, receipt?: string): boolean;
/** Flush one captain queue, or every queue when no id is supplied. */
export declare function flushCaptainReports(captainId?: string): void;
/** Flush and forget every queued report (plugin teardown). */
export declare function disposeCaptainBatching(): void;
