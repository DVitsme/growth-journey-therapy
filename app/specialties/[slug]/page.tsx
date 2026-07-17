import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMethod, getMethodSlugs } from "@/lib/method-content";
import { renderMarkdown } from "@/lib/markdown";
import { BlockRenderer } from "@/components/site/block-renderer";
import { MethodTemplate } from "@/components/site/method-template";

export const dynamicParams = false;

export function generateStaticParams() {
  return getMethodSlugs("specialty").map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/specialties/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = getMethod(slug, "specialty");
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.seoDescription || doc.excerpt,
    alternates: { canonical: `/specialties/${slug}` },
  };
}

export default async function SpecialtyPage(props: PageProps<"/specialties/[slug]">) {
  const { slug } = await props.params;
  const doc = getMethod(slug, "specialty");
  if (!doc) notFound();

  // Faithful block-by-block layout (recovered from the rendered Divi page). No breadcrumb.
  if (doc.blocks && doc.blocks.length > 0) {
    return <BlockRenderer blocks={doc.blocks} heroImage={doc.heroImage} />;
  }

  // Fallback for any page without parsed blocks.
  const bodyHtml = doc.features.length === 0 && doc.bodyMarkdown ? await renderMarkdown(doc.bodyMarkdown) : undefined;
  return <MethodTemplate doc={doc} bodyHtml={bodyHtml} />;
}
