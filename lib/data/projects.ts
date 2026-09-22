import { localized, type Locale } from '@/lib/localized';
import { createAnonClient } from '@/lib/supabase/anon';
import type { ProjectStatus } from '@/lib/supabase/types';

export type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  status: ProjectStatus;
  progressPercent: number;
  expectedCompletion: string | null;
  totalUnits: number | null;
  availableUnits: number | null;
  pricePerM2: number | null;
  minInvestment: number | null;
  expectedReturnPercent: number | null;
  fundingGoal: number | null;
  fundedAmount: number;
  offersOffplan: boolean;
  offersInvestment: boolean;
  currency: string;
  coverImage: string | null;
};

export type Milestone = {
  id: string;
  title: string;
  description: string;
  targetDate: string | null;
  isDone: boolean;
};

export type ProjectDetail = ProjectCard & {
  images: { url: string; alt: string }[];
  milestones: Milestone[];
  startDate: string | null;
};

const PROJECT_COLUMNS = `
  id, slug, title_bs, title_en, description_bs, description_en, location, status,
  progress_percent, start_date, expected_completion, total_units, available_units,
  price_per_m2, currency, min_investment, expected_return_percent,
  funding_goal, funded_amount, offers_offplan, offers_investment,
  project_images (url, alt_bs, alt_en, sort_order)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCard(row: any, locale: Locale): ProjectCard {
  const images = [...(row.project_images ?? [])].sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
  );

  return {
    id: row.id,
    slug: row.slug,
    title: localized(row, 'title', locale),
    description: localized(row, 'description', locale),
    location: row.location,
    status: row.status,
    progressPercent: row.progress_percent,
    expectedCompletion: row.expected_completion,
    totalUnits: row.total_units,
    availableUnits: row.available_units,
    pricePerM2: row.price_per_m2,
    minInvestment: row.min_investment,
    expectedReturnPercent: row.expected_return_percent,
    fundingGoal: row.funding_goal,
    fundedAmount: row.funded_amount ?? 0,
    offersOffplan: row.offers_offplan,
    offersInvestment: row.offers_investment,
    currency: row.currency,
    coverImage: images[0]?.url ?? null,
  };
}

export async function getPublishedProjects(
  locale: Locale,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<ProjectCard[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    if (error) console.error('getPublishedProjects failed:', error);
    return [];
  }
  return data.map((row: unknown) => toCard(row, locale));
}

export async function getProjectBySlug(
  slug: string,
  locale: Locale,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<ProjectDetail | null> {
  if (!client) return null;

  const { data, error } = await client
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;

  const { data: milestoneRows } = await client
    .from('project_milestones')
    .select('*')
    .eq('project_id', data.id)
    .order('sort_order', { ascending: true });

  const images = [...(data.project_images ?? [])]
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((image: Record<string, unknown>) => ({
      url: image.url as string,
      alt: localized(image, 'alt', locale) || localized(data, 'title', locale),
    }));

  return {
    ...toCard(data, locale),
    startDate: data.start_date,
    images,
    milestones: (milestoneRows ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: localized(row, 'title', locale),
      description: localized(row, 'description', locale),
      targetDate: (row.target_date as string | null) ?? null,
      isDone: Boolean(row.is_done),
    })),
  };
}

/**
 * The project that drives the homepage construction animation: the first
 * published one still under construction.
 */
export async function getFeaturedProject(
  locale: Locale,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<ProjectDetail | null> {
  if (!client) return null;

  const { data } = await client
    .from('projects')
    .select('slug')
    .eq('is_published', true)
    .eq('status', 'under_construction')
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.slug) return null;
  return getProjectBySlug(data.slug, locale, client);
}

export async function getSiteStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
) {
  const fallback = { projects_completed: 0, sqm_delivered: 0, investors_count: 0, years_experience: 0 };
  if (!client) return fallback;

  const { data } = await client.from('site_stats').select('*').maybeSingle();
  return data ?? fallback;
}
