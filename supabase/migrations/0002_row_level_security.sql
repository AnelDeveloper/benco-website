-- security definer so the check can read `admins` even though anon cannot.
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from admins where email = auth.jwt() ->> 'email'
  );
$$ language sql stable security definer set search_path = public;

alter table admins enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table projects enable row level security;
alter table project_images enable row level security;
alter table project_milestones enable row level security;
alter table reservations enable row level security;
alter table requests enable row level security;
alter table site_stats enable row level security;

-- Public read: published rows only.
create policy properties_public_read on properties
  for select to anon, authenticated using (is_published);

create policy property_images_public_read on property_images
  for select to anon, authenticated using (
    exists (select 1 from properties p where p.id = property_id and p.is_published)
  );

create policy projects_public_read on projects
  for select to anon, authenticated using (is_published);

create policy project_images_public_read on project_images
  for select to anon, authenticated using (
    exists (select 1 from projects p where p.id = project_id and p.is_published)
  );

create policy project_milestones_public_read on project_milestones
  for select to anon, authenticated using (
    exists (select 1 from projects p where p.id = project_id and p.is_published)
  );

create policy site_stats_public_read on site_stats
  for select to anon, authenticated using (true);

-- Admin full access. Note this is gated on the admins table, NOT merely on
-- being authenticated: Supabase Auth accepts signups through the anon key by
-- default, so `to authenticated using (true)` would let anyone who registers
-- write directly to Postgres, bypassing the app entirely.
create policy properties_admin_all on properties
  for all to authenticated using (is_admin()) with check (is_admin());
create policy property_images_admin_all on property_images
  for all to authenticated using (is_admin()) with check (is_admin());
create policy projects_admin_all on projects
  for all to authenticated using (is_admin()) with check (is_admin());
create policy project_images_admin_all on project_images
  for all to authenticated using (is_admin()) with check (is_admin());
create policy project_milestones_admin_all on project_milestones
  for all to authenticated using (is_admin()) with check (is_admin());
create policy reservations_admin_all on reservations
  for all to authenticated using (is_admin()) with check (is_admin());
create policy requests_admin_all on requests
  for all to authenticated using (is_admin()) with check (is_admin());
create policy site_stats_admin_all on site_stats
  for all to authenticated using (is_admin()) with check (is_admin());

-- Availability must be public, but guest names, emails and phone numbers must not be.
-- A view without security_invoker reads with the owner's rights, so it returns
-- these two columns while `reservations` itself stays unreadable to anon.
create view public_availability as
  select property_id, period from reservations where status = 'confirmed';

grant select on public_availability to anon, authenticated;
