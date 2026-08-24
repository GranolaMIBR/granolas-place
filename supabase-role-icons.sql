-- Roda isso se você já tinha rodado o supabase-roles.sql antes.
-- Adiciona a coluna de imagem do cargo.
alter table roles add column if not exists icon_url text;
