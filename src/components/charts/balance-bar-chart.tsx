"use client";

import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMillions } from "@/lib/format";
import type { BalanceSheetYear, Currency } from "@/lib/types";

const config = {
  revenue: { label: "Receita", color: "var(--chart-2)" },
  netIncome: { label: "Lucro líquido", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function BalanceBarChart({
  data,
  currency = "BRL",
  className,
}: {
  data: BalanceSheetYear[];
  currency?: Currency;
  className?: string;
}) {
  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => formatMillions(v, currency)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label ?? name}
                  </span>
                  <span className="font-mono font-medium">
                    {formatMillions(Number(value), currency)}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
        <Line
          dataKey="netIncome"
          type="monotone"
          stroke="var(--color-netIncome)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </BarChart>
    </ChartContainer>
  );
}
