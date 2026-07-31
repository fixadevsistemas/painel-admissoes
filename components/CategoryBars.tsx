"use client";

import { useState } from "react";

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
}: {
  chave: string;
  total: number;
  max: number;
  cor: string;
}) {
  return (
    <div className="grid grid-cols-[108px_1fr_26px] items-center gap-2">
      <span className="truncate text-right text-xs text-ink-2" title={chave}>
        {chave}
      </span>
      <span className="h-3.5 rounded bg-surface-2">
        <span
          className="block h-full rounded"
          style={{ width: `${(total / max) * 100}%`, background: cor }}
        />
      </span>
      <span className="text-xs font-bold tabular-nums">{total}</span>
    </div>
  );
}

export function CategoryBars({
  title,
  data,
  limiteInicial = 8,
}: CategoryBarsProps) {
  const [expandido, setExpandido] = useState(false);
  const max = data.reduce((m, d) => Math.max(m, d.total), 1);
  const temMais = data.length > limiteInicial;
  const visiveis = expandido ? data : data.slice(0, limiteInicial);
  const restantes = data.length - limiteInicial;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-bold">{title}</h3>
        {data.length > 0 && (
          <span className="text-xs text-muted">{data.length} categorias</span>
        )}
      </div>

      <div
        className={`flex flex-col gap-2 ${
          expandido ? "max-h-[320px] overflow-y-auto pr-1" : ""
        }`}
      >
        {visiveis.map((d, i) => (
          <Barra
            key={d.chave}
            chave={d.chave}
            total={d.total}
            max={max}
            cor={CORES[i % CORES.length]}
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
          className="mt-3 text-xs font-semibold text-accent"
        >
          {expandido ? "Mostrar menos" : `+ ${restantes} outras`}
        </button>
      )}
    </div>
  );
}
