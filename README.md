# Realm of Valor - Mobile RPG Game

[![Tests](https://img.shields.io/badge/tests-34%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]()
[![React](https://img.shields.io/badge/React-19-61dafb)]()
[![Firebase](https://img.shields.io/badge/Firebase-12-orange)]()

Mobilna gra RPG w stylu pixel-art z systemem progresji, walkami, zadaniami i elementami społecznościowymi.

## 🎮 Funkcje

- **System postaci** - 3 klasy (Wojownik, Mag, Łotrzyk)
- **Lochy** - 4 lochy z rosnącą trudnością, system pięter
- **Zadania** - 8 zadań w czasie rzeczywistym
- **PvP Arena** - Walki z innymi graczami, ranking Top 50
- **Gildie i terytoria** - Kooperacyjne oblężenia
- **Ekwipunek** - 6 slotów, 5 poziomów rzadkości
- **Sklep** - Dynamiczny sklep z odświeżaniem
- **System zapisu** - Auto-save + synchronizacja z chmurą

## 🚀 Szybki Start

### Wymagania
- Node.js 18+
- npm lub yarn
- Firebase account (opcjonalnie)

### Instalacja

```bash
# Klonuj repozytorium
git clone <repo-url>
cd Game

# Zainstaluj zależności
npm install

# Uruchom dev server
npm run dev
```

Gra będzie dostępna pod `http://localhost:5173`

### Konfiguracja Firebase (opcjonalnie)

1. Stwórz projekt w [Firebase Console](https://console.firebase.google.com)
2. Skopiuj `.env.example` do `.env`
3. Wypełnij dane Firebase w `.env`
4. Deploy security rules:

```bash
firebase deploy --only firestore:rules
```

5. Deploy Cloud Functions:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 🧪 Testowanie

```bash
# Uruchom testy
npm test

# Testy z UI
npm run test:ui

# Coverage report
npm run test:coverage
```

**Aktualny coverage:** 34 testy, wszystkie przechodzą ✅

## 🏗️ Architektura

### Store'y (Zustand)
```
src/store/
├── heroStore.ts       # Bohater, leveling, atrybuty
├── inventoryStore.ts  # Ekwipunek i przedmioty
├── combatStore.ts     # Walki i lochy
├── questStore.ts      # System zadań
├── shopStore.ts       # Sklep
├── pvpStore.ts        # PvP i ranking
└── saveManager.ts     # Zapis/odczyt
```

### Custom Hooki
```
src/hooks/
├── useTimer.ts           # Timer z formatowaniem
├── useInterval.ts        # Reużywalny interval
├── useNow.ts            # Aktualny timestamp
├── useDebounce.ts       # Debounce wartości
├── useDebounceCallback.ts # Debounce funkcji
└── useThrottle.ts       # Throttle funkcji
```

### Utilities
```
src/utils/
├── constants.ts  # Wszystkie stałe gry
├── helpers.ts    # Helper functions
└── combat.ts     # Kalkulacje walki
```

## 🔒 Bezpieczeństwo

### Firebase Security Rules
- Walidacja poziomu (max +5 na update)
- Walidacja złota (max +10,000 na update)
- Tylko owner może edytować swoje dane
- Guild permissions

### Cloud Functions
- **performPvp** - Server-side PvP validation
- **validatePlayerUpdate** - Anti-cheat detection
- Automatyczne rollback przy podejrzanych zmianach

## 📦 Build & Deploy

### Production Build
```bash
npm run build
```

Build znajduje się w `dist/`

### Deploy do Firebase Hosting
```bash
firebase deploy --only hosting
```

### Deploy wszystkiego
```bash
firebase deploy
```

## 🛠️ Technologie

### Frontend
- **React 19** - UI framework
- **TypeScript 6** - Type safety
- **Zustand 5** - State management
- **Tailwind CSS 4** - Styling
- **Vite 8** - Build tool
- **React Router 7** - Routing

### Backend
- **Firebase 12** - Backend as a Service
  - Firestore - Database
  - Authentication - User auth
  - Cloud Functions - Server logic
  - Hosting - Static hosting

### Testing
- **Vitest 4** - Test runner
- **@testing-library/react** - Component testing
- **jsdom** - DOM simulation

## 📊 Statystyki Projektu

- **Linie kodu:** ~5,000
- **Komponenty:** 15
- **Store'y:** 7
- **Testy:** 34
- **Custom hooki:** 6
- **Cloud Functions:** 2

## 🔄 Ostatnia Refaktoryzacja (2026-05-08)

### Co zostało poprawione:
1. ✅ Podział monolitycznego store na 7 modułów
2. ✅ Dodanie 34 testów jednostkowych
3. ✅ Implementacja Error Boundary
4. ✅ Firebase Security Rules + Cloud Functions
5. ✅ Custom hooki dla reużywalnej logiki
6. ✅ Debounced save system
7. ✅ TypeScript improvements (usunięto 'any')
8. ✅ Helper functions i constants

### Dokumentacja:
- `REFACTORING.md` - Szczegóły refaktoryzacji
- `MIGRATION.md` - Przewodnik migracji
- `SUMMARY.md` - Podsumowanie zmian

## 🎯 Roadmap

### Planowane funkcje:
- [ ] Crafting system
- [ ] Achievements
- [ ] Daily rewards
- [ ] Guild chat
- [ ] Boss raids
- [ ] Trading system
- [ ] Mobile app (React Native)

### Techniczne:
- [ ] Zastąpienie inline styles Tailwind classes
- [ ] Więcej testów (komponenty React)
- [ ] Performance monitoring
- [ ] Analytics integration
- [ ] PWA support
- [ ] Offline mode

## 🤝 Contributing

1. Fork projektu
2. Stwórz branch (`git checkout -b feature/AmazingFeature`)
3. Commit zmian (`git commit -m 'Add AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

### Coding Standards
- TypeScript strict mode
- ESLint + Prettier
- Testy dla nowych funkcji
- Dokumentacja dla API

## 📝 Licencja

MIT License - zobacz `LICENSE` dla szczegółów

## 👥 Autorzy

- **TheKosiner** - Initial work

## 🙏 Podziękowania

- React team za świetny framework
- Firebase za backend infrastructure
- Tailwind CSS za styling system
- Zustand za prosty state management

---

**Zbudowane z ❤️ używając React + TypeScript + Firebase**
