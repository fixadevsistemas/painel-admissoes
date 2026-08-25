"use client";

import { useMemo, useState } from "react";
import { ImportPanel } from "@/components/ImportPanel";
import { FilterBar, FILTRO_TODOS, type FiltroState } from "@/components/FilterBar";
import { KpiRow } from "@/components/KpiRow";
import { FunnelChart } from "@/components/FunnelChart";
import { CategoryBars } from "@/components/CategoryBars";
import { PeopleTable } from "@/components/PeopleTable";
import { TimelinePanel } from "@/components/TimelinePanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { parseWorkbook } from "@/lib/parse";
import {
  STAGE_KEYS,
  STAGE_LABELS,
  type Colaborador,
  type ImportResult,
  type StageKey,
} from "@/lib/types";
import {
  bottleneckStage,
  buildFunnel,
  contagemPor,
  DIAS_ATENCAO,
  statusColaborador,
  tempoMedioFunilCompleto,
  uniqueValues,
} from "@/lib/stats";

const FILTRO_INICIAL: FiltroState = {
  setor: FILTRO_TODOS,
  funcao: FILTRO_TODOS,
  cidade: FILTRO_TODOS,
  tipo: FILTRO_TODOS,
  alojamento: FILTRO_TODOS,
};

export default function Home() {
  const [dados, setDados] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroState>(FILTRO_INICIAL);
  const [selecionado, setSelecionado] = useState<Colaborador | null>(null);
  const [limiarAtencao, setLimiarAtencao] = useState(DIAS_ATENCAO);
  const [etapaFiltro, setEtapaFiltro] = useState<StageKey | null>(null);
  const hoje = useMemo(() => new Date(), []);

  async function importar(file: File) {
    setLoading(true);
    setError(null);
    try {
      const result = await parseWorkbook(file);
      if (result.colaboradores.length === 0) {
        setError(
          "Não encontrei colunas reconhecíveis nessa planilha. Confira se ela segue o modelo de Controle de Admissões."
        );
        setLoading(false);
        return;
      }
      setDados(result);
      setFiltro(FILTRO_INICIAL);
      setEtapaFiltro(null);
    } catch {
      setError("Não foi possível ler esse arquivo. Confira se é um .xlsx válido.");
    } finally {
      setLoading(false);
    }
  }

  const colaboradores = useMemo(() => dados?.colaboradores ?? [], [dados]);

  const filtrados = useMemo(() => {
    return colaboradores.filter((c) => {
      if (filtro.setor !== FILTRO_TODOS && c.setor !== filtro.setor) return false;
      if (filtro.funcao !== FILTRO_TODOS && c.funcao !== filtro.funcao) return false;
      if (filtro.cidade !== FILTRO_TODOS && c.cidade !== filtro.cidade) return false;
      if (filtro.tipo !== FILTRO_TODOS && c.tipo !== filtro.tipo) return false;
      if (filtro.alojamento !== FILTRO_TODOS) {
        const querAlojado = filtro.alojamento === "Alojado";
        if (c.alojado !== querAlojado) return false;
      }
      return true;
    });
  }, [colaboradores, filtro]);

  const funnel = useMemo(() => buildFunnel(filtrados), [filtrados]);
  const bottleneck = useMemo(
    () => bottleneckStage(filtrados, hoje, limiarAtencao),
    [filtrados, hoje, limiarAtencao]
  );
  const tempoMedio = useMemo(() => tempoMedioFunilCompleto(filtrados), [filtrados]);
  const concluidos = filtrados.filter((c) => c.concluido).length;
  const atencao = filtrados.filter(
    (c) => statusColaborador(c, hoje, limiarAtencao) === "atencao"
  ).length;
  const emProcesso = filtrados.length - concluidos;

  const porFuncao = useMemo(() => contagemPor(filtrados, "funcao"), [filtrados]);
  const porSetor = useMemo(() => contagemPor(filtrados, "setor"), [filtrados]);
  const porCidade = useMemo(() => contagemPor(filtrados, "cidade"), [filtrados]);

  const filtradosTabela = useMemo(() => {
    if (!etapaFiltro) return filtrados;
    const idx = STAGE_KEYS.indexOf(etapaFiltro);
    return filtrados.filter((c) => c.etapaAtualIdx === idx);
  }, [filtrados, etapaFiltro]);

  function alternarEtapaFiltro(key: StageKey) {
    setEtapaFiltro((atual) => (atual === key ? null : key));
  }

  if (!dados) {
    return (
      <ImportPanel loading={loading} error={error} onFile={importar} />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-strong pb-4">
          <div>
            <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.11em] text-accent">
              DHO · Mobilização de Pessoal
            </p>
            <h1 className="text-[25px] font-extrabold tracking-tight">
              Painel de Admissões — Obras
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-2">
              Acompanhamento do funil de contratação, da solicitação até a
              liberação em campo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/curriculos"
              className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:text-ink"
            >
              Avaliação de Currículos
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <FilterBar
          setores={uniqueValues(colaboradores, "setor")}
          funcoes={uniqueValues(colaboradores, "funcao")}
          cidades={uniqueValues(colaboradores, "cidade")}
          tipos={uniqueValues(colaboradores, "tipo")}
          filtro={filtro}
          onChange={setFiltro}
          totalPeriodo={colaboradores.length}
          onReimportar={() => setDados(null)}
          limiarAtencao={limiarAtencao}
          onLimiarChange={setLimiarAtencao}
        />

        <KpiRow
          emProcesso={emProcesso}
          concluidos={concluidos}
          atencao={atencao}
          tempoMedio={tempoMedio}
          bottleneck={bottleneck}
        />

        <FunnelChart
          funnel={funnel}
          bottleneckKey={bottleneck?.key}
          activeStageKey={etapaFiltro}
          onStageClick={alternarEtapaFiltro}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <CategoryBars title="Por função" data={porFuncao} sectionKey="funcao" />
          <CategoryBars title="Por setor" data={porSetor} sectionKey="setor" />
          <CategoryBars
            title="Por cidade da obra"
            data={porCidade}
            sectionKey="cidade"
          />
        </div>

        <PeopleTable
          colaboradores={filtradosTabela}
          hoje={hoje}
          limiarAtencao={limiarAtencao}
          etapaFiltroLabel={etapaFiltro ? STAGE_LABELS[etapaFiltro] : null}
          onLimparEtapaFiltro={() => setEtapaFiltro(null)}
          onSelect={setSelecionado}
        />
      </div>

      <TimelinePanel
        colaborador={selecionado}
        hoje={hoje}
        limiarAtencao={limiarAtencao}
        onClose={() => setSelecionado(null)}
      />
    </div>
  );
}
