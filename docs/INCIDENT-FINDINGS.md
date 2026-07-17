# Incident findings — growthjourneytherapy.com

Gathered over authorized SSH (`growtie8@box5335.bluehost.com`) on 2026-07-09, read-only.
Nothing was changed on the server. This documents the active compromise and the containment order.

## The hack is active and self-perpetuating

- **Type:** database-resident SEO doorway spam. 1,047 posts exist; ~1,029 are injected
  casino/betting/crypto spam in ~a dozen languages. Her real content is **18 posts + 35 pages**.
- **Live injector — Code Snippets plugin.** Table `wpyi_snippets` has four active snippets all named
  **"Analytics Configuration"** (ids **6, 7, 8, 9**, ~14 KB each) containing obfuscated PHP
  (`function _c9da8d($_x){…}`, base64 blobs like `"font"=>"aHR0cHM6…"`). This is what injects
  `https://trainer71245.icu/t.js?site=b5c696c9f640fd6a2e54457512f7431a` into **every** rendered page
  and mints the spam. Confirmed executing: WP-CLI itself emitted
  `Warning: … code-snippets/php/snippet-ops.php(663) : eval()'d code` on load.
- **Rogue admin accounts** (`wpyi_users`), both created **2026-07-09 10:09** with live sessions:
  - id **8** `wp-backup` / system@openreplay.com
  - id **9** `backupadmin` / backupadmin@wordpress.com
- **Legit admin:** id 1 `admin` / dvalentine2012@gmail.com (2025-07-29, the rebuild).

## What is clean (checked, ruled out)

- `~/.ssh/authorized_keys`: only our rescue key. Attacker is **not** persisting via SSH.
- `wp-content/mu-plugins/`: stock Bluehost drop-ins only (`endurance-*`, `sso.php`).
- `wp-content/uploads/`: no PHP webshells (two `index.php` are standard blank guards).
- Production has **no** recently-modified PHP outside `uploads/`. The injection is entirely
  DB-resident — file tree is intact. (A separate `./staging/` copy exists; out of scope.)
- Her 18 posts' `post_content` is intact and clean — the attacker added spam, did not edit her work.

## Entry vector (unconfirmed — must be closed before cleanup)

Not proven from read-only recon. Most likely a stolen/reused admin credential or a vulnerable plugin;
`all-in-one-wp-migration-unlimited`, `code-snippets`, and the `backuply` pair are the surfaces to
audit. **Deleting the snippets and rogue admins without closing this will not hold** — they have live
sessions and will re-add persistence within hours.

## Containment order (do NOT reorder)

1. **Rotate every credential first** — cPanel/Bluehost password + 2FA, WP admin (id 1) password,
   the `wpyi_` DB password (update `wp-config.php`), and Cloudflare login + 2FA. The attacker has a
   live session; nothing below holds until they're locked out.
2. **Invalidate all sessions:** `wp user session destroy --all` (kicks the rogue admins immediately).
3. **Remove persistence:** deactivate then delete snippets 6–9; delete users 8 (`wp-backup`) and
   9 (`backupadmin`), reassigning nothing (they authored only spam).
4. **Close the entry vector:** update/audit all plugins, or ideally rebuild WP clean on a fresh
   install and re-point only her recovered content.
5. **Purge spam + reclaim SEO:** bulk-delete the ~1,029 spam posts, then in Google Search Console
   request removal and confirm no manual action. This gates the Next.js launch (§ migration plan).

## Reversible quick-win (stops visitor-facing malware in seconds, if you want it now)

Deactivating the four snippets halts the `trainer71245.icu` injection immediately and is fully
reversible (it does not delete anything):

```bash
# over the existing SSH session:
wp snippet deactivate 6 7 8 9        # if the 'wp snippet' command is registered by the plugin
# fallback if that subcommand is absent:
wp db query "UPDATE wpyi_snippets SET active=0 WHERE id IN (6,7,8,9);"
wp user session destroy --all        # also drops the attacker's live sessions
```

This is a change to the production site, so it is **not** done automatically — it is here for you or
the client to run (or to authorize). It is a stopgap, not containment: without step 1 the attacker
can re-enable it.

## Actions taken 2026-07-09 (authorized stopgap — reversible, nothing deleted)

Executed over SSH with the client's go-ahead, to stop active visitor-facing malware:

1. Deactivated malicious snippets 6–9 (`UPDATE wpyi_snippets SET active=0 WHERE id IN (6,7,8,9)`).
   Snippet 5 ("Disable Divi Blog Image Cropping", her dev's `gjt_`-prefixed code) left active.
2. Flushed object cache + 55 transients; refreshed the Code Snippets cache.
3. Deleted all `session_tokens` (global logout — kicked both rogue admins).
4. Purged Bluehost endurance page cache + removed on-disk `advanced-cache.php`.

**Verified:** `trainer71245.icu` now returns 0 hits on canonical homepage + post URLs; spam post
count frozen at 1,047 (no new posts since). `cf-cache-status: none` — no stale Cloudflare cache.

**This is a stopgap, not a fix.** Nothing was deleted; the two rogue admin ACCOUNTS (ids 8, 9) and
the deactivated snippets still exist, and the attacker's credentials/entry vector are unchanged.
Until the client completes step 1 (rotate all credentials), the attacker can log back in and
re-enable everything. Rotation is urgent — ideally same-day. After rotation, run steps 2–5 above to
delete the persistence for good.

Rescue SSH key is still authorized (server) and loaded in the local agent, to support that cleanup.

## IOC quick list (for the cleanup / Search Console)

- Injected script host: `trainer71245.icu` (path `/t.js?site=b5c696c9f640fd6a2e54457512f7431a`)
- Malicious snippets: `wpyi_snippets` ids 6,7,8,9 "Analytics Configuration"
- Rogue admins: `wp-backup` (system@openreplay.com), `backupadmin` (backupadmin@wordpress.com)
- Spam post ID range: ≥ 231510 (her content is ≤ 231319); spam categories 1, 21–32
