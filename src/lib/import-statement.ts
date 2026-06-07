import "server-only";

import * as XLSX from "xlsx";

import { prisma } from "./db";
import { parseBtgBr } from "./btg/parse-br";
import { parseBtgIntl } from "./btg/parse-intl";
import type { ParsedStatement } from "./btg/types";

/** Roteia o arquivo para o parser certo conforme a extensão. */
export function parseBtgFile(
  name: string,
  data: ArrayBuffer | Buffer
): ParsedStatement {
  const ext = name.toLowerCase().split(".").pop();
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (ext === "json") {
    return parseBtgIntl(JSON.parse(buffer.toString("utf8")), { source: name });
  }
  const wb = XLSX.read(buffer, { type: "buffer" });
  return parseBtgBr(wb, { source: name });
}

export interface ImportResult {
  snapshotId: string;
  broker: string;
  asOf: string;
  assets: number;
  positions: number;
  dividends: number;
}

/**
 * Persiste um extrato normalizado: upsert dos ativos + snapshot datado
 * (idempotente por broker+asOf) com posições e proventos.
 */
export async function upsertStatement(
  stmt: ParsedStatement
): Promise<ImportResult> {
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

  await prisma.statementSnapshot.deleteMany({
    where: { broker: stmt.broker, asOf: stmt.asOf },
  });
  const snapshot = await prisma.statementSnapshot.create({
    data: { broker: stmt.broker, asOf: stmt.asOf, source: stmt.source },
  });

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
    broker: stmt.broker,
    asOf: stmt.asOf,
    assets: assetIdByTicker.size,
    positions: stmt.positions.length,
    dividends: stmt.dividends.length,
  };
}
