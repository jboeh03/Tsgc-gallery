# Tri-State Grill Cleaning — Design System

The single reference for how this product looks, feels, and reads. If you (or an
agent, or a future helper) are building UI or writing customer-facing copy, this
is the source of truth. It codifies what's already in `tailwind.config.ts`,
`app/globals.css`, and the components we ship — so nothing drifts off-brand.

> **Influences:** token-driven + composition (shadcn/ui), shared-language patterns
> (GitHub Primer), and the "hierarchy through weight & color, not size; restraint
> over decoration" school (Refactoring UI). Adapted to a veteran-founded, local,
> trustworthy home-service brand.

---

## 0. First principles

1. **Tokens are the source of truth — never hardcode.** Use the named Tailwind
   colors/fonts below, never raw hex (`#8B1F2F`) or arbitrary values. If a value
   isn't a token, it probably shouldn't exist.
2. **Restraint beats decoration.** One accent (burgundy), one anchor (navy), a
   warm neutral field (bone). White space and type weight carry the design — not
   borders, gradients, or shadows. When unsure, remove.
3. **Hierarchy through weight & color, not font size.** A label is small + muted;
   a value is `font-medium text-navy`. Reach for `text-muted`/`text-ink/70`
   before another heading size.
4. **Trust is the brand.** Calm, legible, honest. No dark patterns, no fake
   urgency, no clutter. The customer should feel a real local pro is behind this.
5. **Fail soft, show state.** Every surface has an empty state, a loading state,
   and an error state. Never a blank screen or a silent failure.
6. **Match the neighbors.** New UI should be indistinguishable in style from the
   nearest existing component. Copy the pattern before inventing one.

---

## 1. Brand voice & personality

The product *and* every AI-generated message share one voice. **The agents
(comms drafts, follow-ups, social/blog copy) must follow this section.**

- **Who we are:** Jeff — a veteran-founded, locally-owned grill cleaner. A real
  person, not a franchise or a chatbot.
- **Tone:** warm, direct, confident, zero corporate fluff. First person ("I",
  "we"). Like a trades pro giving an honest answer to a neighbor.
- **Do:** be concrete (name the grill, the neighborhood, what we cleaned); keep
  it short; one soft CTA; honest about what we can/can't do.
- **Don't:** ALL CAPS, emoji spray, "ACT NOW," fake scarcity, jargon, exclamation
  pile-ups, or anything that reads automated.
- **Microcopy in the UI** follows the same rules: plain, human, brief. "Quote
  request sent! We'll follow up within 24 hours." not "Submission successful."

---

## 2. Color tokens

Defined in `tailwind.config.ts`. **Use the names, never the hex.**

| Token | Hex | Meaning & usage |
|---|---|---|
| `navy` (DEFAULT/800) | `#1A3055` | Primary anchor. Headings, nav, dark sections, primary text on light. |
| `navy-900` | `#102140` | Deepest — gradients, the grill body. |
| `navy-700` | `#2C4A6E` | Hover for navy surfaces, secondary dark. |
| `navy-600` | `#3D6390` | Tertiary / chart accent. |
| `burgundy` (DEFAULT/500) | `#8B1F2F` | **The one accent.** Primary CTAs, active states, key emphasis, "before" pill. |
| `burgundy-700` | `#6E1825` | Burgundy hover (dark). |
| `burgundy-400` | `#A82B3D` | Burgundy hover (light), links-on-dark. |
| `bone` | `#F7F3EE` | Warm page background + light text on navy/burgundy. Our "white." |
| `ink` | `#3D3D3A` | Default body text (softer than black). |
| `muted` | `#6E6E68` | Secondary text, labels, captions, placeholders. |
| `border` | `#E5E0D8` | All hairlines, dividers, card edges. |

**Rules of thumb**
- Backgrounds: `bone` (page), `white` (cards), `navy`/`burgundy` (feature bands).
- Text on light: `text-navy` (headings) → `text-ink` (body) → `text-ink/70`
  (secondary) → `text-muted` (labels). On dark: `text-bone` → `text-bone/80` → `text-bone/55`.
- **Burgundy is a spice, not a sauce** — small, deliberate hits (one CTA, one
  active tab). Two burgundy elements competing = wrong.
- Status semantics (chips): new → `burgundy`; scheduled → `blue-100/blue-700`;
  completed/paid → `emerald-100/emerald-700`; lost/dead → `muted`. (See
  `app/admin/(dashboard)/leads/page.tsx` `StatusChip`.)
- Functional-only exceptions to the palette: `emerald` (success/health-OK),
  `red`/`red-600` (destructive/error), `amber` (promo highlight). Nothing else.

---

## 3. Typography

Two families (`tailwind.config.ts` `fontFamily`):
- **`font-display`** = **Oswald** — condensed, confident. Headings, KPI values,
  hero lines, section titles. Never for body or long text.
- **`font-sans`** = **Inter** — everything else: body, labels, UI, forms.

**Patterns (use these, don't reinvent a scale):**
- Page/section H1: `font-display text-3xl md:text-5xl text-navy`
- Card/section H2: `font-display text-base md:text-xl text-navy`
- Eyebrow/label: `text-[11px] uppercase tracking-widest text-muted font-semibold`
- Body: `text-sm` (admin) / `text-base` (marketing site), `text-ink`/`text-ink/80`
- Numbers/data: `tabular-nums` so columns align.

Hierarchy = weight + color first. Don't add a heading size to make something
stand out when `font-medium text-navy` does the job.

---

## 4. Space, radius, elevation

- **Spacing:** Tailwind 4px scale. Section padding `p-5`/`p-6`; page gutters
  `px-5`; vertical rhythm `space-y-4`/`space-y-6`. Be generous and consistent —
  white space is the design.
- **Radius:** `rounded-md` (inputs, buttons, chips), `rounded-xl` (cards/panels),
  `rounded-full` (status dots, pills, avatars). One step up for containers vs.
  their contents.
- **Borders over shadows.** Default card = `border border-border bg-white`. Use
  `shadow-sm` sparingly for lift; reserve big shadows for the marketing site.
  `shadow-knob`/`shadow-lid` are special — only the grill hero animations.
- **Elevation order:** flat (bone page) → bordered card (white) → hover
  (`hover:bg-bone/40` for rows, `hover:shadow-md` for cards). No nested shadows.

---

## 5. Layout

- **Admin shell:** fixed `Sidebar` (navy) + `Header` (white, `border-b`) +
  content in `p-6`, content width capped (`max-w-3xl`/`max-w-4xl`) so lines stay
  readable. Pages are async server components that fetch + render.
- **Marketing site:** `Nav` + `Footer` (`app/(site)/layout.tsx`), centered
  `max-w-5xl`/`max-w-6xl` containers, alternating `bone`/`white`/`navy` bands.
- Responsive: design mobile-first; grids collapse to one column
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).

---

## 6. Components & canonical recipes

Reuse these — they're the established vocabulary (`components/admin/*`).

- **Button — primary:** `rounded-md bg-burgundy text-bone px-4 py-2 text-xs
  uppercase tracking-wider hover:bg-burgundy/90 disabled:opacity-40`. One primary
  per view.
- **Button — secondary:** `rounded-md border border-navy text-navy ... hover:bg-navy hover:text-bone`.
- **Card / panel:** `rounded-xl border border-border bg-white p-5`.
- **Header:** `components/admin/Header.tsx` — page title (`font-display text-navy`)
  + right-aligned controls. Always present on an admin page.
- **EmptyState:** `components/admin/EmptyState.tsx` — title + body + optional CTA.
  Use it for "no data," "not configured," and error states.
- **KpiCard:** label (muted, uppercase) over a `font-display` value.
- **Tables:** header row `text-xs uppercase tracking-wider text-muted bg-bone/40`;
  body `divide-y divide-border`, rows `hover:bg-bone/40`, `tabular-nums` for numbers.
- **Status chip:** `rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase
  tracking-wider` + the semantic color (see §2).
- **Forms:** label = eyebrow style; input = `rounded-md border border-border
  bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none`. Required
  fields marked with `*`. Submit buttons show a state machine
  (idle → "Sending…" → success/error), never a dead click.
- **Approval surfaces (the agent/HQ pattern):** agent + AI output lands as a
  **draft** in the inbox or an **item** in Suggestions — labeled, with
  Approve/Send + Dismiss. Nothing acts without a human tap. New automated output
  should plug into these, not invent a new surface.

When a variant is genuinely needed, branch by intent, not by stacking boolean
props — keep the component composable.

---

## 7. Motion

- **CSS-only** (keyframes in `app/globals.css`), no animation libraries in the
  product UI. Subtle and purposeful (lid-lift, steam, pin-bob, hover transitions).
- **Always respect `prefers-reduced-motion`** — disable non-essential motion.
- Transitions: `transition` + ~150–300ms. Motion should clarify, never decorate.

---

## 8. Accessibility (non-negotiable)

- Color is never the only signal (pair with text/icon).
- Contrast: body text ≥ 4.5:1 (our ink/navy on bone pass; check any new pairing).
- Every interactive element is keyboard-reachable with a visible focus ring
  (`focus:outline-none focus-visible:ring-2`), and has an accessible name
  (`aria-label` on icon-only buttons).
- Forms: real `<label>`s tied to inputs; errors announced, not just colored.
- Images: meaningful `alt`; decorative ones `aria-hidden`.
- Server-render content + provide a non-JS fallback where feasible (the
  this-week map already does this).

---

## 9. Code conventions (so the design holds up)

From `CLAUDE.md`, enforced:
- **Server components by default.** `"use client"` only for real interactivity.
- **Token-only styling.** Named colors/fonts, no hex, no arbitrary one-offs.
- **Path alias `@/*`.** Import from `@/components`, `@/lib`.
- **Fail-soft.** Features degrade to an empty/"not configured" state when a key
  or service is missing — never throw at import or render a blank.
- **Surgical changes.** Match the surrounding style; don't refactor adjacent code.

---

## 10. How the agents use this doc

- **Content agents** (comms follow-ups, review requests, social/blog, Radar
  replies) draw their **voice & tone from §1** — that's why this doc lives in the
  repo, not just in someone's head. When tuning an agent prompt, point it here.
- **Agents never change UI or code.** They produce drafts/suggestions a human
  approves (§6). This doc governs *people building UI*, and *the words agents
  write*. It does not grant agents design authority.

---

*Keep this current.* When a new pattern proves itself, add it here so it becomes
the standard — that's how the system stays coherent as the HQ grows.

Sources / inspiration: [shadcn/ui](https://ui.shadcn.com/docs) · [shadcn + Tailwind v4 guidelines](https://ctxs.ai/weekly/shadcn-ui-tailwind-v4-7z8p3v) · [GitHub Primer](https://primer.style) · [design-systems notes](https://gist.github.com/0xdevalias/a1d35e8bd48560dfdc863055cac98236) · the Refactoring UI principles (hierarchy by weight/color, limited palette, restraint).
