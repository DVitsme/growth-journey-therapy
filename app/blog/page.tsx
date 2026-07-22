import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "@/components/site/page-hero";
import { getAllPosts, categoryLabel, formatDate } from "@/lib/blog";
import { getPerson, authorHref } from "@/lib/team";
import { AuthorBylineCompact } from "@/components/site/author-byline";

export const dynamicParams = false;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Reflections on mental health, culture, identity, and healing from Growth Journey Therapy — bilingual therapy in Philadelphia and across Pennsylvania.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <>
      <PageHero
        title="Blog"
        subtitle="Reflections on mental health, culture, identity, and the journey toward healing."
      />

      <section className="bg-paper py-16">
        <div className="container-page">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const author = getPerson(post.author);
              return (
              <article
                key={post.slug}
                className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative aspect-[3/2] overflow-hidden bg-panel">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt ?? post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="om-hatch flex h-full items-center justify-center text-green/40">
                        <span className="font-display text-lg">Growth Journey</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    {post.categories[0] && (
                      <span className="btn-label text-green">{categoryLabel(post.categories[0])}</span>
                    )}
                    {post.lang === "es" && (
                      <span className="rounded-full bg-panel px-2 py-0.5 text-sm text-ink-soft">Español</span>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl leading-snug" lang={post.lang === "es" ? "es" : undefined}>
                    <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-green-deep">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 text-base leading-relaxed text-ink-soft" lang={post.lang === "es" ? "es" : undefined}>{post.excerpt}</p>
                  {author && (
                    <div className="mt-4">
                      <AuthorBylineCompact author={author} href={authorHref(author)} />
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <time dateTime={post.date} className="text-ink-soft">
                      {formatDate(post.date, post.lang)}
                    </time>
                    <Link href={`/blog/${post.slug}`} className="btn-label text-green hover:text-green-deep">
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
