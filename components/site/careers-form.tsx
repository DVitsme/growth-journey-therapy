"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitApplication, type CareersState } from "@/lib/careers/action";
import { EMPLOYMENT, EMPLOYMENT_LABELS } from "@/lib/careers/schema";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const BOX = "block rounded-md border border-line bg-card px-4 py-2 transition-colors focus-within:border-green";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-ink-soft";
const INPUT = "mt-0.5 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/50";

export function CareersForm() {
  const [state, formAction, pending] = useActionState<CareersState, FormData>(submitApplication, { status: "idle" });

  const startedRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const setToken = (tk: string) => {
    if (tokenRef.current) tokenRef.current.value = tk;
  };
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);

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
  }, [scriptReady]);

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
        <h2 className="text-2xl text-green">Thank you for applying.</h2>
        <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
          We received your application and will be in touch. Please also email your resume and a brief
          introduction so we can learn more about you.
        </p>
      </div>
    );
  }

  const errMsg =
    state.status === "error"
      ? state.error === "captcha"
        ? "Please complete the verification just below, then submit."
        : state.error === "invalid"
          ? "Please check the highlighted fields and try again."
          : "Something went wrong sending your application. Please try again, or email us directly."
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

      <form action={formAction} noValidate className="space-y-4">
        <input type="hidden" name="startedAt" ref={startedRef} defaultValue="" />
        <input type="hidden" name="cf-turnstile-response" ref={tokenRef} defaultValue="" />
        <div aria-hidden className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" tabIndex={-1}>
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        {/* Field order + requiredness mirror the original form: Name+Email on one row,
            Phone, Address, Employment (must choose), optional additional info. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={BOX}>
            <span className={LABEL}>Name *</span>
            <input name="name" required maxLength={100} autoComplete="name" className={INPUT} />
          </label>
          <label className={BOX}>
            <span className={LABEL}>Email Address *</span>
            <input name="email" type="email" required maxLength={200} autoComplete="email" className={INPUT} />
          </label>
        </div>

        <label className={BOX}>
          <span className={LABEL}>Phone Number *</span>
          <input name="phone" type="tel" required maxLength={40} autoComplete="tel" className={INPUT} />
        </label>

        <label className={BOX}>
          <span className={LABEL}>Address *</span>
          <input name="address" required maxLength={200} autoComplete="street-address" className={INPUT} />
        </label>

        <label className={BOX}>
          <span className={LABEL}>Employment Desired *</span>
          <select name="employment" required defaultValue="" className={`${INPUT} cursor-pointer`}>
            <option value="" disabled>
              Employment Desired *
            </option>
            {EMPLOYMENT.map((id) => (
              <option key={id} value={id}>
                {EMPLOYMENT_LABELS[id]}
              </option>
            ))}
          </select>
        </label>

        <label className={BOX}>
          <span className={LABEL}>Any additional information</span>
          <textarea
            name="message"
            maxLength={3000}
            rows={5}
            placeholder="Share your language fluency, availability, clinical interests, and where you are in your licensure journey."
            className={`${INPUT} resize-y`}
          />
        </label>

        {TURNSTILE_SITE_KEY && <div ref={widgetEl} className="pt-1" />}

        {errMsg && (
          <p role="alert" className="text-base font-medium text-terracotta">
            {errMsg}
          </p>
        )}

        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" variant="solid" size="lg" disabled={pending}>
            {pending ? "Sending…" : "Submit"}
          </Button>
          {TURNSTILE_SITE_KEY && <span className="text-xs text-ink-soft">Protected by Cloudflare Turnstile.</span>}
        </div>
      </form>
    </>
  );
}
