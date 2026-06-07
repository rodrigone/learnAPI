// ---------------------------------------------------------------------------
// Modelo de domínio do dashboard de investimentos.
//
// Estes tipos são o "contrato" da aplicação: a UI consome eles hoje a partir de
// dados mock (ver mock-data.ts) e, na próxima fase, eles serão preenchidos pelo
// import do extrato do BTG (Excel) + cotações/fundamentos do Yahoo Finance.
// ---------------------------------------------------------------------------

export type Currency = "BRL" | "USD";

/** Classe macro de ativo — base da visão de alocação da carteira. */
export type AssetClass =
  | "renda_fixa"
  | "tesouro_direto"
  | "rv_br" // renda variável brasileira
  | "rv_intl" // renda variável internacional
  | "fundo" // fundos de investimento
  | "previdencia"; // previdência privada (preparado, ainda sem posição)

/** Subtipo do ativo — granularidade dentro de cada classe. */
export type AssetSubtype =
  // Renda variável BR
  | "acao_br"
  | "fii" // fundos imobiliários / crédito imobiliário
  | "etf_br"
  // Renda variável internacional
  | "stock"
  | "reit"
  | "etf"
  // Renda fixa
  | "cdb"
  | "lci_lca"
  | "debenture"
  // Tesouro Direto
  | "tesouro_selic"
  | "tesouro_ipca"
  | "tesouro_prefixado"
  // Fundos
  | "fundo"
  | "previdencia";

export interface Asset {
  id: string;
  /** Código de negociação (PETR4, AAPL, MXRF11, ...). */
  ticker: string;
  /** Símbolo no Yahoo Finance (PETR4.SA, AAPL, O). Para RF/fundos é opcional. */
  yahooSymbol?: string;
  name: string;
  class: AssetClass;
  subtype: AssetSubtype;
  currency: Currency;
  sector?: string;
  /** Marca ativos de renda variável (têm cotação, gráfico de preço e P/L). */
  hasMarketData?: boolean;
}

/** Posição consolidada atual de um ativo na carteira. */
export interface Position {
  assetId: string;
  quantity: number;
  /** Preço médio de compra, na moeda do ativo. */
  avgPrice: number;
  /** Cotação/preço atual, na moeda do ativo. */
  currentPrice: number;
}

export interface PricePoint {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  close: number;
}

export interface PeRatioPoint {
  date: string;
  /** Múltiplo preço/lucro (P/L). */
  pe: number;
}

export type DividendType = "dividendo" | "jcp" | "rendimento" | "cupom";

export interface Dividend {
  id: string;
  assetId: string;
  type: DividendType;
  /** Data de pagamento (ISO). */
  date: string;
  amountPerShare?: number;
  /** Valor total recebido, na moeda do ativo. */
  total: number;
  currency: Currency;
}

export interface BalanceSheetYear {
  year: number;
  revenue: number; // receita líquida
  netIncome: number; // lucro líquido
  totalAssets: number; // ativo total
  totalLiabilities: number; // passivo total
  equity: number; // patrimônio líquido
}

export interface BalanceSheet {
  assetId: string;
  /** Em milhões da moeda do ativo. */
  unit: "milhões";
  years: BalanceSheetYear[];
}

export type PeriodKey = "6m" | "1y" | "2y" | "3y" | "5y";

export interface Period {
  key: PeriodKey;
  label: string;
  months: number;
}

export const PERIODS: Period[] = [
  { key: "6m", label: "6 meses", months: 6 },
  { key: "1y", label: "1 ano", months: 12 },
  { key: "2y", label: "2 anos", months: 24 },
  { key: "3y", label: "3 anos", months: 36 },
  { key: "5y", label: "5 anos", months: 60 },
];

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  renda_fixa: "Renda Fixa",
  tesouro_direto: "Tesouro Direto",
  rv_br: "Renda Variável BR",
  rv_intl: "Renda Variável Internacional",
  fundo: "Fundos de Investimento",
  previdencia: "Previdência Privada",
};

export const ASSET_SUBTYPE_LABELS: Record<AssetSubtype, string> = {
  acao_br: "Ações",
  fii: "Fundos Imobiliários",
  etf_br: "ETF",
  stock: "Stocks",
  reit: "REITs",
  etf: "ETFs",
  cdb: "CDB",
  lci_lca: "LCI/LCA",
  debenture: "Debêntures",
  tesouro_selic: "Tesouro Selic",
  tesouro_ipca: "Tesouro IPCA+",
  tesouro_prefixado: "Tesouro Prefixado",
  fundo: "Fundo",
  previdencia: "Previdência",
};

export const DIVIDEND_TYPE_LABELS: Record<DividendType, string> = {
  dividendo: "Dividendo",
  jcp: "Juros s/ Capital Próprio",
  rendimento: "Rendimento",
  cupom: "Cupom",
};

/** Snapshot completo da carteira — o que a aplicação consome. */
export interface Portfolio {
  /** Data de referência do extrato (ISO). */
  asOf: string;
  /** Câmbio USD→BRL usado para consolidar valores em reais. */
  usdToBrl: number;
  assets: Asset[];
  positions: Position[];
  priceSeries: Record<string, PricePoint[]>;
  peSeries: Record<string, PeRatioPoint[]>;
  dividends: Dividend[];
  balanceSheets: Record<string, BalanceSheet>;
}
