import { en, pl } from '../i18n';
import { useLangStore } from '../store/langStore';

export function useT() {
  const lang = useLangStore(s => s.lang);
  return lang === 'en' ? en : pl;
}

/** For use outside React components (e.g. gameStore) */
export function getT() {
  const lang = useLangStore.getState().lang;
  return lang === 'en' ? en : pl;
}
