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
  /**
   * What the applicant typed, echoed back on every failure so the form can refill
   * itself. React 19 resets uncontrolled fields once a `<form action>` submission
   * completes — pass OR fail — so without this a validation error wiped the whole
   * application and the applicant had to retype an address and a free-text answer
   * to fix one dropdown. Telling someone what is wrong is not a fix if the cost of
   * acting on it is starting over.
   */
  values?: Record<string, string>;
};

/** Raw strings straight off the FormData, so this still works when parsing failed. */
function submittedValues(formData: FormData): Record<string, string> {
  const raw = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };
  return {
    name: raw("name"),
    email: raw("email"),
    phone: raw("phone"),
    address: raw("address"),
    employment: raw("employment"),
    message: raw("message"),
  };
}

export async function submitApplication(_prev: CareersState, formData: FormData): Promise<CareersState> {
  // spam gates; silently drop bots
  if (isLikelySpam(formData)) return { status: "ok" };

  const values = submittedValues(formData);
  /** Every failure path routes through this, so no return can forget to refill the form. */
  const keep = (o: { status: "ok" } | { status: "error"; error: string }): CareersState =>
    o.status === "ok" ? o : { ...o, values };

  const parsed = careersSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: "invalid", fieldErrors: parsed.error.flatten().fieldErrors, values };
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
    // ⚠️ A refusal must never discard what the visitor typed. `failsafeData` is
    // assembled above the gates for exactly this reason — do not move this check
    // above it. Measured 2026-08-21 on the live site: 104 challenges issued to real
    // browsers, 80 solved, so ~23% produce no token and every one of them used to
    // be turned away leaving no row, no email and no log line.
    console.error("[careers] turnstile refused — capturing the submission rather than discarding it");
    return keep(
      await handleSendFailure({
        form: "careers",
        reason: "turnstile-refused",
        data: failsafeData,
        fallbackError: "captcha",
      }),
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !fromAddress || !to) {
    console.error("[careers] missing RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL");
    return keep(
      await handleSendFailure({
        form: "careers",
        reason: "not-configured",
        data: failsafeData,
        fallbackError: "not-configured",
      }),
    );
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
      return keep(
        await handleSendFailure({
          form: "careers",
          reason: "send-failed",
          data: failsafeData,
          error: outcome.error,
          fallbackError: "send-failed",
          retry:
            outcome.class === "fatal" ? undefined : { resend, payload: notification, idempotencyKey },
        }),
      );
    }
  } catch (e) {
    console.error("[careers] send threw:", e);
    return keep(
      await handleSendFailure({
        form: "careers",
        reason: "send-threw",
        data: failsafeData,
        error: { message: String(e) },
        fallbackError: "send-failed",
      }),
    );
  }

  return { status: "ok" };
}
