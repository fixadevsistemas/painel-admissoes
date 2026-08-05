"use client";

import type { StageKey } from "@/lib/types";
import type { FunnelStage } from "@/lib/stats";
import { usePresentMode } from "@/lib/usePresentMode";
import { PresentButton } from "./PresentButton";

interface FunnelChartProps {
  funnel: FunnelStage[];
  bottleneckKey?: StageKey;
  activeStageKey: StageKey | null;
  onStageClick: (key: StageKey) => void;
}

export function FunnelChart({
  funnel,
  bottleneckKey,
  activeStageKey,
  onStageClick,
}: FunnelChartProps) {
  const max = Math.max(1, ...funnel.map((f) => f.count));
  const { ref, presenting, toggle } = usePresentMode<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-border bg-surface ${
        presenting ? "h-full overflow-y-auto p-12" : "p-5"
      }`}
    >
      <div
        className={`flex flex-wrap items-baseline justify-between gap-3 ${
          presenting ? "mb-8" : "mb-3.5"
        }`}
      >
        <div>
          <h3 className={presenting ? "text-3xl font-bold" : "text-[15px] font-bold"}>
            Distribuição por etapa
          </h3>
          {!presenting && (
            <p className="mt-0.5 text-xs text-muted">
              Quantas pessoas estão em cada etapa agora — clique numa etapa
              para filtrar a tabela abaixo
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 text-ink-2 ${
              presenting ? "text-base" : "text-xs"
            }`}
          >
            <span
              className={`inline-block rounded-sm bg-accent ${
                presenting ? "h-3 w-3" : "h-2 w-2"
              }`}
            />
            Pessoas atualmente nesta etapa
          </span>
          <PresentButton presenting={presenting} onToggle={toggle} />
        </div>
      </div>

      <div className={`flex flex-col ${presenting ? "gap-2" : "gap-[3px]"}`}>
        {funnel.map((stage, i) => {
          const isBottleneck = stage.key === bottleneckKey;
          const isActive = stage.key === activeStageKey;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onStageClick(stage.key)}
              title={`Filtrar por quem está em: ${stage.label}`}
              className={`grid items-center rounded-md text-left transition-colors hover:bg-surface-2 ${
                presenting
                  ? "grid-cols-[300px_1fr_140px] gap-5 px-3 py-2"
                  : "grid-cols-[168px_1fr_84px] gap-2.5 px-1.5 py-1"
              } ${isActive ? "bg-accent-wash" : ""}`}
            >
              <span
                className={`truncate text-right ${
                  presenting ? "text-xl" : "text-[12.5px]"
                } ${isBottleneck ? "font-semibold text-critical" : "text-ink-2"} ${
                  isActive ? "font-semibold text-accent" : ""
                }`}
                title={
                  isBottleneck
                    ? `${stage.label} — maior concentração de atrasos`
                    : stage.label
                }
              >
                {i + 1}. {stage.label}
                {isBottleneck && " ⚠"}
              </span>
              <span
                className={`relative rounded overflow-hidden bg-surface-2 ${
                  presenting ? "h-11" : "h-[22px]"
                } ${isBottleneck ? "ring-[1.5px] ring-critical" : ""} ${
                  isActive ? "ring-[1.5px] ring-accent" : ""
                }`}
              >
                <span
                  className="absolute left-0 top-0 h-full rounded bg-accent"
                  style={{ width: `${(stage.count / max) * 100}%` }}
                />
              </span>
              <span
                className={`text-right font-bold tabular-nums ${
                  presenting ? "text-2xl" : "text-[13px]"
                }`}
              >
                {stage.count} {stage.count === 1 ? "pessoa" : "pessoas"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
