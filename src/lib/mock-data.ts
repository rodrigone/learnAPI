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
// Dados de exemplo (mock). Determinísticos via seed para que os gráficos sejam
// estáveis entre renders. Serão substituídos pelo import do BTG + Yahoo Finance.
// ---------------------------------------------------------------------------

/** PRNG determinístico (mulberry32). */
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

const TODAY = new Date("2026-06-01");

function isoMonthsAgo(monthsAgo: number) {
  const d = new Date(TODAY);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString().slice(0, 10);
}

/** Gera 60 meses de preços (random walk) terminando exatamente em `current`. */
function genPriceSeries(
  seed: number,
  current: number,
  volatility: number,
  drift: number
): PricePoint[] {
  const rand = rng(seed);
  const months = 60;
  const raw: number[] = [1];
  for (let i = 1; i < months; i++) {
    const shock = (rand() - 0.5) * 2 * volatility;
    raw.push(Math.max(0.05, raw[i - 1] * (1 + drift + shock)));
  }
  // Normaliza para o último ponto = preço atual.
  const factor = current / raw[raw.length - 1];
  return raw.map((v, i) => ({
    date: isoMonthsAgo(months - 1 - i),
    close: Number((v * factor).toFixed(2)),
  }));
}

/** Série de P/L (preço/lucro) dos últimos 5 anos, oscilando ao redor de uma média. */
function genPeSeries(seed: number, base: number): PeRatioPoint[] {
  const rand = rng(seed * 7 + 13);
  const months = 60;
  const out: PeRatioPoint[] = [];
  let pe = base;
  for (let i = 0; i < months; i++) {
    pe = Math.max(2, pe + (rand() - 0.5) * 2.4);
    out.push({
      date: isoMonthsAgo(months - 1 - i),
      pe: Number(pe.toFixed(1)),
    });
  }
  return out;
}

function genBalanceSheet(
  assetId: string,
  seed: number,
  baseRevenue: number,
  margin: number
): BalanceSheet {
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

// --- Catálogo de ativos -----------------------------------------------------

export const assets: Asset[] = [
  // Ações BR
  { id: "petr4", ticker: "PETR4", yahooSymbol: "PETR4.SA", name: "Petrobras PN", class: "rv_br", subtype: "acao_br", currency: "BRL", sector: "Petróleo & Gás", hasMarketData: true },
  { id: "itub4", ticker: "ITUB4", yahooSymbol: "ITUB4.SA", name: "Itaú Unibanco PN", class: "rv_br", subtype: "acao_br", currency: "BRL", sector: "Bancos", hasMarketData: true },
  { id: "wege3", ticker: "WEGE3", yahooSymbol: "WEGE3.SA", name: "WEG ON", class: "rv_br", subtype: "acao_br", currency: "BRL", sector: "Bens Industriais", hasMarketData: true },
  { id: "vale3", ticker: "VALE3", yahooSymbol: "VALE3.SA", name: "Vale ON", class: "rv_br", subtype: "acao_br", currency: "BRL", sector: "Mineração", hasMarketData: true },
  // FIIs
  { id: "mxrf11", ticker: "MXRF11", yahooSymbol: "MXRF11.SA", name: "Maxi Renda FII", class: "rv_br", subtype: "fii", currency: "BRL", sector: "Crédito Imobiliário", hasMarketData: true },
  { id: "hglg11", ticker: "HGLG11", yahooSymbol: "HGLG11.SA", name: "CSHG Logística FII", class: "rv_br", subtype: "fii", currency: "BRL", sector: "Logística", hasMarketData: true },
  // ETF BR
  { id: "bova11", ticker: "BOVA11", yahooSymbol: "BOVA11.SA", name: "iShares Ibovespa", class: "rv_br", subtype: "etf_br", currency: "BRL", sector: "Índice", hasMarketData: true },
  // Stocks internacionais
  { id: "aapl", ticker: "AAPL", yahooSymbol: "AAPL", name: "Apple Inc.", class: "rv_intl", subtype: "stock", currency: "USD", sector: "Tecnologia", hasMarketData: true },
  { id: "msft", ticker: "MSFT", yahooSymbol: "MSFT", name: "Microsoft Corp.", class: "rv_intl", subtype: "stock", currency: "USD", sector: "Tecnologia", hasMarketData: true },
  { id: "googl", ticker: "GOOGL", yahooSymbol: "GOOGL", name: "Alphabet Inc.", class: "rv_intl", subtype: "stock", currency: "USD", sector: "Tecnologia", hasMarketData: true },
  // REIT
  { id: "o", ticker: "O", yahooSymbol: "O", name: "Realty Income", class: "rv_intl", subtype: "reit", currency: "USD", sector: "REIT - Varejo", hasMarketData: true },
  // ETFs internacionais
  { id: "voo", ticker: "VOO", yahooSymbol: "VOO", name: "Vanguard S&P 500 ETF", class: "rv_intl", subtype: "etf", currency: "USD", sector: "Índice", hasMarketData: true },
  { id: "schd", ticker: "SCHD", yahooSymbol: "SCHD", name: "Schwab US Dividend ETF", class: "rv_intl", subtype: "etf", currency: "USD", sector: "Dividendos", hasMarketData: true },
  // Tesouro Direto
  { id: "td_selic_2029", ticker: "Tesouro Selic 2029", name: "Tesouro Selic 2029", class: "tesouro_direto", subtype: "tesouro_selic", currency: "BRL", sector: "Pós-fixado" },
  { id: "td_ipca_2035", ticker: "Tesouro IPCA+ 2035", name: "Tesouro IPCA+ 2035", class: "tesouro_direto", subtype: "tesouro_ipca", currency: "BRL", sector: "Inflação" },
  // Renda Fixa
  { id: "cdb_btg", ticker: "CDB BTG 2027", name: "CDB BTG Pactual 110% CDI", class: "renda_fixa", subtype: "cdb", currency: "BRL", sector: "Bancário" },
  { id: "lci_inter", ticker: "LCI Inter 2026", name: "LCI Banco Inter 95% CDI", class: "renda_fixa", subtype: "lci_lca", currency: "BRL", sector: "Imobiliário" },
  { id: "deb_eneva", ticker: "Debênture ENEV", name: "Debênture Eneva IPCA+6%", class: "renda_fixa", subtype: "debenture", currency: "BRL", sector: "Energia" },
  // Fundo de investimento
  { id: "fundo_kinea", ticker: "Kinea Chronos", name: "Kinea Chronos Multimercado", class: "fundo", subtype: "fundo", currency: "BRL", sector: "Multimercado" },
];

const byId = (id: string) => assets.find((a) => a.id === id)!;

// --- Posições (cotação + preço médio) --------------------------------------

interface RawPosition {
  id: string;
  qty: number;
  avg: number;
  current: number;
  vol: number;
  drift: number;
  pe: number;
}

const rawPositions: RawPosition[] = [
  { id: "petr4", qty: 800, avg: 28.4, current: 38.72, vol: 0.09, drift: 0.006, pe: 4.5 },
  { id: "itub4", qty: 600, avg: 24.1, current: 35.18, vol: 0.06, drift: 0.008, pe: 8.5 },
  { id: "wege3", qty: 400, avg: 41.5, current: 52.3, vol: 0.07, drift: 0.005, pe: 30 },
  { id: "vale3", qty: 300, avg: 68.9, current: 61.45, vol: 0.08, drift: -0.001, pe: 6 },
  { id: "mxrf11", qty: 2500, avg: 9.85, current: 10.42, vol: 0.03, drift: 0.002, pe: 0 },
  { id: "hglg11", qty: 350, avg: 158.2, current: 167.9, vol: 0.035, drift: 0.002, pe: 0 },
  { id: "bova11", qty: 200, avg: 108.4, current: 132.6, vol: 0.05, drift: 0.005, pe: 0 },
  { id: "aapl", qty: 60, avg: 165.3, current: 214.8, vol: 0.06, drift: 0.007, pe: 32 },
  { id: "msft", qty: 35, avg: 310.5, current: 462.1, vol: 0.06, drift: 0.009, pe: 35 },
  { id: "googl", qty: 50, avg: 128.7, current: 178.4, vol: 0.07, drift: 0.008, pe: 24 },
  { id: "o", qty: 120, avg: 58.4, current: 56.9, vol: 0.04, drift: -0.001, pe: 40 },
  { id: "voo", qty: 40, avg: 398.2, current: 545.7, vol: 0.045, drift: 0.008, pe: 26 },
  { id: "schd", qty: 150, avg: 72.1, current: 81.3, vol: 0.04, drift: 0.004, pe: 18 },
  // Renda fixa / TD / fundo — preço médio e atual representam o valor unitário/cota.
  { id: "td_selic_2029", qty: 12, avg: 14200, current: 15310, vol: 0, drift: 0, pe: 0 },
  { id: "td_ipca_2035", qty: 8, avg: 3650, current: 3980, vol: 0, drift: 0, pe: 0 },
  { id: "cdb_btg", qty: 1, avg: 50000, current: 54200, vol: 0, drift: 0, pe: 0 },
  { id: "lci_inter", qty: 1, avg: 30000, current: 31650, vol: 0, drift: 0, pe: 0 },
  { id: "deb_eneva", qty: 20, avg: 1000, current: 1085, vol: 0, drift: 0, pe: 0 },
  { id: "fundo_kinea", qty: 4200, avg: 2.85, current: 3.12, vol: 0, drift: 0, pe: 0 },
];

export const positions: Position[] = rawPositions.map((p) => ({
  assetId: p.id,
  quantity: p.qty,
  avgPrice: p.avg,
  currentPrice: p.current,
}));

// --- Séries de preço e P/L (só para ativos com cotação) ---------------------

export const priceSeries: Record<string, PricePoint[]> = {};
export const peSeries: Record<string, PeRatioPoint[]> = {};

rawPositions.forEach((p, i) => {
  const asset = byId(p.id);
  if (!asset.hasMarketData) return;
  priceSeries[p.id] = genPriceSeries(i + 1, p.current, p.vol, p.drift);
  if (p.pe > 0) peSeries[p.id] = genPeSeries(i + 1, p.pe);
});

// --- Proventos --------------------------------------------------------------

function genDividends(): Dividend[] {
  const out: Dividend[] = [];
  let n = 0;
  const add = (
    assetId: string,
    type: Dividend["type"],
    monthsAgo: number,
    total: number,
    currency: Dividend["currency"],
    perShare?: number
  ) => {
    out.push({
      id: `div-${n++}`,
      assetId,
      type,
      date: isoMonthsAgo(monthsAgo),
      total: Number(total.toFixed(2)),
      currency,
      amountPerShare: perShare,
    });
  };

  // FIIs pagam todo mês.
  for (let m = 0; m < 18; m++) {
    add("mxrf11", "rendimento", m, 2500 * 0.1, "BRL", 0.1);
    add("hglg11", "rendimento", m, 350 * 1.1, "BRL", 1.1);
  }
  // Ações BR: dividendos e JCP trimestrais.
  for (let m = 1; m < 18; m += 3) {
    add("petr4", "dividendo", m, 800 * 1.35, "BRL", 1.35);
    add("itub4", "jcp", m + 1, 600 * 0.27, "BRL", 0.27);
    add("vale3", "dividendo", m, 300 * 2.1, "BRL", 2.1);
  }
  // Stocks/ETF/REIT internacionais.
  for (let m = 0; m < 18; m += 3) {
    add("aapl", "dividendo", m, 60 * 0.25, "USD", 0.25);
    add("msft", "dividendo", m, 35 * 0.83, "USD", 0.83);
    add("schd", "dividendo", m, 150 * 0.27, "USD", 0.27);
  }
  for (let m = 0; m < 18; m++) {
    add("o", "dividendo", m, 120 * 0.263, "USD", 0.263);
  }
  // Cupom de debênture (semestral).
  for (let m = 2; m < 18; m += 6) {
    add("deb_eneva", "cupom", m, 20 * 32, "BRL", 32);
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const dividends: Dividend[] = genDividends();

// --- Balanços (só empresas / ações) ----------------------------------------

export const balanceSheets: Record<string, BalanceSheet> = {
  petr4: genBalanceSheet("petr4", 1, 480000, 0.18),
  itub4: genBalanceSheet("itub4", 2, 160000, 0.22),
  wege3: genBalanceSheet("wege3", 3, 32000, 0.16),
  vale3: genBalanceSheet("vale3", 4, 250000, 0.2),
  aapl: genBalanceSheet("aapl", 5, 380000, 0.25),
  msft: genBalanceSheet("msft", 6, 210000, 0.34),
  googl: genBalanceSheet("googl", 7, 300000, 0.24),
};

// --- Portfolio agregado -----------------------------------------------------

export const portfolio: Portfolio = {
  asOf: "2026-06-01",
  usdToBrl: 5.42,
  assets,
  positions,
  priceSeries,
  peSeries,
  dividends,
  balanceSheets,
};
