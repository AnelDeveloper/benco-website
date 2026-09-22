# Ben&Co Phase 5: Landing Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild the public landing page to the v2 design, keeping every section driven by Supabase, and add car tours as a real managed feature.

**Spec:** `docs/design/landing-redesign/README.md` — the designer's handoff, treated as the specification. `Benco Landing v2.dc.html` is the reference prototype; its logic class holds the working isometric and easing math to port.

**Architecture:** A new design-token layer in Tailwind plus the Instrument Serif display face. Landing sections become server components reading Supabase, with client components only where motion or interaction demands it. One shared booking drawer serves all five request kinds.

## Global Constraints

- **The new design applies to the public landing page only.** `/admin` keeps its current look; the tours admin screen is built in the *existing* admin style.
- **Nothing gets hardcoded back.** Properties, the project, milestones, stats and tours all come from the database. A mockup value is a default, not a literal.
- **The invest section stays** — "Watch your future home take shape" is rebuilt, not removed.
- Property and project detail pages are unchanged; only the landing page and the new tours feature change.
- Reduced motion and no-JavaScript render the finished scene statically (`p = 1`, night).
- All copy goes through next-intl with matching `bs`/`en` key sets.
- Tokens are added to `tailwind.config.ts` rather than sprinkled as arbitrary values.

## Phases

### A. Design foundation
Tailwind tokens (ink/paper/gold/line scales, radii, shadows), Instrument Serif via `next/font`, base typography, the `Display` heading component with gold italic `<em>`, redesigned Nav (transparent → blurred ink on scroll, mobile sheet) and Footer.

### B. Hero, trust strip, stays
Hero with parallax background and staggered entrance; the 3-tab booking bar (stay / invest / tour); trust strip with count-up; the Stays grid with filter pills reading featured properties, cards opening the drawer.

### C. Booking drawer
One right-side drawer, five kinds — stay, offer, offplan, invest, tour. Month calendar with occupied dates struck through and range selection; guest/seat steppers; live totals; success state. Posts to the existing `/api/bookings` and `/api/requests`, including 409 handling.

### D. The isometric build scene
Port the prototype's math: `iso()` projection, `box()` faces, `easeOutBounce` floor landings, `lerp3` day→night interpolation. Sky gradient through three keyframes, 46 twinkling stars, sun setting and moon rising, two parallax skyline layers, dust bursts on landing, crane with rotating jib and follow-the-floor hook, windows lighting in shuffled order, phase pill and progress hint. Panel with progress ring, milestone list and the two offer cards.

### E. Car tours
`tours` table + RLS, `requests.kind` gains `'tour'` with `tour_id`, `tour_date`, `seats`; admin CRUD in the existing admin style; the landing section; the tour drawer kind; emails.

### F. About, contact, polish
About with floating badge and pull-quote; contact card wired to `/api/contact`; responsive passes at 390 / 768 / 1280; reduced-motion and no-JS checks; full verification.

## Done when

- The landing page matches the v2 reference at the specified breakpoints.
- Every section still reads from Supabase; adding a property or tour in `/admin` changes the page.
- A stay, an offer, an off-plan reservation, an investment request and a tour booking can all be completed from the landing page.
- `npm test`, `npx tsc --noEmit` and `npm run build` are green, and no secret reaches the browser.
