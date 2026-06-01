const BASE = import.meta.env.BASE_URL;

export interface PortraitDef {
  index: number;
  src: string;
  label: string;
  hidden?: boolean; // hidden=true: nie pojawia się w pickerze, tylko przypisany bezpośrednio
  gemPrice?: number; // set to unlock via gem purchase
}

// ── Dodaj nowe portrety tutaj ─────────────────────────────────────────────────
// Wrzuć plik PNG do /public/NewPortrait/ i dodaj wpis poniżej.
// Indeks musi być unikalny i rosnący.
export const PORTRAIT_LIST: PortraitDef[] = [
  // Darmowe — dostępne dla każdego
  { index: 0, src: `${BASE}NewPortrait/Portrait_new_Men.png`,      label: 'MĘŻCZYZNA' },
  { index: 1, src: `${BASE}NewPortrait/Portrait_new_Women.png`,    label: 'KOBIETA'   },
  // Sklep z gemami — 1000 gemów za odblokowanie
  { index: 10, src: `${BASE}NewPortrait/Portrait_new_1.png`,       label: 'PORTRET 1',  gemPrice: 1000 },
  { index: 11, src: `${BASE}NewPortrait/Portrait_new_2.png`,       label: 'PORTRET 2',  gemPrice: 1000 },
  { index: 12, src: `${BASE}NewPortrait/Portrait_new_3.png`,       label: 'PORTRET 3',  gemPrice: 1000 },
  { index: 13, src: `${BASE}NewPortrait/Portrait_new_9.png`,       label: 'PORTRET 4',  gemPrice: 1000 },
  { index: 14, src: `${BASE}NewPortrait/Portrait_new_10.png`,      label: 'PORTRET 5',  gemPrice: 1000 },
  { index: 15, src: `${BASE}NewPortrait/Portrait_new_11.png`,      label: 'PORTRET 6',  gemPrice: 1000 },
  { index: 16, src: `${BASE}NewPortrait/Portrait_new_12.png`,      label: 'PORTRET 7',  gemPrice: 1000 },
  { index: 17, src: `${BASE}NewPortrait/Portrait_new_13.png`,      label: 'PORTRET 8',  gemPrice: 1000 },
  { index: 18, src: `${BASE}NewPortrait/Portrait_new_BigDM.png`,   label: 'BIGDM',      gemPrice: 1000 },
  { index: 19, src: `${BASE}NewPortrait/Portrait_new_Kacperek.png`,label: 'KACPEREK',   gemPrice: 1000 },
  // Ukryte — przypisane konkretnym graczom
  { index: 2, src: `${BASE}portraits/1778573895348.png`,           label: 'KOSINER', hidden: true },
  { index: 9, src: `${BASE}NewPortrait/Portrait_new_Fifi.png`,     label: 'FIFU',    hidden: true },
];

// ── Ekskluzywne portrety przypisane do konkretnych graczy (po username) ───────
export const PORTRAIT_OVERRIDES: Record<string, number> = {
  'Kosiner': 2,
  'FIFU': 9,
};

export function resolvePortrait(p: number | undefined, username: string): number {
  return PORTRAIT_OVERRIDES[username] ?? p ?? 0;
}

export function portraitSrc(p: number | undefined): string {
  const found = PORTRAIT_LIST.find(x => x.index === (p ?? 0));
  return found?.src ?? PORTRAIT_LIST[0].src;
}
