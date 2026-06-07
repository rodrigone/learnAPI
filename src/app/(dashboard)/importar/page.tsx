"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImportResult {
  broker: string;
  asOf: string;
  assets: number;
  positions: number;
  dividends: number;
}

export default function ImportarPage() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function upload(f: File) {
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", f);
      const res = await fetch("/api/import", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no upload");
      setResult(data);
      setStatus("done");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  function onSelect(f: File | null) {
    if (!f) return;
    setFile(f);
    upload(f);
  }

  return (
    <>
      <PageHeader
        title="Importar carteira"
        description="Envie o extrato do BTG (.xlsx) ou a carteira internacional (.json). Cada envio atualiza a carteira."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onSelect(e.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                dragging
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50 hover:bg-accent/40"
              )}
            >
              <div className="bg-secondary flex size-12 items-center justify-center rounded-full">
                <UploadCloud className="size-6" />
              </div>
              <div>
                <p className="font-medium">
                  Arraste o arquivo aqui ou clique para selecionar
                </p>
                <p className="text-muted-foreground text-sm">
                  Formatos aceitos: .xlsx (BTG B3) e .json (BTG Internacional)
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.json"
                className="hidden"
                onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
              />
            </div>

            {file ? (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <FileSpreadsheet className="text-muted-foreground size-4" />
                <span className="font-medium">{file.name}</span>
                {status === "loading" ? (
                  <Loader2 className="text-muted-foreground ml-auto size-4 animate-spin" />
                ) : null}
              </div>
            ) : null}

            {status === "done" && result ? (
              <div className="border-gain/30 bg-gain/10 mt-4 flex items-start gap-3 rounded-lg border p-4">
                <CheckCircle2 className="text-gain mt-0.5 size-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Carteira atualizada!</p>
                  <p className="text-muted-foreground">
                    {result.broker} · ref. {result.asOf} · {result.positions}{" "}
                    posições, {result.dividends} proventos, {result.assets} ativos.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push("/")}
                  >
                    Ver dashboard
                  </Button>
                </div>
              </div>
            ) : null}

            {status === "error" && error ? (
              <div className="border-loss/30 bg-loss/10 mt-4 flex items-start gap-3 rounded-lg border p-4">
                <AlertCircle className="text-loss mt-0.5 size-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Não consegui importar</p>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como exportar do BTG</CardTitle>
            <CardDescription>Passo a passo</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>
              <span className="text-foreground font-medium">1.</span> No app/site
              do BTG, vá em <em>Extrato da Conta Investimento</em> e exporte em
              Excel (.xlsx).
            </p>
            <p>
              <span className="text-foreground font-medium">2.</span> Para a
              carteira internacional (BTG Internacional/Avenue), use o export
              .json das posições.
            </p>
            <p>
              <span className="text-foreground font-medium">3.</span> Arraste o
              arquivo ao lado. Cada envio cria um snapshot datado — o histórico
              é preservado.
            </p>
            <p className="text-xs">
              As cotações e os balanços são atualizados separadamente pela
              sincronização com o Yahoo Finance.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
