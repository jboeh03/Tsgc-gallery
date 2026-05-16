/**
 * Site-wide constants. Everything across the site reads from here.
 */
export const SITE = {
  name: "Tri-State Grill Cleaning",
  shortName: "Tri-State",
  tagline:
    "Veteran-founded grill cleaning serving Cincinnati, Northern Kentucky, and Dayton since 2018.",
  foundedYear: 2018,
  owner: "Jeff Boeh",
  phone: "(657) 831-4276",
  phoneHref: "tel:+16578314276",
  smsHref: "sms:+16578314276",
  email: "jeff@cincygrillcleaning.com",
  emailHref: "mailto:jeff@cincygrillcleaning.com",
  cityState: "Cincinnati, OH 45233",
  serviceArea: ["Cincinnati", "Northern Kentucky", "Dayton"],
  hoursSummary: "Mon–Sat · By appointment",
  social: {
    facebook: "https://www.facebook.com/Tristategrillcleaning/",
    instagram: "https://www.instagram.com/cincygrillcleaning/",
    googleReview:
      "https://www.google.com/maps?cid=306553952702723641&action=write-review",
  },
  // Google Apps Script endpoint that ingests leads into Jeff's CRM sheet
  // and emails him + a customer auto-reply. Source in /integrations.
  quoteEndpoint:
    "https://script.google.com/macros/s/AKfycbzAgVBZv6bc2ncRZ9oyFfzPvODm4Kdua9xZYCOi8fWaUG-JAotfX_LuK5fDm80BPn52/exec",
} as const;
