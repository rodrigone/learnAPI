import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  hint,
}: {
  label: string;
  value: string;
  /** Variação percentual; define a cor (verde/vermelho). */
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  hint?: string;
}) {
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-sm">
          {delta !== undefined ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium tabular-nums",
                positive ? "text-gain" : "text-loss"
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-4" />
              ) : (
                <ArrowDownRight className="size-4" />
              )}
              {deltaLabel}
            </span>
          ) : null}
          {hint ? (
            <span className="text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
