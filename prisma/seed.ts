import { prisma } from "../src/lib/db";
import { portfolio } from "../src/lib/mock-data";

// Popula o banco com o snapshot atual da carteira (posições reais do BTG +
// séries sintéticas de preço/P-L/balanço até a integração com o Yahoo).
// Idempotente: limpa e regrava tudo.
async function main() {
  console.log("Limpando banco...");
  await prisma.position.deleteMany();
  await prisma.dividend.deleteMany();
  await prisma.pricePoint.deleteMany();
  await prisma.peRatioPoint.deleteMany();
  await prisma.balanceSheetYear.deleteMany();
  await prisma.statementSnapshot.deleteMany();
  await prisma.fxRate.deleteMany();
  await prisma.asset.deleteMany();

  console.log(`Inserindo ${portfolio.assets.length} ativos...`);
  for (const a of portfolio.assets) {
    await prisma.asset.create({
      data: {
        id: a.id,
        ticker: a.ticker,
        yahooSymbol: a.yahooSymbol,
        name: a.name,
        class: a.class,
        subtype: a.subtype,
        currency: a.currency,
        sector: a.sector,
        hasMarketData: a.hasMarketData ?? false,
      },
    });
  }

  const snapshot = await prisma.statementSnapshot.create({
    data: { broker: "BTG", asOf: portfolio.asOf, source: "seed" },
  });

  console.log(`Inserindo ${portfolio.positions.length} posições...`);
  for (const p of portfolio.positions) {
    await prisma.position.create({
      data: {
        snapshotId: snapshot.id,
        assetId: p.assetId,
        quantity: p.quantity,
        avgPrice: p.avgPrice,
        currentPrice: p.currentPrice,
      },
    });
  }

  console.log(`Inserindo ${portfolio.dividends.length} proventos...`);
  for (const d of portfolio.dividends) {
    await prisma.dividend.create({
      data: {
        assetId: d.assetId,
        snapshotId: snapshot.id,
        type: d.type,
        date: d.date,
        total: d.total,
        currency: d.currency,
        amountPerShare: d.amountPerShare,
      },
    });
  }

  console.log("Inserindo séries de preço e P/L...");
  for (const [assetId, points] of Object.entries(portfolio.priceSeries)) {
    await prisma.pricePoint.createMany({
      data: points.map((pt) => ({ assetId, date: pt.date, close: pt.close })),
    });
  }
  for (const [assetId, points] of Object.entries(portfolio.peSeries)) {
    await prisma.peRatioPoint.createMany({
      data: points.map((pt) => ({ assetId, date: pt.date, pe: pt.pe })),
    });
  }

  console.log("Inserindo balanços...");
  for (const [assetId, bs] of Object.entries(portfolio.balanceSheets)) {
    await prisma.balanceSheetYear.createMany({
      data: bs.years.map((y) => ({ assetId, ...y })),
    });
  }

  await prisma.fxRate.create({
    data: { base: "USD", quote: "BRL", date: portfolio.asOf, rate: portfolio.usdToBrl },
  });

  console.log("✓ Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
