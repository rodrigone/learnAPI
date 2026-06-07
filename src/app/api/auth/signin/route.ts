import { NextResponse } from "next/server";

import {
  OAUTH_STATE_COOKIE,
  allowedEmails,
  buildGoogleAuthUrl,
  googleConfigured,
} from "@/lib/auth/google";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const home = new URL("/", req.url);

  // Fluxo real do Google quando configurado.
  if (googleConfigured()) {
    const state = crypto.randomUUID();
    const url = buildGoogleAuthUrl(req, state);
    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  }

  // Sem credenciais do Google: em desenvolvimento, login direto para o dono
  // (facilita rodar local sem OAuth). Nunca em produção.
  if (process.env.NODE_ENV !== "production") {
    await createSession({ email: allowedEmails()[0], name: "Dev" });
    return NextResponse.redirect(home);
  }

  return NextResponse.redirect(new URL("/login?error=config", req.url));
}
