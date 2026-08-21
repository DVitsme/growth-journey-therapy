# Form-submission failsafe — runbook

> If a contact or careers submission cannot be delivered — the email service fails, the mailer is
> misconfigured, **or the spam check refuses it** — the submission is **captured to durable storage
> and someone is alerted**, so the lead is never lost. Built 2026‑07‑23 (Phase 1); extended to
> spam-check refusals 2026‑08‑21. Code: `lib/forms/{gates,reliable-send,failsafe}.ts`.

## Capture reasons

| `reason` | What it means |
|---|---|
| `send-failed` | Resend returned an error after retries |
| `send-threw` | The send call threw |
| `not-configured` | `RESEND_API_KEY` / `CONTACT_FROM_EMAIL` / `CONTACT_TO_EMAIL` missing |
| `turnstile-refused` | **Cloudflare Turnstile refused the submission.** Most likely a real person whose widget never produced a token, not a bot — see below |

### Why `turnstile-refused` exists

Measured on the live site 2026‑08‑21 over the full 30-day analytics retention window: **104
Turnstile challenges issued to real browsers, 80 solved.** So roughly **23% of challenged visitors
never produce a token** — the widget fails to mount, or presents a challenge they do not notice.
Before this change every one of them was refused and their name, email, phone and message were
discarded with no row, no email and no log line, exactly the failure that cost a sibling client a
paid lead they could never call back.

The submit button is **not** gated on having a token (`disabled={pending}` only), so a visitor in
that state can and does press submit. Treat a `turnstile-refused` record as a real person waiting
for a reply until it is obviously not.

⚠️ **Nobody currently reads the bucket on a schedule, and no alert channel is configured**
(`ALERT_WEBHOOK_URL` is unset), so today a refusal is captured **silently**. Capture is a
precondition for recovery, not recovery itself. Setting `ALERT_WEBHOOK_URL` is a
`wrangler secret put` with no rebuild.

## How it works

1. **Retry first** — every send gets 2 attempts (4s timeout each, jittered backoff) with a **Resend
   idempotency key**, so retries can never double-send. Most transient failures never get further.
2. **Capture on failure** — if the send still fails (or the mailer is misconfigured), the **full
   submission** is written to the R2 bucket **`gjt-form-failsafe`** as one JSON file per submission,
   organized in monthly folders:
   `submissions/2026-07/2026-07-23T14-05-33-123Z_contact_ab12cd34.json`
3. **Alert** — a **no-PII ping** ("a contact submission is held in the failsafe as `<key>`") goes out
   via the configured channel(s). The visitor sees the normal success message **only when capture +
   alert both succeeded**; otherwise they still get the "try again or call us" error.
4. **Background re-delivery** — for transient failures, the Worker retries the send for up to ~30s
   after responding (same idempotency key) and **deletes the captured record on success**.
5. **Auto-delete** — an R2 lifecycle rule erases anything under `submissions/` after **14 days**
   (short on purpose: records include the visitor's message text; see the privacy note below).

## Reading a captured lead (operator)

- **Dashboard**: Cloudflare → R2 → `gjt-form-failsafe` → tick **"View prefixes as directories"** →
  open `submissions/<month>/` → per-file **… → Download**. Each file is human-readable JSON.
- **CLI**: `pnpm exec wrangler r2 object get "gjt-form-failsafe/<key>" --pipe`
- After following up with the person, delete the record (dashboard **… → Delete**, or
  `wrangler r2 object delete`). The 14-day rule is only the backstop.

## Alert channels

- **Webhook (active as soon as configured)**: set a Discord/Slack incoming-webhook URL as a Worker
  secret: `pnpm exec wrangler secret put ALERT_WEBHOOK_URL` (for local dev, put it in
  `.env.development.local`). The ping contains the form type + record key — never any PII.
- **Cloudflare Email channel (Phase 1.5, pending)**: the code already supports an `EMAIL` send
  binding (independent of Resend, free to verified destination addresses). To activate: verify
  `CONTACT_TO_EMAIL` (and the operator address) as Email Routing **destination addresses** in the
  Cloudflare dashboard — **do NOT accept any MX-record change during that flow** (the domain's
  Gmail MX must stay untouched) — then add `"send_email": [{ "name": "EMAIL" }]` to `wrangler.jsonc`
  and deploy. Until at least one channel works, failed sends show the visitor the error message
  (leads are still captured).

## Testing (never force failures in production)

Env overrides that **cannot leak into a deploy**: `.env.development.local` (used by `next dev`) or
`.dev.vars` (used by `pnpm preview`). Options:
- `RESEND_BASE_URL=https://resend.invalid` → forces the network-failure path (retryable class).
- `RESEND_API_KEY=re_invalid_key` → forces the 401 path (fatal class).
- Empty `RESEND_API_KEY=` → forces the `not-configured` path.
- **Refusal path**, verified 2026‑08‑21 against `pnpm preview` with `NEXTJS_ENV=production` and a
  `.dev.vars` holding a dummy `TURNSTILE_SECRET_KEY` (the missing-token check fires before
  siteverify, so no real key is needed). Drive the real form in a browser on `localhost`, where the
  widget cannot mint a token, wait past the 3s anti-bot timing gate, and submit. Expect a JSON
  record with `"reason": "turnstile-refused"` and the full submission intact.
- ⚠️ **`console.error` output is NOT visible in local `pnpm preview`.** Proven by putting a
  `console.log` and a `console.error` on adjacent lines: the log appeared, the error did not. That
  applies to every existing `console.error` in this codebase too, so local preview cannot be used to
  confirm error logging. Production Workers Logs (`observability.enabled: true`) is the place to
  check.

Then submit `/contact` (Turnstile is log-and-allow outside production) and verify the capture:
`pnpm exec wrangler r2 object get "gjt-form-failsafe/<logged key>" --local` (local writes land in
`.wrangler/state/`). Delete the override file afterwards.

## Phase 2 (planned, not built)

A `*/15min` cron sweep on the Worker (custom entry per OpenNext's documented pattern) that re-sends
anything still pending with the stored idempotency key, deletes on success, and re-pings while
records age — making the failsafe fully self-healing. Requires its own build spike (worker entry
swap) before shipping.

## Privacy note + client sign-off

The captured record contains the **full submission including the visitor's message text**, stored
in Cloudflare R2 (encrypted at rest by Cloudflare; **no BAA** — same posture as Resend today).
Compensating controls: capture happens **only when the send fails** (rare), records **auto-delete
after 14 days** (sooner when re-delivered or manually cleared), alerts contain no PII, and the
bucket is only readable with the agency's Cloudflare credentials.

Suggested sign-off wording for the practice owner:

> "If our email service fails at the moment someone submits the website contact form, the website
> briefly saves the person's submission — including the message text — in our website host's
> encrypted storage and alerts us the same day, so we can still reach out to them. Anything saved
> this way is deleted automatically after 14 days, and sooner once we've followed up. This is a
> technical failsafe only — it is not part of any clinical record."

Decision record (2026‑07‑23, agency): full-plaintext capture chosen over contact-fields-only and
encrypted variants; R2 over KV; success-UX after verified capture+alert; Phase 1 now / Phase 2
later. Research references: the 5-agent evaluation in this session (PHI analysis recommended
minimization — overridden with the compensating controls above; owner sign-off pending).
