import * as XLSX from "xlsx";

import {
  classifyB3,
  classifyRendaFixa,
  parseDate,
  parseMoney,
} from "./classify";
import type { ParsedDividend, ParsedPosition, ParsedStatement } from "./types";
import type { DividendType } from "../types";

type Row = (string | number | null)[];

function cell(row: Row, i: number): string {
  const v = row[i];
  return v == null ? "" : String(v).trim();
}

/** Achata todas as planilhas do workbook numa lista única de linhas. */
function allRows(wb: XLSX.WorkBook): Row[] {
  const rows: Row[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const sheetRows = XLSX.utils.sheet_to_json<Row>(sheet, {
      header: 1,
      blankrows: false,
      defval: null,
    });
    rows.push(...sheetRows);
  }
  return rows;
}

/** Localiza o índice da coluna cujo cabeçalho casa com um dos rótulos. */
function colIndex(header: Row, labels: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = cell(header, i).toLowerCase();
    if (labels.some((l) => h.includes(l))) return i;
  }
  return -1;
}

function findSectionTag(row: Row): string | null {
  for (const c of row) {
    const s = c == null ? "" : String(c);
    const m = s.match(/(Posição|Movimentação|Detalhamento)\s*\\?>\s*(.+)/i);
    if (m) return m[2].trim();
  }
  return null;
}

const DIV_TYPE: Record<string, DividendType> = {
  RENDIMENTO: "rendimento",
  RENDIMENTOS: "rendimento",
  DIVIDENDOS: "dividendo",
  DIVIDENDO: "dividendo",
  "JUROS S/CAPITAL": "jcp",
  "JUROS S/ CAPITAL": "jcp",
  "JUROS S/CAPITAL PRÓPRIO": "jcp",
};

function matchDivType(text: string): DividendType | null {
  const t = text.toUpperCase();
  if (t.includes("RENDIMENTO")) return "rendimento";
  if (t.includes("DIVIDENDO")) return "dividendo";
  if (t.includes("JUROS S")) return "jcp";
  if (t.includes("CUPOM") || t.includes("AMORTIZA")) return "cupom";
  return null;
}

/**
 * Faz o parse do "Extrato da Conta Investimento" do BTG (renda fixa + renda
 * variável brasileira). Tolerante à estrutura multi-aba do export.
 */
export function parseBtgBr(
  wb: XLSX.WorkBook,
  opts: { asOf?: string; source?: string } = {}
): ParsedStatement {
  const rows = allRows(wb);
  const positions: ParsedPosition[] = [];
  const dividends: ParsedDividend[] = [];

  let asOf = opts.asOf ?? "";
  let section = "";
  let header: Row | null = null;

  for (const row of rows) {
    const tag = findSectionTag(row);
    if (tag) {
      section = tag;
      header = null;
      continue;
    }

    const joined = row.map((c) => (c == null ? "" : String(c))).join(" ");

    // Captura a data de referência do extrato.
    if (!opts.asOf && /Per[ií]odo de/.test(joined)) {
      const m = joined.match(/a\s+(\d{2}\/\d{2}\/\d{2,4})/);
      if (m) {
        // Expande ano de 2 dígitos: 18/04/26 → 18/04/2026.
        const norm = m[1].replace(/\/(\d{2})$/, "/20$1");
        asOf = parseDate(norm) ?? asOf;
      }
    }

    const first = cell(row, 0) || cell(row, 1);

    // Linha de cabeçalho de uma tabela?
    if (/^c[óo]digo$/i.test(first) || /^emissor$/i.test(first) || /^ativo$/i.test(first) || /^data$/i.test(first)) {
      header = row;
      continue;
    }
    if (!header) continue;

    // --- Posições de Ações / FIIs (cabeçalho tem "Preço Fechamento") ---
    if (
      (/Ações/i.test(section) || /Fundos Listados/i.test(section)) &&
      colIndex(header, ["fechamento"]) >= 0
    ) {
      const isFII = /Fundos Listados/i.test(section) || colIndex(header, ["tipo"]) >= 0;
      const code = cell(row, colIndex(header, ["código"]) >= 0 ? colIndex(header, ["código"]) : 1);
      if (!code || /total/i.test(code)) continue;
      const nameIdx = colIndex(header, ["ação", "ativo"]);
      const qtyIdx = colIndex(header, ["qtde", "quant"]);
      const closeIdx = colIndex(header, ["fechamento"]);
      const avgIdx = colIndex(header, ["médio", "medio"]);
      const qty = parseMoney(row[qtyIdx]);
      if (qty <= 0) continue;
      const close = parseMoney(row[closeIdx]);
      const avg = parseMoney(row[avgIdx]) || close;
      const cls = classifyB3(code, isFII);
      positions.push({
        ticker: code,
        name: nameIdx >= 0 ? cell(row, nameIdx) || code : code,
        ...cls,
        quantity: qty,
        avgPrice: avg,
        currentPrice: close,
      });
      continue;
    }

    // --- Posições de Renda Fixa / Tesouro (cabeçalho tem "Saldo Bruto", sem "Transação") ---
    if (
      /CDB|LCI|LCA|TESOURO|DEBÊNTUR|DEBENTUR/i.test(section) &&
      colIndex(header, ["transação", "descrição"]) < 0
    ) {
      // Só processa as linhas da tabela de posição (que têm Emissor + Ativo).
      const ativoIdx = colIndex(header, ["ativo"]);
      const qtyIdx = colIndex(header, ["quantidade"]);
      const priceIdx = colIndex(header, ["preço r$", "preço compra"]);
      const saldoIdx = colIndex(header, ["saldo bruto"]);
      if (ativoIdx < 0 || saldoIdx < 0) continue;
      const ativo = cell(row, ativoIdx);
      if (!ativo || /total/i.test(ativo)) continue;
      const qty = parseMoney(row[qtyIdx]) || 1;
      const saldo = parseMoney(row[saldoIdx]);
      if (saldo <= 0) continue;
      const cls = classifyRendaFixa(section);
      // Agrega: 1 "unidade" representando a posição inteira.
      positions.push({
        ticker: ativo,
        name: `${section} · ${ativo}`,
        ...cls,
        quantity: 1,
        avgPrice: parseMoney(row[priceIdx]) * qty || saldo,
        currentPrice: saldo,
      });
      continue;
    }

    // --- Proventos (movimentações) ---
    const dataIdx = colIndex(header, ["data"]);
    const transIdx = colIndex(header, ["transação", "descrição"]);
    if (dataIdx >= 0 && transIdx >= 0) {
      const date = parseDate(row[dataIdx]);
      const trans = cell(row, transIdx);
      const type = matchDivType(trans);
      if (date && type) {
        const codeIdx = colIndex(header, ["código"]);
        const grossIdx = colIndex(header, ["valor bruto", "valor líquido", "valor liquido"]);
        const code = codeIdx >= 0 ? cell(row, codeIdx) : "";
        const total = parseMoney(row[grossIdx]);
        if (code && total > 0) {
          dividends.push({
            ticker: code,
            type,
            date,
            total,
            currency: "BRL",
          });
        }
      }
    }
  }

  return {
    broker: "BTG",
    asOf: asOf || new Date().toISOString().slice(0, 10),
    source: opts.source,
    positions,
    dividends,
  };
}

export { matchDivType, DIV_TYPE };
