import { BalancosView } from "@/components/dashboard/balancos-view";
import { getPortfolio } from "@/lib/portfolio-repo";

export const metadata = { title: "Balanços · Investly" };

export default async function BalancosPage() {
  const portfolio = await getPortfolio();
  return <BalancosView portfolio={portfolio} />;
}
