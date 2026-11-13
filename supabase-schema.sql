create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(btrim(customer_name)) between 1 and 100),
  delivery_date date not null,
  address text not null check (char_length(btrim(address)) between 1 and 500),
  customization text not null default '' check (char_length(customization) <= 1000),
  items jsonb not null check (
    jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 50
  ),
  total integer not null check (total > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  stars integer not null check (stars between 1 and 5),
  text text not null check (char_length(btrim(text)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid,
  page_path text not null check (char_length(page_path) between 1 and 255),
  created_at timestamptz not null default now()
);

alter table public.visits add column if not exists visitor_id uuid;
create unique index if not exists visits_visitor_id_key
  on public.visits (visitor_id);

create or replace function public.record_visit(p_visitor_id uuid, p_page_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.visits (visitor_id, page_path)
  values (p_visitor_id, left(p_page_path, 255))
  on conflict (visitor_id) do nothing;
end;
$$;

revoke all on function public.record_visit(uuid, text) from public, anon, authenticated;
grant execute on function public.record_visit(uuid, text) to anon;

alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.visits enable row level security;

revoke all on public.orders from anon, authenticated, public;
revoke all on public.reviews from anon, authenticated, public;
revoke all on public.visits from anon, authenticated, public;
drop policy if exists "Public can record visits" on public.visits;

grant insert on public.orders to anon;
grant select, insert on public.reviews to anon;

drop policy if exists "Public can submit orders" on public.orders;
drop policy if exists "Signed-in customers can submit orders" on public.orders;
create policy "Public can submit orders"
  on public.orders for insert to anon
  with check (true);

drop policy if exists "Public can read reviews" on public.reviews;
drop policy if exists "Signed-in customers can read reviews" on public.reviews;
create policy "Public can read reviews"
  on public.reviews for select to anon
  using (true);

drop policy if exists "Public can submit reviews" on public.reviews;
drop policy if exists "Signed-in customers can submit reviews" on public.reviews;
create policy "Public can submit reviews"
  on public.reviews for insert to anon
  with check (true);
