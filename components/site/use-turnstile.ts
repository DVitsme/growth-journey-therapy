"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile, wired so a real visitor cannot be silently refused.
 *
 * Context: measured on the live site 2026-08-21, 104 Turnstile challenges issued
 * to real browsers and 80 solved, so ~23% of challenged visitors produced no
 * token. Every one of them was refused server-side.
 *
 * THE DEFECT THIS ACTUALLY FIXES:
 *
 *   Nothing waited for a token. Submit was gated only on `pending`, so a visitor
 *   whose widget had not yet produced a token could press it and be refused. The
 *   widget is in *managed* mode, which can escalate to an interactive checkbox,
 *   and an unsolved interactive challenge fires NO callback of any kind — so no
 *   error handler ran, nothing appeared on the page, and the button stayed live.
 *   From the visitor's chair the form is ready and the button is broken.
 *
 *   ⚠️ The widget was switched managed -> NON-INTERACTIVE on 2026-08-21, so the
 *   visitor now has nothing to click. The `needsCheck` copy in each form is
 *   written to REASSURE ("still checking your browser"), not to instruct. If the
 *   mode is ever set back to managed, that copy must go back to telling them to
 *   complete the checkbox, or it becomes advice they cannot act on.
 *   `awaitToken()` holds the submit, prompts at 2.5s, and submits anyway at 12s
 *   (withholding the request is the one thing that guarantees a lost lead, and
 *   since 2026-08-21 a tokenless POST is captured rather than discarded).
 *
 *   Holding the token in a ref instead of reading the DOM at click time also
 *   closes the `reset()` race: reset blanks the field synchronously and takes
 *   ~2s to repopulate, so a retry inside that window used to post nothing.
 *
 * ⚠️ HONEST LIMIT — do not repeat the claim this comment used to make.
 * `onReady` is used instead of `onLoad` because `next/script` caches by `src`
 * and onReady is the documented hook that fires on every mount. I hypothesised
 * that onLoad failing to refire was breaking the widget after a client-side
 * navigation, and then TESTED IT: in a production build, both before and after
 * this change, the widget mounted correctly on a hard load AND after navigating
 * away and back. **That hypothesis was wrong.** onReady + the readiness poll are
 * kept as cheap robustness, not as a proven fix. The residual causes of the 23%
 * are still unmeasured; managed mode is the leading suspect. Measure before
 * claiming anything else here.
 */

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
  getResponse: (id?: string) => string | undefined;
};

const turnstileApi = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

export const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Long enough to cover a slow solve and the reset hole; past it, assume an unsolved challenge. */
const PROMPT_AFTER_MS = 2500;
/** Past this we submit anyway. Withholding the request is the one thing that guarantees a lost lead. */
const GIVE_UP_AFTER_MS = 12000;
const POLL_EVERY_MS = 200;
const POLL_UNTIL_MS = 20000;

export function useTurnstile(opts: { siteKey?: string; action: string; language?: string }) {
  const { siteKey, action, language } = opts;

  const boxRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const widgetId = useRef<string | null>(null);
  const waiters = useRef<Array<(t: string) => void>>([]);
  const passthrough = useRef(false);

  const [waiting, setWaiting] = useState(false);
  const [needsCheck, setNeedsCheck] = useState(false);

  /** Write the token to the hidden input and release anything awaiting it. */
  const settleToken = useCallback((value: string) => {
    if (tokenRef.current) tokenRef.current.value = value;
    const queued = waiters.current;
    waiters.current = [];
    for (const resolve of queued) resolve(value);
  }, []);

  const mountWidget = useCallback(() => {
    if (!siteKey || widgetId.current || !boxRef.current) return;
    const api = turnstileApi();
    if (!api) return; // api.js not ready yet; the poll comes back around
    widgetId.current = api.render(boxRef.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      ...(language ? { language } : {}),
      "refresh-expired": "auto",
      callback: (value: string) => {
        setNeedsCheck(false);
        settleToken(value);
      },
      "expired-callback": () => settleToken(""),
      "timeout-callback": () => settleToken(""),
      "error-callback": () => settleToken(""),
    });
  }, [siteKey, action, language, settleToken]);

  // Mount as soon as possible, and keep trying. `onReady` on the <Script> is the
  // primary path; this covers the case where it has already fired.
  useEffect(() => {
    if (!siteKey) return;
    mountWidget();
    const poll = setInterval(() => {
      if (widgetId.current) clearInterval(poll);
      else mountWidget();
    }, POLL_EVERY_MS);
    const stop = setTimeout(() => clearInterval(poll), POLL_UNTIL_MS);
    return () => {
      clearInterval(poll);
      clearTimeout(stop);
      const api = turnstileApi();
      if (api && widgetId.current) {
        try {
          api.remove(widgetId.current);
        } catch {
          /* already gone */
        }
      }
      widgetId.current = null;
      waiters.current = [];
    };
  }, [siteKey, mountWidget]);

  /** Resolves with a token, or "" once the budget runs out. */
  const awaitToken = useCallback(() => {
    const current = tokenRef.current?.value;
    if (current) return Promise.resolve(current);
    // `refresh-expired: auto` can re-mint without our callback firing.
    const existing = widgetId.current ? turnstileApi()?.getResponse(widgetId.current) : undefined;
    if (existing) {
      settleToken(existing);
      return Promise.resolve(existing);
    }
    return new Promise<string>((resolve) => {
      const prompt = setTimeout(() => setNeedsCheck(true), PROMPT_AFTER_MS);
      const onToken = (value: string) => {
        clearTimeout(prompt);
        clearTimeout(giveUp);
        resolve(value);
      };
      const giveUp = setTimeout(() => {
        clearTimeout(prompt);
        waiters.current = waiters.current.filter((w) => w !== onToken);
        resolve("");
      }, GIVE_UP_AFTER_MS);
      waiters.current.push(onToken);
    });
  }, [settleToken]);

  const resetWidget = useCallback(() => {
    settleToken("");
    try {
      turnstileApi()?.reset(widgetId.current ?? undefined);
    } catch {
      /* not mounted */
    }
  }, [settleToken]);

  /**
   * Hold the submit until a token exists. On the second pass (after the token
   * lands, or after the give-up budget) `passthrough` lets the Server Action run.
   */
  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (passthrough.current) {
        passthrough.current = false;
        return;
      }
      if (!siteKey || tokenRef.current?.value) return;
      e.preventDefault();
      setWaiting(true);
      void awaitToken().then(() => {
        setWaiting(false);
        setNeedsCheck(false);
        passthrough.current = true;
        formRef.current?.requestSubmit();
      });
    },
    [siteKey, awaitToken],
  );

  return { boxRef, tokenRef, formRef, mountWidget, onSubmit, resetWidget, waiting, needsCheck };
}
