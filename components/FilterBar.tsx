"use client";

export interface FiltroState {
  setor: string;
  funcao: string;
  cidade: string;
  tipo: string;
}

export const FILTRO_TODOS = "__todos__";

interface FilterBarProps {
  setores: string[];
  funcoes: string[];
  cidades: string[];
  tipos: string[];
  filtro: FiltroState;
  onChange: (next: FiltroState) => void;
  totalPeriodo: number;
  onReimportar: () => void;
  limiarAtencao: number;
  onLimiarChange: (v: number) => void;
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
          <option
            key={o}
            value={o}
            style={{ color: "#1b1f23", backgroundColor: "#ffffff" }}
          >
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({
  setores,
  funcoes,
  cidades,
  tipos,
  filtro,
  onChange,
  totalPeriodo,
  onReimportar,
  limiarAtencao,
  onLimiarChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2.5">
      <span className="mr-1 text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
        Filtros
      </span>
      <Select
        label="Setor"
        value={filtro.setor}
        options={setores}
        onChange={(v) => onChange({ ...filtro, setor: v })}
      />
      <Select
        label="Função"
        value={filtro.funcao}
        options={funcoes}
        onChange={(v) => onChange({ ...filtro, funcao: v })}
      />
      <Select
        label="Cidade"
        value={filtro.cidade}
        options={cidades}
        onChange={(v) => onChange({ ...filtro, cidade: v })}
      />
      <Select
        label="Tipo"
        value={filtro.tipo}
        options={tipos}
        onChange={(v) => onChange({ ...filtro, tipo: v })}
      />
      <label className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-ink-2">
        <span className="text-muted">Alerta de atenção após:</span>
        <input
          type="number"
          min={1}
          max={90}
          value={limiarAtencao}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v) && v > 0) onLimiarChange(v);
          }}
          className="w-10 bg-transparent text-right font-medium text-ink outline-none tabular-nums"
        />
        <span className="text-muted">dias parado</span>
      </label>
      <span className="flex-1" />
      <span className="text-xs text-muted">
        {totalPeriodo} solicitações no total
      </span>
      <button
        type="button"
        onClick={onReimportar}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink-2 hover:text-ink"
      >
        Importar outra planilha
      </button>
    </div>
  );
}
