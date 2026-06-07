# Handoff — Investly (dashboard de investimentos)

> Documento de transferência para continuar o projeto numa nova sessão do
> Claude Code, agora no repositório **`rodrigone/investly`**. Pode ser colado
> como contexto inicial para o novo agente.

## 0. O que é

Dashboard pessoal de investimentos (carteira BTG: ações BR, FIIs, ETFs, ações
internacionais). Mostra visão geral, carteira, alocação por classe, proventos,
cotações (preço + P/L) e balanços. Os dados vêm do **extrato do BTG** importado
para um banco, e cotações/balanços são sincronizados do **Yahoo Finance**.
Acesso protegido por **login com Google** (só e-mails autorizados).

## 1. ⚠️ Este Next.js NÃO é o convencional (LEIA ANTES DE CODAR)

O projeto usa **Next.js 16.2.7** com mudanças de convenção. O `AGENTS.md` manda
ler `node_modules/next/dist/docs/` antes de escrever código. A principal pegadinha
já tratada:

- **Middleware virou `proxy`**: o arquivo é `src/proxy.ts` com
  `export function proxy(request: NextRequest)` + `export const config = { matcher }`,
  e roda no **runtime Node** (não Edge). Por isso a auth foi feita nativa (jose),
  e não com NextAuth (que depende de middleware/Edge).
- `searchParams` em páginas é **Promise** (precisa `await`).
- Sempre confira `node_modules/next/dist/docs/01-app/...` ao mexer em
  middleware/proxy, route handlers, auth.

## 2. Stack

- Next.js 16 (App Router, `src/app`) + React 19 + TypeScript
- Tailwind v4 + shadcn/ui + Recharts + lucide-react
- Prisma + **SQLite (local)** / **Postgres (produção)**
- `jose` (sessão JWT), `xlsx` (parse do extrato), `yahoo-finance2` (sync)
- pnpm

## 3. Estrutura

```
prisma/schema.prisma        # modelos: Asset, StatementSnapshot, Position,
                            #   Dividend, PricePoint, PeRatioPoint,
                            #   BalanceSheetYear, FxRate
prisma/seed.ts              # popula o banco com a carteira real (dados do extrato)
scripts/import-btg.ts       # CLI: importa extrato (pnpm run import <arquivo>)
scripts/sync-yahoo.ts       # CLI: sincroniza Yahoo (pnpm sync)   [não roda no sandbox]
src/lib/
  db.ts                     # PrismaClient singleton
  btg/                      # parsers do extrato (parse-br, parse-intl, types)
  import-statement.ts       # parseBtgFile + upsertStatement (server-only)
  portfolio-repo.ts         # getPortfolio(): monta o Portfolio do banco (fallback mock)
  portfolio.ts / format.ts  # cálculos e formatação
  auth/jwt.ts               # assina/verifica sessão JWT (usado no proxy e handlers)
  auth/google.ts            # OAuth Google + allowlist (ALLOWED_EMAILS)
  session.ts                # cria/lê/apaga sessão via cookie (server-only)
src/proxy.ts                # protege todas as rotas; sem sessão -> /login
src/app/login/page.tsx      # tela de login (botão Entrar com Google)
src/app/api/auth/{signin,callback,signout}/route.ts
src/app/api/import/route.ts # upload do extrato (POST), exige sessão
src/app/(dashboard)/        # layout (exige sessão) + páginas do dashboard
DEPLOY.md                   # produção: Postgres + Vercel + Google + sync
.env.example                # todas as variáveis
.github/workflows/sync.yml.example  # cron do Yahoo (renomear p/ ativar)
```

## 4. Fases já entregues (estavam como PRs #1–#5 no repo antigo)

1. **Fase 1** — fundação + UI completa do dashboard (mock data).
2. **Fase 2a** — Prisma/SQLite + parser do extrato BTG + import CLI + carteira real no seed.
3. **Fase 2b** — sincronização Yahoo (preços, P/L, balanços, câmbio USD/BRL).
4. **Fase 2c** — dashboard lendo do banco em runtime (`force-dynamic`).
5. **Fase 2d** — upload do extrato pela web (`/importar` + `/api/import`).
6. **Fase 3** — login com Google + proteção de rotas (allowlist).

Tudo validado com `pnpm build` e testes de runtime. O round-trip real do Google
e o `pnpm sync` (Yahoo) NÃO foram testados no sandbox (rede bloqueada) — precisam
rodar na sua máquina/produção.

## 5. Como subir o código para o `investly` (na sua máquina)

Você recebeu o arquivo **`investly-dashboard.bundle`** (histórico completo).

```bash
git clone investly-dashboard.bundle investly && cd investly
git remote set-url origin https://github.com/rodrigone/investly.git
git push -u origin main
```

(Opcional: para recriar os 5 PRs, dá para abrir branches por fase — mas o `main`
já contém tudo. Recomendo seguir direto com `main` no repo novo.)

## 6. Rodar local

```bash
cp .env.example .env
# gere o segredo da sessão:
openssl rand -base64 32   # cole em AUTH_SECRET no .env
pnpm install
pnpm db:push      # cria o schema no SQLite
pnpm db:seed      # popula a carteira real
pnpm dev          # http://localhost:3000
```

Em dev, sem `GOOGLE_CLIENT_ID/SECRET`, o login entra direto (modo dev).

## 7. Login com Google (Google Cloud Console)

1. Novo projeto → **Tela de consentimento OAuth** (Externo; adicione seu e-mail
   como usuário de teste).
2. **Credenciais → Criar → ID do cliente OAuth → Aplicativo Web**.
3. URIs de redirecionamento autorizados:
   - `http://localhost:3000/api/auth/callback`
   - `https://SEU-DOMINIO.vercel.app/api/auth/callback`
4. Copie Client ID/Secret para `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
5. Defina `ALLOWED_EMAILS` (quem pode entrar) e `AUTH_URL` (URL pública em prod).

## 8. Produção (acesso de qualquer lugar) — tudo em plano grátis

Detalhes no `DEPLOY.md`. Resumo:

1. **Postgres grátis** (Neon/Supabase/Vercel Postgres) → copie a connection string.
2. Em `prisma/schema.prisma`, troque `provider = "sqlite"` por `"postgresql"` e rode
   `pnpm exec prisma migrate deploy` (ou `db push`).
3. **Vercel (Hobby/grátis)**: importe o repo, configure as envs (`DATABASE_URL`,
   `AUTH_SECRET`, `ALLOWED_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `AUTH_URL`) e faça deploy. Vira uma URL pública acessível do celular/web.
4. **Seed/import inicial** apontando para o Postgres.
5. **Sync do Yahoo agendado**: renomeie `.github/workflows/sync.yml.example` para
   `sync.yml` e configure o secret `DATABASE_URL` no GitHub (cron roda `pnpm sync`).

## 9. Próximos passos sugeridos (para o novo agente)

- [ ] Push do bundle para o `investly` e validar `pnpm build`.
- [ ] Migrar o schema para **Postgres** (provider + migration) mantendo dev local OK.
- [ ] Configurar **Google OAuth** e testar o login real (round-trip).
- [ ] Deploy na **Vercel** + variáveis de ambiente.
- [ ] Ativar o **workflow de sync** do Yahoo e rodar o primeiro `pnpm sync` real.
- [ ] (Opcional) botão "Atualizar cotações" no header chamando o sync sob demanda.
- [ ] (Opcional) histórico de snapshots (a carteira ao longo do tempo já é datada).

## 10. Comandos úteis

```bash
pnpm dev / build / start
pnpm db:push / db:seed
pnpm run import <extrato.xlsx|json>   # importa um extrato
pnpm sync                             # sincroniza Yahoo (rede liberada)
```

## 11. Contexto do repositório antigo

O código foi desenvolvido no repo `rodrigone/learnAPI` (que tem o site da viagem
Bariloche conectado ao Cloudflare Pages). Por isso ele foi migrado para o
`investly` — para os pushes do dashboard (Next) não dispararem os preview builds
que falhavam no projeto do Cloudflare. As branches `claude/phase*` no `learnAPI`
podem ser apagadas depois da migração.
