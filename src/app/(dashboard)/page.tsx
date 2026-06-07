import Link from "next/link";
import { Wallet, TrendingUp, Percent, Coins, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ValueAreaChart } from "@/components/charts/value-area-chart";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPortfolio } from "@/lib/portfolio-repo";
import {
  allocationByClass,
  enrichPositions,
  incomeByAsset,
  portfolioTotals,
  portfolioValueSeries,
} from "@/lib/portfolio";
import { DIVIDEND_TYPE_LABELS } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/format";
import { dividendToBRL } from "@/lib/portfolio";

export default async function OverviewPage() {
  const portfolio = await getPortfolio();
  const enriched = enrichPositions(portfolio);
  const totals = portfolioTotals(enriched, portfolio);
  const valueSeries = portfolioValueSeries(portfolio);
  const allocation = allocationByClass(enriched);
  const topPositions = enriched.slice(0, 5);
  const recentDividends = portfolio.dividends.slice(0, 6);
  const topIncome = incomeByAsset(portfolio, 12).slice(0, 4);

  return (
    <>
      <PageHeader
        title="Visão Geral"
        description={`Carteira consolidada em BRL · atualizado em ${formatDate(
          portfolio.asOf
        )}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Patrimônio total"
          value={formatCurrency(totals.marketValue)}
          delta={totals.pnlPct}
          deltaLabel={formatPercent(totals.pnlPct)}
          hint="no acumulado"
          icon={<Wallet className="size-4" />}
        />
        <StatCard
          label="Total investido"
          value={formatCurrency(totals.invested)}
          hint={`${enriched.length} ativos`}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Resultado"
          value={formatCurrency(totals.pnl)}
          delta={totals.pnlPct}
          deltaLabel={formatPercent(totals.pnlPct)}
          icon={<Percent className="size-4" />}
        />
        <StatCard
          label="Proventos (12m)"
          value={formatCurrency(totals.income12m)}
          hint="recebidos"
          icon={<Coins className="size-4" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução do patrimônio</CardTitle>
            <CardDescription>Valor de mercado da carteira (5 anos)</CardDescription>
          </CardHeader>
          <CardContent>
            <ValueAreaChart data={valueSeries} className="aspect-auto h-[280px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alocação por classe</CardTitle>
            <CardDescription>Distribuição do patrimônio</CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationDonut
              data={allocation}
              centerLabel="patrimônio"
              className="mx-auto aspect-square h-[220px]"
            />
            <div className="mt-2 space-y-1.5">
              {allocation.map((slice, i) => (
                <div
                  key={slice.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor: `var(--chart-${(i % 5) + 1})`,
                      }}
                    />
                    {slice.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {(slice.weight * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link href="/alocacao">
                Ver alocação completa <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Maiores posições</CardTitle>
              <CardDescription>Por valor de mercado</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/carteira">
                Ver carteira <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Peso</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPositions.map((p) => (
                  <TableRow key={p.asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.asset.ticker}</span>
                        <Badge variant="outline" className="font-normal">
                          {p.asset.currency}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {p.asset.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.marketValueBRL)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {(p.weight * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.pnl >= 0 ? "gain" : "loss"}>
                        {formatPercent(p.pnlPct)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Proventos recentes</CardTitle>
              <CardDescription>Últimos recebimentos</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/proventos">
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDividends.map((d) => {
              const asset = portfolio.assets.find((a) => a.id === d.assetId)!;
              return (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{asset.ticker}</span>
                    <span className="text-muted-foreground text-xs">
                      {DIVIDEND_TYPE_LABELS[d.type]} · {formatDate(d.date)}
                    </span>
                  </div>
                  <span className="text-gain text-sm font-medium tabular-nums">
                    +{formatCurrency(dividendToBRL(d, portfolio.usdToBrl))}
                  </span>
                </div>
              );
            })}
            <Separator />
            <div className="text-muted-foreground space-y-1.5 text-xs">
              <p className="font-medium">Top pagadores (12m)</p>
              {topIncome.map((t) => (
                <div key={t.asset.id} className="flex justify-between">
                  <span>{t.asset.ticker}</span>
                  <span className="tabular-nums">{formatCurrency(t.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
