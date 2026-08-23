# Granolas Place — Alpha 0.1

## 1. Configurar o banco (Supabase) — faz isso ANTES de rodar
Abre o projeto no supabase.com → **SQL Editor** → cola o conteúdo do arquivo
`supabase-setup.sql` (está na raiz desse projeto) → clica em **Run**.

Isso cria todas as tabelas (profiles, servers, channels, messages, amigos,
presença), as regras de segurança (RLS) e liga o Realtime do chat automaticamente
— não precisa mais clicar em nada no Database → Replication.

## 2. Rodar local
```
npm install
npm run dev
```
Abre o link que aparecer (tipo http://localhost:5173).

## Deploy (Vercel)
1. Sobe essa pasta pra um repositório no GitHub
2. Cria conta em vercel.com, "Add New Project", conecta o repositório
3. Deploy automático — ele detecta que é Vite sozinho
4. Te dá um link tipo granola-app.vercel.app pra mandar pro seu amigo
