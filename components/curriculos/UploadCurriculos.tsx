"use client";

import { useEffect, useRef, useState } from "react";
import { arquivosDeDataTransfer } from "@/lib/arquivosPasta";

interface UploadCurriculosProps {
  compacto?: boolean;
  processando: boolean;
  onFiles: (files: File[]) => void;
}

function filtrarPdfs(fileList: FileList | File[] | null): File[] {
  if (!fileList) return [];
  return Array.from(fileList).filter(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
  );
}

/** input[type=file] com seleção de pasta — webkitdirectory não tem tipo no JSX, então seta via ref. */
function useInputPasta(onFiles: (files: File[]) => void) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.setAttribute("webkitdirectory", "");
    ref.current?.setAttribute("directory", "");
  }, []);
  return {
    ref,
    input: (
      <input
        ref={ref}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(filtrarPdfs(e.target.files));
          e.target.value = "";
        }}
      />
    ),
  };
}

export function UploadCurriculos({
  compacto,
  processando,
  onFiles,
}: UploadCurriculosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const pasta = useInputPasta(onFiles);

  async function handleDrop(dataTransfer: DataTransfer) {
    const todos = await arquivosDeDataTransfer(dataTransfer);
    const pdfs = filtrarPdfs(todos);
    if (pdfs.length) onFiles(pdfs);
  }

  if (compacto) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={processando}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:text-ink disabled:opacity-50"
        >
          + Adicionar currículos
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              onFiles(filtrarPdfs(e.target.files));
              e.target.value = "";
            }}
          />
        </button>
        <button
          type="button"
          disabled={processando}
          onClick={() => pasta.ref.current?.click()}
          className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:text-ink disabled:opacity-50"
        >
          + Adicionar pasta
          {pasta.input}
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void handleDrop(e.dataTransfer);
      }}
      className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragOver ? "border-accent bg-accent-wash" : "border-border-strong bg-surface-2"
      }`}
    >
      <p className="text-sm font-semibold text-ink">
        Arraste os currículos em PDF aqui — arquivos ou uma pasta inteira
        (com subpastas)
      </p>
      <p className="mt-1 text-xs text-muted">ou escolha abaixo</p>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={processando}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-full border border-border-strong bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          Escolher arquivos
        </button>
        <button
          type="button"
          disabled={processando}
          onClick={() => pasta.ref.current?.click()}
          className="cursor-pointer rounded-full border border-border-strong bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          Escolher pasta
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(filtrarPdfs(e.target.files));
          e.target.value = "";
        }}
      />
      {pasta.input}
    </div>
  );
}
