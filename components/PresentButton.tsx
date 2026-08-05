interface PresentButtonProps {
  presenting: boolean;
  onToggle: () => void;
}

export function PresentButton({ presenting, onToggle }: PresentButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex flex-none items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-2 hover:text-ink"
    >
      {presenting ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M9 3v4a2 2 0 0 1-2 2H3M15 3v4a2 2 0 0 0 2 2h4M9 21v-4a2 2 0 0 0-2-2H3M15 21v-4a2 2 0 0 1 2-2h4" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      )}
      {presenting ? "Sair" : "Apresentar"}
    </button>
  );
}
