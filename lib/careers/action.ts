"use server";

import { Resend } from "resend";
import { careersSchema, EMPLOYMENT_LABELS } from "./schema";
import { isLikelySpam, checkTurnstile } from "@/lib/forms/gates";
import { sendWithRetry } from "@/lib/forms/reliable-send";
import { handleSendFailure } from "@/lib/forms/failsafe";

export type CareersState = {
  status: "idle" | "ok" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitApplication(_prev: CareersState, formData: FormData): Promise<CareersState> {
  // spam gates; silently drop bots
  if (isLikelySpam(formData)) return { status: "ok" };

  const parsed = careersSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: "invalid", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const failsafeData = {
    name: d.name,
    email: d.email,
    phone: d.phone,
    address: d.address,
    employment: d.employment,
    message: d.message || undefined,
  };

  const turnstile = await checkTurnstile(formData);
  if (turnstile === "fail" && process.env.NODE_ENV === "production") {
    return { status: "error", error: "captcha" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !fromAddress || !to) {
    console.error("[careers] missing RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL");
    return handleSendFailure({
      form: "careers",
      reason: "not-configured",
      data: failsafeData,
      fallbackError: "not-configured",
    });
  }
  const resend = new Resend(apiKey);

  const idempotencyKey = `careers/${crypto.randomUUID()}`;
  const notification = {
    from: `Growth Journey Therapy <${fromAddress}>`,
    to,
    replyTo: d.email,
    subject: `New career application — ${d.name}`,
    text: [
      "New career application from the website:",
      "",
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      `Phone: ${d.phone || "—"}`,
      `Address: ${d.address || "—"}`,
      `Employment desired: ${EMPLOYMENT_LABELS[d.employment]}`,
      "",
      "Additional information:",
      d.message || "—",
      "",
      "(The applicant was asked to email their resume and introduction separately.)",
    ].join("\n"),
  };

  try {
    const outcome = await sendWithRetry(resend, notification, idempotencyKey);
    if (!outcome.ok) {
      console.error(`[careers] send failed (${outcome.class}):`, outcome.error);
      return handleSendFailure({
        form: "careers",
        reason: "send-failed",
        data: failsafeData,
        error: outcome.error,
        fallbackError: "send-failed",
        retry:
          outcome.class === "fatal" ? undefined : { resend, payload: notification, idempotencyKey },
      });
    }
  } catch (e) {
    console.error("[careers] send threw:", e);
    return handleSendFailure({
      form: "careers",
      reason: "send-threw",
      data: failsafeData,
      error: { message: String(e) },
      fallbackError: "send-failed",
    });
  }

  return { status: "ok" };
}
