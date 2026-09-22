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

export type ProjectImageRow = {
  id: string;
  project_id: string;
  url: string;
  alt_bs: string | null;
  alt_en: string | null;
  sort_order: number;
  created_at: string;
};

export type ReservationKind = 'booking' | 'block';
export type ReservationStatus = 'confirmed' | 'cancelled';

export type ReservationRow = {
  id: string;
  property_id: string;
  period: string;
  kind: ReservationKind;
  status: ReservationStatus;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guests: number | null;
  message: string | null;
  reason: string | null;
  total_price: number | null;
  ip: string | null;
  created_at: string;
  cancelled_at: string | null;
};

export type TourRow = {
  id: string;
  slug: string;
  title_bs: string;
  title_en: string;
  blurb_bs: string | null;
  blurb_en: string | null;
  duration_hours: number | null;
  distance_km: number | null;
  price_per_person: number | null;
  currency: string;
  cover_url: string | null;
  max_seats: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type RequestKind = 'purchase' | 'offplan' | 'investment' | 'tour';
export type RequestStatus = 'new' | 'contacted' | 'confirmed' | 'rejected';

export type RequestRow = {
  id: string;
  kind: RequestKind;
  property_id: string | null;
  project_id: string | null;
  tour_id: string | null;
  tour_date: string | null;
  seats: number | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  amount: number | null;
  units: number | null;
  status: RequestStatus;
  admin_notes: string | null;
  ip: string | null;
  created_at: string;
  updated_at: string;
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
      project_images: Table<ProjectImageRow>;
      project_milestones: Table<ProjectMilestoneRow>;
      reservations: Table<ReservationRow>;
      requests: Table<RequestRow>;
      tours: Table<TourRow>;
      admins: Table<{ email: string; created_at: string }>;
      site_stats: Table<SiteStatsRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
