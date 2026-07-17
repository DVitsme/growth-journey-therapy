# Contact Form Spec — Resend + Next.js 16, Growth Journey Therapy

Researched 2026-07-09. Target stack verified locally: Next.js 16.2.10, React 19.2.4,
react-dom 19.2.4 (repo: /home/nero/Clients/growthjourneytherapy). Local Next docs read:
`node_modules/next/dist/docs/01-app/02-guides/forms.md` and `server-actions.md`.

---

## 0. TL;DR decisions

| Question | Decision |
|---|---|
| Transport | **Server Action** (not a Route Handler) — idiomatic per the local Next 16 forms guide |
| Packages | `resend@6.17.2`, `@react-email/components@1.0.12`, `zod` (v4) |
| HIPAA | **Resend does NOT sign a BAA and is not HIPAA-eligible.** Form must be PHI-minimal: name, email, phone, preferred contact time, language. **No free-text "what brings you here" field.** Clinical intake goes through a BAA-covered system (SimplePractice / Hushmail). |
| Spam | **Cloudflare Turnstile** (site is already on Cloudflare) + honeypot + min-time check. |
| Hooks | `useActionState` from **`react`**; `useFormStatus` from **`react-dom`** (empirically verified in installed packages). `useFormState` is the dead React-18 name — do not use. |
| Sending identity | Verify subdomain `send.growthjourneytherapy.com` in Resend; from `Growth Journey Therapy <hello@send.growthjourneytherapy.com>`, reply-to = her monitored practice mailbox. |

---

## 1. Resend + Next.js App Router integration

### What Resend's docs show vs. what to build

Resend's official Next.js quickstart (https://resend.com/docs/send-with-nextjs) demonstrates a
**Route Handler** at `app/api/send/route.ts` with `resend.emails.send({ ..., react: EmailTemplate({...}) })`.
That guide is generic (it also covers Pages Router). For a form in Next 16, the **local Next docs
explicitly prescribe Server Actions** (`forms.md`: "React Server Actions ... can be called in Server
and Client Components to handle form submissions"), and a Server Action removes the need to hand-roll
a fetch, CSRF story, and JSON parsing. **Use a Server Action.** A Route Handler adds nothing here —
there is no third-party caller.

- `resend` npm: **6.17.2** (latest as of 2026-07-09, per npm registry).
- SDK v4+ uses **camelCase** fields: `replyTo`, not `reply_to`.
- Templates: `@react-email/components` **1.0.12**. Pass the element via the `react` field;
  Resend renders it server-side. Also pass a `text` fallback (deliverability, §6).
- `resend.batch.send([...])` can send the owner notification + the client confirmation in **one**
  API call — relevant because the default rate limit is **2 requests/second** and free tier is
  **100 emails/day, 3,000/month** (fine for a therapy practice).

### File layout

```
app/
  contact/page.tsx          # EN form (Server Component wrapping the client form)
  contacto/page.tsx         # ES form (same client component, locale="es")
  lib/contact/action.ts     # 'use server' — validate, verify Turnstile, send via Resend
  lib/contact/schema.ts     # zod schema shared by action
components/contact-form.tsx # 'use client' — useActionState + Turnstile widget
emails/inquiry.tsx          # React Email templates (notification + confirmation, bilingual)
```

### `app/lib/contact/schema.ts`

```ts
import { z } from 'zod' // zod v4 — z.email() is top-level now

export const inquirySchema = z.object({
  name: z.string().trim().min(1, 'required').max(100),
  email: z.email('invalid'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  preferredTime: z.enum(['morning', 'afternoon', 'evening', 'any']),
  consent: z.literal('on'), // "you may contact me at the info above"
  locale: z.enum(['en', 'es']),
  // spam controls
  website: z.literal(''),                    // honeypot — must stay empty
  startedAt: z.coerce.number(),              // set client-side on mount
})
export type Inquiry = z.infer<typeof inquirySchema>
```

### `app/lib/contact/action.ts`

```ts
'use server'

import { Resend } from 'resend'
import { headers } from 'next/headers'
import { inquirySchema } from './schema'
import { InquiryNotification, InquiryConfirmation } from '@/emails/inquiry'

const resend = new Resend(process.env.RESEND_API_KEY)

export type ContactState = {
  status: 'idle' | 'ok' | 'error'
  errors?: Record<string, string[]>
  message?: string
}

async function verifyTurnstile(token: string, ip: string | null) {
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    },
  )
  const data: { success: boolean } = await res.json()
  return data.success
}

export async function submitInquiry(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = inquirySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', errors: parsed.error.flatten().fieldErrors }
  }
  const d = parsed.data

  // -- spam gates ---------------------------------------------------------
  // 1. honeypot already enforced by schema (website === '')
  // 2. humans take longer than 3s to fill a form
  if (Date.now() - d.startedAt < 3000) return { status: 'ok' } // silently drop
  // 3. Turnstile
  const h = await headers() // Next 16: headers() is async
  const token = formData.get('cf-turnstile-response')
  const ip = h.get('cf-connecting-ip') ?? h.get('x-forwarded-for')
  if (typeof token !== 'string' || !(await verifyTurnstile(token, ip))) {
    return { status: 'error', message: 'captcha' }
  }

  // -- send both emails in ONE batch call (2 req/s rate limit) -------------
  const { error } = await resend.batch.send([
    {
      from: 'Growth Journey Therapy <hello@send.growthjourneytherapy.com>',
      to: [process.env.PRACTICE_INBOX!], // her monitored practice mailbox
      replyTo: d.email,
      subject: `New website inquiry — ${d.name}`,
      react: InquiryNotification({ inquiry: d }),
      text: `New inquiry from ${d.name} <${d.email}> ${d.phone ?? ''} — prefers ${d.preferredTime}, language: ${d.locale}`,
    },
    {
      from: 'Growth Journey Therapy <hello@send.growthjourneytherapy.com>',
      to: [d.email],
      replyTo: process.env.PRACTICE_INBOX!,
      subject:
        d.locale === 'es'
          ? 'Recibimos tu mensaje — Growth Journey Therapy'
          : 'We received your message — Growth Journey Therapy',
      react: InquiryConfirmation({ name: d.name, locale: d.locale }),
      text:
        d.locale === 'es'
          ? `Hola ${d.name}, recibimos tu mensaje y te contactaremos dentro de 1–2 días hábiles.`
          : `Hi ${d.name}, we received your message and will reach out within 1–2 business days.`,
    },
  ])

  if (error) return { status: 'error', message: 'send-failed' }
  return { status: 'ok' }
}
```

### `components/contact-form.tsx`

```tsx
'use client'

import { useActionState } from 'react'        // React 19: lives in `react`
import { useFormStatus } from 'react-dom'     // React 19: lives in `react-dom`
import Script from 'next/script'
import { submitInquiry, type ContactState } from '@/app/lib/contact/action'

const copy = {
  en: {
    name: 'Your name', email: 'Email', phone: 'Phone (optional)',
    time: 'Best time to reach you', submit: 'Send',
    ok: 'Thank you — we will reach out within 1–2 business days.',
    disclaimer: /* §2 English disclaimer */ '',
  },
  es: {
    name: 'Tu nombre', email: 'Correo electrónico', phone: 'Teléfono (opcional)',
    time: 'Mejor horario para contactarte', submit: 'Enviar',
    ok: 'Gracias — te contactaremos dentro de 1 a 2 días hábiles.',
    disclaimer: /* §2 Spanish disclaimer */ '',
  },
} as const

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending}>{pending ? '…' : label}</button>
}

export function ContactForm({ locale }: { locale: 'en' | 'es' }) {
  const t = copy[locale]
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    submitInquiry,
    { status: 'idle' },
  )

  if (state.status === 'ok') return <p role="status">{t.ok}</p>

  return (
    <form action={formAction}>
      <p className="disclaimer">{t.disclaimer}</p>

      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="startedAt" value={Date.now()} />
      {/* honeypot — visually hidden, never display:none-only (bots check) */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label>{t.name}<input name="name" required maxLength={100} /></label>
      <label>{t.email}<input name="email" type="email" required /></label>
      <label>{t.phone}<input name="phone" type="tel" /></label>
      <label>{t.time}
        <select name="preferredTime" defaultValue="any">
          <option value="morning">{locale === 'es' ? 'Mañana' : 'Morning'}</option>
          <option value="afternoon">{locale === 'es' ? 'Tarde' : 'Afternoon'}</option>
          <option value="evening">{locale === 'es' ? 'Noche' : 'Evening'}</option>
          <option value="any">{locale === 'es' ? 'Cualquiera' : 'Any'}</option>
        </select>
      </label>
      <label>
        <input type="checkbox" name="consent" required />
        {locale === 'es'
          ? 'Autorizo que me contacten usando la información proporcionada.'
          : 'I agree to be contacted using the information provided.'}
      </label>

      {/* Turnstile: injects hidden input `cf-turnstile-response` into this form */}
      <div
        className="cf-turnstile"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-language={locale}
      />
      <Script src="https://challenges.cloudflare.com/turnstile/api.js" async defer />

      {state.status === 'error' && (
        <p role="alert">
          {locale === 'es'
            ? 'Hubo un problema. Intenta de nuevo o llámanos directamente.'
            : 'Something went wrong. Please try again or call us directly.'}
        </p>
      )}
      <SubmitButton label={t.submit} />
    </form>
  )
}
```

Env vars: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `PRACTICE_INBOX`.

Install: `pnpm add resend @react-email/components zod`

---

## 2. THE COMPLIANCE QUESTION — Resend is NOT HIPAA-eligible

### Findings (verified 2026-07-09)

- **Resend does not sign BAAs and does not claim HIPAA eligibility anywhere.**
  - https://resend.com/security lists exactly two compliance programs: **SOC 2 Type II** and
    **GDPR**. Zero mentions of HIPAA or BAA.
  - https://resend.com/enterprise (their top-tier plan page): same — SOC 2, GDPR, AES-256 at
    rest, TLS in transit. **No HIPAA, no BAA, even at Enterprise.**
  - A `site:resend.com HIPAA` search surfaces HIPAA only in a blog post reviewing a *third-party*
    service. Resend has never published a HIPAA posture.
- Under HIPAA, a vendor that stores/transmits PHI on behalf of a covered entity is a business
  associate and **must** have a signed BAA before PHI touches it (45 CFR 164.502(e); HHS:
  https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html).
  SOC 2 is irrelevant to this — no BAA means no PHI, period.
- Nuance that matters here: a message on a *therapy practice's* contact form — even just
  name + email — identifies the person **as someone seeking mental-health care**, which is
  individually identifiable health information once the practice holds it. (HHS's online-tracking
  guidance took this position; parts were vacated for unauthenticated *browsing* in *AHA v.
  Becerra*, N.D. Tex. 2024, but a **voluntary form submission requesting therapy** is squarely
  identifiable and treatment-related.) Also: if she doesn't bill insurance electronically she may
  not technically be a HIPAA covered entity — but PA licensing-board confidentiality rules and
  ordinary negligence liability apply regardless. **Design as if HIPAA applies.**

### The pattern: two lanes

**Lane 1 — the website form (goes through Resend): scheduling-only, PHI-minimal.**
- Fields: name, email, phone (optional), preferred contact time, language, consent checkbox.
- **No "what brings you here" / message textarea. At all.** Every free-text box on a therapist's
  site becomes a symptom description within a week. Removing the field is the only mitigation
  that actually works; a warning label above a textarea does not.
- Disclaimer (below) rendered above the fields, plus crisis-line notice.
- Residual risk to disclose to the client (the therapist): even the minimal fields, transiting
  Resend, arguably constitute PHI (identity + prospective-patient status). This is the widely
  used, low-risk-tolerance-acceptable pattern for *initial contact* (HHS treats first-contact
  channels pragmatically — patients email practices unprompted all the time), but she should
  sign off on it. If she wants **zero** identifiable data through Resend, the form must be
  replaced by Lane 2 entirely, or the Resend email must say only "A new inquiry arrived" with
  the fields stored in a BAA-covered system — which contradicts the no-CMS/no-database
  constraint. Recommend: minimal-field form + her documented sign-off.

**Lane 2 — actual clinical intake: a BAA-covered channel, linked from the thank-you state and
the confirmation email.** Options in ascending cost:
- **SimplePractice** — the dominant solo-therapist EHR; signs a BAA; has a prospective-client
  "Request appointment" widget/link. If she already uses it (very likely), just link her client
  portal URL. Zero new cost.
- **Hushmail for Healthcare** — BAA included even on the ~$12/mo solo plan; encrypted email +
  HIPAA-compliant web intake forms; extremely common among therapists. Good if she has no EHR.
- **Spruce** (HIPAA phone/SMS/fax, BAA) or **Paubox** (HIPAA email API/gateway, BAA on all
  plans) if she wants compliant *messaging* rather than forms. Paubox is also the answer if she
  ever insists on a free-text field emailed to her: swap the Resend call for Paubox's API for
  that one email. Do not build this now.

**Auto-reply caution (privacy, not just deliverability):** the confirmation email itself tells
anyone with access to the prospect's inbox that they contacted a therapist. Keep it generic
("Growth Journey Therapy — we received your message"), never echo back form contents, and offer
her the option to disable it.

### Disclaimer copy (place above the form fields)

**English:**
> **Please do not include any medical or mental-health information in this form.** This form is
> only for requesting an appointment or asking a general question, and it is not an encrypted
> medical communication. Once we connect, we'll share any clinical information through a secure,
> HIPAA-compliant system. **If you are in crisis or experiencing a mental-health emergency, call
> or text 988 (Suicide & Crisis Lifeline) or call 911 — do not use this form.**

**Spanish:**
> **Por favor, no incluya información médica ni de salud mental en este formulario.** Este
> formulario es únicamente para solicitar una cita o hacer una pregunta general, y no es un medio
> de comunicación médica cifrado. Una vez que estemos en contacto, compartiremos cualquier
> información clínica a través de un sistema seguro que cumple con HIPAA. **Si está en crisis o
> atraviesa una emergencia de salud mental, llame o envíe un mensaje de texto al 988 (Línea de
> Prevención del Suicidio y Crisis — atención disponible en español) o llame al 911; no use este
> formulario.**

---

## 3. Spam protection (no auth, no login)

| Option | Verdict |
|---|---|
| **Cloudflare Turnstile** | **RECOMMENDED.** Free, unlimited. The domain is *already on Cloudflare*, so the dashboard, analytics, and (optionally) WAF-level integration are in one place. "Managed" mode is invisible for ~99% of humans (no puzzles — important for a therapy audience that may be low-tech or in distress). Privacy-clean: no cross-site tracking, no Google — fits the compliance posture of §2. Server verify: POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Works with Server Actions out of the box because the widget injects a hidden `cf-turnstile-response` input into the form (in the FormData). |
| hCaptcha | Fine, privacy-decent, but a second vendor for no benefit over Turnstile here, and its free tier shows visual challenges more often. Skip. |
| Honeypot + timing only | Keep as **defense-in-depth** (they're free and catch dumb bots without any widget), but alone they do not stop targeted or headless-browser spam — and this domain is *currently being actively spammed by a Russian SEO crew*, so assume it is on target lists. Not sufficient alone. |
| Resend rate limits | Not a spam defense at all — 2 req/s is Resend throttling *you*; it protects Resend, not the form. The free tier's 100/day cap is actually a *risk*: a bot flood exhausts the day's quota and blocks real inquiries. Another reason to gate with Turnstile *before* calling Resend. |

**Recommendation: Turnstile (managed mode) + honeypot + 3-second minimum-fill time**, all three
implemented in §1's code. Setup: Cloudflare dashboard → Turnstile → Add site →
`growthjourneytherapy.com` → Managed → copy site key (public) and secret key (env var).
Optionally also add a Cloudflare WAF rate-limiting rule on `POST /contact*` (5/min/IP) since the
site is proxied anyway — free plan includes one rate-limiting rule.

---

## 4. Validation — zod + React 19 form primitives (EMPIRICALLY VERIFIED)

Ran against the installed packages on 2026-07-09:

```
$ head -5 node_modules/react/package.json            → react (version 19.2.4 per lockfile/react-dom peer)
$ grep -oE "useActionState|useFormStatus|useFormState" node_modules/react/cjs/react.development.js | sort -u
useActionState
$ grep -oE "useActionState|useFormStatus|useFormState" node_modules/react-dom/cjs/react-dom.development.js | sort -u
useFormState
useFormStatus
$ head -5 node_modules/react-dom/package.json        → "version": "19.2.4"
```

Conclusions (match the local Next 16 `forms.md` guide):
- **`useActionState`** — import from **`react`**. Signature: `const [state, formAction, pending] = useActionState(actionFn, initialState)`. This is the renamed/moved successor of React 18's `ReactDOM.useFormState`. Note the action's signature gains a first `prevState` argument.
- **`useFormStatus`** — import from **`react-dom`**. Must be called in a component *nested inside* the `<form>` (the `SubmitButton` pattern). In React 19 it returns `{ pending, data, method, action }`.
- **`useFormState`** — still physically present in react-dom 19.2.4 as a deprecated alias. **Do not use it**; it warns and lacks the `pending` return.
- zod: install latest (**v4**). v4 notes relevant to the snippet: `z.email()` is top-level (preferred over `z.string().email()`), and v3's `invalid_type_error` param (which the local Next docs still show — they lag zod) is replaced by `error`. `safeParse` + `error.flatten().fieldErrors` still work.

---

## 5. DNS for Resend on growthjourneytherapy.com (Cloudflare-managed zone)

Resend requires three records per verified domain (per https://resend.com/docs/dashboard/domains/introduction):
SPF (TXT), DKIM (TXT), and an MX for bounce/complaint feedback. Resend explicitly recommends
verifying a **subdomain** ("We recommend sending your emails from one or more subdomains … to
isolate your sending reputation"). Use **`send.growthjourneytherapy.com`**.

Exact values are generated per-domain in the Resend dashboard (Domains → Add Domain), but the
shape is always (Resend rides Amazon SES infrastructure):

| Type | Name (host) | Value | Notes |
|---|---|---|---|
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF for the sending subdomain |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com`, priority 10 | region varies with the Resend region you pick |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEB…` (unique) | DKIM public key (1024-bit) |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@growthjourneytherapy.com; adkim=r; aspf=r` | start at `p=none` for 2 weeks if cautious, then `quarantine`. DMARC lives at the **apex** and covers the subdomain |

### Cloudflare gotchas — call these out to whoever adds the records

1. **"DNS only" / gray cloud.** Cloudflare's proxy (orange cloud) rewrites records to Cloudflare
   IPs, which breaks mail infrastructure. MX and TXT records have no proxy toggle (Cloudflare
   can't proxy them), so these three are safe *as typed* — but **if Resend's dashboard or any
   guide ever hands you a CNAME** (e.g., a custom click/open-tracking domain later), Cloudflare
   defaults new CNAMEs to **Proxied**, and Resend verification will fail until you flip it to
   **DNS only**. Check every record shows the gray cloud.
2. **Name auto-append.** In the Cloudflare record form, enter the host as `send`, **not**
   `send.growthjourneytherapy.com` — Cloudflare appends the zone, and the double-domain typo
   (`send.growthjourneytherapy.com.growthjourneytherapy.com`) is the #1 verification failure.
3. **Do not touch the apex MX.** Her real mailbox (currently Bluehost mail or whatever the apex
   MX points at) is unrelated; Resend's MX goes only on the `send` subdomain. Similarly, if
   Cloudflare Email Routing is ever enabled, it manages apex MX — no conflict with `send.*`.
4. Verification in the Resend dashboard usually completes in minutes once records are gray-cloud
   and correctly named; Cloudflare propagation is near-instant.

---

## 6. Deliverability for the auto-reply (cold-address transactional)

The notification to her own inbox is trivial. The confirmation to a stranger's Gmail/Outlook is
where spam-foldering happens. Setup that keeps it out:

- **From:** `Growth Journey Therapy <hello@send.growthjourneytherapy.com>` — a human-readable
  from-name, on the **verified subdomain**, so DKIM (d=send.growthjourneytherapy.com) and SPF both
  align with the From domain → DMARC passes with alignment. Never send from `@resend.dev`, never
  from the bare apex (unverified), never from a Gmail address.
- **Reply-To:** her real, monitored practice mailbox (e.g. `contact@growthjourneytherapy.com`).
  Replies work even though the from-address is on the send subdomain. (In the SDK: `replyTo`.)
- **Content:** short, plain, expected. The person just submitted a form, so engagement signals are
  good — don't squander them. One link maximum (the secure-intake link from §2), no link
  shorteners, no attachments, no ALL-CAPS/urgency wording. Send **both `react` (HTML) and `text`**
  parts — multipart with a plain-text alternative measurably helps filters, and Resend lets you
  pass both.
- **Subject** references their action: "We received your message — Growth Journey Therapy" /
  "Recibimos tu mensaje…". Transactional-sounding, not promotional.
- **Leave Resend open/click tracking OFF** (it's off by default). Tracking rewrites every link
  through a redirect domain, which hurts spam scoring — and open-tracking a therapy inquiry is a
  privacy smell besides.
- **DMARC at enforcement** (`p=quarantine`) after a burn-in — Gmail/Yahoo's 2024+ sender rules
  effectively require SPF+DKIM+DMARC even at low volume; this domain will be squeaky-clean, which
  matters extra given its current spam-hack history (§: the domain's *web* reputation is damaged;
  a fresh, fully-authenticated `send.` subdomain isolates mail reputation from that).
- Volume is tiny (a handful/day), so no warm-up needed; subdomain isolation is the main lever.

---

## 7. Bilingual (EN/ES)

- Two routes render one component: `/contact` → `<ContactForm locale="en" />`, `/contacto` →
  `<ContactForm locale="es" />` (matches her existing WP structure, which had `/contact/` and
  `/contacto/`). A hidden `<input name="locale">` carries the language into the Server Action —
  no i18n framework needed for one form.
- Turnstile localizes via `data-language={locale}`.
- The action picks subject + template copy by `d.locale`. One React Email component, one dictionary:

```tsx
// emails/inquiry.tsx
import { Html, Head, Body, Container, Text, Link, Preview } from '@react-email/components'

const t = {
  en: {
    preview: 'We received your message',
    greeting: (n: string) => `Hi ${n},`,
    body: 'Thank you for reaching out to Growth Journey Therapy. We received your message and will contact you within 1–2 business days at the phone number or email you provided.',
    secure: 'If you would like to get started sooner, you can complete our secure intake form here:',
    crisis: 'If you are in crisis, call or text 988 (Suicide & Crisis Lifeline) or call 911.',
  },
  es: {
    preview: 'Recibimos tu mensaje',
    greeting: (n: string) => `Hola ${n}:`,
    body: 'Gracias por comunicarte con Growth Journey Therapy. Recibimos tu mensaje y te contactaremos dentro de 1 a 2 días hábiles al teléfono o correo que proporcionaste.',
    secure: 'Si deseas comenzar antes, puedes completar nuestro formulario de admisión seguro aquí:',
    crisis: 'Si estás en crisis, llama o envía un mensaje de texto al 988 (atención en español disponible) o llama al 911.',
  },
} as const

export function InquiryConfirmation({ name, locale }: { name: string; locale: 'en' | 'es' }) {
  const c = t[locale]
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body>
        <Container>
          <Text>{c.greeting(name)}</Text>
          <Text>{c.body}</Text>
          <Text>
            {c.secure} <Link href={process.env.SECURE_INTAKE_URL}>{process.env.SECURE_INTAKE_URL}</Link>
          </Text>
          <Text>{c.crisis}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export function InquiryNotification({ inquiry }: { inquiry: { name: string; email: string; phone?: string; preferredTime: string; locale: string } }) {
  return (
    <Html>
      <Body>
        <Container>
          <Text>New inquiry from the website:</Text>
          <Text>Name: {inquiry.name}</Text>
          <Text>Email: {inquiry.email}</Text>
          <Text>Phone: {inquiry.phone || '—'}</Text>
          <Text>Preferred time: {inquiry.preferredTime} · Language: {inquiry.locale === 'es' ? 'Español' : 'English'}</Text>
        </Container>
      </Body>
    </Html>
  )
}
```

Note the confirmation deliberately does **not** echo the person's phone/preferred time back —
minimal content, per §2's privacy caution.

---

## Sources

- Resend security page (SOC 2 + GDPR only, no HIPAA/BAA): https://resend.com/security
- Resend enterprise page (no HIPAA/BAA even at top tier): https://resend.com/enterprise
- Resend Next.js quickstart (Route Handler example, `react:` template param): https://resend.com/docs/send-with-nextjs
- Resend domain/DNS docs (SPF TXT + DKIM TXT + feedback MX, subdomain recommendation, 1024-bit DKIM): https://resend.com/docs/dashboard/domains/introduction
- Resend rate limits (2 req/s default) and pricing (free = 3,000/mo, 100/day): https://resend.com/docs/api-reference/rate-limit, https://resend.com/pricing
- npm registry (2026-07-09): resend@6.17.2, @react-email/components@1.0.12
- HHS sample BAA provisions: https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html
- Local Next 16 docs: node_modules/next/dist/docs/01-app/02-guides/forms.md, server-actions.md
- Installed packages: react/react-dom 19.2.4 (hook exports grep-verified)
- Cloudflare Turnstile siteverify: https://challenges.cloudflare.com/turnstile/v0/siteverify
