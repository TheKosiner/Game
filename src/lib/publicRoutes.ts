// Public marketing routes. Each language has its own URL (matching the static
// HTML pages and their hreflang tags), so the path — not a client-side toggle —
// decides which language a visitor and a crawler get.
//
// Kept out of the component file so Fast Refresh isn't broken by non-component
// exports, and so App can import the routing without pulling in the landing UI.
import { LANGUAGES, type Lang } from '../i18n';

export const APK_URL = 'https://github.com/thekosiner/game/releases/latest/download/GlitchSoul.apk';

export type PublicPage = 'landing' | 'download' | 'auth';

export const PUBLIC_ROUTES: Record<string, { page: PublicPage; lang: Lang }> = {
  // Polish keeps its original slugs so existing links and indexed URLs survive;
  // every other language lives under its own /<code>/ prefix.
  '/':          { page: 'landing',  lang: 'pl' },
  '/pobierz':   { page: 'download', lang: 'pl' },
  '/logowanie': { page: 'auth',     lang: 'pl' },
  ...Object.fromEntries(
    LANGUAGES.filter(l => l.code !== 'pl').flatMap(l => [
      [`/${l.code}`,          { page: 'landing'  as PublicPage, lang: l.code }],
      [`/${l.code}/download`, { page: 'download' as PublicPage, lang: l.code }],
      [`/${l.code}/login`,    { page: 'auth'     as PublicPage, lang: l.code }],
    ]),
  ),
};

/** Route for a page in a given language. */
export function routeFor(page: PublicPage, lang: Lang): string {
  const hit = Object.entries(PUBLIC_ROUTES).find(([, v]) => v.page === page && v.lang === lang);
  return hit ? hit[0] : '/';
}
