import { z } from "zod";

/**
 * Field set mirrors the original Divi contact form 1:1: First/Last/Email, optional Phone,
 * the optional "Are You Interested in..." select (her service names, original order),
 * and the required Message textarea.
 *
 * COMPLIANCE NOTE (docs/research/resend-contact.md): the free-text Message field was
 * originally omitted because inquiries route through Resend (no BAA) and message boxes on
 * a therapist's site attract clinical detail. It was restored 2026-07-17 at the owner's
 * request to match the original site. Mitigations: the "no medical information" disclaimer
 * above the form, a per-field reminder, the message is never echoed into the auto-reply,
 * and the practice inbox is the only recipient. The therapist should still sign off.
 */
export const INTERESTS = [
  "Burn Out & Work Life Balance",
  "Couples Therapy",
  "Cultural Integration Therapy",
  "Culturally Sensitive Therapy",
  "Depression",
  "Generational Trauma",
  "Grief and Loss",
  "Immigration Anxiety",
  "Self-Identity Therapy",
  "Trauma Informed Care",
  "Other",
] as const;

export const inquirySchema = z.object({
  firstName: z.string().trim().min(1, "required").max(100),
  lastName: z.string().trim().min(1, "required").max(100),
  email: z.email("invalid").max(200),
  phone: z.string().trim().max(40),
  interest: z.enum(INTERESTS).or(z.literal("")),
  message: z.string().trim().min(1, "required").max(2000),
  consent: z.literal("on"), // "you may contact me at the info above"
  locale: z.enum(["en", "es"]),
});

export type Inquiry = z.infer<typeof inquirySchema>;
