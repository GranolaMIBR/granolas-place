-- ============================================================
-- GRANOLAS PLACE — correção do erro "infinite recursion detected
-- in policy for relation server_members"
-- Cola isso no SQL Editor do Supabase (depois do setup principal
-- que você já rodou) e clica em Run.
-- ============================================================

-- Função auxiliar: verifica se o usuário logado é membro de um servidor.
-- Por ser "security definer", ela lê a tabela sem passar pelas regras
-- de RLS de novo, o que evita o loop.
create or replace function public.is_server_member(target_server_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from server_members
    where server_id = target_server_id and user_id = auth.uid()
  );
$$;

-- Função auxiliar: descobre o server_id de um canal.
create or replace function public.channel_server_id(target_channel_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select server_id from channels where id = target_channel_id;
$$;

-- Recria as políticas usando as funções acima no lugar da subquery direta.

drop policy if exists "servers: ve se e membro" on servers;
create policy "servers: ve se e membro" on servers
  for select using (public.is_server_member(id));

drop policy if exists "channels: ve se e membro do server" on channels;
create policy "channels: ve se e membro do server" on channels
  for select using (public.is_server_member(server_id));

drop policy if exists "channels: criar se e membro do server" on channels;
create policy "channels: criar se e membro do server" on channels
  for insert with check (public.is_server_member(server_id));

drop policy if exists "messages: ve se e membro do server" on messages;
create policy "messages: ve se e membro do server" on messages
  for select using (public.is_server_member(public.channel_server_id(channel_id)));

drop policy if exists "messages: enviar" on messages;
create policy "messages: enviar" on messages
  for insert with check (
    auth.uid() = author_id
    and public.is_server_member(public.channel_server_id(channel_id))
  );

-- ============================================================
-- Fim. Depois disso, criar/entrar em servidor deve funcionar normal.
-- ============================================================
