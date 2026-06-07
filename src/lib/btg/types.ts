import type { AssetClass, AssetSubtype, Currency, DividendType } from "../types";

/** Posição normalizada extraída de um extrato. */
export interface ParsedPosition {
  ticker: string;
  name: string;
  class: AssetClass;
  subtype: AssetSubtype;
  currency: Currency;
  sector?: string;
  yahooSymbol?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  hasMarketData: boolean;
}

/** Provento normalizado extraído de um extrato. */
export interface ParsedDividend {
  ticker: string;
  type: DividendType;
  date: string; // YYYY-MM-DD
  total: number;
  currency: Currency;
  amountPerShare?: number;
}

export interface ParsedStatement {
  broker: string;
  asOf: string; // YYYY-MM-DD
  source?: string;
  positions: ParsedPosition[];
  dividends: ParsedDividend[];
}
