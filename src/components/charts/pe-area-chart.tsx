"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMonthYear, formatNumber } from "@/lib/format";

const config = {
  pe: { label: "P/L", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function PeAreaChart({
  data,
  average,
  className,
}: {
  data: { date: string; pe: number }[];
  average?: number;
  className?: string;
}) {
  return (
    <ChartContainer config={config} className={className}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillPe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-pe)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-pe)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
          width={40}
          tickFormatter={(v) => `${v}x`}
        />
        {average ? (
          <ReferenceLine
            y={average}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{
              value: `média ${formatNumber(average, 1)}x`,
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
        ) : null}
        <ChartTooltip
          cursor
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload ? formatMonthYear(String(payload[0].payload.date)) : ""
              }
              formatter={(value) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">P/L</span>
                  <span className="font-mono font-medium">
                    {formatNumber(Number(value), 1)}x
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="pe"
          type="monotone"
          stroke="var(--color-pe)"
          strokeWidth={2}
          fill="url(#fillPe)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
