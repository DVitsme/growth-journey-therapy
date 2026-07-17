import type { Metadata } from "next";
import Image from "next/image";
import { getPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { CareersForm } from "@/components/site/careers-form";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Careers at Growth Journey Therapy in Philadelphia. We're hiring bilingual, culturally responsive therapists to help expand access to care for our community.",
  alternates: { canonical: "/careers" },
};

export default async function CareersPage() {
  const content = getPage("careers")?.content ?? "";
  // The job posting = everything from its H1 onward; the intro above it renders in the top row.
  const jd = content.split(/\n(?=#\s+Bilingual)/)[1] ?? content;
  const jdHtml = await renderMarkdown(jd);

  return (
    <>
      {/* Intro row — original layout: photo on the left; heading + tagline + the
          application form together in the right column. */}
      <section className="bg-paper py-12 md:py-16">
        <div className="container-page grid gap-10 md:grid-cols-2 md:gap-14">
          <div className="relative min-h-[320px] overflow-hidden rounded-2xl shadow-md md:min-h-0">
            <Image
              src="/images/library/pexels-yankrukov-8837242.jpg"
              alt="Two people talking warmly together in a bright, welcoming setting"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl">Careers at Growth Journey</h2>
            <div className="mt-5 h-px w-16 bg-gold" />
            <p className="mt-6 text-lg text-ink-soft">
              We&apos;re growing—join us to help our community thrive by expanding access to care;
              bilingual clinicians are especially welcome.
            </p>
            <div className="mt-8">
              <CareersForm />
            </div>
          </div>
        </div>
      </section>

      {/* Job posting (the page's H1 lives here, as on the original). */}
      <section className="bg-paper pb-16 md:pb-20">
        <div className="container-page max-w-prose">
          <div
            className="prose prose-lg max-w-none text-ink-soft prose-headings:text-green prose-h1:text-3xl md:prose-h1:text-4xl prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-green"
            dangerouslySetInnerHTML={{ __html: jdHtml }}
          />
        </div>
      </section>
    </>
  );
}
