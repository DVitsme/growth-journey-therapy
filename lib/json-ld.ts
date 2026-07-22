/**
 * Serialize a JSON-LD object for embedding in a <script type="application/ld+json"> tag.
 * JSON.stringify does NOT escape `<`, so a value containing `</script>` could break out of
 * the tag — the unicode escapes below prevent that while decoding back to the real characters
 * in any JSON-LD parser. Per the official Next.js JSON-LD guide.
 *
 * U+2028 / U+2029 are handled via String.fromCharCode so this source stays pure ASCII (a
 * literal separator inside a regex would itself be a syntax error).
 */
export function toJsonLd(data: unknown): string {
  const LINE_SEP = String.fromCharCode(0x2028);
  const PARA_SEP = String.fromCharCode(0x2029);
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LINE_SEP)
    .join("\\u2028")
    .split(PARA_SEP)
    .join("\\u2029");
}
