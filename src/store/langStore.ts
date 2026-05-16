import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'pl' | 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'pl',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'glitchsoul_lang' }
  )
);

export function getLang(): Lang {
  return useLangStore.getState().lang;
}
