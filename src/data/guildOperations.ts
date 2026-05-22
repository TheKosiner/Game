export interface GuildOpEnemy {
  name: string;
  emoji: string;
  hpMult: number;
  isBoss?: boolean;
}

export interface GuildOpLocation {
  id: string;
  name: string;
  emoji: string;
  description: string;
  floors: number;
  enemies: GuildOpEnemy[];
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
      { name: 'Duch Sieci',        emoji: '👻', hpMult: 1.5 },
      { name: 'Fragmentator',      emoji: '💀', hpMult: 2.0 },
      { name: 'Rdzeń Neuronowy',   emoji: '🧠', hpMult: 4.0, isBoss: true },
    ],
    baseHpPerMember: 25,
    baseXpPerFloor: 120,
    baseGoldPerFloor: 60,
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
      { name: 'Zatopiony Android', emoji: '🤖', hpMult: 1.4 },
      { name: 'Lewiatan Rekin',    emoji: '🐋', hpMult: 1.9 },
      { name: 'Kraken Mech',       emoji: '🦑', hpMult: 2.6 },
      { name: 'Terror Głębin',     emoji: '👾', hpMult: 5.0, isBoss: true },
    ],
    baseHpPerMember: 40,
    baseXpPerFloor: 160,
    baseGoldPerFloor: 80,
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
      { name: 'Satelita Bojowy',   emoji: '⚡', hpMult: 1.5 },
      { name: 'Łowca Kosmiczny',   emoji: '🚀', hpMult: 2.2 },
      { name: 'Kolos Orbitalny',   emoji: '☄️', hpMult: 3.0 },
      { name: 'Niszczyciel ARES',  emoji: '💥', hpMult: 6.0, isBoss: true },
    ],
    baseHpPerMember: 55,
    baseXpPerFloor: 210,
    baseGoldPerFloor: 105,
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
      { name: 'Nano-Zaraza',       emoji: '🧬', hpMult: 1.5 },
      { name: 'Reaktorowy Mech',   emoji: '⚗️', hpMult: 2.1 },
      { name: 'Mutant Radiacji',   emoji: '💀', hpMult: 2.8 },
      { name: 'Sigma Kolos',       emoji: '🤖', hpMult: 3.6 },
      { name: 'Reaktor SIGMA',     emoji: '☣️', hpMult: 7.0, isBoss: true },
    ],
    baseHpPerMember: 70,
    baseXpPerFloor: 280,
    baseGoldPerFloor: 140,
    finalRarity: 'legendary',
    cooldownMs: 12 * 60 * 60 * 1000,
  },
  {
    id: 'singularity',
    name: 'Punkt Singularności',
    emoji: '🌌',
    description: 'Serce kwantowej sieci — tu rzeczywistość się kruszy. Tylko najpotężniejsze gildie mogą pokonać Boga Singularności.',
    floors: 7,
    enemies: [
      { name: 'Kwantowy Cień',       emoji: '👁️', hpMult: 1.0 },
      { name: 'Rozdarcie Realności', emoji: '🌀', hpMult: 1.5 },
      { name: 'Nieskończony Pętlarz',emoji: '♾️', hpMult: 2.1 },
      { name: 'Fazowy Kolos',        emoji: '⚛️', hpMult: 2.8 },
      { name: 'Strażnik Singul.',    emoji: '🔮', hpMult: 3.6 },
      { name: 'Aberacja Kodu',       emoji: '💠', hpMult: 4.5 },
      { name: 'Bóg Singularności',   emoji: '🌌', hpMult: 8.0, isBoss: true },
    ],
    baseHpPerMember: 90,
    baseXpPerFloor: 380,
    baseGoldPerFloor: 190,
    finalRarity: 'legendary',
    cooldownMs: 24 * 60 * 60 * 1000,
  },
];

export function getFloorEnemy(
  location: GuildOpLocation,
  floor: number,
  memberCount: number,
): { name: string; emoji: string; hp: number; maxHp: number; isBoss: boolean } {
  const e = location.enemies[Math.min(floor - 1, location.enemies.length - 1)];
  const hp = Math.max(1, Math.round(location.baseHpPerMember * memberCount * e.hpMult));
  return { name: e.name, emoji: e.emoji, hp, maxHp: hp, isBoss: !!e.isBoss };
}
