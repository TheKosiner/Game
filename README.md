# GlitchSoul - Mobile RPG Game

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)]()
[![React](https://img.shields.io/badge/React-19-61dafb)]()
[![Firebase](https://img.shields.io/badge/Firebase-12-orange)]()
[![Capacitor](https://img.shields.io/badge/Capacitor-8-green)]()

Mobilna gra RPG w stylu pixel-art z systemem progresji, walkami, zadaniami i elementami społecznościowymi. Dostępna jako aplikacja webowa i natywna Android (Capacitor).

## 🎮 Funkcje

- **System postaci** - Customizacja wyglądu (ton skóry, kolor włosów, ubrania, portret), leveling, statystyki
- **Lochy** - 15 lochów z rosnącą trudnością (poziomy 1–100), tryby XP/Balanced/Loot, trudności Easy/Normal/Hard, skrzynki na poziomie lochów
- **Zadania** - 10 zadań w czasie rzeczywistym, 3 warianty (XP/Balanced/Loot), przyspieszenie gemami
- **PvP Arena** - Walki z innymi graczami, ranking Top 50
- **Gildie** - Operacje gildyjne, gildia boss, chat gildyjny, terytoria
- **Skrzynki i ekwipunek** - 5 poziomów rzadkości, smithing (ulepszanie), system porównywania przedmiotów
- **Sklep** - Dynamiczny sklep z odświeżaniem, sklep gemów ze Stripe
- **Kasyno** - System ruletki z historią 10 ostatnich losowań graczy w czasie rzeczywistym
- **Challenge** - Walki z bossami challenge
- **System zapisu** - Auto-save + synchronizacja z Firebase Firestore
- **Wielojęzyczność** - Pełna lokalizacja PL/EN
- **Powiadomienia** - Web i natywne (Capacitor Local Notifications)

## 🚀 Szybki Start

### Wymagania
- Node.js 18+
- npm

### Instalacja

```bash
git clone <repo-url>
cd Game
npm install
npm run dev
```

Gra będzie dostępna pod `http://localhost:5173`

### Konfiguracja Firebase

1. Stwórz projekt w [Firebase Console](https://console.firebase.google.com)
2. Skopiuj `.env.example` do `.env` i wypełnij dane Firebase
3. Deploy security rules:

```bash
firebase deploy --only firestore:rules
```

4. Deploy Cloud Functions:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 🏗️ Architektura

### Store'y (Zustand)
```
src/store/
├── gameStore.ts    # Główny store — bohater, lochy, walki, ekwipunek, zadania, gildie
├── authStore.ts    # Autentykacja Firebase
└── langStore.ts    # Język (PL/EN)
```

### Komponenty
```
src/components/
├── HeroCard.tsx           # Panel postaci, statystyki, żebranie
├── DungeonPanel.tsx       # Walki i lochy
├── QuestPanel.tsx         # System zadań
├── PvpPanel.tsx           # Arena PvP
├── GuildPanel.tsx         # Panel gildii
├── GuildOperationPanel.tsx# Operacje gildyjne
├── GuildBossPanel.tsx     # Guild boss
├── CasinoPanel.tsx        # Kasyno z live feedem
├── ShopPanel.tsx          # Sklep
├── SmithPanel.tsx         # Ulepszanie przedmiotów
├── InventoryPanel.tsx     # Ekwipunek
├── GemsPanel.tsx          # Sklep gemów (Stripe)
├── LeaderboardPanel.tsx   # Ranking
├── ChallengePanel.tsx     # Challenge bossy
├── MysteryBoxModal.tsx    # Animowane otwieranie skrzynek
└── ...
```

### Biblioteki i serwisy
```
src/lib/
├── cloudSync.ts    # Synchronizacja z Firestore, Cloud Functions
├── firebase.ts     # Konfiguracja Firebase
├── serverActions.ts# Wywołania Cloud Functions
├── notifications.ts# Powiadomienia web/natywne
└── gemShop.ts      # Integracja Stripe
```

### Custom Hooki
```
src/hooks/
├── useT.ts                # i18n tłumaczenia
├── useTimer.ts            # Timer z formatowaniem
├── useInterval.ts         # Reużywalny interval
├── useNow.ts              # Aktualny timestamp
├── useDebounce.ts
├── useDebounceCallback.ts
└── useThrottle.ts
```

## 🔒 Bezpieczeństwo

### Firebase Security Rules
- Walidacja właściciela (tylko owner może edytować swoje dane)
- Anti-cheat: walidacja poziomu, złota, questów (CEL expressions)
- Guild permissions
- Firestore rules dla `casinoSpins`, `guilds`, `saves`, `users`

### Cloud Functions (10 funkcji)
- **collectQuestServer** — weryfikacja server-side ukończenia questów
- **collectBeggingServer** — weryfikacja żebrania
- **performPvp** — PvP server-side
- **spinRoulette** — logika ruletki
- **createCheckoutSession / stripeWebhook / claimGemCredits** — płatności Stripe
- **claimDailyReward** — dzienna nagroda
- **resetAllDailyLimits** — reset limitów dziennych (cron)
- **validatePlayerUpdate** — detekcja cheaterów (Firestore trigger)

## 📦 Build & Deploy

```bash
# Web
npm run build

# Android (wymaga Android Studio)
npm run android

# Sync Capacitor
npm run cap:sync

# Deploy Firebase
firebase deploy
```

## 🛠️ Technologie

### Frontend
- **React 19** — UI framework
- **TypeScript 6** — Type safety
- **Zustand 5** — State management
- **Tailwind CSS 4** — Styling
- **Vite 8** — Build tool
- **React Router 7** — Routing
- **Capacitor 8** — Natywny Android

### Backend
- **Firebase 12**
  - Firestore — baza danych w czasie rzeczywistym
  - Authentication — logowanie
  - Cloud Functions — logika serwera (10 funkcji)
  - Hosting — hosting statyczny
- **Stripe** — płatności (gemy)

## 📊 Statystyki Projektu

- **Linie kodu:** ~22 000
- **Komponenty:** 34
- **Store'y:** 3 (gameStore, authStore, langStore)
- **Lochy:** 15
- **Zadania:** 10
- **Cloud Functions:** 10
- **Custom hooki:** 7

## 🤝 Contributing

1. Fork projektu
2. Stwórz branch (`git checkout -b feature/AmazingFeature`)
3. Commit zmian (`git commit -m 'Add AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 👥 Autorzy

- **TheKosiner** - Lead developer

---

**Zbudowane z ❤️ używając React + TypeScript + Firebase + Capacitor**
