interface PresentNavProps {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Seção anterior" : "Próxima seção"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-ink-2 hover:text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {direction === "prev" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

export function PresentNav({ index, total, onPrev, onNext }: PresentNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-8 z-10 flex items-center justify-center gap-4">
      <ArrowButton direction="prev" onClick={onPrev} />
      <span className="rounded-full border border-border-strong bg-surface-2 px-3 py-1.5 text-sm font-semibold tabular-nums text-ink-2">
        {index + 1} / {total}
      </span>
      <ArrowButton direction="next" onClick={onNext} />
    </div>
  );
}
