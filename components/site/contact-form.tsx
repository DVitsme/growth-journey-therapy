"use client";

import { useActionState, useEffect, useRef } from "react";
import Script from "next/script";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitInquiry, type ContactState } from "@/lib/contact/action";
import { useTurnstile, TURNSTILE_SRC } from "./use-turnstile";
import { INTERESTS } from "@/lib/contact/schema";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const copy = {
  en: {
    disclaimerLead: "Please don't include any medical or mental-health information in this form.",
    disclaimerBody:
      "It's only for requesting an appointment or asking a general question — it is not an encrypted medical channel. Once we connect, we'll share any clinical information through a secure, HIPAA-compliant system.",
    crisis:
      "If you are in crisis or experiencing a mental-health emergency, call or text 988 (Suicide & Crisis Lifeline) or call 911 — do not use this form.",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phone: "Phone",
    interest: "Are You Interested in...",
    message: "Message",
    messageHint: "General questions and scheduling only — please don't include medical or mental-health details here.",
    consent: "I agree to be contacted using the information I provided above.",
    submit: "Submit",
    sending: "Sending…",
    verifying: "Verifying…",
    needsCheck: "Still checking your browser. One moment, your message will send on its own.",
    successTitle: "Thank you for reaching out!",
    successBody: "Someone will be in touch soon at the email or phone number you provided.",
    errInvalid: "Please check the highlighted fields and try again.",
    errCaptcha:
      "We could not verify your browser, so your message did not send. Please try once more, or call us at (267) 713-8831 and we will take your details.",
    errSend: "Something went wrong sending your message. Please try again, or call us directly.",
    protected: "Protected by Cloudflare Turnstile.",
    optional: "optional",
    fieldRequired: "{field} is required.",
    fieldEmail: "Please enter a valid email address.",
    fieldChoose: "Please choose an option.",
    fieldConsent: "Please tick this box so we know we can contact you.",
    fieldGeneric: "Please check this field.",
  },
  es: {
    disclaimerLead: "Por favor, no incluya información médica ni de salud mental en este formulario.",
    disclaimerBody:
      "Es únicamente para solicitar una cita o hacer una pregunta general — no es un medio de comunicación médica cifrado. Una vez que estemos en contacto, compartiremos cualquier información clínica a través de un sistema seguro que cumple con HIPAA.",
    crisis:
      "Si está en crisis o atraviesa una emergencia de salud mental, llame o envíe un mensaje de texto al 988 (Línea de Prevención del Suicidio y Crisis, atención en español) o llame al 911; no use este formulario.",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo electrónico",
    phone: "Teléfono",
    interest: "¿Qué te interesa?",
    message: "Mensaje",
    messageHint: "Solo preguntas generales y citas — por favor no incluyas detalles médicos ni de salud mental aquí.",
    consent: "Autorizo que me contacten usando la información que proporcioné.",
    submit: "Enviar",
    sending: "Enviando…",
    verifying: "Verificando…",
    needsCheck: "Estamos verificando tu navegador. Un momento, tu mensaje se enviará solo.",
    successTitle: "¡Gracias por comunicarte!",
    successBody: "Alguien se pondrá en contacto contigo pronto al correo o teléfono que proporcionaste.",
    errInvalid: "Revisa los campos marcados e inténtalo de nuevo.",
    errCaptcha:
      "No pudimos verificar tu navegador, así que tu mensaje no se envió. Inténtalo una vez más o llámanos al (267) 713-8831 y tomaremos tus datos.",
    errSend: "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo o llámanos directamente.",
    protected: "Protegido por Cloudflare Turnstile.",
    optional: "opcional",
    fieldRequired: "El campo {field} es obligatorio.",
    fieldEmail: "Introduce un correo electrónico válido.",
    fieldChoose: "Elige una opción.",
    fieldConsent: "Marca esta casilla para que sepamos que podemos contactarte.",
    fieldGeneric: "Revisa este campo.",
  },
} as const;

const BOX_BASE = "block rounded-md border bg-card px-4 py-2 transition-colors focus-within:border-green";

const FIELD_ORDER = ["firstName", "lastName", "email", "phone", "interest", "message", "consent"] as const;

/**
 * zod's raw strings are terse ("required") or internal (`Invalid input: expected "on"`
 * for an unticked consent box). Neither should reach a person, so they are mapped —
 * and mapped per locale, since this form is bilingual. Field names reuse the existing
 * localised labels so the two can never drift apart.
 */
// `copy` is `as const`, so en and es have distinct literal types; accept either.
function humanFieldError(
  field: string,
  raw: string | undefined,
  t: (typeof copy)[keyof typeof copy],
): string | null {
  if (!raw) return null;
  if (field === "consent") return t.fieldConsent;
  if (field === "interest") return t.fieldChoose;
  if (raw === "invalid") return t.fieldEmail;
  if (raw === "required") {
    const label = (t as unknown as Record<string, string>)[field];
    return label ? t.fieldRequired.replace("{field}", label) : t.fieldGeneric;
  }
  return t.fieldGeneric;
}

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm font-medium text-terracotta">
      {message}
    </p>
  );
}
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-ink-soft";
const INPUT = "mt-0.5 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/50";

export function ContactForm({ locale }: { locale: "en" | "es" }) {
  const t = copy[locale];
  const [state, formAction, pending] = useActionState<ContactState, FormData>(submitInquiry, { status: "idle" });

  // Hidden-input values are written imperatively via refs (not React state): the timestamp
  // avoids an SSR/CSR hydration mismatch, and the Turnstile token never needs to be in render.
  const startedRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);

  const { boxRef, tokenRef, formRef, mountWidget, onSubmit, resetWidget, waiting, needsCheck } =
    useTurnstile({ siteKey: TURNSTILE_SITE_KEY, action: "contact-form", language: locale });

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  // React 19 resets uncontrolled fields once a <form action> submission completes,
  // pass OR fail, so a validation error used to wipe the visitor's message. Refill
  // from what the action echoes back. `consent` is a checkbox, so it restores via
  // `checked`, not `value`.
  useEffect(() => {
    const vals = state.status === "error" ? state.values : undefined;
    const form = formRef.current;
    if (!vals || !form) return;
    for (const [name, value] of Object.entries(vals)) {
      if (!value) continue;
      const el = form.querySelector(`[name="${name}"]`) as
        | ({ value?: string; type?: string; checked?: boolean } | null);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = value === "on";
      else if (!el.value) el.value = value;
    }
  }, [state, formRef]);

  // Send the visitor straight to the first thing that needs changing. Must sit above
  // the success early-return: hooks cannot be called conditionally.
  useEffect(() => {
    const first = FIELD_ORDER.find((k) => fieldErrors?.[k]?.length);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [fieldErrors, formRef]);

  // The token is consumed once verified — after any post-verification error
  // (captcha/send-failed/not-configured/…), reset for a clean retry. "invalid"
  // is excluded: validation runs before verification, so the token is unspent.
  useEffect(() => {
    if (state.status === "error" && state.error !== "invalid") resetWidget();
  }, [state, resetWidget]);

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-line bg-card px-7 py-12 text-center shadow-sm">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-green text-white">
          <Check className="size-7" strokeWidth={2.5} aria-hidden />
        </span>
        <h2 className="text-2xl text-green">{t.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">{t.successBody}</p>
      </div>
    );
  }

  const err = (k: string) => humanFieldError(k, fieldErrors?.[k]?.[0], t);
  const boxFor = (k: string) => `${BOX_BASE} ${err(k) ? "border-terracotta" : "border-line"}`;
  const describedBy = (k: string) => (err(k) ? `err-${k}` : undefined);

  const errMsg =
    state.status === "error"
      ? state.error === "captcha"
        ? t.errCaptcha
        : state.error === "invalid"
          ? t.errInvalid
          : t.errSend
      : null;

  return (
    <>
      {TURNSTILE_SITE_KEY && (
        <Script
          src={TURNSTILE_SRC}
          strategy="afterInteractive"
          // onReady fires on load AND on every subsequent mount; onLoad may not,
          // since next/script caches by src. Robustness, not a proven fix — see
          // the honest-limit note in use-turnstile.ts.
          onReady={mountWidget}
        />
      )}

      {/* Compliance disclaimer — PHI-minimal form, crisis routing (docs/research/resend-contact.md). */}
      <div className="mb-7 rounded-lg border-l-4 border-terracotta bg-panel px-5 py-4 text-sm leading-relaxed text-ink-soft">
        <p>
          <strong className="text-ink">{t.disclaimerLead}</strong> {t.disclaimerBody}
        </p>
        <p className="mt-2">
          <strong className="text-ink">{t.crisis}</strong>
        </p>
      </div>

      <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="startedAt" ref={startedRef} defaultValue="" />
        <input type="hidden" name="cf-turnstile-response" ref={tokenRef} defaultValue="" />
        {/* honeypot: hidden from humans, catches naive bots */}
        <div aria-hidden className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" tabIndex={-1}>
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={boxFor("firstName")}>
              <span className={LABEL}>{t.firstName} *</span>
              <input
                name="firstName"
                required
                maxLength={100}
                autoComplete="given-name"
                aria-invalid={!!err("firstName")}
                aria-describedby={describedBy("firstName")}
                className={INPUT}
              />
            </label>
            <FieldError id="err-firstName" message={err("firstName")} />
          </div>
          <div>
            <label className={boxFor("lastName")}>
              <span className={LABEL}>{t.lastName} *</span>
              <input
                name="lastName"
                required
                maxLength={100}
                autoComplete="family-name"
                aria-invalid={!!err("lastName")}
                aria-describedby={describedBy("lastName")}
                className={INPUT}
              />
            </label>
            <FieldError id="err-lastName" message={err("lastName")} />
          </div>
        </div>

        <div>
          <label className={boxFor("email")}>
            <span className={LABEL}>{t.email} *</span>
            <input
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              aria-invalid={!!err("email")}
              aria-describedby={describedBy("email")}
              className={INPUT}
            />
          </label>
          <FieldError id="err-email" message={err("email")} />
        </div>

        <div>
          <label className={boxFor("phone")}>
            <span className={LABEL}>
              {t.phone} <span className="lowercase">({t.optional})</span>
            </span>
            <input
              name="phone"
              type="tel"
              maxLength={40}
              autoComplete="tel"
              aria-invalid={!!err("phone")}
              aria-describedby={describedBy("phone")}
              className={INPUT}
            />
          </label>
          <FieldError id="err-phone" message={err("phone")} />
        </div>

        {/* Original "Are You Interested in..." select — her service names, original order.
            No visible label: the disabled placeholder option carries the field name. */}
        <div>
          <label className={boxFor("interest")}>
            <select
              name="interest"
              aria-label={t.interest}
              defaultValue=""
              aria-invalid={!!err("interest")}
              aria-describedby={describedBy("interest")}
              className={`${INPUT} cursor-pointer`}
            >
              <option value="" disabled>
                {t.interest}
              </option>
              {INTERESTS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <FieldError id="err-interest" message={err("interest")} />
        </div>

        <div>
          <label className={boxFor("message")}>
            <span className={LABEL}>{t.message} *</span>
            <textarea
              name="message"
              required
              maxLength={2000}
              rows={5}
              placeholder={t.messageHint}
              aria-invalid={!!err("message")}
              aria-describedby={describedBy("message")}
              className={`${INPUT} resize-y`}
            />
          </label>
          <FieldError id="err-message" message={err("message")} />
        </div>

        <div>
          <label className="flex items-start gap-3 pt-1 text-base text-ink-soft">
            <input
              type="checkbox"
              name="consent"
              required
              aria-invalid={!!err("consent")}
              aria-describedby={describedBy("consent")}
              className="mt-1.5 size-5 shrink-0 accent-green"
            />
            <span>{t.consent}</span>
          </label>
          <FieldError id="err-consent" message={err("consent")} />
        </div>

        {TURNSTILE_SITE_KEY && <div ref={boxRef} className="pt-1" />}
        {needsCheck && (
          <p role="status" className="text-base font-semibold text-ink">
            {t.needsCheck}
          </p>
        )}

        {errMsg && (
          <p role="alert" className="text-base font-medium text-terracotta">
            {errMsg}
          </p>
        )}

        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" variant="outline" size="lg" disabled={pending || waiting}>
            {pending ? t.sending : waiting ? t.verifying : t.submit}
          </Button>
          {TURNSTILE_SITE_KEY && <span className="text-xs text-ink-soft">{t.protected}</span>}
        </div>
      </form>
    </>
  );
}
