interface CategoryBarsProps {
  title: string;
  data: { chave: string; total: number }[];
}

export function CategoryBars({ title, data }: CategoryBarsProps) {
  const max = data.reduce((m, d) => Math.max(m, d.total), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-3.5 text-[15px] font-bold">{title}</h3>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div
            key={d.chave}
            className="grid grid-cols-[108px_1fr_26px] items-center gap-2"
          >
            <span
              className="truncate text-right text-xs text-ink-2"
              title={d.chave}
            >
              {d.chave}
            </span>
            <span className="h-3.5 rounded bg-surface-2">
              <span
                className="block h-full rounded"
                style={{
                  width: `${(d.total / max) * 100}%`,
                  background: i % 2 ? "color-mix(in srgb, var(--accent) 55%, var(--surface-2))" : "var(--accent)",
                }}
              />
            </span>
            <span className="text-xs font-bold tabular-nums">{d.total}</span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-xs text-muted">Sem dados para este filtro.</p>
        )}
      </div>
    </div>
  );
}
