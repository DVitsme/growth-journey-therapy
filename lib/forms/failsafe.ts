import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Resend } from "resend";
import { sendWithRetry, type ResendErrorLike, type SendOutcome } from "./reliable-send";

/**
 * Durable failsafe for form submissions (contact + careers).
 *
 * When the Resend send fails, the submission is captured to the R2 bucket
 * `gjt-form-failsafe` (binding FORM_FAILSAFE) as one JSON object per
 * submission under month "folders":
 *
 *   submissions/2026-07/2026-07-23T14-05-33-123Z_contact_ab12cd34.json
 *
 * A bucket lifecycle rule auto-deletes objects after 14 days (short retention
 * is deliberate: the record includes the visitor's full message — see
 * docs/CONTACT-FAILSAFE.md). Background retries delete the record on
 * successful re-delivery.
 *
 * Every function here is hermetic — it never throws — because the failsafe
 * must never be the thing that breaks the form.
 *
 * NOTE: getCloudflareContext is only ever called inside function bodies
 * (module-top-level calls would run during build-time prerendering and throw).
 */

export type FailsafeReason = "send-failed" | "send-threw" | "not-configured";

export interface FailsafeEntry {
  form: "contact" | "careers";
  reason: FailsafeReason;
  /** The zod-PARSED payload — never raw FormData (which carries the Turnstile token + honeypot). */
  data: Record<string, unknown>;
  error?: ResendErrorLike | { message: string };
}

function serializeError(e: unknown): { name?: string; message?: string; statusCode?: number | null } {
  if (e && typeof e === "object") {
    const o = e as ResendErrorLike;
    return { name: o.name, message: o.message, statusCode: o.statusCode ?? undefined };
  }
  return { message: String(e) };
}

/** Durable R2 capture. Returns the object key, or false if capture failed. */
export async function captureSubmission(entry: FailsafeEntry): Promise<string | false> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bucket = env.FORM_FAILSAFE;
    if (!bucket) {
      console.error(`[${entry.form}] failsafe: FORM_FAILSAFE binding absent — cannot capture`);
      return false;
    }
    const now = new Date();
    const month = now.toISOString().slice(0, 7); // "2026-07"
    const stamp = now.toISOString().replace(/[:.]/g, "-"); // filename-safe
    const key = `submissions/${month}/${stamp}_${entry.form}_${crypto.randomUUID().slice(0, 8)}.json`;
    await bucket.put(
      key,
      JSON.stringify(
        {
          capturedAt: now.toISOString(),
          form: entry.form,
          reason: entry.reason,
          error: entry.error ? serializeError(entry.error) : undefined,
          data: entry.data,
        },
        null,
        2,
      ),
      { httpMetadata: { contentType: "application/json" } },
    );
    console.log(`[${entry.form}] failsafe: captured ${key}`);
    return key;
  } catch (e) {
    console.error(`[${entry.form}] failsafe: capture FAILED (non-fatal):`, e);
    return false;
  }
}

/** Delete a captured record (used after a successful background re-delivery). */
export async function deleteSubmission(key: string): Promise<void> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    await env.FORM_FAILSAFE?.delete(key);
    console.log(`[failsafe] delivered + deleted ${key}`);
  } catch (e) {
    console.error(`[failsafe] delete failed for ${key} (record will age out via lifecycle):`, e);
  }
}

/**
 * No-PII alert that a submission is being held in the failsafe. Channels, in
 * order: ALERT_WEBHOOK_URL (Discord/Slack-style JSON webhook, as a Worker
 * secret or env var), then the EMAIL send binding (phase 1.5, once destination
 * addresses are verified). Returns true if at least one channel delivered.
 */
export async function sendFailsafeAlert(info: { form: string; reason: string; key: string }): Promise<boolean> {
  const text =
    `growthjourneytherapy.com: a ${info.form} form submission could not be emailed ` +
    `(${info.reason}) and is held in the failsafe bucket as "${info.key}". ` +
    `Cloudflare dashboard → R2 → gjt-form-failsafe. Records auto-delete after 14 days.`;
  let alerted = false;

  const webhook = process.env.ALERT_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // `content` (Discord) + `text` (Slack) — harmless to send both.
        body: JSON.stringify({ content: text, text }),
        signal: AbortSignal.timeout(5000),
      });
      alerted = res.ok;
      if (!res.ok) console.error(`[failsafe] alert webhook returned ${res.status}`);
    } catch (e) {
      console.error("[failsafe] alert webhook failed:", e);
    }
  }

  // Phase 1.5: Cloudflare Email send binding (independent of Resend). Guarded so
  // this is inert until the binding exists + destination addresses are verified.
  try {
    const { env } = await getCloudflareContext({ async: true });
    const email = (env as unknown as {
      EMAIL?: { send: (msg: { to: string; from: string; subject: string; text: string }) => Promise<unknown> };
    }).EMAIL;
    const to = process.env.CONTACT_TO_EMAIL;
    if (email && to) {
      await email.send({ to, from: `alerts@growthjourneytherapy.com`, subject: "Website form failsafe alert", text });
      alerted = true;
    }
  } catch (e) {
    console.error("[failsafe] alert email channel failed:", e);
  }

  if (!alerted) console.error(`[failsafe] NO alert channel delivered — ${text}`);
  return alerted;
}

/**
 * Orchestrates the failure path shared by both forms:
 * capture → alert → schedule background retries (same idempotency key; deletes
 * the record on success). Returns "ok" when the lead is durably captured AND
 * someone was alerted (per the UX decision: don't bounce a visitor whose lead
 * is safe); otherwise returns the caller's original error string so today's
 * retry-or-call UX still applies.
 */
export async function handleSendFailure(opts: {
  form: "contact" | "careers";
  reason: FailsafeReason;
  data: Record<string, unknown>;
  error?: ResendErrorLike | { message: string };
  fallbackError: string;
  /** Present only for retryable failures — enables background re-delivery. */
  retry?: { resend: Resend; payload: Parameters<Resend["emails"]["send"]>[0]; idempotencyKey: string };
}): Promise<{ status: "ok" } | { status: "error"; error: string }> {
  const key = await captureSubmission({ form: opts.form, reason: opts.reason, data: opts.data, error: opts.error });
  if (!key) return { status: "error", error: opts.fallbackError };

  const alerted = await sendFailsafeAlert({ form: opts.form, reason: opts.reason, key });

  if (opts.retry) {
    try {
      const { ctx } = await getCloudflareContext({ async: true });
      const { resend, payload, idempotencyKey } = opts.retry;
      ctx.waitUntil(
        (async () => {
          const bg: SendOutcome = await sendWithRetry(resend, payload, idempotencyKey, {
            attempts: 3,
            timeoutMs: 6000,
            baseDelayMs: 2000,
          });
          if (bg.ok) await deleteSubmission(key);
        })(),
      );
    } catch (e) {
      console.error("[failsafe] background retry scheduling failed:", e);
    }
  }

  return alerted ? { status: "ok" } : { status: "error", error: opts.fallbackError };
}
