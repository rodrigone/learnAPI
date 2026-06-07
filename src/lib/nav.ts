import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  LineChart,
  Coins,
  FileBarChart,
  PieChart,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Visão Geral",
    icon: LayoutDashboard,
    description: "Resumo da carteira",
  },
  {
    href: "/carteira",
    label: "Carteira",
    icon: Wallet,
    description: "Ativos, preço médio e resultado",
  },
  {
    href: "/alocacao",
    label: "Alocação",
    icon: PieChart,
    description: "Distribuição por classe de ativo",
  },
  {
    href: "/cotacoes",
    label: "Cotações",
    icon: LineChart,
    description: "Preço histórico e múltiplo P/L",
  },
  {
    href: "/proventos",
    label: "Proventos",
    icon: Coins,
    description: "Dividendos, JCP e rendimentos",
  },
  {
    href: "/balancos",
    label: "Balanços",
    icon: FileBarChart,
    description: "Evolução dos resultados das empresas",
  },
];
