-- Certkeep schema. Apply in the Supabase SQL editor or with the Supabase CLI.
-- Authorization lives in memberships and profiles.platform_role, never in user_metadata.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'starter' check (plan in ('starter', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  platform_role text not null default 'user' check (platform_role in ('user', 'superadmin')),
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  trade text not null,
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  public_id text not null unique,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  doc_type text not null check (doc_type in ('license', 'coi', 'bond', 'ce')),
  holder text not null default '',
  issuer text not null,
  doc_number text not null,
  issue_date date not null,
  expiry_date date not null,
  storage_path text,
  file_name text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table public.upload_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  token text not null unique,
  expires_at date not null,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table public.reminder_dispatches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  days_before integer not null check (days_before in (30, 14, 7)),
  recipient text not null,
  subject text not null,
  body text not null,
  sent_at timestamptz not null default now(),
  unique (document_id, days_before)
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.vendors enable row level security;
alter table public.documents enable row level security;
alter table public.upload_requests enable row level security;
alter table public.audit_events enable row level security;
alter table public.reminder_dispatches enable row level security;

create or replace function private.is_org_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = target
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_org_writer(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = target
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'member')
  );
$$;

create or replace function private.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.platform_role = 'superadmin'
  );
$$;

revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.is_org_writer(uuid) from public;
revoke all on function private.is_superadmin() from public;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_writer(uuid) to authenticated;
grant execute on function private.is_superadmin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_organization(org_name text, org_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;
  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into org_id;
  insert into public.memberships (org_id, user_id, role)
  values (org_id, (select auth.uid()), 'owner');
  insert into public.audit_events (org_id, actor_id, action, entity_type, entity_id, summary)
  values (org_id, (select auth.uid()), 'org.create', 'organization', org_id::text, 'Organization created.');
  return org_id;
end;
$$;

revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

create or replace function public.vendor_public_status(vendor_public_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'vendorName', v.name,
    'trade', v.trade,
    'city', v.city,
    'publicId', v.public_id,
    'orgName', o.name,
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type', d.doc_type,
        'issuer', d.issuer,
        'expiryDate', d.expiry_date,
        'status', case
          when d.expiry_date < current_date then 'expired'
          when d.expiry_date <= current_date + 30 then 'expiring'
          else 'valid'
        end
      ) order by d.expiry_date)
      from public.documents d
      where d.vendor_id = v.id
    ), '[]'::jsonb)
  )
  into result
  from public.vendors v
  join public.organizations o on o.id = v.org_id
  where v.public_id = vendor_public_id;

  return result;
end;
$$;

revoke all on function public.vendor_public_status(text) from public;
grant execute on function public.vendor_public_status(text) to anon, authenticated;

create policy organizations_member_select on public.organizations
  for select to authenticated
  using ((select private.is_org_member(id)) or (select private.is_superadmin()));

create policy organizations_owner_update on public.organizations
  for update to authenticated
  using ((select private.is_org_writer(id)))
  with check ((select private.is_org_writer(id)));

create policy profiles_self_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_superadmin()));

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and platform_role = (select p.platform_role from public.profiles p where p.id = (select auth.uid()))
  );

create policy memberships_select on public.memberships
  for select to authenticated
  using ((select private.is_org_member(org_id)) or user_id = (select auth.uid()) or (select private.is_superadmin()));

create policy vendors_select on public.vendors
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy vendors_write on public.vendors
  for insert to authenticated
  with check ((select private.is_org_writer(org_id)));

create policy vendors_update on public.vendors
  for update to authenticated
  using ((select private.is_org_writer(org_id)))
  with check ((select private.is_org_writer(org_id)));

create policy documents_select on public.documents
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy documents_insert on public.documents
  for insert to authenticated
  with check ((select private.is_org_writer(org_id)));

create policy requests_select on public.upload_requests
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy requests_insert on public.upload_requests
  for insert to authenticated
  with check ((select private.is_org_writer(org_id)));

create policy audit_select on public.audit_events
  for select to authenticated
  using (org_id is not null and (select private.is_org_member(org_id)));

create policy audit_insert on public.audit_events
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and org_id is not null
    and (select private.is_org_writer(org_id))
  );

create policy reminders_select on public.reminder_dispatches
  for select to authenticated
  using ((select private.is_org_member(org_id)));

create policy reminders_insert on public.reminder_dispatches
  for insert to authenticated
  with check ((select private.is_org_writer(org_id)));

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on public.organizations, public.profiles, public.memberships, public.vendors, public.documents, public.upload_requests, public.reminder_dispatches to authenticated;
grant select, insert on public.audit_events to authenticated;
revoke update, delete on public.audit_events from authenticated, anon;

insert into storage.buckets (id, name, public)
values ('compliance-files', 'compliance-files', false)
on conflict (id) do nothing;

create policy compliance_files_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'compliance-files'
    and (select private.is_org_member(((storage.foldername(name))[1])::uuid))
  );

create policy compliance_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'compliance-files'
    and (select private.is_org_writer(((storage.foldername(name))[1])::uuid))
  );

create policy compliance_files_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'compliance-files'
    and (select private.is_org_writer(((storage.foldername(name))[1])::uuid))
  )
  with check (
    bucket_id = 'compliance-files'
    and (select private.is_org_writer(((storage.foldername(name))[1])::uuid))
  );
