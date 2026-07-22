import Image from "next/image";
import { Phone, CalendarCheck, HeartHandshake, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/site/json-ld";
import { homeGraph } from "@/lib/structured-data";

const JOURNEY = [
  { icon: Phone, title: "Phone Consultation", copy: "A free first call to see if we're the right fit for you." },
  { icon: CalendarCheck, title: "First Appointment", copy: "We meet, listen, and shape a plan around your goals." },
  { icon: HeartHandshake, title: "Ongoing Care", copy: "Regular sessions, in person or via telehealth across PA." },
  { icon: Sprout, title: "Live Better", copy: "Tools and support to help you reclaim your happiness." },
];

export default function Home() {
  return (
    <>
      <JsonLd data={homeGraph()} />
      {/* ── Hero ── */}
      <section className="relative m-6 overflow-hidden rounded-2xl bg-sage md:m-12">
        {/* Desktop/tablet: full-bleed composite image with headline overlaid on the sage right side */}
        <div className="relative hidden md:block">
          <Image
            src="/images/home/hero-family.jpg"
            alt="A smiling family embracing"
            width={2560}
            height={829}
            priority
            className="h-auto w-full"
          />
          <div className="absolute inset-y-0 right-0 flex w-1/2 flex-col items-end justify-center pr-[6%] text-right">
            <h1 className="text-2xl font-light leading-tight text-white lg:text-3xl xl:text-4xl [text-shadow:0_1px_10px_rgba(0,0,0,0.15)]">
              We Understand you
              <br />
              We Speak your language
              <br />
              Tools for living
            </h1>
            <Button href="/schedule-now" variant="outline-light" size="lg" className="mt-8">
              Start Your Journey
            </Button>
          </div>
        </div>

        {/* Mobile: image (family kept in frame) then headline on sage */}
        <div className="md:hidden">
          <Image
            src="/images/home/hero-family.jpg"
            alt="A smiling family embracing"
            width={2560}
            height={829}
            priority
            className="h-56 w-full object-cover object-left"
          />
          <div className="px-6 py-10 text-center">
            <h1 className="text-2xl font-light leading-tight text-white">
              We Understand you. We Speak your language. Tools for living.
            </h1>
            <Button href="/schedule-now" variant="outline-light" size="lg" className="mt-6">
              Start Your Journey
            </Button>
          </div>
        </div>
      </section>

      {/* ── You Are Welcome Here ── */}
      <section className="bg-paper py-20">
        <div className="container-page max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl">You Are Welcome Here</h2>
          <div className="mx-auto mt-5 h-px w-16 bg-gold" />
          <p className="mt-8 text-lg leading-relaxed text-ink-soft">
            Growth Journey Therapy is more than just a therapy practice; it&rsquo;s a haven where individuals
            from all walks of life &ndash; especially those from immigrant and BIPOC communities &ndash; can
            find support and understanding. We offer a range of therapies, from individual to family and
            couples counseling, addressing a spectrum of mental health needs.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Bilingual services are available so that language is never a barrier to healing, and to better
            serve the diverse cultural backgrounds of our community.
          </p>
        </div>
      </section>

      {/* ── The Stages of Your Journey ── */}
      <section className="bg-cream py-20">
        <div className="container-page">
          <h2 className="text-center text-3xl md:text-4xl">The Stages of Your Journey</h2>
          <div className="mx-auto mt-5 h-px w-16 bg-gold" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(({ icon: Icon, title, copy }) => (
              <div
                key={title}
                className="relative overflow-hidden rounded-xl bg-green p-7 text-on-green shadow-sm"
              >
                <Sprout
                  className="absolute -bottom-3 -right-2 size-24 text-white/10"
                  aria-hidden
                  strokeWidth={1}
                />
                <Icon className="size-8 text-gold" aria-hidden strokeWidth={1.5} />
                <h3 className="mt-5 text-xl text-on-green">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-on-green-soft">{copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button href="/methods" variant="solid" size="lg">
              Read More About Our Methods
            </Button>
          </div>
        </div>
      </section>

      {/* ── Our Methods teaser ── */}
      <section className="bg-panel py-20">
        <div className="container-page grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl md:text-4xl">Our Methods</h2>
            <div className="mt-5 h-px w-16 bg-gold" />
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              Every person&rsquo;s path is different. We draw on evidence-based, culturally-responsive
              approaches &mdash; from CBT and DBT to EMDR, IFS, and the Gottman Method &mdash; and tailor
              them to your story, your language, and your goals.
            </p>
            <Button href="/methods" variant="outline" size="lg" className="mt-8">
              Learn More
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl">
            <Image
              src="/images/home/methods-photo.jpg"
              alt="A therapist and client in a counseling session"
              width={998}
              height={660}
              className="aspect-[3/2] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Our Team ── */}
      <section className="bg-cream py-20">
        <div className="container-page max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl">Our Team</h2>
          <div className="mx-auto mt-5 h-px w-16 bg-gold" />
          <p className="mt-8 text-lg leading-relaxed text-ink-soft">
            In the heart of Pennsylvania, there stands a testament to resilience, understanding, and the
            power of culturally aware healing &ndash; Growth Journey Therapy. The story of this transformative
            space begins with its founder, Nelsery De Leon, a BIPOC LatinX immigrant whose own journey
            inspired a mission to provide comprehensive, bilingual therapy that resonates with the diverse
            tapestry of Pennsylvania&rsquo;s people.
          </p>
          <Button href="/team" variant="solid" size="lg" className="mt-10">
            Learn More
          </Button>
        </div>
      </section>
    </>
  );
}
