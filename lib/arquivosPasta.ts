interface FileSystemEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
}

interface FileSystemFileEntryLike extends FileSystemEntryLike {
  file(sucesso: (file: File) => void, erro: (err: unknown) => void): void;
}

interface FileSystemDirectoryEntryLike extends FileSystemEntryLike {
  createReader(): {
    readEntries(
      sucesso: (entries: FileSystemEntryLike[]) => void,
      erro: (err: unknown) => void
    ): void;
  };
}

function ehArquivo(entry: FileSystemEntryLike): entry is FileSystemFileEntryLike {
  return entry.isFile;
}

function ehDiretorio(entry: FileSystemEntryLike): entry is FileSystemDirectoryEntryLike {
  return entry.isDirectory;
}

async function lerTodasEntradas(
  diretorio: FileSystemDirectoryEntryLike
): Promise<FileSystemEntryLike[]> {
  const reader = diretorio.createReader();
  const todas: FileSystemEntryLike[] = [];
  // readEntries só devolve um lote por vez (limite do navegador) — repete até vir vazio.
  let lote: FileSystemEntryLike[];
  do {
    lote = await new Promise<FileSystemEntryLike[]>((resolve, reject) =>
      reader.readEntries(resolve, reject)
    );
    todas.push(...lote);
  } while (lote.length > 0);
  return todas;
}

async function percorrerEntrada(entry: FileSystemEntryLike, destino: File[]): Promise<void> {
  if (ehArquivo(entry)) {
    const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
    destino.push(file);
  } else if (ehDiretorio(entry)) {
    const filhos = await lerTodasEntradas(entry);
    await Promise.all(filhos.map((filho) => percorrerEntrada(filho, destino)));
  }
}

/**
 * Extrai todos os arquivos de um DataTransfer, incluindo os que estão dentro
 * de pastas e subpastas arrastadas (usa a API de FileSystemEntry quando
 * disponível; cai para dataTransfer.files se o navegador não suportar).
 */
export async function arquivosDeDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const items = dataTransfer.items;
  if (!items || items.length === 0) return Array.from(dataTransfer.files);

  const entradas: FileSystemEntryLike[] = [];
  for (let i = 0; i < items.length; i++) {
    const getAsEntry = (
      items[i] as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntryLike | null }
    ).webkitGetAsEntry;
    const entry = getAsEntry?.call(items[i]);
    if (entry) entradas.push(entry);
  }

  if (entradas.length === 0) return Array.from(dataTransfer.files);

  const arquivos: File[] = [];
  await Promise.all(entradas.map((entry) => percorrerEntrada(entry, arquivos)));
  return arquivos;
}
