import { prisma } from "../src/lib/db";
import type { ParsedStatement } from "../src/lib/btg/types";

/**
 * Persiste um extrato normalizado no banco: cria/atualiza os ativos e grava um
 * snapshot datado com as posições e proventos. Reexecutar com o mesmo
 * (broker, asOf) substitui o snapshot anterior (idempotente).
 */
export async function upsertStatement(stmt: ParsedStatement) {
  // 1. Upsert dos ativos.
  const assetIdByTicker = new Map<string, string>();
  for (const p of stmt.positions) {
    const asset = await prisma.asset.upsert({
      where: { ticker: p.ticker },
      update: {
        name: p.name,
        class: p.class,
        subtype: p.subtype,
        currency: p.currency,
        sector: p.sector,
        yahooSymbol: p.yahooSymbol,
        hasMarketData: p.hasMarketData,
      },
      create: {
        ticker: p.ticker,
        name: p.name,
        class: p.class,
        subtype: p.subtype,
        currency: p.currency,
        sector: p.sector,
        yahooSymbol: p.yahooSymbol,
        hasMarketData: p.hasMarketData,
      },
    });
    assetIdByTicker.set(p.ticker, asset.id);
  }

  // 2. Recria o snapshot (broker + asOf).
  await prisma.statementSnapshot.deleteMany({
    where: { broker: stmt.broker, asOf: stmt.asOf },
  });
  const snapshot = await prisma.statementSnapshot.create({
    data: { broker: stmt.broker, asOf: stmt.asOf, source: stmt.source },
  });

  // 3. Posições.
  for (const p of stmt.positions) {
    await prisma.position.create({
      data: {
        snapshotId: snapshot.id,
        assetId: assetIdByTicker.get(p.ticker)!,
        quantity: p.quantity,
        avgPrice: p.avgPrice,
        currentPrice: p.currentPrice,
      },
    });
  }

  // 4. Proventos (alguns ativos de provento podem não estar nas posições).
  for (const d of stmt.dividends) {
    let assetId = assetIdByTicker.get(d.ticker);
    if (!assetId) {
      const existing = await prisma.asset.findUnique({ where: { ticker: d.ticker } });
      assetId = existing?.id;
    }
    if (!assetId) continue;
    await prisma.dividend.upsert({
      where: {
        assetId_type_date_total: {
          assetId,
          type: d.type,
          date: d.date,
          total: d.total,
        },
      },
      update: { amountPerShare: d.amountPerShare, snapshotId: snapshot.id },
      create: {
        assetId,
        snapshotId: snapshot.id,
        type: d.type,
        date: d.date,
        total: d.total,
        currency: d.currency,
        amountPerShare: d.amountPerShare,
      },
    });
  }

  return {
    snapshotId: snapshot.id,
    assets: assetIdByTicker.size,
    positions: stmt.positions.length,
    dividends: stmt.dividends.length,
  };
}
