const BASE = import.meta.env.BASE_URL;

export interface PortraitDef {
  index: number;
  src: string;
  label: string;
}

// ── Dodaj nowe portrety tutaj ─────────────────────────────────────────────────
// Wrzuć plik PNG do /public/portraits/ i dodaj wpis poniżej.
// Indeks musi być unikalny i rosnący.
export const PORTRAIT_LIST: PortraitDef[] = [
  { index: 0, src: `${BASE}portraits/male.png`,   label: 'MĘŻCZYZNA' },
  { index: 1, src: `${BASE}portraits/female.png`, label: 'KOBIETA'   },
];

export function portraitSrc(p: number | undefined): string {
  const found = PORTRAIT_LIST.find(x => x.index === (p ?? 0));
  return found?.src ?? PORTRAIT_LIST[0].src;
}
