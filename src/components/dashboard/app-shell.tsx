"use client";

import * as React from "react";
import { CandlestickChart, LogOut, Menu, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { formatDate } from "@/lib/format";

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
        <CandlestickChart className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="font-semibold tracking-tight">Investly</p>
        <p className="text-muted-foreground text-xs">Carteira de investimentos</p>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  asOf,
  user,
}: {
  children: React.ReactNode;
  asOf: string;
  user: { email: string; name?: string };
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const initial = (user.name ?? user.email).charAt(0).toUpperCase();

  return (
    <div className="bg-background min-h-dvh">
      {/* Sidebar fixa (desktop) */}
      <aside className="bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r p-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1">
          <SidebarNav />
        </div>
        <div className="space-y-3 border-t pt-4">
          <div className="text-muted-foreground text-xs">
            <p>Extrato BTG</p>
            <p className="text-foreground font-medium">{formatDate(asOf)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-secondary flex size-7 items-center justify-center rounded-full text-[11px] font-medium">
              {initial}
            </div>
            <span className="text-muted-foreground flex-1 truncate text-xs">
              {user.email}
            </span>
            <a
              href="/api/auth/signout"
              aria-label="Sair"
              title="Sair"
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: "size-7",
              })}
            >
              <LogOut className="size-4" />
            </a>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4 backdrop-blur lg:px-8">
          {/* Menu mobile */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <Brand />
              <div className="mt-6">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 lg:hidden">
            <CandlestickChart className="size-5" />
            <span className="font-semibold">Investly</span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="hidden gap-2 sm:flex">
              <RefreshCw className="size-4" />
              Atualizar cotações
            </Button>
            <ThemeToggle />
            <a
              href="/api/auth/signout"
              aria-label="Sair"
              title="Sair"
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: "lg:hidden",
              })}
            >
              <LogOut className="size-4" />
            </a>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
