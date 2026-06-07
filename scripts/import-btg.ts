import { readFileSync } from "node:fs";
import { basename } from "node:path";

import { parseBtgFile, upsertStatement } from "../src/lib/import-statement";
import { prisma } from "../src/lib/db";

/**
 * CLI: importa um extrato BTG para o banco.
 *
 *   pnpm run import data/private/btg_br_2026-04-18.xlsx
 *   pnpm run import data/private/btg_intl_posicoes.json
 */
async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Uso: pnpm run import <caminho-do-extrato.(xlsx|json)>");
    process.exit(1);
  }

  const source = basename(file);
  const stmt = parseBtgFile(source, readFileSync(file));

  if (stmt.positions.length === 0) {
    console.warn("⚠️  Nenhuma posição encontrada — verifique o formato do arquivo.");
  }

  const result = await upsertStatement(stmt);
  console.log(
    `✓ Importado ${source} (${result.broker}, ref. ${result.asOf}): ` +
      `${result.positions} posições, ${result.dividends} proventos, ` +
      `${result.assets} ativos.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
