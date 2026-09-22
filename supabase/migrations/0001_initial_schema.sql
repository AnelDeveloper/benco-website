create extension if not exists "pgcrypto";
create extension if not exists btree_gist;

-- Shared updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Who may administer the site. Checked by RLS, not just by the app.
create table admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_bs text not null,
  title_en text not null,
  description_bs text,
  description_en text,
  property_type text not null check (property_type in ('villa', 'apartment', 'house', 'land')),
  listing_mode text not null check (listing_mode in ('sale', 'rent', 'both')),
  location text not null,
  address text,
  price numeric(12, 2),
  price_per_night numeric(10, 2),
  currency text not null default 'BAM',
  area_m2 numeric(8, 2),
  bedrooms int,
  bathrooms int,
  max_guests int,
  features text[] not null default '{}',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_published_idx on properties (is_published, sort_order);
create trigger properties_set_updated_at before update on properties
  for each row execute function set_updated_at();

create table property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  alt_bs text,
  alt_en text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index property_images_property_idx on property_images (property_id, sort_order);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_bs text not null,
  title_en text not null,
  description_bs text,
  description_en text,
  location text not null,
  status text not null check (status in ('planning', 'under_construction', 'completed')),
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  start_date date,
  expected_completion date,
  total_units int,
  available_units int,
  price_per_m2 numeric(10, 2),
  currency text not null default 'BAM',
  min_investment numeric(12, 2),
  expected_return_percent numeric(5, 2),
  funding_goal numeric(14, 2),
  funded_amount numeric(14, 2) not null default 0,
  offers_offplan boolean not null default true,
  offers_investment boolean not null default true,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_published_idx on projects (is_published, sort_order);
create trigger projects_set_updated_at before update on projects
  for each row execute function set_updated_at();

create table project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  url text not null,
  alt_bs text,
  alt_en text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title_bs text not null,
  title_en text not null,
  description_bs text,
  description_en text,
  target_date date,
  completed_at date,
  is_done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index project_milestones_project_idx on project_milestones (project_id, sort_order);

-- Bookings and owner-blocked periods share one table so a single exclusion
-- constraint prevents a booking from overlapping either another booking or a block.
create table reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  period daterange not null,
  kind text not null check (kind in ('booking', 'block')),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  guest_name text,
  guest_email text,
  guest_phone text,
  guests int,
  message text,
  reason text,
  total_price numeric(10, 2),
  ip inet,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint reservations_no_overlap exclude using gist (
    property_id with =,
    period with &&
  ) where (status = 'confirmed')
);

create index reservations_property_idx on reservations (property_id, status);

create table requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('purchase', 'offplan', 'investment')),
  property_id uuid references properties(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  message text,
  amount numeric(14, 2),
  units int,
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'rejected')),
  admin_notes text,
  ip inet,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint requests_target_matches_kind check (
    (kind = 'purchase' and property_id is not null)
    or (kind in ('offplan', 'investment') and project_id is not null)
  )
);

create index requests_status_idx on requests (status, created_at desc);
create trigger requests_set_updated_at before update on requests
  for each row execute function set_updated_at();

-- Single-row table: the boolean primary key defaulting to true, with a check
-- that it IS true, makes a second row impossible.
create table site_stats (
  id boolean primary key default true check (id),
  projects_completed int not null default 0,
  sqm_delivered int not null default 0,
  investors_count int not null default 0,
  years_experience int not null default 0,
  updated_at timestamptz not null default now()
);

create trigger site_stats_set_updated_at before update on site_stats
  for each row execute function set_updated_at();

-- Storage for admin-uploaded photos. Public read; writes only via service role.
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true), ('project-images', 'project-images', true)
on conflict (id) do nothing;
