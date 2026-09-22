/**
 * Seeds the database with the properties that were previously hardcoded in
 * components/Properties.tsx, plus one example construction project.
 *
 * Idempotent: deletes rows with the same slugs first, so it can be re-run.
 * Run with: npm run seed
 *
 * This builds its own Supabase client rather than importing createAdminClient,
 * because lib/supabase/admin.ts starts with `import 'server-only'` — a package
 * that deliberately throws outside the React Server Component environment.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database, ProjectMilestoneRow, ProjectRow, PropertyRow } from '../lib/supabase/types';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Seed rows are partial: every column not listed takes its database default. */
type SeedProperty = Partial<PropertyRow> & { slug: string; title_bs: string; images: string[] };

const properties: SeedProperty[] = [
  {
    slug: 'vila-sa-jezerom',
    title_bs: 'Vila sa jezerom',
    title_en: 'Lakeside villa',
    description_bs: 'Luksuzna vila sa pogledom na jezero, u mirnom okruženju nadomak Sarajeva.',
    description_en: 'Luxury villa overlooking the lake, in quiet surroundings near Sarajevo.',
    property_type: 'villa',
    listing_mode: 'sale',
    location: 'Sarajevo',
    price: 450000,
    currency: 'BAM',
    area_m2: 320,
    bedrooms: 4,
    bathrooms: 3,
    features: ['jezero', 'garaža', 'vrt', 'terasa'],
    is_published: true,
    is_featured: true,
    sort_order: 1,
    images: [
      'Vila sa jezerom 1.avif',
      'Vila sa jezerom 2.avif',
      'Vila sa jezerom 3.avif',
      'Vila sa jezerom 4.avif',
    ],
  },
  {
    slug: 'vila-sa-bazenom',
    title_bs: 'Vila sa bazenom',
    title_en: 'Villa with pool',
    description_bs: 'Moderna vila sa vlastitim bazenom i prostranim dvorištem.',
    description_en: 'Modern villa with a private pool and a spacious yard.',
    property_type: 'villa',
    listing_mode: 'both',
    location: 'Sarajevo',
    price: 520000,
    price_per_night: 450,
    currency: 'BAM',
    area_m2: 380,
    bedrooms: 5,
    bathrooms: 4,
    max_guests: 10,
    features: ['bazen', 'garaža', 'vrt', 'roštilj'],
    is_published: true,
    is_featured: true,
    sort_order: 2,
    images: [
      'Villa sa bazenom 1.avif',
      'Villa sa bazenom 2.avif',
      'Villa sa bazenom 3.avif',
      'Vila sa bazenom 4.avif',
    ],
  },
  {
    slug: 'apartman-dacha',
    title_bs: 'Apartman Dacha',
    title_en: 'Dacha apartment',
    description_bs: 'Ugodan apartman u srcu Sarajeva, idealan za kraći boravak.',
    description_en: 'A comfortable apartment in the heart of Sarajevo, ideal for short stays.',
    property_type: 'apartment',
    listing_mode: 'rent',
    location: 'Sarajevo',
    price_per_night: 180,
    currency: 'BAM',
    area_m2: 65,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    features: ['wifi', 'parking', 'klima'],
    is_published: true,
    is_featured: true,
    sort_order: 3,
    images: ['Apartman Dacha 1.jpeg', 'Apartman Dacha 2.avif'],
  },
  {
    slug: 'apartman-jahorina',
    title_bs: 'Apartman Jahorina',
    title_en: 'Jahorina apartment',
    description_bs: 'Planinski apartman na Jahorini, nekoliko minuta od ski staza.',
    description_en: 'Mountain apartment on Jahorina, minutes from the ski slopes.',
    property_type: 'apartment',
    listing_mode: 'rent',
    location: 'Jahorina',
    price_per_night: 220,
    currency: 'BAM',
    area_m2: 58,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 5,
    features: ['ski', 'parking', 'kamin'],
    is_published: true,
    is_featured: true,
    sort_order: 4,
    images: ['Jahorina apartman1.avif', 'Jahorina apartman 2.avif'],
  },
];

const project: Partial<ProjectRow> = {
  slug: 'stambeni-objekat-stup',
  title_bs: 'Stambeni objekat Stup',
  title_en: 'Stup residential building',
  description_bs: 'Stambeni objekat sa 24 stana, u izgradnji. Mogućnost kupovine u izgradnji ili ulaganja u projekat.',
  description_en: 'A 24-unit residential building under construction. Buy off-plan or invest in the project.',
  location: 'Stup, Sarajevo',
  status: 'under_construction',
  progress_percent: 45,
  start_date: '2026-03-01',
  expected_completion: '2027-06-30',
  total_units: 24,
  available_units: 11,
  price_per_m2: 3200,
  currency: 'BAM',
  min_investment: 20000,
  expected_return_percent: 12,
  funding_goal: 1800000,
  funded_amount: 640000,
  offers_offplan: true,
  offers_investment: true,
  is_published: true,
  sort_order: 1,
};

const milestones: Partial<ProjectMilestoneRow>[] = [
  { title_bs: 'Zemljište i dozvole', title_en: 'Land and permits', target_date: '2026-03-01', is_done: true, sort_order: 1 },
  { title_bs: 'Temelji', title_en: 'Foundation', target_date: '2026-05-15', is_done: true, sort_order: 2 },
  { title_bs: 'Konstrukcija', title_en: 'Structure', target_date: '2026-10-01', is_done: false, sort_order: 3 },
  { title_bs: 'Fasada i stolarija', title_en: 'Facade and windows', target_date: '2027-02-01', is_done: false, sort_order: 4 },
  { title_bs: 'Unutrašnji radovi i primopredaja', title_en: 'Interior and handover', target_date: '2027-06-30', is_done: false, sort_order: 5 },
];

async function main() {
  const db = serviceClient();

  const propertySlugs = properties.map((p) => p.slug);
  await db.from('properties').delete().in('slug', propertySlugs);
  await db.from('projects').delete().eq('slug', project.slug!);

  for (const { images, ...fields } of properties) {
    const { data, error } = await db.from('properties').insert(fields).select('id').single();
    if (error || !data) throw new Error(`Failed to insert ${fields.slug}: ${error?.message}`);

    const imageRows = images.map((file, index) => ({
      property_id: data.id,
      url: `/images/properties/${file}`,
      alt_bs: fields.title_bs,
      alt_en: fields.title_en,
      sort_order: index + 1,
    }));

    const { error: imageError } = await db.from('property_images').insert(imageRows);
    if (imageError) throw new Error(`Failed to insert images for ${fields.slug}: ${imageError.message}`);

    console.log(`  ${fields.slug} (${images.length} images)`);
  }

  const { data: projectRow, error: projectError } = await db
    .from('projects').insert(project).select('id').single();
  if (projectError || !projectRow) throw new Error(`Failed to insert project: ${projectError?.message}`);

  const { error: milestoneError } = await db
    .from('project_milestones')
    .insert(milestones.map((m) => ({ ...m, project_id: projectRow.id })));
  if (milestoneError) throw new Error(`Failed to insert milestones: ${milestoneError.message}`);

  console.log(`  ${project.slug} (${milestones.length} milestones)`);

  const { error: statsError } = await db.from('site_stats').upsert({
    id: true,
    projects_completed: 12,
    sqm_delivered: 18500,
    investors_count: 34,
    years_experience: 10,
  });
  if (statsError) throw new Error(`Failed to upsert site stats: ${statsError.message}`);

  console.log('Seed complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
