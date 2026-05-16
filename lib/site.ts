/**
 * Site-wide constants. Replace the TODO values with real info; everything
 * across the site reads from here.
 */
export const SITE = {
  name: "Tri-State Grill Cleaning",
  shortName: "Tri-State",
  tagline: "Veteran-founded grill restoration across Cincinnati, NKY, and Dayton.",
  // TODO: replace with real values
  phone: "(513) 555-0100",
  phoneHref: "tel:+15135550100",
  email: "hello@tristategrillcleaning.com",
  emailHref: "mailto:hello@tristategrillcleaning.com",
  serviceArea: ["Cincinnati, OH", "Northern Kentucky", "Dayton, OH"],
  hoursSummary: "Mon–Sat · By appointment",
  social: {
    // TODO: replace with real handles or set to empty string to hide
    facebook: "",
    instagram: "",
    google: "",
  },
} as const;
