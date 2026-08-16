import { useState } from 'react';
import { useLangStore } from '../store/langStore';
import { MONO, ORB } from '../utils/styles';
import logoImg from '../assets/logo.webp';
import CyberpunkBg from './CyberpunkBg';

export const APK_URL = 'https://github.com/thekosiner/game/releases/latest/download/GlitchSoul.apk';

// Public routes. Each language has its own URL (matching the static HTML pages
// and their hreflang tags), so the path — not a client-side toggle — decides
// which language a visitor and a crawler get.
export type PublicPage = 'landing' | 'download' | 'auth';

export const PUBLIC_ROUTES: Record<string, { page: PublicPage; lang: 'pl' | 'en' }> = {
  '/':            { page: 'landing',  lang: 'pl' },
  '/pobierz':     { page: 'download', lang: 'pl' },
  '/logowanie':   { page: 'auth',     lang: 'pl' },
  '/en':          { page: 'landing',  lang: 'en' },
  '/en/download': { page: 'download', lang: 'en' },
  '/en/login':    { page: 'auth',     lang: 'en' },
};

/** The same page in the other language — used by the PL/EN switch. */
export const ALT_ROUTE: Record<string, string> = {
  '/':            '/en',
  '/en':          '/',
  '/pobierz':     '/en/download',
  '/en/download': '/pobierz',
  '/logowanie':   '/en/login',
  '/en/login':    '/logowanie',
};

/** Route for a page in a given language. */
export function routeFor(page: PublicPage, lang: 'pl' | 'en'): string {
  const hit = Object.entries(PUBLIC_ROUTES).find(([, v]) => v.page === page && v.lang === lang);
  return hit ? hit[0] : '/';
}

// Real content counts — keep in sync with src/data/*
const STATS = { bosses: 41, dungeons: 20, enemies: 107, guildOps: 28, maxLevel: 500 };

const SHOTS = [
  { src: '/screens/hero.webp',    pl: 'Karta bohatera z ekwipunkiem i statystykami',        en: 'Hero sheet with equipment and stats' },
  { src: '/screens/dungeon.webp', pl: 'Mapa operacji — 20 lokacji do przejścia',            en: 'Operations map — 20 locations to clear' },
  { src: '/screens/boss.webp',    pl: 'Drabinka bossów z unikalnymi mocami',                 en: 'Boss ladder with unique powers' },
  { src: '/screens/arena.webp',   pl: 'Arena PvP — walki z innymi graczami',                 en: 'PvP arena — fights against other players' },
  { src: '/screens/krypta.webp',  pl: 'Krypta — losowe zejście w stylu rogue-like',          en: 'The Crypt — a rogue-like descent' },
  { src: '/screens/shop.webp',    pl: 'Sklep z ekwipunkiem dobieranym do poziomu',           en: 'Item shop stocked to your level' },
];

const C = {
  pl: {
    navPlay: 'GRAJ TERAZ',
    navDownload: 'POBIERZ APK',
    heroTitle: 'GlitchSoul — darmowe cyberpunkowe RPG w przeglądarce',
    heroLead: 'Wcielasz się w najemnika w neonowych ruinach Sieci. Czyścisz lochy, wspinasz się po drabince bossów, walczysz na arenie PvP i budujesz gildię z innymi graczami. Wszystko w przeglądarce — bez instalacji, bez opłat, bez pay-to-win.',
    badges: ['100% za darmo', 'Bez pay-to-win', 'Przeglądarka + Android', 'Po polsku i po angielsku'],
    ctaPlay: '▶ ZAGRAJ ZA DARMO',
    ctaDownload: '↓ POBIERZ NA ANDROIDA',
    ctaNote: 'Gra działa od razu w przeglądarce na telefonie i komputerze. Konto zakładasz w 30 sekund, postęp zapisuje się w chmurze.',
    p2wTitle: 'Zero pay-to-win. Serio.',
    p2wLead: 'Większość darmowych RPG sprzedaje moc. GlitchSoul nie. Tu każdy przedmiot, każdy poziom i każde miejsce w rankingu zdobywasz grą — nie portfelem.',
    p2wPoints: [
      { h: 'Nie sprzedajemy mocy', p: 'Nie ma pakietów ze statystykami, legendarnych przedmiotów za pieniądze ani skrótów do poziomów. Konto płacące i konto darmowe mają dokładnie te same możliwości.' },
      { h: 'Gemy zdobywasz grając', p: 'Gemy — waluta premium — lecą za codzienne logowanie, serię dni, awanse i wydarzenia. Nie musisz wydać złotówki, żeby je mieć.' },
      { h: 'Ranking = umiejętność i czas', p: 'Na szczycie rankingu jest ten, kto lepiej rozwinął postać i mądrzej wydał ograniczone dzienne wejścia. Nie ten, kto dopłacił.' },
      { h: 'Dzienne limity chronią balans', p: 'Ograniczona liczba lochów, krypt i zadań na dobę sprawia, że nikt nie „wygrywa gry" grindem 16 h dziennie ani zakupem przyspieszeń.' },
    ],
    featTitle: 'Co robisz w grze',
    feats: [
      { icon: '🗺️', h: 'Operacje (lochy)', p: `${STATS.dungeons} lokacji na mapie, od Slumsów po Singularność Genezy. Wybierasz trudność i tryb nagród — więcej XP, więcej złota albo lepsze łupy — i przebijasz się przez kolejne piętra.` },
      { icon: '☠️', h: 'Drabinka bossów', p: `${STATS.bosses} unikalnych bossów, każdy z własnym zestawem mocy: tarcza, furia, kradzież życia, unik, podwójny cios, trucizna. Pokonaj jednego, żeby odblokować następnego.` },
      { icon: '⚔️', h: 'Arena PvP', p: 'Walcz z postaciami innych graczy, zdobywaj ranking, złoto i XP. Przeciwnicy dobierani są do Twojego poziomu, a między walkami obowiązuje cooldown.' },
      { icon: '💀', h: 'Krypta', p: 'Zejście w stylu rogue-like: pokoje z potworami, kaplice, pułapki, ołtarze i kompani. Wchodzisz z aktualnym HP, więc każde podejście to realne ryzyko.' },
      { icon: '🛡️', h: 'Gildie i wojny', p: `Zakładaj albo dołączaj do gildii: wspólne bonusy do XP i złota, kooperacyjny boss gildyjny, ${STATS.guildOps} operacji grupowych i wojny między gildiami.` },
      { icon: '🧬', h: 'Rozwój postaci', p: `Sześć atrybutów, ${STATS.maxLevel} poziomów, ekwipunek w sześciu slotach, ulepszenia u kowala i przelosowanie statystyk u zaklinacza.` },
      { icon: '📜', h: 'Zadania czasowe', p: 'Wysyłasz postać na zlecenie i wracasz po nagrodę — gra idzie do przodu nawet wtedy, gdy akurat nie grasz. Powiadomienie da znać, gdy zadanie się skończy.' },
      { icon: '💬', h: 'Społeczność', p: 'Globalny czat, czat gildii, poczta, ranking graczy i lobby, w którym widać innych online. Gra żyje ludźmi, nie botami.' },
    ],
    byPlayersTitle: 'Od gracza dla graczy',
    byPlayersBody: [
      'GlitchSoul powstał, bo brakowało nam prostego RPG-a, w które da się wejść z telefonu na kilka minut w przerwie — i które nie próbuje przy tym sprzedać nam skrzynki. Bez agresywnych reklam, bez pop-upów z ofertą „tylko dziś −70%", bez licznika odliczającego do końca promocji.',
      'To gra robiona po godzinach, z myślą o ludziach, którzy pamiętają stare przeglądarkowe RPG-i: klikasz, rozwijasz postać, ścigasz się w rankingu ze znajomymi. Aktualizacje wychodzą regularnie, a pomysły graczy realnie trafiają do gry — bo to od nich zaczyna się większość zmian.',
      'Jeśli coś nie działa albo czegoś brakuje — napisz na czacie w grze. Naprawdę to czytamy.',
    ],
    statsTitle: 'GlitchSoul w liczbach',
    statsItems: [
      { n: String(STATS.bosses), l: 'bossów do pokonania' },
      { n: String(STATS.dungeons), l: 'lokacji na mapie' },
      { n: String(STATS.enemies), l: 'rodzajów przeciwników' },
      { n: String(STATS.maxLevel), l: 'poziomów postaci' },
      { n: '0 zł', l: 'żeby grać w pełni' },
    ],
    shotsTitle: 'Zobacz, jak to wygląda',
    shotsLead: 'Prawdziwe zrzuty ekranu z gry — nie renderowane makiety.',
    playTitle: 'Zagraj tak, jak Ci wygodnie',
    playBrowser: { h: 'W przeglądarce', p: 'Wejdź i graj — telefon, tablet, laptop. Nic nie instalujesz, a postęp zapisuje się na koncie i przenosi między urządzeniami.', cta: '▶ GRAJ W PRZEGLĄDARCE' },
    playApk: { h: 'Aplikacja na Androida', p: 'Ta sama gra, to samo konto, wygodniejszy dostęp z pulpitu i powiadomienia o skończonych zadaniach. Plik APK instalujesz ręcznie.', cta: '↓ POBIERZ APK' },
    faqTitle: 'Najczęstsze pytania',
    faq: [
      { q: 'Czy GlitchSoul jest darmowy?', a: 'Tak. Cała gra — lochy, bossowie, arena PvP, krypta, gildie i wojny gildii — jest dostępna bez żadnych opłat. Nie ma abonamentu ani treści zamkniętych za płatnością.' },
      { q: 'Czy da się kupić przewagę za pieniądze?', a: 'Nie. W GlitchSoul nie sprzedajemy statystyk, przedmiotów ani poziomów. Gemy, czyli waluta premium, zdobywa się grając — za codzienne logowanie, serie dni, awanse i wydarzenia. Konto darmowe ma dokładnie te same możliwości co każde inne.' },
      { q: 'Czy muszę coś instalować?', a: 'Nie. Gra działa w przeglądarce na telefonie i komputerze. Jeśli wolisz aplikację, możesz dodatkowo pobrać wersję na Androida (plik APK).' },
      { q: 'Czy potrzebuję konta?', a: 'Tak, założenie konta zajmuje około 30 sekund i wymaga tylko adresu e-mail. Dzięki temu postęp zapisuje się w chmurze i możesz grać raz na telefonie, raz na komputerze — na tej samej postaci.' },
      { q: 'Czy mogę grać z przyjaciółmi?', a: 'Tak. Możesz założyć wspólną gildię, bić razem bossa gildyjnego, chodzić na operacje grupowe, toczyć wojny z innymi gildiami i rywalizować w rankingu oraz na arenie PvP.' },
      { q: 'Ile czasu trzeba grać dziennie?', a: 'Tyle, ile chcesz. Dzienne limity wejść do lochów, krypt i zadań sprawiają, że kilkanaście minut dziennie w zupełności wystarczy, żeby nie zostać w tyle.' },
      { q: 'Czy gra jest po polsku?', a: 'Tak, GlitchSoul jest w pełni po polsku i po angielsku. Język przełączysz w każdej chwili przyciskiem PL/EN.' },
    ],
    finalTitle: 'Neonowe ruiny czekają',
    finalBody: 'Dołącz do graczy, którzy mają dość sklepów z mocą. Załóż postać i sprawdź, jak daleko zajdziesz.',
    footerTagline: 'Darmowe cyberpunkowe RPG przeglądarkowe. Bez pay-to-win. Od gracza dla graczy.',
    footerRights: 'Wszelkie prawa zastrzeżone.',
    backHome: '← Strona główna',
    downloadTitle: 'Pobierz GlitchSoul na Androida',
    downloadLead: 'Aplikacja to ta sama gra co w przeglądarce — z tym samym kontem i postępem. Dochodzą powiadomienia o zakończonych zadaniach i wygodna ikona na pulpicie.',
    downloadSteps: [
      'Kliknij przycisk poniżej — pobierze się plik GlitchSoul.apk.',
      'Otwórz pobrany plik. Android poprosi o zgodę na instalację z tego źródła — to normalne przy aplikacjach spoza sklepu Play.',
      'Potwierdź instalację, uruchom grę i zaloguj się na swoje konto.',
    ],
    downloadNote: 'Aplikacja jest darmowa i nie zawiera reklam. Wersja przeglądarkowa działa niezależnie — możesz korzystać z obu naprzemiennie.',
    orBrowser: 'Wolisz bez instalowania? Graj w przeglądarce →',
  },
  en: {
    navPlay: 'PLAY NOW',
    navDownload: 'GET THE APK',
    heroTitle: 'GlitchSoul — a free cyberpunk browser RPG',
    heroLead: 'You play a mercenary in the neon ruins of the Network. Clear dungeons, climb the boss ladder, fight in the PvP arena and build a guild with other players. All in your browser — no install, no fees, no pay-to-win.',
    badges: ['100% free', 'No pay-to-win', 'Browser + Android', 'English and Polish'],
    ctaPlay: '▶ PLAY FREE',
    ctaDownload: '↓ GET IT ON ANDROID',
    ctaNote: 'The game runs instantly in your browser on phone and desktop. Creating an account takes 30 seconds and your progress is saved to the cloud.',
    p2wTitle: 'Zero pay-to-win. Seriously.',
    p2wLead: 'Most free RPGs sell power. GlitchSoul does not. Every item, every level and every rank here is earned by playing — not by paying.',
    p2wPoints: [
      { h: 'We do not sell power', p: 'No stat bundles, no legendary items for cash, no level skips. A paying account and a free account have exactly the same options.' },
      { h: 'Gems are earned in game', p: 'Gems — the premium currency — come from daily logins, login streaks, level-ups and events. You never have to spend a cent to get them.' },
      { h: 'Rank means skill and time', p: 'The top of the leaderboard belongs to whoever built their character better and spent their limited daily runs more wisely. Not to whoever paid more.' },
      { h: 'Daily limits protect balance', p: 'A capped number of dungeons, crypts and quests per day means nobody "wins the game" by grinding 16 hours a day or buying speed-ups.' },
    ],
    featTitle: 'What you actually do',
    feats: [
      { icon: '🗺️', h: 'Operations (dungeons)', p: `${STATS.dungeons} locations on the map, from The Slums to the Genesis Singularity. Pick difficulty and reward mode — more XP, more gold or better loot — and fight through the floors.` },
      { icon: '☠️', h: 'Boss ladder', p: `${STATS.bosses} unique bosses, each with its own powers: shield, rage, lifesteal, dodge, double strike, poison. Beat one to unlock the next.` },
      { icon: '⚔️', h: 'PvP arena', p: 'Fight other players’ characters for rating, gold and XP. Opponents are matched to your level and there is a cooldown between fights.' },
      { icon: '💀', h: 'The Crypt', p: 'A rogue-like descent: monster rooms, shrines, traps, altars and companions. You enter with your current HP, so every run is a real risk.' },
      { icon: '🛡️', h: 'Guilds and wars', p: `Found or join a guild: shared XP and gold bonuses, a co-op guild boss, ${STATS.guildOps} group operations and wars against other guilds.` },
      { icon: '🧬', h: 'Character building', p: `Six attributes, ${STATS.maxLevel} levels, gear across six slots, upgrades at the smith and stat rerolls at the enchanter.` },
      { icon: '📜', h: 'Timed quests', p: 'Send your character on a job and come back for the reward — the game moves forward even while you are away, and a notification tells you when it is done.' },
      { icon: '💬', h: 'Community', p: 'Global chat, guild chat, mail, a player leaderboard and a lobby where you see who is online. The game lives on people, not bots.' },
    ],
    byPlayersTitle: 'Made by a player, for players',
    byPlayersBody: [
      'GlitchSoul exists because we wanted a simple RPG you can drop into from your phone for a few minutes — one that does not try to sell you a loot box while you are at it. No aggressive ads, no pop-ups screaming "today only, −70%", no countdown timers.',
      'It is built after hours, for people who remember the old browser RPGs: you click, you build a character, you race your friends up the leaderboard. Updates ship regularly and player ideas genuinely make it into the game — most changes start there.',
      'If something is broken or missing, say so in the in-game chat. We actually read it.',
    ],
    statsTitle: 'GlitchSoul by the numbers',
    statsItems: [
      { n: String(STATS.bosses), l: 'bosses to beat' },
      { n: String(STATS.dungeons), l: 'map locations' },
      { n: String(STATS.enemies), l: 'enemy types' },
      { n: String(STATS.maxLevel), l: 'character levels' },
      { n: '$0', l: 'to play it all' },
    ],
    shotsTitle: 'See what it looks like',
    shotsLead: 'Real in-game screenshots — not rendered mock-ups.',
    playTitle: 'Play it however you like',
    playBrowser: { h: 'In the browser', p: 'Open and play — phone, tablet, laptop. Nothing to install, and your progress is tied to your account across devices.', cta: '▶ PLAY IN BROWSER' },
    playApk: { h: 'Android app', p: 'The same game and the same account, with a home-screen icon and notifications when quests finish. The APK is installed manually.', cta: '↓ DOWNLOAD APK' },
    faqTitle: 'Frequently asked questions',
    faq: [
      { q: 'Is GlitchSoul free?', a: 'Yes. The whole game — dungeons, bosses, PvP arena, the crypt, guilds and guild wars — is available at no cost. There is no subscription and no content locked behind payment.' },
      { q: 'Can you buy an advantage with money?', a: 'No. GlitchSoul does not sell stats, items or levels. Gems, the premium currency, are earned by playing — daily logins, streaks, level-ups and events. A free account has exactly the same options as any other.' },
      { q: 'Do I need to install anything?', a: 'No. The game runs in your browser on phone and desktop. If you prefer an app, you can additionally download the Android version (an APK file).' },
      { q: 'Do I need an account?', a: 'Yes, and it takes about 30 seconds — just an email address. That way your progress is stored in the cloud and you can play on your phone and your computer with the same character.' },
      { q: 'Can I play with friends?', a: 'Yes. You can start a guild together, fight the guild boss as a team, run group operations, wage war on other guilds and compete on the leaderboard and in the PvP arena.' },
      { q: 'How much time does it take per day?', a: 'As much as you want. Daily caps on dungeons, crypts and quests mean fifteen minutes a day is plenty to stay competitive.' },
      { q: 'What languages are supported?', a: 'GlitchSoul is fully translated into English and Polish. You can switch at any time with the PL/EN button.' },
    ],
    finalTitle: 'The neon ruins are waiting',
    finalBody: 'Join the players who are done with power shops. Roll a character and see how far you get.',
    footerTagline: 'A free cyberpunk browser RPG. No pay-to-win. Made by a player, for players.',
    footerRights: 'All rights reserved.',
    backHome: '← Home',
    downloadTitle: 'Download GlitchSoul for Android',
    downloadLead: 'The app is the same game as the browser version, with the same account and progress. You also get notifications when quests finish and an icon on your home screen.',
    downloadSteps: [
      'Tap the button below — it downloads the GlitchSoul.apk file.',
      'Open the downloaded file. Android will ask you to allow installs from this source — that is normal for apps outside the Play Store.',
      'Confirm the install, launch the game and sign in to your account.',
    ],
    downloadNote: 'The app is free and contains no ads. The browser version keeps working independently — use whichever you feel like.',
    orBrowser: 'Rather not install? Play in the browser →',
  },
};

// ── Shared chrome ─────────────────────────────────────────────────────────────
function LangToggle({ onSwitchLang }: { onSwitchLang: (l: 'pl' | 'en') => void }) {
  const lang = useLangStore(s => s.lang);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {(['pl', 'en'] as const).map(l => (
        <button key={l} onClick={() => onSwitchLang(l)} aria-pressed={lang === l}
          aria-label={l === 'pl' ? 'Polski' : 'English'}
          style={{
            ...ORB, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
            padding: '4px 8px',
            background: lang === l ? 'rgba(0,245,255,0.08)' : 'transparent',
            border: `1px solid ${lang === l ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: lang === l ? '#00f5ff' : 'var(--text-muted)',
          }}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

function Logo({ size = 15 }: { size?: number }) {
  return (
    <span style={{ ...ORB, fontSize: size, fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap' }}>
      <span style={{ color: '#00f5ff', textShadow: '0 0 8px #00f5ff' }}>Glitch</span>
      <span style={{ color: '#ff2d78', textShadow: '0 0 8px #ff2d78' }}>Soul</span>
    </span>
  );
}

function TopBar({ onPlay, onHome, showHome, onSwitchLang }: { onPlay: () => void; onHome?: () => void; showHome?: boolean; onSwitchLang: (l: 'pl' | 'en') => void }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(6,6,16,0.92)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,45,120,0.25)',
      padding: 'calc(8px + env(safe-area-inset-top, 0px)) 12px 8px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {showHome
          ? <button onClick={onHome} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Logo /></button>
          : <Logo />}
        <span style={{ flex: 1 }} />
        <LangToggle onSwitchLang={onSwitchLang} />
        <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 9, padding: '7px 12px' }}>
          <PlayLabel />
        </button>
      </div>
    </header>
  );
}

function PlayLabel() {
  const lang = useLangStore(s => s.lang);
  return <>{C[lang].navPlay}</>;
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{ padding: '40px 14px', ...style }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      ...ORB, fontSize: 17, fontWeight: 900, color: '#00f5ff',
      textShadow: '0 0 14px rgba(0,245,255,0.5)', letterSpacing: '0.04em',
      marginBottom: 12, lineHeight: 1.3,
    }}>{children}</h2>
  );
}

function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ ...MONO, fontSize: 13, lineHeight: 1.75, color: 'var(--text-dim)', ...style }}>{children}</p>;
}

// ── Landing page ──────────────────────────────────────────────────────────────
interface Props {
  onPlay: () => void;
  onDownloadPage: () => void;
  onHome: () => void;
  onSwitchLang: (l: 'pl' | 'en') => void;
  page: 'landing' | 'download';
}

export default function LandingPage({ onPlay, onDownloadPage, onHome, onSwitchLang, page }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = C[lang];
  const [shot, setShot] = useState<string | null>(null);

  if (page === 'download') {
    return (
      <>
        <CyberpunkBg />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <TopBar onPlay={onPlay} onHome={onHome} showHome onSwitchLang={onSwitchLang} />
          <main style={{ flex: 1 }}>
            <Section>
              <button onClick={onHome} style={{ ...MONO, fontSize: 11, color: '#00f5ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16 }}>
                {t.backHome}
              </button>
              <h1 style={{ ...ORB, fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 14, textShadow: '0 0 18px rgba(255,45,120,0.35)' }}>
                {t.downloadTitle}
              </h1>
              <Body style={{ marginBottom: 24, maxWidth: 640 }}>{t.downloadLead}</Body>

              <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
                {t.downloadSteps.map((s, i) => (
                  <li key={i} className="card p-3" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ ...ORB, fontSize: 14, color: '#ff2d78', textShadow: '0 0 10px rgba(255,45,120,0.6)', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ ...MONO, fontSize: 12, lineHeight: 1.7, color: 'var(--text-dim)' }}>{s}</span>
                  </li>
                ))}
              </ol>

              <a href={APK_URL} className="btn btn-primary" style={{ display: 'inline-block', fontSize: 11, padding: '14px 26px', textDecoration: 'none' }}>
                {t.ctaDownload}
              </a>
              <Body style={{ marginTop: 16, fontSize: 11, maxWidth: 640 }}>{t.downloadNote}</Body>
              <div style={{ marginTop: 24 }}>
                <button onClick={onPlay} style={{ ...MONO, fontSize: 12, color: '#00f5ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {t.orBrowser}
                </button>
              </div>
            </Section>
          </main>
          <Footer onDownloadPage={onDownloadPage} onPlay={onPlay} />
        </div>
      </>
    );
  }

  return (
    <>
      <CyberpunkBg />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <TopBar onPlay={onPlay} onSwitchLang={onSwitchLang} />

        <main>
          {/* ── HERO ── */}
          <Section style={{ paddingTop: 34, paddingBottom: 30 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, alignItems: 'center' }}>
              <div style={{ flex: '1 1 340px', minWidth: 0 }}>
                <img src={logoImg} alt="GlitchSoul" width={200} height={68}
                  style={{ height: 68, width: 'auto', marginBottom: 16, filter: 'drop-shadow(0 0 18px rgba(0,245,255,0.5))' }} />
                <h1 style={{ ...ORB, fontSize: 25, fontWeight: 900, color: '#fff', lineHeight: 1.22, marginBottom: 14, textShadow: '0 0 22px rgba(255,45,120,0.4)' }}>
                  {t.heroTitle}
                </h1>
                <Body style={{ fontSize: 13.5, marginBottom: 18 }}>{t.heroLead}</Body>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {t.badges.map(b => (
                    <li key={b} style={{
                      ...MONO, fontSize: 10, color: '#00f5ff', letterSpacing: '0.04em',
                      background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.28)',
                      padding: '5px 10px',
                    }}>✓ {b}</li>
                  ))}
                </ul>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 11, padding: '14px 24px' }}>
                    {t.ctaPlay}
                  </button>
                  <button onClick={onDownloadPage} className="btn btn-secondary" style={{ fontSize: 11, padding: '14px 24px' }}>
                    {t.ctaDownload}
                  </button>
                </div>
                <Body style={{ fontSize: 11, marginTop: 14, color: 'var(--text-muted)' }}>{t.ctaNote}</Body>
              </div>

              <div style={{ flex: '0 1 280px', display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                <img src="/screens/hero.webp" alt={SHOTS[0][lang]} width={260} height={532} loading="eager"
                  style={{
                    width: '100%', maxWidth: 260, height: 'auto',
                    border: '1px solid rgba(255,45,120,0.35)',
                    boxShadow: '0 0 40px rgba(255,45,120,0.18), 0 20px 60px rgba(0,0,0,0.7)',
                  }} />
              </div>
            </div>
          </Section>

          {/* ── STATS ── */}
          <Section style={{ paddingTop: 20, paddingBottom: 20 }}>
            <h2 style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>
              {t.statsTitle}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {t.statsItems.map(s => (
                <div key={s.l} className="card p-3" style={{ textAlign: 'center' }}>
                  <p style={{ ...ORB, fontSize: 20, fontWeight: 900, color: '#ff2d78', textShadow: '0 0 14px rgba(255,45,120,0.5)' }}>{s.n}</p>
                  <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── NO PAY-TO-WIN ── */}
          <Section>
            <div style={{ border: '1px solid rgba(255,45,120,0.35)', background: 'rgba(255,45,120,0.04)', padding: '26px 18px' }}>
              <H2>{t.p2wTitle}</H2>
              <Body style={{ marginBottom: 22, maxWidth: 720, fontSize: 13.5 }}>{t.p2wLead}</Body>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {t.p2wPoints.map(p => (
                  <div key={p.h}>
                    <h3 style={{ ...ORB, fontSize: 12, color: '#ff2d78', marginBottom: 7, letterSpacing: '0.03em' }}>{p.h}</h3>
                    <Body style={{ fontSize: 12 }}>{p.p}</Body>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── FEATURES ── */}
          <Section>
            <H2>{t.featTitle}</H2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginTop: 18 }}>
              {t.feats.map(f => (
                <article key={f.h} className="card p-3">
                  <p style={{ fontSize: 22, lineHeight: 1, marginBottom: 8 }} aria-hidden="true">{f.icon}</p>
                  <h3 style={{ ...ORB, fontSize: 12, color: '#00f5ff', marginBottom: 7, letterSpacing: '0.03em' }}>{f.h}</h3>
                  <Body style={{ fontSize: 12 }}>{f.p}</Body>
                </article>
              ))}
            </div>
          </Section>

          {/* ── SCREENSHOTS ── */}
          <Section>
            <H2>{t.shotsTitle}</H2>
            <Body style={{ marginBottom: 18 }}>{t.shotsLead}</Body>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {SHOTS.map(s => (
                <figure key={s.src} style={{ margin: 0 }}>
                  <button onClick={() => setShot(s.src)} style={{ display: 'block', width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'zoom-in' }}>
                    <img src={s.src} alt={s[lang]} loading="lazy" width={200} height={409}
                      style={{
                        width: '100%', height: 'auto', display: 'block',
                        border: '1px solid rgba(0,245,255,0.25)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                      }} />
                  </button>
                  <figcaption style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.45 }}>
                    {s[lang]}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>

          {/* ── BY PLAYERS ── */}
          <Section>
            <div style={{ border: '1px solid rgba(0,245,255,0.28)', background: 'rgba(0,245,255,0.03)', padding: '26px 18px' }}>
              <H2>{t.byPlayersTitle}</H2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 780 }}>
                {t.byPlayersBody.map((p, i) => <Body key={i}>{p}</Body>)}
              </div>
            </div>
          </Section>

          {/* ── PLATFORMS ── */}
          <Section>
            <H2>{t.playTitle}</H2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 18 }}>
              <article className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ ...ORB, fontSize: 13, color: '#00f5ff' }}>{t.playBrowser.h}</h3>
                <Body style={{ fontSize: 12, flex: 1 }}>{t.playBrowser.p}</Body>
                <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 10, padding: '12px' }}>{t.playBrowser.cta}</button>
              </article>
              <article className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ ...ORB, fontSize: 13, color: '#ff2d78' }}>{t.playApk.h}</h3>
                <Body style={{ fontSize: 12, flex: 1 }}>{t.playApk.p}</Body>
                <button onClick={onDownloadPage} className="btn btn-secondary" style={{ fontSize: 10, padding: '12px' }}>{t.playApk.cta}</button>
              </article>
            </div>
          </Section>

          {/* ── FAQ ── */}
          <Section>
            <H2>{t.faqTitle}</H2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {t.faq.map(f => (
                <details key={f.q} className="card" style={{ padding: '12px 14px' }}>
                  <summary style={{ ...ORB, fontSize: 12, color: 'var(--text-bright)', cursor: 'pointer', letterSpacing: '0.02em', lineHeight: 1.5 }}>
                    {f.q}
                  </summary>
                  <Body style={{ fontSize: 12, marginTop: 10 }}>{f.a}</Body>
                </details>
              ))}
            </div>
          </Section>

          {/* ── FINAL CTA ── */}
          <Section style={{ paddingBottom: 44 }}>
            <div style={{ textAlign: 'center', border: '1px solid rgba(255,45,120,0.35)', padding: '32px 18px', background: 'rgba(255,45,120,0.05)' }}>
              <h2 style={{ ...ORB, fontSize: 19, fontWeight: 900, color: '#fff', marginBottom: 10, textShadow: '0 0 18px rgba(255,45,120,0.5)' }}>
                {t.finalTitle}
              </h2>
              <Body style={{ marginBottom: 20, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>{t.finalBody}</Body>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 11, padding: '14px 28px' }}>{t.ctaPlay}</button>
                <button onClick={onDownloadPage} className="btn btn-secondary" style={{ fontSize: 11, padding: '14px 28px' }}>{t.ctaDownload}</button>
              </div>
            </div>
          </Section>
        </main>

        <Footer onDownloadPage={onDownloadPage} onPlay={onPlay} />
      </div>

      {/* Screenshot lightbox */}
      {shot && (
        <div onClick={() => setShot(null)} role="dialog" aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out',
          }}>
          <img src={shot} alt="" style={{ maxWidth: '100%', maxHeight: '100%', border: '1px solid rgba(0,245,255,0.4)' }} />
        </div>
      )}
    </>
  );
}

function Footer({ onDownloadPage, onPlay }: { onDownloadPage: () => void; onPlay: () => void }) {
  const lang = useLangStore(s => s.lang);
  const t = C[lang];
  return (
    <footer style={{ borderTop: '1px solid rgba(255,45,120,0.2)', padding: '26px 14px calc(26px + env(safe-area-inset-bottom, 0px))', background: 'rgba(4,4,12,0.7)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px' }}>
          <Logo size={14} />
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginTop: 7, lineHeight: 1.6 }}>{t.footerTagline}</p>
        </div>
        <nav style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={onPlay} style={{ ...MONO, fontSize: 11, color: '#00f5ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t.navPlay}</button>
          <button onClick={onDownloadPage} style={{ ...MONO, fontSize: 11, color: '#00f5ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t.navDownload}</button>
        </nav>
      </div>
      <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
        © {new Date().getFullYear()} GlitchSoul. {t.footerRights}
      </p>
    </footer>
  );
}
