import { PageHeader } from "@/components/dashboard/page-header";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { getPortfolio } from "@/lib/portfolio-repo";
import { enrichPositions } from "@/lib/portfolio";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Carteira · Investly" };

export default async function CarteiraPage() {
  const portfolio = await getPortfolio();
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
