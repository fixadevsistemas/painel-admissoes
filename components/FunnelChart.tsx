import type { StageKey } from "@/lib/types";
import type { FunnelStage } from "@/lib/stats";

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

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold">Distribuição por etapa</h3>
          <p className="mt-0.5 text-xs text-muted">
            Quantas pessoas estão em cada etapa agora — clique numa etapa
            para filtrar a tabela abaixo
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-2">
          <span className="inline-block h-2 w-2 rounded-sm bg-accent" />
          Pessoas atualmente nesta etapa
        </span>
      </div>

      <div className="flex flex-col gap-[3px]">
        {funnel.map((stage, i) => {
          const isBottleneck = stage.key === bottleneckKey;
          const isActive = stage.key === activeStageKey;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onStageClick(stage.key)}
              title={`Filtrar por quem está em: ${stage.label}`}
              className={`grid grid-cols-[168px_1fr_84px] items-center gap-2.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-surface-2 ${
                isActive ? "bg-accent-wash" : ""
              }`}
            >
              <span
                className={`truncate text-right text-[12.5px] ${
                  isBottleneck ? "font-semibold text-critical" : "text-ink-2"
                } ${isActive ? "font-semibold text-accent" : ""}`}
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
                className={`relative h-[22px] rounded overflow-hidden bg-surface-2 ${
                  isBottleneck ? "ring-[1.5px] ring-critical" : ""
                } ${isActive ? "ring-[1.5px] ring-accent" : ""}`}
              >
                <span
                  className="absolute left-0 top-0 h-full rounded bg-accent"
                  style={{ width: `${(stage.count / max) * 100}%` }}
                />
              </span>
              <span className="text-right text-[13px] font-bold tabular-nums">
                {stage.count} {stage.count === 1 ? "pessoa" : "pessoas"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
