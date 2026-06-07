# Deploy em produção

O projeto roda **local** com SQLite. Para colocar em produção (e rodar a
sincronização do Yahoo "na nuvem"), o ajuste principal é trocar o banco
**SQLite → Postgres gerenciado**, porque hosts serverless (Vercel) e runners de
CI são efêmeros — um SQLite local não persiste entre requests/execuções.

## Passo a passo (Vercel + Postgres)

1. **Banco**: crie um Postgres gerenciado (Neon, Supabase ou Vercel Postgres) e
   copie a connection string.
2. **Schema do Prisma**: troque o provider para `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   e rode `pnpm exec prisma migrate deploy` (ou `db push`).
3. **Vercel**: importe o repositório, configure as variáveis de ambiente
   (`DATABASE_URL`, `AUTH_SECRET`, `ALLOWED_EMAILS`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `AUTH_URL`) e faça o deploy. O dashboard já lê do
   banco em runtime (`force-dynamic`).
4. **Seed/migração inicial**: rode `pnpm db:seed` (ou importe seu extrato) uma
   vez apontando para o Postgres.
5. **Sincronização agendada do Yahoo**: renomeie
   `.github/workflows/sync.yml.example` para `sync.yml` e configure o secret
   `DATABASE_URL` no GitHub. O cron roda `pnpm sync` nos dias úteis e atualiza
   preços/P-L/balanços direto no Postgres que a app consome.

## Login com Google (acesso de qualquer lugar, protegido)

O painel é privado: todas as rotas exigem sessão (`src/proxy.ts`), e só os
e-mails em `ALLOWED_EMAILS` conseguem entrar. A sessão é um JWT assinado com
`AUTH_SECRET`, guardado em cookie `httpOnly`.

Configurando o OAuth no **Google Cloud Console**:

1. Crie um projeto → **APIs e serviços → Tela de consentimento OAuth** (tipo
   "Externo"; adicione seu e-mail como usuário de teste).
2. **Credenciais → Criar credencial → ID do cliente OAuth → Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados**, adicione:
   - `http://localhost:3000/api/auth/callback` (dev)
   - `https://SEU-DOMINIO.vercel.app/api/auth/callback` (produção)
4. Copie o **Client ID** e o **Client Secret** para `GOOGLE_CLIENT_ID` e
   `GOOGLE_CLIENT_SECRET`.
5. Gere o `AUTH_SECRET` com `openssl rand -base64 32` e defina `AUTH_URL` com a
   URL pública (ex.: `https://investly.vercel.app`).

> Em desenvolvimento, se `GOOGLE_CLIENT_ID`/`SECRET` ficarem vazios, o login
> entra direto como o dono (modo dev) — nunca em produção.

## Importante sobre o Cloudflare Pages

Se este repositório está conectado ao **Cloudflare Pages** (ex.: o site do
Bariloche), cada push de branch dispara um *preview build*. Como este é um app
**Next.js** (e não um site estático), esses builds falham e geram notificações.

**Recomendação:** mantenha o dashboard em um **repositório separado** (veja o
bundle de migração entregue) e conecte-o à Vercel — assim o projeto do
Cloudflare/Bariloche fica intocado.
