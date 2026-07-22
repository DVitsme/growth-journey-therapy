# DNS migration — Bluehost → Cloudflare (without breaking email)

> Plan for moving `growthjourneytherapy.com` DNS from Bluehost to Cloudflare, so the website
> serves from the Cloudflare Worker (`growth-journey-therapy`) while **Gmail (Google Workspace)
> and Resend email keep working**. Verified 2026‑07‑22 against Google Workspace, Resend, AWS SES,
> Cloudflare docs, and RFC 7208/7489 (5-agent research pass). Live DNS captured via `dig`.

## Current state
- **Registrar/DNS:** nameservers `ns1.bluehost.com` / `ns2.bluehost.com` (Bluehost cPanel zone).
- **Website:** apex `A` + `www` → `162.241.230.123` (Bluehost).
- **Email:** **Gmail via Google Workspace** (5 Google MX on root) + **Resend** (transactional, on a
  `send` subdomain). Plus a large pile of Bluehost/cPanel auto-generated records.
- **⚠️ Pre-existing bug:** the `v=DMARC1; p=none;` record is on **`send`** (a plain TXT), not at a
  `_dmarc.…` name, so it does nothing. `_dmarc.growthjourneytherapy.com` is **empty** → the domain
  has **no working DMARC** today. We fix this during the move.

## The rule that protects email
On Cloudflare, **only A/AAAA/CNAME can be "Proxied" (orange)**. **MX and TXT are always DNS-only** —
so email records can't be accidentally proxied. The only proxied records are the website (apex +
`www` → Worker). Cloudflare's import scan **is not guaranteed to catch every record** — so every
record below is verified by hand *before* the nameserver switch.

---

## Record plan

### ✅ KEEP / MOVE — email (recreate exactly in Cloudflare, all DNS-only)

**Google Workspace (Gmail):**
| Type | Name | Value | Priority |
|---|---|---|---|
| MX | `@` | `aspmx.l.google.com` | 1 |
| MX | `@` | `alt1.aspmx.l.google.com` | 5 |
| MX | `@` | `alt2.aspmx.l.google.com` | 5 |
| MX | `@` | `alt3.aspmx.l.google.com` | 10 |
| MX | `@` | `alt4.aspmx.l.google.com` | 10 |
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=…` (verbatim; Cloudflare auto-splits the long key) | — |

*(No `google-site-verification` TXT exists — the domain is verified via the MX method, so keeping the
Google MX keeps it verified.)*

**Resend (contact-form / transactional):**
| Type | Name | Value | Priority |
|---|---|---|---|
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| TXT | `resend._domainkey` | `p=…` (verbatim) | — |

### 🔧 FIX / ADD
| Type | Name | New value | Note |
|---|---|---|---|
| TXT | `@` (root SPF) | `v=spf1 include:_spf.google.com ~all` | **Simplified** — drop the stale `+mx +a +ip4:162.241.230.123` (all Bluehost; nothing sends from there anymore). Keeps exactly one root SPF. |
| TXT | `_dmarc` | *(DEFERRED — 2026‑07‑22)* | Client + agency want **no DMARC report emails** → enable Cloudflare's free built-in **DMARC Management** (dashboard analytics, no inbox mail) **after cutover**. For now `_dmarc` stays empty; the mis-placed DMARC on `send` is still deleted. Mail unaffected (no DMARC policy meanwhile; SPF/DKIM verified aligned). Run `cf_reconcile.py` **without** `--dmarc`. |

*Both senders still pass DMARC (relaxed alignment): Gmail aligns at the root; Resend aligns on `send`
via its subdomain SPF + DKIM. **Keep the `send` SPF** — it forces SES's custom MAIL FROM; without it,
SES falls back to `amazonses.com` and DMARC alignment fails.*

### 🔁 REPLACE — website → Cloudflare Worker (Proxied / orange)
| Host | Old (drop) | New |
|---|---|---|
| `@` (apex) | `A → 162.241.230.123` | Worker custom domain (proxied; apex works via CNAME flattening) |
| `www` | `CNAME → growthjourneytherapy.com` | Worker custom domain (or redirect to apex) |

Add via **Workers → Custom Domains** (both `growthjourneytherapy.com` and `www.…`), or
`wrangler.jsonc` `routes` with `custom_domain: true`. Cloudflare auto-creates the record + TLS —
don't hand-create A records for these. **Only possible once the zone is ACTIVE** (a pending zone
can't attach a Custom Domain), and any manual apex `A` / `www` record must be **deleted first** or the
attach fails with a conflict — so this step happens *after* the nameserver flip (see sequence below).

### 🗑️ DROP — all Bluehost/cPanel cruft (do NOT carry over)
Every one of these points only at Bluehost and is dead once you leave:
- **cPanel service hosts (A → 162.241.230.123):** `*` (wildcard), `cpanel`, `whm`, `webmail`,
  `webdisk`, `ftp`, `mail`, `cpcontacts`, `cpcalendars`, `localhost` (→127.0.0.1).
- **Entire `website-b0814c7f` builder subdomain:** all its `A` records
  (`website-b0814c7f`, `autoconfig`, `autodiscover`, `cpanel`, `cpcalendars`, `cpcontacts`,
  `webdisk`, `webmail`, `whm`, `www`), its `default._domainkey.website-b0814c7f` DKIM, its SPF, its
  SRV (`_autodiscover`/`_caldav(s)`/`_carddav(s)._tcp.website-b0814c7f`), and its `_caldav`/`_carddav`
  TXT (`path=/`).
- **`default._domainkey`** (Bluehost cPanel mail DKIM — never signs your Google/Resend mail).
- The **mis-placed DMARC on `send`** (replaced by the proper `_dmarc`).

> Note: dropping the cPanel `_autodiscover` SRV isn't just cleanup — leaving it would actively
> **misdirect Outlook/mail clients to Bluehost** (no mailbox there).

---

## Verified live — 2026‑07‑22 (dig against Bluehost + Cloudflare nameservers; 4-agent research)
- **Cloudflare import is faithful.** The pending zone is already served by CF nameservers
  **`dorthy.ns.cloudflare.com` + `zac.ns.cloudflare.com`**, and every email record (5 Google MX,
  `google._domainkey`, `resend._domainkey`, `send` MX + `send` SPF) resolves **byte-identical** to
  Bluehost. Root SPF and the mis-placed `send` DMARC also imported as-is (both get fixed).
- **DNSSEC is OFF** — no `DS` at the `.com` parent, no `DNSKEY` at Bluehost, no `ad` flag. So there is
  **nothing to disable**; the "disable DNSSEC first" step is a no-op precaution (just confirm the
  Bluehost toggle stays off through cutover). This removes the main SERVFAIL risk.
- **No CAA records** → nothing blocks Cloudflare's edge-cert issuance when the Worker attaches.
- **⚠️ Google DKIM (`google._domainkey`) is truncated at the source** — a 2048-bit key cut to ~253
  chars (no `…IDAQAB`), identical on Bluehost and Cloudflare. Pre-existing (old cPanel 255-char TXT
  limit). Gmail still passes DMARC via the root SPF, so it's **not a cutover risk** — but DKIM isn't
  actually validating. **Optional fix:** copy the full key from Google Admin → Apps → Google Workspace
  → Gmail → Authenticate email, and replace the record in Cloudflare.
- **Reconcile script:** `cf_reconcile.py` (session scratchpad) — dry-run by default, atomic `batch`
  call, REVIEW bucket for anything unrecognized. `--apply --rua=<addr>` to execute.

## Safe cutover sequence (zero-downtime) — CORRECTED ordering
> Key correction: a Cloudflare **Worker Custom Domain can only attach once the zone is ACTIVE** (a
> pending zone can't proxy). So the Worker attaches **after** the nameserver flip, not during the
> pending-phase reconcile.
1. **Add the domain to Cloudflare** — done (pending; NS still Bluehost).
2. **Reconcile DNS records only** while Bluehost is still authoritative (nothing live changes): keep
   the 6 email records, simplify root SPF, add proper `_dmarc`, delete the mis-placed `send` DMARC +
   `default._domainkey` + apex `A` / `www` + all cPanel cruft. **No Worker attach yet.**
   (= `cf_reconcile.py --apply --rua=<addr>`.)
3. **Verify** via `dig` on **both** CF nameservers (block below) — MX, both DKIM, `_dmarc`, root SPF,
   and `send` records must resolve as expected.
4. **DNSSEC preflight** — confirm no `DS` at parent + Bluehost not signing (already true) and the
   Bluehost DNSSEC toggle is off.
5. **Change nameservers** at the registrar (Bluehost) → `dorthy` + `zac`.ns.cloudflare.com. Email
   can't gap: identical MX on both authoritative sets throughout propagation.
6. **Zone flips pending → active** (minutes, up to ~48h — the `.com` delegation TTL is Verisign's
   fixed 172800s, unshrinkable).
7. **Immediately attach the Worker** to apex + `www` (Workers Custom Domains, or `wrangler.jsonc`
   `routes` + `pnpm run deploy`). Cloudflare creates the managed proxied records + edge cert. Verify
   HTTPS on both hostnames (brief TLS errors while the cert issues are normal).
8. **Re-verify email end-to-end** (Gmail send/receive; Resend still "Verified" — 72h self-healing
   grace = no manual action). Optionally enable DNSSEC in Cloudflare + add the new `DS` at the
   registrar to re-harden.
9. **Later (separate from DNS):** flip `app/robots.ts` for the real launch.

### dig verification block
```bash
NS1=dorthy.ns.cloudflare.com; NS2=zac.ns.cloudflare.com; D=growthjourneytherapy.com
for NS in $NS1 $NS2; do echo "## $NS ##"
  dig @$NS $D MX +short | sort
  dig @$NS $D TXT +short
  dig @$NS google._domainkey.$D TXT +short
  dig @$NS resend._domainkey.$D TXT +short
  dig @$NS _dmarc.$D TXT +short
  dig @$NS send.$D MX +short
  dig @$NS send.$D TXT +short
done
# DNSSEC preflight — all empty:
dig DS $D +short; dig DNSKEY $D @ns1.bluehost.com +short
# After the flip:
dig NS $D +short; dig @1.1.1.1 $D MX +short
```

## Rollback
If anything looks wrong before step 5, nothing has changed (still on Bluehost). After step 5, revert
by changing nameservers back to `ns1/ns2.bluehost.com` (propagation-delayed).

## Execution state — ✅ CUTOVER COMPLETE (2026‑07‑22)
> **DONE:** NS flipped (registry → `dorthy`+`zac`.ns.cloudflare.com; zone **active** 20:11 UTC).
> Reconcile batch applied (10 clean records; email intact, root SPF simplified, cruft + broken `send`
> DMARC removed). Worker attached to apex + `www` via dashboard Custom Domains → both serve the new
> Next.js site over HTTPS (HTTP/2 200, valid cert). Email verified resolving. **Remaining:** DMARC
> (deferred → Cloudflare DMARC Management), optional DNSSEC re-enable, optional Google DKIM fix, and
> the general go-live checklist (robots.ts flip) — see the todo memory.
- Domain on Cloudflare, status **active** (was pending; NS now `dorthy`+`zac`.ns.cloudflare.com).
  Zone id `cc9bf62704f9676b9380b02acee88b74`. Account derrick@digitaldog.io (`CLOUDFLARE_ACCOUNT_ID`).
- **Option A chosen.** User created an account-wide **`CLOUDFLARE_API_TOKEN`** in `.env.local`. It has
  **Zone:Read** (can list all zones) but initially **lacked DNS:Edit** (GET `/dns_records` → 403/10000)
  → user is adding **Zone · DNS · Edit** to that same token. No env change needed once granted; every
  API call is scoped to this one zone id.
- **All research + live verification complete** (4 agents + dig): import faithful, DNSSEC off, no CAA,
  Google DKIM truncated at source (optional fix). See the "Verified live" section above.
- **Ready to run:** `cf_reconcile.py` (session scratchpad) — `python3 cf_reconcile.py` (dry-run) →
  `python3 cf_reconcile.py --apply --rua=<addr>` (atomic `batch`). Safe now: zone is pending, so it
  only affects what CF serves AFTER the flip; live Bluehost email/web is untouched.
- **Still needed from user:** confirm token DNS:Edit granted, then reply "done". (DMARC **deferred** →
  run reconcile WITHOUT `--dmarc`; enable Cloudflare DMARC Management post-cutover — see FIX/ADD table.)
- **After reconcile + dig-verify → user changes nameservers** (DNSSEC already off) → zone active →
  **then** attach Worker to apex + www.

## Changelog
- **2026‑07‑22** — Plan drafted from live DNS + 5-agent verification.
- **2026‑07‑22** — Domain added to Cloudflare (pending). OAuth token lacks DNS-edit scope → awaiting Option A/B.
- **2026‑07‑22** — Option A chosen; account-wide `CLOUDFLARE_API_TOKEN` added (Zone:Read; DNS:Edit being
  granted). 4-agent research + live dig verification done; `cf_reconcile.py` written; cutover sequence
  corrected (Worker attaches **after** the zone is active, not during the pending reconcile).
- **2026-07-22** — ✅ CUTOVER COMPLETE: NS flipped → zone active; `cf_reconcile.py --apply` ran (10
  records, email intact, SPF simplified, cruft removed); Worker attached to apex+www via dashboard
  (HTTPS 200, new site live); email verified. DMARC deferred.
