"use client";

import * as React from "react";
import { Cell, Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompact, formatCurrency } from "@/lib/format";
import type { AllocationSlice } from "@/lib/portfolio";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--color-gain)",
];

export function AllocationDonut({
  data,
  centerLabel = "Total",
  className,
}: {
  data: AllocationSlice[];
  centerLabel?: string;
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.key, { label: d.label, color: PALETTE[i % PALETTE.length] }])
  );

  return (
    <ChartContainer config={config} className={className}>
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">
                    {config[name as string]?.label ?? name}
                  </span>
                  <span className="font-mono font-medium">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={70}
          outerRadius={100}
          strokeWidth={2}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={d.key} fill={PALETTE[i % PALETTE.length]} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 8}
                      className="fill-foreground text-lg font-semibold"
                    >
                      {formatCompact(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 14}
                      className="fill-muted-foreground text-xs"
                    >
                      {centerLabel}
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
