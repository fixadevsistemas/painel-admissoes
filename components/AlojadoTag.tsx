export function AlojadoTag({ presenting }: { presenting?: boolean }) {
  return (
    <span
      className={`inline-flex flex-none items-center gap-1 rounded-full border border-border-strong text-ink-2 ${
        presenting ? "px-2.5 py-1 text-sm" : "px-1.5 py-0.5 text-[10.5px]"
      }`}
      title="Alojado pela empresa"
    >
      <svg
        width={presenting ? 13 : 10}
        height={presenting ? 13 : 10}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
      Alojado
    </span>
  );
}
