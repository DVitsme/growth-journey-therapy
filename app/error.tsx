"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="container-page max-w-xl text-center">
        <h1 className="text-3xl md:text-4xl">Something went wrong</h1>
        <p className="mt-4 text-lg text-ink-soft">
          We hit an unexpected problem loading this page. Please try again — or call us at{" "}
          <a href="tel:+12677138831" className="font-medium text-green underline underline-offset-2">
            (267) 713-8831
          </a>{" "}
          if it keeps happening.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button type="button" variant="solid" size="md" onClick={reset}>Try again</Button>
          <Button href="/" variant="outline" size="md">Back to Home</Button>
        </div>
      </div>
    </section>
  );
}
