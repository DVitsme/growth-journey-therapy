import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { MethodDoc } from "@/lib/method-content";

export function MethodTemplate({ doc, bodyHtml }: { doc: MethodDoc; bodyHtml?: string }) {
  return (
    <>
      {/* ── Hero: floating card (homepage pattern — m-6 md:m-12, rounded-2xl). The ENTIRE
             photo is shown (object-contain, never cropped) over a blurred ambient fill of
             itself; the solid green panel is IN FLOW so long content grows the card instead
             of clipping (the old absolute panel cut off the CTA). The diagonal survives as
             clip-path notches that reveal only the ambient backdrop — never the photo:
             a fixed-run slope on the panel's leading edge (desktop) and a slanted top edge
             (mobile). `isolate` keeps Safari clipping the rounded corners correctly. ── */}
      <section className="relative isolate m-6 overflow-hidden rounded-2xl bg-green md:m-12">
        {doc.heroImage && (
          <>
            {/* Ambient fill: tiny blurred copy of the same photo (decorative only). */}
            <Image
              src={doc.heroImage}
              alt=""
              aria-hidden
              fill
              loading="eager"
              sizes="256px"
              className="scale-110 object-cover blur-2xl brightness-95"
            />
            {/* Brand tint so every page's ambient wash sits in the palette. */}
            <div aria-hidden className="absolute inset-0 bg-green/15" />
          </>
        )}

        <div className="relative md:flex md:items-stretch">
          {/* Photo pane — the whole image, contained + centered; stretches to row height. */}
          {doc.heroImage && (
            <div className="relative aspect-[3/2] md:aspect-auto md:flex-1">
              <Image
                src={doc.heroImage}
                alt={doc.heroImageAlt}
                fill
                preload
                sizes="(min-width: 768px) 45vw, calc(100vw - 3rem)"
                className="object-contain p-3 [filter:drop-shadow(0_10px_24px_rgba(0,0,0,0.28))] md:p-5"
              />
            </div>
          )}

          {/* Green panel — in flow (defines the card height; CTA always keeps its bottom
              padding). Clip-path notches reveal the ambient backdrop beside/above it. */}
          <div className="on-green-surface relative flex flex-col items-center justify-center bg-green px-6 pt-14 pb-10 text-center [clip-path:polygon(0_1.25rem,100%_0,100%_100%,0_100%)] md:min-h-[23rem] md:w-[58%] md:py-14 md:pr-8 md:pl-[calc(var(--hero-run)+2rem)] md:[--hero-run:2rem] md:[clip-path:polygon(var(--hero-run)_0,100%_0,100%_100%,0_100%)] lg:pr-12 lg:pl-[calc(var(--hero-run)+3rem)] lg:[--hero-run:2.5rem]">
            <h1 className="text-3xl leading-tight text-white md:text-4xl lg:text-[2.75rem]">{doc.heroTitle ?? doc.title}</h1>
            {doc.subheads.length > 0 && (
              <div className="mt-5 max-w-xl space-y-1 text-on-green-soft">
                {doc.subheads.map((s) => (
                  <p key={s} className="text-lg">{s}</p>
                ))}
              </div>
            )}
            {doc.heroButton?.text && (
              <Button
                href={doc.heroButton.href}
                variant="solid"
                size="lg"
                className="mt-8 bg-on-green-soft text-green-deep hover:bg-white hover:text-green-deep"
              >
                {doc.heroButton.text}
              </Button>
            )}
          </div>
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
