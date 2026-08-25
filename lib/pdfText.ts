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
