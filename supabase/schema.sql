-- sky_slices: one row per submitted slice of sky
create table if not exists public.sky_slices (
  id uuid primary key default gen_random_uuid(),
  color_hex text not null check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  city text not null check (length(city) between 1 and 80),
  country text,
  lat numeric check (lat between -90 and 90),
  lng numeric check (lng between -180 and 180),
  captured_at timestamptz not null default now()
);

create index if not exists sky_slices_captured_at_idx
  on public.sky_slices (captured_at desc);

alter table public.sky_slices enable row level security;

drop policy if exists "anyone can read" on public.sky_slices;
create policy "anyone can read"
  on public.sky_slices for select using (true);

drop policy if exists "anyone can insert" on public.sky_slices;
create policy "anyone can insert"
  on public.sky_slices for insert with check (true);

-- enable realtime
alter publication supabase_realtime add table public.sky_slices;
