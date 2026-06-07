import { NextResponse } from "next/server";

import { parseBtgFile, upsertStatement } from "@/lib/import-statement";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Recebe o extrato (xlsx/json), faz o parse e grava um snapshot no banco. */
export async function POST(req: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const stmt = parseBtgFile(file.name, buffer);
    if (stmt.positions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma posição reconhecida — confira se é um extrato BTG válido." },
        { status: 422 }
      );
    }
    const result = await upsertStatement(stmt);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: `Falha ao processar: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
