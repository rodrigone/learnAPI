"use client";

import * as React from "react";
import { DollarSign, TrendingUp, Percent, Landmark } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { BalanceBarChart } from "@/components/charts/balance-bar-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { portfolio } from "@/lib/mock-data";
import { formatMillions, formatNumber, formatPercent } from "@/lib/format";

export default function BalancosPage() {
  const companies = React.useMemo(
    () =>
      portfolio.assets.filter((a) => portfolio.balanceSheets[a.id]),
    []
  );
  const [assetId, setAssetId] = React.useState(companies[0].id);

  const asset = companies.find((a) => a.id === assetId)!;
  const bs = portfolio.balanceSheets[assetId];
  const years = bs.years;
  const last = years[years.length - 1];
  const first = years[0];
  const margin = (last.netIncome / last.revenue) * 100;
  const revenueCagr =
    (Math.pow(last.revenue / first.revenue, 1 / (years.length - 1)) - 1) * 100;

  return (
    <>
      <PageHeader
        title="Balanços"
        description="Evolução de receita, lucro e estrutura patrimonial das empresas"
      >
        <Select value={assetId} onValueChange={setAssetId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.ticker} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Receita ${last.year}`}
          value={formatMillions(last.revenue, asset.currency)}
          delta={revenueCagr}
          deltaLabel={`${formatPercent(revenueCagr)} a.a.`}
          hint="CAGR 5a"
          icon={<DollarSign className="size-4" />}
        />
        <StatCard
          label={`Lucro líquido ${last.year}`}
          value={formatMillions(last.netIncome, asset.currency)}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Margem líquida"
          value={`${formatNumber(margin, 1)}%`}
          icon={<Percent className="size-4" />}
        />
        <StatCard
          label="Patrimônio líquido"
          value={formatMillions(last.equity, asset.currency)}
          icon={<Landmark className="size-4" />}
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Receita e lucro líquido</CardTitle>
          <CardDescription>
            {asset.name} · valores em milhões de {asset.currency}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BalanceBarChart
            data={years}
            currency={asset.currency}
            className="aspect-auto h-[320px] w-full"
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Demonstrativo anual</CardTitle>
          <CardDescription>Em milhões de {asset.currency}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Lucro líquido</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Ativo total</TableHead>
                <TableHead className="text-right">Passivo</TableHead>
                <TableHead className="text-right">Patrim. líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years
                .slice()
                .reverse()
                .map((y) => {
                  const m = (y.netIncome / y.revenue) * 100;
                  return (
                    <TableRow key={y.year}>
                      <TableCell className="font-medium">{y.year}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(y.revenue, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(y.netIncome, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={m >= 0 ? "gain" : "loss"}>
                          {formatNumber(m, 1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {formatNumber(y.totalAssets, 0)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {formatNumber(y.totalLiabilities, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(y.equity, 0)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
