export const STAGE_KEYS = [
  "solicitacao",
  "assinaturaRequisicao",
  "exames",
  "aso",
  "documentacao",
  "admissao",
  "integracao",
  "envioDpQsms",
  "treinamentosQsms",
  "postagemPlataforma",
  "liberacaoCliente",
  "disponivelObra",
] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export const STAGE_LABELS: Record<StageKey, string> = {
  solicitacao: "Solicitação da contratação",
  assinaturaRequisicao: "Assinatura da requisição",
  exames: "Realização de exames",
  aso: "Recebimento do ASO",
  documentacao: "Documentação",
  admissao: "Admissão",
  integracao: "Integração",
  envioDpQsms: "Envio doc. DP → QSMS",
  treinamentosQsms: "Treinamentos QSMS",
  postagemPlataforma: "Postagem plataforma cliente",
  liberacaoCliente: "Liberação cliente",
  disponivelObra: "Disponível na obra",
};

export type TipoMaoDeObra = "DIRETA" | "INDIRETA" | string;

export interface Colaborador {
  id: string;
  nome: string;
  funcao: string;
  setor: string;
  cidade: string;
  tipo: TipoMaoDeObra;
  telefone: string | null;
  /** true = alojado pela empresa, false = local (já reside na cidade da obra) */
  alojado: boolean;
  datas: Partial<Record<StageKey, Date>>;
  /** índice da última etapa com data preenchida, -1 se nenhuma */
  etapaAtualIdx: number;
  concluido: boolean;
}

export interface ImportWarning {
  linha: number;
  motivo: string;
}

export interface ImportResult {
  colaboradores: Colaborador[];
  warnings: ImportWarning[];
  totalLinhasLidas: number;
}
