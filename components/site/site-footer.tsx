import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, Mail } from "lucide-react";
import { SITE } from "@/lib/site";
import { FOOTER_QUICK_LINKS } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="bg-green text-on-green">
      <div className="container-page grid gap-10 py-16 md:grid-cols-3">
        {/* Brand + service area */}
        <div>
          <Image
            src="/images/brand/logo-white.png"
            alt={SITE.name}
            width={2514}
            height={2560}
            className="h-24 w-auto"
          />
          <p className="mt-6 text-sm text-on-green-soft">Philadelphia, PA (in person)</p>
          <p className="text-sm text-on-green-soft">All of Pennsylvania via Telehealth</p>
        </div>

        {/* Contact */}
        <div className="space-y-4 text-base">
          <a href={SITE.phoneHref} className="flex items-center gap-3 hover:text-white">
            <Phone className="size-4 shrink-0 text-gold" aria-hidden />
            <span className="border-b border-on-green/30 pb-0.5">{SITE.phone}</span>
          </a>
          <p className="flex items-start gap-3">
            <MapPin className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
            <span className="text-on-green-soft">
              {SITE.address.street}
              <br />
              {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
            </span>
          </p>
          <a
            href={`mailto:${SITE.email}`}
            className="flex items-center gap-3 break-all text-on-green-soft hover:text-white"
          >
            <Mail className="size-4 shrink-0 text-gold" aria-hidden />
            {SITE.email}
          </a>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="mb-4 text-lg text-on-green">Quick Links</h2>
          <ul className="space-y-2.5 text-base">
            {FOOTER_QUICK_LINKS.map((l) => (
              <li key={l.href} className="flex items-center gap-2">
                <span className="text-gold" aria-hidden>
                  •
                </span>
                <Link href={l.href} className="text-on-green-soft underline-offset-4 hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-on-green/15">
        <p className="container-page py-6 text-center text-sm text-on-green-soft">
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
