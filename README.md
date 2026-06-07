# Investly — Dashboard de Investimentos

Dashboard financeiro pessoal para acompanhar a carteira: cotações diárias,
histórico de preço, múltiplo P/L, proventos, balanços das empresas e alocação
por classe de ativo. Interface limpa e **responsiva** (desktop + mobile).

> Status: **Fase 1 — Fundação + UI com dados de exemplo (mock).**
> A camada de dados real (import do extrato BTG + cotações Yahoo Finance) está
> projetada e documentada abaixo, pronta para a Fase 2.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui** (componentes em `src/components/ui`)
- **Recharts** (via o wrapper de chart do shadcn) para os gráficos
- **next-themes** (modo claro/escuro)

## Rodando localmente

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # build de produção + checagem de tipos
```

## Estrutura

```
src/
├─ app/
│  ├─ layout.tsx                 # html, tema, fontes
│  └─ (dashboard)/               # grupo com o app shell (sidebar + header)
│     ├─ page.tsx                # Visão Geral
│     ├─ carteira/               # Carteira consolidada (preço médio, resultado)
│     ├─ alocacao/               # Alocação por classe e subtipo
│     ├─ cotacoes/               # Preço histórico + P/L (filtro de período)
│     ├─ proventos/              # Dividendos, JCP, rendimentos, cupom
│     └─ balancos/               # Evolução de receita/lucro das empresas
├─ components/
│  ├─ ui/                        # shadcn/ui
│  ├─ charts/                    # gráficos (área, linha, donut, barras)
│  └─ dashboard/                 # app shell, sidebar, KPIs, filtros
└─ lib/
   ├─ types.ts                   # MODELO DE DOMÍNIO (contrato de dados)
   ├─ mock-data.ts               # dados de exemplo (serão substituídos)
   ├─ portfolio.ts               # cálculos: consolidação, alocação, proventos
   └─ format.ts                  # formatação pt-BR (R$, US$, %, datas)
```

## Funcionalidades (Fase 1)

- **Visão Geral**: patrimônio total, resultado, rentabilidade, proventos 12m,
  evolução do patrimônio (5 anos) e alocação resumida.
- **Carteira**: tabela consolidada com quantidade, preço médio, preço atual,
  investido, valor de mercado, resultado (R$ e %) e peso — com busca e filtro
  por classe. Valores internacionais convertidos para BRL.
- **Alocação**: visão macro por classe (Renda Fixa, Tesouro Direto, RV BR,
  RV Internacional, Fundos, Previdência) e detalhamento por subtipo
  (ações / FII / ETF no Brasil; stocks / REITs / ETFs no exterior).
  Previdência já aparece **preparada** mesmo sem posição.
- **Cotações**: seletor de ativo (B3 e internacional), filtros de período
  (6M, 1A, 2A, 3A, 5A), gráfico de preço e gráfico do múltiplo P/L com média.
- **Proventos**: total recebido, média mensal, gráfico mensal empilhado por
  tipo (dividendo / JCP / rendimento / cupom) e histórico de recebimentos.
- **Balanços**: receita, lucro líquido, margem, patrimônio líquido e
  demonstrativo anual (5 anos) por empresa.

## Roadmap do backend (Fase 2)

O modelo em `src/lib/types.ts` é o contrato entre a UI e os dados. A Fase 2
liga esse contrato a duas fontes:

### 1. Import do extrato BTG (Excel, a cada ~15 dias)
Define **o que** você tem (posições, preço médio, quantidade, proventos).

- Upload do `.xlsx` exportado do BTG → parse com **SheetJS (`xlsx`)**.
- Mapear linhas para `Asset` + `Position` (+ `Dividend` quando houver).
- Persistir em banco. Como escolhemos **rodar local por enquanto**, o plano é
  **SQLite + Prisma** (`schema.prisma` espelhando os tipos de domínio):
  `Asset`, `Position`, `Quote`, `Dividend`, `BalanceSheetYear`, `FxRate`.
- O extrato é a fonte da verdade da **carteira**; cada novo upload cria um
  snapshot datado (`asOf`), preservando o histórico de aportes.

### 2. Cotações e fundamentos (Yahoo Finance, diário)
Define **quanto vale** e os fundamentos (preço, P/L, balanços).

- Biblioteca **`yahoo-finance2`** (ações BR usam sufixo `.SA`, ex.: `PETR4.SA`;
  internacionais usam o ticker direto, ex.: `AAPL`, `O`).
- Job diário (script `pnpm sync:quotes`, depois agendável por cron) que, para
  cada `yahooSymbol`, busca cotação do dia, histórico de preço, série de P/L e
  demonstrativos, gravando em `Quote` / `PeRatio` / `BalanceSheetYear`.
- Câmbio USD→BRL (`FxRate`) atualizado no mesmo job para consolidar a carteira.

### Fluxo de dados
```
Extrato BTG (.xlsx)  ──parse──▶  Posições/Proventos ─┐
                                                      ├─▶  SQLite (Prisma) ──▶  UI
Yahoo Finance (API)  ──sync ──▶  Preços/P-L/Balanços ─┘     (substitui mock-data)
```

Quando o banco existir, basta trocar a origem em `mock-data.ts` por queries —
a UI não muda, pois consome o mesmo tipo `Portfolio`.

## Próximos passos sugeridos

1. Enviar um exemplo do extrato BTG para mapear as colunas reais.
2. Adicionar Prisma + SQLite e o parser de Excel.
3. Integrar `yahoo-finance2` e o job diário de cotações.
4. (Opcional) Migrar para Postgres + deploy quando sair do uso local.
