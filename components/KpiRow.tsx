"use client";

import type { Bottleneck } from "@/lib/stats";
import { usePresentMode } from "@/lib/usePresentMode";
import { PresentButton } from "./PresentButton";
import { PresentNav } from "./PresentNav";

interface KpiRowProps {
  emProcesso: number;
  concluidos: number;
  atencao: number;
  tempoMedio: number | null;
  bottleneck: Bottleneck | null;
}

function Card({
  presenting,
  accentVar,
  warning,
  label,
  value,
  unit,
  foot,
  valueIsText,
}: {
  presenting: boolean;
  accentVar?: string;
  warning?: boolean;
  label: string;
  value: React.ReactNode;
  unit?: string;
  foot: string;
  valueIsText?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border bg-surface border-t-[3px] ${
        presenting ? "justify-center gap-3 p-8" : "gap-1.5 p-4"
      } ${warning ? "border-warning/45 border-t-warning" : "border-border"}`}
      style={accentVar ? { borderTopColor: accentVar } : undefined}
    >
      <span className={presenting ? "text-xl font-semibold text-ink-2" : "text-xs font-semibold text-ink-2"}>
        {label}
      </span>
      <div className="flex min-w-0 items-baseline gap-2">
        <span
          className={`min-w-0 break-words font-extrabold tracking-tight tabular-nums ${
            presenting
              ? valueIsText
                ? "text-4xl"
                : "text-8xl"
              : valueIsText
                ? "text-lg"
                : "text-3xl"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className={presenting ? "text-lg text-muted" : "text-xs text-muted"}>
            {unit}
          </span>
        )}
      </div>
      <span
        className={
          presenting
            ? `text-lg ${warning ? "font-semibold text-warning" : "text-muted"}`
            : `text-xs ${warning ? "font-semibold text-warning" : "text-muted"}`
        }
      >
        {foot}
      </span>
    </div>
  );
}

export function KpiRow({
  emProcesso,
  concluidos,
  atencao,
  tempoMedio,
  bottleneck,
}: KpiRowProps) {
  const { ref, presenting, toggle, next, prev, index, total } =
    usePresentMode<HTMLDivElement>("indicadores");

  return (
    <div
      ref={ref}
      className={presenting ? "flex h-full flex-col bg-bg p-12" : ""}
    >
      <div className={`flex items-center justify-between ${presenting ? "mb-8" : "mb-0"}`}>
        {presenting && <h2 className="text-3xl font-bold">Indicadores</h2>}
        <div className={presenting ? "" : "flex w-full justify-end"}>
          <PresentButton presenting={presenting} onToggle={toggle} />
        </div>
      </div>

      <div
        className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${
          presenting ? "flex-1 gap-6" : ""
        }`}
      >
        <Card
          presenting={presenting}
          accentVar="var(--cat-1)"
          label="Em processo"
          value={emProcesso}
          unit="pessoas"
          foot={
            atencao > 0
              ? `${atencao} com atenção — paradas acima do esperado`
              : "nenhuma parada acima do esperado"
          }
        />
        <Card
          presenting={presenting}
          accentVar="var(--good)"
          label="Disponíveis na obra"
          value={concluidos}
          unit="pessoas"
          foot="funil completo"
        />
        <Card
          presenting={presenting}
          accentVar="var(--cat-2)"
          label="Tempo médio do funil"
          value={tempoMedio ?? "—"}
          unit={tempoMedio !== null ? "dias" : undefined}
          foot="solicitação → obra"
        />
        <Card
          presenting={presenting}
          warning
          valueIsText
          label="Maior ponto de retenção"
          value={bottleneck ? bottleneck.label : "—"}
          foot={
            bottleneck
              ? `${bottleneck.atencaoCount} ${bottleneck.atencaoCount === 1 ? "pessoa parada" : "pessoas paradas"} aqui acima do esperado`
              : "ninguém parado acima do esperado"
          }
        />
      </div>
      {presenting && (
        <PresentNav index={index} total={total} onPrev={prev} onNext={next} />
      )}
    </div>
  );
}
