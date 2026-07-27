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
    (c) => c.concluido && c.datas.solicitacao && c.datas.disponivelObra
  );
  if (!concluidos.length) return null;
  const total = concluidos.reduce(
    (sum, c) =>
      sum + diasEntre(new Date(c.datas.solicitacao!), new Date(c.datas.disponivelObra!)),
    0
  );
  return Math.round(total / concluidos.length);
}

export function uniqueValues(
  colaboradores: Colaborador[],
  field: "funcao" | "setor" | "cidade" | "tipo"
): string[] {
  return Array.from(new Set(colaboradores.map((c) => c[field]))).sort();
}
