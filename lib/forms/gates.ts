import { headers } from "next/headers";

/**
 * Shared pre-send gates for the contact + careers forms (extracted from the two
 * actions, which previously carried copy-pasted implementations).
 */

/** Honeypot + timing gate. True ⇒ caller should silently return {status:"ok"}. */
export function isLikelySpam(formData: FormData): boolean {
  // 1. honeypot: a hidden field real users never fill
  if ((formData.get("website") ?? "") !== "") return true;
  // 2. timing: humans take more than ~3s to complete the form
  const startedAt = Number(formData.get("startedAt"));
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 3000) return true;
  return false;
}

export type TurnstileResult = "pass" | "fail" | "unconfigured";

/**
 * Cloudflare Turnstile verification. Never throws. Semantics preserved from the
 * original per-action implementations: callers reject only when the result is
 * "fail" AND NODE_ENV === "production" (dev stays log-and-allow so the flow is
 * testable without a real widget).
 */
export async function checkTurnstile(formData: FormData): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return "unconfigured";
  const token = formData.get("cf-turnstile-response");
  if (typeof token !== "string" || !token) {
    // The highest-signal diagnostic we have. No token means the widget never
    // produced one (never mounted, or an unsolved challenge) — a broken-for-humans
    // signal, not an attacker. Measured 2026-08-21: ~23% of challenged real
    // browsers never solve. Capture-on-refusal: docs/CONTACT-FAILSAFE.md.
    console.error("[turnstile] submission carried NO token — widget produced nothing");
    return "fail";
  }
  try {
    const h = await headers();
    const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for");
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success) return "pass";
    console.error("[turnstile] siteverify rejected the token:", data["error-codes"] ?? []);
    return "fail";
  } catch (e) {
    // NOTE: this also fails CLOSED when siteverify is simply unreachable, which
    // turns a Cloudflare outage into "nobody can contact this practice". Splitting
    // that case out is the next fix; it needs a richer return type than this.
    console.error("[turnstile] siteverify unreachable, refusing:", e);
    return "fail";
  }
}
