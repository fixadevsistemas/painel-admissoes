"use client";

import { useRef, useState } from "react";

interface UploadCurriculosProps {
  compacto?: boolean;
  processando: boolean;
  onFiles: (files: File[]) => void;
}

export function UploadCurriculos({
  compacto,
  processando,
  onFiles,
}: UploadCurriculosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length) onFiles(pdfs);
  }

  if (compacto) {
    return (
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
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </button>
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
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragOver ? "border-accent bg-accent-wash" : "border-border-strong bg-surface-2"
      }`}
    >
      <p className="text-sm font-semibold text-ink">
        Arraste os currículos em PDF aqui
      </p>
      <p className="mt-1 text-xs text-muted">
        ou clique para escolher — pode selecionar vários arquivos de uma vez
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
