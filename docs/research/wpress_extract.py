#!/usr/bin/env python3
"""
wpress_extract.py — selective, streaming extractor for All-in-One WP Migration
(.wpress) archives. Python 3 stdlib only. Designed for the case where the
archive (9.7 GB) is far larger than free disk (4.6 GB): it walks the header
chain sequentially and writes ONLY the files you ask for, skipping everything
else without ever touching disk.

FORMAT (verified against the plugin's own source,
plugins.svn.wordpress.org/all-in-one-wp-migration/.../class-ai1wm-archiver.php):

  A .wpress file is a flat sequence of [4377-byte header][raw file bytes] pairs,
  terminated by a 4377-byte EOF block. No compression, no index, no central
  directory => forward-only streaming with a skip loop is sufficient AND
  necessary (you cannot seek to a file without walking the headers).

  Header block, v1 (plugin <= 7.9x), PHP pack('a255a14a12a4096', ...):
      offset    0..254   a255   filename (basename only), NUL-padded
      offset  255..268   a14    file size, ASCII decimal, NUL-padded
      offset  269..280   a12    unix mtime, ASCII decimal, NUL-padded
      offset  281..4376  a4096  dir path, '/'-separated, '.' for root
  Header block, v2 (current trunk), pack('a255a14a12a4088a8', ...):
      same first three fields; path shrinks to a4088 (281..4368) and the last
      8 bytes (4369..4376) hold an ASCII-hex crc32 of the file contents.
  Both are 4377 bytes. Because real paths are far shorter than 4088 chars,
  parsing path as bytes[281:4369] split at the first NUL is correct for both.

  EOF block:
      v1: 4377 NUL bytes                      pack('a4377', '')
      v2: pack('a255a14a4100a8', '', archive_size, '', archive_crc32_hex)
  In BOTH versions the 255-byte filename field of the EOF block is empty, and
  a real entry can never have an empty filename => "first field empty" is the
  terminator test.

USAGE
  # inventory only (never writes file contents):
  python3 wpress_extract.py backup.zip --list

  # extract DB dump (+gzip it on the fly) and all uploads:
  python3 wpress_extract.py backup.zip --out ./recovered --gzip-sql

  # custom selection:
  python3 wpress_extract.py site.wpress --out ./x --match 'themes/mytheme/*'

Works directly on a .zip that CONTAINS the .wpress: zipfile.ZipFile.open()
returns a streaming, forward-readable file object, so the inner archive is
decompressed on the fly and never lands on disk.
"""

import argparse
import fnmatch
import gzip
import io
import json
import os
import re
import sys
import zipfile

HEADER_SIZE = 4377
NAME_OFF, NAME_LEN = 0, 255
SIZE_OFF, SIZE_LEN = 255, 14
MTIME_OFF, MTIME_LEN = 269, 12
PATH_OFF = 281
PATH_END = 4369          # v2 path field ends here; v1 path runs to 4377 but
                         # is NUL-padded long before this in practice
CRC_OFF = 4369           # v2 only: 8 ASCII hex chars
CHUNK = 1 << 20          # 1 MiB copy/skip chunks
PROGRESS_EVERY = 512 << 20  # log every 512 MiB consumed

DEFAULT_WANT = (
    "database.sql",            # root DB dump (standard name)
    "migration-*.sql",         # some exporters/versions
    "*.sql",                   # any root-level .sql (path == '.')  [root only]
    "uploads/*",               # .wpress paths are relative to wp-content/
    "wp-content/uploads/*",    # tolerate non-standard prefixes
    "package.json",            # tiny metadata file: site url, plugin version
)

# Never extract these even when a want-pattern matches. ai1wm re-archives its
# own previous exports under uploads/ai1wm-backups/ — pulling multi-GB nested
# backups onto a 4.6 GB-free disk would be fatal. Override with --no-exclude.
DEFAULT_EXCLUDE = (
    "uploads/ai1wm-backups/*",
    "wp-content/uploads/ai1wm-backups/*",
    "*.wpress",
    "*.tar.gz",
    "*.zip",
)


def field(block, start, end):
    """NUL-trimmed bytes of a fixed-width field."""
    return block[start:end].split(b"\x00", 1)[0]


def parse_header(block, offset):
    """Return (name, size, mtime, path, crc_or_None) or None for EOF block."""
    name_b = field(block, NAME_OFF, NAME_OFF + NAME_LEN)
    if not name_b:
        return None  # EOF block (v1 all-NUL or v2 with empty filename field)
    size_b = field(block, SIZE_OFF, SIZE_OFF + SIZE_LEN)
    mtime_b = field(block, MTIME_OFF, MTIME_OFF + MTIME_LEN)
    if not size_b.isdigit() or (mtime_b and not mtime_b.isdigit()):
        raise RuntimeError(
            "Header misalignment at archive offset %d: size=%r mtime=%r. "
            "Refusing to continue — a wrong offset would silently produce "
            "garbage. The archive may be encrypted, truncated, or not a "
            ".wpress file." % (offset, size_b[:20], mtime_b[:20])
        )
    path_b = field(block, PATH_OFF, PATH_END)
    crc_b = block[CRC_OFF:CRC_OFF + 8]
    crc = crc_b.decode("ascii") if re.fullmatch(rb"[0-9a-fA-F]{8}", crc_b) else None
    name = name_b.decode("utf-8", "replace")
    path = path_b.decode("utf-8", "replace")
    return name, int(size_b), int(mtime_b or 0), path, crc


def classify_eof(block):
    """Return a human-readable description of the EOF block."""
    if block == b"\x00" * HEADER_SIZE:
        return "v1 EOF (4377 NUL bytes)"
    size_b = field(block, SIZE_OFF, SIZE_OFF + SIZE_LEN)
    crc_b = block[CRC_OFF:CRC_OFF + 8]
    if size_b.isdigit() and re.fullmatch(rb"[0-9a-fA-F]{8}", crc_b):
        return "v2 EOF (archive size %s bytes, crc32 %s)" % (
            size_b.decode(), crc_b.decode())
    return "unrecognized EOF-like block (empty filename field)"


def rel_path(path, name):
    """Join the header's dir path and filename into a clean relative path."""
    path = path.strip("/")
    if path in ("", "."):
        return name
    return path + "/" + name


def safe_dest(out_dir, rpath):
    """Refuse traversal; return absolute destination path."""
    parts = [p for p in rpath.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or (parts and ":" in parts[0]):
        raise RuntimeError("Refusing suspicious path in archive: %r" % rpath)
    return os.path.join(out_dir, *parts)


def wanted(rpath, patterns):
    for pat in patterns:
        if "/" in pat:  # path pattern: fnmatch's '*' crosses '/', so
            if fnmatch.fnmatch(rpath, pat):  # 'uploads/*' matches deep paths
                return True
        elif "/" not in rpath and fnmatch.fnmatch(rpath, pat):
            return True  # bare filename pattern => root-level entries only
    return False


def excluded(rpath, patterns):
    base = rpath.rsplit("/", 1)[-1]
    return any(fnmatch.fnmatch(rpath, p) or fnmatch.fnmatch(base, p)
               for p in patterns)


def skip_bytes(fp, n):
    """Skip n bytes. seek(cur+n) on seekable streams (instant on a real file;
    ZipExtFile implements forward seek by decompress-and-discard internally),
    chunked read-discard otherwise."""
    if fp.seekable():
        fp.seek(n, io.SEEK_CUR)
        return
    left = n
    while left > 0:
        got = fp.read(min(CHUNK, left))
        if not got:
            raise RuntimeError("Archive truncated while skipping content")
        left -= len(got)


def copy_bytes(fp, out, n):
    left = n
    while left > 0:
        got = fp.read(min(CHUNK, left))
        if not got:
            raise RuntimeError("Archive truncated mid-file (%d bytes short)" % left)
        out.write(got)
        left -= len(got)


def open_archive(path, member=None):
    """Return (stream, description). Handles .wpress-inside-.zip without
    extracting the zip: ZipFile.open() streams and decompresses on the fly."""
    if zipfile.is_zipfile(path):
        zf = zipfile.ZipFile(path)  # kept open for process lifetime
        cands = [i for i in zf.infolist()
                 if not i.is_dir() and (member is None or i.filename == member)]
        if member is None:
            wp = [i for i in cands if i.filename.lower().endswith(".wpress")]
            cands = wp or sorted(cands, key=lambda i: i.file_size, reverse=True)[:1]
        if not cands:
            raise RuntimeError("No .wpress member found in zip. Members:\n  " +
                               "\n  ".join(i.filename for i in zf.infolist()))
        info = max(cands, key=lambda i: i.file_size)
        sys.stderr.write("zip member: %s (%.2f GB compressed -> %.2f GB)\n" % (
            info.filename, info.compress_size / 1e9, info.file_size / 1e9))
        return zf.open(info), "zip:%s!%s" % (path, info.filename)
    return open(path, "rb"), path


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("archive", help=".wpress file, or .zip containing one")
    ap.add_argument("--out", default=".", help="output directory")
    ap.add_argument("--list", action="store_true",
                    help="inventory only; extract nothing")
    ap.add_argument("--gzip-sql", action="store_true",
                    help="gzip .sql files on the fly (writes .sql.gz)")
    ap.add_argument("--match", action="append", default=None, metavar="GLOB",
                    help="replace default selection with these globs "
                         "(repeatable; bare filenames match root only)")
    ap.add_argument("--member", default=None,
                    help="explicit member name if archive is a zip")
    ap.add_argument("--exclude", action="append", default=None, metavar="GLOB",
                    help="never extract these (default: nested backups — "
                         "ai1wm-backups/*, *.wpress, *.zip, *.tar.gz)")
    ap.add_argument("--no-exclude", action="store_true",
                    help="disable the default exclude list")
    args = ap.parse_args()

    patterns = args.match if args.match else list(DEFAULT_WANT)
    excludes = [] if args.no_exclude else (
        args.exclude if args.exclude else list(DEFAULT_EXCLUDE))
    fp, desc = open_archive(args.archive, args.member)

    n_seen = n_kept = 0
    bytes_kept = bytes_skipped = consumed = 0
    next_mark = PROGRESS_EVERY
    pkg_meta = None

    while True:
        block = fp.read(HEADER_SIZE)
        if len(block) == 0:
            sys.stderr.write("WARNING: stream ended with no EOF block "
                             "(truncated or older format?) — extracted files "
                             "up to this point are still valid.\n")
            break
        if len(block) < HEADER_SIZE:
            sys.stderr.write("WARNING: trailing partial block (%d bytes) — "
                             "archive truncated.\n" % len(block))
            break
        hdr = parse_header(block, consumed)
        consumed += HEADER_SIZE
        if hdr is None:
            sys.stderr.write("Reached %s\n" % classify_eof(block))
            break
        name, size, mtime, path, _crc = hdr
        rpath = rel_path(path, name)
        n_seen += 1

        # capture package.json metadata (first entry, tiny) to detect
        # encrypted exports, whose contents we cannot decode
        grab_meta = (rpath == "package.json" and size < (8 << 20)
                     and pkg_meta is None)

        if args.list:
            sys.stdout.write("%12d  %10d  %s\n" % (size, mtime, rpath))
            if grab_meta:
                pkg_meta = fp.read(size)
                consumed += size
            else:
                skip_bytes(fp, size)
                consumed += size
            continue

        if wanted(rpath, patterns) and not excluded(rpath, excludes):
            dest = safe_dest(args.out, rpath)
            os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
            if args.gzip_sql and rpath.endswith(".sql"):
                with open(dest + ".gz", "wb") as raw, \
                     gzip.GzipFile(filename=name, mode="wb",
                                   fileobj=raw, compresslevel=6) as out:
                    copy_bytes(fp, out, size)
                dest += ".gz"
            else:
                with open(dest, "wb") as out:
                    if grab_meta:
                        pkg_meta = fp.read(size)
                        out.write(pkg_meta)
                    else:
                        copy_bytes(fp, out, size)
            if mtime:
                os.utime(dest, (mtime, mtime))
            n_kept += 1
            bytes_kept += size
            sys.stderr.write("extracted %s (%d bytes)\n" % (rpath, size))
        else:
            if grab_meta:
                pkg_meta = fp.read(size)
            else:
                skip_bytes(fp, size)
            bytes_skipped += size
        consumed += size

        if consumed >= next_mark:
            sys.stderr.write("... %.1f GB consumed, %d files seen, "
                             "%d kept\n" % (consumed / 1e9, n_seen, n_kept))
            next_mark += PROGRESS_EVERY

    if pkg_meta is not None:
        try:
            meta = json.loads(pkg_meta)
            keys = ("SiteURL", "HomeURL", "WordPress", "Plugin", "Encrypted")
            info = {k: v for k, v in meta.items() if k in keys or "ncrypt" in k}
            sys.stderr.write("package.json: %s\n" % json.dumps(info))
            if any("ncrypt" in k and meta[k] for k in meta):
                sys.stderr.write("WARNING: export appears ENCRYPTED — file "
                                 "contents are AES-encrypted and this tool "
                                 "does NOT decrypt them.\n")
        except Exception:
            sys.stderr.write("NOTE: package.json is not valid JSON — possible "
                             "sign of an encrypted or damaged export.\n")

    sys.stderr.write(
        "done: %s\n  entries seen: %d\n  extracted:    %d (%.1f MB)\n"
        "  skipped:      %.2f GB\n" % (
            desc, n_seen, n_kept, bytes_kept / 1e6, bytes_skipped / 1e9))
    return 0


if __name__ == "__main__":
    sys.exit(main())
