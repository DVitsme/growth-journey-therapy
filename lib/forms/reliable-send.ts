import type { Resend } from "resend";

/**
 * Retrying Resend send with idempotency keys.
 *
 * Facts this leans on (verified against the installed resend@6 SDK):
 * - `resend.emails.send()` NEVER throws for our text-only payloads — every
 *   outcome resolves to `{ data, error, headers }`. Network failures / aborts
 *   come back as `error.statusCode === null` ("application_error").
 * - The second argument accepts `idempotencyKey` (sent as the Idempotency-Key
 *   header; Resend stores keys 24h), so retries — including the background and
 *   any future cron retries — can never double-send.
 * - `options` is spread into the fetch init, so an AbortSignal passes through
 *   at runtime even though the typed options omit it (hence one narrow cast).
 */

type SendPayload = Parameters<Resend["emails"]["send"]>[0];
type SendOptions = NonNullable<Parameters<Resend["emails"]["send"]>[1]>;

export type ResendErrorLike = { name?: string; message?: string; statusCode?: number | null };

export type SendOutcome =
  | { ok: true; id?: string }
  | { ok: false; class: "retryable" | "deferred" | "fatal"; error: ResendErrorLike };

/** Errors where retrying cannot help (bad key, invalid payload, …). */
const FATAL = new Set([
  "missing_api_key",
  "restricted_api_key",
  "invalid_api_key",
  "validation_error",
  "invalid_attachment",
  "invalid_from_address",
  "invalid_access",
  "invalid_parameter",
  "invalid_region",
  "missing_required_field",
  "not_found",
  "method_not_allowed",
  "security_error",
  "invalid_idempotent_request",
]);

export function classifySendError(e: ResendErrorLike): "retryable" | "deferred" | "fatal" {
  if (e.statusCode == null) return "retryable"; // network / timeout / abort sentinel
  if (e.name === "daily_quota_exceeded" || e.name === "monthly_quota_exceeded") return "deferred";
  if (e.statusCode >= 500 || e.name === "rate_limit_exceeded" || e.name === "concurrent_idempotent_requests") {
    return "retryable";
  }
  return FATAL.has(e.name ?? "") ? "fatal" : "fatal";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send with a hard per-attempt timeout and bounded jittered retries.
 * Resolves — never rejects. Reuse the SAME payload + idempotencyKey across
 * every retry layer (a changed payload under the same key is a Resend 409).
 */
export async function sendWithRetry(
  resend: Resend,
  payload: SendPayload,
  idempotencyKey: string,
  { attempts = 2, timeoutMs = 4000, baseDelayMs = 400 }: { attempts?: number; timeoutMs?: number; baseDelayMs?: number } = {},
): Promise<SendOutcome> {
  let last: ResendErrorLike = { name: "application_error", statusCode: null, message: "no attempt ran" };
  for (let i = 0; i < attempts; i++) {
    const res = await resend.emails.send(payload, {
      idempotencyKey,
      signal: AbortSignal.timeout(timeoutMs),
    } as SendOptions & { signal: AbortSignal });
    if (res.data) return { ok: true, id: res.data.id };
    last = (res.error ?? { name: "application_error", statusCode: null, message: "unknown" }) as ResendErrorLike;
    const cls = classifySendError(last);
    if (cls !== "retryable" || i === attempts - 1) return { ok: false, class: cls, error: last };
    // Honor a short retry-after if present; else jittered linear backoff.
    const retryAfterMs = Number((res as { headers?: Record<string, string> | null }).headers?.["retry-after"]) * 1000;
    await sleep(
      Number.isFinite(retryAfterMs) && retryAfterMs > 0 && retryAfterMs <= 2000
        ? retryAfterMs
        : baseDelayMs * (i + 1) + Math.random() * 300,
    );
  }
  return { ok: false, class: classifySendError(last), error: last };
}
