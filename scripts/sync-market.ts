import { prisma } from "../src/lib/db";
import {
  derivePeHistory,
  fetchBalanceSheets,
  fetchPriceHistory,
  fetchQuote,
  fetchUsdBrl,
} from "../src/lib/yahoo";

// ---------------------------------------------------------------------------
// Sincroniza cotações, P/L e balanços do Yahoo Finance para o banco.
// Rode na sua máquina (precisa de acesso ao query*.finance.yahoo.com):
//
//   pnpm sync
//
// É incremental/idempotente: atualiza preços históricos, o preço atual das
// posições do último snapshot, a série de P/L, os balanços e o câmbio.
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Câmbio USD→BRL.
  try {
    const rate = await fetchUsdBrl();
    if (rate > 0) {
      await prisma.fxRate.upsert({
        where: { base_quote_date: { base: "USD", quote: "BRL", date: today } },
        update: { rate },
        create: { base: "USD", quote: "BRL", date: today, rate },
      });
      console.log(`✓ Câmbio USD/BRL: ${rate}`);
    }
  } catch (e) {
    console.warn("⚠️  Falha no câmbio:", (e as Error).message);
  }

  // 2. Ativos com símbolo do Yahoo.
  const assets = await prisma.asset.findMany({
    where: { hasMarketData: true, NOT: { yahooSymbol: null } },
  });
  console.log(`Sincronizando ${assets.length} ativos...`);

  // Snapshot mais recente (para atualizar preço atual das posições).
  const snapshot = await prisma.statementSnapshot.findFirst({
    orderBy: { asOf: "desc" },
  });

  for (const asset of assets) {
    const symbol = asset.yahooSymbol!;
    try {
      const prices = await fetchPriceHistory(symbol, 5);
      if (prices.length) {
        for (const p of prices) {
          await prisma.pricePoint.upsert({
            where: { assetId_date: { assetId: asset.id, date: p.date } },
            update: { close: p.close },
            create: { assetId: asset.id, date: p.date, close: p.close },
          });
        }
      }

      const quote = await fetchQuote(symbol);

      // Atualiza o preço atual da posição no snapshot mais recente.
      if (snapshot && quote.price > 0) {
        await prisma.position.updateMany({
          where: { snapshotId: snapshot.id, assetId: asset.id },
          data: { currentPrice: quote.price },
        });
      }

      // Série de P/L derivada (preço ÷ LPA atual).
      const pe = derivePeHistory(prices, quote.trailingEps);
      for (const pt of pe) {
        await prisma.peRatioPoint.upsert({
          where: { assetId_date: { assetId: asset.id, date: pt.date } },
          update: { pe: pt.pe },
          create: { assetId: asset.id, date: pt.date, pe: pt.pe },
        });
      }

      // Balanços (apenas para ações; FII/ETF não têm demonstrativo de empresa).
      if (asset.subtype === "acao_br" || asset.subtype === "stock") {
        try {
          const years = await fetchBalanceSheets(symbol);
          for (const y of years) {
            await prisma.balanceSheetYear.upsert({
              where: { assetId_year: { assetId: asset.id, year: y.year } },
              update: { ...y },
              create: { assetId: asset.id, ...y },
            });
          }
        } catch {
          /* balanço indisponível para este ativo */
        }
      }

      console.log(
        `  ✓ ${asset.ticker} (${symbol}): ${prices.length} preços, ` +
          `P/L ${quote.trailingPe?.toFixed(1) ?? "—"}`
      );
    } catch (e) {
      console.warn(`  ⚠️  ${asset.ticker} (${symbol}):`, (e as Error).message);
    }

    await sleep(250); // educado com a API
  }

  console.log("✓ Sincronização concluída.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
