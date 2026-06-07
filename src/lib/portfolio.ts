import {
  ASSET_CLASS_LABELS,
  ASSET_SUBTYPE_LABELS,
  type Asset,
  type AssetClass,
  type Dividend,
  type PeriodKey,
  type Portfolio,
  type PricePoint,
} from "./types";

/** Posição com todos os valores derivados, já consolidados em BRL. */
export interface EnrichedPosition {
  asset: Asset;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  /** Valores na moeda do ativo. */
  invested: number;
  marketValue: number;
  /** Valores convertidos para BRL. */
  investedBRL: number;
  marketValueBRL: number;
  pnl: number; // resultado em BRL
  pnlPct: number; // resultado %
  /** Participação na carteira (0–1) sobre o valor de mercado total. */
  weight: number;
}

export function toBRL(value: number, currency: Asset["currency"], fx: number) {
  return currency === "USD" ? value * fx : value;
}

export function enrichPositions(p: Portfolio): EnrichedPosition[] {
  const assetById = new Map(p.assets.map((a) => [a.id, a]));

  const partial = p.positions.map((pos) => {
    const asset = assetById.get(pos.assetId)!;
    const invested = pos.quantity * pos.avgPrice;
    const marketValue = pos.quantity * pos.currentPrice;
    const investedBRL = toBRL(invested, asset.currency, p.usdToBrl);
    const marketValueBRL = toBRL(marketValue, asset.currency, p.usdToBrl);
    return {
      asset,
      quantity: pos.quantity,
      avgPrice: pos.avgPrice,
      currentPrice: pos.currentPrice,
      invested,
      marketValue,
      investedBRL,
      marketValueBRL,
      pnl: marketValueBRL - investedBRL,
      pnlPct: investedBRL > 0 ? ((marketValueBRL - investedBRL) / investedBRL) * 100 : 0,
    };
  });

  const totalMV = partial.reduce((s, x) => s + x.marketValueBRL, 0);
  return partial
    .map((x) => ({ ...x, weight: totalMV > 0 ? x.marketValueBRL / totalMV : 0 }))
    .sort((a, b) => b.marketValueBRL - a.marketValueBRL);
}

export interface PortfolioTotals {
  invested: number;
  marketValue: number;
  pnl: number;
  pnlPct: number;
  /** Proventos recebidos nos últimos 12 meses (BRL). */
  income12m: number;
}

export function portfolioTotals(
  enriched: EnrichedPosition[],
  p: Portfolio
): PortfolioTotals {
  const invested = enriched.reduce((s, x) => s + x.investedBRL, 0);
  const marketValue = enriched.reduce((s, x) => s + x.marketValueBRL, 0);
  const pnl = marketValue - invested;
  return {
    invested,
    marketValue,
    pnl,
    pnlPct: invested > 0 ? (pnl / invested) * 100 : 0,
    income12m: incomeInLastMonths(p, 12),
  };
}

export interface AllocationSlice {
  key: string;
  label: string;
  value: number; // BRL
  weight: number; // 0–1
}

export function allocationByClass(
  enriched: EnrichedPosition[]
): AllocationSlice[] {
  const map = new Map<AssetClass, number>();
  for (const e of enriched) {
    map.set(e.asset.class, (map.get(e.asset.class) ?? 0) + e.marketValueBRL);
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      label: ASSET_CLASS_LABELS[key],
      value,
      weight: total > 0 ? value / total : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Alocação por subtipo dentro de uma classe (ex.: dentro de RV BR: ações/FII/ETF). */
export function allocationBySubtype(
  enriched: EnrichedPosition[],
  klass: AssetClass
): AllocationSlice[] {
  const map = new Map<string, number>();
  for (const e of enriched) {
    if (e.asset.class !== klass) continue;
    map.set(
      e.asset.subtype,
      (map.get(e.asset.subtype) ?? 0) + e.marketValueBRL
    );
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      label: ASSET_SUBTYPE_LABELS[key as keyof typeof ASSET_SUBTYPE_LABELS],
      value,
      weight: total > 0 ? value / total : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

// --- Filtro de período sobre séries temporais -------------------------------

const PERIOD_MONTHS: Record<PeriodKey, number> = {
  "6m": 6,
  "1y": 12,
  "2y": 24,
  "3y": 36,
  "5y": 60,
};

export function sliceByPeriod<T extends { date: string }>(
  series: T[],
  period: PeriodKey
): T[] {
  const months = PERIOD_MONTHS[period];
  return series.slice(Math.max(0, series.length - months));
}

/** Variação % entre o primeiro e o último ponto de uma série de preços. */
export function seriesReturn(series: PricePoint[]): number {
  if (series.length < 2) return 0;
  const first = series[0].close;
  const last = series[series.length - 1].close;
  return first > 0 ? ((last - first) / first) * 100 : 0;
}

// --- Proventos --------------------------------------------------------------

export function dividendToBRL(d: Dividend, fx: number) {
  return d.currency === "USD" ? d.total * fx : d.total;
}

function monthsAgoISO(months: number) {
  const d = new Date("2026-06-01");
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function incomeInLastMonths(p: Portfolio, months: number): number {
  const cutoff = monthsAgoISO(months);
  return p.dividends
    .filter((d) => d.date >= cutoff)
    .reduce((s, d) => s + dividendToBRL(d, p.usdToBrl), 0);
}

export interface MonthlyIncome {
  month: string; // YYYY-MM
  dividendo: number;
  jcp: number;
  rendimento: number;
  cupom: number;
  total: number;
}

export function incomeByMonth(p: Portfolio, months = 12): MonthlyIncome[] {
  const cutoff = monthsAgoISO(months);
  const map = new Map<string, MonthlyIncome>();
  for (const d of p.dividends) {
    if (d.date < cutoff) continue;
    const month = d.date.slice(0, 7);
    const entry =
      map.get(month) ??
      ({ month, dividendo: 0, jcp: 0, rendimento: 0, cupom: 0, total: 0 } as MonthlyIncome);
    const v = dividendToBRL(d, p.usdToBrl);
    entry[d.type] += v;
    entry.total += v;
    map.set(month, entry);
  }
  return [...map.values()].sort((a, b) => (a.month < b.month ? -1 : 1));
}

// --- Evolução do patrimônio -------------------------------------------------

export interface ValuePoint {
  date: string;
  value: number; // BRL
}

/**
 * Série mensal (60 meses) do valor total da carteira em BRL.
 * Para ativos com cotação usa a série de preços; para renda fixa/fundos
 * interpola linearmente do valor investido até o valor atual.
 */
export function portfolioValueSeries(p: Portfolio): ValuePoint[] {
  const assetById = new Map(p.assets.map((a) => [a.id, a]));
  const months = 60;
  // Datas de referência: usa a maior série de preços disponível, senão gera.
  const reference =
    Object.values(p.priceSeries).find((s) => s.length === months) ??
    Array.from({ length: months }, (_, i) => {
      const d = new Date("2026-06-01");
      d.setMonth(d.getMonth() - (months - 1 - i));
      return { date: d.toISOString().slice(0, 10), close: 0 };
    });

  return reference.map((ref, i) => {
    let total = 0;
    for (const pos of p.positions) {
      const asset = assetById.get(pos.assetId)!;
      const series = p.priceSeries[pos.assetId];
      let price: number;
      if (series && series[i]) {
        price = series[i].close;
      } else {
        // Interpolação linear entre preço médio (início) e atual (fim).
        const t = i / (months - 1);
        price = pos.avgPrice + (pos.currentPrice - pos.avgPrice) * t;
      }
      total += toBRL(pos.quantity * price, asset.currency, p.usdToBrl);
    }
    return { date: ref.date, value: Math.round(total) };
  });
}

export interface IncomeByAsset {
  asset: Asset;
  total: number; // BRL
}

export function incomeByAsset(p: Portfolio, months = 12): IncomeByAsset[] {
  const cutoff = monthsAgoISO(months);
  const assetById = new Map(p.assets.map((a) => [a.id, a]));
  const map = new Map<string, number>();
  for (const d of p.dividends) {
    if (d.date < cutoff) continue;
    map.set(d.assetId, (map.get(d.assetId) ?? 0) + dividendToBRL(d, p.usdToBrl));
  }
  return [...map.entries()]
    .map(([assetId, total]) => ({ asset: assetById.get(assetId)!, total }))
    .sort((a, b) => b.total - a.total);
}
