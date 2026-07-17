import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

type Locale = "en" | "es";

const t = {
  en: {
    preview: "We received your message — Growth Journey Therapy",
    greeting: (n: string) => `Hi ${n},`,
    body: "Thank you for reaching out to Growth Journey Therapy. We received your message and will get back to you within 1–2 business days at the email or phone number you provided.",
    secure: "Whenever you're ready to begin, you can take the first step here:",
    cta: "Get Started",
    crisis:
      "If you are in crisis or experiencing a mental-health emergency, call or text 988 (Suicide & Crisis Lifeline) or call 911 — please don't wait for our reply.",
    signoff: "Warmly,",
    team: "The Growth Journey Therapy team",
  },
  es: {
    preview: "Recibimos tu mensaje — Growth Journey Therapy",
    greeting: (n: string) => `Hola ${n}:`,
    body: "Gracias por comunicarte con Growth Journey Therapy. Recibimos tu mensaje y te contactaremos dentro de 1 a 2 días hábiles al correo o teléfono que nos proporcionaste.",
    secure: "Cuando estés listo/a para comenzar, puedes dar el primer paso aquí:",
    cta: "Comenzar",
    crisis:
      "Si estás en crisis o atraviesas una emergencia de salud mental, llama o envía un mensaje de texto al 988 (Línea de Prevención del Suicidio y Crisis, atención en español) o llama al 911; por favor no esperes nuestra respuesta.",
    signoff: "Con cariño,",
    team: "El equipo de Growth Journey Therapy",
  },
} satisfies Record<Locale, Record<string, unknown>>;

const GREEN = "#2f7863";
const INK = "#2c2a26";
const PAPER = "#f4f1ea";

export function InquiryConfirmation({
  name,
  locale,
  getStartedUrl,
}: {
  name: string;
  locale: Locale;
  getStartedUrl: string;
}) {
  const c = t[locale];
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ backgroundColor: PAPER, margin: 0, padding: "24px 0", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden" }}>
          <Section style={{ backgroundColor: GREEN, padding: "22px 32px" }}>
            <Text style={{ margin: 0, color: "#ffffff", fontSize: 18, fontWeight: 700, letterSpacing: "0.2px" }}>
              Growth Journey Therapy
            </Text>
          </Section>
          <Section style={{ padding: "28px 32px 8px" }}>
            <Heading as="h1" style={{ margin: "0 0 14px", fontSize: 22, color: INK, fontWeight: 700 }}>
              {c.greeting(name)}
            </Heading>
            <Text style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.6, color: INK }}>{c.body}</Text>
            <Text style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.6, color: INK }}>{c.secure}</Text>
            <Link
              href={getStartedUrl}
              style={{
                display: "inline-block",
                backgroundColor: GREEN,
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                padding: "11px 24px",
                borderRadius: 9999,
              }}
            >
              {c.cta}
            </Link>
          </Section>
          <Section style={{ padding: "18px 32px 26px" }}>
            <Hr style={{ borderColor: "#e7e2d6", margin: "6px 0 16px" }} />
            <Text style={{ margin: "0 0 18px", fontSize: 13, lineHeight: 1.6, color: "#6b6862" }}>{c.crisis}</Text>
            <Text style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: INK }}>
              {c.signoff}
              <br />
              {c.team}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
