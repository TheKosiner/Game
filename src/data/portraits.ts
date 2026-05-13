const BASE = import.meta.env.BASE_URL;

export interface PortraitDef {
  index: number;
  src: string;
  label: string;
  hidden?: boolean; // hidden=true: nie pojawia się w pickerze, tylko przypisany bezpośrednio
}

// ── Dodaj nowe portrety tutaj ─────────────────────────────────────────────────
// Wrzuć plik PNG do /public/portraits/ i dodaj wpis poniżej.
// Indeks musi być unikalny i rosnący.
export const PORTRAIT_LIST: PortraitDef[] = [
  { index: 0, src: `${BASE}portraits/male.png`,            label: 'MĘŻCZYZNA'  },
  { index: 1, src: `${BASE}portraits/female.png`,          label: 'KOBIETA'    },
  { index: 3, src: `${BASE}portraits/Portrait_1.png`,      label: 'WOJOWNIK'   },
  { index: 4, src: `${BASE}portraits/Portrait_2.png`,      label: 'ŁOWCA'      },
  { index: 5, src: `${BASE}portraits/Portrait_3.png`,      label: 'CZAROWNIK'  },
  { index: 6, src: `${BASE}portraits/Portrait_4.png`,      label: 'BARBARZYŃCA'},
  { index: 2, src: `${BASE}portraits/1778573895348.png`,   label: 'KOSINER', hidden: true },
];

// ── Ekskluzywne portrety przypisane do konkretnych graczy (po username) ───────
export const PORTRAIT_OVERRIDES: Record<string, number> = {
  'Kosiner': 2,
};

export function resolvePortrait(p: number | undefined, username: string): number {
  return PORTRAIT_OVERRIDES[username] ?? p ?? 0;
}

export function portraitSrc(p: number | undefined): string {
  const found = PORTRAIT_LIST.find(x => x.index === (p ?? 0));
  return found?.src ?? PORTRAIT_LIST[0].src;
}
