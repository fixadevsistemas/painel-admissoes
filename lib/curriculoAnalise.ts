import { extrairTextoPdf } from "./pdfText";
import { analisarTelefone } from "./telefone";
import type { AnaliseCurriculo } from "./curriculoTypes";

const UFS =
  "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO";

/** Hífen, travessão (–) ou traço longo (—) — templates de currículo variam bastante. */
const TRACO = "[-–—]";
/** Separador entre datas de um período: traço OU a palavra "a" ("14/03/2024 a 29/11/2024"). */
const SEP_PERIODO = `(?:${TRACO}|\\s+a\\s+)`;
const FIM_ATUAL = "(?:atual|presente|hoje)";

/** Dicionário de funções conhecidas — ordem importa para casos ambíguos (mais específico primeiro). */
const FUNCOES: { rotulo: string; padrao: RegExp }[] = [
  { rotulo: "Mestre de Obras", padrao: /mestre de obras/i },
  { rotulo: "Técnico de Segurança do Trabalho", padrao: /t[ée]cnico(a)? de seguran[çc]a/i },
  { rotulo: "Operador de Máquinas", padrao: /operador(a)? de (motoniveladora|rolo compactador|m[áa]quinas|retroescavadeira|escavadeira|trator|empilhadeira)/i },
  { rotulo: "Motorista", padrao: /motorista/i },
  { rotulo: "Eletricista", padrao: /el[ée]tric|eletrot[ée]cnic/i },
  { rotulo: "Encanador", padrao: /encanador|bombeiro hidr[áa]ulico/i },
  { rotulo: "Soldador", padrao: /soldador/i },
  { rotulo: "Pintor", padrao: /pintor/i },
  { rotulo: "Carpinteiro", padrao: /carpinteir/i },
  { rotulo: "Pedreiro", padrao: /pedreir/i },
  { rotulo: "Vigia", padrao: /vig[ií]a|vigilante/i },
  { rotulo: "Auxiliar de Serviços Gerais", padrao: /aux(iliar)?\.?\s*(de)?\s*servi[çc]os gerais|\bASG\b/i },
  { rotulo: "Servente", padrao: /servente/i },
  { rotulo: "Almoxarife", padrao: /almoxarif/i },
];

/** Quantas ocorrências uma função precisa ter (fora a principal) para virar tag secundária. */
const LIMIAR_FUNCAO_SECUNDARIA = 2;
const MAX_FUNCOES_SECUNDARIAS = 3;

const NRS_RELEVANTES = ["06", "10", "11", "12", "18", "20", "33", "35"];

/** Palavras que costumam colar na frente do nome da cidade quando o PDF vira texto corrido. */
const RUIDO_MUNICIPIO = new Set([
  "solteiro", "solteira", "casado", "casada", "divorciado", "divorciada",
  "viuvo", "viúvo", "viuva", "viúva", "uniao", "união", "estavel", "estável",
  "brasileiro", "brasileira", "nacionalidade", "natural", "nascido", "nascida",
  "bairro", "estado", "civil",
]);

interface FuncaoDetectada {
  rotulo: string;
  pontos: number;
  confirmadaNoHistorico: boolean;
}

/**
 * Detecta TODAS as funções com sinal no currículo (histórico, objetivo,
 * competências) — não só certificações/cursos — para permitir que um mesmo
 * candidato seja marcado como apto a mais de uma vaga.
 */
function identificarFuncoes(texto: string, nomeArquivo: string): FuncaoDetectada[] {
  const janelasData = texto.match(/\d{2}\/(?:\d{2}\/)?\d{4}[\s\S]{0,150}/gi) ?? [];
  const janelasPeriodo = texto.match(/per[ií]odo:?[\s\S]{0,150}/gi) ?? [];
  const janelasHistorico = [...janelasData, ...janelasPeriodo];

  const detectadas: FuncaoDetectada[] = [];
  for (const { rotulo, padrao } of FUNCOES) {
    const global = new RegExp(padrao.source, padrao.flags.includes("g") ? padrao.flags : padrao.flags + "g");
    const noTexto = (texto.match(global) ?? []).length;
    const noArquivo = padrao.test(nomeArquivo) ? 2 : 0;
    const pontos = noTexto + noArquivo;
    if (pontos === 0) continue;
    const confirmadaNoHistorico = janelasHistorico.some((janela) => padrao.test(janela));
    detectadas.push({ rotulo, pontos, confirmadaNoHistorico });
  }

  return detectadas.sort((a, b) => b.pontos - a.pontos);
}

function limparRuidoMunicipio(bruto: string): string {
  // Alguns PDFs colam duas palavras sem espaço (ex: "Novo HorizonteCarnaubal").
  const separado = bruto.replace(/([a-zà-ú])([A-ZÀ-Ú])/g, "$1 $2");
  const palavras = separado.split(/\s+/);
  while (palavras.length > 1 && RUIDO_MUNICIPIO.has(palavras[0].toLowerCase())) {
    palavras.shift();
  }
  return palavras.join(" ");
}

function identificarMunicipio(texto: string): string {
  const regex = new RegExp(
    `([A-ZÀ-Ú][a-zà-úA-ZÀ-Ú']+(?:\\s[A-ZÀ-Ú][a-zà-úA-ZÀ-Ú']+){0,3})\\s*(?:,|/|${TRACO})\\s*(${UFS})\\b`,
    "g"
  );
  const contagem = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(texto))) {
    const cidade = limparRuidoMunicipio(m[1].trim());
    if (cidade.length < 3 || cidade.length > 40) continue;
    contagem.set(cidade, (contagem.get(cidade) ?? 0) + 1);
  }
  if (contagem.size === 0) return "Não informado";
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function identificarTelefone(texto: string): string {
  const match = texto.match(/\(?\d{2}\)?\s?9?\s?\d{4}[-\s]?\d{4}/);
  return match ? match[0].trim() : "Não informado";
}

const CARACTERE_NULO = String.fromCharCode(0);

function identificarNome(
  itensPrimeiraPagina: { texto: string; alturaFonte: number }[],
  nomeArquivo: string
): string {
  // Algumas fontes de título vêm com mapeamento de caracteres quebrado no PDF
  // (extrai caracteres soltos e nulos) — descarta esses fragmentos ilegíveis.
  const itensLegiveis = itensPrimeiraPagina
    .map((i) => ({ ...i, texto: i.texto.split(CARACTERE_NULO).join("").trim() }))
    .filter((i) => /[a-zà-ú]{2,}/i.test(i.texto));

  if (itensLegiveis.length > 0) {
    const maiorFonte = Math.max(...itensLegiveis.map((i) => i.alturaFonte));
    // pdf.js frequentemente quebra o nome em um item por palavra — junta todos
    // os itens na (aproximadamente) maior fonte da página, na ordem em que aparecem.
    const limiar = maiorFonte * 0.95;
    const linha = itensLegiveis
      .filter((i) => i.alturaFonte >= limiar)
      .map((i) => i.texto)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const palavras = linha.split(/\s+/).filter(Boolean);
    // Um nome de verdade é curto — se "colou" um parágrafo inteiro (fonte de
    // título ilegível fazendo o maior tamanho "real" cair no corpo do texto),
    // essas travas rejeitam e caem no fallback pelo nome do arquivo.
    if (palavras.length >= 2 && palavras.length <= 6 && linha.length <= 60) {
      return linha;
    }
  }
  // Fallback: nome de arquivo costuma trazer "FUNÇÃO - Nome Completo - CPF.pdf"
  const semExtensao = nomeArquivo.replace(/\.pdf$/i, "");
  const partes = semExtensao.split(/\s*-\s*/).filter(Boolean);
  const semCpf = partes.filter((p) => !/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(p));
  const provavel = semCpf.sort((a, b) => b.length - a.length)[0];
  return provavel || semExtensao;
}

function mesesEntre(anoIni: number, mesIni: number, anoFim: number, mesFim: number): number {
  const meses = (anoFim - anoIni) * 12 + (mesFim - mesIni);
  return meses > 0 && meses < 600 ? meses : 0;
}

function estimarMesesExperiencia(texto: string): number {
  let total = 0;
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;
  let m: RegExpExecArray | null;

  // Formato "DD/MM/AAAA a DD/MM/AAAA" ou "DD/MM/AAAA a Atual"
  const regexDia = new RegExp(
    `(\\d{2})/(\\d{2})/(\\d{4})\\s*${SEP_PERIODO}\\s*(?:(\\d{2})/(\\d{2})/(\\d{4})|${FIM_ATUAL})`,
    "gi"
  );
  while ((m = regexDia.exec(texto))) {
    const anoFim = m[6] ? Number(m[6]) : anoAtual;
    const mesFim = m[5] ? Number(m[5]) : mesAtual;
    total += mesesEntre(Number(m[3]), Number(m[2]), anoFim, mesFim);
  }

  // Formato "MM/AAAA - MM/AAAA" ou "MM/AAAA - Atual" — não reconta o que já
  // foi capturado como DD/MM/AAAA acima (lookbehind evita casar a cauda dele).
  const regexMes = new RegExp(
    `(?<!\\d{2}/)(\\d{2})/(\\d{4})\\s*${SEP_PERIODO}\\s*(?:(\\d{2})/(\\d{4})|${FIM_ATUAL})`,
    "gi"
  );
  while ((m = regexMes.exec(texto))) {
    const anoFim = m[4] ? Number(m[4]) : anoAtual;
    const mesFim = m[3] ? Number(m[3]) : mesAtual;
    total += mesesEntre(Number(m[2]), Number(m[1]), anoFim, mesFim);
  }

  // Duração escrita por extenso, mas só perto do rótulo "Período:" — evita
  // pegar "Idade: 23 Anos" ou outros números soltos seguidos de "anos".
  const regexPeriodoTexto = /per[ií]odo:?\s*(\d{1,2})\s*anos?(?:\s*e\s*(\d{1,2})\s*meses?)?\b|per[ií]odo:?\s*(\d{1,2})\s*meses?\b/gi;
  while ((m = regexPeriodoTexto.exec(texto))) {
    if (m[1]) {
      total += Number(m[1]) * 12 + (m[2] ? Number(m[2]) : 0);
    } else if (m[3]) {
      total += Number(m[3]);
    }
  }

  return Math.min(total, 600);
}

function identificarNrs(texto: string): string[] {
  const encontradas = new Set<string>();
  const regex = /NR[\s-]?(\d{1,2})/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(texto))) {
    const numero = m[1].padStart(2, "0");
    if (NRS_RELEVANTES.includes(numero)) encontradas.add(numero);
  }
  return [...encontradas].sort();
}

function identificarCnh(texto: string): string | null {
  const comCategoria = texto.match(/CNH:?\s*(?:categoria\s*)?([A-E](?:\s*\/\s*[A-E])*)\b/i);
  if (comCategoria) return `CNH ${comCategoria[1].replace(/\s*\/\s*/g, "/").toUpperCase()}`;
  if (/\bCNH\b|carteira nacional de habilita[çc][ãa]o/i.test(texto)) return "CNH";
  return null;
}

function calcularPontuacaoEObservacao(
  meses: number,
  nrs: string[],
  cnh: string | null,
  confirmadaNoHistorico: boolean,
  funcaoIdentificada: boolean
): { pontuacao: number; observacao: string } {
  const anos = Math.round((meses / 12) * 10) / 10;

  const pExperiencia = Math.min(meses / 36, 1) * 30;
  const pCertificacoes = Math.min(nrs.length, 5) * 5;
  const pCnh = cnh ? 10 : 0;
  const pAderencia = !funcaoIdentificada ? 0 : confirmadaNoHistorico ? 15 : 5;
  const pontuacao = Math.round(20 + pExperiencia + pCertificacoes + pCnh + pAderencia);

  const partes: string[] = [];
  partes.push(
    meses > 0
      ? `${anos} ${anos === 1 ? "ano" : "anos"} de experiência identificados`
      : "Nenhuma experiência com duração identificável"
  );
  partes.push(
    nrs.length > 0
      ? `certificações: ${nrs.map((n) => `NR-${n}`).join(", ")}`
      : "sem certificações de segurança identificadas"
  );
  if (cnh) partes.push(`possui ${cnh}`);
  if (funcaoIdentificada && !confirmadaNoHistorico) {
    partes.push("função não confirmada no histórico profissional");
  }

  return { pontuacao: Math.max(0, Math.min(100, pontuacao)), observacao: partes.join("; ") + "." };
}

export async function analisarCurriculoLocal(file: File): Promise<AnaliseCurriculo> {
  const { texto, itensPrimeiraPagina } = await extrairTextoPdf(file);
  if (!texto.trim()) {
    throw new Error("Não foi possível extrair texto deste PDF (pode ser uma imagem escaneada).");
  }

  const funcoesDetectadas = identificarFuncoes(texto, file.name);
  const principal = funcoesDetectadas[0];
  const funcao = principal?.rotulo ?? "Não identificada";
  const confirmadaNoHistorico = principal?.confirmadaNoHistorico ?? false;
  const funcoesSecundarias = funcoesDetectadas
    .slice(1)
    .filter((f) => f.pontos >= LIMIAR_FUNCAO_SECUNDARIA)
    .slice(0, MAX_FUNCOES_SECUNDARIAS)
    .map((f) => f.rotulo);

  const municipio = identificarMunicipio(texto);
  const telefoneBruto = identificarTelefone(texto);
  const telefone = analisarTelefone(telefoneBruto)?.formatado ?? telefoneBruto;
  const nome = identificarNome(itensPrimeiraPagina, file.name);
  const meses = estimarMesesExperiencia(texto);
  const nrs = identificarNrs(texto);
  const cnh = identificarCnh(texto);
  const competencias = [...nrs.map((n) => `NR-${n}`), ...(cnh ? [cnh] : [])];

  const { pontuacao, observacao } = calcularPontuacaoEObservacao(
    meses,
    nrs,
    cnh,
    confirmadaNoHistorico,
    funcao !== "Não identificada"
  );

  return {
    nome,
    funcao,
    municipio,
    telefone,
    pontuacao,
    observacao,
    funcoesSecundarias,
    competencias,
  };
}
