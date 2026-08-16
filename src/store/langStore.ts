import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isLang, type Lang } from '../i18n';

export type { Lang };

/** Pick the closest supported language from the browser's preferences. */
function detectLang(): Lang {
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language ?? ''];
  for (const p of prefs) {
    const base = p.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return 'en';
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
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
