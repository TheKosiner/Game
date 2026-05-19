import type { Quest } from '../types';

export const RANDOM_QUEST_NAMES: string[] = [
  'Operacja Neon', 'Infiltracja Sektora', 'Przechwycenie Danych', 'Sabotaż Korporacji',
  'Ekstrakcja Agenta', 'Czarna Operacja', 'Eliminacja Celu', 'Misja Widmo',
  'Ghost Protocol', 'Przejęcie Konwoju', 'Ochrona Węzła', 'Zniszczenie Bazy',
  'Odzysk Protokołu', 'Atak Zero', 'Alarm Sektorowy', 'Polowanie na Agenta',
  'Przełamanie Firewall', 'Zamknięcie Węzła', 'Odcięcie Zasilania', 'Likwidacja Świadka',
  'Wykradanie Blueprintów', 'Deszyfrowanie Pliku', 'Zasadzka na Konwój', 'Czyszczenie Sektora',
  'Atak na Serwer', 'Misja Matrixa', 'Zlecenie Korporacji', 'Strzeżony Transport',
  'Wycieczka w Mrok', 'Operacja Widmo', 'Czerwony Alarm', 'Projekt Zero',
];

export const RANDOM_QUEST_NAMES_EN: string[] = [
  'Operation Neon', 'Sector Infiltration', 'Data Intercept', 'Corporate Sabotage',
  'Agent Extraction', 'Black Operation', 'Target Elimination', 'Ghost Mission',
  'Ghost Protocol', 'Convoy Takeover', 'Node Defense', 'Base Destruction',
  'Protocol Recovery', 'Zero Strike', 'Sector Alert', 'Agent Hunt',
  'Firewall Breach', 'Node Shutdown', 'Power Cutoff', 'Witness Elimination',
  'Blueprint Theft', 'File Decryption', 'Convoy Ambush', 'Sector Sweep',
  'Server Strike', 'Matrix Mission', 'Corporate Contract', 'Guarded Transport',
  'Descent Into Dark', 'Shadow Operation', 'Red Alert', 'Project Zero',
];

export const ALL_QUESTS: Quest[] = [
  { id: 'patrol',       name: 'Patrol Sektora',      nameEn: 'Sector Patrol',        description: 'Obejdź sektor i upewnij się, że jest bezpieczny.',               descEn: 'Sweep the sector and make sure it is secure.',                          durationMs: 60_000,    xpReward: 35,   goldReward: 25,   minLevel: 1,  emoji: '🏚️' },
  { id: 'herbs',        name: 'Odzysk Nanoleków',    nameEn: 'Nano-Med Recovery',    description: 'Zbierz nanoleki z porzuconych laboratoriów w okolicy.',           descEn: 'Collect nano-meds from abandoned labs in the area.',                    durationMs: 90_000,    xpReward: 50,   goldReward: 30,   minLevel: 1,  emoji: '💉' },
  { id: 'escort',       name: 'Eskorta Konwoju',     nameEn: 'Convoy Escort',        description: 'Eskortuj konwój danych do sąsiedniego węzła sieciowego.',         descEn: 'Escort the data convoy to the neighboring network node.',               durationMs: 120_000,   xpReward: 80,   goldReward: 60,   minLevel: 2,  emoji: '🚛' },
  { id: 'bandits',      name: 'Trop Gangu',          nameEn: 'Gang Trail',           description: 'Wytropisz kryjówkę gangu i zniszcz ich bazy danych.',             descEn: 'Track down the gang hideout and destroy their databases.',              durationMs: 180_000,   xpReward: 140,  goldReward: 110,  minLevel: 4,  emoji: '🗺️' },
  { id: 'ruins',        name: 'Eksploracja Serwera', nameEn: 'Server Exploration',   description: 'Zbadaj stary serwer korporacyjny i wydobądź cenne dane.',         descEn: 'Investigate an old corporate server and extract valuable data.',        durationMs: 300_000,   xpReward: 250,  goldReward: 200,  minLevel: 7,  emoji: '💻' },
  { id: 'monster_hunt', name: 'Polowanie na Drona',  nameEn: 'Drone Hunt',           description: 'Znajdź i zniszcz drona terroryzującego dzielnicę.',              descEn: 'Find and destroy the drone terrorizing the district.',                  durationMs: 600_000,   xpReward: 500,  goldReward: 400,  minLevel: 10, emoji: '🎯' },
  { id: 'necromancer',  name: 'Zbuntowane AI',       nameEn: 'Rogue AI',             description: 'Zneutralizuj zbuntowane AI i jego armię androidów.',              descEn: 'Neutralize the rogue AI and its android army.',                         durationMs: 900_000,   xpReward: 850,  goldReward: 700,  minLevel: 15, emoji: '👾' },
  { id: 'dragon_egg',   name: 'Rdzeń Danych',        nameEn: 'Data Core',            description: 'Odzyskaj skradziony rdzeń danych z siedziby korporacji.',        descEn: 'Retrieve the stolen data core from corporation headquarters.',          durationMs: 1_200_000, xpReward: 1200, goldReward: 1050, minLevel: 20, emoji: '💾' },
];
