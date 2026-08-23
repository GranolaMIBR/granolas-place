-- ============================================================
-- GRANOLAS PLACE — completa o perfil personalizável
-- (colunas de moldura/banner que faltaram + upload de foto real)
-- Cola no SQL Editor do Supabase e clica em Run.
-- ============================================================

-- Colunas do perfil (se você já rodou o script anterior, esse
-- "if not exists" só ignora sem dar erro).
alter table profiles add column if not exists avatar_frame text not null default 'nenhuma';
alter table profiles add column if not exists banner_from text;
alter table profiles add column if not exists banner_to text;
alter table profiles add column if not exists avatar_url text;

-- Espaço de armazenamento pras fotos de perfil (aceita imagem e GIF).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Qualquer um pode VER as fotos (senão elas não aparecem pros outros usuários).
drop policy if exists "avatars: leitura publica" on storage.objects;
create policy "avatars: leitura publica" on storage.objects
  for select using (bucket_id = 'avatars');

-- Cada usuário só pode enviar/trocar/apagar a PRÓPRIA foto
-- (o arquivo precisa ficar dentro de uma pasta com o seu próprio ID).
drop policy if exists "avatars: upload proprio" on storage.objects;
create policy "avatars: upload proprio" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars: update proprio" on storage.objects;
create policy "avatars: update proprio" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatars: delete proprio" on storage.objects;
create policy "avatars: delete proprio" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Fim. Depois disso o botão "Escolher arquivo" no perfil já
-- funciona pra imagem normal ou GIF.
-- ============================================================
