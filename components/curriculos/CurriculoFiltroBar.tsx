"use client";

export const FILTRO_TODOS = "__todos__";

export interface CurriculoFiltro {
  funcao: string;
  municipio: string;
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-ink-2">
      <span className="text-muted">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ colorScheme: "light" }}
        className="cursor-pointer bg-transparent font-medium text-ink outline-none"
      >
        <option value={FILTRO_TODOS} style={{ color: "#1b1f23", backgroundColor: "#ffffff" }}>
          Todos
        </option>
        {options.map((o) => (
          <option key={o} value={o} style={{ color: "#1b1f23", backgroundColor: "#ffffff" }}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

interface CurriculoFiltroBarProps {
  funcoes: string[];
  municipios: string[];
  filtro: CurriculoFiltro;
  onChange: (next: CurriculoFiltro) => void;
  total: number;
}

export function CurriculoFiltroBar({
  funcoes,
  municipios,
  filtro,
  onChange,
  total,
}: CurriculoFiltroBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2.5">
      <span className="mr-1 text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
        Filtros
      </span>
      <Select
        label="Função"
        value={filtro.funcao}
        options={funcoes}
        onChange={(v) => onChange({ ...filtro, funcao: v })}
      />
      <Select
        label="Município"
        value={filtro.municipio}
        options={municipios}
        onChange={(v) => onChange({ ...filtro, municipio: v })}
      />
      <span className="flex-1" />
      <span className="text-xs text-muted">{total} currículos analisados</span>
    </div>
  );
}
