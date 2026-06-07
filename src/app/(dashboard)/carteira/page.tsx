import { PageHeader } from "@/components/dashboard/page-header";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { portfolio } from "@/lib/mock-data";
import { enrichPositions } from "@/lib/portfolio";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Carteira · Investly" };

export default function CarteiraPage() {
  const enriched = enrichPositions(portfolio);

  return (
    <>
      <PageHeader
        title="Carteira consolidada"
        description={`Preço médio, preço atual e resultado de cada ativo · ${formatDate(
          portfolio.asOf
        )}`}
      />
      <PositionsTable rows={enriched} />
    </>
  );
}
