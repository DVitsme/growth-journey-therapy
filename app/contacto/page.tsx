import type { Metadata } from "next";
import { ContactSection } from "@/components/site/contact-section";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Comunícate con Growth Journey Therapy — terapia bilingüe y culturalmente afirmativa en Filadelfia y en toda Pensilvania por telesalud.",
  alternates: { canonical: "/contacto", languages: { en: "/contact", es: "/contacto" } },
};

export default function ContactoPage() {
  return <ContactSection locale="es" />;
}
