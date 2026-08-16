import { TRANSLATIONS } from '../i18n';
import { useLangStore } from '../store/langStore';

export function useT() {
  const lang = useLangStore(s => s.lang);
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}

/** For use outside React components (e.g. gameStore) */
export function getT() {
  const lang = useLangStore.getState().lang;
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}
