import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

// Branded 404 — also what the ~1,000 spam URLs Google still indexes will land on
// until the SEO pass 410s them.
export default function NotFound() {
  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="container-page max-w-xl text-center">
        <Sprout className="mx-auto size-14 text-green" aria-hidden strokeWidth={1.25} />
        <h1 className="mt-6 text-3xl md:text-4xl">This page doesn&apos;t exist</h1>
        <p className="mt-4 text-lg text-ink-soft">
          The page you&apos;re looking for may have moved or never existed. You&apos;re still in the
          right place — let&apos;s get you back on your journey.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href="/" variant="solid" size="md">Back to Home</Button>
          <Button href="/contact" variant="outline" size="md">Contact Us</Button>
        </div>
      </div>
    </section>
  );
}
