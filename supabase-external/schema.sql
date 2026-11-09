-- ============================================================
-- Smart Event Certificate Portal - schema for external Supabase
-- Run ONCE in your Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- Roles ----------
create type public.app_role as enum ('student', 'organizer', 'admin');

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  roll_number text,
  prn text,
  branch text,
  year text,
  created_at timestamptz not null default now()
);

-- Roles live in their own table (prevents users promoting themselves)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
                 where user_id = _user_id and role in ('organizer','admin'))
$$;

-- Auto-create profile + student role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Workshop','Seminar','Competition','Technical','Hackathon')),
  event_date date not null,
  venue text not null,
  description text,
  icon text default '📅',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- Registrations ----------
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  roll_number text not null,
  prn text not null,
  email text not null,
  branch text not null,
  year text not null,
  attended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- ---------- Certificate templates ----------
create table public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  style text not null default 'classic',        -- built-in layout key
  background_path text,                          -- file in 'certificate-templates' bucket
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- Certificates ----------
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 10)),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  template_id uuid references public.certificate_templates(id),
  student_name text not null,
  event_name text not null,
  event_date date not null,
  file_path text,                                -- file in 'certificates' bucket
  issued_by uuid references auth.users(id),
  issued_at timestamptz not null default now()
);

-- Public verification: returns only safe fields for one code
create or replace function public.verify_certificate(_code text)
returns table (certificate_code text, student_name text, event_name text, event_date date, issued_at timestamptz)
language sql stable security definer set search_path = public as $$
  select certificate_code, student_name, event_name, event_date, issued_at
  from public.certificates where certificate_code = upper(_code)
$$;

-- ---------- Sponsors ----------
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  website_url text,
  logo_path text,                                -- file in 'sponsor-logos' bucket
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Site stats (visitor counter) ----------
create table public.site_stats (
  key text primary key,
  value bigint not null default 0
);
insert into public.site_stats (key, value) values ('visitors', 0);

create or replace function public.increment_visitors()
returns bigint language sql security definer set search_path = public as $$
  update public.site_stats set value = value + 1 where key = 'visitors' returning value
$$;

-- ============================================================
-- GRANTS
-- ============================================================
grant select on public.events, public.sponsors, public.site_stats, public.certificate_templates to anon;
grant select, insert, update, delete on public.profiles, public.events, public.registrations,
  public.certificate_templates, public.certificates, public.sponsors to authenticated;
grant select on public.user_roles, public.site_stats to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
grant execute on function public.increment_visitors() to anon, authenticated;
grant execute on function public.has_role(uuid, public.app_role), public.is_staff(uuid) to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.certificates enable row level security;
alter table public.sponsors enable row level security;
alter table public.site_stats enable row level security;

-- profiles
create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid());

-- user_roles: read own only
create policy "own roles read" on public.user_roles for select to authenticated
  using (user_id = auth.uid());

-- events: public read, staff write
create policy "events public read" on public.events for select to anon, authenticated using (true);
create policy "events staff insert" on public.events for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "events staff update" on public.events for update to authenticated using (public.is_staff(auth.uid()));
create policy "events staff delete" on public.events for delete to authenticated using (public.is_staff(auth.uid()));

-- registrations: students manage own, staff see/update all
create policy "reg read" on public.registrations for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "reg insert own" on public.registrations for insert to authenticated
  with check (user_id = auth.uid());
create policy "reg staff update" on public.registrations for update to authenticated
  using (public.is_staff(auth.uid()));
create policy "reg delete" on public.registrations for delete to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

-- certificate templates: everyone reads, any signed-in user uploads own, staff/owner delete
create policy "tpl read" on public.certificate_templates for select to anon, authenticated using (true);
create policy "tpl insert" on public.certificate_templates for insert to authenticated
  with check (uploaded_by = auth.uid());
create policy "tpl delete" on public.certificate_templates for delete to authenticated
  using (uploaded_by = auth.uid() or public.is_staff(auth.uid()));

-- certificates: owner reads own, staff issue/manage
create policy "cert read" on public.certificates for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "cert staff insert" on public.certificates for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "cert staff update" on public.certificates for update to authenticated
  using (public.is_staff(auth.uid()));
create policy "cert staff delete" on public.certificates for delete to authenticated
  using (public.is_staff(auth.uid()));

-- sponsors: public read, staff write
create policy "sponsors read" on public.sponsors for select to anon, authenticated using (true);
create policy "sponsors staff insert" on public.sponsors for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "sponsors staff update" on public.sponsors for update to authenticated using (public.is_staff(auth.uid()));
create policy "sponsors staff delete" on public.sponsors for delete to authenticated using (public.is_staff(auth.uid()));

-- site_stats: public read (writes only via increment_visitors)
create policy "stats read" on public.site_stats for select to anon, authenticated using (true);

-- ============================================================
-- STORAGE BUCKETS + POLICIES
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('certificate-templates', 'certificate-templates', true),
  ('sponsor-logos', 'sponsor-logos', true),
  ('certificates', 'certificates', false)
on conflict (id) do nothing;

create policy "tpl files read" on storage.objects for select using (bucket_id = 'certificate-templates');
create policy "tpl files upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'certificate-templates' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logo files read" on storage.objects for select using (bucket_id = 'sponsor-logos');
create policy "logo files staff write" on storage.objects for insert to authenticated
  with check (bucket_id = 'sponsor-logos' and public.is_staff(auth.uid()));

create policy "cert files read own or staff" on storage.objects for select to authenticated
  using (bucket_id = 'certificates' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())));
create policy "cert files staff write" on storage.objects for insert to authenticated
  with check (bucket_id = 'certificates' and public.is_staff(auth.uid()));

-- ============================================================
-- Make yourself an organizer AFTER you sign up once (replace email):
-- insert into public.user_roles (user_id, role)
-- select id, 'organizer' from auth.users where email = 'you@example.com';
-- ============================================================

-- ===== ADD-ON: certificate template choice per event (organizer dashboard) =====
alter table public.events add column if not exists template_id uuid references public.certificate_templates(id);
