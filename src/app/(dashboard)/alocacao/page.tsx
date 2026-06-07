import { PageHeader } from "@/components/dashboard/page-header";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPortfolio } from "@/lib/portfolio-repo";
import {
  allocationByClass,
  allocationBySubtype,
  enrichPositions,
} from "@/lib/portfolio";
import { ASSET_CLASS_LABELS, type AssetClass } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const CHART_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--color-gain)",
];

// Ordem das classes na grade (Previdência por último, pode estar vazia).
const CLASS_ORDER: AssetClass[] = [
  "rv_br",
  "rv_intl",
  "renda_fixa",
  "tesouro_direto",
  "fundo",
  "previdencia",
];

export const metadata = { title: "Alocação · Investly" };

export default async function AlocacaoPage() {
  const portfolio = await getPortfolio();
  const enriched = enrichPositions(portfolio);
  const byClass = allocationByClass(enriched);
  const total = byClass.reduce((s, c) => s + c.value, 0);

  return (
    <>
      <PageHeader
        title="Alocação da carteira"
        description="Visão macro por classe e detalhamento por tipo de ativo"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Por classe de ativo</CardTitle>
            <CardDescription>Distribuição do patrimônio total</CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationDonut
              data={byClass}
              centerLabel="patrimônio"
              className="mx-auto aspect-square h-[240px]"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumo por classe</CardTitle>
            <CardDescription>Valor e participação de cada classe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {byClass.map((slice, i) => (
              <div key={slice.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: CHART_VARS[i % CHART_VARS.length] }}
                    />
                    {slice.label}
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(slice.value)}{" "}
                    <span className="text-muted-foreground">
                      ({(slice.weight * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${slice.weight * 100}%`,
                      backgroundColor: CHART_VARS[i % CHART_VARS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-8 mb-4 text-lg font-semibold tracking-tight">
        Detalhamento por tipo
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CLASS_ORDER.map((klass) => {
          const subtypes = allocationBySubtype(enriched, klass);
          const classValue = subtypes.reduce((s, x) => s + x.value, 0);
          const empty = subtypes.length === 0;
          return (
            <Card key={klass}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {ASSET_CLASS_LABELS[klass]}
                  </CardTitle>
                  {empty ? (
                    <Badge variant="secondary">A preparar</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {((classValue / total) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <CardDescription>
                  {empty
                    ? "Sem posição — estrutura pronta para receber aportes"
                    : formatCurrency(classValue)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {empty ? (
                  <p className="text-muted-foreground text-sm">
                    Quando você incluir um fundo de previdência no extrato, ele
                    aparecerá aqui automaticamente.
                  </p>
                ) : (
                  subtypes.map((st, i) => (
                    <div key={st.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{st.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {(st.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${st.weight * 100}%`,
                            backgroundColor: CHART_VARS[i % CHART_VARS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
