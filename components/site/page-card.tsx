import Link from "next/link";
import Image from "next/image";
import { Sprout } from "lucide-react";

type CardData = { title: string; excerpt: string; heroImage?: string; heroImageAlt?: string };

export function PageCard({ page, href }: { page: CardData; href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-panel">
        {page.heroImage ? (
          <Image
            src={page.heroImage}
            alt={page.heroImageAlt ?? page.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="om-hatch flex h-full items-center justify-center text-green/30">
            <Sprout className="size-10" aria-hidden strokeWidth={1.25} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl leading-snug text-green transition-colors group-hover:text-green-deep">
          {page.title}
        </h3>
        <p className="mt-2 flex-1 text-base leading-relaxed text-ink-soft">{page.excerpt}</p>
        <span className="btn-label mt-4 text-green">Learn more →</span>
      </div>
    </Link>
  );
}
