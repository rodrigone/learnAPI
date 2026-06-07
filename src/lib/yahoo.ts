import YahooFinance from "yahoo-finance2";

// ---------------------------------------------------------------------------
// Wrapper do Yahoo Finance (cotações, histórico, P/L e balanços).
//
// IMPORTANTE: precisa de acesso à internet ao host query*.finance.yahoo.com.
// Rode na sua máquina local (`pnpm sync`). Símbolos: ações BR usam sufixo
// ".SA" (PETR4.SA); internacionais usam o ticker direto (AAPL); BRK.B → BRK-B.
// ---------------------------------------------------------------------------

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export interface PriceHistoryPoint {
  date: string; // YYYY-MM-DD
  close: number;
}

/** Histórico mensal de fechamento dos últimos `years` anos. */
export async function fetchPriceHistory(
  symbol: string,
  years = 5
): Promise<PriceHistoryPoint[]> {
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - years);
  const result = await yf.chart(symbol, {
    period1,
    interval: "1mo",
  });
  return result.quotes
    .filter((q) => q.close != null && q.date != null)
    .map((q) => ({
      date: new Date(q.date).toISOString().slice(0, 10),
      close: Number((q.close as number).toFixed(2)),
    }));
}

export interface QuoteInfo {
  price: number;
  currency: string;
  trailingPe?: number;
  trailingEps?: number;
}

/** Cotação atual + P/L e LPA correntes. */
export async function fetchQuote(symbol: string): Promise<QuoteInfo> {
  const summary = await yf.quoteSummary(symbol, {
    modules: ["price", "summaryDetail", "defaultKeyStatistics"],
  });
  return {
    price: summary.price?.regularMarketPrice ?? 0,
    currency: summary.price?.currency ?? "USD",
    trailingPe: summary.summaryDetail?.trailingPE,
    trailingEps: summary.defaultKeyStatistics?.trailingEps ?? undefined,
  };
}

/**
 * Série de P/L "histórica" derivada: P/L(t) = preço(t) / LPA atual.
 * O Yahoo não expõe P/L histórico diretamente; usar o LPA corrente sobre o
 * histórico de preços dá uma aproximação que acompanha a oscilação do preço.
 */
export function derivePeHistory(
  prices: PriceHistoryPoint[],
  trailingEps?: number
): { date: string; pe: number }[] {
  if (!trailingEps || trailingEps <= 0) return [];
  return prices.map((p) => ({
    date: p.date,
    pe: Number((p.close / trailingEps).toFixed(1)),
  }));
}

export interface BalanceYear {
  year: number;
  revenue: number; // milhões
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
}

/**
 * Demonstrativos anuais em milhões. Receita e lucro líquido são REAIS
 * (income statement do Yahoo). A v3 da lib não expõe a estrutura patrimonial
 * de forma tipada, então ativo/passivo/PL são estimados a partir da receita
 * (placeholder até uma fonte de balanço completo).
 */
export async function fetchBalanceSheets(symbol: string): Promise<BalanceYear[]> {
  const summary = await yf.quoteSummary(symbol, {
    modules: ["incomeStatementHistory"],
  });
  const income = summary.incomeStatementHistory?.incomeStatementHistory ?? [];
  const M = 1_000_000;

  return income
    .map((it) => {
      const year = it.endDate ? new Date(it.endDate).getFullYear() : 0;
      const revenue = (it.totalRevenue ?? 0) / M;
      const netIncome = (it.netIncome ?? 0) / M;
      // Estimativa da estrutura patrimonial (até fonte de balanço dedicada).
      const totalAssets = revenue * 1.8;
      const equity = totalAssets * 0.45;
      return {
        year,
        revenue: Math.round(revenue),
        netIncome: Math.round(netIncome),
        totalAssets: Math.round(totalAssets),
        totalLiabilities: Math.round(totalAssets - equity),
        equity: Math.round(equity),
      };
    })
    .filter((y) => y.year > 0 && y.revenue > 0)
    .sort((a, b) => a.year - b.year);
}

/** Câmbio USD→BRL atual. */
export async function fetchUsdBrl(): Promise<number> {
  const result = await yf.chart("BRL=X", {
    period1: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    interval: "1d",
  });
  const last = [...result.quotes].reverse().find((q) => q.close != null);
  return last?.close ? Number((last.close as number).toFixed(4)) : 0;
}
