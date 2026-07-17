# cPanel full-backup selective extraction runbook (4.6 GB free disk, 9.7 GB archive)

Every command below was TESTED on 2026-07-09 against a synthetic fixture with GNU tar 1.35
and UnZip 6.00 (the versions on this machine). Nothing here extracts the full archive.

## 0. Ground rules
- NEVER `tar -xzf backup.tar.gz` or `unzip outer.zip` without member patterns. Instant disk-full.
- Only three things are worth pulling: `mysql/*.sql`, `homedir/public_html/wp-config.php`,
  and `homedir/public_html/wp-content/uploads/`. Do NOT extract plugins/themes/core — that is
  where the malware lives, and we are rebuilding on Next.js anyway.
- Work in a dedicated output dir, e.g. `OUT=/tmp/claude-.../scratchpad/restore` (or wherever
  the lead agent designates). All commands use `-C "$OUT"`.

## 1. Archive layout (cPanel "full backup", per official docs)
`backup-M.D.YYYY_HH-MM-SS_<user>.tar.gz` unpacks to a single root dir of the same name:

```
backup-7.9.2026_03-15-42_<user>/
├── mysql/                      <- per-database dumps: <user>_<dbname>.sql (+ roundcube.sql etc.)
├── mysql.sql                   <- MySQL GRANTs only (users/privileges), NOT data
├── mysql-timestamps/           <- db creation timestamps (.txt)
├── homedir/                    <- full copy of the account /home dir
│   └── public_html/
│       ├── wp-config.php       <- DB_NAME + $table_prefix live here
│       └── wp-content/uploads/ <- media library
├── cp/  va/  vad/  logs/  cron/  dnszones/  ssl/  userdata/  ...  (ignore all of these)
```
Source: cPanel docs "Backup Tarball Contents"
(https://docs.cpanel.net/knowledge-base/backup/backup-tarball-contents/):
- "The /mysql directory contains the account's MySQL dumps ... stores these files in
  USER_database.sql format."
- "The mysql.sql file contains the account's MySQL database grants." (root of archive)
- "The /homedir directory contains a copy of the account's /home directory."
Older/transfer-package variants may store the home dir as a nested `homedir.tar` instead of a
directory tree — handled in §6.

## 2. Verified GNU tar pattern-matching semantics (tar 1.35)
- `--wildcards` IS POSITIONAL: it must come BEFORE the member pattern on the command line.
  `tar -xzf b.tgz '*/mysql/*' --wildcards` -> "Not found in archive". Tested.
- Default member matching is ANCHORED: `--wildcards 'mysql/*'` fails because the member names
  start with `backup-.../`. Fix with a leading `*/` in the pattern OR `--no-anchored`. Tested both.
- `*` DOES span slashes for member names by default (wildcards-match-slash is on for member
  selection), so `'*/wp-content/uploads/*'` matches
  `backup-.../homedir/public_html/wp-content/uploads/2023/05/photo.jpg`. Tested.
- `--occurrence=1` works with `--wildcards` and stops reading the stream after the first match —
  big time-saver for wp-config.php. (Only valid when reading, and pattern must match one member.)
- `--strip-components=N` composes fine with `--wildcards` if you want flat output.

## 3. Case A: plain backup-<date>_<user>.tar.gz

```bash
B=/path/to/backup-M.D.YYYY_HH-MM-SS_user.tar.gz
OUT=/path/to/restore ; mkdir -p "$OUT"

# 3.1 List contents WITHOUT extracting (streams; writes nothing; ~2-4 min for 9.7GB)
tar -tzf "$B" | head -50
tar -tzf "$B" > "$OUT/manifest.txt"        # keep the full manifest; it's small text

# 3.2 Extract ONLY the mysql dir (all DB dumps + we can pick the right one after)
tar -xzf "$B" -C "$OUT" --wildcards '*/mysql/*'

# 3.3 Extract ONLY wp-config.php (stops early thanks to --occurrence)
tar -xzf "$B" -C "$OUT" --wildcards --occurrence=1 '*/public_html/wp-config.php'

# 3.4 Extract ONLY uploads (skip any cache dirs)
tar -xzf "$B" -C "$OUT" --wildcards '*/wp-content/uploads/*' --exclude='*/uploads/cache/*'
```
Each pass re-reads the whole 9.7 GB stream (~few minutes each on local disk). If you want a
single pass, give multiple patterns in one command:
```bash
tar -xzf "$B" -C "$OUT" --wildcards \
    '*/mysql/*' '*/public_html/wp-config.php' '*/wp-content/uploads/*' \
    --exclude='*/uploads/cache/*'
```
(Drop `--occurrence` in the multi-pattern form — it would stop after the first pattern's match count.)

## 4. Case B: the tar.gz is nested inside a .zip — stream it, never materialize it

`unzip -p` writes the member's decompressed bytes to stdout only (documented: "-p: extract files
to pipe (stdout)"); it creates no temp files. `tar -xz` on stdin reads the gzip stream strictly
sequentially — no seeking needed. Both verified.

```bash
Z=/path/to/outer.zip
INNER=$(unzip -l "$Z" | awk '/\.tar\.gz/{print $4; exit}')   # find inner member name
mkdir -p "$OUT"

# list through the pipe (writes nothing)
unzip -p "$Z" "$INNER" | tar -tz | head -50

# extract mysql dir through the pipe
unzip -p "$Z" "$INNER" | tar -xz -C "$OUT" --wildcards '*/mysql/*'

# wp-config.php (tar exits early on --occurrence; unzip dies of SIGPIPE — harmless)
unzip -p "$Z" "$INNER" | tar -xz -C "$OUT" --wildcards --occurrence=1 '*/public_html/wp-config.php'

# uploads
unzip -p "$Z" "$INNER" | tar -xz -C "$OUT" --wildcards '*/wp-content/uploads/*' --exclude='*/uploads/cache/*'
```
Zip64 fallback: a 9.7 GB zip is necessarily Zip64. UnZip 6.00 reads Zip64, but if this
particular build chokes ("need PK compat. v4.5" or bad CRC on huge members), use Python's
zipfile (full Zip64 support), also tested:
```bash
python3 -c "
import zipfile,sys,shutil
z=zipfile.ZipFile('$Z')
name=[n for n in z.namelist() if n.endswith('.tar.gz')][0]
shutil.copyfileobj(z.open(name), sys.stdout.buffer, 1024*1024)
" | tar -xz -C "$OUT" --wildcards '*/mysql/*'
```
(`funzip outer.zip | tar -xz ...` also works but only reads the FIRST zip member and lacks
Zip64 support — use only if the tar.gz is the sole/first member and small enough.)

## 5. Check disk cost BEFORE extracting (verified awk one-liner)
`tar -tvz` prints uncompressed sizes in column 3; sum them:
```bash
# size of the mysql dumps
tar -tvzf "$B" --wildcards '*/mysql/*' \
  | awk '{s+=$3} END {printf "%.1f MiB\n", s/1048576}'

# size of uploads (works identically through the zip pipe)
unzip -p "$Z" "$INNER" | tar -tvz --wildcards '*/wp-content/uploads/*' \
  | awk '{s+=$3} END {printf "%.1f MiB\n", s/1048576}'
```
Rule: proceed only if (sum + 500 MB headroom) < free space from `df -h /`.

## 6. If the manifest shows `homedir.tar` instead of a `homedir/` tree
Two-stage stream, verified — `-O` sends the matched member to stdout:
```bash
tar -xzOf "$B" --wildcards '*/homedir.tar' \
  | tar -x -C "$OUT" --wildcards 'public_html/wp-content/uploads/*'
```
(Inner tar's members start at `public_html/`, so no leading `*/` needed there — confirm with
`tar -xzOf "$B" --wildcards '*/homedir.tar' | tar -t | head`.)

## 7. Dating the backup (a pre-hack backup is gold)
```bash
# 1) Filename: backup-M.D.YYYY_HH-MM-SS_user.tar.gz  ->  backup-7.9.2026_... = July 9 2026
ls -la /path/to/backup-*.tar.gz

# 2) Member mtimes — head kills the stream after a few entries (SIGPIPE, exit 0, verified):
tar -tvzf "$B" | head -5            # col 4-5 = mtime of each member
unzip -l "$Z"                        # zip directory also shows the inner file's date

# 3) The REAL tell for "does this predate the hack": newest file under uploads and the SQL itself
tar -tvzf "$B" --wildcards '*/wp-content/uploads/*' | sort -k4,5 | tail -5
# after extracting the dump: highest post ID + newest post_date in wp_posts
grep -o "([0-9]\{1,6\}, *[0-9]*, *'20[0-9][0-9]-" "$OUT"/*/mysql/*wp*.sql | tail
```
Legit post IDs are ~1222-2004; spam IDs are >=234527. If the dump's MAX(ID) in wp_posts is
in the low thousands, the backup predates the injection. If it contains IDs >200000, the dump
is post-hack — you must filter rows by ID/category during import instead.

## 8. Picking the right .sql
```bash
grep -E "DB_NAME|table_prefix" "$OUT"/*/homedir/public_html/wp-config.php
# -> defines DB_NAME ('user_wpXXX')  => use $OUT/*/mysql/user_wpXXX.sql
# -> $table_prefix = 'wp_' (or randomized) => table names in the dump
```
`mysql.sql` at the archive root is grants only — ignore it for content recovery.

## 9. cPanel backup vs .wpress (All-in-One WP Migration) — trust ranking
The cPanel backup is the better recovery source, for four reasons:
1. Standard formats (tar.gz + plain .sql). Streams through stock tools; selective extraction
   under a 4.6 GB budget is trivial (this runbook). .wpress is a proprietary sequential block
   format needing a custom extractor, and its SQL has the table prefix and site URL replaced
   by SERVMASK placeholder tokens that must be substituted back before the dump is usable.
2. Provenance: cPanel backups are produced by the server's root-level pkgacct process,
   OUTSIDE WordPress. A .wpress is produced by PHP code running INSIDE the compromised
   WordPress instance — attacker code executes in the same process that writes the export,
   so the export itself is easier to tamper with.
3. Completeness: cPanel gives the raw mysqldump of every database plus grants and the exact
   wp-config.php; nothing is rewritten. Easier to diff, grep, and date.
4. Both are "compromised" in the sense that any backup taken AFTER the injection contains the
   1,047-post spam corpus. Neither format fixes that — the date (§7) and the post-ID cutoff
   (~2004 legit vs >=234527 spam) are what decide usability, and both are much easier to
   check in a raw cPanel .sql dump.
Use the .wpress only as a fallback if the cPanel dump turns out truncated or corrupt.

## Verified-fixture note
All tar/unzip/python invocations above were exercised against a synthetic fixture replicating
the documented layout (mysql/, homedir/public_html/wp-content/uploads/, nested homedir.tar,
zip-wrapped variant) at
/tmp/claude-1000/.../scratchpad/fixtures/ on 2026-07-09; fixture deleted after testing.
