# GlitchSoul - Mobile RPG Game

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)]()
[![React](https://img.shields.io/badge/React-19-61dafb)]()
[![Firebase](https://img.shields.io/badge/Firebase-12-orange)]()
[![Capacitor](https://img.shields.io/badge/Capacitor-8-green)]()

Mobilna gra RPG w stylu pixel-art z systemem progresji, walkami, zadaniami i elementami społecznościowymi. Dostępna jako aplikacja webowa i natywna Android (Capacitor).

## 🎮 Funkcje

- **System postaci** - Customizacja wyglądu (ton skóry, kolor włosów, ubrania, portret), leveling, statystyki
- **Operacje** - 15 operacji z rosnącą trudnością (poziomy 1–100), tryby XP/Balanced/Loot, trudności Easy/Normal/Hard, skrzynki na poziomie operacji
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
├── gameStore.ts    # Główny store — bohater, operacje, walki, ekwipunek, zadania, gildie
├── authStore.ts    # Autentykacja Firebase
└── langStore.ts    # Język (PL/EN)
```

### Komponenty
```
src/components/
├── HeroCard.tsx           # Panel postaci, statystyki, żebranie
├── DungeonPanel.tsx       # Walki i operacje
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
- **Operacje:** 15
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

---

# 📊 Mechaniki Gry — Pełna Dokumentacja

> Wszystkie szanse, procenty, formuły i wartości bezpośrednio z kodu źródłowego.

---

## ⚒️ Kowal — System Ulepszania

### Koszty ulepszenia
Koszt = `item.level × KOSZT_NA_POZIOM[aktualny_poziom]`

| Poziom ulepszenia | Mnożnik kosztu | Przykład (broń Lv.20) |
|:-----------------:|:--------------:|:---------------------:|
| +0 → +1 | ×20 | 400 🪙 |
| +1 → +2 | ×50 | 1 000 🪙 |
| +2 → +3 | ×100 | 2 000 🪙 |
| +3 → +4 | ×200 | 4 000 🪙 |
| +4 → +5 | ×400 | 8 000 🪙 |
| +5 → +6 | ×800 | 16 000 🪙 |
| +6 → +7 | ×1 500 | 30 000 🪙 |
| +7 → +8 | ×2 500 | 50 000 🪙 |
| +8 → +9 | ×4 000 | 80 000 🪙 |

### Szanse sukcesu i porażki

| Poziom | Szansa sukcesu | Przy porażce |
|:------:|:--------------:|:------------:|
| +0 → +1 | **90%** | spada do +0 |
| +1 → +2 | **80%** | spada do +0 |
| +2 → +3 | **70%** | spada do +1 |
| +3 → +4 | **60%** | spada do +2 |
| +4 → +5 | **50%** | spada do +3 |
| +5 → +6 | **40%** | spada do +4 |
| +6 → +7 | **30%** | spada do +5 |
| +7 → +8 | **20%** | spada do +6 |
| +8 → +9 | **10%** | spada do +7 |

> Przy porażce poziom spada o 1 (minimum +0).

### Bonus z ulepszenia
Bonus = `round(bazowy_bonus × poziom_ulepszenia / 9)`

Przy **+9** bonus równa się dokładnie **pełnemu bazowemu bonusowi przedmiotu**.

| Typ przedmiotu | Co rośnie | Przy +9 |
|----------------|-----------|---------|
| Broń | attackBonus | +100% bazowego ATK bonusu |
| Zbroja / Hełm / Buty | defenseBonus | +100% bazowego DEF bonusu |
| Pierścień / Amulet | dominująca statystyka | +100% bazowego bonusu statystyki |

**Przykład:** broń z `attackBonus = 200` na **+9** daje **+200** dodatkowego ATK (łącznie 400).

Skalowanie liniowe:
| +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 11% | 22% | 33% | 44% | 56% | 67% | 78% | 89% | 100% |

---

## 🔮 Zaklinacz — Reroll Statystyk

### Koszt rerollu
Formuła: `max(33, item.level² × MNOŻNIK[rzadkość])`

| Rzadkość | Mnożnik | Koszt (Lv.10) | Koszt (Lv.20) | Koszt (Lv.30) |
|----------|:-------:|:-------------:|:-------------:|:-------------:|
| Common | ×3 | 300 🪙 | 1 200 🪙 | 2 700 🪙 |
| Uncommon | ×10 | 1 000 🪙 | 4 000 🪙 | 9 000 🪙 |
| Rare | ×33 | 3 300 🪙 | 13 200 🪙 | 29 700 🪙 |
| Epic | ×100 | 10 000 🪙 | 40 000 🪙 | 90 000 🪙 |
| Legendary | ×233 | 23 300 🪙 | 93 200 🪙 | 209 700 🪙 |

> Minimum zawsze 33 🪙.

### Co reroll zmienia / nie zmienia
- ✅ **Zmienia:** bonusy statystyk (STR, DEX, INT, VIT, MAG, ODP)
- ❌ **Nie zmienia:** attackBonus, defenseBonus, rzadkość, poziom przedmiotu

---

## ⚔️ Formuła Obrażeń

```
base  = atk² / (atk + max(1, def))
losowość = 0.7–1.3 (random)
dmg   = max(1, round(base × losowość × mnożnik_kryta))
```

### Krytyczne trafienie
- **Bohater:** `crit_szansa = min(40%, 5% + (DEX / (DEX + cap)) × 35%)`  
  cap = `30 + poziom_bohatera × 1,5`
- **Mnożnik krytu (operacje):** ×2,0
- **Wrogowie (operacje):** 5% szansy, mnożnik ×2,0
- **Wrogowie (bossowie operacji):** j.w.
- **Krypta — bohater:** 10% szansy, mnożnik ×1,8
- **Krypta — zwykły wróg:** 5% szansy, mnożnik ×2,0
- **Krypta — boss:** 7% szansy, mnożnik ×2,5

### Statystyki bohatera
| Atrybut | Wpływ |
|---------|-------|
| STR | Główna broń fizyczna (skaluje ATK) |
| DEX | Szansa na krytyke |
| INT | Broń dystansowa (skaluje ATK) |
| VIT | Max HP (+10 HP/pkt), DEF bazowe |
| MAG | Broń magiczna (skaluje ATK) |
| ODP (MR) | Odporność na obrażenia magiczne |

```
Max HP    = 80 + (VIT × 10) + (poziom × 8) + bonusy_z_ekwipunku
DEF bazowe = 2 + VIT + poziom
ATK bazowe = 5 + poziom × 2
```

Soft cap statystyk: `stat ≤ 100 → stat; stat > 100 → 100 + (stat - 100) × 0,5`

---

## 🏰 Operacje

### Limity dzienne
- **Maksimum:** 10 przebiegów/dzień
- **Piętra na operację:** 10

### Tryby nagrody

| Tryb | Mnożnik XP | Mnożnik złota |
|------|:----------:|:------------:|
| XP | ×1,8 | ×0,4 |
| Balanced | ×1,0 | ×1,0 |
| Loot | ×0,3 | ×0,3 |

### Poziom trudności

| Trudność | Siła wrogów | Nagrody | Bonus do loot |
|----------|:-----------:|:-------:|:-------------:|
| Easy | ×0,7 | ×0,7 | epic ×0,4, legendary ×0,15 |
| Normal | ×1,0 | ×1,0 | bez zmian |
| Hard | ×1,5 | ×1,6 | rare ×1,4, epic ×2,0, legendary ×3,0 |

### Formuła nagrody za wroga
```
lvlMult    = 1,02 ^ (poziom_bohatera - 1)
xp         = round(wróg.xpReward × tryb_xpMult × lvlMult × trudność_mult)
złoto      = round(wróg.goldReward × tryb_goldMult × lvlMult × trudność_mult)
```

XP i złoto trafiają do puli — wypłacane **wyłącznie po ukończeniu całej operacji**.  
Przy porażce: **cała pula przepada**.

---

## 🪦 Krypta

### Limity i struktura
- **Maksimum:** 5 przebiegów/dzień
- **Pokoje:** 10 + boss na końcu
- **Start:** pełne HP bohatera

### Podział pokoi
Każdy krok to losowanie:

```
60% walka z wrogiem
40% zdarzenie
```

Przy zdarzeniu:

| Zdarzenie | Szansa |
|-----------|:------:|
| 🎭 Mimik (walka w przebraniu skrzyni) | 8% |
| 💰 Skrzynia | 18% |
| 🏔️ Jezioro | 16% |
| 🕯️ Kaplica | 16% |
| 🤝 Kompan | 10% |
| 🪤 Pułapka | 12% |
| 🗿 Ołtarz | 12% |
| 📜 Inskrypcja | 8% |

### Zdarzenia — szczegóły

**💰 Skrzynia**
- 30% → pająk (walka!)
- 70% → skarb: `XP = (20–60) × (1 + lvl×0,05) × (1 + (głębokość-1)×0,15)`, złoto analogicznie

**🏔️ Jezioro**
- 50% → losowy **buff** z puli 5 buffów
- 50% → losowy **debuff** z puli 5 debuffów

**🕯️ Kaplica**
- Leczenie: **+22% maxHP**
- 30% szansy na dodatkowy buff: +15% DEF

**🤝 Kompan**
- +20% ATK przez całą pozostałą kryptę
- Po każdej wygranej walce: regeneracja **+8% maxHP**

**🪤 Pułapka**
- Opcja "ostrożnie": zawsze **-5% maxHP**
- Opcja "biegiem": 38% sukces (0 dmg), 62% porażka (**-12% do -20% maxHP**)

**🗿 Ołtarz**
- Poświęć **-20% maxHP** → zyskaj buff: **+30% ATK** (Pakt Krwi)
- (Niedostępne gdy HP ≤ 21% max)

**📜 Inskrypcja**
- 65% → buff: +25% DEF, +5% HP (Magiczna Osłona)
- 35% → losowy debuff

### Regeneracja między pokojami
```
Po każdym pokoju:   +8% maxHP
Przed bossem:       +8% maxHP + 30% maxHP (łącznie +38%)
```

### Statystyki wrogów (względem bohatera)
```
scale = 1 + (głębokość - 1) × 0,02   (od ×1,00 na głębokości 1 do ×1,18 na głębokości 10)
HP    = heroMaxHP × hpMult × scale
ATK   = heroATK   × atkMult × scale
DEF   = heroDEF   × defMult × scale
```

**Tier 1 (pokoje 1–2)**
| Wróg | HP | ATK | DEF |
|------|:--:|:---:|:---:|
| Cień Krwi | ×0,60 | ×0,14 | ×0,20 |
| Kościan | ×0,70 | ×0,12 | ×0,28 |
| Gnijący Szczur | ×0,50 | ×0,16 | ×0,10 |

**Tier 2 (pokoje 3–4)**
| Wróg | HP | ATK | DEF |
|------|:--:|:---:|:---:|
| Widmo | ×0,80 | ×0,18 | ×0,28 |
| Trupi Rycerz | ×0,90 | ×0,16 | ×0,38 |
| Nekromanta | ×0,80 | ×0,20 | ×0,20 |

**Tier 3 (pokoje 5–6)**
| Wróg | HP | ATK | DEF |
|------|:--:|:---:|:---:|
| Demon Otchłani | ×1,00 | ×0,21 | ×0,36 |
| Nieumarły Mag | ×0,90 | ×0,23 | ×0,28 |
| Strażnik Krypt | ×1,20 | ×0,19 | ×0,50 |

**Tier 4 (pokoje 7–8)**
| Wróg | HP | ATK | DEF |
|------|:--:|:---:|:---:|
| Upiór Plagi | ×1,20 | ×0,19 | ×0,40 |
| Kościana Bestia | ×1,40 | ×0,16 | ×0,55 |
| Arcylich | ×1,10 | ×0,21 | ×0,38 |

**Tier 5 (pokoje 9–10)**
| Wróg | HP | ATK | DEF |
|------|:--:|:---:|:---:|
| Wampir Starożytny | ×1,20 | ×0,20 | ×0,40 |
| Abominacja | ×1,40 | ×0,17 | ×0,52 |
| Mroczny Paladyn | ×1,10 | ×0,22 | ×0,48 |

**Specjalne**
| Wróg | HP | ATK | DEF |
|------|:--:|:---:|:---:|
| 🕷️ Jadowity Pająk (ze skrzyni) | ×0,40 | ×0,14 | ×0,10 |
| 🎭 Mimik Skrzyni | ×1,00 | ×0,22 | ×0,38 |
| ☠️ Lord Cienia (boss) | ×1,60 | ×0,26 | ×0,42 |

### Nagroda z bossa — rzadkość skrzynki

| Poziom bohatera | Legendary | Epic | Rare |
|:---------------:|:---------:|:----:|:----:|
| 25+ | 10% | 65% | 25% |
| 15–24 | 4% | 56% | 40% |
| 10–14 | 0% | 30% | 70% |
| <10 | 0% | 0% | 100% |

### Buffy i debuffy

**Buffy**
| Nazwa | ATK | DEF | HP |
|-------|:---:|:---:|:--:|
| ✨ Błogosławieństwo | +15% | +10% | +10% |
| ⚔️ Szał Bojowy | +30% | −15% | — |
| 🪨 Kamienna Skóra | −10% | +35% | +15% |
| 🌑 Mroczna Energia | +25% | −5% | +20% |
| ❄️ Lodowy Pancerz | −15% | +50% | +5% |

**Debuffy**
| Nazwa | ATK | DEF | HP |
|-------|:---:|:---:|:--:|
| 🩸 Przeklęta Krew | −20% | −20% | −15% |
| 💔 Osłabienie | −15% | −15% | — |
| 😨 Strach | −30% | −10% | — |
| 🔥 Płonąca Krew | +10% | −35% | −20% |
| 🦴 Kruche Kości | −25% | −40% | −10% |

---

## 📜 Zadania

**Limit dzienny:** 5 zadań/dzień

| Zadanie | Czas | XP | Złoto | Min. Lv |
|---------|:----:|:--:|:-----:|:-------:|
| Patrol Sektora | 60s | 70 | 50 | 1 |
| Odzysk Nano-Medów | 90s | 100 | 60 | 1 |
| Eskortowanie Konwoju | 2 min | 160 | 120 | 2 |
| Trop Gangu | 3 min | 280 | 220 | 4 |
| Eksploracja Serwerów | 5 min | 500 | 400 | 7 |
| Polowanie na Drony | 10 min | 1 000 | 800 | 10 |
| Zbuntowane AI | 15 min | 1 700 | 1 400 | 15 |
| Rdzeń Danych | 20 min | 2 400 | 2 100 | 20 |
| Infiltracja Megakorporacji | 30 min | 5 000 | 4 400 | 30 |
| Protokół Osobliwości | 45 min | 8 000 | 7 000 | 45 |

---

## 🛡️ Generowanie Przedmiotów

### Wagi rzadkości (bazowe)
| Rzadkość | Waga bazowa |
|----------|:-----------:|
| Common | 50 |
| Uncommon | 28 |
| Rare | 14 |
| Epic | 6 |
| Legendary | 2 |

### Modyfikatory trybu operacji
| Tryb | Common | Uncommon | Rare | Epic | Legendary |
|------|:------:|:--------:|:----:|:----:|:---------:|
| XP | — | — | ×0,6 | ×0,4 | ×0,3 |
| Balanced | — | — | — | — | — |
| Loot | ×0,4 | ×0,9 | ×2,2 | ×3,0 | ×4,0 |

### Modyfikatory trudności
| Trudność | Rare | Epic | Legendary |
|----------|:----:|:----:|:---------:|
| Easy | — | ×0,4 | ×0,15 |
| Normal | — | — | — |
| Hard | ×1,4 | ×2,0 | ×3,0 |

### "Rarity bump" — szansa na upgrade rzadkości
Po począkowym rzucie, dodatkowa szansa na podbicie o 1 poziom:
| Wylosowana rzadkość | Szansa na bump | Hard ×2 | Easy ×0,5 |
|--------------------|:--------------:|:-------:|:---------:|
| Common | 15% | 30% | 7,5% |
| Uncommon | 12% | 24% | 6% |
| Rare | 8% | 16% | 4% |
| Epic | 4% | 8% | 2% |
| Legendary | 0% | 0% | 0% |

### Formuły bonusów przedmiotów (skalowanie z poziomem)
Wszystkie mnożniki per rzadkość: Common ×1,0 / Uncommon ×1,4 / Rare ×1,9 / Epic ×2,6 / Legendary ×3,5  
Losowość: ×0,82–1,18

| Slot | Główny bonus | Formuła |
|------|-------------|---------|
| Broń | attackBonus | `(lvl × 1,6 + 3) × RARITY_MULT × losowość` |
| Zbroja | defenseBonus | `(lvl × 0,9 + 1) × RARITY_MULT × losowość` |
| Hełm | defenseBonus | `(lvl × 0,45 + 1) × RARITY_MULT × losowość` |
| Buty | defenseBonus | `(lvl × 0,35 + 1) × RARITY_MULT × losowość` |
| Broń/Zbroja | Stat główny | `lvl × 1,4 × RARITY_MULT × losowość` |
| Pierścień/Amulet | Stat główny | `lvl × 1,2 × RARITY_MULT × losowość` |

Liczba dodatkowych statystyk: Common 0–1 / Uncommon 1 / Rare 1–2 / Epic 2 / Legendary 2–3

### Wartość sprzedaży
```
cena = max(5, round(poziom × 14 × RARITY_GOLD[rzadkość]))

RARITY_GOLD: Common ×1 / Uncommon ×2 / Rare ×3,5 / Epic ×6 / Legendary ×11
```

---

## 🏪 Sklep

- **Odświeżanie:** co 60 minut (automatyczne)
- **Zawartość:** 6 normalnych + 1 wyróżniony (featured) slot + 1 medkit
- **Featured slot** — lepsze wagi rzadkości: Common 20 / Uncommon 30 / Rare 28 / Epic 15 / Legendary 4
- **Cena:** `round(item.goldValue × (1,2 + losowe(0–0,6)))`
- **Poziom przedmiotów:** heroLevel ±3

---

## ⚔️ PvP Arena

- **Cooldown:** 15 minut między walkami
- **Wygrana:** XP i złoto = `max(10, poziom_przeciwnika × 10)`, rating +25
- **Przegrana:** +4 XP, 0 złota, rating −15
- **Symulacja:** do 300 rund walki turowej

---

## 🎰 Kasyno (Ruletka)

- Koło 37 slotów (0–36)
- **Zakład na numer:** wypłata 35:1
- **Dziesiątki (1–12 / 13–24 / 25–36):** wypłata 2:1
- **Kolor / Parzyste-Nieparzyste / Niskie-Wysokie:** wypłata 1:1

---

## 💪 Challenge Bossy

**16 bossów** (poziomy 0–15), rosnąca trudność.

**Loot z bossa:**
```
szansa_legendary = (indeks_bossa / 15) × 65%
rzadkość = losowe < szansa_legendary ? legendary : epic
poziom_przedmiotu = max(1, heroLevel + random(0–4))
```

Przykłady:
| Boss | Lv | HP | ATK | DEF | XP | Złoto |
|------|:--:|:--:|:---:|:---:|:--:|:-----:|
| Cyber Gladiator | 18 | 220 | 38 | 12 | 1 500 | 900 |
| Neural Phantom | ~60 | ~2000 | ~180 | ~70 | ~15 000 | ~10 000 |
| Omega Unit ZERO | 130 | 14 000 | 580 | 225 | 80 000 | 55 000 |

**Cooldown:** 1 godzina między walkami.

---

## 🏰 Operacje Gildyjne

| Lokacja | Min Lv | Piętra | Wrogów/piętro | Rzadkość finalna | Cooldown |
|---------|:------:|:------:|:-------------:|:----------------:|:--------:|
| Cyber Labirynt | 5 | 4 | 8 | Rare | 4h |
| Zatopione Miasto | 15 | 5 | 10 | Epic | 6h |
| Orbitalna Twierdza | 25 | 5 | 10 | Epic | 8h |
| Nuklearny Bunkier | 35 | 6 | 12 | Legendary | 12h |
| Osobliwość | 50 | 7 | 15 | Legendary | 24h |

HP wrogów: `bazowe_HP × liczba_członków × (1 + (piętro-1) × 0,18)`

---

## 😴 Odpoczynek i Regeneracja

### Aktywny odpoczynek
```
leczenie_na_min = max(1, round(maxHP × 0,04))
łącznie = czas_min × leczenie_na_min  (do pełnego HP)
```

### Pasywna regeneracja (gdy nieaktywny)
```
zysk = floor(czas_ms × maxHP / 15 000 000)   (≈ 0,4% maxHP / minutę)
```

---

## 🙏 Żebranie

```
godziny = max(1, min(10, round(żądane_godziny)))
stawka  = 97 złotych/godzinę
mnożnik_lvl = 1,09 ^ (poziom - 1)
losowość = 0,80–1,20
nagroda = floor(godziny × 97 × mnożnik_lvl × losowość)
```

---

## 💎 Gemy — Koszty

| Akcja | Koszt |
|-------|:-----:|
| Natychmiastowe leczenie (pełne HP) | 30 💎 |
| Przyspieszenie zadania | `ceil(pozostały_czas / 30 min) × 5` 💎 |
| Przyspieszenie odpoczynku | `ceil(pozostały_czas / 15 min) × 5` 💎 |
| Odblokowanie portretu | 1 000 💎 |
| Dzienna nagroda | +5 💎/dzień |

---

## 📈 Krzywa XP

```
xpDoNastępnegoPoziom = floor(100 × poziom ^ 2,3)
```

| Poziom | XP do awansu |
|:------:|:------------:|
| 1 | 100 |
| 5 | 860 |
| 10 | 2 817 |
| 20 | 9 461 |
| 30 | 19 004 |
| 50 | 47 321 |

Za każdy awans: **+1 punkt atrybutu**, **+3 💎**

---

## 🔄 Dzienne Limity i Resety

| Aktywność | Limit |
|-----------|:-----:|
| Operacje | 10/dzień |
| Zadania | 5/dzień |
| Krypta | 5/dzień |

Reset o północy (strefa czasowa serwera).  
Przy resecie zerowane: przebiegi operacji, zadania, przebiegi krypty, złoto zarobione dziś.
