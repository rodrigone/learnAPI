"use client";

import * as React from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { StatCard } from "@/components/dashboard/stat-card";
import { PriceLineChart } from "@/components/charts/price-line-chart";
import { PeAreaChart } from "@/components/charts/pe-area-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { seriesReturn, sliceByPeriod } from "@/lib/portfolio";
import {
  ASSET_SUBTYPE_LABELS,
  type PeriodKey,
  type Portfolio,
} from "@/lib/types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { TrendingUp, Activity, Layers } from "lucide-react";

export function CotacoesView({ portfolio }: { portfolio: Portfolio }) {
  const marketAssets = React.useMemo(
    () => portfolio.assets.filter((a) => a.hasMarketData),
    [portfolio]
  );
  const [assetId, setAssetId] = React.useState(marketAssets[0].id);
  const [period, setPeriod] = React.useState<PeriodKey>("1y");

  const asset = marketAssets.find((a) => a.id === assetId)!;
  const fullPrices = portfolio.priceSeries[assetId] ?? [];
  const prices = sliceByPeriod(fullPrices, period);
  const fullPe = portfolio.peSeries[assetId];
  const pe = fullPe ? sliceByPeriod(fullPe, period) : undefined;

  const periodReturn = seriesReturn(prices);
  const current = fullPrices.at(-1)?.close ?? 0;
  const peAvg = pe?.length
    ? pe.reduce((s, x) => s + x.pe, 0) / pe.length
    : undefined;
  const peCurrent = fullPe?.at(-1)?.pe;

  // Agrupa o seletor por classe internacional/BR.
  const brAssets = marketAssets.filter((a) => a.currency === "BRL");
  const intlAssets = marketAssets.filter((a) => a.currency === "USD");

  return (
    <>
      <PageHeader
        title="Cotações & múltiplos"
        description="Preço histórico e evolução do P/L das empresas em que você investe"
      >
        <PeriodFilter value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={assetId} onValueChange={setAssetId}>
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Brasil (B3)</SelectLabel>
              {brAssets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.ticker} — {a.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Internacional</SelectLabel>
              {intlAssets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.ticker} — {a.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{ASSET_SUBTYPE_LABELS[asset.subtype]}</Badge>
          {asset.sector ? <Badge variant="secondary">{asset.sector}</Badge> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Cotação atual"
          value={formatCurrency(current, asset.currency)}
          icon={<TrendingUp className="size-4" />}
          hint={asset.yahooSymbol}
        />
        <StatCard
          label={`Variação no período`}
          value={formatPercent(periodReturn)}
          delta={periodReturn}
          deltaLabel={formatPercent(periodReturn)}
          icon={<Activity className="size-4" />}
        />
        <StatCard
          label="P/L atual"
          value={peCurrent ? `${formatNumber(peCurrent, 1)}x` : "—"}
          icon={<Layers className="size-4" />}
          hint={peAvg ? `média ${formatNumber(peAvg, 1)}x` : "sem dado de lucro"}
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Preço da ação</CardTitle>
          <CardDescription>
            {asset.ticker} · cotação de fechamento ·{" "}
            {asset.currency === "USD" ? "dólar" : "real"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceLineChart
            data={prices}
            currency={asset.currency}
            className="aspect-auto h-[320px] w-full"
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Múltiplo Preço / Lucro (P/L)</CardTitle>
          <CardDescription>
            {pe
              ? "Evolução do múltiplo — útil para avaliar se a ação está cara ou barata frente à média"
              : "Este ativo não distribui resultado por ação (FII/ETF) — sem múltiplo P/L"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pe ? (
            <PeAreaChart
              data={pe}
              average={peAvg}
              className="aspect-auto h-[280px] w-full"
            />
          ) : (
            <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
              Sem dados de P/L para {asset.ticker}.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
