import { classifyIntl, intlYahooSymbol } from "./classify";
import type { ParsedPosition, ParsedStatement } from "./types";

interface IntlPosicaoRaw {
  ticker: string;
  quantidade: number;
  classe: string; // "Stock" | "ETF" | "REIT"
  corretora?: string;
}

interface IntlExportRaw {
  metadata?: { data?: string; source?: string };
  posicoes: IntlPosicaoRaw[];
}

/**
 * Parse da carteira internacional (BTG Internacional / Avenue) exportada em JSON.
 * O export traz ticker/quantidade/classe; preço médio e cotação atual são
 * preenchidos pelo Yahoo Finance na sincronização (Fase 2b).
 */
export function parseBtgIntl(
  json: unknown,
  opts: { asOf?: string; source?: string } = {}
): ParsedStatement {
  const data = json as IntlExportRaw;
  const positions: ParsedPosition[] = (data.posicoes ?? [])
    .filter((p) => p.quantidade > 0)
    .map((p) => {
      const cls = classifyIntl(p.classe);
      return {
        ticker: p.ticker,
        name: p.ticker,
        ...cls,
        yahooSymbol: intlYahooSymbol(p.ticker),
        quantity: p.quantidade,
        avgPrice: 0, // preenchido pelo Yahoo
        currentPrice: 0, // preenchido pelo Yahoo
      } satisfies ParsedPosition;
    });

  return {
    broker: "BTG Internacional",
    asOf: opts.asOf ?? data.metadata?.data ?? new Date().toISOString().slice(0, 10),
    source: opts.source ?? data.metadata?.source,
    positions,
    dividends: [],
  };
}
