import { MetadataRoute } from 'next';
import { createAnonClient } from '@/lib/supabase/anon';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://benco.ba';
const LOCALES = ['bs', 'en'] as const;

function urlFor(locale: string, path: string) {
  return `${BASE_URL}${locale === 'bs' ? '' : `/${locale}`}${path}`;
}

function entry(path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly') {
  return LOCALES.map((locale) => ({
    url: urlFor(locale, path),
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: {
        bs: urlFor('bs', path),
        en: urlFor('en', path),
      },
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = [
    ...entry('', 1, 'weekly'),
    ...entry('/properties', 0.9, 'daily'),
    ...entry('/invest', 0.9, 'weekly'),
  ];

  // Published listings are part of the sitemap; a missing Supabase config must
  // still produce a valid sitemap rather than failing the build.
  const supabase = createAnonClient();
  if (!supabase) return staticEntries;

  const [properties, projects] = await Promise.all([
    supabase.from('properties').select('slug').eq('is_published', true),
    supabase.from('projects').select('slug').eq('is_published', true),
  ]);

  const dynamicEntries = [
    ...(properties.data ?? []).flatMap((row) => entry(`/properties/${row.slug}`, 0.8, 'weekly')),
    ...(projects.data ?? []).flatMap((row) => entry(`/invest/${row.slug}`, 0.8, 'weekly')),
  ];

  return [...staticEntries, ...dynamicEntries];
}
