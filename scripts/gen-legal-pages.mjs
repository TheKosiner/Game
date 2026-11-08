// Generates the public legal pages (privacy policy, community rules, account
// deletion) in Polish and English as static HTML under public/. Google Play
// requires public URLs for the privacy policy and for account deletion.
//
//   node scripts/gen-legal-pages.mjs
//
// Edit the content here, not the generated files.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTACT = 'thekosiner@gmail.com';
const UPDATED = { pl: '8 listopada 2026', en: '8 November 2026' };

const PAGES = {
  privacy: { pl: '/polityka-prywatnosci/', en: '/en/privacy/' },
  rules: { pl: '/zasady/', en: '/en/rules/' },
  deleteAccount: { pl: '/usun-konto/', en: '/en/delete-account/' },
};

const NAV = {
  pl: { privacy: 'Polityka prywatności', rules: 'Zasady gry', deleteAccount: 'Usuwanie konta', home: '← GlitchSoul', other: 'English', updated: 'Ostatnia aktualizacja' },
  en: { privacy: 'Privacy policy', rules: 'Community rules', deleteAccount: 'Account deletion', home: '← GlitchSoul', other: 'Polski', updated: 'Last updated' },
};

const mail = `<a href="mailto:${CONTACT}">${CONTACT}</a>`;

const CONTENT = {
  privacy: {
    pl: {
      title: 'Polityka prywatności GlitchSoul',
      description: 'Jakie dane przetwarza gra GlitchSoul, w jakim celu, komu je powierza i jakie masz prawa.',
      body: `
<p>GlitchSoul to darmowa gra RPG dostępna w przeglądarce (glitchsoul.com) i jako aplikacja na Androida. Ta polityka opisuje, jakie dane o Tobie przetwarzamy, w jakim celu i jakie masz prawa.</p>

<h2>1. Administrator danych</h2>
<p>Administratorem danych jest twórca gry GlitchSoul. Kontakt we wszystkich sprawach dotyczących danych: ${mail}.</p>

<h2>2. Jakie dane przetwarzamy</h2>
<ul>
<li><strong>Konto:</strong> adres e-mail, nazwa gracza, data założenia konta i akceptacji zasad. Hasło obsługuje Firebase Authentication (Google) — nie mamy do niego dostępu.</li>
<li><strong>Postęp w grze:</strong> bohater, poziom, przedmioty, złoto i gemy, zadania, wyniki walk, przynależność do gildii.</li>
<li><strong>Profil publiczny:</strong> nazwa gracza, imię bohatera, portret, poziom, ekwipunek i ranking PvP — widoczne dla innych graczy w rankingu, gildiach i lobby.</li>
<li><strong>Treści, które tworzysz:</strong> wiadomości na czacie globalnym, czacie gildii i w lobby, poczta w grze, opisy gildii. Widzą je inni gracze (odpowiednio: wszyscy, członkowie gildii, adresat).</li>
<li><strong>Moderacja:</strong> zgłoszenia (kto, kogo, fragment zgłoszonej wiadomości), lista graczy, których blokujesz, ewentualne wyciszenie konta.</li>
<li><strong>Zakupy:</strong> przy zakupie gemów — identyfikator zamówienia, produkt, data i potwierdzenie płatności. Danych karty nie otrzymujemy: płatności obsługuje Stripe (strona WWW) lub Google Play (aplikacja ze Sklepu Play).</li>
<li><strong>Dane techniczne:</strong> raporty błędów aplikacji (treść błędu, ślad stosu, adres podstrony, przeglądarka/urządzenie, wersja gry, identyfikator i nazwa gracza) — wyłącznie do naprawiania błędów.</li>
<li><strong>Na Twoim urządzeniu:</strong> kopia zapisu gry, język, stan samouczka. Powiadomienia (np. o końcu zadania) są planowane lokalnie na urządzeniu — nie zbieramy tokenów powiadomień push.</li>
</ul>
<p>Nie wyświetlamy reklam, nie używamy narzędzi analitycznych ani śledzących i nie sprzedajemy danych.</p>

<h2>3. Cele i podstawy prawne</h2>
<ul>
<li>Prowadzenie konta i udostępnianie gry, w tym funkcji społecznościowych — wykonanie umowy (art. 6 ust. 1 lit. b RODO).</li>
<li>Obsługa zakupów i zwrotów — wykonanie umowy oraz obowiązki prawne (art. 6 ust. 1 lit. b i c).</li>
<li>Bezpieczeństwo, moderacja, przeciwdziałanie oszustwom i naprawa błędów — prawnie uzasadniony interes (art. 6 ust. 1 lit. f).</li>
</ul>

<h2>4. Komu powierzamy dane</h2>
<ul>
<li><strong>Google</strong> (Firebase: logowanie, baza danych, funkcje serwerowe; Google Play; Google Fonts). Baza danych znajduje się w UE; funkcje serwerowe działają w USA. Przekazanie do USA odbywa się na podstawie standardowych klauzul umownych i ram EU-US Data Privacy Framework.</li>
<li><strong>GitHub</strong> — hosting strony glitchsoul.com i pliku APK (logi serwera, np. adres IP).</li>
<li><strong>Stripe</strong> — płatności na stronie WWW.</li>
<li><strong>Discord</strong> — tylko jeśli sam przejdziesz do naszego serwera Discord.</li>
</ul>

<h2>5. Jak długo przechowujemy dane</h2>
<ul>
<li>Konto, postęp, profil i Twoje wiadomości — do usunięcia konta (możesz to zrobić w każdej chwili, zob. <a href="/usun-konto/">usuwanie konta</a>).</li>
<li>Potwierdzenia zakupów — tak długo, jak wymagają tego przepisy podatkowe i obsługa zwrotów; po usunięciu konta są powiązane tylko z pseudonimowym identyfikatorem.</li>
<li>Zgłoszenia innych graczy dotyczące Twojego konta — do zakończenia sprawy, nie dłużej niż 12 miesięcy.</li>
<li>Raporty błędów — do naprawy błędu, nie dłużej niż 12 miesięcy.</li>
</ul>

<h2>6. Twoje prawa</h2>
<p>Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie. Napisz na ${mail}. Konto usuniesz też sam w grze: <em>Bohater → Konto → Usuń konto</em>. Masz prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (lub organu nadzorczego w swoim kraju UE).</p>

<h2>7. Wiek</h2>
<p>Gra nie jest przeznaczona dla osób poniżej 16 roku życia (zawiera czat z innymi graczami i symulowaną ruletkę za złoto z gry).</p>

<h2>8. Bezpieczeństwo</h2>
<p>Połączenia są szyfrowane (HTTPS). Dostęp do danych w bazie ograniczają reguły bezpieczeństwa — każdy gracz może zmieniać tylko własne dane, a operacje wymagające zaufania (zakupy, nagrody) wykonuje serwer.</p>

<h2>9. Zmiany</h2>
<p>O istotnych zmianach tej polityki poinformujemy w grze. Aktualna wersja jest zawsze pod tym adresem.</p>`,
    },
    en: {
      title: 'GlitchSoul privacy policy',
      description: 'What data the GlitchSoul game processes, why, who it is shared with, and your rights.',
      body: `
<p>GlitchSoul is a free RPG played in the browser (glitchsoul.com) and as an Android app. This policy explains what data we process about you, why, and what your rights are.</p>

<h2>1. Controller</h2>
<p>The data controller is the creator of GlitchSoul. Contact for anything about your data: ${mail}.</p>

<h2>2. What we process</h2>
<ul>
<li><strong>Account:</strong> email address, player name, account creation date and the date you accepted the rules. Passwords are handled by Firebase Authentication (Google) — we never see them.</li>
<li><strong>Game progress:</strong> hero, level, items, gold and gems, quests, fight results, guild membership.</li>
<li><strong>Public profile:</strong> player name, hero name, portrait, level, equipment and PvP rating — visible to other players in rankings, guilds and the lobby.</li>
<li><strong>Content you create:</strong> global, guild and lobby chat messages, in-game mail, guild descriptions. Other players see them (everyone, guild members, or the recipient respectively).</li>
<li><strong>Moderation:</strong> reports (who reported whom, a copy of the reported message), the players you block, and a mute if a moderator applies one.</li>
<li><strong>Purchases:</strong> when you buy gems — order ID, product, date and payment confirmation. We never receive card details: payments are handled by Stripe (website) or Google Play (the app from the Play Store).</li>
<li><strong>Technical data:</strong> app error reports (error message, stack trace, page path, browser/device, game version, player ID and name) — used only to fix bugs.</li>
<li><strong>On your device:</strong> a copy of your save, your language and tutorial progress. Reminders (e.g. a quest finishing) are scheduled locally on the device — we collect no push tokens.</li>
</ul>
<p>We show no ads, use no analytics or tracking tools, and never sell data.</p>

<h2>3. Purposes and legal bases</h2>
<ul>
<li>Running your account and the game, including its social features — performance of a contract (GDPR Art. 6(1)(b)).</li>
<li>Handling purchases and refunds — contract and legal obligations (Art. 6(1)(b) and (c)).</li>
<li>Security, moderation, preventing cheating and fixing bugs — legitimate interests (Art. 6(1)(f)).</li>
</ul>

<h2>4. Service providers</h2>
<ul>
<li><strong>Google</strong> (Firebase: sign-in, database, server functions; Google Play; Google Fonts). The database is in the EU; server functions run in the USA, under Standard Contractual Clauses and the EU-US Data Privacy Framework.</li>
<li><strong>GitHub</strong> — hosting of glitchsoul.com and the APK file (server logs such as IP addresses).</li>
<li><strong>Stripe</strong> — payments on the website.</li>
<li><strong>Discord</strong> — only if you choose to visit our Discord server.</li>
</ul>

<h2>5. Retention</h2>
<ul>
<li>Account, progress, profile and your messages — until you delete your account (anytime, see <a href="/en/delete-account/">account deletion</a>).</li>
<li>Purchase confirmations — as long as tax law and refund handling require; after account deletion they are linked only to a pseudonymous ID.</li>
<li>Reports by other players about your account — until resolved, at most 12 months.</li>
<li>Error reports — until the bug is fixed, at most 12 months.</li>
</ul>

<h2>6. Your rights</h2>
<p>You have the right to access, rectify and erase your data, to restrict processing, to data portability, and to object to processing based on legitimate interests. Write to ${mail}. You can also delete your account yourself in the game: <em>Hero → Account → Delete account</em>. You may lodge a complaint with your data protection authority.</p>

<h2>7. Age</h2>
<p>The game is not intended for anyone under 16 (it has chat with other players and a simulated roulette played with in-game gold).</p>

<h2>8. Security</h2>
<p>Connections are encrypted (HTTPS). Database security rules let each player change only their own data, and operations that need trust (purchases, rewards) run on the server.</p>

<h2>9. Changes</h2>
<p>We will announce significant changes to this policy in the game. The current version is always at this address.</p>`,
    },
  },
  rules: {
    pl: {
      title: 'Zasady gry GlitchSoul',
      description: 'Zasady społeczności GlitchSoul: czat, nazwy, uczciwa gra, zgłaszanie i moderacja.',
      body: `
<p>Zakładając konto akceptujesz te zasady. Mają sprawić, że gra jest uczciwa i przyjazna dla wszystkich.</p>

<h2>Szacunek</h2>
<ul>
<li>Bez nękania, gróźb, mowy nienawiści, dyskryminacji i treści o charakterze seksualnym.</li>
<li>Nie publikuj cudzych danych osobowych ani swoich (adresów, numerów telefonów itp.).</li>
<li>Bez spamu, reklam, linków do oszustw i prób wyłudzenia haseł.</li>
<li>Nazwy graczy, bohaterów i gildii też muszą przestrzegać tych zasad.</li>
</ul>

<h2>Uczciwa gra</h2>
<ul>
<li>Zakazane są boty i automatyzacja, modyfikowanie gry lub zapisów, wykorzystywanie błędów zamiast ich zgłaszania.</li>
<li>Jedna osoba — jedno konto do rywalizacji. Bez handlu kontami i przedmiotami za prawdziwe pieniądze.</li>
<li>Ruletka w kasynie używa wyłącznie złota z gry, którego nie da się kupić ani wypłacić — nie ma realnej wartości.</li>
</ul>

<h2>Zgłaszanie i blokowanie</h2>
<ul>
<li>Przy każdej wiadomości innego gracza jest przycisk <strong>⋮</strong>: <em>Zgłoś</em> wysyła ją do moderatorów, <em>Zablokuj gracza</em> ukrywa jego wiadomości i pocztę.</li>
<li>Zablokowanych graczy odblokujesz w: <em>Bohater → Konto</em>.</li>
</ul>

<h2>Moderacja</h2>
<p>Moderatorzy mogą usuwać treści, wyciszyć konto (zakaz pisania na czacie i w poczcie) lub w poważnych przypadkach usunąć konto. Kontakt w sprawie decyzji: ${mail}.</p>

<h2>Zakupy</h2>
<p>Gemy to przedmioty wirtualne bez wartości pieniężnej. Zwroty obsługuje sklep, w którym dokonano zakupu (Google Play lub Stripe), zgodnie z jego zasadami. Za gemy nie da się kupić losowych nagród ani przewagi, której nie da się zdobyć grając.</p>`,
    },
    en: {
      title: 'GlitchSoul community rules',
      description: 'GlitchSoul community rules: chat, names, fair play, reporting and moderation.',
      body: `
<p>By creating an account you accept these rules. They exist to keep the game fair and friendly for everyone.</p>

<h2>Respect</h2>
<ul>
<li>No harassment, threats, hate speech, discrimination or sexual content.</li>
<li>Don't post anyone's personal data, including your own (addresses, phone numbers, etc.).</li>
<li>No spam, advertising, scam links or attempts to obtain passwords.</li>
<li>Player, hero and guild names must follow these rules too.</li>
</ul>

<h2>Fair play</h2>
<ul>
<li>No bots or automation, no modifying the game or saves, no exploiting bugs instead of reporting them.</li>
<li>One person — one account for competitive play. No trading accounts or items for real money.</li>
<li>The casino roulette uses only in-game gold, which can't be bought or cashed out — it has no real-world value.</li>
</ul>

<h2>Reporting and blocking</h2>
<ul>
<li>Every message from another player has a <strong>⋮</strong> button: <em>Report</em> sends it to the moderators, <em>Block player</em> hides their messages and mail.</li>
<li>Unblock players in <em>Hero → Account</em>.</li>
</ul>

<h2>Moderation</h2>
<p>Moderators may remove content, mute an account (no chat or mail) or, in serious cases, delete it. Contact about a decision: ${mail}.</p>

<h2>Purchases</h2>
<p>Gems are virtual items with no cash value. Refunds are handled by the store you bought from (Google Play or Stripe) under its terms. Gems can't buy random rewards or any advantage you can't earn by playing.</p>`,
    },
  },
  deleteAccount: {
    pl: {
      title: 'Usuwanie konta GlitchSoul',
      description: 'Jak usunąć konto w grze GlitchSoul i jakie dane zostaną usunięte.',
      body: `
<h2>Usunięcie konta w grze</h2>
<ol>
<li>Zaloguj się w grze (przeglądarka lub aplikacja na Androida).</li>
<li>Otwórz zakładkę <strong>Bohater</strong> i przewiń do sekcji <strong>Konto</strong>.</li>
<li>Wybierz <strong>Usuń konto</strong>, wpisz swoją nazwę gracza i potwierdź.</li>
</ol>
<p>Konto zostaje usunięte od razu i nie da się tego cofnąć.</p>

<h2>Nie możesz się zalogować?</h2>
<p>Napisz na ${mail} z adresu e-mail przypisanego do konta, w temacie: <em>Usunięcie konta GlitchSoul</em>, podając nazwę gracza. Usuniemy konto w ciągu 30 dni i potwierdzimy to mailowo.</p>

<h2>Co zostaje usunięte</h2>
<ul>
<li>Konto logowania (adres e-mail i hasło) oraz nazwa gracza.</li>
<li>Bohater i cały zapis gry, profil publiczny i wpisy w rankingach.</li>
<li>Twoje wiadomości na czatach, poczta wysłana i otrzymana, zaproszenia do gildii, historia walk PvP i zakładów w kasynie.</li>
<li>Członkostwo w gildii (jeśli jesteś liderem, przywództwo przejmuje oficer lub najdłużej obecny członek; gildia bez członków zostaje rozwiązana).</li>
<li>Twoje zgłoszenia, lista zablokowanych graczy, nieodebrane gemy z zakupów i raporty błędów.</li>
</ul>

<h2>Co może zostać zachowane</h2>
<ul>
<li>Potwierdzenia zakupów (numer zamówienia, produkt, data) — wymagane przez przepisy podatkowe i do obsługi zwrotów; powiązane już tylko z pseudonimowym identyfikatorem.</li>
<li>Zgłoszenia innych graczy dotyczące Twojego konta — do zakończenia sprawy, najdłużej 12 miesięcy.</li>
</ul>`,
    },
    en: {
      title: 'Deleting your GlitchSoul account',
      description: 'How to delete your GlitchSoul account and which data is deleted.',
      body: `
<h2>Delete your account in the game</h2>
<ol>
<li>Sign in to the game (browser or Android app).</li>
<li>Open the <strong>Hero</strong> tab and scroll to the <strong>Account</strong> section.</li>
<li>Choose <strong>Delete account</strong>, type your player name and confirm.</li>
</ol>
<p>The account is deleted immediately and this can't be undone.</p>

<h2>Can't sign in?</h2>
<p>Email ${mail} from the address linked to the account, with the subject <em>GlitchSoul account deletion</em> and your player name. We will delete the account within 30 days and confirm by email.</p>

<h2>What is deleted</h2>
<ul>
<li>Your sign-in account (email and password) and player name.</li>
<li>Your hero and entire save, public profile and ranking entries.</li>
<li>Your chat messages, mail sent and received, guild invites, PvP and casino history.</li>
<li>Your guild membership (a leader's role passes to an officer or the longest-serving member; a guild with no members left is disbanded).</li>
<li>Your reports, block list, unclaimed purchased gems and error reports.</li>
</ul>

<h2>What may be kept</h2>
<ul>
<li>Purchase confirmations (order ID, product, date) — required by tax law and for handling refunds; linked only to a pseudonymous ID.</li>
<li>Reports by other players about your account — until resolved, at most 12 months.</li>
</ul>`,
    },
  },
};

function page(kind, lang) {
  const c = CONTENT[kind][lang];
  const n = NAV[lang];
  const other = lang === 'pl' ? 'en' : 'pl';
  const url = `https://glitchsoul.com${PAGES[kind][lang]}`;
  const nav = Object.keys(PAGES)
    .map(k => k === kind ? `<span aria-current="page">${n[k]}</span>` : `<a href="${PAGES[k][lang]}">${n[k]}</a>`)
    .join(' · ');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${c.title}</title>
<meta name="description" content="${c.description}" />
<link rel="canonical" href="${url}" />
<link rel="alternate" hreflang="${lang}" href="${url}" />
<link rel="alternate" hreflang="${other}" href="https://glitchsoul.com${PAGES[kind][other]}" />
<link rel="icon" type="image/png" href="/favicon.png" />
<meta name="theme-color" content="#0a0a0f" />
<style>
  :root { color-scheme: dark; --bg: #07070f; --panel: #0e0e1c; --text: #d9dbe8; --muted: #8b8fa8; --accent: #00f5ff; --pink: #ff2d78; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.65 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 24px 16px 64px; }
  header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 18px; }
  header a { color: var(--accent); text-decoration: none; font-weight: 600; }
  nav { font-size: 14px; color: var(--muted); margin-bottom: 20px; }
  nav a { color: var(--accent); }
  nav [aria-current] { color: var(--text); font-weight: 600; }
  h1 { font-size: 26px; line-height: 1.25; margin: 0 0 4px; color: #fff; }
  h2 { font-size: 18px; margin: 28px 0 8px; color: var(--pink); }
  a { color: var(--accent); }
  ul, ol { padding-left: 22px; }
  li { margin: 6px 0; }
  .updated { color: var(--muted); font-size: 14px; margin: 0 0 18px; }
  article { background: var(--panel); border: 1px solid #22223a; border-radius: 10px; padding: 18px 20px; }
  footer { margin-top: 28px; color: var(--muted); font-size: 13px; text-align: center; }
</style>
</head>
<body>
<main>
<header><a href="${lang === 'pl' ? '/' : '/en/'}">${n.home}</a><a href="${PAGES[kind][other]}" lang="${other}">${n.other}</a></header>
<nav>${nav}</nav>
<article>
<h1>${c.title}</h1>
<p class="updated">${n.updated}: ${UPDATED[lang]}</p>
${c.body.trim()}
</article>
<footer>© GlitchSoul · <a href="mailto:${CONTACT}">${CONTACT}</a></footer>
</main>
</body>
</html>
`;
}

for (const kind of Object.keys(PAGES)) {
  for (const lang of ['pl', 'en']) {
    const out = resolve(ROOT, 'public', PAGES[kind][lang].replace(/^\//, ''), 'index.html');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, page(kind, lang));
    console.log('wrote', out.replace(ROOT + '/', ''));
  }
}
