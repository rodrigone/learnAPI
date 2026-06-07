import { redirect } from "next/navigation";

import { AppShell } from "@/components/dashboard/app-shell";
import { getPortfolio } from "@/lib/portfolio-repo";
import { getSession } from "@/lib/session";

// Lê o banco a cada request (a carteira muda entre imports/sincronizações).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { asOf } = await getPortfolio();
  return (
    <AppShell asOf={asOf} user={{ email: session.email, name: session.name }}>
      {children}
    </AppShell>
  );
}
