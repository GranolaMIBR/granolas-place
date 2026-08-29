-- ============================================================
-- GRANOLAS PLACE — categorias de canal
-- Cola no SQL Editor do Supabase e roda.
-- ============================================================

create table if not exists channel_categories (
  id uuid primary key default gen_random_uuid(),
  server_id uuid references servers(id) on delete cascade,
  name text not null,
  position int default 0,
  created_at timestamptz default now()
);

alter table channels add column if not exists category_id uuid references channel_categories(id) on delete set null;

alter table channel_categories enable row level security;

drop policy if exists "categorias: ver do meu server" on channel_categories;
create policy "categorias: ver do meu server" on channel_categories
  for select using (public.is_server_member(server_id));

drop policy if exists "categorias: criar" on channel_categories;
create policy "categorias: criar" on channel_categories
  for insert with check (public.is_server_member(server_id));

drop policy if exists "categorias: editar" on channel_categories;
create policy "categorias: editar" on channel_categories
  for update using (public.is_server_member(server_id));

drop policy if exists "categorias: apagar" on channel_categories;
create policy "categorias: apagar" on channel_categories
  for delete using (public.is_server_member(server_id));

-- Falta também permitir editar/apagar canal (só existia "criar" antes)
drop policy if exists "channels: editar" on channels;
create policy "channels: editar" on channels
  for update using (server_id in (select server_id from server_members where user_id = auth.uid()));

drop policy if exists "channels: apagar" on channels;
create policy "channels: apagar" on channels
  for delete using (server_id in (select server_id from server_members where user_id = auth.uid()));

-- ============================================================
-- Fim.
-- ============================================================
