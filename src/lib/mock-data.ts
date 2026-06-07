import { AS_OF, holdingId, holdings, USD_BRL, type RawHolding } from "./holdings";
import type {
  Asset,
  BalanceSheet,
  Dividend,
  PeRatioPoint,
  Portfolio,
  Position,
  PricePoint,
} from "./types";

// ---------------------------------------------------------------------------
// Constrói o Portfolio a partir dos HOLDINGS REAIS (holdings.ts).
//
// Posições e câmbio são reais (extrato BTG). As séries temporais
// (preço histórico, P/L, balanços) e o histórico estendido de proventos ainda
// são GERADOS sinteticamente — serão substituídos pelas cotações/fundamentos do
// Yahoo Finance na Fase 2b. Os geradores são determinísticos (seed) para que os
// gráficos fiquem estáveis entre renders.
// ---------------------------------------------------------------------------

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REF = new Date(AS_OF);

function isoMonthsAgo(monthsAgo: number) {
  const d = new Date(REF);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString().slice(0, 10);
}

function seedFromTicker(ticker: string) {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) | 0;
  return Math.abs(h) + 1;
}

function genPriceSeries(seed: number, current: number, volatility: number, drift: number): PricePoint[] {
  const rand = rng(seed);
  const months = 60;
  const raw: number[] = [1];
  for (let i = 1; i < months; i++) {
    const shock = (rand() - 0.5) * 2 * volatility;
    raw.push(Math.max(0.05, raw[i - 1] * (1 + drift + shock)));
  }
  const factor = current / raw[raw.length - 1];
  return raw.map((v, i) => ({
    date: isoMonthsAgo(months - 1 - i),
    close: Number((v * factor).toFixed(2)),
  }));
}

function genPeSeries(seed: number, base: number): PeRatioPoint[] {
  const rand = rng(seed * 7 + 13);
  const months = 60;
  const out: PeRatioPoint[] = [];
  let pe = base;
  for (let i = 0; i < months; i++) {
    pe = Math.max(2, pe + (rand() - 0.5) * 2.4);
    out.push({ date: isoMonthsAgo(months - 1 - i), pe: Number(pe.toFixed(1)) });
  }
  return out;
}

function genBalanceSheet(assetId: string, seed: number, baseRevenue: number, margin: number): BalanceSheet {
  const rand = rng(seed * 31 + 5);
  const years = [];
  let revenue = baseRevenue;
  for (let y = 2021; y <= 2025; y++) {
    revenue = revenue * (1 + 0.04 + (rand() - 0.4) * 0.18);
    const netIncome = revenue * margin * (0.8 + rand() * 0.5);
    const totalAssets = revenue * (1.6 + rand() * 0.6);
    const equity = totalAssets * (0.35 + rand() * 0.25);
    years.push({
      year: y,
      revenue: Math.round(revenue),
      netIncome: Math.round(netIncome),
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalAssets - equity),
      equity: Math.round(equity),
    });
  }
  return { assetId, unit: "milhões", years };
}

// --- Assets & posições (REAIS) ----------------------------------------------

export const assets: Asset[] = holdings.map((h) => ({
  id: holdingId(h.ticker),
  ticker: h.ticker,
  yahooSymbol: h.yahooSymbol,
  name: h.name,
  class: h.class,
  subtype: h.subtype,
  currency: h.currency,
  sector: h.sector,
  hasMarketData: h.hasMarketData,
}));

export const positions: Position[] = holdings.map((h) => ({
  assetId: holdingId(h.ticker),
  quantity: h.quantity,
  avgPrice: h.avgPrice,
  currentPrice: h.currentPrice,
}));

// --- Séries de preço e P/L (sintéticas) -------------------------------------

export const priceSeries: Record<string, PricePoint[]> = {};
export const peSeries: Record<string, PeRatioPoint[]> = {};

const volBySubtype: Record<string, number> = {
  acao_br: 0.07,
  fii: 0.035,
  etf: 0.045,
  stock: 0.06,
};

holdings.forEach((h) => {
  if (!h.hasMarketData) return;
  const id = holdingId(h.ticker);
  const seed = seedFromTicker(h.ticker);
  const vol = volBySubtype[h.subtype] ?? 0.05;
  const drift = h.currentPrice >= h.avgPrice ? 0.005 : 0.001;
  priceSeries[id] = genPriceSeries(seed, h.currentPrice, vol, drift);
  if (h.peBase) peSeries[id] = genPeSeries(seed, h.peBase);
});

// --- Balanços (empresas — ações com lucro) ----------------------------------

const baseRevenueByTicker: Record<string, [number, number]> = {
  // ticker: [receita base (milhões, moeda do ativo), margem líquida]
  ITSA4: [16000, 0.55],
  BBAS3: [160000, 0.18],
  WEGE3: [34000, 0.16],
  EGIE3: [13000, 0.2],
  EQTL3: [40000, 0.12],
  PRIO3: [12000, 0.35],
  PSSA3: [30000, 0.09],
  KLBN4: [22000, 0.14],
  AAPL: [390000, 0.25],
  MSFT: [245000, 0.36],
  AMZN: [620000, 0.07],
  GOOGL: [350000, 0.27],
  META: [165000, 0.34],
  TSLA: [98000, 0.08],
};

export const balanceSheets: Record<string, BalanceSheet> = {};
holdings.forEach((h) => {
  const cfg = baseRevenueByTicker[h.ticker];
  if (!cfg) return;
  const id = holdingId(h.ticker);
  balanceSheets[id] = genBalanceSheet(id, seedFromTicker(h.ticker), cfg[0], cfg[1]);
});

// --- Proventos --------------------------------------------------------------
// Histórico estendido SINTÉTICO (ancorado nos ativos reais) + proventos REAIS
// do extrato de abril/26.

const byTicker = new Map(holdings.map((h) => [h.ticker, h]));

function genDividends(): Dividend[] {
  const out: Dividend[] = [];
  let n = 0;
  const add = (
    ticker: string,
    type: Dividend["type"],
    date: string,
    total: number,
    perShare?: number
  ) => {
    const h = byTicker.get(ticker);
    if (!h) return;
    out.push({
      id: `div-${n++}`,
      assetId: holdingId(ticker),
      type,
      date,
      total: Number(total.toFixed(2)),
      currency: h.currency,
      amountPerShare: perShare,
    });
  };

  // FIIs: rendimento mensal (~0,7% a.m. sobre o valor de mercado).
  holdings
    .filter((h) => h.subtype === "fii")
    .forEach((h) => {
      for (let m = 1; m < 18; m++) {
        const perShare = Number((h.currentPrice * 0.007).toFixed(2));
        add(h.ticker, "rendimento", isoMonthsAgo(m), perShare * h.quantity, perShare);
      }
    });

  // Ações BR: dividendos/JCP trimestrais (~1,2% a.t.).
  holdings
    .filter((h) => h.subtype === "acao_br")
    .forEach((h, i) => {
      const type = i % 2 === 0 ? "dividendo" : "jcp";
      for (let m = 2 + (i % 3); m < 18; m += 3) {
        const perShare = Number((h.currentPrice * 0.012).toFixed(2));
        add(h.ticker, type, isoMonthsAgo(m), perShare * h.quantity, perShare);
      }
    });

  // Internacional: dividendos trimestrais para os pagadores clássicos.
  ["AAPL", "MSFT", "IVV"].forEach((t) => {
    const h = byTicker.get(t);
    if (!h) return;
    for (let m = 1; m < 18; m += 3) {
      const perShare = Number((h.currentPrice * 0.004).toFixed(2));
      add(t, "dividendo", isoMonthsAgo(m), perShare * h.quantity, perShare);
    }
  });

  // --- Proventos REAIS do extrato BTG (abril/26) ---
  add("PSSA3", "jcp", "2026-04-10", 940.86, 1.32);
  add("RECR11", "rendimento", "2026-04-15", 155.02, 1.03);
  add("VRTA11", "rendimento", "2026-04-15", 95.2, 0.85);
  add("HGLG11", "rendimento", "2026-04-15", 91.3, 1.1);
  add("TGAR11", "rendimento", "2026-04-15", 208.8, 0.72);

  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const dividends: Dividend[] = genDividends();

// --- Portfolio agregado -----------------------------------------------------

export const portfolio: Portfolio = {
  asOf: AS_OF,
  usdToBrl: USD_BRL,
  assets,
  positions,
  priceSeries,
  peSeries,
  dividends,
  balanceSheets,
};

export type { RawHolding };
