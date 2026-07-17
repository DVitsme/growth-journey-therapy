"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { careersSchema, EMPLOYMENT_LABELS } from "./schema";

export type CareersState = {
  status: "idle" | "ok" | "error";
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

export async function submitApplication(_prev: CareersState, formData: FormData): Promise<CareersState> {
  // spam gates
  if ((formData.get("website") ?? "") !== "") return { status: "ok" };
  const startedAt = Number(formData.get("startedAt"));
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 3000) return { status: "ok" };

  const parsed = careersSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: "invalid", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret) {
    const h = await headers();
    const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for");
    const token = formData.get("cf-turnstile-response");
    const ok = typeof token === "string" && (await verifyTurnstile(token, secret, ip));
    if (!ok && process.env.NODE_ENV === "production") return { status: "error", error: "captcha" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !fromAddress || !to) {
    console.error("[careers] missing RESEND_API_KEY / CONTACT_FROM_EMAIL / CONTACT_TO_EMAIL");
    return { status: "error", error: "not-configured" };
  }
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
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
  });
  if (error) {
    console.error("[careers] send failed:", error);
    return { status: "error", error: "send-failed" };
  }
  return { status: "ok" };
}
