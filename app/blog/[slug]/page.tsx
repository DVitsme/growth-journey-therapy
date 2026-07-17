import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPost, getPostSlugs, getTranslation, renderMarkdown, categoryLabel, formatDate } from "@/lib/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return {};
  const description = post.seo?.description ?? post.excerpt;
  const translation = getTranslation(post);
  return {
    title: post.title,
    description,
    alternates: {
      canonical: `/blog/${post.slug}`,
      languages: translation
        ? { [post.lang]: `/blog/${post.slug}`, [translation.lang]: `/blog/${translation.slug}` }
        : undefined,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.date,
      locale: post.lang === "es" ? "es_ES" : "en_US",
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function BlogPost(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.content);
  const translation = getTranslation(post);

  return (
    <article className="bg-paper pb-20" lang={post.lang === "es" ? "es" : undefined}>
      <header className="border-b border-line bg-cream">
        <div className="container-page max-w-3xl py-14">
          <Link href="/blog" className="btn-label inline-flex items-center gap-1.5 text-green hover:text-green-deep">
            <ArrowLeft className="size-4" aria-hidden />
            All posts
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            {post.categories[0] && <span className="btn-label text-green">{categoryLabel(post.categories[0])}</span>}
            <time dateTime={post.date}>{formatDate(post.date, post.lang)}</time>
            {post.lang === "es" && <span className="rounded-full bg-panel px-2 py-0.5 text-sm">Español</span>}
          </div>
          <h1 className="mt-3 text-3xl leading-tight md:text-4xl">{post.title}</h1>
          {translation && (
            <p className="mt-4 text-sm text-ink-soft">
              {post.lang === "en" ? "También disponible en " : "Also available in "}
              <Link href={`/blog/${translation.slug}`} className="text-green underline underline-offset-4 hover:text-green-deep">
                {post.lang === "en" ? "español" : "English"}
              </Link>
            </p>
          )}
        </div>
      </header>

      {post.coverImage && (
        <div className="container-page max-w-4xl">
          <div className="relative -mt-0 aspect-[16/7] overflow-hidden rounded-b-2xl">
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt ?? post.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div
        className="prose prose-lg container-page mt-12 max-w-prose prose-headings:font-display prose-headings:text-green prose-a:text-green hover:prose-a:text-green-deep prose-strong:text-ink"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="container-page mt-14 max-w-3xl border-t border-line pt-8">
        <Link href="/blog" className="btn-label inline-flex items-center gap-1.5 text-green hover:text-green-deep">
          <ArrowLeft className="size-4" aria-hidden />
          Back to all posts
        </Link>
      </div>
    </article>
  );
}
