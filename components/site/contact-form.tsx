"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitInquiry, type ContactState } from "@/lib/contact/action";
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
    successTitle: "Thank you for reaching out!",
    successBody: "Someone will be in touch soon at the email or phone number you provided.",
    errInvalid: "Please check the highlighted fields and try again.",
    errCaptcha: "Please complete the verification just below, then submit.",
    errSend: "Something went wrong sending your message. Please try again, or call us directly.",
    protected: "Protected by Cloudflare Turnstile.",
    optional: "optional",
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
    successTitle: "¡Gracias por comunicarte!",
    successBody: "Alguien se pondrá en contacto contigo pronto al correo o teléfono que proporcionaste.",
    errInvalid: "Revisa los campos marcados e inténtalo de nuevo.",
    errCaptcha: "Completa la verificación a continuación y luego envía.",
    errSend: "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo o llámanos directamente.",
    protected: "Protegido por Cloudflare Turnstile.",
    optional: "opcional",
  },
} as const;

const BOX = "block rounded-md border border-line bg-card px-4 py-2 transition-colors focus-within:border-green";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-ink-soft";
const INPUT = "mt-0.5 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/50";

export function ContactForm({ locale }: { locale: "en" | "es" }) {
  const t = copy[locale];
  const [state, formAction, pending] = useActionState<ContactState, FormData>(submitInquiry, { status: "idle" });

  // Hidden-input values are written imperatively via refs (not React state): the timestamp
  // avoids an SSR/CSR hydration mismatch, and the Turnstile token never needs to be in render.
  const startedRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const setToken = (tk: string) => {
    if (tokenRef.current) tokenRef.current.value = tk;
  };
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);

  // Cloudflare Turnstile — explicit render so we can reset the (single-use) token after a
  // failed send. The token rides into the Server Action via the hidden input below.
  const [scriptReady, setScriptReady] = useState(false);
  const widgetEl = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !scriptReady) return;
    const el = widgetEl.current;
    if (!window.turnstile || !el || widgetId.current) return;
    widgetId.current = window.turnstile.render(el, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "light",
      language: locale,
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
    return () => {
      try {
        if (widgetId.current) window.turnstile?.remove(widgetId.current);
      } catch {
        /* widget DOM already gone */
      }
      widgetId.current = null;
    };
  }, [scriptReady, locale]);

  // The token is consumed once verified — after a captcha/send error, reset for a clean retry.
  useEffect(() => {
    if (state.status === "error" && (state.error === "captcha" || state.error === "send-failed")) {
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      setToken("");
    }
  }, [state]);

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
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
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

      <form action={formAction} noValidate className="space-y-4">
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
          <label className={BOX}>
            <span className={LABEL}>{t.firstName} *</span>
            <input name="firstName" required maxLength={100} autoComplete="given-name" className={INPUT} />
          </label>
          <label className={BOX}>
            <span className={LABEL}>{t.lastName} *</span>
            <input name="lastName" required maxLength={100} autoComplete="family-name" className={INPUT} />
          </label>
        </div>

        <label className={BOX}>
          <span className={LABEL}>{t.email} *</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={INPUT} />
        </label>

        <label className={BOX}>
          <span className={LABEL}>
            {t.phone} <span className="lowercase">({t.optional})</span>
          </span>
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={INPUT} />
        </label>

        {/* Original "Are You Interested in..." select — her service names, original order. */}
        <label className={BOX}>
          <span className={LABEL}>{t.interest}</span>
          <select name="interest" defaultValue="" className={`${INPUT} cursor-pointer`}>
            <option value="">{t.interest}</option>
            {INTERESTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className={BOX}>
          <span className={LABEL}>{t.message} *</span>
          <textarea
            name="message"
            required
            maxLength={2000}
            rows={5}
            placeholder={t.messageHint}
            className={`${INPUT} resize-y`}
          />
        </label>

        <label className="flex items-start gap-3 pt-1 text-base text-ink-soft">
          <input type="checkbox" name="consent" required className="mt-1.5 size-5 shrink-0 accent-green" />
          <span>{t.consent}</span>
        </label>

        {TURNSTILE_SITE_KEY && <div ref={widgetEl} className="pt-1" />}

        {errMsg && (
          <p role="alert" className="text-base font-medium text-terracotta">
            {errMsg}
          </p>
        )}

        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" variant="outline" size="lg" disabled={pending}>
            {pending ? t.sending : t.submit}
          </Button>
          {TURNSTILE_SITE_KEY && <span className="text-xs text-ink-soft">{t.protected}</span>}
        </div>
      </form>
    </>
  );
}
