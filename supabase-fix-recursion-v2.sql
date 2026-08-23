-- ============================================================
-- GRANOLAS PLACE — reset total das regras de segurança
-- (usa isso se o erro de "infinite recursion" voltar a aparecer)
-- Cola no SQL Editor do Supabase e clica em Run.
-- ============================================================

-- Apaga TODAS as políticas existentes nessas tabelas, sem exceção,
-- pra garantir que não sobrou nenhuma regra antiga conflitando.
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('servers', 'server_members', 'channels', 'messages')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Funções auxiliares (security definer = não reaplica RLS, evita o loop)
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

create or replace function public.channel_server_id(target_channel_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select server_id from channels where id = target_channel_id;
$$;

-- servers: dono sempre vê o próprio (necessário logo após criar, antes
-- de virar membro) + qualquer membro também vê.
create policy "servers: dono ve" on servers
  for select using (auth.uid() = owner_id);
create policy "servers: membro ve" on servers
  for select using (public.is_server_member(id));
create policy "servers: criar" on servers
  for insert with check (auth.uid() = owner_id);

-- server_members: cada um só vê e insere a própria participação.
create policy "server_members: ve o proprio" on server_members
  for select using (auth.uid() = user_id);
create policy "server_members: entrar" on server_members
  for insert with check (auth.uid() = user_id);

-- channels: só quem é membro do server vê/cria canal.
create policy "channels: ve se e membro do server" on channels
  for select using (public.is_server_member(server_id));
create policy "channels: criar se e membro do server" on channels
  for insert with check (public.is_server_member(server_id));

-- messages: só quem é membro do server do canal lê/envia.
create policy "messages: ve se e membro do server" on messages
  for select using (public.is_server_member(public.channel_server_id(channel_id)));
create policy "messages: enviar" on messages
  for insert with check (
    auth.uid() = author_id
    and public.is_server_member(public.channel_server_id(channel_id))
  );

-- ============================================================
-- Fim. Isso substitui completamente as regras antigas — não
-- precisa rodar mais nenhum outro arquivo de correção depois deste.
-- ============================================================
