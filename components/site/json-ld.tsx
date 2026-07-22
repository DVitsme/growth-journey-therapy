import { toJsonLd } from "@/lib/json-ld";

/**
 * Emits a JSON-LD structured-data block. Server component; renders inert `application/ld+json`
 * (a data block, not executable JS — no CSP/hydration concern). The Next.js-recommended pattern.
 */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(data) }} />;
}
