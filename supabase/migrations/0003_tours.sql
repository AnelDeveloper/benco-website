-- Car tours: private day trips with a Ben&Co driver.

create table tours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_bs text not null,
  title_en text not null,
  blurb_bs text,
  blurb_en text,
  duration_hours numeric(4, 1),
  distance_km int,
  price_per_person numeric(10, 2),
  currency text not null default 'BAM',
  cover_url text,
  max_seats int not null default 6,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tours_published_idx on tours (is_published, sort_order);
create trigger tours_set_updated_at before update on tours
  for each row execute function set_updated_at();

-- A tour booking is a request like the others, so it lands in the same inbox.
alter table requests drop constraint requests_kind_check;
alter table requests add constraint requests_kind_check
  check (kind in ('purchase', 'offplan', 'investment', 'tour'));

alter table requests add column tour_id uuid references tours(id) on delete set null;
alter table requests add column tour_date date;
alter table requests add column seats int;

alter table requests drop constraint requests_target_matches_kind;
alter table requests add constraint requests_target_matches_kind check (
  (kind = 'purchase' and property_id is not null)
  or (kind in ('offplan', 'investment') and project_id is not null)
  or (kind = 'tour' and tour_id is not null)
);

alter table tours enable row level security;

create policy tours_public_read on tours
  for select to anon, authenticated using (is_published);

create policy tours_admin_all on tours
  for all to authenticated using (is_admin()) with check (is_admin());

insert into storage.buckets (id, name, public)
values ('tour-images', 'tour-images', true)
on conflict (id) do nothing;
