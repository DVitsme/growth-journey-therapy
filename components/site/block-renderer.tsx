import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { splitExpandableBio } from "@/lib/expandable-bio";
import { ExpandableBio } from "./expandable-bio";
import { TeamPhoto, type TeamCard } from "./team-photo";

type Btn = { text: string; href: string } | null;

type QA = { q: string; a: string };

export type Block =
  | { type: "hero"; title: string; subheads: string[]; button?: Btn; image: string }
  /** `sideHeading` = the original's 2/5|3/5 "gallery rows" (heading column beside body column).
   *  `align` overrides the default centered treatment. `eyebrow` renders a small uppercase line under the heading. */
  | { type: "text"; heading: string; body: string; headerOnly?: boolean; button?: Btn; sideHeading?: boolean; align?: "left" | "center"; eyebrow?: string }
  | { type: "image-text"; image: string; imageSide: "left" | "right"; heading: string; subheading?: string; body: string; button?: Btn; card?: TeamCard }
  /** `plain` renders hasDesc:false items as the original's flat dark text rows with hairlines (not green tiles). */
  | { type: "cards"; columns: 2 | 3; hasDesc: boolean; plain?: boolean; cards: { title: string; desc: string; image?: string; button?: Btn }[] }
  | { type: "image"; src: string; alt: string; width?: number | null; height?: number | null }
  /** Either a flat `items` list or two-plus `groups` rendered side-by-side with their own headings (the FAQ page's Insurance/CARE columns). */
  | { type: "faq"; heading: string; items?: QA[]; groups?: { title: string; items: QA[] }[] }
  | { type: "table"; heading: string; html: string }
  /** `boxed` = the original's outlined-box CTA (bordered card on the page background, not a full-bleed band).
   *  `accents` = the event template's decorative corner graphics flanking the box. */
  | { type: "cta"; heading: string; body: string; button?: Btn; boxed?: boolean; accents?: string[] }
  /** The event template's features section: oversized display heading (with decorative accents)
   *  in the LEFT column, the topic list as a 2-col hairline grid in the RIGHT column. */
  | { type: "event-features"; heading: string; items: string[]; accentAbove?: string; accentBelow?: string }
  /** The original /groups "ledger": thumbnail | heading+body | bottom-aligned button, hairline between rows. */
  | { type: "rows"; rows: { image?: string; heading: string; body: string; button?: Btn }[] }
  /** The group-event masthead: eyebrow above a dark page title, then logistics beside the event flyer. */
  | { type: "event-header"; eyebrow?: string; title: string; subtitle?: string; logistics: string; image?: string; imageAlt?: string };

const COLS: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" };

function Prose({ html, center }: { html: string; center?: boolean }) {
  return (
    <div
      className={`prose prose-lg max-w-none text-ink-soft prose-p:text-ink-soft prose-a:text-green ${center ? "prose-p:text-center" : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function BlockRenderer({ blocks, heroImage }: { blocks: Block[]; heroImage: string }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "hero": {
            const img = b.image === "__HERO_BG__" || !b.image ? heroImage : b.image;
            return (
              <section key={i} className="relative isolate m-4 overflow-hidden rounded-2xl bg-green md:m-12">
                {img && <Image src={img} alt={b.title} fill priority sizes="100vw" className="object-cover object-[left_top]" />}
                {/* Panel stays in-flow (ml-auto, min-height) so long titles grow the section instead of clipping. */}
                <div className="relative flex min-h-[340px] w-full flex-col items-center justify-center bg-green/85 px-8 py-14 text-center md:ml-auto md:min-h-[420px] md:w-[52%] md:bg-green/90 md:px-12">
                  <h1 className="text-2xl leading-tight text-white md:text-3xl lg:text-4xl">{b.title}</h1>
                  {b.subheads.length > 0 && (
                    <div className="mt-4 space-y-1.5 text-on-green-soft">
                      {b.subheads.map((s) => <p key={s} className="text-lg">{s}</p>)}
                    </div>
                  )}
                  {b.button?.text && (
                    <Button href={b.button.href} variant="solid" size="lg" className="mt-7 bg-sage-soft hover:bg-sage-soft/90">
                      {b.button.text}
                    </Button>
                  )}
                </div>
              </section>
            );
          }
          case "text": {
            // The original's 2/5|3/5 "gallery row": left-aligned heading column beside a body column.
            if (b.sideHeading) {
              return (
                <section key={i} className="bg-paper py-10 md:py-14">
                  <div className="container-page grid gap-5 md:grid-cols-[2fr_3fr] md:gap-14">
                    <h2 className="text-3xl leading-snug md:text-4xl">{b.heading}</h2>
                    <div>
                      {b.body && <Prose html={b.body} />}
                      {b.button?.text && <Button href={b.button.href} variant="solid" size="md" className="mt-6">{b.button.text}</Button>}
                    </div>
                  </div>
                </section>
              );
            }
            const left = b.align === "left";
            return (
              <section key={i} className="bg-paper py-12 md:py-16">
                <div className={`container-page max-w-prose ${left ? "" : "text-center"}`}>
                  {b.heading && <h2 className="text-3xl md:text-4xl">{b.heading}</h2>}
                  {b.eyebrow && <p className={`btn-label mt-3 text-ink-soft ${left ? "" : "mx-auto"} max-w-2xl`}>{b.eyebrow}</p>}
                  {b.heading && <div className={`mt-5 h-px w-16 bg-gold ${left ? "" : "mx-auto"}`} />}
                  {b.body && <div className="mt-8"><Prose html={b.body} center={!left} /></div>}
                  {b.button?.text && <Button href={b.button.href} variant="solid" size="lg" className="mt-8">{b.button.text}</Button>}
                </div>
              </section>
            );
          }
          case "image-text": {
            const split = splitExpandableBio(b.body);
            const name = (b.heading ?? "").replace(b.subheading ?? "", "").trim();
            return (
              <section key={i} className="bg-paper py-10 md:py-14">
                <div className="container-page grid items-center gap-10 md:grid-cols-2">
                  <div className={b.imageSide === "right" ? "md:order-2" : ""}>
                    {b.card ? (
                      <TeamPhoto image={b.image} {...b.card} />
                    ) : (
                      b.image && (
                        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-md">
                          <Image src={b.image} alt={b.heading} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
                        </div>
                      )
                    )}
                  </div>
                  <div>
                    {b.card ? (
                      <>
                        <h2 className="text-3xl md:text-4xl">{b.card.name}</h2>
                        {b.card.credentials && <p className="mt-2 text-lg font-semibold text-ink-soft">{b.card.credentials}</p>}
                        {b.card.title && <p className="mt-3 text-xl font-medium text-green">{b.card.title}</p>}
                        {b.card.languages && <p className="mt-1.5 text-lg text-terracotta">{b.card.languages}</p>}
                        <div className="mt-5 h-px w-16 bg-gold" />
                      </>
                    ) : (
                      <>
                        {b.heading && <h2 className="text-3xl md:text-4xl">{b.heading}</h2>}
                        {b.subheading && <p className="btn-label mt-2 text-terracotta">{b.subheading}</p>}
                        {b.heading && <div className="mt-5 h-px w-16 bg-gold" />}
                      </>
                    )}
                    {b.body && (
                      <div className="mt-6">
                        {split ? (
                          <ExpandableBio visibleInner={split.visibleInner} hiddenInner={split.hiddenInner} name={name} />
                        ) : (
                          <Prose html={b.body} />
                        )}
                      </div>
                    )}
                    {b.button?.text && <Button href={b.button.href} variant="solid" size="md" className="mt-6">{b.button.text}</Button>}
                  </div>
                </div>
              </section>
            );
          }
          case "cards":
            // The event pages' 10-item grid: flat dark text rows with hairlines (original), not green tiles.
            if (b.plain) {
              return (
                <section key={i} className="bg-paper pb-10 md:pb-14">
                  <div className="container-page">
                    <div className={`grid gap-x-14 ${COLS[b.columns]}`}>
                      {b.cards.map((c, j) => (
                        <p key={j} className={`border-b border-line px-1 py-5 text-lg leading-snug text-ink ${j % 2 === 0 ? "font-semibold" : ""}`}>
                          {c.title}
                        </p>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }
            return (
              <section key={i} className="bg-paper pb-6 md:pb-8">
                <div className="container-page">
                  <div className={`grid gap-7 ${COLS[b.columns]}`}>
                    {b.cards.map((c, j) =>
                      b.hasDesc ? (
                        <div key={j} className="flex flex-col overflow-hidden rounded-lg shadow-md">
                          {c.image && (
                            <div className="relative aspect-[3/2]"><Image src={c.image} alt={c.title} fill sizes="33vw" className="object-cover" /></div>
                          )}
                          <div className="bg-green px-5 py-6 text-center"><h3 className="text-xl text-white">{c.title}</h3></div>
                          <div className="flex flex-1 flex-col bg-panel px-6 py-7 text-center">
                            <p className="flex-1 leading-relaxed text-ink-soft">{c.desc}</p>
                            {c.button?.text && <Button href={c.button.href} variant="outline" size="sm" className="mt-5 self-center">{c.button.text}</Button>}
                          </div>
                        </div>
                      ) : (
                        <div key={j} className="flex min-h-[130px] items-center justify-center rounded-lg bg-green px-6 py-8 text-center shadow-sm">
                          <h3 className="text-lg leading-snug text-white">{c.title}</h3>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </section>
            );
          case "image":
            return (
              <section key={i} className="bg-paper py-8 md:py-10">
                <div className="container-page flex justify-center">
                  <Image
                    src={b.src}
                    alt={b.alt}
                    width={b.width || 980}
                    height={b.height || 720}
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="h-auto w-full max-w-2xl rounded-2xl shadow-md"
                  />
                </div>
              </section>
            );
          case "faq": {
            const Toggle = ({ it, open }: { it: QA; open?: boolean }) => (
              <details className="group rounded-lg border border-line bg-card px-5 py-1 shadow-sm open:shadow-md" open={open}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium text-green marker:hidden">
                  {it.q}
                  <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                </summary>
                <div className="pb-5"><Prose html={it.a} /></div>
              </details>
            );
            // Grouped layout (the original FAQ page): titled accordion columns side by side,
            // first toggle of each group open on load.
            if (b.groups?.length) {
              return (
                <section key={i} className="bg-paper py-14 md:py-16">
                  <div className="container-page">
                    {b.heading && <h2 className="mb-10 text-center text-3xl md:text-4xl">{b.heading}</h2>}
                    <div className="grid gap-10 md:grid-cols-2">
                      {b.groups.map((g, gi) => (
                        <div key={gi}>
                          <h2 className="mb-5 text-2xl md:text-3xl">{g.title}</h2>
                          <div className="space-y-3">
                            {g.items.map((it, j) => <Toggle key={j} it={it} open={j === 0} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }
            return (
              <section key={i} className="bg-paper py-14 md:py-16">
                <div className="container-page max-w-3xl">
                  {b.heading && <h2 className="mb-8 text-center text-3xl md:text-4xl">{b.heading}</h2>}
                  <div className="space-y-3">
                    {(b.items ?? []).map((it, j) => <Toggle key={j} it={it} />)}
                  </div>
                </div>
              </section>
            );
          }
          case "table":
            return (
              <section key={i} className="bg-paper py-12 md:py-14">
                <div className="container-page">
                  {b.heading && <h2 className="mb-8 text-center text-3xl md:text-4xl">{b.heading}</h2>}
                  <div
                    className="prose prose-lg max-w-none overflow-x-auto prose-table:w-full prose-th:bg-green prose-th:p-3 prose-th:text-left prose-th:text-white prose-td:border prose-td:border-line prose-td:p-3 prose-a:break-words prose-a:text-green"
                    dangerouslySetInnerHTML={{ __html: b.html }}
                  />
                </div>
              </section>
            );
          case "cta":
            // Outlined-box treatment (the event pages): bordered card on the page background,
            // register line emphasized in brand green, decorative corner accents like the original.
            if (b.boxed) {
              return (
                <section key={i} className="bg-paper py-12 md:py-16">
                  <div className="container-page relative">
                    {b.accents?.[0] && (
                      <Image src={b.accents[0]} alt="" width={90} height={90} aria-hidden
                        className="pointer-events-none absolute -top-6 left-2 hidden w-16 md:block lg:w-20" />
                    )}
                    {b.accents?.[1] && (
                      <Image src={b.accents[1]} alt="" width={90} height={90} aria-hidden
                        className="pointer-events-none absolute -bottom-6 right-2 hidden w-16 md:block lg:w-20" />
                    )}
                    <div className="mx-auto max-w-4xl rounded-xl border border-line px-7 py-12 text-center md:px-12">
                      {b.heading && <h2 className="text-2xl leading-snug md:text-3xl lg:text-4xl">{b.heading}</h2>}
                      {b.body && (
                        <div className="mt-6 [&_a]:font-semibold [&_a]:text-green [&_p:last-child]:mt-4 [&_p:last-child]:text-xl [&_p:last-child]:font-semibold [&_p:last-child]:!text-green [&_p:last-child_strong]:!text-green">
                          <Prose html={b.body} center />
                        </div>
                      )}
                      {b.button?.text && <Button href={b.button.href} variant="solid" size="lg" className="mt-8">{b.button.text}</Button>}
                    </div>
                  </div>
                </section>
              );
            }
            return (
              <section key={i} className="mt-8 bg-panel py-20">
                <div className="container-page max-w-prose text-center">
                  {b.heading && <h2 className="text-2xl leading-snug md:text-3xl">{b.heading}</h2>}
                  {b.body && <div className="mt-6"><Prose html={b.body} center /></div>}
                  {b.button?.text && <Button href={b.button.href} variant="solid" size="lg" className="mt-8">{b.button.text}</Button>}
                </div>
              </section>
            );
          case "rows":
            // The original /groups "ledger": thumbnail | name + description | bottom-aligned button,
            // with a hairline between rows (flat light background, no hero).
            return (
              <section key={i} className="bg-paper py-6 md:py-10">
                <div className="container-page">
                  {b.rows.map((r, j) => (
                    <div
                      key={j}
                      className={`grid items-center gap-6 py-10 md:grid-cols-[1fr_3fr_1fr] md:gap-10 ${j < b.rows.length - 1 ? "border-b-2 border-[#d4d4d4]" : ""}`}
                    >
                      {r.image ? (
                        <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-xl md:mx-0 md:w-full md:max-w-[180px] md:justify-self-end">
                          <Image src={r.image} alt="" fill sizes="180px" className="object-cover" />
                        </div>
                      ) : (
                        <div aria-hidden className="hidden md:block" />
                      )}
                      <div>
                        <h2 className="text-2xl md:text-3xl">{r.heading}</h2>
                        {r.body && <div className="mt-4"><Prose html={r.body} /></div>}
                      </div>
                      <div className="flex md:h-full md:items-end">
                        {r.button?.text && <Button href={r.button.href} variant="solid" size="md">{r.button.text}</Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          case "event-features":
            // Original event template: display heading (with accent graphics) in the LEFT column,
            // the 10 topics as a 2-col hairline grid in the RIGHT column.
            return (
              <section key={i} className="bg-paper py-12 md:py-16">
                <div className="container-page grid items-start gap-10 md:grid-cols-[2fr_3fr] md:gap-14">
                  <div>
                    {b.accentAbove && (
                      <Image src={b.accentAbove} alt="" width={70} height={70} aria-hidden className="mb-4 w-12" />
                    )}
                    <h2 className="text-3xl leading-tight md:text-4xl lg:text-5xl">{b.heading}</h2>
                    {b.accentBelow && (
                      <Image src={b.accentBelow} alt="" width={300} height={151} aria-hidden className="mt-6 w-48 max-w-full" />
                    )}
                  </div>
                  <div className="grid gap-x-12 sm:grid-cols-2">
                    {b.items.map((item, j) => (
                      <p key={j} className={`border-b border-line px-1 py-5 text-lg leading-snug text-ink ${j % 2 === 0 ? "font-semibold" : ""}`}>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            );
          case "event-header":
            // Group-event masthead (all four group pages on the original): uppercase eyebrow above a
            // dark page title on the flat light background, then logistics beside the event flyer.
            return (
              <section key={i} className="bg-paper pb-4 pt-12 md:pt-16">
                <div className="container-page">
                  <div className="text-center">
                    {b.eyebrow && <p className="btn-label text-terracotta">{b.eyebrow}</p>}
                    <h1 className="mx-auto mt-2 max-w-4xl text-3xl leading-tight md:text-4xl lg:text-5xl">
                      {b.title}
                      {b.subtitle && <span className="mt-2 block text-2xl md:text-3xl lg:text-4xl">{b.subtitle}</span>}
                    </h1>
                  </div>
                  <div className="mt-10 grid items-center gap-8 md:grid-cols-2 md:gap-12">
                    <div><Prose html={b.logistics} /></div>
                    {b.image && (
                      <Image
                        src={b.image}
                        alt={b.imageAlt ?? b.title}
                        width={880}
                        height={660}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="h-auto w-full rounded-2xl shadow-md"
                      />
                    )}
                  </div>
                </div>
              </section>
            );
        }
      })}
    </>
  );
}
