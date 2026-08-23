-- ============================================================
-- GRANOLAS PLACE — setup do banco no Supabase
-- Cola esse arquivo inteiro no SQL Editor do Supabase e roda (RUN).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- TABELAS
-- ------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text default '',
  custom_status text default '',
  status text not null default 'online',
  accent text not null default 'rosa',
  avatar_color text not null default '#F794C0',
  created_at timestamptz not null default now()
);

create table if not exists servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists server_members (
  server_id uuid not null references servers(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (server_id, user_id)
);

create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers(id) on delete cascade,
  name text not null,
  type text not null check (type in ('text', 'voice')),
  position int not null default 0
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (sender_id, receiver_id)
);

create table if not exists user_presence (
  user_id uuid primary key references profiles(id) on delete cascade,
  status text not null default 'online',
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------

create index if not exists idx_server_members_user on server_members(user_id);
create index if not exists idx_channels_server on channels(server_id);
create index if not exists idx_messages_channel on messages(channel_id, created_at);
create index if not exists idx_friend_requests_sender on friend_requests(sender_id);
create index if not exists idx_friend_requests_receiver on friend_requests(receiver_id);

-- ------------------------------------------------------------
-- CRIA O PROFILE AUTOMATICAMENTE QUANDO ALGUÉM SE CADASTRA
-- (usa os dados que o app manda em options.data no signUp)
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
declare
  palette text[] := array['#8B5CF6', '#4F9DFF', '#FF5470', '#3DDC84', '#FF9D4D', '#F794C0'];
begin
  insert into public.profiles (id, username, display_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    palette[1 + floor(random() * array_length(palette, 1))::int]
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- REALTIME — liga o chat pra atualizar sozinho
-- ------------------------------------------------------------

alter publication supabase_realtime add table messages;

-- ------------------------------------------------------------
-- RLS (Row Level Security)
-- ------------------------------------------------------------

alter table profiles enable row level security;
alter table servers enable row level security;
alter table server_members enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;
alter table friend_requests enable row level security;
alter table user_presence enable row level security;

-- profiles: qualquer usuário logado pode ver perfis (precisa pra achar amigo por username
-- e mostrar nome/avatar de quem manda mensagem). Só dá pra editar o próprio.
create policy "profiles: leitura geral" on profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles: editar o próprio" on profiles
  for update using (auth.uid() = id);

-- servers: só vê servidor de que participa. Só cria se for o dono.
create policy "servers: ve se e membro" on servers
  for select using (
    exists (select 1 from server_members m where m.server_id = servers.id and m.user_id = auth.uid())
  );
create policy "servers: criar" on servers
  for insert with check (auth.uid() = owner_id);

-- server_members: vê só as próprias participações. Pode entrar em servidor (com o ID)
-- e o dono consegue se auto-inserir na criação.
create policy "server_members: ve o proprio" on server_members
  for select using (auth.uid() = user_id);
create policy "server_members: entrar" on server_members
  for insert with check (auth.uid() = user_id);

-- channels: só vê/gerencia canal de servidor de que participa.
create policy "channels: ve se e membro do server" on channels
  for select using (
    exists (select 1 from server_members m where m.server_id = channels.server_id and m.user_id = auth.uid())
  );
create policy "channels: criar se e membro do server" on channels
  for insert with check (
    exists (select 1 from server_members m where m.server_id = channels.server_id and m.user_id = auth.uid())
  );

-- messages: só lê/escreve em canal de servidor de que participa.
create policy "messages: ve se e membro do server" on messages
  for select using (
    exists (
      select 1 from channels c
      join server_members m on m.server_id = c.server_id
      where c.id = messages.channel_id and m.user_id = auth.uid()
    )
  );
create policy "messages: enviar" on messages
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from channels c
      join server_members m on m.server_id = c.server_id
      where c.id = messages.channel_id and m.user_id = auth.uid()
    )
  );

-- friend_requests: só vê pedido que enviou ou recebeu. Só o destinatário aceita/recusa
-- (e o remetente pode cancelar o próprio pedido).
create policy "friend_requests: ve os proprios" on friend_requests
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "friend_requests: enviar" on friend_requests
  for insert with check (auth.uid() = sender_id);
create policy "friend_requests: responder ou cancelar" on friend_requests
  for update using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- user_presence: todo mundo logado ve o status de todo mundo (pra bolinha online/ausente),
-- mas só atualiza o proprio.
create policy "user_presence: leitura geral" on user_presence
  for select using (auth.role() = 'authenticated');
create policy "user_presence: upsert o proprio" on user_presence
  for insert with check (auth.uid() = user_id);
create policy "user_presence: update o proprio" on user_presence
  for update using (auth.uid() = user_id);

-- ============================================================
-- Fim. Depois de rodar isso, é só criar uma conta no app que o
-- profile é criado sozinho pela trigger.
-- ============================================================
