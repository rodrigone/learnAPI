"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompact, formatCurrency, formatMonthYear } from "@/lib/format";
import type { MonthlyIncome } from "@/lib/portfolio";

const config = {
  dividendo: { label: "Dividendos", color: "var(--chart-1)" },
  jcp: { label: "JCP", color: "var(--chart-2)" },
  rendimento: { label: "Rendimentos", color: "var(--chart-4)" },
  cupom: { label: "Cupom", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function IncomeBarChart({
  data,
  className,
}: {
  data: MonthlyIncome[];
  className?: string;
}) {
  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(m) => formatMonthYear(`${m}-01`)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => formatCompact(v)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatMonthYear(`${label}-01`)}
              formatter={(value, name) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label ?? name}
                  </span>
                  <span className="font-mono font-medium">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="dividendo" stackId="i" fill="var(--color-dividendo)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="jcp" stackId="i" fill="var(--color-jcp)" />
        <Bar dataKey="rendimento" stackId="i" fill="var(--color-rendimento)" />
        <Bar dataKey="cupom" stackId="i" fill="var(--color-cupom)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
