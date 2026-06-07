import { NextResponse } from "next/server";

import { deleteSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function signOut(req: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const GET = signOut;
export const POST = signOut;
