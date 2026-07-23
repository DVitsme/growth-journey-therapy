import type { Metadata } from "next";
import { getPage } from "@/lib/pages";
import { getMethod } from "@/lib/method-content";
import { renderMarkdown } from "@/lib/markdown";
import { PageHero } from "@/components/site/page-hero";
import { PageCard } from "@/components/site/page-card";

export const dynamicParams = false;

// The original overview grid: 12 curated tiles in this order. Note two originals quirks kept
// 1:1 — "Contextual Family Therapy" links to the IFS page (same destination on the old site),
// and CBT / Person Centered aren't on the grid (they're reachable from the nav dropdown).
const TILES: { label: string; slug: string }[] = [
  { label: "Acceptance and Commitment Therapy", slug: "acceptance-and-commitment-therapy" },
  { label: "Internal Family Systems Therapy", slug: "internal-family-systems-therapy" },
  { label: "Mindfulness Based Therapy", slug: "mindfulness-based-therapy" },
  { label: "Dialectical Behavior Therapy", slug: "dialectal-behavior-therapy" },
  { label: "Gottman Method Therapy", slug: "gottman-method-therapy" },
  { label: "Group Therapy", slug: "group-therapy" },
  { label: "Culturally Informed Therapy", slug: "culturally-informed-therapy" },
  { label: "Holistic Therapy", slug: "holistic-therapy" },
  { label: "Narrative Therapy", slug: "narrative-therapy" },
  { label: "EMDR Therapy", slug: "eye-movement-desensitization-reprogramming-therapy" },
  { label: "Contextual Family Therapy", slug: "internal-family-systems-therapy" },
  { label: "Trauma Informed Therapy", slug: "trauma-informed-therapy" },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = getPage("methods");
  return {
    title: page?.title ?? "Our Methods",
    description: page?.seo?.description ?? page?.excerpt,
    alternates: { canonical: "/methods" },
  };
}

export default async function MethodsOverview() {
  const page = getPage("methods");
  const html = page ? await renderMarkdown(page.content) : "";

  return (
    <div className="bg-paper pb-20">
      <PageHero
        title={page?.title ?? "Our Mental Health Treatment Methods"}
        subtitle="We Have the Methods You Need to Heal."
        image={page?.heroImage}
        imageAlt={page?.heroImageAlt}
        button={{ text: "Start Your Journey", href: "/consultation" }}
      />
      {html && (
        <div
          className="prose prose-lg container-page mt-12 max-w-prose prose-headings:font-display prose-headings:text-green prose-a:text-green"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      <section className="container-page mt-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) => {
            const doc = getMethod(t.slug, "method");
            if (!doc) return null;
            return <PageCard key={t.label} page={{ ...doc, title: t.label }} href={`/methods/${t.slug}`} />;
          })}
        </div>
      </section>
    </div>
  );
}
