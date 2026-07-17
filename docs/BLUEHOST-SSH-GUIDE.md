# Bluehost SSH + Data Extraction Guide — growthjourneytherapy.com
**Audience:** Linux developer with full Bluehost + cPanel access. **Execute tomorrow.**
Local disk has **~5 GB free** — never pull the whole account, never download a 9.7 GB backup here.

**Read §9 (security) before you connect. The site is actively compromised** — spam posts were created
the same day this was written, and Sucuri flags live visitor-facing malware. Treat the host as enemy
territory.

---

## 0. What this guide is for (verifier-corrected priorities)

**SSH IS available on Bluehost shared hosting in 2026** (confirmed against Bluehost's own "SSH Access"
article, both the live cPanel path and the Account Manager toggle). It is **off by default**.

But two rulings from the adversarial verifiers change how you use it:

1. **The live WordPress REST API is the PRIMARY content source, not the backups.** Her 18 current posts
   and 35 pages come off `/wp-json` cleanly and for free (see OUT-POST-RECOVERY.md). So SSH's real jobs
   here are, in order: **(a)** incident-response recon during containment (rogue admins, backdoors,
   IOCs); **(b)** a `mysqldump` of the live **content tables** to recover **revisions** (pre-tamper
   originals of any post the attacker edited) and to diff against the REST pull; **(c)** an image-only
   `rsync` of `wp-content/uploads`. You do **not** need SSH to get the 18 posts.
2. **The 9.7 GB backups must be processed ON the server, never downloaded here** (they don't fit: ~5 GB
   free vs 9.7 GB each). Only touch them if the client wants the 49 deleted Gen2 bodies, and only via
   the server-side streaming commands in `cpanel-extract.md`.

> ⚠ **CRITICAL FIX to the earlier draft of this guide:** the old filter `ID < 100000` is **WRONG and
> would silently drop 17 of her 18 posts.** Her real posts on the CURRENT database are id **740** and
> **230978–231319** — almost all *above* 100000. The correct rule is **posts: `ID <= 231319` (or
> category ∈ {16,17,18,19}); spam: `ID >= 231510`.** Every SQL/filter below uses the corrected boundary.

---

## 1. Enable SSH (current 2025–2026 UI)

**Path A — Account Manager (primary):**
1. Log in at `https://www.bluehost.com/my-account/login`.
2. **Websites → Manage Site** (sometimes **Settings**) on the site card.
3. **Files & Access** tab (older builds: **Settings** tab).
4. **SSH** section → **Manage** → toggle **Shell Access** ON.
   The same panel has **Manage SSH Keys → Add SSH Key**.

**Path B — cPanel (still works):** cPanel → **Security → SSH Access** → **Manage SSH Keys**.

**Legacy-account gotcha (verified, real):** some accounts show
`ERROR: Your account must be verified before shell access can be enabled. Please contact our
Verification Department (888-401-4678).` If the toggle is missing/greyed, open Bluehost live chat, ask
to "enable Shell Access," and **start the §8 cPanel fallback in parallel** — verification can take hours.

---

## 2. Generate a dedicated keypair locally

This key will sit in a compromised server's `authorized_keys` — **do not reuse your personal key.**

```bash
ssh-keygen -t ed25519 -a 64 -f ~/.ssh/bluehost_gjt_ed25519 -C "gjt-rescue-2026"
# RSA fallback — Bluehost's key UI historically only documents RSA/DSA:
ssh-keygen -t rsa -b 4096 -f ~/.ssh/bluehost_gjt_rsa -C "gjt-rescue-2026-rsa"
```
Use a passphrase on both. **Import ed25519 first; if `Permission denied (publickey)`, use the RSA key.**
Never generate the key server-side (that means downloading a private key from a hacked host).

---

## 3. Import AND authorize the public key (two steps — skipping the 2nd is the #1 failure)

**cPanel:** Security → SSH Access → **Manage SSH Keys → Import Key** → name it, paste
`~/.ssh/bluehost_gjt_ed25519.pub` into the **public key** box (leave private empty) → **Import** →
back to Manage Keys → **Manage → Authorize** (status must read **authorized**).

**Account Manager:** Files & Access → SSH → Manage → **Manage SSH Keys → Add SSH Key** (authorized on
add). If login fails, verify **authorized** on the cPanel Manage SSH Keys page.

---

## 4. Connection details

- **Username:** the **cPanel username** (cPanel → right sidebar *General Information* → Current User) —
  NOT the Bluehost account email.
- **Hostname — this site is behind Cloudflare.** `growthjourneytherapy.com` resolves to Cloudflare,
  which does **not** pass SSH. Connect to the **real server**: cPanel → *General Information* →
  **Server Information** → **Server Name** (`boxNNNN.bluehost.com`) or **Shared IP**.
- **Port:** Bluehost's own docs are internally inconsistent (one example uses `-p 22`, another
  `-p 2222`). **Try 22, then 2222:**

```bash
ssh -p 22   -i ~/.ssh/bluehost_gjt_ed25519 CPANELUSER@boxNNNN.bluehost.com
ssh -p 2222 -i ~/.ssh/bluehost_gjt_ed25519 CPANELUSER@boxNNNN.bluehost.com
```
Both time out → shell access isn't actually on (revisit §1) or the key isn't authorized (§3).

---

## 5. ~/.ssh/config + pre-login rc check

```
Host gjt
    HostName boxNNNN.bluehost.com    # or the shared IP
    User CPANELUSER
    Port 22                          # or 2222 — whichever worked
    IdentityFile ~/.ssh/bluehost_gjt_ed25519
    IdentitiesOnly yes
    PreferredAuthentications publickey
    PasswordAuthentication no
```

**Before your first interactive login**, pull the shell rc files over SFTP (SFTP runs no shell) and
eyeball them for trojans. If they're dirty, do the whole job over SFTP/rsync + phpMyAdmin (§8) instead
of an interactive shell:

```bash
mkdir -p /tmp/gjt-rc
sftp gjt <<'EOF'
get .bashrc /tmp/gjt-rc/bashrc
get .bash_profile /tmp/gjt-rc/bash_profile
get .profile /tmp/gjt-rc/profile
EOF
grep -nE 'curl|wget|base64|eval|nc |/dev/tcp' /tmp/gjt-rc/*
```

---

## 6. On the server: recon + selective DB export

### 6.1 Find WP root + read DB creds/prefix
```bash
cd ~/public_html && ls -la wp-config.php || find ~ -maxdepth 4 -name wp-config.php 2>/dev/null
grep -E "DB_NAME|DB_USER|DB_PASSWORD|DB_HOST|table_prefix" wp-config.php
```
Note all five. **The prefix may not be `wp_`** — substitute the real one everywhere below.

### 6.2 Incident-response recon (record everything as IOCs — do NOT delete on this trip)
```bash
# rogue admins:
wp user list --role=administrator --fields=ID,user_login,user_email,user_registered --format=csv
# attacker keys:
cat ~/.ssh/authorized_keys           # note any key you didn't add
# malware in uploads (must be empty):
find ~/public_html/wp-content/uploads \( -name '*.php' -o -name '*.phtml' -o -name '*.php.*' \) -ls
# must-use plugins + injected config tails:
ls -la ~/public_html/wp-content/mu-plugins/ 2>/dev/null
tail -50 wp-config.php
find ~/public_html -name '*.php' -mtime -14 -not -path '*/wp-content/uploads/*' | head -50
# Code Snippets plugin is live on this box (DB-resident-PHP vector) — audit its snippets table:
wp db query "SELECT id,name,active,LEFT(code,80) FROM $(wp config get table_prefix)snippets;" 2>/dev/null
```

### 6.3 Check WP-CLI
```bash
wp --info || wpcli --info   # Bluehost usually ships one; if neither, use the mysqldump path in 6.4
```
Every `wp` command loads the compromised codebase (same user the attacker already runs as — no new
exposure), but prefer `mysqldump` if you want the export tool itself clean.

### 6.4 Export ONLY the content tables (gzipped, small — ~10–50 MB)
```bash
PFX=$(wp config get table_prefix 2>/dev/null || echo wp_)
wp db export - \
  --tables=${PFX}posts,${PFX}postmeta,${PFX}terms,${PFX}term_taxonomy,${PFX}term_relationships,${PFX}termmeta,${PFX}users,${PFX}usermeta,${PFX}options \
  | gzip > ~/gjt-content.sql.gz
ls -lh ~/gjt-content.sql.gz
```
mysqldump equivalent (no WordPress code executed; DB password is already plaintext in wp-config, so
typing it here reveals nothing new):
```bash
mysqldump --single-transaction --quick --no-tablespaces \
  -h localhost -u 'DB_USER' -p'DB_PASSWORD' 'DB_NAME' \
  ${PFX}posts ${PFX}postmeta ${PFX}terms ${PFX}term_taxonomy ${PFX}term_relationships ${PFX}termmeta ${PFX}users ${PFX}usermeta ${PFX}options \
  | gzip > ~/gjt-content.sql.gz
```
> **Do NOT** put a `--where` on `mysqldump` — it applies to every table and `postmeta` has no post ID
> column. The 965 spam rows add only a few MB; filter by ID/category **during Markdown conversion**, not
> at dump time.

### 6.5 List her real posts — CORRECTED discriminator
```bash
wp post list --post_type=post --post_status=publish \
  --fields=ID,post_date,post_title,post_name --format=csv > ~/gjt-posts.csv

# HER posts = ID <= 231319 (18 rows: 740 + 230978..231319).  Spam = ID >= 231510.
awk -F',' 'NR==1 || $1+0 <= 231319' ~/gjt-posts.csv

# Cross-check by category (the cleanest signal): her cats are 16,17,18,19.
wp term list category --fields=term_id,name,slug,count --format=csv
for c in 16 17 18 19; do
  wp post list --post_type=post --cat=$c --fields=ID,post_date,post_title --format=csv
done
# Spam bucket sanity (do NOT export): cat 1 = 965, cats 21-32 = 64.
```

### 6.6 Revisions — pre-tamper originals (the real reason to touch the DB)
Revisions have `post_status=inherit`, so you must say so or you get nothing back:
```bash
wp post list --post_type=revision --post_status=inherit \
  --fields=ID,post_parent,post_date,post_title,post_name --format=csv > ~/gjt-revisions.csv
# Revisions of her real content (parents are her posts <=231319 or her pages):
awk -F',' 'NR==1 || $2+0 <= 231319 || ($2+0 >= 230700 && $2+0 <= 231400)' ~/gjt-revisions.csv
```
If any legit post/page was defaced in place, its clean text is likely in one of these rows. They live
in `${PFX}posts`, so the §6.4 dump already contains their full content — this listing just tells you
which IDs to read.

### 6.7 Uploads size (decide the rsync strategy)
```bash
du -sh  ~/public_html/wp-content/uploads
du -sh  ~/public_html/wp-content/uploads/*/    # per-year — expect a modest total (~182 images)
```

---

## 7. Pull the data down (~5 GB local free — measure first, dry-run first)

SQL dump + CSVs (tiny):
```bash
mkdir -p /home/nero/Clients/gjt-extraction
scp gjt:~/gjt-content.sql.gz gjt:~/gjt-posts.csv gjt:~/gjt-revisions.csv /home/nero/Clients/gjt-extraction/
```

Uploads — **images only**, default-deny everything else, **dry-run first** (note the total at the bottom):
```bash
mkdir -p /home/nero/Clients/gjt-extraction/uploads
rsync -avmn -e ssh \
  --include='*/' \
  --include='*.jpg' --include='*.JPG' --include='*.jpeg' --include='*.png' --include='*.PNG' \
  --include='*.gif' --include='*.webp' --include='*.avif' --include='*.pdf' \
  --exclude='*' \
  gjt:public_html/wp-content/uploads/ /home/nero/Clients/gjt-extraction/uploads/
# fits in free space? drop the 'n':
rsync -avm -e ssh --include='*/' \
  --include='*.jpg' --include='*.JPG' --include='*.jpeg' --include='*.png' --include='*.PNG' \
  --include='*.gif' --include='*.webp' --include='*.avif' --include='*.pdf' \
  --exclude='*' \
  gjt:public_html/wp-content/uploads/ /home/nero/Clients/gjt-extraction/uploads/
```
- The image whitelist inherently blocks `.php` webshells and `ai1wm-backups/*.wpress`. **Deliberately
  exclude SVG** (script-capable) unless a legit post references one.
- Too big? Pull one year at a time (`.../uploads/2023/`, `/2024/`, …), or add
  `--exclude='*-[0-9]*x[0-9]*.*'` to skip WordPress's resized derivatives and take originals only.
- Verify checksums after transfer (`sha256sum` both ends). Then **delete `~/gjt-content.sql.gz` from the
  server** — it contains password hashes.

---

## 8. FALLBACK — no SSH? Everything via cPanel

### 8.1 cPanel Terminal (check first — may remove the need for SSH entirely)
cPanel → **Advanced → Terminal**. If present, **every command in §6 works there verbatim**; run exports
to `~/`, download the `.sql.gz` via File Manager.

### 8.2 phpMyAdmin — selective, filtered export (CORRECTED SQL)
cPanel → **Databases → phpMyAdmin** → select the DB (name from wp-config) → confirm the real prefix.
Per-table Export has no WHERE clause; run a query in the **SQL** tab and export its **results**:

```sql
-- Her real posts + all pages + revisions of real content, skipping the 1029 spam posts.
-- CORRECTED: legit posts are ID <= 231319 (NOT "< 100000"); spam is ID >= 231510.
SELECT ID, post_author, post_date, post_date_gmt, post_content, post_title,
       post_excerpt, post_status, post_type, post_name, post_parent, post_modified, guid
FROM wp_posts
WHERE (
        (post_type = 'post'     AND post_status = 'publish' AND ID <= 231319)
     OR (post_type = 'page'     AND post_status IN ('publish','draft','private'))
     OR (post_type = 'revision' AND post_parent <= 231400)
      )
ORDER BY post_type, ID;
```
Scroll to the bottom → **Query results operations → Export → format SQL** (preferred — `post_content`
has commas/newlines that corrupt CSV) → Go.

```sql
-- Category cross-check (her posts should all sit in terms 16,17,18,19):
SELECT tr.object_id, t.term_id, t.name, t.slug, tt.taxonomy
FROM wp_term_relationships tr
JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
JOIN wp_terms t          ON t.term_id = tt.term_id
WHERE tr.object_id <= 231319;

-- Rogue-admin check without SSH (adjust prefix in the table AND meta_key):
SELECT u.ID, u.user_login, u.user_email, u.user_registered, m.meta_value AS capabilities
FROM wp_users u JOIN wp_usermeta m ON m.user_id = u.ID
WHERE m.meta_key = 'wp_capabilities';
```
(Small tables — `wp_terms`, `wp_term_taxonomy`, `wp_users` — are fine via the normal per-table Export
tab. Only `wp_posts`/`wp_postmeta` need the WHERE treatment; that's where the spam bloat lives.)

### 8.3 File Manager — download uploads
File Manager → `public_html/wp-content/` → right-click `uploads` → **Compress → Zip** → **Download**.
Large? Compress one year at a time. Delete the server-side zip after (counts against quota). Extract
locally selectively:
```bash
unzip -l uploads.zip | less
unzip uploads.zip '*.jpg' '*.jpeg' '*.png' '*.gif' '*.webp' '*.pdf' -d ./uploads-clean/
```

### 8.4 The 9.7 GB backups (only if the client wants the 49 lost Gen2 bodies)
**Process them ON the server — never download them here.** Stream one member to gzip so raw SQL never
lands uncompressed (full tested runbook in `cpanel-extract.md`):
```bash
# find the right dump, then extract only it:
tar -tzf backup-*.tar.gz --wildcards '*/mysql/*'
tar -xzOf backup-*.tar.gz --wildcards '*/mysql/GJUSER_DBNAME.sql' | gzip > ~/backupA-db.sql.gz
```
Date the backup first (a **pre-2025** backup is the only source with post ids in the ~3253–3573 range =
the lost Gen2 bodies): filename `backup-M.D.YYYY_...`, newest uploads mtime, and `MAX(ID)` in the dump.

---

## 9. Security — this server is enemy territory

1. **Key auth only. Never type a password into that host** — not Bluehost, not cPanel. The
   `PasswordAuthentication no` line enforces it. The DB password from wp-config is the one exception
   (already plaintext on the box).
2. **Assume the shell environment may be trojaned** (you checked rc files in §5). If dirty, do the job
   via SFTP/rsync + phpMyAdmin (§8), not an interactive shell.
3. **Assume everything you type is observable** by another process running as your user. Don't paste
   secrets, don't SSH onward from that box, no agent forwarding (`ForwardAgent no` is default — keep it).
4. **Never execute anything from the server.** Downloads are data: don't `chmod +x`, `source`, run
   downloaded PHP, open downloaded HTML/SVG in a browser, or `unzip` blindly. The SQL dump is parsed as
   text / imported into a throwaway isolated DB (FILE privilege off) — **never** fed to a shell, and
   **never** rendered via `dangerouslySetInnerHTML` (stored-XSS lives in `post_content`).
5. **Dedicated key; revoke when done.** After extraction: Manage SSH Keys → delete/deauthorize the key,
   and toggle Shell Access **OFF**. Note (don't rely on deleting) any attacker key in `authorized_keys`.
6. **One focused session:** recon → dump → download → checksum → log out. Delete server-side dumps
   after a verified download (they contain password hashes).
7. **Don't clean anything on this trip.** No deleting spam, no removing malware — that tramples
   timestamps and belongs to the containment step (OUT-MIGRATION-PLAN.md §0), which must **close the
   entry vector first** or the spam repopulates within hours.
8. **Everything on this host is burned** — DB password, WP salts, wp-config secrets. Rotate them as part
   of containment; extraction doesn't change that.

---

## Appendix: sources (Bluehost docs current July 2026)
- SSH enable + plans + web console: https://www.bluehost.com/help/article/ssh-access
- Account Manager SSH keys: https://www.bluehost.com/help/article/am-ssh-access
- Keygen (RSA/DSA in their UI): https://www.bluehost.com/blog/ssh-public-private-keys/
- Ports: https://www.bluehost.com/help/article/bh-commonly-used-port-numbers
- `wp db export` stdout + `--tables`: https://developer.wordpress.org/cli/commands/db/export/
- Full backup streaming runbook: `scratchpad/cpanel-extract.md` · `.wpress`: `scratchpad/wpress_extract.py`
