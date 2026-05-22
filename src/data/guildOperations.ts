export interface GuildOpEnemy {
  name: string;
  emoji: string;
  hpMult: number;
}

export interface GuildOpLocation {
  id: string;
  name: string;
  emoji: string;
  description: string;
  floors: number;
  enemies: GuildOpEnemy[];
  enemiesPerFloor: number;
  baseHpPerMember: number;
  baseXpPerFloor: number;
  baseGoldPerFloor: number;
  finalRarity: 'rare' | 'epic' | 'legendary';
  cooldownMs: number;
}

export const GUILD_OP_LOCATIONS: GuildOpLocation[] = [
  {
    id: 'cyber_labyrinth',
    name: 'Cybernetyczny Labirynt',
    emoji: '🌐',
    description: 'Opuszczony labirynt przetwarzania AI. Błądzące programy i cyfrowe duchy strzegą tajemnicy rdzenia.',
    floors: 4,
    enemies: [
      { name: 'Strażnik Danych',   emoji: '🤖', hpMult: 1.0 },
      { name: 'Duch Sieci',        emoji: '👻', hpMult: 1.2 },
      { name: 'Fragmentator',      emoji: '💀', hpMult: 1.5 },
      { name: 'Rdzeń Neuronowy',   emoji: '🧠', hpMult: 2.0 },
    ],
    enemiesPerFloor: 5,
    baseHpPerMember: 40,
    baseXpPerFloor: 500,
    baseGoldPerFloor: 120,
    finalRarity: 'rare',
    cooldownMs: 4 * 60 * 60 * 1000,
  },
  {
    id: 'sunken_city',
    name: 'Zatopione Megamiasto',
    emoji: '🌊',
    description: 'Zalane sektory dawnej metropolii. Akwa-mechanizmy i głębinowe bestie kontrolują te ruiny podwodne.',
    floors: 5,
    enemies: [
      { name: 'Akwa-Dron',         emoji: '🦈', hpMult: 1.0 },
      { name: 'Zatopiony Android', emoji: '🤖', hpMult: 1.2 },
      { name: 'Lewiatan Rekin',    emoji: '🐋', hpMult: 1.5 },
      { name: 'Kraken Mech',       emoji: '🦑', hpMult: 1.8 },
      { name: 'Terror Głębin',     emoji: '👾', hpMult: 2.2 },
    ],
    enemiesPerFloor: 5,
    baseHpPerMember: 60,
    baseXpPerFloor: 640,
    baseGoldPerFloor: 160,
    finalRarity: 'epic',
    cooldownMs: 6 * 60 * 60 * 1000,
  },
  {
    id: 'orbital_fortress',
    name: 'Forteca Orbitalna ARES',
    emoji: '🛸',
    description: 'Wojskowa platforma na orbicie. Zero grawitacji, satelitarne działka i elitarni zabójcy korporacji.',
    floors: 5,
    enemies: [
      { name: 'Strażnik Orbity',   emoji: '🛸', hpMult: 1.0 },
      { name: 'Satelita Bojowy',   emoji: '⚡', hpMult: 1.3 },
      { name: 'Łowca Kosmiczny',   emoji: '🚀', hpMult: 1.6 },
      { name: 'Kolos Orbitalny',   emoji: '☄️', hpMult: 2.0 },
      { name: 'Niszczyciel ARES',  emoji: '💥', hpMult: 2.5 },
    ],
    enemiesPerFloor: 5,
    baseHpPerMember: 80,
    baseXpPerFloor: 840,
    baseGoldPerFloor: 210,
    finalRarity: 'epic',
    cooldownMs: 8 * 60 * 60 * 1000,
  },
  {
    id: 'nuclear_bunker',
    name: 'Bunkier Nuklearny SIGMA',
    emoji: '☢️',
    description: 'Skażony bunkier dawnej megakorporacji. Promieniowanie, nano-zaraza i reaktorowe kolosy czyhają na intruzów.',
    floors: 6,
    enemies: [
      { name: 'Skażony Strażnik',  emoji: '☢️', hpMult: 1.0 },
      { name: 'Nano-Zaraza',       emoji: '🧬', hpMult: 1.3 },
      { name: 'Reaktorowy Mech',   emoji: '⚗️', hpMult: 1.6 },
      { name: 'Mutant Radiacji',   emoji: '💀', hpMult: 2.0 },
      { name: 'Sigma Kolos',       emoji: '🤖', hpMult: 2.4 },
      { name: 'Reaktor SIGMA',     emoji: '☣️', hpMult: 3.0 },
    ],
    enemiesPerFloor: 6,
    baseHpPerMember: 100,
    baseXpPerFloor: 1120,
    baseGoldPerFloor: 280,
    finalRarity: 'legendary',
    cooldownMs: 12 * 60 * 60 * 1000,
  },
  {
    id: 'singularity',
    name: 'Punkt Singularności',
    emoji: '🌌',
    description: 'Serce kwantowej sieci — tu rzeczywistość się kruszy. Tylko najpotężniejsze gildie mogą pokonać Strażnika Singularności.',
    floors: 7,
    enemies: [
      { name: 'Kwantowy Cień',       emoji: '👁️', hpMult: 1.0 },
      { name: 'Rozdarcie Realności', emoji: '🌀', hpMult: 1.3 },
      { name: 'Nieskończony Pętlarz',emoji: '♾️', hpMult: 1.6 },
      { name: 'Fazowy Kolos',        emoji: '⚛️', hpMult: 2.0 },
      { name: 'Strażnik Singul.',    emoji: '🔮', hpMult: 2.5 },
      { name: 'Aberacja Kodu',       emoji: '💠', hpMult: 3.0 },
      { name: 'Kwantowy Tytan',      emoji: '🌌', hpMult: 3.6 },
    ],
    enemiesPerFloor: 6,
    baseHpPerMember: 130,
    baseXpPerFloor: 2000,
    baseGoldPerFloor: 380,
    finalRarity: 'legendary',
    cooldownMs: 24 * 60 * 60 * 1000,
  },
];

export function getFloorEnemy(
  location: GuildOpLocation,
  floor: number,
  memberCount: number,
): { name: string; emoji: string; hp: number; maxHp: number; count: number } {
  const e = location.enemies[Math.min(floor - 1, location.enemies.length - 1)];
  const hp = Math.max(1, Math.round(location.baseHpPerMember * memberCount * e.hpMult));
  return { name: e.name, emoji: e.emoji, hp, maxHp: hp, count: location.enemiesPerFloor };
}
