import type { Metadata } from "next";
import { ContactSection } from "@/components/site/contact-section";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Growth Journey Therapy — bilingual, culturally-affirming therapy in Philadelphia and across Pennsylvania via telehealth.",
  alternates: { canonical: "/contact", languages: { en: "/contact", es: "/contacto" } },
};

export default function ContactPage() {
  return <ContactSection locale="en" />;
}
