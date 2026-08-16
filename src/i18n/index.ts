import { en } from './en';
import { pl } from './pl';
import { de } from './de';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { pt } from './pt';
import type { Translations } from './en';

export { en, pl, de, es, fr, it, pt };
export type { Translations };

export type Lang = 'pl' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt';

/** Every supported language, keyed by its code. */
export const TRANSLATIONS: Record<Lang, Translations> = { pl, en, de, es, fr, it, pt };

/** Display metadata for the language picker. */
export const LANGUAGES: { code: Lang; label: string; name: string }[] = [
  { code: 'pl', label: 'PL', name: 'Polski' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'pt', label: 'PT', name: 'Português' },
];

export const LANG_CODES = LANGUAGES.map(l => l.code);

export function isLang(v: string): v is Lang {
  return (LANG_CODES as string[]).includes(v);
}
