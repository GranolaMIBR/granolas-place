-- ============================================================
-- GRANOLAS PLACE — arquivos/imagens nas mensagens diretas
-- Cola no SQL Editor do Supabase e roda.
-- ============================================================

alter table direct_messages add column if not exists file_url text;
alter table direct_messages add column if not exists file_name text;
alter table direct_messages add column if not exists file_size int;
alter table direct_messages add column if not exists mime_type text;

-- direct_messages.content já era "not null default ''", então mensagem
-- só com anexo (sem texto) funciona sem precisar mudar mais nada.
