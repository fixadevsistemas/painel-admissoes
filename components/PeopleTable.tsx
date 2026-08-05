"use client";

import { STAGE_LABELS, STAGE_KEYS, type Colaborador } from "@/lib/types";
import {
  diasEmProcesso,
  diasNaEtapaAtual,
  statusColaborador,
} from "@/lib/stats";
import { usePresentMode } from "@/lib/usePresentMode";
import { PresentButton } from "./PresentButton";

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
  const { ref, presenting, toggle } = usePresentMode<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-border bg-surface ${
        presenting ? "flex h-full flex-col p-12" : "p-5"
      }`}
    >
      <div
        className={`flex flex-wrap items-start justify-between gap-3 ${
          presenting ? "mb-8" : "mb-3.5"
        }`}
      >
        <div>
          <h3 className={presenting ? "text-3xl font-bold" : "text-[15px] font-bold"}>
            Colaboradores
          </h3>
          {!presenting && (
            <p className="mt-0.5 text-xs text-muted">
              Etapa atual derivada automaticamente da última data preenchida ·
              clique numa linha para ver a linha do tempo completa
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {etapaFiltroLabel && (
            <button
              type="button"
              onClick={onLimparEtapaFiltro}
              className={`flex items-center gap-1.5 rounded-full bg-accent-wash font-semibold text-accent ${
                presenting ? "px-4 py-2 text-base" : "px-3 py-1.5 text-xs"
              }`}
            >
              Filtrando: estão em &ldquo;{etapaFiltroLabel}&rdquo;
              <span aria-hidden>✕</span>
            </button>
          )}
          <PresentButton presenting={presenting} onToggle={toggle} />
        </div>
      </div>

      <div className={presenting ? "flex-1 overflow-auto" : "overflow-x-auto"}>
        <table
          className={`w-full min-w-[760px] border-collapse ${
            presenting ? "text-xl" : "text-[13px]"
          }`}
        >
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
                  className={`whitespace-nowrap border-b border-border-strong text-left font-bold uppercase tracking-[0.06em] text-muted ${
                    presenting
                      ? "bg-surface pb-4 text-sm sticky top-0"
                      : "pb-2.5 text-[11px]"
                  } ${i >= 4 ? "text-right" : ""}`}
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
              const cellPad = presenting ? "py-4" : "py-2.5";
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="cursor-pointer border-b border-border hover:bg-surface-2"
                >
                  <td className={cellPad}>
                    <span className="font-semibold">{c.nome}</span>
                    <span
                      className={`block text-muted ${
                        presenting ? "text-base" : "text-[11.5px]"
                      }`}
                    >
                      {c.funcao}
                    </span>
                  </td>
                  <td className={cellPad}>
                    {c.setor}
                    <span
                      className={`block text-muted ${
                        presenting ? "text-base" : "text-[11.5px]"
                      }`}
                    >
                      {c.cidade}
                    </span>
                  </td>
                  <td className={cellPad}>{c.tipo}</td>
                  <td className={cellPad}>
                    <span
                      className={`inline-flex items-center rounded-full bg-accent-wash font-semibold text-accent ${
                        presenting ? "px-3 py-1 text-base" : "px-2.5 py-0.5 text-xs"
                      }`}
                    >
                      {etapaLabel}
                    </span>
                  </td>
                  <td className={`${cellPad} text-right tabular-nums`}>
                    {diasEtapa !== null ? `${diasEtapa}d` : "—"}
                  </td>
                  <td className={`${cellPad} text-right tabular-nums`}>
                    {diasProc !== null ? `${diasProc}d` : "—"}
                  </td>
                  <td className={`${cellPad} text-right`}>
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold ${
                        presenting ? "text-base" : "text-xs"
                      } ${
                        status === "atencao"
                          ? "text-warning"
                          : status === "concluido"
                            ? "text-good"
                            : "text-accent"
                      }`}
                    >
                      <span
                        className={`rounded-full ${presenting ? "h-2.5 w-2.5" : "h-1.5 w-1.5"} ${
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
