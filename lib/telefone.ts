export interface TelefoneInfo {
  /** Telefone formatado para exibição, ex: (88) 99921-3200 */
  formatado: string;
  /** Só dígitos, com DDD, sem código do país */
  digitos: string;
  /** Celular brasileiro (DDD + 9 dígitos começando em 9) — compatível com WhatsApp */
  ehCelular: boolean;
}

/** Extrai e normaliza um telefone brasileiro a partir do texto livre do currículo. */
export function analisarTelefone(bruto: string | null | undefined): TelefoneInfo | null {
  if (!bruto) return null;
  let digitos = bruto.replace(/\D/g, "");
  if (digitos.length >= 12 && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  if (digitos.length === 11 && digitos[2] === "9") {
    return {
      formatado: `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`,
      digitos,
      ehCelular: true,
    };
  }
  if (digitos.length === 10) {
    return {
      formatado: `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`,
      digitos,
      ehCelular: false,
    };
  }
  return null;
}

export function linkWhatsapp(bruto: string | null | undefined): string | null {
  const info = analisarTelefone(bruto);
  if (!info || !info.ehCelular) return null;
  return `https://wa.me/55${info.digitos}`;
}
