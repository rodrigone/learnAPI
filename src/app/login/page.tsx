import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { getSession } from "@/lib/session";
import { googleConfigured } from "@/lib/auth/google";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Entrar · Investly" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  denied: "Este e-mail não tem acesso ao painel.",
  state: "A sessão de login expirou. Tente novamente.",
  google: "Não foi possível autenticar com o Google.",
  token: "Resposta inválida do Google.",
  config: "O login com Google ainda não está configurado.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="bg-card w-full max-w-sm rounded-2xl border p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-4 flex size-11 items-center justify-center rounded-xl text-lg font-bold">
            I
          </div>
          <h1 className="text-xl font-semibold">Investly</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Entre para acompanhar sua carteira
          </p>
        </div>

        {error ? (
          <div className="border-destructive/30 bg-destructive/10 mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm">
            <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
            <span>{ERRORS[error] ?? "Não foi possível entrar."}</span>
          </div>
        ) : null}

        <a
          href="/api/auth/signin"
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          <GoogleIcon />
          Entrar com Google
        </a>

        {!googleConfigured() ? (
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Modo de desenvolvimento: login direto (sem Google configurado).
          </p>
        ) : null}
      </div>
    </main>
  );
}
