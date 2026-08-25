export async function processarComLimite<T, R>(
  itens: T[],
  limite: number,
  worker: (item: T, index: number) => Promise<R>,
  onResultado?: (resultado: R, index: number) => void
): Promise<R[]> {
  const resultados: R[] = new Array(itens.length);
  let proximo = 0;

  async function trabalhar() {
    while (proximo < itens.length) {
      const i = proximo++;
      const r = await worker(itens[i], i);
      resultados[i] = r;
      onResultado?.(r, i);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limite, itens.length) }, trabalhar)
  );
  return resultados;
}

export function arquivoParaBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result as string;
      const virgula = resultado.indexOf(",");
      resolve(virgula >= 0 ? resultado.slice(virgula + 1) : resultado);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
