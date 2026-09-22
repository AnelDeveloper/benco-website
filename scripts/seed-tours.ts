/**
 * Seeds the three car tours from the design handoff.
 *
 * Idempotent: rows are matched by slug and replaced. Cover images are existing
 * property photos used as placeholders — replace them with real tour photos in
 * the admin panel.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database, TourRow } from '../lib/supabase/types';

async function ensureWebSocket() {
  if (typeof globalThis.WebSocket === 'undefined') {
    const ws = await import('ws');
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = ws.default ?? ws.WebSocket;
  }
}

const tours: Partial<TourRow>[] = [
  {
    slug: 'jahorina-mountain-day',
    title_bs: 'Jahorina — dan na planini',
    title_en: 'Jahorina mountain day',
    blurb_bs: 'Skijanje zimi, planinarenje ljeti — preuzimanje u Sarajevu, ručak na planini.',
    blurb_en: 'Ski in winter, hike in summer — pickup in Sarajevo, lunch on the mountain.',
    duration_hours: 8,
    distance_km: 60,
    price_per_person: 90,
    currency: 'BAM',
    cover_url: '/images/properties/Jahorina apartman 2.avif',
    max_seats: 6,
    is_published: true,
    sort_order: 1,
  },
  {
    slug: 'mostar-herzegovina',
    title_bs: 'Mostar i Hercegovina',
    title_en: 'Mostar & Herzegovina',
    blurb_bs: 'Stari most, Blagajska tekija i vodopadi Kravice, sa vozačem koji zna sporedne puteve.',
    blurb_en: 'Old Bridge, Blagaj tekija and Kravice falls, with a driver who knows the back roads.',
    duration_hours: 10,
    distance_km: 260,
    price_per_person: 120,
    currency: 'BAM',
    cover_url: '/images/properties/Vila sa jezerom 2.avif',
    max_seats: 6,
    is_published: true,
    sort_order: 2,
  },
  {
    slug: 'sarajevo-vrelo-bosne',
    title_bs: 'Sarajevo i Vrelo Bosne',
    title_en: 'Sarajevo & Vrelo Bosne',
    blurb_bs: 'Baščaršija, Tunel spasa i izvor rijeke Bosne.',
    blurb_en: 'Baščaršija, the Tunnel of Hope and the springs of the Bosna river.',
    duration_hours: 5,
    distance_km: 35,
    price_per_person: 60,
    currency: 'BAM',
    cover_url: '/images/properties/Villa sa bazenom 2.avif',
    max_seats: 6,
    is_published: true,
    sort_order: 3,
  },
];

async function main() {
  await ensureWebSocket();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');

  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await db.from('tours').delete().in('slug', tours.map((t) => t.slug!));

  const { error } = await db.from('tours').insert(tours);
  if (error) throw new Error(`Failed to insert tours: ${error.message}`);

  for (const tour of tours) console.log(`  ${tour.slug} (${tour.duration_hours} h · ${tour.distance_km} km)`);
  console.log('Tours seeded.');
}

main().catch((error) => { console.error(error); process.exit(1); });
