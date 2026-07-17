"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { inquirySchema } from "./schema";
import { InquiryConfirmation } from "@/emails/inquiry";
import { SITE_URL } from "@/lib/site";

export type ContactState = {
  status: "idle" | "ok" | "error";
  /** "invalid" | "captcha" | "not-configured" | "send-failed" */
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function submitInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // --- spam gates (before anything expensive) ------------------------------
  // 1. honeypot: a hidden field real users never fill
  if ((formData.get("website") ?? "") !== "") return { status: "ok" }; // silently drop
  // 2. timing: humans take more than ~3s to complete the form
  const startedAt = Number(formData.get("startedAt"));
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 3000) return { status: "ok" };

  // --- validate ------------------------------------------------------------
  const parsed = inquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: "invalid", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  // --- Turnstile (strict in prod; in dev, log-and-allow so the flow stays testable) ---
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret) {
    const h = await headers();
    const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for");
    const token = formData.get("cf-turnstile-response");
    const ok = typeof token === "string" && (await verifyTurnstile(token, secret, ip));
    if (!ok && process.env.NODE_ENV === "production") {
      return { status: "error", error: "captcha" };
    }
  }

  // --- send ----------------------------------------------------------------
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !fromAddress || !to) {
    console.error("[contact] missing RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL");
    return { status: "error", error: "not-configured" };
  }
  const resend = new Resend(apiKey);
  const from = `Growth Journey Therapy <${fromAddress}>`;
  const name = `${d.firstName} ${d.lastName}`.trim();

  // 1) Notification to the practice — critical; fail the request if it doesn't send.
  //    (The visitor's message goes ONLY here — never echoed into the auto-reply.)
  const { error } = await resend.emails.send({
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
  });
  if (error) {
    console.error("[contact] notification send failed:", error);
    return { status: "error", error: "send-failed" };
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
