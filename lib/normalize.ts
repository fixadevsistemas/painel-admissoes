export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Corrige erros de digitação recorrentes encontrados na planilha original. */
const FUNCAO_FIXES: Record<string, string> = {
  "AUXILIXAR DE SERVICOS GERAIS": "AUXILIAR DE SERVIÇOS GERAIS",
};

const SETOR_FIXES: Record<string, string> = {
  TERRAPLEMAGEM: "TERRAPLENAGEM",
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((w) =>
      ["de", "da", "do", "das", "dos", "e"].includes(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

export function normalizeCategoria(
  raw: unknown,
  fixes: Record<string, string>
): string {
  const clean = normalizeHeader(raw);
  if (!clean) return "";
  const fixed = fixes[clean] ?? clean;
  return titleCase(fixed);
}

export function normalizeFuncao(raw: unknown): string {
  return normalizeCategoria(raw, FUNCAO_FIXES);
}

export function normalizeSetor(raw: unknown): string {
  return normalizeCategoria(raw, SETOR_FIXES);
}

export function normalizeCidade(raw: unknown): string {
  return normalizeCategoria(raw, {});
}

export function normalizeNome(raw: unknown): string {
  const clean = String(raw ?? "").trim();
  return titleCase(clean);
}
