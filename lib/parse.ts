import * as XLSX from "xlsx";
import {
  STAGE_KEYS,
  type Colaborador,
  type ImportResult,
  type StageKey,
} from "./types";
import {
  normalizeCidade,
  normalizeFuncao,
  normalizeHeader,
  normalizeNome,
  normalizeSetor,
} from "./normalize";

type FieldKey =
  | "nome"
  | "funcao"
  | "setor"
  | "telefone"
  | "cidade"
  | "tipo"
  | StageKey;

/** Identifica a coluna certa mesmo que a ordem/redação da planilha varie um pouco. */
function matchColumn(header: string): FieldKey | null {
  const h = normalizeHeader(header);
  if (h === "NOME") return "nome";
  if (h === "FUNCAO") return "funcao";
  if (h === "SETOR") return "setor";
  if (h.includes("TELEFONE")) return "telefone";
  if (h === "CIDADE") return "cidade";
  if (h.includes("TIPO") && h.includes("MAO DE OBRA")) return "tipo";
  if (h.includes("SOLICITACAO")) return "solicitacao";
  if (h.includes("ASSINATURA")) return "assinaturaRequisicao";
  if (h.includes("EXAME")) return "exames";
  if (h.includes("ASO")) return "aso";
  if (h.includes("DOCUMENTACAO")) return "documentacao";
  if (h === "ADMISSAO") return "admissao";
  if (h.includes("INTEGRACAO")) return "integracao";
  if (h.includes("ENVIO") && h.includes("QSMS")) return "envioDpQsms";
  if (h.includes("TREINAMENTO")) return "treinamentosQsms";
  if (h.includes("POSTAGEM")) return "postagemPlataforma";
  if (h.includes("LIBERACAO")) return "liberacaoCliente";
  if (h.includes("DISPONIVEL") || h.includes("DIPONIVEL"))
    return "disponivelObra";
  return null;
}

function excelDateToJs(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Procura a linha de cabeçalho dentro das primeiras N linhas da planilha —
 * o arquivo modelo tem 3 linhas de título/logo acima do cabeçalho real.
 */
function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    const matches = row.filter((cell) => matchColumn(String(cell ?? "")));
    if (matches.length >= 6) return i;
  }
  return -1;
}

export async function parseWorkbook(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  const headerRowIdx = findHeaderRow(rows);
  if (headerRowIdx === -1) {
    return { colaboradores: [], warnings: [], totalLinhasLidas: 0 };
  }

  const headerRow = rows[headerRowIdx];
  const columnMap: Partial<Record<FieldKey, number>> = {};
  headerRow.forEach((cell, colIdx) => {
    const field = matchColumn(String(cell ?? ""));
    if (field && columnMap[field] === undefined) columnMap[field] = colIdx;
  });

  const colaboradores: Colaborador[] = [];
  const warnings: ImportResult["warnings"] = [];
  let totalLinhasLidas = 0;

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === null || c === undefined || c === ""))
      continue;

    const get = (field: FieldKey) =>
      columnMap[field] !== undefined ? row[columnMap[field]!] : null;

    const nomeRaw = get("nome");
    totalLinhasLidas++;

    if (!nomeRaw || String(nomeRaw).trim() === "") {
      warnings.push({ linha: r + 1, motivo: "Linha sem nome — ignorada" });
      continue;
    }
    // linhas de lixo/artefato: nome só com pontuação/vírgulas
    if (!/[a-zA-ZÀ-ÿ]/.test(String(nomeRaw))) {
      warnings.push({
        linha: r + 1,
        motivo: "Conteúdo inválido na coluna Nome — ignorada",
      });
      continue;
    }

    const datas: Colaborador["datas"] = {};
    STAGE_KEYS.forEach((key) => {
      const d = excelDateToJs(get(key));
      if (d) datas[key] = d;
    });

    let etapaAtualIdx = -1;
    for (let i = STAGE_KEYS.length - 1; i >= 0; i--) {
      if (datas[STAGE_KEYS[i]]) {
        etapaAtualIdx = i;
        break;
      }
    }

    colaboradores.push({
      id: `${r}-${String(nomeRaw).trim()}`,
      nome: normalizeNome(nomeRaw),
      funcao: normalizeFuncao(get("funcao")) || "Não informado",
      setor: normalizeSetor(get("setor")) || "Não informado",
      cidade: normalizeCidade(get("cidade")) || "Não informado",
      tipo: String(get("tipo") ?? "").trim().toUpperCase() || "Não informado",
      telefone: get("telefone") ? String(get("telefone")) : null,
      datas,
      etapaAtualIdx,
      concluido: etapaAtualIdx === STAGE_KEYS.length - 1,
    });
  }

  return { colaboradores, warnings, totalLinhasLidas };
}
