import { STAGE_LABELS, STAGE_KEYS, type Colaborador } from "@/lib/types";
import {
  diasEmProcesso,
  diasNaEtapaAtual,
  statusColaborador,
} from "@/lib/stats";

interface PeopleTableProps {
  colaboradores: Colaborador[];
  hoje: Date;
  limiarAtencao: number;
  etapaFiltroLabel: string | null;
  onLimparEtapaFiltro: () => void;
  onSelect: (c: Colaborador) => void;
}

const STATUS_LABEL: Record<string, string> = {
  concluido: "Disponível na obra",
  atencao: "Requer atenção",
  andamento: "Em andamento",
};

export function PeopleTable({
  colaboradores,
  hoje,
  limiarAtencao,
  etapaFiltroLabel,
  onLimparEtapaFiltro,
  onSelect,
}: PeopleTableProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold">Colaboradores</h3>
          <p className="mt-0.5 text-xs text-muted">
            Etapa atual derivada automaticamente da última data preenchida ·
            clique numa linha para ver a linha do tempo completa
          </p>
        </div>
        {etapaFiltroLabel && (
          <button
            type="button"
            onClick={onLimparEtapaFiltro}
            className="flex items-center gap-1.5 rounded-full bg-accent-wash px-3 py-1.5 text-xs font-semibold text-accent"
          >
            Filtrando: estão em &ldquo;{etapaFiltroLabel}&rdquo;
            <span aria-hidden>✕</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <thead>
            <tr>
              {[
                "Colaborador",
                "Setor / Cidade",
                "Tipo",
                "Etapa atual",
                "Dias na etapa",
                "Dias em processo",
                "Status",
              ].map((h, i) => (
                <th
                  key={h}
                  className={`whitespace-nowrap border-b border-border-strong pb-2.5 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-muted ${
                    i >= 4 ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((c) => {
              const status = statusColaborador(c, hoje, limiarAtencao);
              const diasEtapa = diasNaEtapaAtual(c, hoje);
              const diasProc = diasEmProcesso(c, hoje);
              const etapaLabel =
                c.etapaAtualIdx >= 0
                  ? STAGE_LABELS[STAGE_KEYS[c.etapaAtualIdx]]
                  : "Sem início";
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="cursor-pointer border-b border-border hover:bg-surface-2"
                >
                  <td className="py-2.5">
                    <span className="font-semibold">{c.nome}</span>
                    <span className="block text-[11.5px] text-muted">
                      {c.funcao}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {c.setor}
                    <span className="block text-[11.5px] text-muted">
                      {c.cidade}
                    </span>
                  </td>
                  <td className="py-2.5">{c.tipo}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center rounded-full bg-accent-wash px-2.5 py-0.5 text-xs font-semibold text-accent">
                      {etapaLabel}
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {diasEtapa !== null ? `${diasEtapa}d` : "—"}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {diasProc !== null ? `${diasProc}d` : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                        status === "atencao"
                          ? "text-warning"
                          : status === "concluido"
                            ? "text-good"
                            : "text-accent"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          status === "atencao"
                            ? "bg-warning"
                            : status === "concluido"
                              ? "bg-good"
                              : "bg-accent"
                        }`}
                      />
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {colaboradores.length === 0 && (
          <p className="py-6 text-center text-xs text-muted">
            Nenhum colaborador para os filtros selecionados.
          </p>
        )}
      </div>
    </div>
  );
}
