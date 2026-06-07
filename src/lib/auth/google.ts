// Configuração do OAuth com o Google (Authorization Code flow) + allowlist.

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const OAUTH_STATE_COOKIE = "investly_oauth_state";

/** Só faz o fluxo real do Google quando as credenciais estão configuradas. */
export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

/** E-mails autorizados a entrar (padrão: o dono). */
export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "rodrigon.edington@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string | undefined): boolean {
  return Boolean(email && allowedEmails().includes(email.toLowerCase()));
}

/** URL base da app (para montar o redirect_uri exato exigido pelo Google). */
export function baseUrl(req: Request): string {
  return process.env.AUTH_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
}

export function redirectUri(req: Request): string {
  return `${baseUrl(req)}/api/auth/callback`;
}

export function buildGoogleAuthUrl(req: Request, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokens {
  id_token?: string;
  access_token?: string;
}

export async function exchangeCode(
  req: Request,
  code: string
): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(req),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Falha na troca do código com o Google (${res.status})`);
  }
  return res.json();
}
