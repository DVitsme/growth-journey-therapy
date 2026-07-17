import type { Metadata } from "next";
import { getPage } from "@/lib/pages";
import { getMethod } from "@/lib/method-content";
import { renderMarkdown } from "@/lib/markdown";
import { PageHero } from "@/components/site/page-hero";
import { PageCard } from "@/components/site/page-card";

export const dynamicParams = false;

// The original overview grid: 9 curated tiles with the original labels. Two live outside
// /specialties/ — Grief and Loss (bespoke, /grief-and-loss) and Group Therapy (a method).
const TILES: { label: string; slug: string; type: "specialty" | "method" | "bespoke"; href: string }[] = [
  { label: "Grief and Loss", slug: "grief-and-loss", type: "bespoke", href: "/grief-and-loss" },
  { label: "Generational Trauma", slug: "generational-trauma", type: "specialty", href: "/specialties/generational-trauma" },
  { label: "Couples Counseling", slug: "couples-counseling", type: "specialty", href: "/specialties/couples-counseling" },
  { label: "Individual Therapy", slug: "individual-therapy", type: "specialty", href: "/specialties/individual-therapy" },
  { label: "Group Therapy", slug: "group-therapy", type: "method", href: "/methods/group-therapy" },
  { label: "Cultural Integration Therapy", slug: "cultural-integration-therapy", type: "specialty", href: "/specialties/cultural-integration-therapy" },
  { label: "Self-Identity Therapy", slug: "self-identity-therapy", type: "specialty", href: "/specialties/self-identity-therapy" },
  { label: "Burnout & Stress", slug: "burn-out-work-life-balance", type: "specialty", href: "/specialties/burn-out-work-life-balance" },
  { label: "Immigration Anxiety", slug: "immigration-anxiety", type: "specialty", href: "/specialties/immigration-anxiety" },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = getPage("specialties");
  return {
    title: page?.title ?? "Our Specialties",
    description: page?.seo?.description ?? page?.excerpt,
    alternates: { canonical: "/specialties" },
  };
}

export default async function SpecialtiesOverview() {
  const page = getPage("specialties");
  const html = page ? await renderMarkdown(page.content) : "";

  return (
    <div className="bg-paper pb-20">
      <PageHero
        title={page?.title ?? "Our Specialties"}
        subtitle="We strive to create a place where all people can heal their mind, emotions, and soul"
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
            const doc = getMethod(t.slug, t.type);
            if (!doc) return null;
            return <PageCard key={t.label} page={{ ...doc, title: t.label }} href={t.href} />;
          })}
        </div>
      </section>
    </div>
  );
}
