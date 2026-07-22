import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getTopLevelSlugs } from "@/lib/pages";
import { getMethod } from "@/lib/method-content";
import { BlockRenderer } from "@/components/site/block-renderer";

export const dynamicParams = false;

export function generateStaticParams() {
  // /team has its own data-driven route (app/team/page.tsx) built from content/team/;
  // exclude it here so both don't resolve to the same path.
  return getTopLevelSlugs()
    .filter((s) => s !== "team")
    .map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = getMethod(slug, "bespoke");
  const page = getPage(slug);
  const title = doc?.title ?? page?.title;
  if (!title) return {};
  return {
    title,
    description: doc?.seoDescription || page?.seo?.description || page?.excerpt,
    alternates: { canonical: `/${slug}` },
  };
}

export default async function TopLevelPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;

  // Faithful block-by-block layout (recovered from the rendered Divi page).
  // Top-level bespoke pages carry no breadcrumb (matches the original).
  const doc = getMethod(slug, "bespoke");
  if (doc?.blocks && doc.blocks.length > 0) {
    return <BlockRenderer blocks={doc.blocks} heroImage={doc.heroImage} />;
  }

  // Every bespoke page is now authored as blocks (and careers has its own route), so there is
  // no prose fallback here — an unknown bespoke slug is a 404.
  notFound();
}
