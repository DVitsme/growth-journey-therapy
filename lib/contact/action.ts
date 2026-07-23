"use server";

import { Resend } from "resend";
import { inquirySchema } from "./schema";
import { InquiryConfirmation } from "@/emails/inquiry";
import { SITE_URL } from "@/lib/site";
import { isLikelySpam, checkTurnstile } from "@/lib/forms/gates";
import { sendWithRetry } from "@/lib/forms/reliable-send";
import { handleSendFailure } from "@/lib/forms/failsafe";

export type ContactState = {
  status: "idle" | "ok" | "error";
  /** "invalid" | "captcha" | "not-configured" | "send-failed" */
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // --- spam gates (before anything expensive); silently drop bots ----------
  if (isLikelySpam(formData)) return { status: "ok" };

  // --- validate ------------------------------------------------------------
  const parsed = inquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: "invalid", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const name = `${d.firstName} ${d.lastName}`.trim();
  // Failsafe record: the full parsed submission (client-approved capture scope).
  const failsafeData = {
    name,
    email: d.email,
    phone: d.phone || undefined,
    interest: d.interest || undefined,
    locale: d.locale,
    message: d.message,
  };

  // --- Turnstile (strict in prod; in dev, log-and-allow so the flow stays testable) ---
  const turnstile = await checkTurnstile(formData);
  if (turnstile === "fail" && process.env.NODE_ENV === "production") {
    return { status: "error", error: "captcha" };
  }

  // --- config guard: a misconfigured mailer must not lose the lead ---------
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !fromAddress || !to) {
    console.error("[contact] missing RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL");
    return handleSendFailure({
      form: "contact",
      reason: "not-configured",
      data: failsafeData,
      fallbackError: "not-configured",
    });
  }
  const resend = new Resend(apiKey);
  const from = `Growth Journey Therapy <${fromAddress}>`;

  // 1) Notification to the practice — the critical send. Retried with an
  //    idempotency key (no double-sends); on failure the submission is captured
  //    to the R2 failsafe + alerted, and background retries re-deliver.
  //    (The visitor's message goes ONLY here — never echoed into the auto-reply.)
  const idempotencyKey = `contact/${crypto.randomUUID()}`;
  const notification = {
    from,
    to,
    replyTo: d.email,
    subject: `New website inquiry — ${name}`,
    text: [
      "New inquiry from the website:",
      "",
      `Name: ${name}`,
      `Email: ${d.email}`,
      `Phone: ${d.phone || "—"}`,
      `Interested in: ${d.interest || "—"}`,
      `Language: ${d.locale === "es" ? "Español" : "English"}`,
      "",
      "Message:",
      d.message,
    ].join("\n"),
  };

  try {
    const outcome = await sendWithRetry(resend, notification, idempotencyKey);
    if (!outcome.ok) {
      console.error(`[contact] notification send failed (${outcome.class}):`, outcome.error);
      return handleSendFailure({
        form: "contact",
        reason: "send-failed",
        data: failsafeData,
        error: outcome.error,
        fallbackError: "send-failed",
        // Only retryable/deferred failures get background re-delivery.
        retry:
          outcome.class === "fatal" ? undefined : { resend, payload: notification, idempotencyKey },
      });
    }
  } catch (e) {
    // The SDK shouldn't throw for text sends — this is defense so an exception
    // can never unmount the form (app/error.tsx) and destroy the typed data.
    console.error("[contact] notification send threw:", e);
    return handleSendFailure({
      form: "contact",
      reason: "send-threw",
      data: failsafeData,
      error: { message: String(e) },
      fallbackError: "send-failed",
    });
  }

  // 2) Confirmation to the visitor — best-effort; a failure here must not lose the lead.
  //    Deliberately generic (no echo of their details) — the auto-reply itself reveals
  //    they contacted a therapist to anyone with inbox access. See the spec's privacy note.
  try {
    await resend.emails.send({
      from,
      to: d.email,
      replyTo: to,
      subject:
        d.locale === "es"
          ? "Recibimos tu mensaje — Growth Journey Therapy"
          : "We received your message — Growth Journey Therapy",
      react: InquiryConfirmation({ name: d.firstName, locale: d.locale, getStartedUrl: `${SITE_URL}/consultation` }),
      text:
        d.locale === "es"
          ? `Hola ${d.firstName}, recibimos tu mensaje y te contactaremos dentro de 1 a 2 días hábiles. Si estás en crisis, llama o envía un mensaje de texto al 988, o llama al 911.`
          : `Hi ${d.firstName}, we received your message and will reach out within 1–2 business days. If you are in crisis, call or text 988, or call 911.`,
    });
  } catch (e) {
    console.error("[contact] confirmation send failed (non-fatal):", e);
  }

  return { status: "ok" };
}
