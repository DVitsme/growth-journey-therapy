"use client";

import { useActionState, useEffect, useRef } from "react";
import Script from "next/script";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitApplication, type CareersState } from "@/lib/careers/action";
import { useTurnstile, TURNSTILE_SRC } from "./use-turnstile";
import { EMPLOYMENT, EMPLOYMENT_LABELS } from "@/lib/careers/schema";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const BOX = "block rounded-md border border-line bg-card px-4 py-2 transition-colors focus-within:border-green";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-ink-soft";
const INPUT = "mt-0.5 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-soft/50";

export function CareersForm() {
  const [state, formAction, pending] = useActionState<CareersState, FormData>(submitApplication, { status: "idle" });

  const startedRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);

  const { boxRef, tokenRef, formRef, mountWidget, onSubmit, resetWidget, waiting, needsCheck } =
    useTurnstile({ siteKey: TURNSTILE_SITE_KEY, action: "careers-form" });

  // Reset the single-use token after any post-verification error ("invalid"
  // excluded — validation precedes verification, so the token is unspent).
  useEffect(() => {
    if (state.status === "error" && state.error !== "invalid") resetWidget();
  }, [state, resetWidget]);

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
        ? "We could not verify your browser, so your application did not send. Please try once more, or call us at (267) 713-8831."
        : state.error === "invalid"
          ? "Please check the highlighted fields and try again."
          : "Something went wrong sending your application. Please try again, or email us directly."
      : null;

  return (
    <>
      {TURNSTILE_SITE_KEY && (
        <Script
          src={TURNSTILE_SRC}
          strategy="afterInteractive"
          // onReady, NOT onLoad — see components/site/use-turnstile.ts
          onReady={mountWidget}
        />
      )}

      <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="space-y-4">
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

        {/* No visible label: the disabled placeholder option carries the field name. */}
        <label className={BOX}>
          <select name="employment" required aria-label="Employment Desired" defaultValue="" className={`${INPUT} cursor-pointer`}>
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

        {TURNSTILE_SITE_KEY && <div ref={boxRef} className="pt-1" />}
        {needsCheck && (
          <p role="status" className="text-base font-semibold text-ink">
            Still checking your browser. One moment, your application will send on its own.
          </p>
        )}

        {errMsg && (
          <p role="alert" className="text-base font-medium text-terracotta">
            {errMsg}
          </p>
        )}

        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" variant="solid" size="lg" disabled={pending || waiting}>
            {pending ? "Sending…" : waiting ? "Verifying…" : "Submit"}
          </Button>
          {TURNSTILE_SITE_KEY && <span className="text-xs text-ink-soft">Protected by Cloudflare Turnstile.</span>}
        </div>
      </form>
    </>
  );
}
