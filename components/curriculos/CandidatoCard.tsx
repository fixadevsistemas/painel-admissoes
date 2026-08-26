import type { CandidatoAnalisado } from "@/lib/curriculoTypes";
import { analisarTelefone, linkWhatsapp } from "@/lib/telefone";

function corPontuacao(pontuacao: number): { cor: string; rotulo: string } {
  if (pontuacao >= 70) return { cor: "var(--good)", rotulo: "Boa aderência" };
  if (pontuacao >= 40) return { cor: "var(--warning)", rotulo: "Aderência parcial" };
  return { cor: "var(--critical)", rotulo: "Baixa aderência" };
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] ?? "" : "";
  return (primeira + ultima).toUpperCase();
}

function FotoCandidato({ foto, nome }: { foto: string | null; nome: string }) {
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL gerada no navegador, não passa por otimização de imagem do Next
      <img
        src={foto}
        alt={`Foto de ${nome}`}
        className="h-11 w-11 flex-none rounded-full border border-border-strong object-cover"
      />
    );
  }
  return (
    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-border-strong bg-surface-2 text-xs font-bold text-muted">
      {iniciais(nome)}
    </span>
  );
}

function IconeWhatsapp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5-.1-.1-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3z" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.5.9 3.3 1.4 5.2 1.4 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3.2 1 1-3.1-.2-.3C3.7 15 3.2 13.5 3.2 12c0-4.8 3.9-8.7 8.7-8.7s8.7 3.9 8.7 8.7-3.9 8.7-8.6 8.7z" />
    </svg>
  );
}

export function CandidatoCard({
  candidato,
  melhorColocado,
}: {
  candidato: CandidatoAnalisado;
  melhorColocado?: boolean;
}) {
  const { cor, rotulo } = corPontuacao(candidato.pontuacao);
  const telefone = analisarTelefone(candidato.telefone);
  const whatsapp = linkWhatsapp(candidato.telefone);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <FotoCandidato foto={candidato.foto} nome={candidato.nome} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{candidato.nome}</p>
              {melhorColocado && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-wash px-2 py-0.5 text-[10.5px] font-bold text-accent">
                  ★ Melhor colocado
                </span>
              )}
            </div>
            <p className="text-xs text-muted">
              {candidato.municipio} · {candidato.arquivoNome}
            </p>
          </div>
        </div>
        <span className="text-lg font-extrabold tabular-nums" style={{ color: cor }}>
          {candidato.pontuacao}
        </span>
      </div>

      <div className="mb-2 h-2 rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${candidato.pontuacao}%`, background: cor }}
        />
      </div>
      <p className="mb-2 text-[11px] font-semibold" style={{ color: cor }}>
        {rotulo}
      </p>

      <p className="text-sm text-ink-2">{candidato.observacao}</p>

      {candidato.competencias.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {candidato.competencias.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border-strong px-2 py-0.5 text-[10.5px] font-medium text-ink-2"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {candidato.funcoesSecundarias.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] text-muted">Também se encaixa em:</span>
          {candidato.funcoesSecundarias.map((f) => (
            <span
              key={f}
              className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
              style={{ background: "var(--cat-2)", color: "#ffffff" }}
            >
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted">
          {telefone ? telefone.formatado : candidato.telefone || "Telefone não informado"}
        </span>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "var(--good)" }}
          >
            <IconeWhatsapp />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
