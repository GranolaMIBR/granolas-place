-- ============================================================
-- GRANOLAS PLACE — sistema de cargos (roles)
-- Cola no SQL Editor do Supabase e roda.
-- ============================================================

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  server_id uuid references servers(id) on delete cascade,
  name text not null,
  color text default '#99AAB5',
  position int default 0,
  created_at timestamptz default now()
);

create table if not exists member_roles (
  server_id uuid references servers(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role_id uuid references roles(id) on delete cascade,
  primary key (server_id, user_id, role_id)
);

alter table roles enable row level security;
alter table member_roles enable row level security;

-- Qualquer membro do servidor pode ver os cargos que existem
drop policy if exists "roles: ver do meu server" on roles;
create policy "roles: ver do meu server" on roles
  for select using (public.is_server_member(server_id));

-- Só o dono do servidor pode criar/editar/apagar cargos
drop policy if exists "roles: dono cria" on roles;
create policy "roles: dono cria" on roles
  for insert with check (exists (select 1 from servers where id = server_id and owner_id = auth.uid()));

drop policy if exists "roles: dono edita" on roles;
create policy "roles: dono edita" on roles
  for update using (exists (select 1 from servers where id = server_id and owner_id = auth.uid()));

drop policy if exists "roles: dono apaga" on roles;
create policy "roles: dono apaga" on roles
  for delete using (exists (select 1 from servers where id = server_id and owner_id = auth.uid()));

-- Qualquer membro pode ver quem tem qual cargo
drop policy if exists "member_roles: ver do meu server" on member_roles;
create policy "member_roles: ver do meu server" on member_roles
  for select using (public.is_server_member(server_id));

-- Só o dono atribui/remove cargos de alguém
drop policy if exists "member_roles: dono atribui" on member_roles;
create policy "member_roles: dono atribui" on member_roles
  for insert with check (exists (select 1 from servers where id = server_id and owner_id = auth.uid()));

drop policy if exists "member_roles: dono remove" on member_roles;
create policy "member_roles: dono remove" on member_roles
  for delete using (exists (select 1 from servers where id = server_id and owner_id = auth.uid()));

-- ============================================================
-- Fim.
-- ============================================================
