import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPerson, getAllPeople } from "@/lib/team";
import { getPostsByAuthor, formatDate, categoryLabel } from "@/lib/blog";
import { splitExpandableBio } from "@/lib/expandable-bio";
import { JsonLd } from "@/components/site/json-ld";
import { profileGraph } from "@/lib/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  // Profile pages for people only — the org's byline links to /team, not a profile page.
  return getAllPeople()
    .filter((p) => !p.isOrg)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/team/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const person = getPerson(slug);
  if (!person || person.isOrg) return {};
  const role = person.title ?? "Growth Journey Therapy team";
  return {
    title: `${person.name} — ${role}`,
    description: `Meet ${person.name}, ${role} at Growth Journey Therapy — bilingual, culturally-affirming therapy in Philadelphia and across Pennsylvania.`,
    alternates: { canonical: `/team/${slug}` },
  };
}

function initials(name: string): string {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

const LINK_LABELS: Record<string, string> = {
  psychologyToday: "Psychology Today",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  website: "Website",
};
const linkLabel = (key: string) =>
  LINK_LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());

/** Full bio HTML — both halves of the original Read-More split shown (no toggle on a dedicated page). */
function fullBio(bioHtml: string): string {
  const split = splitExpandableBio(bioHtml);
  if (split) return `<p>${split.visibleInner}</p><p>${split.hiddenInner}</p>`;
  return bioHtml.replace(/<!--[\s\S]*?-->/g, "");
}

export default async function TeamMemberPage(props: PageProps<"/team/[slug]">) {
  const { slug } = await props.params;
  const person = getPerson(slug);
  if (!person || person.isOrg) notFound();

  const posts = getPostsByAuthor(person.slug);
  const languages = person.languages.join(" / ");
  const links = Object.entries(person.links);

  return (
    <article className="bg-paper pb-20">
      <JsonLd data={profileGraph(person)} />
      <header className="border-b border-line bg-cream">
        <div className="container-page max-w-4xl py-14">
          <Link href="/team" className="btn-label inline-flex items-center gap-1.5 text-green hover:text-green-deep">
            <ArrowLeft className="size-4" aria-hidden />
            Our team
          </Link>
          <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-center">
            {person.headshot ? (
              <div className="relative aspect-[648/705] w-44 shrink-0 overflow-hidden rounded-2xl shadow-md sm:w-52">
                <Image
                  src={person.headshot}
                  alt={person.name}
                  fill
                  priority
                  sizes="208px"
                  className="object-cover"
                  style={person.objectPosition ? { objectPosition: person.objectPosition } : undefined}
                />
              </div>
            ) : (
              <div className="grid aspect-[648/705] w-44 shrink-0 place-items-center rounded-2xl bg-panel shadow-sm sm:w-52">
                <span aria-hidden className="font-display text-6xl font-semibold text-green">
                  {initials(person.name)}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl leading-tight md:text-4xl">{person.name}</h1>
              {person.credentials && <p className="mt-2 text-lg font-semibold text-ink-soft">{person.credentials}</p>}
              {person.title && <p className="mt-3 text-xl font-medium text-green">{person.title}</p>}
              {languages && <p className="mt-1.5 text-lg text-terracotta">{languages}</p>}
              {links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {links.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-label rounded-full border border-line px-4 py-1.5 text-green transition-colors hover:border-green hover:bg-green hover:text-on-green"
                    >
                      {linkLabel(key)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="container-page mt-12 max-w-prose">
        <div
          className="prose prose-lg max-w-none text-ink-soft prose-headings:font-display prose-headings:text-green prose-p:text-ink-soft prose-a:text-green hover:prose-a:text-green-deep prose-strong:text-ink"
          dangerouslySetInnerHTML={{ __html: fullBio(person.bioHtml) }}
        />
      </section>

      {posts.length > 0 && (
        <section className="mt-16 border-t border-line bg-cream py-14">
          <div className="container-page max-w-3xl">
            <h2 className="text-2xl">Articles by {person.name}</h2>
            <ul className="mt-6 divide-y divide-line">
              {posts.map((p) => (
                <li key={`${p.lang}-${p.slug}`} className="py-4">
                  <Link href={`/blog/${p.slug}`} className="group block" lang={p.lang === "es" ? "es" : undefined}>
                    <span className="text-lg font-medium text-ink transition-colors group-hover:text-green">{p.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
                      {p.categories[0] && <span className="btn-label text-green">{categoryLabel(p.categories[0])}</span>}
                      <time dateTime={p.date}>{formatDate(p.date, p.lang)}</time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="container-page mt-14 max-w-4xl border-t border-line pt-8">
        <Link href="/team" className="btn-label inline-flex items-center gap-1.5 text-green hover:text-green-deep">
          <ArrowLeft className="size-4" aria-hidden />
          Back to our team
        </Link>
      </div>
    </article>
  );
}
