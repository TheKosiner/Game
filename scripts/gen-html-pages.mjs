// Generates the static HTML entry points (one per public page per language) and
// sitemap.xml. Each page gets its own <title>/description/canonical plus
// hreflang alternates, so every language ranks as its own URL instead of one
// page with a client-side language toggle.
//
// Run after editing page copy or adding a language:
//   node scripts/gen-html-pages.mjs
// The generated files are committed — Vite needs them on disk as build inputs.
//
// The FAQ text below mirrors LANDING[lang].faq in src/i18n/landing.ts (the
// on-page copy). Keep the two in step when editing questions.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://glitchsoul.com';

// Polish keeps its original slugs so already-indexed URLs stay valid; every
// other language lives under its own /<code>/ prefix.
const LANGS = ['pl', 'en', 'de', 'es', 'fr', 'it', 'pt'];
const LOCALE = { pl: 'pl_PL', en: 'en_US', de: 'de_DE', es: 'es_ES', fr: 'fr_FR', it: 'it_IT', pt: 'pt_BR' };
const CURRENCY = { pl: 'PLN', en: 'USD', de: 'EUR', es: 'EUR', fr: 'EUR', it: 'EUR', pt: 'BRL' };

const urlFor = (lang, page) => {
  if (lang === 'pl') return page === 'landing' ? '/' : page === 'download' ? '/pobierz/' : '/logowanie/';
  const base = `/${lang}/`;
  return page === 'landing' ? base : page === 'download' ? `${base}download/` : `${base}login/`;
};
const fileFor = (lang, page) => {
  const u = urlFor(lang, page);
  return u === '/' ? 'index.html' : u.slice(1) + 'index.html';
};

// ── Per-language SEO metadata ────────────────────────────────────────────────
const META = {
  pl: {
    landing: {
      title: 'GlitchSoul — darmowe cyberpunkowe RPG przeglądarkowe bez pay-to-win',
      desc: 'GlitchSoul to darmowe cyberpunkowe RPG w przeglądarce i na Androida. Lochy, 41 bossów, arena PvP, krypta, gildie i wojny gildii. Zero pay-to-win — nie sprzedajemy mocy ani przedmiotów.',
      ogTitle: 'GlitchSoul — darmowe cyberpunkowe RPG bez pay-to-win',
      ogDesc: 'Lochy, 41 bossów, arena PvP, krypta i gildie. Darmowe RPG w przeglądarce i na Androida, w którym nie da się kupić przewagi. Od gracza dla graczy.',
    },
    download: {
      title: 'Pobierz GlitchSoul na Androida — darmowa aplikacja RPG (APK)',
      desc: 'Pobierz GlitchSoul na Androida za darmo. Ta sama gra co w przeglądarce, to samo konto i postęp, powiadomienia o zadaniach. Instrukcja instalacji APK krok po kroku.',
      ogTitle: 'Pobierz GlitchSoul na Androida (APK)',
      ogDesc: 'Darmowa aplikacja RPG na Androida. To samo konto i postęp co w przeglądarce, bez reklam.',
    },
    auth: {
      title: 'Logowanie i rejestracja — GlitchSoul',
      desc: 'Zaloguj się lub załóż darmowe konto w GlitchSoul. Rejestracja zajmuje 30 sekund, a postęp zapisuje się w chmurze.',
      ogTitle: 'Logowanie — GlitchSoul', ogDesc: 'Zaloguj się lub załóż darmowe konto w GlitchSoul.',
    },
    schemaDesc: 'Darmowe cyberpunkowe RPG przeglądarkowe bez pay-to-win. Lochy, 41 bossów, arena PvP, krypta, gildie i wojny gildii.',
    genre: ['RPG', 'MMORPG', 'Gra przeglądarkowa', 'Cyberpunk'],
    noscript: {
      h1: 'GlitchSoul — darmowe cyberpunkowe RPG przeglądarkowe',
      p1: 'GlitchSoul to darmowe RPG w klimacie cyberpunk, w które zagrasz bezpośrednio w przeglądarce na telefonie i komputerze, albo przez aplikację na Androida. Czyścisz lochy w 20 lokacjach, wspinasz się po drabince 41 bossów, walczysz na arenie PvP, schodzisz do krypty i budujesz gildię z innymi graczami.',
      h2: 'Bez pay-to-win',
      p2: 'Nie sprzedajemy mocy: nie ma pakietów ze statystykami, legendarnych przedmiotów za pieniądze ani skrótów do poziomów. Gemy zdobywa się grając. Konto darmowe ma dokładnie te same możliwości co każde inne.',
      p3: 'Aby zagrać, włącz obsługę JavaScriptu w przeglądarce.',
    },
    faq: [
      ['Czy GlitchSoul jest darmowy?', 'Tak. Cała gra — lochy, bossowie, arena PvP, krypta, gildie i wojny gildii — jest dostępna bez żadnych opłat. Nie ma abonamentu ani treści zamkniętych za płatnością.'],
      ['Czy da się kupić przewagę za pieniądze?', 'Nie. W GlitchSoul nie sprzedajemy statystyk, przedmiotów ani poziomów. Gemy, czyli waluta premium, zdobywa się grając — za codzienne logowanie, serie dni, awanse i wydarzenia. Konto darmowe ma dokładnie te same możliwości co każde inne.'],
      ['Czy muszę coś instalować?', 'Nie. Gra działa w przeglądarce na telefonie i komputerze. Jeśli wolisz aplikację, możesz dodatkowo pobrać wersję na Androida (plik APK).'],
      ['Czy potrzebuję konta?', 'Tak, założenie konta zajmuje około 30 sekund i wymaga tylko adresu e-mail. Dzięki temu postęp zapisuje się w chmurze i możesz grać raz na telefonie, raz na komputerze — na tej samej postaci.'],
      ['Czy mogę grać z przyjaciółmi?', 'Tak. Możesz założyć wspólną gildię, bić razem bossa gildyjnego, chodzić na operacje grupowe, toczyć wojny z innymi gildiami i rywalizować w rankingu oraz na arenie PvP.'],
      ['Ile czasu trzeba grać dziennie?', 'Tyle, ile chcesz. Dzienne limity wejść do lochów, krypt i zadań sprawiają, że kilkanaście minut dziennie w zupełności wystarczy, żeby nie zostać w tyle.'],
      ['W jakich językach jest gra?', 'GlitchSoul jest dostępny po polsku, angielsku, niemiecku, hiszpańsku, francusku, włosku i portugalsku.'],
    ],
  },
  en: {
    landing: {
      title: 'GlitchSoul — free cyberpunk browser RPG with no pay-to-win',
      desc: 'GlitchSoul is a free cyberpunk RPG for browser and Android. Dungeons, 41 bosses, PvP arena, the crypt, guilds and guild wars. Zero pay-to-win — we do not sell power or items.',
      ogTitle: 'GlitchSoul — free cyberpunk RPG with no pay-to-win',
      ogDesc: 'Dungeons, 41 bosses, PvP arena, the crypt and guilds. A free browser and Android RPG where you cannot buy an advantage. Made by a player, for players.',
    },
    download: {
      title: 'Download GlitchSoul for Android — free RPG app (APK)',
      desc: 'Download GlitchSoul for Android free. The same game as the browser version, the same account and progress, plus quest notifications. Step-by-step APK install instructions.',
      ogTitle: 'Download GlitchSoul for Android (APK)',
      ogDesc: 'A free Android RPG app. Same account and progress as the browser version, no ads.',
    },
    auth: {
      title: 'Sign in or create an account — GlitchSoul',
      desc: 'Sign in or create a free GlitchSoul account. Registration takes 30 seconds and your progress is saved to the cloud.',
      ogTitle: 'Sign in — GlitchSoul', ogDesc: 'Sign in or create a free GlitchSoul account.',
    },
    schemaDesc: 'A free cyberpunk browser RPG with no pay-to-win. Dungeons, 41 bosses, PvP arena, the crypt, guilds and guild wars.',
    genre: ['RPG', 'MMORPG', 'Browser game', 'Cyberpunk'],
    noscript: {
      h1: 'GlitchSoul — a free cyberpunk browser RPG',
      p1: 'GlitchSoul is a free cyberpunk RPG you can play straight in your browser on phone and desktop, or through the Android app. Clear dungeons across 20 locations, climb a ladder of 41 bosses, fight in the PvP arena, descend into the crypt and build a guild with other players.',
      h2: 'No pay-to-win',
      p2: 'We do not sell power: no stat bundles, no legendary items for cash, no level skips. Gems are earned by playing. A free account has exactly the same options as any other.',
      p3: 'To play, enable JavaScript in your browser.',
    },
    faq: [
      ['Is GlitchSoul free?', 'Yes. The whole game — dungeons, bosses, PvP arena, the crypt, guilds and guild wars — is available at no cost. There is no subscription and no content locked behind payment.'],
      ['Can you buy an advantage with money?', 'No. GlitchSoul does not sell stats, items or levels. Gems, the premium currency, are earned by playing — daily logins, streaks, level-ups and events. A free account has exactly the same options as any other.'],
      ['Do I need to install anything?', 'No. The game runs in your browser on phone and desktop. If you prefer an app, you can additionally download the Android version (an APK file).'],
      ['Do I need an account?', 'Yes, and it takes about 30 seconds — just an email address. That way your progress is stored in the cloud and you can play on your phone and your computer with the same character.'],
      ['Can I play with friends?', 'Yes. You can start a guild together, fight the guild boss as a team, run group operations, wage war on other guilds and compete on the leaderboard and in the PvP arena.'],
      ['How much time does it take per day?', 'As much as you want. Daily caps on dungeons, crypts and quests mean fifteen minutes a day is plenty to stay competitive.'],
      ['What languages are supported?', 'GlitchSoul is available in English, Polish, German, Spanish, French, Italian and Portuguese.'],
    ],
  },
  de: {
    landing: {
      title: 'GlitchSoul — kostenloses Cyberpunk-Browser-RPG ohne Pay-to-win',
      desc: 'GlitchSoul ist ein kostenloses Cyberpunk-RPG für Browser und Android. Dungeons, 41 Bosse, PvP-Arena, Krypta, Gilden und Gildenkriege. Null Pay-to-win — wir verkaufen keine Macht.',
      ogTitle: 'GlitchSoul — kostenloses Cyberpunk-RPG ohne Pay-to-win',
      ogDesc: 'Dungeons, 41 Bosse, PvP-Arena, Krypta und Gilden. Ein kostenloses Browser- und Android-RPG, in dem man sich keinen Vorteil kaufen kann.',
    },
    download: {
      title: 'GlitchSoul für Android herunterladen — kostenlose RPG-App (APK)',
      desc: 'Lade GlitchSoul kostenlos für Android. Dasselbe Spiel wie im Browser, dasselbe Konto und derselbe Fortschritt, dazu Quest-Benachrichtigungen. Schritt-für-Schritt-Anleitung zur APK-Installation.',
      ogTitle: 'GlitchSoul für Android herunterladen (APK)',
      ogDesc: 'Kostenlose Android-RPG-App. Dasselbe Konto und derselbe Fortschritt wie im Browser, ohne Werbung.',
    },
    auth: {
      title: 'Anmelden oder Konto erstellen — GlitchSoul',
      desc: 'Melde dich an oder erstelle ein kostenloses GlitchSoul-Konto. Die Registrierung dauert 30 Sekunden, dein Fortschritt liegt in der Cloud.',
      ogTitle: 'Anmelden — GlitchSoul', ogDesc: 'Melde dich an oder erstelle ein kostenloses GlitchSoul-Konto.',
    },
    schemaDesc: 'Kostenloses Cyberpunk-Browser-RPG ohne Pay-to-win. Dungeons, 41 Bosse, PvP-Arena, Krypta, Gilden und Gildenkriege.',
    genre: ['RPG', 'MMORPG', 'Browserspiel', 'Cyberpunk'],
    noscript: {
      h1: 'GlitchSoul — kostenloses Cyberpunk-Browser-RPG',
      p1: 'GlitchSoul ist ein kostenloses Cyberpunk-RPG, das du direkt im Browser auf Handy und PC oder über die Android-App spielen kannst. Räume Dungeons an 20 Orten, klettere eine Leiter aus 41 Bossen hoch, kämpfe in der PvP-Arena, steig in die Krypta hinab und baue mit anderen eine Gilde auf.',
      h2: 'Kein Pay-to-win',
      p2: 'Wir verkaufen keine Macht: keine Statuspakete, keine legendären Items für Geld, keine Stufensprünge. Gems werden erspielt. Ein kostenloses Konto hat exakt dieselben Möglichkeiten wie jedes andere.',
      p3: 'Um zu spielen, aktiviere JavaScript in deinem Browser.',
    },
    faq: [
      ['Ist GlitchSoul kostenlos?', 'Ja. Das ganze Spiel — Dungeons, Bosse, PvP-Arena, Krypta, Gilden und Gildenkriege — ist ohne Kosten verfügbar. Es gibt kein Abo und keine Inhalte hinter einer Bezahlschranke.'],
      ['Kann man sich mit Geld einen Vorteil kaufen?', 'Nein. GlitchSoul verkauft keine Werte, Items oder Stufen. Gems, die Premiumwährung, werden erspielt — durch tägliche Anmeldungen, Serien, Stufenaufstiege und Events. Ein kostenloses Konto hat exakt dieselben Möglichkeiten wie jedes andere.'],
      ['Muss ich etwas installieren?', 'Nein. Das Spiel läuft im Browser auf Handy und PC. Wenn du lieber eine App möchtest, kannst du zusätzlich die Android-Version (eine APK-Datei) herunterladen.'],
      ['Brauche ich ein Konto?', 'Ja, und es dauert etwa 30 Sekunden — nur eine E-Mail-Adresse. So liegt dein Fortschritt in der Cloud und du kannst mit demselben Charakter am Handy und am Rechner spielen.'],
      ['Kann ich mit Freunden spielen?', 'Ja. Ihr könnt gemeinsam eine Gilde gründen, den Gildenboss im Team bekämpfen, Gruppenoperationen laufen, anderen Gilden den Krieg erklären und euch in der Rangliste und der PvP-Arena messen.'],
      ['Wie viel Zeit braucht man pro Tag?', 'So viel du willst. Durch die Tageslimits für Dungeons, Krypten und Quests reichen fünfzehn Minuten am Tag völlig aus, um mitzuhalten.'],
      ['Welche Sprachen werden unterstützt?', 'GlitchSoul gibt es auf Deutsch, Englisch, Polnisch, Spanisch, Französisch, Italienisch und Portugiesisch.'],
    ],
  },
  es: {
    landing: {
      title: 'GlitchSoul — RPG cyberpunk gratis en el navegador, sin pay-to-win',
      desc: 'GlitchSoul es un RPG cyberpunk gratuito para navegador y Android. Mazmorras, 41 jefes, arena PvP, cripta, clanes y guerras de clanes. Cero pay-to-win: no vendemos poder ni objetos.',
      ogTitle: 'GlitchSoul — RPG cyberpunk gratis sin pay-to-win',
      ogDesc: 'Mazmorras, 41 jefes, arena PvP, cripta y clanes. Un RPG gratuito de navegador y Android en el que no se puede comprar ventaja.',
    },
    download: {
      title: 'Descarga GlitchSoul para Android — app RPG gratis (APK)',
      desc: 'Descarga GlitchSoul gratis para Android. El mismo juego que en el navegador, la misma cuenta y el mismo progreso, más avisos de misiones. Instrucciones paso a paso para instalar el APK.',
      ogTitle: 'Descarga GlitchSoul para Android (APK)',
      ogDesc: 'App RPG gratuita para Android. La misma cuenta y el mismo progreso que en el navegador, sin anuncios.',
    },
    auth: {
      title: 'Inicia sesión o crea una cuenta — GlitchSoul',
      desc: 'Inicia sesión o crea una cuenta gratuita de GlitchSoul. El registro lleva 30 segundos y tu progreso se guarda en la nube.',
      ogTitle: 'Iniciar sesión — GlitchSoul', ogDesc: 'Inicia sesión o crea una cuenta gratuita de GlitchSoul.',
    },
    schemaDesc: 'RPG cyberpunk gratuito de navegador sin pay-to-win. Mazmorras, 41 jefes, arena PvP, cripta, clanes y guerras de clanes.',
    genre: ['RPG', 'MMORPG', 'Juego de navegador', 'Cyberpunk'],
    noscript: {
      h1: 'GlitchSoul — RPG cyberpunk gratis en el navegador',
      p1: 'GlitchSoul es un RPG cyberpunk gratuito al que puedes jugar directamente en el navegador, en móvil y en ordenador, o mediante la aplicación de Android. Limpia mazmorras en 20 ubicaciones, sube una escalera de 41 jefes, lucha en la arena PvP, baja a la cripta y crea un clan con otros jugadores.',
      h2: 'Sin pay-to-win',
      p2: 'No vendemos poder: no hay packs de atributos, ni objetos legendarios por dinero, ni saltos de nivel. Las gemas se ganan jugando. Una cuenta gratuita tiene exactamente las mismas opciones que cualquier otra.',
      p3: 'Para jugar, activa JavaScript en tu navegador.',
    },
    faq: [
      ['¿GlitchSoul es gratis?', 'Sí. Todo el juego —mazmorras, jefes, arena PvP, cripta, clanes y guerras de clanes— está disponible sin coste. No hay suscripción ni contenido bloqueado tras un pago.'],
      ['¿Se puede comprar ventaja con dinero?', 'No. GlitchSoul no vende atributos, objetos ni niveles. Las gemas, la moneda premium, se ganan jugando: inicios de sesión diarios, rachas, subidas de nivel y eventos. Una cuenta gratuita tiene exactamente las mismas opciones que cualquier otra.'],
      ['¿Tengo que instalar algo?', 'No. El juego funciona en el navegador, en móvil y en ordenador. Si prefieres una aplicación, puedes descargar además la versión para Android (un archivo APK).'],
      ['¿Necesito una cuenta?', 'Sí, y se tarda unos 30 segundos: solo un correo electrónico. Así tu progreso queda en la nube y puedes jugar en el móvil y en el ordenador con el mismo personaje.'],
      ['¿Puedo jugar con amigos?', 'Sí. Podéis crear un clan juntos, pelear en equipo contra el jefe de clan, hacer operaciones grupales, declarar la guerra a otros clanes y competir en la clasificación y en la arena PvP.'],
      ['¿Cuánto hay que jugar al día?', 'Lo que quieras. Los límites diarios de mazmorras, criptas y misiones hacen que quince minutos al día basten de sobra para no quedarte atrás.'],
      ['¿En qué idiomas está?', 'GlitchSoul está disponible en español, inglés, polaco, alemán, francés, italiano y portugués.'],
    ],
  },
  fr: {
    landing: {
      title: 'GlitchSoul — RPG cyberpunk gratuit dans le navigateur, sans pay-to-win',
      desc: 'GlitchSoul est un RPG cyberpunk gratuit pour navigateur et Android. Donjons, 41 boss, arène PvP, crypte, guildes et guerres de guildes. Zéro pay-to-win : nous ne vendons ni puissance ni objets.',
      ogTitle: 'GlitchSoul — RPG cyberpunk gratuit sans pay-to-win',
      ogDesc: 'Donjons, 41 boss, arène PvP, crypte et guildes. Un RPG gratuit sur navigateur et Android où l’on ne peut pas acheter d’avantage.',
    },
    download: {
      title: 'Télécharger GlitchSoul pour Android — appli RPG gratuite (APK)',
      desc: 'Télécharge GlitchSoul gratuitement pour Android. Le même jeu que dans le navigateur, le même compte et la même progression, plus les notifications de quêtes. Guide d’installation de l’APK pas à pas.',
      ogTitle: 'Télécharger GlitchSoul pour Android (APK)',
      ogDesc: 'Appli RPG Android gratuite. Même compte et même progression que dans le navigateur, sans publicité.',
    },
    auth: {
      title: 'Se connecter ou créer un compte — GlitchSoul',
      desc: 'Connecte-toi ou crée un compte GlitchSoul gratuit. L’inscription prend 30 secondes et ta progression est sauvegardée dans le cloud.',
      ogTitle: 'Connexion — GlitchSoul', ogDesc: 'Connecte-toi ou crée un compte GlitchSoul gratuit.',
    },
    schemaDesc: 'RPG cyberpunk gratuit sur navigateur, sans pay-to-win. Donjons, 41 boss, arène PvP, crypte, guildes et guerres de guildes.',
    genre: ['RPG', 'MMORPG', 'Jeu par navigateur', 'Cyberpunk'],
    noscript: {
      h1: 'GlitchSoul — RPG cyberpunk gratuit dans le navigateur',
      p1: 'GlitchSoul est un RPG cyberpunk gratuit auquel tu peux jouer directement dans ton navigateur, sur téléphone comme sur ordinateur, ou via l’application Android. Nettoie des donjons dans 20 lieux, grimpe une échelle de 41 boss, combats dans l’arène PvP, descends dans la crypte et monte une guilde avec d’autres joueurs.',
      h2: 'Sans pay-to-win',
      p2: 'Nous ne vendons pas de puissance : pas de packs de caractéristiques, pas d’objets légendaires contre de l’argent, pas de sauts de niveau. Les gemmes se gagnent en jouant. Un compte gratuit a exactement les mêmes possibilités que n’importe quel autre.',
      p3: 'Pour jouer, active JavaScript dans ton navigateur.',
    },
    faq: [
      ['GlitchSoul est-il gratuit ?', 'Oui. Tout le jeu — donjons, boss, arène PvP, crypte, guildes et guerres de guildes — est accessible sans frais. Il n’y a ni abonnement ni contenu bloqué derrière un paiement.'],
      ['Peut-on acheter un avantage avec de l’argent ?', 'Non. GlitchSoul ne vend ni caractéristiques, ni objets, ni niveaux. Les gemmes, la monnaie premium, se gagnent en jouant : connexions quotidiennes, séries, montées de niveau et événements. Un compte gratuit a exactement les mêmes possibilités que n’importe quel autre.'],
      ['Dois-je installer quelque chose ?', 'Non. Le jeu fonctionne dans le navigateur, sur téléphone comme sur ordinateur. Si tu préfères une application, tu peux en plus télécharger la version Android (un fichier APK).'],
      ['Ai-je besoin d’un compte ?', 'Oui, et cela prend environ 30 secondes — juste une adresse e-mail. Ta progression est ainsi stockée dans le cloud et tu peux jouer sur ton téléphone et sur ton ordinateur avec le même personnage.'],
      ['Puis-je jouer avec des amis ?', 'Oui. Vous pouvez fonder une guilde ensemble, affronter le boss de guilde en équipe, lancer des opérations de groupe, déclarer la guerre à d’autres guildes et vous mesurer au classement et dans l’arène PvP.'],
      ['Combien de temps faut-il par jour ?', 'Autant que tu veux. Les limites quotidiennes de donjons, de cryptes et de quêtes font que quinze minutes par jour suffisent largement pour rester dans la course.'],
      ['Quelles langues sont disponibles ?', 'GlitchSoul est disponible en français, anglais, polonais, allemand, espagnol, italien et portugais.'],
    ],
  },
  it: {
    landing: {
      title: 'GlitchSoul — GDR cyberpunk gratis nel browser, senza pay-to-win',
      desc: 'GlitchSoul è un GDR cyberpunk gratuito per browser e Android. Dungeon, 41 boss, arena PvP, cripta, gilde e guerre tra gilde. Zero pay-to-win: non vendiamo potenza né oggetti.',
      ogTitle: 'GlitchSoul — GDR cyberpunk gratis senza pay-to-win',
      ogDesc: 'Dungeon, 41 boss, arena PvP, cripta e gilde. Un GDR gratuito per browser e Android in cui non si può comprare un vantaggio.',
    },
    download: {
      title: 'Scarica GlitchSoul per Android — app GDR gratuita (APK)',
      desc: 'Scarica GlitchSoul gratis per Android. Lo stesso gioco del browser, lo stesso account e gli stessi progressi, più le notifiche delle missioni. Istruzioni passo passo per installare l’APK.',
      ogTitle: 'Scarica GlitchSoul per Android (APK)',
      ogDesc: 'App GDR gratuita per Android. Stesso account e stessi progressi del browser, senza pubblicità.',
    },
    auth: {
      title: 'Accedi o crea un account — GlitchSoul',
      desc: 'Accedi o crea un account GlitchSoul gratuito. La registrazione richiede 30 secondi e i progressi vengono salvati nel cloud.',
      ogTitle: 'Accedi — GlitchSoul', ogDesc: 'Accedi o crea un account GlitchSoul gratuito.',
    },
    schemaDesc: 'GDR cyberpunk gratuito per browser, senza pay-to-win. Dungeon, 41 boss, arena PvP, cripta, gilde e guerre tra gilde.',
    genre: ['GDR', 'MMORPG', 'Gioco da browser', 'Cyberpunk'],
    noscript: {
      h1: 'GlitchSoul — GDR cyberpunk gratis nel browser',
      p1: 'GlitchSoul è un GDR cyberpunk gratuito a cui puoi giocare direttamente nel browser, su telefono e su computer, oppure tramite l’app per Android. Ripulisci dungeon in 20 località, sali una scala di 41 boss, combatti nell’arena PvP, scendi nella cripta e costruisci una gilda con altri giocatori.',
      h2: 'Niente pay-to-win',
      p2: 'Non vendiamo potenza: niente pacchetti di statistiche, niente oggetti leggendari a pagamento, niente salti di livello. Le gemme si guadagnano giocando. Un account gratuito ha esattamente le stesse possibilità di qualsiasi altro.',
      p3: 'Per giocare, attiva JavaScript nel browser.',
    },
    faq: [
      ['GlitchSoul è gratis?', 'Sì. Tutto il gioco — dungeon, boss, arena PvP, cripta, gilde e guerre tra gilde — è disponibile senza costi. Non c’è abbonamento né contenuto bloccato dietro un pagamento.'],
      ['Si può comprare un vantaggio con i soldi?', 'No. GlitchSoul non vende statistiche, oggetti o livelli. Le gemme, la valuta premium, si guadagnano giocando: accessi giornalieri, serie, passaggi di livello ed eventi. Un account gratuito ha esattamente le stesse possibilità di qualsiasi altro.'],
      ['Devo installare qualcosa?', 'No. Il gioco funziona nel browser, su telefono e su computer. Se preferisci un’app, puoi in più scaricare la versione Android (un file APK).'],
      ['Serve un account?', 'Sì, e richiede circa 30 secondi: basta un indirizzo email. Così i progressi restano nel cloud e puoi giocare sul telefono e sul computer con lo stesso personaggio.'],
      ['Posso giocare con gli amici?', 'Sì. Potete fondare una gilda insieme, affrontare in squadra il boss di gilda, fare operazioni di gruppo, dichiarare guerra ad altre gilde e sfidarvi in classifica e nell’arena PvP.'],
      ['Quanto tempo serve al giorno?', 'Quanto vuoi. I limiti giornalieri di dungeon, cripte e missioni fanno sì che quindici minuti al giorno bastino ampiamente per restare al passo.'],
      ['In quali lingue è disponibile?', 'GlitchSoul è disponibile in italiano, inglese, polacco, tedesco, spagnolo, francese e portoghese.'],
    ],
  },
  pt: {
    landing: {
      title: 'GlitchSoul — RPG cyberpunk grátis no navegador, sem pay-to-win',
      desc: 'GlitchSoul é um RPG cyberpunk gratuito para navegador e Android. Masmorras, 41 chefes, arena PvP, cripta, guildas e guerras de guilda. Zero pay-to-win: não vendemos poder nem itens.',
      ogTitle: 'GlitchSoul — RPG cyberpunk grátis sem pay-to-win',
      ogDesc: 'Masmorras, 41 chefes, arena PvP, cripta e guildas. Um RPG gratuito de navegador e Android em que não dá para comprar vantagem.',
    },
    download: {
      title: 'Baixe o GlitchSoul para Android — app de RPG grátis (APK)',
      desc: 'Baixe o GlitchSoul de graça para Android. O mesmo jogo do navegador, a mesma conta e o mesmo progresso, além de avisos de missões. Instruções passo a passo para instalar o APK.',
      ogTitle: 'Baixe o GlitchSoul para Android (APK)',
      ogDesc: 'App de RPG gratuito para Android. Mesma conta e mesmo progresso do navegador, sem anúncios.',
    },
    auth: {
      title: 'Entre ou crie uma conta — GlitchSoul',
      desc: 'Entre ou crie uma conta gratuita no GlitchSoul. O cadastro leva 30 segundos e seu progresso fica salvo na nuvem.',
      ogTitle: 'Entrar — GlitchSoul', ogDesc: 'Entre ou crie uma conta gratuita no GlitchSoul.',
    },
    schemaDesc: 'RPG cyberpunk gratuito no navegador, sem pay-to-win. Masmorras, 41 chefes, arena PvP, cripta, guildas e guerras de guilda.',
    genre: ['RPG', 'MMORPG', 'Jogo de navegador', 'Cyberpunk'],
    noscript: {
      h1: 'GlitchSoul — RPG cyberpunk grátis no navegador',
      p1: 'O GlitchSoul é um RPG cyberpunk gratuito que você joga direto no navegador, no celular e no computador, ou pelo aplicativo Android. Limpe masmorras em 20 locais, suba uma escada de 41 chefes, lute na arena PvP, desça à cripta e monte uma guilda com outros jogadores.',
      h2: 'Sem pay-to-win',
      p2: 'Não vendemos poder: não há pacotes de atributos, nem itens lendários por dinheiro, nem atalhos de nível. As gemas são conquistadas jogando. Uma conta gratuita tem exatamente as mesmas opções de qualquer outra.',
      p3: 'Para jogar, ative o JavaScript no seu navegador.',
    },
    faq: [
      ['O GlitchSoul é grátis?', 'Sim. O jogo inteiro — masmorras, chefes, arena PvP, cripta, guildas e guerras de guilda — está disponível sem custo. Não há assinatura nem conteúdo travado atrás de pagamento.'],
      ['Dá para comprar vantagem com dinheiro?', 'Não. O GlitchSoul não vende atributos, itens ou níveis. As gemas, a moeda premium, são conquistadas jogando: logins diários, sequências, subidas de nível e eventos. Uma conta gratuita tem exatamente as mesmas opções de qualquer outra.'],
      ['Preciso instalar alguma coisa?', 'Não. O jogo roda no navegador, no celular e no computador. Se preferir um aplicativo, você pode ainda baixar a versão para Android (um arquivo APK).'],
      ['Preciso de uma conta?', 'Sim, e leva cerca de 30 segundos: só um e-mail. Assim seu progresso fica na nuvem e você joga no celular e no computador com o mesmo personagem.'],
      ['Posso jogar com amigos?', 'Sim. Vocês podem criar uma guilda juntos, enfrentar o chefe de guilda em equipe, fazer operações em grupo, declarar guerra a outras guildas e competir no ranking e na arena PvP.'],
      ['Quanto tempo é preciso por dia?', 'O quanto você quiser. Os limites diários de masmorras, criptas e missões fazem com que quinze minutos por dia já bastem para não ficar para trás.'],
      ['Em quais idiomas está disponível?', 'O GlitchSoul está disponível em português, inglês, polonês, alemão, espanhol, francês e italiano.'],
    ],
  },
};

const PAGES = [
  { page: 'landing',  faq: true,  indexable: true,  priority: '1.0', changefreq: 'weekly' },
  { page: 'download', faq: false, indexable: true,  priority: '0.7', changefreq: 'monthly' },
  { page: 'auth',     faq: false, indexable: false },
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const gameSchema = lang => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'GlitchSoul',
  url: ORIGIN + urlFor(lang, 'landing'),
  image: ORIGIN + '/og-image.webp',
  description: META[lang].schemaDesc,
  inLanguage: LANGS,
  genre: META[lang].genre,
  gamePlatform: ['Web browser', 'Android'],
  playMode: ['SinglePlayer', 'MultiPlayer'],
  applicationCategory: 'Game',
  operatingSystem: 'Web, Android',
  offers: { '@type': 'Offer', price: '0', priceCurrency: CURRENCY[lang], availability: 'https://schema.org/InStock' },
}, null, 2);

const faqSchema = entries => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entries.map(([q, a]) => ({
    '@type': 'Question', name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}, null, 2);

function render(lang, spec) {
  const m = META[lang][spec.page];
  const canonical = ORIGIN + urlFor(lang, spec.page);
  const ns = META[lang].noscript;
  const alternates = LANGS
    .map(l => `    <link rel="alternate" hreflang="${l}" href="${ORIGIN}${urlFor(l, spec.page)}" />`)
    .join('\n');

  return `<!doctype html>
<html lang="${lang}" translate="no">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <!-- Block Google Translate — it rewrites React-managed text nodes into <font> tags,
         causing removeChild crashes for players with auto-translate enabled -->
    <meta name="google" content="notranslate" />

    <title>${esc(m.title)}</title>
    <meta name="description" content="${esc(m.desc)}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="${spec.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />
    <meta name="theme-color" content="#0a0a0f" />
    <meta name="apple-mobile-web-app-title" content="GlitchSoul" />

    <!-- Language alternates -->
${alternates}
    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${urlFor('en', spec.page)}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="GlitchSoul" />
    <meta property="og:locale" content="${LOCALE[lang]}" />
${LANGS.filter(l => l !== lang).map(l => `    <meta property="og:locale:alternate" content="${LOCALE[l]}" />`).join('\n')}
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${esc(m.ogTitle)}" />
    <meta property="og:description" content="${esc(m.ogDesc)}" />
    <meta property="og:image" content="${ORIGIN}/og-image.webp" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="GlitchSoul" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(m.ogTitle)}" />
    <meta name="twitter:description" content="${esc(m.ogDesc)}" />
    <meta name="twitter:image" content="${ORIGIN}/og-image.webp" />

    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">

    <!-- Structured data: the game itself -->
    <script type="application/ld+json">
${gameSchema(lang)}
    </script>${spec.faq ? `

    <!-- Structured data: FAQ (mirrors the on-page FAQ section) -->
    <script type="application/ld+json">
${faqSchema(META[lang].faq)}
    </script>` : ''}
  </head>
  <body>
    <div id="root"></div>
    <div id="modal-root"></div>
    <noscript>
      <h1>${esc(ns.h1)}</h1>
      <p>${esc(ns.p1)}</p>
      <h2>${esc(ns.h2)}</h2>
      <p>${esc(ns.p2)}</p>
      <p>${esc(ns.p3)}</p>
    </noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

// ── Write pages ──
const written = [];
for (const spec of PAGES) {
  for (const lang of LANGS) {
    const out = resolve(ROOT, fileFor(lang, spec.page));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, render(lang, spec));
    written.push(fileFor(lang, spec.page));
  }
}

// ── Sitemap ──
// Only indexable pages are listed (a noindex URL in a sitemap is reported as an
// error in Search Console), and every <loc> matches its page's canonical exactly
// — including the trailing slash — so Google is not handed two variants of a URL.
const lastmod = new Date().toISOString().slice(0, 10);
const entries = PAGES.filter(p => p.indexable).flatMap(spec =>
  LANGS.map(lang => {
    const alts = LANGS
      .map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${urlFor(l, spec.page)}" />`)
      .join('\n');
    return `  <url>
    <loc>${ORIGIN}${urlFor(lang, spec.page)}</loc>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${urlFor('en', spec.page)}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>${spec.changefreq}</changefreq>
    <priority>${spec.priority}</priority>
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

console.log(`Generated ${written.length} files:\n  ` + written.join('\n  '));
