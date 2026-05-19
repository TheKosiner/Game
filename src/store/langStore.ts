import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'pl' | 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

function detectLang(): Lang {
  const nav = navigator.language?.toLowerCase() ?? '';
  return nav.startsWith('pl') ? 'pl' : 'en';
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: detectLang(),
      setLang: (lang) => set({ lang }),
    }),
    { name: 'glitchsoul_lang' }
  )
);

export function getLang(): Lang {
  return useLangStore.getState().lang;
}
