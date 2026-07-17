import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { MethodDoc } from "@/lib/method-content";

export function MethodTemplate({ doc, bodyHtml }: { doc: MethodDoc; bodyHtml?: string }) {
  return (
    <>
      {/* ── Hero: image behind, diagonal green panel with title/subheads/CTA on the right ── */}
      <section className="relative isolate min-h-[360px] overflow-hidden bg-green md:min-h-[440px]">
        {doc.heroImage && (
          <Image
            src={doc.heroImage}
            alt={doc.heroImageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-left md:object-[left_center]"
          />
        )}
        <div className="absolute inset-y-0 right-0 flex w-full flex-col items-center justify-center bg-green/95 px-8 py-12 text-center md:w-[58%] md:bg-green md:[clip-path:polygon(16%_0,100%_0,100%_100%,0_100%)] md:pl-[16%]">
          <h1 className="text-3xl leading-tight text-white md:text-4xl lg:text-[2.75rem]">{doc.heroTitle ?? doc.title}</h1>
          {doc.subheads.length > 0 && (
            <div className="mt-4 space-y-1 text-on-green-soft">
              {doc.subheads.map((s) => (
                <p key={s} className="text-lg">{s}</p>
              ))}
            </div>
          )}
          {doc.heroButton?.text && (
            <Button href={doc.heroButton.href} variant="solid" size="lg" className="mt-7 bg-sage-soft hover:bg-sage-soft/90">
              {doc.heroButton.text}
            </Button>
          )}
        </div>
      </section>

      {/* ── Intro ── */}
      {doc.intro?.heading && (
        <section className="bg-paper py-16 md:py-20">
          <div className="container-page max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl">{doc.intro.heading}</h2>
            <div className="mx-auto mt-5 h-px w-16 bg-gold" />
            {doc.intro.body && (
              <div
                className="prose prose-lg mx-auto mt-8 max-w-prose text-ink-soft prose-p:text-ink-soft"
                dangerouslySetInnerHTML={{ __html: doc.intro.body }}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Feature grid: green-header / gray-body cards ── */}
      {doc.features.length > 0 && (
        <section className="bg-paper pb-16 md:pb-20">
          <div className="container-page">
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {doc.features.map((f, i) => (
                <div key={i} className="flex flex-col overflow-hidden rounded-lg shadow-md">
                  <div className="bg-green px-5 py-6 text-center">
                    <h3 className="text-xl text-white">{f.title}</h3>
                  </div>
                  <div className="flex-1 bg-panel px-6 py-7 text-center">
                    <p className="leading-relaxed text-ink-soft">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Prose fallback for pages whose layout isn't a feature grid ── */}
      {doc.features.length === 0 && bodyHtml && (
        <section className="bg-paper pb-16 md:pb-20">
          <div
            className="prose prose-lg container-page max-w-prose prose-headings:font-display prose-headings:text-green prose-a:text-green prose-strong:text-ink prose-li:marker:text-gold"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </section>
      )}

      {/* ── Closing CTA ── */}
      {doc.cta?.heading && (
        <section className="bg-panel py-20">
          <div className="container-page max-w-4xl text-center">
            <h2 className="text-2xl leading-snug md:text-3xl">{doc.cta.heading}</h2>
            {doc.cta.body && (
              <div
                className="prose prose-lg mx-auto mt-6 max-w-prose text-ink-soft prose-p:text-ink-soft"
                dangerouslySetInnerHTML={{ __html: doc.cta.body }}
              />
            )}
            {doc.cta.button?.text && (
              <Button href={doc.cta.button.href} variant="solid" size="lg" className="mt-8">
                {doc.cta.button.text}
              </Button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
