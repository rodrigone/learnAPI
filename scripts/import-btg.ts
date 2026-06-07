import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import * as XLSX from "xlsx";

import { parseBtgBr } from "../src/lib/btg/parse-br";
import { parseBtgIntl } from "../src/lib/btg/parse-intl";
import { upsertStatement } from "./upsert-statement";
import { prisma } from "../src/lib/db";

/**
 * CLI: importa um extrato BTG para o banco.
 *
 *   pnpm import data/private/btg_br_2026-04-18.xlsx
 *   pnpm import data/private/btg_intl_posicoes.json
 */
async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Uso: pnpm import <caminho-do-extrato.(xlsx|json)>");
    process.exit(1);
  }

  const ext = extname(file).toLowerCase();
  const source = basename(file);

  const stmt =
    ext === ".json"
      ? parseBtgIntl(JSON.parse(readFileSync(file, "utf8")), { source })
      : parseBtgBr(XLSX.readFile(file), { source });

  if (stmt.positions.length === 0) {
    console.warn("⚠️  Nenhuma posição encontrada — verifique o formato do arquivo.");
  }

  const result = await upsertStatement(stmt);
  console.log(
    `✓ Importado ${source} (${stmt.broker}, ref. ${stmt.asOf}): ` +
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
