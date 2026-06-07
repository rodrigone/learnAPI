import { Coins, CalendarDays, Trophy } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { IncomeBarChart } from "@/components/charts/income-bar-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { portfolio } from "@/lib/mock-data";
import {
  dividendToBRL,
  incomeByAsset,
  incomeByMonth,
  incomeInLastMonths,
} from "@/lib/portfolio";
import {
  DIVIDEND_TYPE_LABELS,
  type DividendType,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata = { title: "Proventos · Investly" };

const TYPE_COLORS: Record<DividendType, string> = {
  dividendo: "var(--chart-1)",
  jcp: "var(--chart-2)",
  rendimento: "var(--chart-4)",
  cupom: "var(--chart-5)",
};

export default function ProventosPage() {
  const fx = portfolio.usdToBrl;
  const monthly = incomeByMonth(portfolio, 12);
  const total12m = incomeInLastMonths(portfolio, 12);
  const avgMonth = monthly.length ? total12m / monthly.length : 0;
  const topPayers = incomeByAsset(portfolio, 12);

  // Total por tipo (12m).
  const byType = new Map<DividendType, number>();
  const cutoff = new Date("2025-06-01").toISOString().slice(0, 10);
  for (const d of portfolio.dividends) {
    if (d.date < cutoff) continue;
    byType.set(d.type, (byType.get(d.type) ?? 0) + dividendToBRL(d, fx));
  }
  const typeRows = (Object.keys(DIVIDEND_TYPE_LABELS) as DividendType[])
    .map((t) => ({ type: t, total: byType.get(t) ?? 0 }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const recent = portfolio.dividends.slice(0, 25);

  return (
    <>
      <PageHeader
        title="Proventos"
        description="Dividendos, juros sobre capital próprio, rendimentos e cupons recebidos"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Recebido (12m)"
          value={formatCurrency(total12m)}
          icon={<Coins className="size-4" />}
        />
        <StatCard
          label="Média mensal"
          value={formatCurrency(avgMonth)}
          icon={<CalendarDays className="size-4" />}
        />
        <StatCard
          label="Maior pagador (12m)"
          value={topPayers[0]?.asset.ticker ?? "—"}
          hint={topPayers[0] ? formatCurrency(topPayers[0].total) : ""}
          icon={<Trophy className="size-4" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Proventos por mês</CardTitle>
            <CardDescription>Últimos 12 meses, por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeBarChart
              data={monthly}
              className="aspect-auto h-[300px] w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por tipo</CardTitle>
            <CardDescription>Composição dos proventos (12m)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {typeRows.map((r) => (
              <div key={r.type}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[r.type] }}
                    />
                    {DIVIDEND_TYPE_LABELS[r.type]}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(r.total)}
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(r.total / total12m) * 100}%`,
                      backgroundColor: TYPE_COLORS[r.type],
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Histórico de recebimentos</CardTitle>
          <CardDescription>Lançamentos mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Por cota/ação</TableHead>
                <TableHead className="text-right">Valor recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((d) => {
                const asset = portfolio.assets.find((a) => a.id === d.assetId)!;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="tabular-nums">
                      {formatDate(d.date)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{asset.ticker}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DIVIDEND_TYPE_LABELS[d.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {d.amountPerShare
                        ? formatCurrency(d.amountPerShare, d.currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-gain text-right font-medium tabular-nums">
                      +{formatCurrency(dividendToBRL(d, fx))}
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
