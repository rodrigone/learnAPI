import { SignJWT, jwtVerify } from "jose";

// Crypto puro da sessão (sem next/headers nem server-only), para poder ser
// usado tanto nos route handlers/server components quanto no proxy.

export const SESSION_COOKIE = "investly_session";

export interface SessionUser {
  email: string;
  name?: string;
  picture?: string;
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET não configurado");
  return new TextEncoder().encode(s);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySession(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    return {
      email: payload.email as string,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
    };
  } catch {
    return null;
  }
}
