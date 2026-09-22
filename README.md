# Ben&Co - Real Estate & Construction Company Website

Modern, SEO-optimized website for Ben&Co real estate and construction company in Sarajevo.

## Features

- 🔐 **Admin panel** - Manage properties, projects and photos at `/admin`
- 📅 **Instant booking** - Guests book apartments; dates lock immediately
- 🏗️ **Investment projects** - Buy off-plan or invest, with construction progress
- ✨ **Scroll animation** - A building that constructs itself as visitors scroll
- 🌍 **Bilingual Support** - Bosnian and English
- 🎨 **Modern Design** - Professional real estate design with smooth animations
- 📱 **Fully Responsive** - Works perfectly on all devices
- ⚡ **High Performance** - Built with Next.js 15 for optimal speed
- 🔍 **SEO Optimized** - Complete metadata, sitemap, and structured data
- 🖼️ **Image Optimization** - Automatic image optimization with Next.js Image
- 🎯 **User Experience** - Smooth scrolling, hover effects, and intuitive navigation

## Technologies

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **i18n:** next-intl
- **Icons:** Lucide React
- **Animations:** Framer Motion

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in the Supabase keys.
   See `supabase/README.md` for creating the project and applying the schema.

3. Seed the starting data (once):
```bash
npm run seed
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000). The admin panel is at
   [/admin](http://localhost:3000/admin).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Run the test suite |
| `npm run seed` | Load the starting properties and example project |

## How it fits together

- **Public pages** read published rows through the anon key, which row-level
  security limits to reading published data and nothing else.
- **Every write** runs server-side with the service-role key, after the admin
  session has been verified. That key never reaches the browser.
- **Double booking is impossible**: a Postgres exclusion constraint refuses
  overlapping stays, so two people clicking at the same moment cannot both win.
- **Docs**: design spec and phase plans live in `docs/superpowers/`.

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── [locale]/          # Localized pages
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── Properties.tsx
│   ├── About.tsx
│   ├── Contact.tsx
│   └── Footer.tsx
├── i18n/                  # Internationalization
│   ├── routing.ts
│   └── request.ts
├── messages/              # Translation files
│   ├── bs.json
│   └── en.json
└── public/
    ├── images/            # Property images
    └── logo.svg
```

## SEO Features

- ✅ Sitemap generation
- ✅ Robots.txt
- ✅ Open Graph images
- ✅ Structured metadata
- ✅ Responsive images with AVIF/WebP
- ✅ Semantic HTML
- ✅ Optimized performance

## Contact

**Ben&Co Real Estate & Construction Company**
- 📞 +387 62 266 662
- 📧 realestatebenco@gmail.com
- 📍 Gajev Trg 4, Sarajevo
- 🕒 Mon - Sat: 09:00 - 17:00

## License

© 2026 Ben&Co. All rights reserved.
