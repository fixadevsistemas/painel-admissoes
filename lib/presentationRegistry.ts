"use client";

export const PRESENTATION_ORDER = [
  "indicadores",
  "distribuicao",
  "funcao",
  "setor",
  "cidade",
  "colaboradores",
] as const;

export type SectionKey = (typeof PRESENTATION_ORDER)[number];

const registry = new Map<SectionKey, HTMLElement>();

export function registerSection(key: SectionKey, el: HTMLElement | null) {
  if (el) registry.set(key, el);
  else registry.delete(key);
}

export function goToSection(key: SectionKey) {
  registry.get(key)?.requestFullscreen().catch(() => {});
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function stepSection(currentKey: SectionKey, direction: 1 | -1) {
  const total = PRESENTATION_ORDER.length;
  const idx = PRESENTATION_ORDER.indexOf(currentKey);
  if (idx === -1) return;
  for (let step = 1; step <= total; step++) {
    const nextKey = PRESENTATION_ORDER[mod(idx + direction * step, total)];
    if (registry.has(nextKey)) {
      goToSection(nextKey);
      return;
    }
  }
}
