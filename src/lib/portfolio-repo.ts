import "server-only";

import { prisma } from "./db";
import { portfolio as fallbackPortfolio } from "./mock-data";
import type {
  Asset,
  BalanceSheet,
  Dividend,
  DividendType,
  PeRatioPoint,
  Portfolio,
  Position,
  PricePoint,
} from "./types";

// ---------------------------------------------------------------------------
// Acesso a dados do dashboard. Lê do banco (Prisma/SQLite) e monta o objeto
// Portfolio que a UI consome. Se o banco estiver vazio ou indisponível (ex.:
// build sem dev.db), cai no snapshot em memória (mock-data) — assim a aplicação
// nunca quebra e o build estático continua funcionando.
// ---------------------------------------------------------------------------

function groupSeries<T extends { assetId: string }>(rows: T[]) {
  const map: Record<string, T[]> = {};
  for (const r of rows) (map[r.assetId] ??= []).push(r);
  return map;
}

export async function getPortfolio(): Promise<Portfolio> {
  try {
    const snapshot = await prisma.statementSnapshot.findFirst({
      orderBy: { asOf: "desc" },
      include: { positions: true },
    });

    if (!snapshot || snapshot.positions.length === 0) {
      return fallbackPortfolio;
    }

    const [
      assetRows,
      dividendRows,
      priceRows,
      peRows,
      balanceRows,
      fx,
    ] = await Promise.all([
      prisma.asset.findMany(),
      prisma.dividend.findMany({ orderBy: { date: "desc" } }),
      prisma.pricePoint.findMany({ orderBy: { date: "asc" } }),
      prisma.peRatioPoint.findMany({ orderBy: { date: "asc" } }),
      prisma.balanceSheetYear.findMany({ orderBy: { year: "asc" } }),
      prisma.fxRate.findFirst({
        where: { base: "USD", quote: "BRL" },
        orderBy: { date: "desc" },
      }),
    ]);

    const assets: Asset[] = assetRows.map((a) => ({
      id: a.id,
      ticker: a.ticker,
      yahooSymbol: a.yahooSymbol ?? undefined,
      name: a.name,
      class: a.class as Asset["class"],
      subtype: a.subtype as Asset["subtype"],
      currency: a.currency as Asset["currency"],
      sector: a.sector ?? undefined,
      hasMarketData: a.hasMarketData,
    }));

    const positions: Position[] = snapshot.positions.map((p) => ({
      assetId: p.assetId,
      quantity: p.quantity,
      avgPrice: p.avgPrice,
      currentPrice: p.currentPrice,
    }));

    const dividends: Dividend[] = dividendRows.map((d) => ({
      id: d.id,
      assetId: d.assetId,
      type: d.type as DividendType,
      date: d.date,
      total: d.total,
      currency: d.currency as Dividend["currency"],
      amountPerShare: d.amountPerShare ?? undefined,
    }));

    const priceSeries: Record<string, PricePoint[]> = {};
    for (const [assetId, rows] of Object.entries(groupSeries(priceRows))) {
      priceSeries[assetId] = rows.map((r) => ({ date: r.date, close: r.close }));
    }

    const peSeries: Record<string, PeRatioPoint[]> = {};
    for (const [assetId, rows] of Object.entries(groupSeries(peRows))) {
      peSeries[assetId] = rows.map((r) => ({ date: r.date, pe: r.pe }));
    }

    const balanceSheets: Record<string, BalanceSheet> = {};
    for (const [assetId, rows] of Object.entries(groupSeries(balanceRows))) {
      balanceSheets[assetId] = {
        assetId,
        unit: "milhões",
        years: rows.map((y) => ({
          year: y.year,
          revenue: y.revenue,
          netIncome: y.netIncome,
          totalAssets: y.totalAssets,
          totalLiabilities: y.totalLiabilities,
          equity: y.equity,
        })),
      };
    }

    return {
      asOf: snapshot.asOf,
      usdToBrl: fx?.rate ?? fallbackPortfolio.usdToBrl,
      assets,
      positions,
      priceSeries,
      peSeries,
      dividends,
      balanceSheets,
    };
  } catch {
    // Banco indisponível (ex.: build sem dev.db) → usa o snapshot em memória.
    return fallbackPortfolio;
  }
}
