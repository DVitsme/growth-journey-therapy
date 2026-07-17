import Image from "next/image";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Green banner used at the top of interior pages. With `image` it becomes the original
 *  overview-style hero: photo background under a green overlay, tagline, and CTA button. */
export function PageHero({
  title,
  subtitle,
  image,
  imageAlt,
  button,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  button?: { text: string; href: string };
}) {
  return (
    <section className="relative overflow-hidden bg-green text-on-green">
      {image ? (
        <>
          <Image src={image} alt={imageAlt ?? ""} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-green/80" aria-hidden />
        </>
      ) : (
        <Sprout
          className="pointer-events-none absolute -right-6 -top-4 size-48 text-white/5"
          aria-hidden
          strokeWidth={1}
        />
      )}
      <div className="container-page relative py-16 text-center md:py-20">
        <h1 className="text-4xl text-on-green md:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-on-green-soft">{subtitle}</p>
        )}
        {button && (
          <Button href={button.href} variant="solid" size="lg" className="mt-7 bg-sage-soft hover:bg-sage-soft/90">
            {button.text}
          </Button>
        )}
        <div className="mx-auto mt-6 h-px w-16 bg-gold" />
      </div>
    </section>
  );
}
