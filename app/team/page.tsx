import type { Metadata } from "next";
import { getMethod } from "@/lib/method-content";
import { getTeamMembers, type Person } from "@/lib/team";
import { BlockRenderer, type Block } from "@/components/site/block-renderer";

// Story intro + CTA still live in team.json; the member cards are sourced from content/team/
// (single source of truth — the same records power /team/[slug] and the blog bylines).
const doc = getMethod("team", "bespoke");

export const metadata: Metadata = {
  title: doc?.title,
  description: doc?.seoDescription,
  alternates: { canonical: "/team" },
};

/** Build a team-card `image-text` block from a person record. Rendered by the same
 *  BlockRenderer path as the original inline team.json cards, so the output is identical —
 *  `heading` only feeds the Read-More aria-label (`name`), it is not shown when a card exists. */
function memberBlock(p: Person): Block {
  return {
    type: "image-text",
    image: p.headshot ?? "",
    imageSide: "left",
    heading: p.name,
    body: p.bioHtml,
    card: {
      name: p.name,
      title: p.title,
      ...(p.credentials ? { credentials: p.credentials } : {}),
      languages: p.languages.join(" / "),
      objectPosition: p.objectPosition,
    },
  };
}

export default function TeamPage() {
  const chrome: Block[] = doc?.blocks ?? [];
  const members = getTeamMembers()
    .filter((p) => p.headshot)
    .map(memberBlock);
  const ctaIdx = chrome.findIndex((b) => b.type === "cta");
  const blocks =
    ctaIdx >= 0 ? [...chrome.slice(0, ctaIdx), ...members, ...chrome.slice(ctaIdx)] : [...chrome, ...members];

  return <BlockRenderer blocks={blocks} heroImage={doc?.heroImage ?? ""} />;
}
