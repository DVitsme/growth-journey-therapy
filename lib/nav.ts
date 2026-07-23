/** Primary site navigation — mirrors the original Divi "onboarding-primary-menu" exactly. */

export type NavLink = { label: string; href: string };
/** `wide` renders the dropdown as a 2-column mega menu (the long Methods list). */
export type NavItem = NavLink & { children?: NavLink[]; wide?: boolean };

export const NAV: NavItem[] = [
  {
    label: "About",
    href: "/mission",
    children: [
      { label: "Our Vision", href: "/mission" },
      { label: "Our Team", href: "/team" },
    ],
  },
  {
    label: "Methods",
    href: "/methods",
    wide: true,
    children: [
      { label: "Acceptance and Commitment Therapy", href: "/methods/acceptance-and-commitment-therapy" },
      { label: "Cognitive Behavioral Therapy", href: "/methods/cognitive-behavioral-therapy" },
      { label: "Dialectical Behavior Therapy", href: "/methods/dialectal-behavior-therapy" },
      { label: "Group Therapy", href: "/methods/group-therapy" },
      { label: "Gottman Method Therapy", href: "/methods/gottman-method-therapy" },
      { label: "Holistic Therapy", href: "/methods/holistic-therapy" },
      { label: "Culturally Informed Therapy", href: "/methods/culturally-informed-therapy" },
      { label: "Internal Family Systems Therapy", href: "/methods/internal-family-systems-therapy" },
      { label: "Eye Movement Desensitization and Reprocessing (EMDR)", href: "/methods/eye-movement-desensitization-reprogramming-therapy" },
      { label: "Mindfulness Based Therapy", href: "/methods/mindfulness-based-therapy" },
      { label: "Narrative Therapy", href: "/methods/narrative-therapy" },
      { label: "Person Centered Therapy", href: "/methods/person-centered-therapy" },
    ],
  },
  {
    label: "Specialties",
    href: "/specialties",
    wide: true,
    children: [
      // Original dropdown order (Wayback nav). The old site's Burn Out item linked a
      // "-2" duplicate slug; we use the canonical page (the -2 URL gets a 301 in the SEO pass).
      { label: "Couples Counseling", href: "/specialties/couples-counseling" },
      { label: "Individual Therapy", href: "/specialties/individual-therapy" },
      { label: "Cultural Integration Therapy", href: "/specialties/cultural-integration-therapy" },
      { label: "Generational Trauma", href: "/specialties/generational-trauma" },
      { label: "Immigration Anxiety", href: "/specialties/immigration-anxiety" },
      { label: "Burn Out & Work Life Balance", href: "/specialties/burn-out-work-life-balance" },
      { label: "Self-Identity Therapy", href: "/specialties/self-identity-therapy" },
    ],
  },
  {
    label: "Explore More",
    href: "/frequently-asked-questions",
    children: [
      { label: "Frequently Asked Questions", href: "/frequently-asked-questions" },
      { label: "Careers", href: "/careers" },
      { label: "Insurance and Payment", href: "/insurance-and-payment" },
    ],
  },
  { label: "Groups", href: "/groups" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_QUICK_LINKS: NavLink[] = [
  { label: "About", href: "/mission" },
  { label: "Frequently Asked Questions", href: "/frequently-asked-questions" },
  { label: "Insurance & Payments", href: "/insurance-and-payment" },
  { label: "Careers", href: "/careers" },
];
