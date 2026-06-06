/**
 * Weber repair content cluster — model/problem-specific SEO guides that live
 * under /weber-grill-repair/[slug] and funnel high-intent searchers to /quote.
 * Drafted via a multi-agent workflow, reviewed before commit. Add an entry here
 * and it gets a static page, metadata, FAQ schema, a hub link, and a sitemap
 * row automatically.
 */

export type RepairGuide = {
  slug: string;
  model: string;
  /** Short problem label for hub cards (e.g. "Won't ignite"). */
  topic: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  symptoms: { h: string; p: string }[];
  diagnosis: string;
  faqs: { q: string; a: string }[];
};

export const WEBER_REPAIR_GUIDES: RepairGuide[] = [
  {
    slug: "weber-genesis-wont-ignite",
    model: "Weber Genesis",
    topic: "Won't ignite / no spark",
    title: "Weber Genesis Won't Ignite? Cincinnati Grill Repair",
    metaDescription:
      "Weber Genesis won't ignite or igniter not sparking? We diagnose, repair, and deep-clean in one visit across Cincinnati, NKY & Dayton. Free photo quote.",
    h1: "Weber Genesis Won't Ignite or Igniter Not Sparking? Here's What's Actually Going On",
    intro:
      "If your Weber Genesis won't light and you're standing over it clicking the igniter with nothing happening, you're not alone — it's one of the most common calls we get. The good news: a Genesis is a well-built grill that's almost always worth saving, and the fix is usually cheaper than you'd expect. Below we'll walk you through what's likely wrong, what you can check yourself, and an honest take on repair vs. replace.",
    symptoms: [
      { h: "Igniter clicks but no spark", p: "You hear the clicking but see no spark at the burner — usually a dead igniter battery, a corroded electrode, or a cracked ceramic insulator. On many Genesis models this is a quick, inexpensive igniter or electrode swap." },
      { h: "No click at all when you press the button", p: "A silent button points to a worn-out igniter module, a loose wire, or moisture in the system. The push-button and battery-style igniters on the Genesis are both common, fixable failure points." },
      { h: "It sparks but the burners won't catch", p: "When you get a spark but no flame, the issue is usually gas flow, not ignition — think clogged burner tubes, spiders or grease blocking the ports, or a regulator stuck in bypass (often after the tank ran dry)." },
      { h: "Only one burner lights, the others won't", p: "Blocked burner tubes or a buildup of grease and debris under the flavorizer bars keeps flame from crossing over. This is where a repair and a deep clean go hand in hand." },
      { h: "Weak, uneven, or yellow flames", p: "Rust-flaked burner tubes, clogged ports, or a tripped regulator starve the burners. Left alone, corroded tubes spread and turn a $40 part into a bigger job." },
    ],
    diagnosis:
      "When we come out, we start at the gas and work toward the spark: we confirm the regulator isn't stuck in bypass (a quick reset after a dry tank fixes a surprising number of \"dead\" Genesis grills), then check the igniter battery, electrodes, ceramic insulators, and wiring, and clear out the burner tubes, ports, flavorizer bars, and cooking grates that grease and corrosion love to clog. Most of the time it's a simple igniter or electrode replacement plus clearing blocked tubes — not a new grill. And here's the part most repair outfits skip: we deep-clean the whole grill in the same visit, so you get back a Genesis that lights on the first click and cooks evenly, not just a swapped part on a grimy grill. We'll always give you the honest call — and on a Weber Genesis, repair almost always wins over replace.",
    faqs: [
      { q: "Is my Weber Genesis worth repairing, or should I just replace it?", a: "Almost always worth repairing. Genesis grills are built to last 10-15+ years, and Weber's parts (igniters, burner tubes, flavorizer bars, grates) are widely available and affordable. Replacing a few worn parts and deep-cleaning it costs a fraction of a new grill of the same quality. We'll give you a straight answer if a grill is truly past saving — but on a Genesis, that's rare." },
      { q: "How do I get a quote without you coming out first?", a: "Text us a few photos of your grill — the burners, the igniter button, and the inside with the grates out if you can. We'll send back a free quote covering the repair and the deep clean. No obligation, no pushy sales." },
      { q: "Can you fix the igniter and clean the grill in one trip?", a: "Yes — that's how we work. We come to your home, diagnose and repair the ignition or gas-flow issue, and deep-clean the grates, flavorizer bars, and burner area in the same visit. One stop, and you're grilling again." },
      { q: "Do you carry Weber Genesis parts?", a: "We keep the common wear parts on hand — igniters, electrodes, burner tubes, flavorizer bars, and grates for popular Genesis models. If your grill needs a less common part, we'll source it and let you know the timing up front." },
      { q: "What areas do you serve?", a: "We're a veteran-founded local company covering Greater Cincinnati, Northern Kentucky, and the Dayton, Ohio area. We come to you — driveway, deck, or patio." },
    ],
  },
  {
    slug: "weber-spirit-flavorizer-bar-replacement",
    model: "Weber Spirit",
    topic: "Flavorizer bar replacement",
    title: "Weber Spirit Flavorizer Bar Replacement | Cincinnati",
    metaDescription:
      "Rusted-through flavorizer bars on your Weber Spirit? We repair and deep-clean on-site in Cincinnati, NKY and Dayton. Text us a photo for a free quote.",
    h1: "Weber Spirit Rusted-Through Flavorizer Bar Replacement",
    intro:
      "If you lifted the lid on your Weber Spirit and found a flavorizer bar that's crumbled, flaking, or rusted clean through, you're not imagining it and you're not alone. The good news: a Weber is almost always worth saving, and replacing flavorizer bars is one of the most common, most affordable fixes we do. Below we'll walk you through what's happening, why, and how to decide whether to repair or replace the whole grill.",
    symptoms: [
      { h: "Flare-ups and uneven hot spots", p: "When a flavorizer bar rusts through, drippings fall straight onto the burner tubes instead of vaporizing, causing grease flare-ups and patches that cook hotter than others across your Weber Spirit's grates." },
      { h: "Visible holes, flaking, or orange crumble", p: "Rusted-through flavorizer bars look pitted, flaky, or have actual gaps you can see daylight through. If a bar snaps or sheds rust flakes when you lift it, it's past its service life and needs replacement." },
      { h: "More grease reaching the burner tubes", p: "Once the bars no longer shield the burners, you'll see faster clogging and corrosion on the burner tubes themselves, often turning a simple flavorizer swap into a burner-and-bar job if it's ignored too long." },
      { h: "Rust flakes landing on your food", p: "Orange flakes on the cooking grates or in the bottom tray are a clear sign the flavorizer bars (and sometimes the grates) have started shedding and should be replaced before your next cookout." },
      { h: "Weak smoke and flavor, harder ignition", p: "Flavorizer bars create the smoke that gives gas grilling its flavor. When they're gone, food tastes flatter, and a corroded firebox can also affect the igniter and how reliably the grill lights." },
    ],
    diagnosis:
      "We come to your home, pull the cooking grates and inspect the full firebox, then confirm whether it's just the flavorizer bars or whether the burner tubes, igniter, or regulator need attention too. On most Weber Spirit grills we replace the rusted-through flavorizer bars with the correct-fit parts on-site, check the burner tubes and ignition while we're in there, and then deep-clean the entire grill in the same visit, grates, firebox, and exterior, so you walk back to a grill that both works and looks right. We'll always give you an honest repair-or-replace call: a Spirit with a solid frame and lid is worth fixing, and we'll tell you plainly if it isn't. The fastest way to get an accurate price is to text us a photo of the inside of your grill, and we'll quote the repair plus the clean together.",
    faqs: [
      { q: "Is it worth replacing flavorizer bars on a Weber Spirit, or should I just buy a new grill?", a: "Almost always worth replacing. Weber Spirits have a durable frame and lid, and flavorizer bars are a wear item designed to be swapped. If the body and lid are solid, new bars (and a clean) cost a fraction of a new grill. We'll give you an honest take when we see the photo, including the rare cases where a firebox is too far gone to save." },
      { q: "Do you carry the flavorizer bars, or do I need to order them?", a: "We handle the parts. Tell us your Weber Spirit model or send a photo and we'll bring the correct-fit flavorizer bars, and any burner tubes or igniter parts if the inspection shows they're needed, so it's done in one visit. No ordering and waiting on your end." },
      { q: "Can you replace the burner tubes and igniter at the same time?", a: "Yes. We see a lot of grills where the flavorizer bars rusted through and let grease corrode the burner tubes or foul the igniter. If that's the case, we can repair all of it in the same appointment and deep-clean the grill afterward so everything works and looks like new." },
      { q: "What areas do you serve?", a: "We're veteran-founded and local, serving Greater Cincinnati, Northern Kentucky, and the Dayton, Ohio area. We come to your home, repair the grill, and deep-clean it in the same visit." },
      { q: "How do I get a price?", a: "Text or upload a photo of the inside of your grill, lid up, grates if you can. We'll send back a free quote covering the flavorizer bar replacement plus the deep clean. A photo gets you a far more accurate number than describing it over the phone." },
    ],
  },
  {
    slug: "weber-burner-tube-replacement",
    model: "Weber gas grill",
    topic: "Burner tubes / uneven flame",
    title: "Weber Burner Tube Replacement & Cold Spots | Cincinnati",
    metaDescription:
      "Weber gas grill with uneven flame or cold spots? We replace burner tubes and deep-clean in one visit across Cincinnati, NKY & Dayton. Free photo quote.",
    h1: "Weber Gas Grill: Burner Tube Replacement for Uneven Flame & Cold Spots",
    intro:
      "If half your Weber sears great and the other half barely browns a burger, you're not imagining it — that's almost always a burner tube problem, and it's fixable. The good news: a Weber is built to last, so this is usually a repair worth doing, not a reason to buy a new grill. We come to your home across Greater Cincinnati, Northern Kentucky, and Dayton to diagnose the uneven flame, replace what's worn, and deep-clean the whole grill in the same visit.",
    symptoms: [
      { h: "Uneven flame & cold spots across the grates", p: "One side roars while the other sputters — a classic sign the burner tubes are clogged or corroded. On a Weber gas grill, uneven flame and cold spots usually trace back to the burner tubes, not the grill itself." },
      { h: "Yellow, lazy, or sputtering flames", p: "Healthy Weber flames burn blue and steady. Yellow, floppy, or popping flames point to blocked burner tube ports, rust scale, or sometimes a tired regulator starving the grill of gas." },
      { h: "Rusted-through or pitted burner tubes", p: "Lift the cooking grates and flavorizer bars and look down at the tubes. Flaking metal, holes, or split seams mean the burner tubes are past cleaning and need replacement." },
      { h: "Weak igniter or won't light evenly", p: "If you're hitting the igniter several times or one burner won't catch, a corroded electrode or a clogged tube near the crossover can be the culprit — often an easy fix alongside the tube work." },
      { h: "Grease-soaked flavorizer bars & grates", p: "Caked flavorizer bars and crusted cooking grates throw off heat distribution and feed flare-ups, which makes cold spots feel even worse. These get cleaned or swapped as part of the same job." },
    ],
    diagnosis:
      "When we arrive, we pull the cooking grates and flavorizer bars and inspect the burner tubes directly — checking for clogged ports, rust-through, and how evenly each tube lights from end to end. We confirm the gas is flowing right (a stuck or \"bypassed\" regulator can mimic a burner problem), test the igniter and electrodes, and then either clear and reseat the tubes or replace them with the correct Weber-fit parts for your model. Once the flame is even and blue again, we deep-clean the whole grill in the same visit — grates, flavorizer bars, burner area, and the grease tray — so you leave with a grill that heats evenly and is genuinely clean, not just patched. We'll always give you an honest repair-vs-replace call: on most Webers, replacing burner tubes is well worth it.",
    faqs: [
      { q: "Is it worth replacing the burner tubes, or should I just buy a new Weber?", a: "On most Weber gas grills, replacing the burner tubes is absolutely worth it — the body, lid, and frame are built to outlast the internal parts. We'll give you an honest take after seeing photos: if the firebox is sound, a tube and flavorizer-bar refresh brings it back to like-new for a fraction of a new grill. If it's truly done, we'll tell you that too." },
      { q: "How do I get a quote without waiting for a visit?", a: "Text us a few photos of your grill — the open lid showing the grates, and a shot of the burner tubes underneath if you can lift the grates safely. We'll reply with a free quote covering both the burner tube replacement and the deep clean. No guessing, no surprise pricing on the day." },
      { q: "Do you fix the igniter and flavorizer bars at the same time?", a: "Yes. While we're in there for the burner tubes, we test the igniter and electrodes and inspect the flavorizer bars and cooking grates. If the igniter is weak or the bars are rusted through, we'll handle it in the same visit so you only book once." },
      { q: "Which areas do you serve?", a: "We're a veteran-founded local company covering Greater Cincinnati, all of Northern Kentucky, and the Dayton, Ohio area. We come to your home, do the repair and the deep clean on-site, and you don't have to haul the grill anywhere." },
      { q: "Could the uneven flame just be a clogged tube and not a replacement?", a: "Sometimes, yes. Spiders and debris love to nest in Weber burner tubes and crossover channels, and a thorough cleaning can restore an even flame. We always try the least-invasive fix first and only recommend new burner tubes when the metal is corroded or rusted through." },
    ],
  },
  {
    slug: "weber-cooking-grate-replacement",
    model: "Weber gas grill",
    topic: "Rusted cooking grates",
    title: "Weber Rusted Cooking Grate Repair | Cincinnati & NKY",
    metaDescription:
      "Rusted or flaking Weber cooking grates? We repair and deep-clean Weber gas grills at your home in Cincinnati, NKY & Dayton. Send a photo for a free quote.",
    h1: "Rusted or Flaking Cooking Grates on Your Weber Gas Grill",
    intro:
      "If you lifted the lid this spring and found the cooking grates on your Weber pitted, flaking, or shedding rust onto your food, you're in good company — it's the single most common thing we see on Weber gas grills. The good news: a Weber is almost always worth saving, and most of the time the fix is a straightforward grate swap plus a deep clean, not a new grill.",
    symptoms: [
      { h: "Orange rust or flaking on the cooking grates", p: "Surface rust and flaking are the classic signs your Weber gas grill needs cooking grate replacement. Once the porcelain or chrome coating chips, the metal underneath oxidizes fast — and rust flakes ending up on your food is the point where it's time to act." },
      { h: "Grease catching fire or uneven hot spots", p: "Heavy carbon buildup and crumbling grates trap grease and block heat. If you're seeing flare-ups or one side of the grill cooks hotter than the other, the grates and the flavorizer bars underneath usually need attention together." },
      { h: "Food sticking and grates that feel rough or pitted", p: "When the smooth coating wears off, food grabs onto the bare, pitted metal. A rough, gritty cooking surface is a reliable signal the grates are near the end of their life." },
      { h: "Rust spreading to flavorizer bars or burner tubes", p: "Rust rarely stops at the grates. While we're in there we check the flavorizer bars, burner tubes, the igniter, and the regulator — the parts that fail next on an aging Weber." },
    ],
    diagnosis:
      "When we come out, we pull the cooking grates and inspect the whole cookbox — flavorizer bars, burner tubes, the igniter, and the regulator/hose — so we're not just treating the symptom. If the grates are only carboned up, we can often deep-clean and save them; if the coating has flaked and the metal is pitted through, we replace them with the correct Weber-fit grates for your exact model. Either way, we do it at your home in one visit: repair first, then a full deep clean of the cookbox, lid, and exterior so the grill comes back like new. We'll always give you the honest call on repair vs. replace — on a Weber, repair almost always wins.",
    faqs: [
      { q: "Is it worth replacing the grates, or should I just buy a new grill?", a: "On a Weber, repair almost always wins. Weber builds these grills to last 10-15+ years, and new cooking grates plus a deep clean cost a fraction of a replacement grill. We'll tell you honestly if yours is truly past saving — but that's rare." },
      { q: "Can you replace the grates and clean the grill in the same visit?", a: "Yes. We come to your home in Cincinnati, NKY, or Dayton, install the correct Weber-fit grates, and deep-clean the whole grill — cookbox, flavorizer bars, lid, and exterior — in a single appointment. No hauling, no waiting." },
      { q: "How do I get a price?", a: "Text us a photo of your open grill (grates and the inside of the lid) and we'll send a free quote for the repair plus clean. A photo tells us your model, the grate condition, and whether the flavorizer bars, burner tubes, igniter, or regulator need attention too." },
      { q: "What other parts usually need fixing on an older Weber?", a: "Rust rarely stops at the grates. The flavorizer bars and burner tubes are the next to go, and we also check the igniter and regulator. We inspect all of it during the visit so you don't get a surprise failure a month later." },
      { q: "Do you serve my area?", a: "We're veteran-founded and local — serving Greater Cincinnati, Northern Kentucky, and Dayton, Ohio. We come to you." },
    ],
  },
  {
    slug: "weber-grill-low-flame-regulator",
    model: "Weber gas grill",
    topic: "Low flame / won't get hot",
    title: "Weber Grill Low Flame? Regulator Reset Fix | Cincinnati",
    metaDescription:
      "Weber gas grill stuck on low flame and won't get hot? It's usually the regulator. We diagnose, repair, and deep-clean on-site in Cincinnati, NKY & Dayton. Free photo quote.",
    h1: "Weber Gas Grill Low Flame / Regulator Reset — Grill Won't Get Hot",
    intro:
      "If your Weber lights fine but the flames stay weak and lazy — barely 250-300 degrees with every burner wide open — you're not imagining it, and you didn't break anything. Nine times out of ten this is the regulator's safety mode tripping (sometimes called \"bypass\"), not a dying grill. The good news: a Weber is almost always worth saving, and we can tell you exactly what's going on from a quick photo.",
    symptoms: [
      { h: "Flames stay low no matter the knob setting", p: "You turn every burner to high and the flames stay short, weak, and orange-tinged. This is the classic sign the regulator has gone into its low-flow safety mode and is choking the gas supply to the burner tubes." },
      { h: "The grill won't break 300 degrees", p: "A healthy Weber should cruise past 500-550 degrees with the lid closed. If it stalls out low and never recovers, the regulator reset usually fixes it — but clogged burner tubes can mimic the same low-flame, won't-get-hot symptom." },
      { h: "Uneven flames or yellow flickering across the burner tubes", p: "If some ports flame and others don't, or the flame runs yellow instead of blue, the burner tubes are likely clogged with grease, rust, or spider nests — common in Cincinnati and Dayton after a wet spring sitting on the patio." },
      { h: "It started right after you swapped or reconnected the propane tank", p: "Opening the tank valve too fast trips the regulator's flow limiter. That's the number-one cause of a sudden low-flame Weber, and the regulator reset takes about a minute." },
      { h: "Igniter clicks but lighting is slow or weak", p: "A weak igniter, fouled flavorizer bars, and grease-caked cooking grates all pile onto the problem — the grill feels gutless even once gas flow is restored. These usually get sorted in the same visit." },
    ],
    diagnosis:
      "We start with the simple, free fix first: a proper regulator reset — turn off the burners, disconnect the propane tank, open the lid, then slowly reopen the valve and reconnect so the regulator doesn't trip its safety mode again. If flames come back strong, you're done. If they don't, we inspect the burner tubes for grease and spider nests, check the regulator and hose for damage, test the igniter, and look over the flavorizer bars and cooking grates — because a grill starved of airflow by built-up grease will run low and cool no matter how good the gas flow is. Whatever the cause, we repair it on-site and deep-clean the whole grill in the same visit, so you walk away with a Weber that hits temperature and is genuinely clean — not just patched. We'll always give you an honest repair-or-replace call: on a Weber, a regulator or burner-tube fix is almost always worth it over buying new, and we'll tell you straight if it ever isn't.",
    faqs: [
      { q: "How do I reset the regulator on my Weber gas grill?", a: "Turn all burner knobs to off, then close and disconnect the propane tank. Open the grill lid, reconnect the tank, and open the tank valve slowly — about a quarter turn, then pause, then the rest. Wait a moment, then light the grill normally. Opening the valve slowly is the key; doing it fast is what trips the low-flow safety mode in the first place. If that doesn't restore full flame, the issue is likely clogged burner tubes or the regulator itself, and we can diagnose it from a photo." },
      { q: "Is a low-flame Weber worth repairing or should I just replace it?", a: "Almost always worth repairing. Webers are built to be serviced, and the common culprits — a tripped regulator, clogged burner tubes, a worn regulator/hose, or grease-choked airflow — are straightforward fixes that cost a fraction of a new grill. We'll give you an honest take after seeing it; if it's genuinely not worth saving, we'll tell you." },
      { q: "Why won't my grill get hot even after I reset the regulator?", a: "If the reset didn't bring the heat back, the gas is usually getting through but airflow isn't. Burner tubes packed with grease, rust, or spider nests, fouled flavorizer bars, and grease-caked cooking grates all keep a grill running cool. That's a cleaning-and-repair job, which we handle in one on-site visit." },
      { q: "Do you service Weber grills in Cincinnati, Northern Kentucky, and Dayton?", a: "Yes. We're a veteran-founded, locally-owned grill cleaning and repair company serving Greater Cincinnati, Northern Kentucky, and Dayton, Ohio. We come to your home, fix the grill, and deep-clean it in the same visit." },
      { q: "How do I get a price?", a: "Text us a few photos of your Weber — the full grill, the burner tubes if you can lift the grates, and the regulator/hose where it connects to the tank. We'll send back a free quote covering both the repair and the deep clean. No service-call fee just to get a number." },
    ],
  },
];

export function getRepairGuide(slug: string): RepairGuide | undefined {
  return WEBER_REPAIR_GUIDES.find((g) => g.slug === slug);
}
