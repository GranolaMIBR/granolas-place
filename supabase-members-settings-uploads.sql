-- ============================================================
-- GRANOLAS PLACE — lista de membros, configurar servidor,
-- e upload de arquivo/imagem no chat.
-- Cola no SQL Editor do Supabase e clica em Run.
-- ============================================================

-- Deixa qualquer membro do servidor ver a lista completa de
-- membros (antes cada um só via a própria linha, por isso não
-- dava pra montar a lista de membros do lado do chat).
drop policy if exists "server_members: ve todos do server" on server_members;
create policy "server_members: ve todos do server" on server_members
  for select using (public.is_server_member(server_id));

-- Sair de um servidor (apaga a própria participação).
drop policy if exists "server_members: sair" on server_members;
create policy "server_members: sair" on server_members
  for delete using (auth.uid() = user_id);

-- Só o dono pode renomear o servidor.
drop policy if exists "servers: dono edita" on servers;
create policy "servers: dono edita" on servers
  for update using (auth.uid() = owner_id);

-- Só o dono pode excluir o servidor.
drop policy if exists "servers: dono exclui" on servers;
create policy "servers: dono exclui" on servers
  for delete using (auth.uid() = owner_id);

-- Espaço de armazenamento pra imagens/arquivos enviados no chat.
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', true, 15728640) -- 15MB
on conflict (id) do nothing;

drop policy if exists "attachments: leitura publica" on storage.objects;
create policy "attachments: leitura publica" on storage.objects
  for select using (bucket_id = 'attachments');

drop policy if exists "attachments: qualquer logado envia" on storage.objects;
create policy "attachments: qualquer logado envia" on storage.objects
  for insert with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- ============================================================
-- Fim.
-- ============================================================
