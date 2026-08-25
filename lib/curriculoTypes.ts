import { z } from "zod";

export const AnaliseCurriculoSchema = z.object({
  nome: z.string().describe("Nome completo do candidato"),
  funcao: z
    .string()
    .describe(
      "Função de obra mais adequada ao candidato (ex: Pedreiro, Servente, Eletricista, Vigia, Auxiliar de Serviços Gerais, Motorista, Operador de Máquinas ou outra claramente indicada no currículo)"
    ),
  municipio: z
    .string()
    .describe(
      "Município/cidade onde o candidato reside, conforme endereço ou histórico do currículo. 'Não informado' se não for possível identificar."
    ),
  telefone: z
    .string()
    .describe(
      "Telefone de contato do candidato, exatamente como aparece no currículo (com DDD). 'Não informado' se não houver telefone no currículo."
    ),
  pontuacao: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "Nota de 0 a 100 indicando o quão qualificado o candidato está para a função identificada"
    ),
  observacao: z
    .string()
    .describe(
      "Observação curta (no máximo 2 frases) com o principal ponto forte e/ou de atenção do candidato para essa função"
    ),
  funcoesSecundarias: z
    .array(z.string())
    .default([])
    .describe(
      "Outras funções em que o candidato também se encaixaria, com base em experiência/competências mencionadas no currículo (não apenas a função principal)"
    ),
  competencias: z
    .array(z.string())
    .default([])
    .describe(
      "Certificações e competências identificadas (ex: NR-18, CNH categoria B)"
    ),
});

export type AnaliseCurriculo = z.infer<typeof AnaliseCurriculoSchema>;

export interface CandidatoAnalisado extends AnaliseCurriculo {
  id: string;
  arquivoNome: string;
  status: "ok";
}

export interface CandidatoComErro {
  id: string;
  arquivoNome: string;
  status: "erro";
  mensagem: string;
}

export type ResultadoCurriculo = CandidatoAnalisado | CandidatoComErro;
