let workerConfigurado = false;

async function carregarPdfjs() {
  // Import dinâmico: pdfjs-dist toca em globals de navegador (DOMMatrix) na
  // carga do módulo, o que quebra o prerender do Next.js em Node se
  // importado estaticamente. Isso só roda no navegador, sob demanda.
  const pdfjsLib = await import("pdfjs-dist");
  if (!workerConfigurado) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    workerConfigurado = true;
  }
  return pdfjsLib;
}

export interface PdfExtraido {
  texto: string;
  /** Itens de texto da primeira página, com a altura aproximada da fonte (transform[3]). */
  itensPrimeiraPagina: { texto: string; alturaFonte: number }[];
}

export async function extrairTextoPdf(file: File): Promise<PdfExtraido> {
  const pdfjsLib = await carregarPdfjs();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  let texto = "";
  let itensPrimeiraPagina: { texto: string; alturaFonte: number }[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i);
    const conteudo = await pagina.getTextContent();
    const itens = conteudo.items.filter(
      (item): item is Extract<(typeof conteudo.items)[number], { str: string }> =>
        "str" in item
    );
    texto += itens.map((item) => item.str).join(" ") + "\n";
    if (i === 1) {
      itensPrimeiraPagina = itens
        .filter((item) => item.str.trim())
        .map((item) => ({
          texto: item.str.trim(),
          alturaFonte: Math.abs(item.transform[3]) || 0,
        }));
    }
  }

  return { texto, itensPrimeiraPagina };
}

type Matriz = [number, number, number, number, number, number];
const IDENTIDADE: Matriz = [1, 0, 0, 1, 0, 0];

/** Multiplica matrizes 2D no formato PDF [a b c d e f] — aplica `m1` e depois `m2`. */
function multiplicarMatrizes(m1: Matriz, m2: Matriz): Matriz {
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
  ];
}

function aplicarMatriz(m: Matriz, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/**
 * Procura a maior imagem com proporção de retrato/foto (não logo/ícone) na
 * primeira página e devolve um recorte em data URL — usada como foto do
 * candidato quando o currículo tem uma inserida. `null` se não achar nenhuma.
 */
export async function extrairFotoPdf(file: File): Promise<string | null> {
  try {
    const pdfjsLib = await carregarPdfjs();
    const buffer = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pagina = await doc.getPage(1);
    const opList = await pagina.getOperatorList();
    const OPS = pdfjsLib.OPS;

    let atual: Matriz = IDENTIDADE;
    const pilha: Matriz[] = [];
    const candidatos: { nome: string; matriz: Matriz }[] = [];

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];
      if (fn === OPS.save) {
        pilha.push(atual);
      } else if (fn === OPS.restore) {
        atual = pilha.pop() ?? IDENTIDADE;
      } else if (fn === OPS.transform) {
        atual = multiplicarMatrizes(args as Matriz, atual);
      } else if (fn === OPS.paintFormXObjectBegin) {
        pilha.push(atual);
        const matrizForm = args?.[0] as Matriz | null;
        if (matrizForm) atual = multiplicarMatrizes(matrizForm, atual);
      } else if (fn === OPS.paintFormXObjectEnd) {
        atual = pilha.pop() ?? IDENTIDADE;
      } else if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) {
        candidatos.push({ nome: args[0], matriz: atual });
      }
    }

    if (candidatos.length === 0) return null;

    const viewport = pagina.getViewport({ scale: 2 });
    const transformViewport = viewport.transform as Matriz;

    const retangulos = candidatos
      .map((c) => {
        const combinada = multiplicarMatrizes(c.matriz, transformViewport);
        const pontos = [
          aplicarMatriz(combinada, 0, 0),
          aplicarMatriz(combinada, 1, 0),
          aplicarMatriz(combinada, 0, 1),
          aplicarMatriz(combinada, 1, 1),
        ];
        const xs = pontos.map((p) => p[0]);
        const ys = pontos.map((p) => p[1]);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const w = Math.max(...xs) - x;
        const h = Math.max(...ys) - y;
        return { x, y, w, h };
      })
      .filter((r) => r.w >= 50 && r.h >= 50);

    if (retangulos.length === 0) return null;

    // Fotos de currículo tendem a ser quadradas/retrato — banners e logos são mais largos que altos.
    const comProporcaoDeFoto = retangulos.filter((r) => {
      const proporcao = r.w / r.h;
      return proporcao >= 0.55 && proporcao <= 1.7;
    });
    const pool = comProporcaoDeFoto.length > 0 ? comProporcaoDeFoto : retangulos;
    pool.sort((a, b) => b.w * b.h - a.w * a.h);
    const melhor = pool[0];

    const canvasPagina = document.createElement("canvas");
    canvasPagina.width = viewport.width;
    canvasPagina.height = viewport.height;
    const ctxPagina = canvasPagina.getContext("2d");
    if (!ctxPagina) return null;
    await pagina.render({ canvas: canvasPagina, canvasContext: ctxPagina, viewport }).promise;

    const w = Math.round(melhor.w);
    const h = Math.round(melhor.h);
    const canvasRecorte = document.createElement("canvas");
    canvasRecorte.width = w;
    canvasRecorte.height = h;
    const ctxRecorte = canvasRecorte.getContext("2d");
    if (!ctxRecorte) return null;
    ctxRecorte.drawImage(
      canvasPagina,
      Math.round(melhor.x),
      Math.round(melhor.y),
      w,
      h,
      0,
      0,
      w,
      h
    );

    return canvasRecorte.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}
