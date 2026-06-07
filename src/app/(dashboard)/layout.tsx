import { AppShell } from "@/components/dashboard/app-shell";
import { getPortfolio } from "@/lib/portfolio-repo";

// Lê o banco a cada request (a carteira muda entre imports/sincronizações).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { asOf } = await getPortfolio();
  return <AppShell asOf={asOf}>{children}</AppShell>;
}
