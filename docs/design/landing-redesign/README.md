# Handoff: Ben&Co landing page redesign

## Overview
Redesign of the public landing page for benco-website (Next.js 15 / Tailwind / next-intl / Framer Motion, repo `AnelDeveloper/benco-website`). One page that lets a visitor **book an apartment/villa stay**, **buy off-plan or invest** in the Stup residential project, and **book a private car tour** — plus about, contact, footer. The centrepiece is a rebuilt "We invest and build" scroll-pinned scene: an isometric building constructs itself as the visitor scrolls, day turns to night, windows light one by one.

Target: replace `app/[locale]/page.tsx` and the components it composes. Admin panel and detail pages are unchanged.

## About the design files
`Benco Landing v2.dc.html` is a **design reference built in HTML** — a working prototype of look and behaviour, not production code. Recreate it inside the existing codebase (React server/client components, Tailwind classes, next-intl keys, Framer Motion `useScroll`/`useTransform`, Supabase data). `Benco Landing (current).dc.html` is a faithful recreation of today's site, for side-by-side comparison only. Open either file directly in a browser; images live in `public/`.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy and motion are final. Recreate pixel-perfectly using Tailwind (extend the theme with the tokens below).

## New dependencies / data
- Fonts: **Geist** (already in repo via `next/font`) for UI; add **Instrument Serif** (Google Fonts, 400 + italic) for display headings.
- New table `tours` (title_bs/en, blurb, duration_hours, distance_km, price_per_person, currency, cover image, is_published, sort_order) and a `tour` request kind (`requests.kind` gains `'tour'`, with `tour_id`, `tour_date`, `seats`). Admin CRUD mirrors properties.
- `site_stats` unchanged (12 / 18,500 / 34 / 10).

---

## Design tokens

Colors
- ink `#0b1220` (dark section bg), ink-2 `#1a1f2b` (text, dark buttons), ink-3 `#111a2c`
- paper `#f7f4ee` (page bg), paper-2 `#efe9df` (tours bg), paper-3 `#f3efe7` (inputs on light)
- line `#e2dccf`, line-2 `#d9d2c5`, line-3 `#eee8dc`
- gold `#f2b544` (accent on dark, primary CTA on dark), gold-hover `#ffc95c`, gold-deep `#d97706` (primary CTA on light), gold-text-on-light `#b4791b`
- muted `#6b7280`, muted-dark-bg `#a3adc2`, body-2 `#4b5563`
- success `#16a34a` / `#22c55e`, success-bg `#e8f7ee`
- night window `#ffd27a`, side window `#f2b544`

Typography
- Display: Instrument Serif 400, letter-spacing -0.02em; `<em>` inside headings is italic + gold (`#f2b544` on dark, inherits on light).
  - H1 hero: `clamp(46px, 7.2vw, 96px)`, line-height 0.98
  - H2 sections: `clamp(36px, 4.6vw, 60px)`, line-height 1.02
  - Counter numbers: 44px; drawer success title 32px; offer figures 24px; pull-quote 22px italic
- UI: Geist. Body 16–18px / 1.55–1.65. Card title 19px/600. Labels 11–12px, letter-spacing .12–.22em, uppercase, 600. Buttons 14–15px/600. Kicker above headings: 12px, .22em, uppercase, gold-text.

Spacing / radius / shadow
- Container max-width 1240px, padding 24px. Section padding 112px top / 96px bottom (about 112/112).
- Radii: cards 22px, hero booking bar 20px, panels 28px, buttons 10–12px, pills 999px, inputs 12px.
- Shadows: card `0 1px 0 rgba(0,0,0,.04), 0 20px 40px -24px rgba(26,31,43,.25)`; hover `… 0 30px 50px -22px rgba(26,31,43,.4)`; booking bar `0 30px 60px -20px rgba(0,0,0,.5)`; scene `0 40px 80px -30px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.08)`; drawer `-30px 0 60px -30px rgba(0,0,0,.5)`.
- Buttons: height 38–52px; primary-on-light `bg #1a1f2b text #fff hover bg #d97706`; primary-on-dark `bg #f2b544 text #1a1200 hover #ffc95c`; ghost `1px rgba(255,255,255,.25)` border.

---

## Screens / sections (top → bottom)

### 1. Nav (fixed, 72px)
- Transparent over hero; after `scrollY > 40` → `rgba(11,18,32,.82)`, `backdrop-filter: blur(14px)`, bottom border `rgba(255,255,255,.08)`. Transition .4s.
- Left: logo `public/benco-logo.jpg` 40×40, radius 8, then wordmark "BEN&CO" 20px/600, letter-spacing .14em, `&` in gold.
- Center links (14px/500, `rgba(255,255,255,.78)` → `#fff` on hover): Stays, Invest, Car tours, About, Contact. Hidden < 1000px; hamburger (38px round ghost) opens a full-width dark menu (18px links, 14px padding, hairline dividers).
- Right: "EN" pill (ghost, .06em) + "Book" pill (gold, opens stay drawer for the featured apartment).

### 2. Hero (min-height 100vh, content bottom-aligned)
- Background `public/images/properties/Vila sa jezerom 1.avif`, cover, subtle parallax `scale(1 + min(.12, scrollY/6000))`. Overlay `linear-gradient(180deg, rgba(11,18,32,.55) 0%, rgba(11,18,32,.15) 40%, rgba(11,18,32,.85) 100%)`.
- Kicker "Sarajevo · Jahorina · Herzegovina". H1 "Homes to stay in. *Buildings* to believe in." (max-width 14ch, balance). Sub (18px, `rgba(255,255,255,.8)`, max 520px): "Book a villa or apartment, invest in a building while it rises, or let us drive you through Bosnia — all from one place."
- Entrance: `rise` keyframe (opacity 0 → 1, translateY 28 → 0), .8–.9s ease-out, staggered 0/.1/.2/.35s.
- **Booking bar** (white .96, radius 20): tab row (3 equal tabs, 44px, radius 12; active `bg #1a1f2b text #fff`, inactive text `#4b5563`; icons: bed / building / car from Lucide) → fields grid `repeat(auto-fit, minmax(160px,1fr))`, each a `#f3efe7` radius-12 cell with 11px uppercase label + select; last cell is the CTA (62px, `#1a1f2b` → hover `#d97706`, arrow icon).
  - Stay: Where (Sarajevo / Jahorina / Anywhere), Type (Apartment / Villa / Any), Guests (2 / 4 / 6+) → "Check availability" → opens stay drawer.
  - Invest: Project (Stup residential building), I want to (Invest for a return / Buy off-plan), Budget (20–50k / 50–150k / 150k+ BAM) → "See the project" → smooth-scrolls to #invest.
  - Car tour: Route (3 tours), When (This weekend / Next week / Pick a date), Seats (2/4/6) → "Book a tour" → opens tour drawer.

### 3. Trust strip (dark, 36px padding)
Grid `minmax(180px,1fr)`, each item: 1px left border `rgba(255,255,255,.12)`, padding-left 18px; number Instrument Serif 44px white (suffix in gold) + label 13px `#a3adc2`. Values 12 Projects completed · 18,500 m² delivered · 34 Happy investors · 10+ Years of experience. Count-up on first intersection: 1600ms, easeOutExpo `1 - 2^(-10t)`, tabular numerals.

### 4. Stays (`#stays`, paper bg)
- Header row: kicker "Stays & homes", H2 "Places worth *waking up in*"; right: filter pills All / Villas / Apartments (38px, active `#1a1f2b` filled, inactive 1px `#d9d2c5`).
- Grid `repeat(auto-fill, minmax(min(100%,300px),1fr))`, gap 24. Card: white, radius 22, image 4:3 with hover `scale(1.06)` .9s `cubic-bezier(.2,.7,.2,1)`; tag pill top-left (white .92, 11px uppercase: "Villa · Sale", "Villa · Stay", "Apartment · Stay"); body padding 18/20: title 19px/600 + location with pin icon (13px muted); price right-aligned 18px/600 + note 12px ("for sale", "per night", "per night · also for sale"); specs row 13px `#4b5563` with bed/bath/maximize icons ("4 bd · 3 ba · 320 m²"); actions: primary button (rent → "Book stay", sale → "Make an offer") + "Details" outline link to `/properties/[slug]`.
- Data = featured published properties (seed: Lakeside villa 450,000 BAM sale; Villa with pool 450 BAM/night; Dacha apartment 180; Jahorina apartment 220).
- Reveal: cards start `opacity 0; translateY(24px)`, transition .8s ease, triggered by IntersectionObserver threshold .12 (once).

### 5. We invest and build (`#invest`, ink bg) — centrepiece
Header (96px top padding): kicker "We invest and build", H2 "Watch your future home *take shape*", right paragraph "Stup residential building · 24 units · Stup, Sarajevo. Buy an apartment before it's finished at today's price, or fund the build and earn a return. Scroll — the building rises with you."

**Pinned scroll container**: wrapper height `360vh`; inner `position: sticky; top: 0; min-height: 100vh; align-items: center`. Progress `p = clamp(−rect.top / (rect.height − innerHeight), 0, 1)` (Framer: `useScroll({target, offset:['start start','end end']})`). Two columns `minmax(min(100%,340px),1fr)`, gap 32 (16 on narrow), padding 88/24/40.

**Scene** (left; SVG viewBox 640×520; container radius 28, `max-height: calc(100vh − 150px)` desktop / `min(46vh,420px)` narrow, aspect 640/520):
- Sky: vertical gradient interpolated through 3 keyframes by `p` (0 → .5 → 1): top `#8fb9e6 → #3b3766 → #070b18`, bottom `#dcebf7 → #f0925c → #1a2440`. Prop `skyMode: 'night'` forces p=1 for the sky.
- Ground: y 372→520, gradient `#c9cfc0/#aeb5a4 → #6d5a63/#3a2f3e → #0e1424/#070b14`.
- 46 stars (deterministic pseudo-random positions in y<250, r .7–1.6), group opacity `map(p,.62,.95,0,1)`, each twinkles (2–4.8s ease-in-out, staggered).
- Sun: cx `120+60p`, cy `map(p,0,.55,90,380)`, r 22 `#ffd9a0` + r 70 radial glow; opacity `map(p,.35,.55,1,0)`. Moon: cx 520, cy `map(p,.55,.9,260,70)`, r 16 `#eef2ff` with offset sky-colored r 13 disc (crescent); opacity `map(p,.58,.8,0,1)`.
- Skyline parallax: back layer 14 rects, `translateX((.5−p)*30)`, fill `#b9cbe0 → #5a4f7a → #111a2e`; mid layer 11 rects, `translateX((.5−p)*70)`, fill `#96aac4 → #3e355a → #0c1424`.
- Isometric projection: `X = 318 + (x − y)·0.866`, `Y = 318 + (x + y)·0.5 − z`. Footprint W=150 (x), D=110 (y), floor height H=30. Faces: top / left (y=D) / right (x=W) polygons.
- Foundation: box (−8,−8)→(W+8,D+8), z −10→0, fills top `#6b6f77` left `#4d525b` right `#3a3f47`; `t = map(p,.03,.11)`, opacity t, translateY `(1−easeOutCubic(t))·40`.
- Floors (N = 5, tweakable 3–8): floor i starts at `s = .12 + i·(.62/N)`, duration `.85·(.62/N)`; `t` eased with **easeOutBounce**; translateY `−(1−e)·110`, opacity `min(1, 4t)`. Fills (day → night at `0.55·p`): top `#e6dfd2 → #8a8a96`, left `#c9c0b0 → #6a6a76`, right `#9c927f → #44454f`.
  - Windows: 4 on left face (x = 12 + 34k, width 22, z 8→24), 3 on right face (y = 12 + 32k). Each window has a shuffled order `(idx·7+3) mod total`; lights at `at = .76 + order/total·.18` over .015 of p; fill lerps `#2b3341 → #ffd27a` (left) / `#1f2632 → #f2b544` (right).
  - Dust: when `0 < (p − landTime)/.06 < 1`, 9 circles `#d9d2c5` burst from the floor's three visible base corners, r 3→12–18, opacity `(1−dt)·.55`, drifting outward/up.
- Roof: slab inset 4, z N·H → +8, fills `#3a4354/#2a3140/#1c2230`; `t = map(p,.7,.78)`, drops 60px with easeOutCubic. Rooftop sign: gold face `#f2b544` + side `#c98a1c`, text "BEN&CO" 11px/700 `#1a1200`, skewY(30) to sit on the left face.
- Crane: mast at iso(W+70, .35D, 0), 7px wide gold `#f2b544`, 350px tall, rungs every 16px (`#0b1220` .35); jib 290px rotating about mast top, `angle = −6 + 10·sin(11p) + (1−floorT)·4`; counterweight `#c98a1c`; cab `#1a1f2b`; hook cable `#d1d5db` whose length follows the currently-dropping floor; load slab visible while a floor is in flight. Crane rises in over p 0→.1 and fades out `map(p,.8,.9,1,0)`.
- Ground shadow ellipse (336,384, 160×40, black, opacity `.25 + .2·built`); night glow ellipse gold, opacity `map(p,.8,1,0,.14)`.
- Overlays: bottom-left phase pill (`rgba(11,18,32,.6)`, blur 8, 12px, gold dot): "Site prepared" → "Pouring foundation" → "Floor X of N rising" → "Roof & facade" → "Lights coming on" → "Welcome home". Bottom-right hint: "Scroll to build" → "NN%" → "Complete".
- Reduced motion / no JS: render p = 1 (finished, night) statically.

**Panel** (right, gap 20 / 12 compact):
- Progress ring 92px (r 40, stroke 6, track `rgba(255,255,255,.1)`, gold arc, dasharray 251.3, fills to 45% once the section enters view, .3s) + "CONSTRUCTION PROGRESS" label and "Completion expected **June 2027**" (gold).
- Milestone list (5 items from `project_milestones`): grid `28px 1fr auto`, padding 12/14, radius 14. Active index `floor(map(p,.02,.95)·5)`. States: done → green dot `#22c55e` with check; active → gold dot, bg `rgba(242,181,68,.1)`, border `rgba(242,181,68,.45)`, `scale(1.02)`, halo `0 0 0 6px rgba(242,181,68,.18)`, status "In progress"; reached → bg `rgba(255,255,255,.05)`; upcoming → opacity .45, `translateX(10px)`. Transition .5s `cubic-bezier(.2,.7,.2,1)`. Right column: date "Mar 2026" etc. On compact viewports (width < 1000 or height < 760) show only the active milestone.
- Offer cards grid `minmax(150px,1fr)`: **Buy off-plan** — "3,200 BAM / m²", "11 of 24 units still available", gold button "Reserve a unit"; **Invest in the build** — "12% expected return", funding bar 640,000 / 1,800,000 BAM (35.5%, gradient `#d97706→#f2b544`, 1.4s), ghost button "Invest from 20,000 BAM". On compact viewports hidden until p > .78.

### 6. Car tours (`#tours`, paper-2 bg; toggle prop `showTours`)
Kicker "Car tours", H2 "Bosnia, *driven* by locals", sub "Private day trips from Sarajevo with a Ben&Co driver. Pick a route and a date — we handle the rest." Cards `minmax(min(100%,280px),1fr)`, min-height 380, radius 22, full-bleed image + gradient `rgba(11,18,32,0) 30% → rgba(11,18,32,.92)`; content: gold meta "8 h · 60 km", title 24px/600, blurb 14px, price "90 BAM / person" + white "Book tour" button (hover gold). Tours: Jahorina mountain day (8 h, 60 km, 90 BAM), Mostar & Herzegovina (10 h, 260 km, 120 BAM), Sarajevo & Vrelo Bosne (5 h, 35 km, 60 BAM). Images are placeholders — replace with real tour photos.

### 7. About (`#about`)
Two columns, gap 56. Left: `Vila sa jezerom 4.avif` 4:5, radius 24, with floating dark badge (logo 44px, "SINCE 2016", "Gajev Trg 4, Sarajevo") offset left −12 / bottom 28. Right: kicker "About Ben&Co", H2 "We build what we'd *live in* ourselves", paragraph, 4 highlights in a 2-col list with 22px gold check discs, pull-quote with 2px gold left border.

### 8. Contact (`#contact`)
Dark card radius 28, padding `clamp(28px,5vw,56px)`, two columns gap 40. Left: kicker, H2 "Talk to a *person*, not a form", "We answer the same day, Monday to Saturday.", 4 contact rows (38px gold-tint icon tile, label 12px + value 15px): Phone +387 62 266 662 · Email realestatebenco@gmail.com · Office Gajev Trg 4, Sarajevo · Hours Mon – Sat, 09:00 – 17:00. Right: form (inputs 48px, `rgba(11,18,32,.6)` bg, 1px `rgba(255,255,255,.14)` border, focus border gold; Name+Phone row, Email, Message textarea, gold "Send message" 50px) → existing `/api/contact`.

### 9. Footer
Paper bg, top hairline. Logo + wordmark + "Real estate & construction", link row, 3 social squares (36px, outline → dark fill on hover), copyright 12px.

---

## Booking drawer (shared)
Right-side `aside`, width `min(460px,100%)`, white, slides in `translateX(105% → 0)` .45s `cubic-bezier(.2,.7,.2,1)`; backdrop `rgba(11,18,32,.55)` + blur 4. Sticky header: kicker + title + 38px round close.

Kinds and fields:
- **stay** (rent properties, hero Stay CTA, nav Book): item card (72×56 image, title, "Sarajevo · 450 BAM / night"); month calendar (Mo–Su, 38px cells, radius 10; occupied dates struck-through `#c4c9d2`, past disabled; range: endpoints `#1a1f2b`/white with joined corners, in-between `#f3e4c4`); name, email, phone; guests stepper (46px, max = `max_guests`); summary "N nights × price" → total; "Book now"; footnote "Dates lock instantly. No payment online — we confirm by email and settle on arrival." → POST `/api/bookings`, 409 refreshes availability.
- **offer** (sale properties): amount input "Your offer (BAM)", summary "Listed price", "Send offer" → `/api/requests` kind `purchase`.
- **offplan**: "Apartment size (m²)" (default 55), note "3,200 BAM / m² · 11 units available from 42 to 96 m²", summary "Estimated price" = m² × 3,200, "Reserve a unit" → kind `offplan`.
- **invest**: "Investment amount (BAM)" (default 20,000), note "Minimum 20,000 BAM · 12% expected return · paid out on handover", summary "Expected return (12%)", "Send investment request" → kind `investment`.
- **tour**: item card ("8 h · 60 km · 90 BAM / person"), single-date calendar, seats stepper (max 6), summary "seats × price", "Book tour", footnote "Private car, up to 6 seats. Free cancellation until 24 h before." → new kind `tour`.
- Success state: 64px green disc with check, title ("Booking confirmed" / "Tour booked" / "Request sent"), body copy, "Done".
- Validation: stay needs ≥1 night; tour needs a date; existing server guards apply (max 30 nights, 365 days ahead, rate limits).

## State
`scrollY`, `p` (scene progress), `narrow` (<1000px), `vh`, `countT`, `fundIn`, `heroTab`, `filter`, drawer `{open, kind, item, from, to, guests, amount, month, done}`, `menuOpen`. Data: featured properties, featured under-construction project + milestones, site stats, published tours, availability per property.

## Tweakable props (prototype)
`floors` 3–8 (default 5), `skyMode` `day-to-night | night`, `showTours` boolean.

## Assets (all from the repo `public/`)
`benco-logo.jpg`; `images/properties/Vila sa jezerom 1.avif` (hero), `Vila sa jezerom 4.avif` (about), `Villa sa bazenom 1.avif`, `Apartman Dacha 1.jpeg`, `Jahorina apartman1.avif` (cards); tour placeholders `Jahorina apartman 2.avif`, `Vila sa jezerom 2.avif`, `Villa sa bazenom 2.avif`. Icons: Lucide (bed-double, building-2, car, map-pin, bath, maximize, check, hard-hat, phone, mail, clock, menu, x, chevron-left/right, arrow-right, facebook, instagram, linkedin).

## Files in this bundle
- `Benco Landing v2.dc.html` — the redesign (reference implementation of every behaviour above, incl. the isometric scene math in its logic class).
- `Benco Landing (current).dc.html` — recreation of the current site for comparison.
- `public/` — logos and property images used by both files.
- `support.js` — runtime required to open the `.dc.html` files locally.
