"use client";

import { useEffect } from "react";
import { STAGE_KEYS, STAGE_LABELS, type Colaborador } from "@/lib/types";
import { diasNaEtapaAtual, statusColaborador } from "@/lib/stats";

interface TimelinePanelProps {
  colaborador: Colaborador | null;
  hoje: Date;
  limiarAtencao: number;
  onClose: () => void;
}

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function TimelinePanel({
  colaborador,
  hoje,
  limiarAtencao,
  onClose,
}: TimelinePanelProps) {
  useEffect(() => {
    if (!colaborador) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [colaborador, onClose]);

  const open = colaborador !== null;
  const status = colaborador
    ? statusColaborador(colaborador, hoje, limiarAtencao)
    : null;
  const diasEtapa = colaborador ? diasNaEtapaAtual(colaborador, hoje) : null;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-border-strong bg-surface shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {colaborador && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <p className="text-[17px] font-extrabold">{colaborador.nome}</p>
                <p className="mt-1 text-xs text-ink-2">
                  {colaborador.funcao} · {colaborador.setor} / {colaborador.cidade} ·{" "}
                  {colaborador.tipo}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {colaborador.telefone
                    ? `Tel: ${colaborador.telefone}`
                    : "Telefone não informado"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-surface-2 text-ink-2 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                Linha do tempo do processo
              </p>
              <div className="flex flex-col">
                {STAGE_KEYS.map((key, i) => {
                  const date = colaborador.datas[key];
                  const isDone = i < colaborador.etapaAtualIdx;
                  const isCurrent = i === colaborador.etapaAtualIdx;
                  const isLast = i === STAGE_KEYS.length - 1;
                  return (
                    <div key={key} className="grid grid-cols-[20px_1fr] gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-0.5 h-3 w-3 flex-none rounded-full border-2 ${
                            isDone
                              ? "border-accent bg-accent"
                              : isCurrent
                                ? "border-accent bg-surface ring-[3px] ring-accent-wash"
                                : "border-border-strong bg-surface-2"
                          }`}
                        />
                        {!isLast && (
                          <span
                            className={`w-0.5 flex-1 ${
                              isDone ? "bg-accent" : "bg-border-strong"
                            }`}
                            style={{ minHeight: 22 }}
                          />
                        )}
                      </div>
                      <div className="pb-5">
                        <p
                          className={`text-[13.5px] font-semibold ${
                            isDone || isCurrent ? "text-ink" : "text-muted"
                          }`}
                        >
                          {STAGE_LABELS[key]}
                        </p>
                        {date ? (
                          <p className="mt-0.5 text-xs tabular-nums text-ink-2">
                            {fmt.format(date)}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted">Pendente</p>
                        )}
                        {isCurrent && diasEtapa !== null && (
                          <p
                            className={`mt-0.5 text-[11.5px] ${
                              status === "atencao"
                                ? "font-bold text-warning"
                                : "text-muted"
                            }`}
                          >
                            {diasEtapa} dias nesta etapa
                            {status === "atencao"
                              ? " — acima do esperado"
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
