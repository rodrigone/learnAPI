"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PERIODS, type PeriodKey } from "@/lib/types";

const SHORT_LABELS: Record<PeriodKey, string> = {
  "6m": "6M",
  "1y": "1A",
  "2y": "2A",
  "3y": "3A",
  "5y": "5A",
};

export function PeriodFilter({
  value,
  onChange,
}: {
  value: PeriodKey;
  onChange: (value: PeriodKey) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as PeriodKey)}
      variant="outline"
      size="sm"
    >
      {PERIODS.map((p) => (
        <ToggleGroupItem key={p.key} value={p.key} aria-label={p.label}>
          {SHORT_LABELS[p.key]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
