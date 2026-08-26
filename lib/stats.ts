import { STAGE_KEYS, STAGE_LABELS, type Colaborador } from "./types";

/** Sem SLA por etapa definido pelo negócio ainda — um limiar único serve de alerta provisório. */
export const DIAS_ATENCAO = 10;

export function diasEntre(a: Date, b: Date): number {
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

export function dataEtapaAtual(c: Colaborador): Date | null {
  if (c.etapaAtualIdx < 0) return null;
  return c.datas[STAGE_KEYS[c.etapaAtualIdx]] ?? null;
}

export function diasNaEtapaAtual(c: Colaborador, hoje: Date): number | null {
  const d = dataEtapaAtual(c);
  if (!d) return null;
  return diasEntre(new Date(d), new Date(hoje));
}

export function diasEmProcesso(c: Colaborador, hoje: Date): number | null {
  const inicio = c.datas.solicitacao;
  if (!inicio) return null;
  return diasEntre(new Date(inicio), new Date(hoje));
}

export type StatusColaborador = "concluido" | "atencao" | "andamento";

export function statusColaborador(
  c: Colaborador,
  hoje: Date,
  limiarAtencao: number = DIAS_ATENCAO
): StatusColaborador {
  if (c.concluido) return "concluido";
  const dias = diasNaEtapaAtual(c, hoje);
  if (dias !== null && dias >= limiarAtencao) return "atencao";
  return "andamento";
}

export interface FunnelStage {
  key: (typeof STAGE_KEYS)[number];
  label: string;
  /** Pessoas atualmente nesta etapa (não quantas já passaram por ela). */
  count: number;
}

export function buildFunnel(colaboradores: Colaborador[]): FunnelStage[] {
  return STAGE_KEYS.map((key, i) => ({
    key,
    label: STAGE_LABELS[key],
    count: colaboradores.filter((c) => c.etapaAtualIdx === i).length,
  }));
}

export interface Bottleneck {
  key: (typeof STAGE_KEYS)[number];
  label: string;
  /** Quantas pessoas estão paradas nesta etapa acima do limiar de atenção. */
  atencaoCount: number;
}

/** Etapa onde mais gente está parada acima do limiar de atenção agora — não a que teve maior queda. */
export function bottleneckStage(
  colaboradores: Colaborador[],
  hoje: Date,
  limiarAtencao: number
): Bottleneck | null {
  const contagem = new Map<(typeof STAGE_KEYS)[number], number>();
  colaboradores.forEach((c) => {
    if (c.etapaAtualIdx < 0 || c.concluido) return;
    if (statusColaborador(c, hoje, limiarAtencao) !== "atencao") return;
    const key = STAGE_KEYS[c.etapaAtualIdx];
    contagem.set(key, (contagem.get(key) ?? 0) + 1);
  });

  let melhorKey: (typeof STAGE_KEYS)[number] | null = null;
  let melhorCount = 0;
  for (const [key, count] of contagem) {
    if (melhorKey === null || count > melhorCount) {
      melhorKey = key;
      melhorCount = count;
    }
  }
  if (melhorKey === null) return null;
  return {
    key: melhorKey,
    label: STAGE_LABELS[melhorKey],
    atencaoCount: melhorCount,
  };
}

export function contagemPor(
  colaboradores: Colaborador[],
  field: "funcao" | "setor" | "cidade"
): { chave: string; total: number }[] {
  const map = new Map<string, number>();
  colaboradores.forEach((c) => {
    const v = c[field] || "Não informado";
    map.set(v, (map.get(v) ?? 0) + 1);
  });
  return Array.from(map, ([chave, total]) => ({ chave, total })).sort(
    (a, b) => b.total - a.total
  );
}

export function tempoMedioFunilCompleto(colaboradores: Colaborador[]): number | null {
  const concluidos = colaboradores.filter(
    (c) => c.concluido && c.datas.solicitacao && c.datas.liberacaoCliente
  );
  if (!concluidos.length) return null;
  const total = concluidos.reduce(
    (sum, c) =>
      sum + diasEntre(new Date(c.datas.solicitacao!), new Date(c.datas.liberacaoCliente!)),
    0
  );
  return Math.round(total / concluidos.length);
}

export interface PrevisaoResumo {
  /** Quantos colaboradores têm a data de previsão preenchida. */
  comPrevisao: number;
  /** Concluídos (liberação cliente) até a data prevista, inclusive. */
  noPrazo: number;
  /** Concluídos após a data prevista. */
  atrasados: number;
  /** Ainda em andamento, com a previsão já vencida. */
  emRisco: number;
  /** Média de dias entre a previsão e a liberação real (positivo = atraso), só entre os concluídos com previsão. */
  desvioMedioDias: number | null;
}

/** Compara a data prevista de conclusão do processo com a liberação real do cliente. */
export function resumoPrevisao(
  colaboradores: Colaborador[],
  hoje: Date
): PrevisaoResumo {
  const comPrevisao = colaboradores.filter((c) => c.previsaoConclusao);
  let noPrazo = 0;
  let atrasados = 0;
  let emRisco = 0;
  const desvios: number[] = [];

  comPrevisao.forEach((c) => {
    const previsao = c.previsaoConclusao!;
    if (c.concluido && c.datas.liberacaoCliente) {
      const desvio = diasEntre(new Date(previsao), new Date(c.datas.liberacaoCliente));
      desvios.push(desvio);
      if (desvio <= 0) noPrazo++;
      else atrasados++;
    } else if (!c.concluido && diasEntre(new Date(previsao), new Date(hoje)) > 0) {
      emRisco++;
    }
  });

  const desvioMedioDias = desvios.length
    ? Math.round(desvios.reduce((sum, d) => sum + d, 0) / desvios.length)
    : null;

  return { comPrevisao: comPrevisao.length, noPrazo, atrasados, emRisco, desvioMedioDias };
}

export function uniqueValues(
  colaboradores: Colaborador[],
  field: "funcao" | "setor" | "cidade" | "tipo"
): string[] {
  return Array.from(new Set(colaboradores.map((c) => c[field]))).sort();
}
