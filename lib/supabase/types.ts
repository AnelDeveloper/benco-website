export type PropertyType = 'villa' | 'apartment' | 'house' | 'land';
export type ListingMode = 'sale' | 'rent' | 'both';
export type ProjectStatus = 'planning' | 'under_construction' | 'completed';

export type PropertyRow = {
  id: string;
  slug: string;
  title_bs: string;
  title_en: string;
  description_bs: string | null;
  description_en: string | null;
  property_type: PropertyType;
  listing_mode: ListingMode;
  location: string;
  address: string | null;
  price: number | null;
  price_per_night: number | null;
  currency: string;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  max_guests: number | null;
  features: string[];
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PropertyImageRow = {
  id: string;
  property_id: string;
  url: string;
  alt_bs: string | null;
  alt_en: string | null;
  sort_order: number;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  title_bs: string;
  title_en: string;
  description_bs: string | null;
  description_en: string | null;
  location: string;
  status: ProjectStatus;
  progress_percent: number;
  start_date: string | null;
  expected_completion: string | null;
  total_units: number | null;
  available_units: number | null;
  price_per_m2: number | null;
  currency: string;
  min_investment: number | null;
  expected_return_percent: number | null;
  funding_goal: number | null;
  funded_amount: number;
  offers_offplan: boolean;
  offers_investment: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectMilestoneRow = {
  id: string;
  project_id: string;
  title_bs: string;
  title_en: string;
  description_bs: string | null;
  description_en: string | null;
  target_date: string | null;
  completed_at: string | null;
  is_done: boolean;
  sort_order: number;
  created_at: string;
};

export type SiteStatsRow = {
  id: boolean;
  projects_completed: number;
  sqm_delivered: number;
  investors_count: number;
  years_experience: number;
  updated_at: string;
};

/**
 * `Relationships` is required by postgrest-js's GenericTable constraint. Omit it
 * and the schema silently fails the constraint, which makes every insert payload
 * resolve to `never` — an error that surfaces far from its cause.
 */
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      properties: Table<PropertyRow>;
      property_images: Table<PropertyImageRow>;
      projects: Table<ProjectRow>;
      project_milestones: Table<ProjectMilestoneRow>;
      site_stats: Table<SiteStatsRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
