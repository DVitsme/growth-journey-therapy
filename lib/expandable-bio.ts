export type ExpandableBioParts = { visibleInner: string; hiddenInner: string };

/**
 * The original Divi team page split each bio into an always-visible preview and a
 * hidden remainder, marked up with `.more-text-dots` / `.more-text-content` spans and
 * toggled by a "Read More" button (jQuery `slideToggle`). We preserve those
 * author-defined split points rather than truncating at an arbitrary word count.
 *
 * Returns `null` when a bio has no hidden remainder (e.g. the short intake-coordinator
 * bio) — such a bio renders as plain prose with no button.
 */
export function splitExpandableBio(html: string): ExpandableBioParts | null {
  if (!html.includes("more-text-content")) return null;
  const noComments = html.replace(/<!--[\s\S]*?-->/g, "");

  const hidden = noComments.match(
    /<span[^>]*class="[^"]*more-text-content[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
  );
  if (!hidden) return null;

  let visible = noComments;
  const dotsIdx = visible.search(/<span[^>]*class="[^"]*more-text-dots[^"]*"/i);
  if (dotsIdx >= 0) visible = visible.slice(0, dotsIdx);
  visible = visible.replace(/^\s*<p[^>]*>/i, "");

  // strip leading/trailing whitespace and stray <br> tags left by the split
  const trim = (s: string) =>
    s.replace(/^(?:\s|<br\s*\/?>)+/i, "").replace(/(?:\s|<br\s*\/?>)+$/i, "").trim();

  const visibleInner = trim(visible);
  const hiddenInner = trim(hidden[1]);
  if (!visibleInner || !hiddenInner) return null;
  return { visibleInner, hiddenInner };
}
