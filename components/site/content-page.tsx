import Image from "next/image";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import type { PageDoc } from "@/lib/pages";

export function ContentPageView({ doc, html }: { doc: PageDoc; html: string }) {
  return (
    <article className="bg-paper pb-20">
      <PageHero title={doc.title} subtitle={doc.excerpt} />

      {doc.heroImage && (
        <div className="container-page -mt-8 max-w-4xl">
          <div className="relative aspect-[16/7] overflow-hidden rounded-2xl shadow-md">
            <Image
              src={doc.heroImage}
              alt={doc.heroImageAlt ?? doc.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div
        className="prose prose-lg container-page mt-12 max-w-prose prose-headings:font-display prose-headings:text-green prose-a:text-green hover:prose-a:text-green-deep prose-strong:text-ink prose-li:marker:text-gold"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {doc.cta?.text && doc.cta.href && (
        <div className="container-page mt-12 max-w-3xl">
          <Button href={doc.cta.href} variant="solid" size="lg">
            {doc.cta.text}
          </Button>
        </div>
      )}
    </article>
  );
}
