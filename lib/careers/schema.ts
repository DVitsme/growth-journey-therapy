import { z } from "zod";

export const EMPLOYMENT = ["full-time", "part-time", "either"] as const;
export type Employment = (typeof EMPLOYMENT)[number];

export const EMPLOYMENT_LABELS: Record<Employment, string> = {
  "full-time": "Full-Time",
  "part-time": "Part-Time",
  either: "Either",
};

/** Careers is NOT a clinical channel, so a free-text message is fine here (unlike the contact form).
 *  Field set + requiredness mirror the original Divi form: everything required except the textarea. */
export const careersSchema = z.object({
  name: z.string().trim().min(1, "required").max(100),
  email: z.email("invalid").max(200),
  phone: z.string().trim().min(1, "required").max(40),
  address: z.string().trim().min(1, "required").max(200),
  employment: z.enum(EMPLOYMENT),
  message: z.string().trim().max(3000),
});

export type Application = z.infer<typeof careersSchema>;
