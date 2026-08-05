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
  // TEMP: published number reverted to Jeff's direct line while the 513 Twilio
  // number's A2P 10DLC campaign is pending (outbound blocked w/ err 30034).
  // Flip back to (513) 790-4040 / +15137904040 the moment the campaign verifies.
  phone: "(657) 831-4276",
  phoneHref: "tel:+16578314276",
  smsHref: "sms:+16578314276",
  email: "jeff@cincygrillcleaning.com",
  emailHref: "mailto:jeff@cincygrillcleaning.com",
  cityState: "Cincinnati, OH 45233",
  serviceArea: ["Cincinnati", "Northern Kentucky", "Dayton"],
  hoursSummary: "Mon–Sat · By appointment",
  // Canonical public domain. All metadata / OG / sitemap URLs use this.
  canonicalUrl: "https://tristategrillcleaning.com",
  // Hosts where the AI preview tool is hidden (production-facing).
  // Any other host (e.g. *.vercel.app) shows the tool for testing.
  publicHosts: ["tristategrillcleaning.com", "www.tristategrillcleaning.com"],
  social: {
    facebook: "https://www.facebook.com/share/1ECnm2S6Ju/",
    instagram: "https://www.instagram.com/cincygrillcleaning/",
    googleReview: "https://g.page/r/CTl2Vh8yGUEEEBM/review",
  },
  // Google Apps Script endpoint that ingests leads into Jeff's CRM sheet
  // and emails him + a customer auto-reply. Source in /integrations.
  quoteEndpoint:
    "https://script.google.com/macros/s/AKfycbzAgVBZv6bc2ncRZ9oyFfzPvODm4Kdua9xZYCOi8fWaUG-JAotfX_LuK5fDm80BPn52/exec",
} as const;

// TEMP: reviews are hidden site-wide while we work through a rough stretch of
// feedback. Flipping this to true restores the homepage reviews section and
// re-enables the review-request agent. Also re-add the /api/agents/reviews cron
// entry to vercel.json, and set REVIEWS_PAUSED = false in the two Apps Script
// files under /integrations (then redeploy them) when turning this back on.
export const SHOW_REVIEWS: boolean = false;
