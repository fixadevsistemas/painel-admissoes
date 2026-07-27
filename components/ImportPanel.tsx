"use client";

import { useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface ImportPanelProps {
  loading: boolean;
  error: string | null;
  onFile: (file: File) => void;
}

export function ImportPanel({ loading, error, onFile }: ImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <p className="mb-1 text-[11.5px] font-bold uppercase tracking-[0.11em] text-accent">
          DHO · Mobilização de Pessoal
        </p>
        <h1 className="mb-2 text-xl font-extrabold tracking-tight">
          Painel de Admissões — Obras
        </h1>
        <p className="mb-6 text-sm text-ink-2">
          Importe a planilha de controle (.xlsx) para gerar o painel — ela
          funciona como a base de dados do sistema.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={`mb-4 cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
            dragOver
              ? "border-accent bg-accent-wash"
              : "border-border-strong bg-surface-2"
          }`}
        >
          <p className="text-sm font-semibold text-ink">
            Arraste o arquivo .xlsx aqui
          </p>
          <p className="mt-1 text-xs text-muted">ou clique para escolher</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
            {error}
          </p>
        )}

        {loading && <p className="text-xs text-muted">Carregando…</p>}
      </div>
    </div>
  );
}
