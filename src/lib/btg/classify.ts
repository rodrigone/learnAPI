import type { AssetClass, AssetSubtype, Currency } from "../types";

export interface Classification {
  class: AssetClass;
  subtype: AssetSubtype;
  currency: Currency;
  yahooSymbol?: string;
  hasMarketData: boolean;
}

/** Converte um número de string pt-BR/en-US do extrato ("1,234.56") em number. */
export function parseMoney(value: unknown): number {
  if (typeof value === "number") return value;
  if (value == null) return 0;
  const s = String(value).trim();
  if (s === "" || s === "-") return 0;
  // Remove separador de milhar "," e mantém o ponto decimal (formato BTG en-US).
  const cleaned = s.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Converte data dd/mm/yyyy → yyyy-mm-dd. */
export function parseDate(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Mapeia uma ação da B3 pelo código (ALOS3, ITSA4, BPAC11...) para FII vs ação. */
export function classifyB3(code: string, isFII = false): Classification {
  if (isFII) {
    return {
      class: "rv_br",
      subtype: "fii",
      currency: "BRL",
      yahooSymbol: `${code}.SA`,
      hasMarketData: true,
    };
  }
  return {
    class: "rv_br",
    subtype: "acao_br",
    currency: "BRL",
    yahooSymbol: `${code}.SA`,
    hasMarketData: true,
  };
}

/** Mapeia um produto de renda fixa / Tesouro pela seção do extrato. */
export function classifyRendaFixa(section: string): Classification {
  const s = section.toUpperCase();
  if (s.includes("LTN") || s.includes("PREFIXAD"))
    return { class: "tesouro_direto", subtype: "tesouro_prefixado", currency: "BRL", hasMarketData: false };
  if (s.includes("NTN-B") || s.includes("NTNB") || s.includes("TESOURO"))
    return { class: "tesouro_direto", subtype: "tesouro_ipca", currency: "BRL", hasMarketData: false };
  if (s.includes("LCI") || s.includes("LCA"))
    return { class: "renda_fixa", subtype: "lci_lca", currency: "BRL", hasMarketData: false };
  if (s.includes("DEBÊNTUR") || s.includes("DEBENTUR"))
    return { class: "renda_fixa", subtype: "debenture", currency: "BRL", hasMarketData: false };
  // CDB e demais
  return { class: "renda_fixa", subtype: "cdb", currency: "BRL", hasMarketData: false };
}

/** Mapeia um ativo internacional (BTG Internacional / Avenue). */
export function classifyIntl(classe: string): Classification {
  const c = classe.toLowerCase();
  const subtype: AssetSubtype = c.includes("reit")
    ? "reit"
    : c.includes("etf")
      ? "etf"
      : "stock";
  return { class: "rv_intl", subtype, currency: "USD", hasMarketData: true };
}

/** Símbolo do Yahoo para ticker internacional (BRK.B → BRK-B). */
export function intlYahooSymbol(ticker: string) {
  return ticker.replace(/\./g, "-");
}
