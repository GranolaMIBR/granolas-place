-- ============================================================
-- GRANOLAS PLACE — últimas colunas do perfil
-- (moldura personalizada, banner em GIF/imagem, gradiente na tela toda)
-- Cola no SQL Editor do Supabase e clica em Run.
-- ============================================================

alter table profiles add column if not exists custom_frame_url text;
alter table profiles add column if not exists banner_gif_url text;
alter table profiles add column if not exists full_gradient boolean not null default false;

-- ============================================================
-- Fim. Não precisa mexer em mais nada — o espaço de armazenamento
-- de imagens (bucket "avatars") que você já criou serve pra tudo:
-- foto de perfil, banner e moldura personalizada.
-- ============================================================
