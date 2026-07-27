import type { Bottleneck } from "@/lib/stats";

interface KpiRowProps {
  emProcesso: number;
  concluidos: number;
  atencao: number;
  tempoMedio: number | null;
  bottleneck: Bottleneck | null;
}

export function KpiRow({
  emProcesso,
  concluidos,
  atencao,
  tempoMedio,
  bottleneck,
}: KpiRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4">
        <span className="text-xs font-semibold text-ink-2">Em processo</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight tabular-nums">
            {emProcesso}
          </span>
          <span className="text-xs text-muted">pessoas</span>
        </div>
        <span className="text-xs text-muted">
          {atencao > 0
            ? `${atencao} com atenção — paradas acima do esperado`
            : "nenhuma parada acima do esperado"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4">
        <span className="text-xs font-semibold text-ink-2">
          Disponíveis na obra
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight tabular-nums">
            {concluidos}
          </span>
          <span className="text-xs text-muted">pessoas</span>
        </div>
        <span className="text-xs text-muted">funil completo</span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4">
        <span className="text-xs font-semibold text-ink-2">
          Tempo médio do funil
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight tabular-nums">
            {tempoMedio ?? "—"}
          </span>
          <span className="text-xs text-muted">
            {tempoMedio !== null ? "dias" : ""}
          </span>
        </div>
        <span className="text-xs text-muted">solicitação → obra</span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border p-4 border-warning/45">
        <span className="text-xs font-semibold text-ink-2">
          Maior ponto de retenção
        </span>
        <span className="text-lg font-extrabold tracking-tight">
          {bottleneck ? bottleneck.label : "—"}
        </span>
        <span className="text-xs font-semibold text-warning">
          {bottleneck
            ? `${bottleneck.atencaoCount} ${bottleneck.atencaoCount === 1 ? "pessoa parada" : "pessoas paradas"} aqui acima do esperado`
            : "ninguém parado acima do esperado"}
        </span>
      </div>
    </div>
  );
}
