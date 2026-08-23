-- ============================================================
-- GRANOLAS PLACE — ícone de servidor, tags, mensagens diretas
-- e bloquear/denunciar. Cola no SQL Editor do Supabase e roda.
-- ============================================================

-- Ícone/foto do servidor e tag do servidor
alter table servers add column if not exists icon_url text;
alter table servers add column if not exists tag_label text;

-- Se o membro optou por exibir a tag do servidor no nome dele
alter table server_members add column if not exists show_tag boolean default false;

-- ============================================================
-- Mensagens diretas (conversa 1-a-1 entre amigos)
-- ============================================================
create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text not null default '',
  created_at timestamptz default now()
);

alter table direct_messages enable row level security;

drop policy if exists "dm: ver minhas conversas" on direct_messages;
create policy "dm: ver minhas conversas" on direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "dm: enviar" on direct_messages;
create policy "dm: enviar" on direct_messages
  for insert with check (auth.uid() = sender_id);

-- Liga o tempo real pra essa tabela (equivalente a marcar o
-- toggle em Database > Publications, mas já direto por SQL).
alter publication supabase_realtime add table direct_messages;

-- ============================================================
-- Bloquear usuários
-- ============================================================
create table if not exists blocked_users (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

alter table blocked_users enable row level security;

drop policy if exists "blocked: ver meus bloqueios" on blocked_users;
create policy "blocked: ver meus bloqueios" on blocked_users
  for select using (auth.uid() = blocker_id);

drop policy if exists "blocked: bloquear" on blocked_users;
create policy "blocked: bloquear" on blocked_users
  for insert with check (auth.uid() = blocker_id);

drop policy if exists "blocked: desbloquear" on blocked_users;
create policy "blocked: desbloquear" on blocked_users
  for delete using (auth.uid() = blocker_id);

-- ============================================================
-- Fim.
-- ============================================================
