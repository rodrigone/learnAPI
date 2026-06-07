import type { Currency } from "./types";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const usd = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: number, currency: Currency = "BRL") {
  return (currency === "USD" ? usd : brl).format(value);
}

/** Versão compacta para eixos de gráfico (R$ 1,2 mi / R$ 350 mil). */
export function formatCompact(value: number, currency: Currency = "BRL") {
  const symbol = currency === "USD" ? "US$" : "R$";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}${symbol} ${(abs / 1_000_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mi`;
  if (abs >= 1_000)
    return `${sign}${symbol} ${(abs / 1_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 0,
    })} mil`;
  return `${sign}${symbol} ${abs.toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  })}`;
}

/** Formata um valor já expresso em milhões (ex.: balanços) → "R$ 480 bi". */
export function formatMillions(
  valueInMillions: number,
  currency: Currency = "BRL"
) {
  const symbol = currency === "USD" ? "US$" : "R$";
  const abs = Math.abs(valueInMillions);
  const sign = valueInMillions < 0 ? "-" : "";
  if (abs >= 1_000_000)
    return `${sign}${symbol} ${(abs / 1_000_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} tri`;
  if (abs >= 1_000)
    return `${sign}${symbol} ${(abs / 1_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} bi`;
  return `${sign}${symbol} ${abs.toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  })} mi`;
}

export function formatPercent(value: number, digits = 2) {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatNumber(value: number, digits = 2) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatQuantity(value: number) {
  // Cotas/ações podem ser fracionárias (ativos internacionais).
  const digits = Number.isInteger(value) ? 0 : 2;
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: 6,
  });
}

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatMonthYear(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}
