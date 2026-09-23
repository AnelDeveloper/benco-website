-- Roles: user (no access) · support (enquiries and bookings) · admin (everything)
--
-- Replaces the binary "in the admins table = full access" model. The table is
-- renamed because it no longer holds only admins.

alter table admins rename to app_users;

alter table app_users
  add column role text not null default 'user'
    check (role in ('user', 'support', 'admin')),
  add column name text,
  add column created_by text;

-- Everyone already in the table had full access, so they stay admins.
update app_users set role = 'admin';

-- --- role helpers ---------------------------------------------------------
-- security definer so they can read app_users, which anon cannot.

create or replace function current_role_name() returns text as $$
  select role from app_users
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$ language sql stable security definer set search_path = public;

create or replace function is_admin() returns boolean as $$
  select coalesce(current_role_name() = 'admin', false);
$$ language sql stable security definer set search_path = public;

-- Support handles customers; admins can do anything support can.
create or replace function is_staff() returns boolean as $$
  select coalesce(current_role_name() in ('admin', 'support'), false);
$$ language sql stable security definer set search_path = public;

-- --- policies -------------------------------------------------------------
-- Content stays admin-only. Support gets exactly what it needs to answer a
-- customer: the enquiries and the booking calendar, nothing that changes a
-- price or removes a listing.

drop policy if exists reservations_admin_all on reservations;
create policy reservations_staff_all on reservations
  for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists requests_admin_all on requests;
create policy requests_staff_all on requests
  for all to authenticated using (is_staff()) with check (is_staff());

-- Support may read listings so an enquiry shows which property it is about,
-- but the public read policy already covers published rows, and support has no
-- business seeing unpublished drafts.

-- Only admins manage the user list.
create policy app_users_admin_read on app_users
  for select to authenticated using (is_admin());
create policy app_users_admin_write on app_users
  for all to authenticated using (is_admin()) with check (is_admin());
