import { CotacoesView } from "@/components/dashboard/cotacoes-view";
import { getPortfolio } from "@/lib/portfolio-repo";

export const metadata = { title: "Cotações · Investly" };

export default async function CotacoesPage() {
  const portfolio = await getPortfolio();
  return <CotacoesView portfolio={portfolio} />;
}
