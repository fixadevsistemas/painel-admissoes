"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadCurriculos } from "@/components/curriculos/UploadCurriculos";
import {
  CurriculoFiltroBar,
  FILTRO_TODOS,
  type CurriculoFiltro,
} from "@/components/curriculos/CurriculoFiltroBar";
import { CandidatoCard } from "@/components/curriculos/CandidatoCard";
import { processarComLimite } from "@/lib/processarLote";
import { analisarCurriculoLocal } from "@/lib/curriculoAnalise";
import type { ResultadoCurriculo } from "@/lib/curriculoTypes";

const FILTRO_INICIAL: CurriculoFiltro = {
  funcao: FILTRO_TODOS,
  municipio: FILTRO_TODOS,
};

const CONCORRENCIA = 4;

async function analisarUm(file: File, id: string): Promise<ResultadoCurriculo> {
  try {
    const analise = await analisarCurriculoLocal(file);
    return { id, arquivoNome: file.name, status: "ok", ...analise };
  } catch (err) {
    return {
      id,
      arquivoNome: file.name,
      status: "erro",
      mensagem: err instanceof Error ? err.message : "Falha ao analisar o currículo.",
    };
  }
}

export default function CurriculosPage() {
  const [candidatos, setCandidatos] = useState<ResultadoCurriculo[]>([]);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState({ total: 0, concluidos: 0 });
  const [filtro, setFiltro] = useState<CurriculoFiltro>(FILTRO_INICIAL);

  async function handleFiles(files: File[]) {
    setProcessando(true);
    setProgresso((p) => ({ total: p.total + files.length, concluidos: p.concluidos }));

    const itens = files.map((file, i) => ({
      file,
      id: `${Date.now()}-${i}-${file.name}`,
    }));

    await processarComLimite(
      itens,
      CONCORRENCIA,
      ({ file, id }) => analisarUm(file, id),
      (resultado) => {
        setCandidatos((atual) => [...atual, resultado]);
        setProgresso((p) => ({ ...p, concluidos: p.concluidos + 1 }));
      }
    );

    setProcessando(false);
  }

  function novaAnalise() {
    setCandidatos([]);
    setProgresso({ total: 0, concluidos: 0 });
    setFiltro(FILTRO_INICIAL);
  }

  const ok = useMemo(
    () => candidatos.filter((c) => c.status === "ok"),
    [candidatos]
  );
  const erros = useMemo(
    () => candidatos.filter((c) => c.status === "erro"),
    [candidatos]
  );

  const funcoesUnicas = useMemo(
    () => Array.from(new Set(ok.map((c) => c.funcao))).sort(),
    [ok]
  );
  const municipiosUnicas = useMemo(
    () => Array.from(new Set(ok.map((c) => c.municipio))).sort(),
    [ok]
  );

  const filtrados = useMemo(() => {
    return ok.filter((c) => {
      if (filtro.funcao !== FILTRO_TODOS && c.funcao !== filtro.funcao) return false;
      if (filtro.municipio !== FILTRO_TODOS && c.municipio !== filtro.municipio)
        return false;
      return true;
    });
  }, [ok, filtro]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof filtrados>();
    filtrados.forEach((c) => {
      const lista = mapa.get(c.funcao) ?? [];
      lista.push(c);
      mapa.set(c.funcao, lista);
    });
    return Array.from(mapa.entries())
      .map(([funcao, lista]) => ({
        funcao,
        candidatos: [...lista].sort((a, b) => b.pontuacao - a.pontuacao),
      }))
      .sort((a, b) => b.candidatos.length - a.candidatos.length);
  }, [filtrados]);

  const temResultados = candidatos.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-strong pb-4">
          <div>
            <Link
              href="/"
              className="mb-1.5 inline-block text-[11.5px] font-bold uppercase tracking-[0.11em] text-accent"
            >
              ← Painel de Admissões
            </Link>
            <h1 className="text-[25px] font-extrabold tracking-tight">
              Avaliação de Currículos
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-2">
              Envie currículos em PDF para análise automática por regras —
              separados por função e município, tudo processado no seu
              navegador, sem armazenar nada entre sessões
            </p>
          </div>
          <ThemeToggle />
        </div>

        {!temResultados && (
          <UploadCurriculos processando={processando} onFiles={handleFiles} />
        )}

        {temResultados && (
          <div className="flex flex-wrap items-center gap-2">
            <UploadCurriculos compacto processando={processando} onFiles={handleFiles} />
            <button
              type="button"
              onClick={novaAnalise}
              disabled={processando}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink-2 hover:text-ink disabled:opacity-50"
            >
              Nova análise
            </button>
          </div>
        )}

        {processando && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-ink-2">
              <span>
                Analisando currículos… {progresso.concluidos} de {progresso.total}
              </span>
              <span className="tabular-nums">
                {Math.round((progresso.concluidos / Math.max(1, progresso.total)) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{
                  width: `${(progresso.concluidos / Math.max(1, progresso.total)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {temResultados && (
          <CurriculoFiltroBar
            funcoes={funcoesUnicas}
            municipios={municipiosUnicas}
            filtro={filtro}
            onChange={setFiltro}
            total={ok.length}
          />
        )}

        {grupos.map((grupo) => (
          <div key={grupo.funcao} className="flex flex-col gap-3">
            <h2 className="text-[15px] font-bold">
              {grupo.funcao}{" "}
              <span className="font-normal text-muted">
                ({grupo.candidatos.length}{" "}
                {grupo.candidatos.length === 1 ? "candidato" : "candidatos"})
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {grupo.candidatos.map((c, i) => (
                <CandidatoCard key={c.id} candidato={c} melhorColocado={i === 0} />
              ))}
            </div>
          </div>
        ))}

        {erros.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-[15px] font-bold text-critical">
              Não analisados ({erros.length})
            </h2>
            <div className="flex flex-col gap-2">
              {erros.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border border-critical/30 bg-surface p-3 text-sm"
                >
                  <span className="font-semibold">{e.arquivoNome}</span>
                  <span className="text-muted"> — {e.mensagem}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
