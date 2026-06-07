import { NextResponse } from "next/server";
import { decodeJwt } from "jose";

import {
  OAUTH_STATE_COOKIE,
  exchangeCode,
  isAllowed,
} from "@/lib/auth/google";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(req: Request, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Proteção CSRF: o state precisa bater com o cookie definido no /signin.
  const cookieState = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail(req, "state");
  }

  let email: string | undefined;
  let name: string | undefined;
  let picture: string | undefined;
  try {
    const tokens = await exchangeCode(req, code);
    if (!tokens.id_token) return fail(req, "token");
    // O id_token vem direto do endpoint do Google por HTTPS, então pode ser
    // decodificado sem verificar a assinatura (fonte confiável).
    const claims = decodeJwt(tokens.id_token);
    email = claims.email as string | undefined;
    name = claims.name as string | undefined;
    picture = claims.picture as string | undefined;
  } catch {
    return fail(req, "google");
  }

  if (!isAllowed(email)) return fail(req, "denied");

  await createSession({ email: email!, name, picture });

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
