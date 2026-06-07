import "server-only";

import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  signSession,
  verifySession,
  type SessionUser,
} from "./auth/jwt";

// Camada de sessão para route handlers e server components (usa os cookies do
// request). O proxy.ts NÃO importa este arquivo — ele lê o cookie do request
// diretamente e usa verifySession() do jwt.ts.

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

export async function deleteSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export type { SessionUser };
