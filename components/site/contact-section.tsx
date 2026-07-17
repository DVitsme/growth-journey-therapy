import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { ContactForm } from "./contact-form";

const copy = {
  en: {
    title: "Contact Us",
    intro: "We welcome your inquiry.",
    apptBefore: "If you're seeking an appointment, please use our ",
    apptLink: "Get Started",
    apptAfter: " page.",
    otherLang: "¿Prefieres español? Visita nuestra página de contacto en español.",
    otherHref: "/contacto",
  },
  es: {
    title: "Contáctanos",
    intro: "Con gusto recibimos tu consulta.",
    apptBefore: "Si buscas una cita, por favor usa nuestra página ",
    apptLink: "Comenzar",
    apptAfter: ".",
    otherLang: "Prefer English? Visit our contact page in English.",
    otherHref: "/contact",
  },
} as const;

export function ContactSection({ locale }: { locale: "en" | "es" }) {
  const t = copy[locale];
  return (
    <section className="grid md:grid-cols-[2fr_3fr]" lang={locale === "es" ? "es" : undefined}>
      {/* Left — info panel */}
      <div className="bg-panel px-6 py-14 md:px-12 md:py-20 lg:px-16">
        <div className="max-w-md md:ml-auto">
          <h1 className="text-4xl text-green md:text-5xl">{t.title}</h1>
          <p className="mt-6 text-lg text-ink-soft">{t.intro}</p>
          <p className="mt-4 text-lg text-ink-soft">
            {t.apptBefore}
            <Link href="/consultation" className="font-medium text-green underline underline-offset-2 hover:text-green-deep">
              {t.apptLink}
            </Link>
            {t.apptAfter}
          </p>
          {/* Language toggle — the ES page is otherwise unreachable from the nav. */}
          <p className="mt-4 text-base text-ink-soft" lang={locale === "es" ? "en" : "es"}>
            <Link href={t.otherHref} className="text-green underline underline-offset-2 hover:text-green-deep">
              {t.otherLang}
            </Link>
          </p>
          <div className="mt-10 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-6 shrink-0 text-green" aria-hidden />
              <address className="text-lg not-italic text-ink">
                {SITE.address.street}
                <br />
                {SITE.address.city} {SITE.address.state} {SITE.address.zip}
              </address>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-6 shrink-0 text-green" aria-hidden />
              <a href={SITE.phoneHref} className="text-lg font-medium text-terracotta hover:underline">
                {SITE.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="px-6 py-14 md:px-12 md:py-20 lg:px-16">
        <div className="max-w-xl">
          <ContactForm locale={locale} />
        </div>
      </div>

      {/* Office map — full-width at the bottom, as on the original page. */}
      <div className="md:col-span-2">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3057.992281161601!2d-75.17768222337891!3d39.96392528307331!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c6c7ca4d7aabd5%3A0x83c6680ea4b72d29!2s2201%20Pennsylvania%20Ave%20Suite%20101%2C%20Philadelphia%2C%20PA%2019130!5e0!3m2!1sen!2sus!4v1756472899826!5m2!1sen!2sus"
          title={locale === "es" ? "Mapa de la oficina — 2201 Pennsylvania Ave, Suite 101, Filadelfia" : "Office map — 2201 Pennsylvania Ave, Suite 101, Philadelphia"}
          className="h-[420px] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
