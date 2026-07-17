import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GROUP_PAGE_SLUGS } from "@/lib/pages";
import { getMethod } from "@/lib/method-content";
import { BlockRenderer } from "@/components/site/block-renderer";

export const dynamicParams = false;

// The four group-detail pages keep their original WordPress URLs: /groups/<slug>.
export function generateStaticParams() {
  return GROUP_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/groups/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = getMethod(slug, "bespoke");
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.seoDescription || doc.excerpt,
    alternates: { canonical: `/groups/${slug}` },
  };
}

export default async function GroupPage(props: PageProps<"/groups/[slug]">) {
  const { slug } = await props.params;
  if (!GROUP_PAGE_SLUGS.includes(slug as (typeof GROUP_PAGE_SLUGS)[number])) notFound();
  const doc = getMethod(slug, "bespoke");
  if (!doc?.blocks?.length) notFound();
  // Spanish pages are marked lang="es" so screen readers switch voices (root html is lang="en").
  return (
    <div lang={doc.lang === "es" ? "es" : undefined}>
      <BlockRenderer blocks={doc.blocks} heroImage={doc.heroImage} />
    </div>
  );
}
