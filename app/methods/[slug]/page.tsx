import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMethod, getMethodSlugs } from "@/lib/method-content";
import { renderMarkdown } from "@/lib/markdown";
import { MethodTemplate } from "@/components/site/method-template";

export const dynamicParams = false;

export function generateStaticParams() {
  return getMethodSlugs("method").map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/methods/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = getMethod(slug, "method");
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.seoDescription || doc.excerpt,
    alternates: { canonical: `/methods/${slug}` },
  };
}

export default async function MethodPage(props: PageProps<"/methods/[slug]">) {
  const { slug } = await props.params;
  const doc = getMethod(slug, "method");
  if (!doc) notFound();
  const bodyHtml = doc.features.length === 0 && doc.bodyMarkdown ? await renderMarkdown(doc.bodyMarkdown) : undefined;
  return <MethodTemplate doc={doc} bodyHtml={bodyHtml} />;
}
