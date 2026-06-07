"use client";

import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatQuantity,
} from "@/lib/format";
import type { EnrichedPosition } from "@/lib/portfolio";
import { ASSET_CLASS_LABELS, type AssetClass } from "@/lib/types";

export function PositionsTable({ rows }: { rows: EnrichedPosition[] }) {
  const [klass, setKlass] = React.useState<AssetClass | "all">("all");
  const [query, setQuery] = React.useState("");

  const classes = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.asset.class))),
    [rows]
  );

  const filtered = rows.filter((r) => {
    if (klass !== "all" && r.asset.class !== klass) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        r.asset.ticker.toLowerCase().includes(q) ||
        r.asset.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalInvested = filtered.reduce((s, r) => s + r.investedBRL, 0);
  const totalMV = filtered.reduce((s, r) => s + r.marketValueBRL, 0);
  const totalPnl = totalMV - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar ativo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={klass} onValueChange={(v) => setKlass(v as AssetClass | "all")}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c} value={c}>
                {ASSET_CLASS_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Qtde</TableHead>
              <TableHead className="text-right">Preço médio</TableHead>
              <TableHead className="text-right">Preço atual</TableHead>
              <TableHead className="text-right">Investido (R$)</TableHead>
              <TableHead className="text-right">Valor atual (R$)</TableHead>
              <TableHead className="text-right">Resultado</TableHead>
              <TableHead className="text-right">Peso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.asset.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.asset.ticker}</span>
                    <Badge variant="outline" className="font-normal">
                      {r.asset.currency}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {ASSET_CLASS_LABELS[r.asset.class]}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQuantity(r.quantity)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(r.avgPrice, r.asset.currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(r.currentPrice, r.asset.currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(r.investedBRL, 0)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatNumber(r.marketValueBRL, 0)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span
                      className={
                        r.pnl >= 0
                          ? "text-gain tabular-nums"
                          : "text-loss tabular-nums"
                      }
                    >
                      {formatCurrency(r.pnl)}
                    </span>
                    <Badge
                      variant={r.pnl >= 0 ? "gain" : "loss"}
                      className="mt-0.5"
                    >
                      {formatPercent(r.pnlPct)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-right tabular-nums">
                  {(r.weight * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground py-8 text-center"
                >
                  Nenhum ativo encontrado.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
          {filtered.length > 0 ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total ({filtered.length} ativos)</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totalInvested, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totalMV, 0)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={totalPnl >= 0 ? "gain" : "loss"}>
                    {formatPercent(totalPnlPct)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">100%</TableCell>
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </div>
    </div>
  );
}
