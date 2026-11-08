// Public pages Google Play (and the GDPR) require: privacy policy, community
// rules, and how to delete an account. They are static pages under public/,
// served from the game's site; Polish and English versions exist.
export type LegalPage = 'privacy' | 'rules' | 'deleteAccount';

const SITE = 'https://glitchsoul.com';

const PATHS: Record<'pl' | 'en', Record<LegalPage, string>> = {
  pl: { privacy: '/polityka-prywatnosci/', rules: '/zasady/', deleteAccount: '/usun-konto/' },
  en: { privacy: '/en/privacy/', rules: '/en/rules/', deleteAccount: '/en/delete-account/' },
};

/** Absolute URL (it also has to open from the Android app, in the system browser). */
export function legalUrl(page: LegalPage, lang: string): string {
  return SITE + PATHS[lang === 'pl' ? 'pl' : 'en'][page];
}
