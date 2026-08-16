// Generates the static HTML entry points (one per public page per language) and
// sitemap.xml. Each page gets its own <title>/description/canonical plus
// hreflang alternates, so PL and EN rank as separate URLs instead of one page
// with a client-side language toggle.
//
// Run after editing page copy or adding a page:  node scripts/gen-html-pages.mjs
// The generated files are committed — Vite needs them on disk as build inputs.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://glitchsoul.com';

const FAQ_PL = [
  ['Czy GlitchSoul jest darmowy?', 'Tak. Cała gra — lochy, bossowie, arena PvP, krypta, gildie i wojny gildii — jest dostępna bez żadnych opłat. Nie ma abonamentu ani treści zamkniętych za płatnością.'],
  ['Czy da się kupić przewagę za pieniądze?', 'Nie. W GlitchSoul nie sprzedajemy statystyk, przedmiotów ani poziomów. Gemy, czyli waluta premium, zdobywa się grając — za codzienne logowanie, serie dni, awanse i wydarzenia. Konto darmowe ma dokładnie te same możliwości co każde inne.'],
  ['Czy muszę coś instalować?', 'Nie. Gra działa w przeglądarce na telefonie i komputerze. Jeśli wolisz aplikację, możesz dodatkowo pobrać wersję na Androida (plik APK).'],
  ['Czy potrzebuję konta?', 'Tak, założenie konta zajmuje około 30 sekund i wymaga tylko adresu e-mail. Dzięki temu postęp zapisuje się w chmurze i możesz grać raz na telefonie, raz na komputerze — na tej samej postaci.'],
  ['Czy mogę grać z przyjaciółmi?', 'Tak. Możesz założyć wspólną gildię, bić razem bossa gildyjnego, chodzić na operacje grupowe, toczyć wojny z innymi gildiami i rywalizować w rankingu oraz na arenie PvP.'],
  ['Ile czasu trzeba grać dziennie?', 'Tyle, ile chcesz. Dzienne limity wejść do lochów, krypt i zadań sprawiają, że kilkanaście minut dziennie w zupełności wystarczy, żeby nie zostać w tyle.'],
  ['Czy gra jest po polsku?', 'Tak, GlitchSoul jest w pełni po polsku i po angielsku. Język przełączysz w każdej chwili przyciskiem PL/EN.'],
];

const FAQ_EN = [
  ['Is GlitchSoul free?', 'Yes. The whole game — dungeons, bosses, PvP arena, the crypt, guilds and guild wars — is available at no cost. There is no subscription and no content locked behind payment.'],
  ['Can you buy an advantage with money?', 'No. GlitchSoul does not sell stats, items or levels. Gems, the premium currency, are earned by playing — daily logins, streaks, level-ups and events. A free account has exactly the same options as any other.'],
  ['Do I need to install anything?', 'No. The game runs in your browser on phone and desktop. If you prefer an app, you can additionally download the Android version (an APK file).'],
  ['Do I need an account?', 'Yes, and it takes about 30 seconds — just an email address. That way your progress is stored in the cloud and you can play on your phone and your computer with the same character.'],
  ['Can I play with friends?', 'Yes. You can start a guild together, fight the guild boss as a team, run group operations, wage war on other guilds and compete on the leaderboard and in the PvP arena.'],
  ['How much time does it take per day?', 'As much as you want. Daily caps on dungeons, crypts and quests mean fifteen minutes a day is plenty to stay competitive.'],
  ['What languages are supported?', 'GlitchSoul is fully translated into English and Polish. You can switch at any time with the PL/EN button.'],
];

// Each entry is one page in both languages; hreflang links the pair together.
const PAGES = [
  {
    faq: true, indexable: true, priority: '1.0', changefreq: 'weekly',
    pl: {
      url: '/', file: 'index.html',
      title: 'GlitchSoul — darmowe cyberpunkowe RPG przeglądarkowe bez pay-to-win',
      desc: 'GlitchSoul to darmowe cyberpunkowe RPG w przeglądarce i na Androida. Lochy, 41 bossów, arena PvP, krypta, gildie i wojny gildii. Zero pay-to-win — nie sprzedajemy mocy ani przedmiotów. Graj po polsku za darmo.',
      ogTitle: 'GlitchSoul — darmowe cyberpunkowe RPG bez pay-to-win',
      ogDesc: 'Lochy, 41 bossów, arena PvP, krypta i gildie. Darmowe RPG w przeglądarce i na Androida, w którym nie da się kupić przewagi. Od gracza dla graczy.',
    },
    en: {
      url: '/en/', file: 'en/index.html',
      title: 'GlitchSoul — free cyberpunk browser RPG with no pay-to-win',
      desc: 'GlitchSoul is a free cyberpunk RPG for browser and Android. Dungeons, 41 bosses, PvP arena, the crypt, guilds and guild wars. Zero pay-to-win — we do not sell power or items. Play free in English.',
      ogTitle: 'GlitchSoul — free cyberpunk RPG with no pay-to-win',
      ogDesc: 'Dungeons, 41 bosses, PvP arena, the crypt and guilds. A free browser and Android RPG where you cannot buy an advantage. Made by a player, for players.',
    },
  },
  {
    faq: false, indexable: true, priority: '0.7', changefreq: 'monthly',
    pl: {
      url: '/pobierz/', file: 'pobierz/index.html',
      title: 'Pobierz GlitchSoul na Androida — darmowa aplikacja RPG (APK)',
      desc: 'Pobierz GlitchSoul na Androida za darmo. Ta sama gra co w przeglądarce, to samo konto i postęp, powiadomienia o zadaniach. Instrukcja instalacji pliku APK krok po kroku.',
      ogTitle: 'Pobierz GlitchSoul na Androida (APK)',
      ogDesc: 'Darmowa aplikacja RPG na Androida. To samo konto i postęp co w przeglądarce, bez reklam.',
    },
    en: {
      url: '/en/download/', file: 'en/download/index.html',
      title: 'Download GlitchSoul for Android — free RPG app (APK)',
      desc: 'Download GlitchSoul for Android free. The same game as the browser version, the same account and progress, plus quest notifications. Step-by-step APK install instructions.',
      ogTitle: 'Download GlitchSoul for Android (APK)',
      ogDesc: 'A free Android RPG app. Same account and progress as the browser version, no ads.',
    },
  },
  {
    faq: false, indexable: false,
    pl: {
      url: '/logowanie/', file: 'logowanie/index.html',
      title: 'Logowanie i rejestracja — GlitchSoul',
      desc: 'Zaloguj się lub załóż darmowe konto w GlitchSoul. Rejestracja zajmuje 30 sekund, a postęp zapisuje się w chmurze i działa na telefonie i komputerze.',
      ogTitle: 'Logowanie — GlitchSoul', ogDesc: 'Zaloguj się lub załóż darmowe konto w GlitchSoul.',
    },
    en: {
      url: '/en/login/', file: 'en/login/index.html',
      title: 'Sign in or create an account — GlitchSoul',
      desc: 'Sign in or create a free GlitchSoul account. Registration takes 30 seconds and your progress is saved to the cloud across phone and desktop.',
      ogTitle: 'Sign in — GlitchSoul', ogDesc: 'Sign in or create a free GlitchSoul account.',
    },
  },
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const gameSchema = lang => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'GlitchSoul',
  url: ORIGIN + (lang === 'en' ? '/en/' : '/'),
  image: ORIGIN + '/og-image.webp',
  description: lang === 'en'
    ? 'A free cyberpunk browser RPG with no pay-to-win. Dungeons, 41 bosses, PvP arena, the crypt, guilds and guild wars. Playable in the browser and as an Android app.'
    : 'Darmowe cyberpunkowe RPG przeglądarkowe bez pay-to-win. Lochy, 41 bossów, arena PvP, krypta, gildie i wojny gildii. Gra w przeglądarce i jako aplikacja na Androida.',
  inLanguage: ['pl', 'en'],
  genre: lang === 'en'
    ? ['RPG', 'MMORPG', 'Browser game', 'Cyberpunk']
    : ['RPG', 'MMORPG', 'Gra przeglądarkowa', 'Cyberpunk'],
  gamePlatform: ['Web browser', 'Android'],
  playMode: ['SinglePlayer', 'MultiPlayer'],
  applicationCategory: 'Game',
  operatingSystem: 'Web, Android',
  offers: { '@type': 'Offer', price: '0', priceCurrency: lang === 'en' ? 'USD' : 'PLN', availability: 'https://schema.org/InStock' },
}, null, 2);

const faqSchema = entries => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entries.map(([q, a]) => ({
    '@type': 'Question', name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}, null, 2);

function render(page, lang) {
  const p = page[lang];
  const plUrl = ORIGIN + page.pl.url;
  const enUrl = ORIGIN + page.en.url;
  const canonical = ORIGIN + p.url;
  const isEn = lang === 'en';

  const noscript = isEn ? `
      <h1>GlitchSoul — a free cyberpunk browser RPG</h1>
      <p>
        GlitchSoul is a free cyberpunk RPG you can play straight in your browser on phone and
        desktop, or through the Android app. Clear dungeons across 20 locations, climb a ladder of
        41 bosses, fight in the PvP arena, descend into the crypt and build a guild with other players.
      </p>
      <h2>No pay-to-win</h2>
      <p>
        We do not sell power: no stat bundles, no legendary items for cash, no level skips. Gems are
        earned by playing — daily logins, streaks, level-ups and events. A free account has exactly
        the same options as any other.
      </p>
      <p>To play, enable JavaScript in your browser.</p>` : `
      <h1>GlitchSoul — darmowe cyberpunkowe RPG przeglądarkowe</h1>
      <p>
        GlitchSoul to darmowe RPG w klimacie cyberpunk, w które zagrasz bezpośrednio w przeglądarce
        na telefonie i komputerze, albo przez aplikację na Androida. Czyścisz lochy w 20 lokacjach,
        wspinasz się po drabince 41 bossów, walczysz na arenie PvP, schodzisz do krypty i budujesz
        gildię z innymi graczami.
      </p>
      <h2>Bez pay-to-win</h2>
      <p>
        Nie sprzedajemy mocy: nie ma pakietów ze statystykami, legendarnych przedmiotów za pieniądze
        ani skrótów do poziomów. Gemy zdobywa się grając — za codzienne logowanie, serie dni, awanse
        i wydarzenia. Konto darmowe ma dokładnie te same możliwości co każde inne.
      </p>
      <p>Aby zagrać, włącz obsługę JavaScriptu w przeglądarce.</p>`;

  return `<!doctype html>
<html lang="${lang}" translate="no">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <!-- Block Google Translate — it rewrites React-managed text nodes into <font> tags,
         causing removeChild crashes for players with auto-translate enabled -->
    <meta name="google" content="notranslate" />

    <title>${esc(p.title)}</title>
    <meta name="description" content="${esc(p.desc)}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="${page.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />
    <meta name="theme-color" content="#0a0a0f" />
    <meta name="apple-mobile-web-app-title" content="GlitchSoul" />

    <!-- Language alternates -->
    <link rel="alternate" hreflang="pl" href="${plUrl}" />
    <link rel="alternate" hreflang="en" href="${enUrl}" />
    <link rel="alternate" hreflang="x-default" href="${plUrl}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="GlitchSoul" />
    <meta property="og:locale" content="${isEn ? 'en_US' : 'pl_PL'}" />
    <meta property="og:locale:alternate" content="${isEn ? 'pl_PL' : 'en_US'}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${esc(p.ogTitle)}" />
    <meta property="og:description" content="${esc(p.ogDesc)}" />
    <meta property="og:image" content="${ORIGIN}/og-image.webp" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${isEn ? 'GlitchSoul — cyberpunk browser RPG' : 'GlitchSoul — cyberpunkowe RPG przeglądarkowe'}" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(p.ogTitle)}" />
    <meta name="twitter:description" content="${esc(p.ogDesc)}" />
    <meta name="twitter:image" content="${ORIGIN}/og-image.webp" />

    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">

    <!-- Structured data: the game itself -->
    <script type="application/ld+json">
${gameSchema(lang)}
    </script>${page.faq ? `

    <!-- Structured data: FAQ (mirrors the on-page FAQ section) -->
    <script type="application/ld+json">
${faqSchema(isEn ? FAQ_EN : FAQ_PL)}
    </script>` : ''}
  </head>
  <body>
    <div id="root"></div>
    <div id="modal-root"></div>
    <noscript>${noscript}
    </noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

// ── Write pages ──
const written = [];
for (const page of PAGES) {
  for (const lang of ['pl', 'en']) {
    const file = resolve(ROOT, page[lang].file);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, render(page, lang));
    written.push(page[lang].file);
  }
}

// ── Sitemap ──
// Only indexable pages are listed (a noindex URL in a sitemap is reported as an
// error in Search Console), and every <loc> matches its page's canonical exactly
// — including the trailing slash — so Google is not handed two variants of a URL.
const lastmod = new Date().toISOString().slice(0, 10);
const entries = PAGES.filter(p => p.indexable).flatMap(page =>
  ['pl', 'en'].map(lang => {
    const alts = ['pl', 'en']
      .map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${page[l].url}" />`)
      .join('\n');
    return `  <url>
    <loc>${ORIGIN}${page[lang].url}</loc>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${page.pl.url}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }),
);

writeFileSync(resolve(ROOT, 'public/sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`);
written.push('public/sitemap.xml');

console.log('Generated:\n  ' + written.join('\n  '));
