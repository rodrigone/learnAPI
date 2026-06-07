import type { AssetClass, AssetSubtype, Currency } from "./types";

// ---------------------------------------------------------------------------
// Carteira REAL (origem: extrato BTG Pactual + BTG Internacional, ref. abril/26).
//
// Sem dados pessoais (CPF, conta, nome) — apenas as posições, que são o conteúdo
// do dashboard. Preço médio (avg) vem do custo de aquisição do extrato; preço
// atual (current) vem do fechamento do extrato. Para os ativos internacionais,
// o preço atual é uma estimativa que será substituída pela cotação real do
// Yahoo Finance na sincronização (Fase 2b).
//
// Este arquivo é a fonte de verdade das POSIÇÕES. As séries de preço/P-L/balanço
// ainda são geradas sinteticamente em mock-data.ts até a integração com o Yahoo.
// ---------------------------------------------------------------------------

export interface RawHolding {
  ticker: string;
  name: string;
  class: AssetClass;
  subtype: AssetSubtype;
  currency: Currency;
  sector?: string;
  yahooSymbol?: string;
  quantity: number;
  /** Preço médio de compra, na moeda do ativo. */
  avgPrice: number;
  /** Preço atual/fechamento, na moeda do ativo. */
  currentPrice: number;
  hasMarketData: boolean;
  /** P/L base para gerar a série sintética (renda variável com lucro). */
  peBase?: number;
}

export function holdingId(ticker: string) {
  return ticker.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// --- Ações brasileiras (B3) -------------------------------------------------
const acoesBR: RawHolding[] = [
  { ticker: "ALOS3", name: "Allos ON", sector: "Shoppings", quantity: 240, avgPrice: 31.73, currentPrice: 33.8, peBase: 16 },
  { ticker: "AZZA3", name: "Azzas 2154 ON", sector: "Varejo", quantity: 250, avgPrice: 22.46, currentPrice: 22.12, peBase: 14 },
  { ticker: "BBAS3", name: "Banco do Brasil ON", sector: "Bancos", quantity: 640, avgPrice: 24.73, currentPrice: 24.4, peBase: 4.5 },
  { ticker: "BPAC11", name: "BTG Pactual UNT", sector: "Bancos", quantity: 175, avgPrice: 57.27, currentPrice: 63.6, peBase: 11 },
  { ticker: "BRAV3", name: "Brava Energia ON", sector: "Petróleo & Gás", quantity: 300, avgPrice: 20.47, currentPrice: 19.55, peBase: 7 },
  { ticker: "EGIE3", name: "Engie Brasil ON", sector: "Energia", quantity: 532, avgPrice: 33.28, currentPrice: 37.51, peBase: 9 },
  { ticker: "EQTL3", name: "Equatorial ON", sector: "Energia", quantity: 550, avgPrice: 40.5, currentPrice: 45.19, peBase: 12 },
  { ticker: "HYPE3", name: "Hypera ON", sector: "Saúde", quantity: 135, avgPrice: 23.77, currentPrice: 23.45, peBase: 9 },
  { ticker: "ITSA4", name: "Itaúsa PN", sector: "Holding / Bancos", quantity: 1737, avgPrice: 13.92, currentPrice: 14.81, peBase: 8 },
  { ticker: "KEPL3", name: "Kepler Weber ON", sector: "Bens Industriais", quantity: 500, avgPrice: 8.16, currentPrice: 8.09, peBase: 7 },
  { ticker: "KLBN4", name: "Klabin PN", sector: "Papel & Celulose", quantity: 4444, avgPrice: 3.88, currentPrice: 3.8, peBase: 10 },
  { ticker: "MRVE3", name: "MRV Engenharia ON", sector: "Construção", quantity: 673, avgPrice: 7.93, currentPrice: 7.69, peBase: 8 },
  { ticker: "PRIO3", name: "PRIO ON", sector: "Petróleo & Gás", quantity: 765, avgPrice: 64.1, currentPrice: 61.66, peBase: 6 },
  { ticker: "PSSA3", name: "Porto Seguro ON", sector: "Seguros", quantity: 712, avgPrice: 50.54, currentPrice: 54.31, peBase: 8.5 },
  { ticker: "WEGE3", name: "WEG ON", sector: "Bens Industriais", quantity: 270, avgPrice: 52.77, currentPrice: 48.65, peBase: 30 },
].map((h) => ({
  ...h,
  class: "rv_br" as AssetClass,
  subtype: "acao_br" as AssetSubtype,
  currency: "BRL" as Currency,
  yahooSymbol: `${h.ticker}.SA`,
  hasMarketData: true,
}));

// --- Fundos imobiliários (FII) ----------------------------------------------
const fiis: RawHolding[] = [
  { ticker: "BTLG11", name: "BTLG Logística FII", sector: "Logística", quantity: 67, avgPrice: 103.85, currentPrice: 104.08 },
  { ticker: "HGLG11", name: "CSHG Logística FII", sector: "Logística", quantity: 83, avgPrice: 156.9, currentPrice: 157.54 },
  { ticker: "RECR11", name: "REC Recebíveis FII", sector: "Crédito Imobiliário", quantity: 150, avgPrice: 80.8, currentPrice: 82.72 },
  { ticker: "TGAR11", name: "TG Ativo Real FII", sector: "Crédito / Agro", quantity: 290, avgPrice: 70.4, currentPrice: 70.53 },
  { ticker: "VRTA11", name: "Fator Verità FII", sector: "Crédito Imobiliário", quantity: 112, avgPrice: 77.4, currentPrice: 79.12 },
].map((h) => ({
  ...h,
  class: "rv_br" as AssetClass,
  subtype: "fii" as AssetSubtype,
  currency: "BRL" as Currency,
  yahooSymbol: `${h.ticker}.SA`,
  hasMarketData: true,
}));

// --- Renda fixa e Tesouro Direto (posições agregadas, qty = 1) ---------------
// Para RF/Tesouro, avgPrice = valor de compra e currentPrice = saldo bruto do
// extrato (a "quantidade" é 1 unidade representando a posição inteira).
const rendaFixa: RawHolding[] = [
  { ticker: "CDB-BTG-KYJEB", name: "CDB BTG Pactual 100% CDI · 2028", sector: "Bancário", class: "renda_fixa", subtype: "cdb", currency: "BRL", quantity: 1, avgPrice: 17377.01, currentPrice: 17386.42, hasMarketData: false },
  { ticker: "CDB-BTG-KOTVL", name: "CDB BTG Pactual 100% CDI · 2028", sector: "Bancário", class: "renda_fixa", subtype: "cdb", currency: "BRL", quantity: 1, avgPrice: 88641.09, currentPrice: 88737.26, hasMarketData: false },
  { ticker: "LCI-BTG-2027", name: "LCI BTG Pactual 88% CDI · 2027", sector: "Imobiliário", class: "renda_fixa", subtype: "lci_lca", currency: "BRL", quantity: 1, avgPrice: 10000, currentPrice: 10009.55, hasMarketData: false },
];

const tesouro: RawHolding[] = [
  { ticker: "LTN-2031", name: "Tesouro Prefixado 2031 (LTN)", sector: "Prefixado", class: "tesouro_direto", subtype: "tesouro_prefixado", currency: "BRL", quantity: 1, avgPrice: 11061.59, currentPrice: 13924.93, hasMarketData: false },
  { ticker: "NTNB1-2084", name: "Tesouro IPCA+ Juros Sem. 2084 (NTN-B1)", sector: "Inflação", class: "tesouro_direto", subtype: "tesouro_ipca", currency: "BRL", quantity: 1, avgPrice: 44196.32, currentPrice: 53621.69, hasMarketData: false },
  { ticker: "NTNB-PRINC", name: "Tesouro IPCA+ Principal (NTN-B Princ.)", sector: "Inflação", class: "tesouro_direto", subtype: "tesouro_ipca", currency: "BRL", quantity: 1, avgPrice: 37908.96, currentPrice: 40226.19, hasMarketData: false },
];

// --- Renda variável internacional (BTG Internacional, em USD) ----------------
// Preços em USD são estimativas (abril/26) — serão substituídos pelo Yahoo.
const intl: RawHolding[] = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Tecnologia", quantity: 7, avgPrice: 192, currentPrice: 214, peBase: 32 },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Tecnologia", quantity: 14.41, avgPrice: 415, currentPrice: 462, peBase: 35 },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumo / Tech", quantity: 21, avgPrice: 178, currentPrice: 205, peBase: 40 },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Tecnologia", quantity: 16, avgPrice: 158, currentPrice: 178, peBase: 24 },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Tecnologia", quantity: 6, avgPrice: 495, currentPrice: 600, peBase: 27 },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Automotivo", quantity: 6, avgPrice: 215, currentPrice: 250, peBase: 70 },
  { ticker: "CRM", name: "Salesforce Inc.", sector: "Software", quantity: 4, avgPrice: 272, currentPrice: 295, peBase: 45 },
  { ticker: "DIS", name: "Walt Disney Co.", sector: "Mídia", quantity: 8, avgPrice: 102, currentPrice: 112, peBase: 22 },
  { ticker: "BRK.B", name: "Berkshire Hathaway B", sector: "Holding", yahooSymbol: "BRK-B", quantity: 6, avgPrice: 412, currentPrice: 485, peBase: 23 },
  { ticker: "BABA", name: "Alibaba Group", sector: "Consumo / Tech", quantity: 2, avgPrice: 82, currentPrice: 112, peBase: 18 },
  { ticker: "MELI", name: "MercadoLibre Inc.", sector: "E-commerce", quantity: 3, avgPrice: 1650, currentPrice: 2100, peBase: 55 },
  { ticker: "SHOP", name: "Shopify Inc.", sector: "E-commerce", quantity: 2, avgPrice: 72, currentPrice: 96, peBase: 60 },
  { ticker: "SE", name: "Sea Limited", sector: "Consumo / Tech", quantity: 2, avgPrice: 65, currentPrice: 140, peBase: 50 },
  { ticker: "NU", name: "Nu Holdings", sector: "Bancos", quantity: 217, avgPrice: 11, currentPrice: 13, peBase: 20 },
  { ticker: "INTR", name: "Inter & Co", sector: "Bancos", quantity: 588, avgPrice: 5.2, currentPrice: 6.5, peBase: 15 },
  { ticker: "STNE", name: "StoneCo Ltd.", sector: "Pagamentos", quantity: 200, avgPrice: 12, currentPrice: 13.5, peBase: 12 },
  { ticker: "XP", name: "XP Inc.", sector: "Serviços Financeiros", quantity: 40, avgPrice: 18, currentPrice: 17, peBase: 10 },
].map((h) => ({
  ...h,
  class: "rv_intl" as AssetClass,
  subtype: "stock" as AssetSubtype,
  currency: "USD" as Currency,
  yahooSymbol: h.yahooSymbol ?? h.ticker,
  hasMarketData: true,
}));

const intlEtf: RawHolding[] = [
  { ticker: "IVV", name: "iShares Core S&P 500 ETF", sector: "Índice", quantity: 10, avgPrice: 520, currentPrice: 600 },
].map((h) => ({
  ...h,
  class: "rv_intl" as AssetClass,
  subtype: "etf" as AssetSubtype,
  currency: "USD" as Currency,
  yahooSymbol: h.ticker,
  hasMarketData: true,
}));

export const holdings: RawHolding[] = [
  ...acoesBR,
  ...fiis,
  ...rendaFixa,
  ...tesouro,
  ...intl,
  ...intlEtf,
];

/** Câmbio USD→BRL de referência (será atualizado pelo Yahoo na Fase 2b). */
export const USD_BRL = 5.42;

/** Data de referência do extrato. */
export const AS_OF = "2026-04-18";
