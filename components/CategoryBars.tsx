"use client";

import { useState } from "react";
import { usePresentMode } from "@/lib/usePresentMode";
import { PresentButton } from "./PresentButton";

interface CategoryBarsProps {
  title: string;
  data: { chave: string; total: number }[];
  limiteInicial?: number;
}

const CORES = [
  "var(--cat-1)",
  "var(--cat-2)",
  "color-mix(in srgb, var(--cat-1) 65%, var(--surface-2))",
  "color-mix(in srgb, var(--cat-2) 65%, var(--surface-2))",
];

function Barra({
  chave,
  total,
  max,
  cor,
  presenting,
}: {
  chave: string;
  total: number;
  max: number;
  cor: string;
  presenting: boolean;
}) {
  return (
    <div
      className={`grid items-center ${
        presenting
          ? "grid-cols-[220px_1fr_60px] gap-4"
          : "grid-cols-[108px_1fr_26px] gap-2"
      }`}
    >
      <span
        className={`truncate text-right text-ink-2 ${
          presenting ? "text-lg" : "text-xs"
        }`}
        title={chave}
      >
        {chave}
      </span>
      <span className={`rounded bg-surface-2 ${presenting ? "h-7" : "h-3.5"}`}>
        <span
          className="block h-full rounded"
          style={{ width: `${(total / max) * 100}%`, background: cor }}
        />
      </span>
      <span
        className={`font-bold tabular-nums ${presenting ? "text-xl" : "text-xs"}`}
      >
        {total}
      </span>
    </div>
  );
}

export function CategoryBars({
  title,
  data,
  limiteInicial = 8,
}: CategoryBarsProps) {
  const [expandido, setExpandido] = useState(false);
  const { ref, presenting, toggle } = usePresentMode<HTMLDivElement>();
  const max = data.reduce((m, d) => Math.max(m, d.total), 1);
  const limite = presenting ? Math.max(limiteInicial, 20) : limiteInicial;
  const temMais = data.length > limite;
  const visiveis = expandido ? data : data.slice(0, limite);
  const restantes = data.length - limite;

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-border bg-surface ${
        presenting ? "flex h-full flex-col p-12" : "p-5"
      }`}
    >
      <div
        className={`flex items-baseline justify-between gap-2 ${
          presenting ? "mb-8" : "mb-3.5"
        }`}
      >
        <h3 className={presenting ? "text-3xl font-bold" : "text-[15px] font-bold"}>
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {data.length > 0 && (
            <span className={presenting ? "text-base text-muted" : "text-xs text-muted"}>
              {data.length} categorias
            </span>
          )}
          <PresentButton presenting={presenting} onToggle={toggle} />
        </div>
      </div>

      <div
        className={`flex flex-col ${
          presenting
            ? "flex-1 gap-4 overflow-y-auto"
            : expandido
              ? "max-h-[320px] gap-2 overflow-y-auto pr-1"
              : "gap-2"
        }`}
      >
        {visiveis.map((d, i) => (
          <Barra
            key={d.chave}
            chave={d.chave}
            total={d.total}
            max={max}
            cor={CORES[i % CORES.length]}
            presenting={presenting}
          />
        ))}
        {data.length === 0 && (
          <p className="text-xs text-muted">Sem dados para este filtro.</p>
        )}
      </div>

      {temMais && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className={`mt-3 font-semibold text-accent ${presenting ? "text-lg" : "text-xs"}`}
        >
          {expandido ? "Mostrar menos" : `+ ${restantes} outras`}
        </button>
      )}
    </div>
  );
}
