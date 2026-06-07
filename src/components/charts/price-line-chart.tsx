"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatMonthYear } from "@/lib/format";
import type { Currency } from "@/lib/types";

export function PriceLineChart({
  data,
  currency,
  className,
}: {
  data: { date: string; close: number }[];
  currency: Currency;
  className?: string;
}) {
  const config = {
    close: { label: "Preço", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={className}>
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={formatMonthYear}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          domain={["auto", "auto"]}
          tickFormatter={(v) =>
            (currency === "USD" ? "US$ " : "R$ ") +
            Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })
          }
        />
        <ChartTooltip
          cursor
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload ? formatMonthYear(String(payload[0].payload.date)) : ""
              }
              formatter={(value) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">Preço</span>
                  <span className="font-mono font-medium">
                    {formatCurrency(Number(value), currency)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Line
          dataKey="close"
          type="monotone"
          stroke="var(--color-close)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
