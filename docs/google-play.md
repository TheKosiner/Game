# Publikacja w Google Play — instrukcja

Wersja na Google Play to osobna edycja aplikacji (`VITE_DISTRIBUTION=play`):

| | Strona WWW | APK z GitHuba | Google Play |
|---|---|---|---|
| Zakup gemów | Stripe | Stripe | **Google Play Billing** |
| Aktualizacje | — | wymuszone z GitHub Releases | **przez Sklep Play** |

Gemy kupione na stronie (Stripe) trafiają na konto także w wersji z Play — to
dozwolone, dopóki aplikacja z Play nie odsyła do zakupów poza Sklepem.

## Jak działa płatność

1. Gracz kupuje pakiet w Google Play. Zakup jest przypisany do konta gry
   (`obfuscatedAccountId` = SHA-256 z UID), więc nikt inny nie może go odebrać.
2. Aplikacja wysyła token zakupu do Cloud Function `verifyPlayPurchase`.
3. Funkcja sprawdza zakup w Google Play Developer API i dopisuje gemy do zapisu
   gracza — **jeden raz na token** (kolekcja `playPurchases`).
4. Dopiero wtedy aplikacja „konsumuje” zakup, żeby pakiet dało się kupić ponownie.
5. Zakup przerwany po drodze (zamknięta aplikacja, brak sieci, płatność
   oczekująca) zostaje dokończony przy następnym uruchomieniu. Google zwraca
   pieniądze za zakupy niepotwierdzone w ciągu 3 dni.
6. Zwroty i chargebacki: funkcja `revokeVoidedPlayPurchases` raz dziennie
   odbiera gemy z anulowanych zakupów (nie schodzi poniżej zera).

## Krok po kroku

### 1. Konto i aplikacja w Play Console
- Załóż konto dewelopera: <https://play.google.com/console> (jednorazowo 25 USD,
  weryfikacja tożsamości).
- Utwórz aplikację. Nazwa pakietu musi być **`com.glitchsoul.game`**.
- Konto osobiste (nie firmowe) musi przed publikacją produkcyjną przejść
  **zamknięte testy: min. 12 testerów przez 14 dni**.

### 2. Klucz podpisu — ważne dla obecnych graczy z APK
Przy pierwszym wydaniu Play pyta o klucz podpisywania aplikacji (Play App Signing).
- **Zalecane:** wybierz użycie **własnego, istniejącego klucza** (eksport narzędziem
  PEPK, które podaje Play Console) — tego samego keystore'a, którym CI podpisuje
  APK (sekret `ANDROID_KEYSTORE_BASE64`). Wtedy gracze z APK z GitHuba dostaną
  wersję ze Sklepu jako zwykłą aktualizację, bez utraty danych.
- Jeśli zostawisz klucz wygenerowany przez Google, dla Androida będą to dwie różne
  aplikacje: gracze z APK muszą go odinstalować, zanim zainstalują wersję z Play
  (postęp jest w chmurze, więc nic nie tracą po zalogowaniu).
- Kluczem przesyłania (upload key) jest ten sam keystore — workflow podpisuje nim AAB.

### 3. Pierwszy build
- GitHub → Actions → **Build for Google Play** → *Run workflow*.
- Po zakończeniu pobierz artefakt `GlitchSoul-play-<versionCode>.aab`.
- Play Console → *Testowanie* → *Testy wewnętrzne* → *Utwórz wersję* → wgraj AAB.
  (Produkty w aplikacji da się utworzyć dopiero po wgraniu builda z biblioteką
  płatności — dlatego ta kolejność.)

### 4. Produkty (pakiety gemów)
Play Console → *Zarabianie* → *Produkty* → *Produkty w aplikacji* → utwórz trzy
produkty jednorazowe (konsumowalne) z **dokładnie tymi identyfikatorami**:

| ID produktu | Gemy | Cena (jak na stronie) |
|---|---|---|
| `gems_100` | 100 | 0,99 USD |
| `gems_550` | 550 | 4,99 USD |
| `gems_1200` | 1200 | 9,99 USD |

Ceny lokalne Play przelicza sam; aplikacja pokazuje cenę z Play. Każdy produkt
trzeba **aktywować**. Identyfikatory są zapisane w
`functions/src/playBillingLogic.ts` i `src/lib/playBilling.ts` — zmiana wymaga
zmiany w obu miejscach.

### 5. Dostęp Cloud Functions do Google Play API
Funkcje sprawdzają zakupy jako konto usługi projektu Firebase.
1. Google Cloud Console projektu **realm-of-valor** → *APIs & Services* → włącz
   **Google Play Android Developer API**.
2. Play Console → *Użytkownicy i uprawnienia* → *Zaproś nowych użytkowników* →
   e-mail: **`realm-of-valor@appspot.gserviceaccount.com`** (domyślne konto usługi
   funkcji 1. generacji) → uprawnienia do aplikacji GlitchSoul:
   - *Wyświetlanie danych finansowych, zamówień i odpowiedzi z ankiet anulowania*
   - *Zarządzanie zamówieniami i subskrypcjami*
3. Uprawnienia potrafią zacząć działać dopiero po kilku godzinach (do ~24 h).
   Do tego czasu weryfikacja zwraca błąd, zakup zostaje niedokończony i aplikacja
   dokończy go przy kolejnym uruchomieniu.

### 6. Testy zakupów
- Play Console → *Ustawienia* → *Testowanie licencji* → dodaj konta Google testerów.
  Ich zakupy są testowe (bez obciążenia karty); w `playPurchases` mają `test: true`.
- Testerzy instalują aplikację z linku testów wewnętrznych.

### 7. Wymagania Sklepu przed publikacją
- **Polityka prywatności** — publiczny URL (wymagany). Gra zbiera: e-mail (konto),
  nazwę gracza, postęp gry, wiadomości czatu i poczty, historię zakupów, logi
  błędów (komunikat, ślad stosu, user agent).
- **Usuwanie konta** — w aplikacji jest (*Bohater → Konto → Usuń konto*). Play
  wymaga też adresu WWW z instrukcją usunięcia konta.
- **Bezpieczeństwo danych** (Data safety) — jak wyżej; dane szyfrowane w
  transmisji (HTTPS); użytkownik może usunąć konto i dane.
- **Ocena treści (IARC)** — zaznacz *symulowany hazard* (ruletka za złoto z gry,
  bez wygranych o realnej wartości). Gemy kupuje się za prawdziwe pieniądze, ale
  nie da się za nie kupić losowych nagród, więc obowiązek ujawniania szans
  „loot boxów” tu nie dotyczy.
- **Grupa docelowa** — nie kieruj gry do dzieci (czat z innymi graczami, kasyno).
