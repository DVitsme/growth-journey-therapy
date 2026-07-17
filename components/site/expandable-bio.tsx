"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExpandableBioParts } from "@/lib/expandable-bio";

// Matches the exact prose wrapper the original bios rendered inside.
const PROSE =
  "prose prose-lg max-w-none text-ink-soft prose-p:text-ink-soft prose-a:text-green";

const DOTS = ' <span class="more-text-dots" aria-hidden="true">…</span>';

/**
 * Progressive-disclosure bio: an always-visible preview plus a remainder that slides
 * open/closed. Reproduces the original team page's "Read More" toggle (jQuery
 * `slideToggle`, 400ms) with a Motion height animation. Each bio owns its own state, so
 * expanding one leaves the others collapsed. The hidden remainder stays mounted (height
 * 0 + `inert`) so it remains in the HTML for search/Ctrl-F while being removed from the
 * accessibility tree and tab order until revealed.
 */
export function ExpandableBio({
  visibleInner,
  hiddenInner,
  name,
}: ExpandableBioParts & { name?: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const regionId = useId();
  const label = open ? "Show Less" : "Read More";

  return (
    <div>
      <div className={PROSE}>
        <p dangerouslySetInnerHTML={{ __html: visibleInner + (open ? "" : DOTS) }} />

        <motion.div
          id={regionId}
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  height: { duration: 0.4, ease: "easeInOut" },
                  opacity: { duration: 0.25, ease: "easeOut", delay: open ? 0.12 : 0 },
                }
          }
          style={{ overflow: "hidden" }}
          inert={!open}
        >
          <div
            className="pt-5 [&>:first-child]:mt-0 [&>:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: hiddenInner }}
          />
        </motion.div>
      </div>

      <Button
        type="button"
        variant="solid"
        size="md"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={regionId}
        aria-label={name ? `${label} about ${name}` : undefined}
        className="mt-4"
      >
        {label}
        <ChevronDown
          className={`size-5 transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Button>
    </div>
  );
}
