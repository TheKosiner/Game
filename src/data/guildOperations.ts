import { ALL_DUNGEONS } from './dungeons';
import { getEnemyById } from './enemies';

export interface GuildOpEnemy {
  id: string;
  name: string;
  emoji: string;
  hpMult: number;
}

export interface GuildOpLocation {
  id: string;
  name: string;
  nameEn?: string;
  emoji: string;
  description: string;
  minLevel: number;
  floors: number;
  enemies: GuildOpEnemy[];
  enemiesPerFloor: number;
  baseHpPerMember: number;
  baseXpPerFloor: number;
  baseGoldPerFloor: number;
  finalRarity: 'rare' | 'epic' | 'legendary';
  cooldownMs: number;
}

// Build a guild-raid location from a GRA dungeon: reuse its name/emoji/level/enemies
// and derive group-scaled combat params (HP per member, rewards, rarity, cooldown).
function dungeonToGuildOp(d: (typeof ALL_DUNGEONS)[number]): GuildOpLocation {
  const lvl = d.minLevel;
  const finalRarity: 'rare' | 'epic' | 'legendary' = lvl >= 50 ? 'legendary' : lvl >= 20 ? 'epic' : 'rare';
  const cooldownMs = (lvl >= 70 ? 24 : lvl >= 40 ? 12 : lvl >= 20 ? 8 : lvl >= 10 ? 6 : 4) * 60 * 60 * 1000;
  const ids = d.enemies;
  const enemies: GuildOpEnemy[] = ids.map((id, i) => {
    const e = getEnemyById(id);
    const hpMult = Math.round((1 + (i / Math.max(1, ids.length - 1)) * 1.4) * 100) / 100; // 1.0 → 2.4
    return { id, name: e?.name ?? id, emoji: e?.emoji ?? '👾', hpMult };
  });
  return {
    id: d.id,
    name: d.name,
    nameEn: d.nameEn,
    emoji: d.emoji,
    description: d.description,
    minLevel: lvl,
    floors: d.floors,
    enemies,
    enemiesPerFloor: Math.min(15, 8 + Math.floor(lvl / 15)),
    baseHpPerMember: Math.round(55 + lvl * 2.4),
    baseXpPerFloor: Math.round(300 + lvl * 25),
    baseGoldPerFloor: Math.round(250 + lvl * 18),
    finalRarity,
    cooldownMs,
  };
}

export const GUILD_OP_LOCATIONS: GuildOpLocation[] = [
  {
    id: 'cyber_labyrinth',
    name: 'Cybernetyczny Labirynt',
    emoji: '🌐',
    description: 'Opuszczony labirynt przetwarzania AI. Błądzące programy i cyfrowe duchy strzegą tajemnicy rdzenia.',
    minLevel: 5,
    floors: 4,
    enemies: [
      { id: 'op_data_guardian', name: 'Strażnik Danych',   emoji: '🤖', hpMult: 1.0 },
      { id: 'op_net_ghost',     name: 'Duch Sieci',        emoji: '👻', hpMult: 1.2 },
      { id: 'op_fragmentator',  name: 'Fragmentator',      emoji: '💀', hpMult: 1.5 },
      { id: 'op_neural_core',   name: 'Rdzeń Neuronowy',   emoji: '🧠', hpMult: 2.0 },
    ],
    enemiesPerFloor: 8,
    baseHpPerMember: 60,
    baseXpPerFloor: 500,
    baseGoldPerFloor: 400,
    finalRarity: 'rare',
    cooldownMs: 4 * 60 * 60 * 1000,
  },
  {
    id: 'sunken_city',
    name: 'Zatopione Megamiasto',
    emoji: '🌊',
    description: 'Zalane sektory dawnej metropolii. Akwa-mechanizmy i głębinowe bestie kontrolują te ruiny podwodne.',
    minLevel: 15,
    floors: 5,
    enemies: [
      { id: 'op_aqua_drone',       name: 'Akwa-Dron',         emoji: '🦈', hpMult: 1.0 },
      { id: 'op_sunken_android',   name: 'Zatopiony Android', emoji: '🤖', hpMult: 1.2 },
      { id: 'op_leviathan_shark',  name: 'Lewiatan Rekin',    emoji: '🐋', hpMult: 1.5 },
      { id: 'op_kraken_mech',      name: 'Kraken Mech',       emoji: '🦑', hpMult: 1.8 },
      { id: 'op_deep_terror',      name: 'Terror Głębin',     emoji: '👾', hpMult: 2.2 },
    ],
    enemiesPerFloor: 10,
    baseHpPerMember: 90,
    baseXpPerFloor: 640,
    baseGoldPerFloor: 550,
    finalRarity: 'epic',
    cooldownMs: 6 * 60 * 60 * 1000,
  },
  {
    id: 'orbital_fortress',
    name: 'Forteca Orbitalna ARES',
    emoji: '🛸',
    description: 'Wojskowa platforma na orbicie. Zero grawitacji, satelitarne działka i elitarni zabójcy korporacji.',
    minLevel: 25,
    floors: 5,
    enemies: [
      { id: 'op_orbit_guardian',    name: 'Strażnik Orbity',   emoji: '🛸', hpMult: 1.0 },
      { id: 'op_battle_satellite',  name: 'Satelita Bojowy',   emoji: '⚡', hpMult: 1.3 },
      { id: 'op_cosmic_hunter',     name: 'Łowca Kosmiczny',   emoji: '🚀', hpMult: 1.6 },
      { id: 'op_orbital_colossus',  name: 'Kolos Orbitalny',   emoji: '☄️', hpMult: 2.0 },
      { id: 'op_ares_destroyer',    name: 'Niszczyciel ARES',  emoji: '💥', hpMult: 2.5 },
    ],
    enemiesPerFloor: 10,
    baseHpPerMember: 120,
    baseXpPerFloor: 840,
    baseGoldPerFloor: 720,
    finalRarity: 'epic',
    cooldownMs: 8 * 60 * 60 * 1000,
  },
  {
    id: 'nuclear_bunker',
    name: 'Bunkier Nuklearny SIGMA',
    emoji: '☢️',
    description: 'Skażony bunkier dawnej megakorporacji. Promieniowanie, nano-zaraza i reaktorowe kolosy czyhają na intruzów.',
    minLevel: 35,
    floors: 6,
    enemies: [
      { id: 'op_contaminated_guard', name: 'Skażony Strażnik',  emoji: '☢️', hpMult: 1.0 },
      { id: 'op_nano_plague',        name: 'Nano-Zaraza',       emoji: '🧬', hpMult: 1.3 },
      { id: 'op_reactor_mech',       name: 'Reaktorowy Mech',   emoji: '⚗️', hpMult: 1.6 },
      { id: 'op_radiation_mutant',   name: 'Mutant Radiacji',   emoji: '💀', hpMult: 2.0 },
      { id: 'op_sigma_colossus',     name: 'Sigma Kolos',       emoji: '🤖', hpMult: 2.4 },
      { id: 'op_sigma_reactor',      name: 'Reaktor SIGMA',     emoji: '☣️', hpMult: 3.0 },
    ],
    enemiesPerFloor: 12,
    baseHpPerMember: 160,
    baseXpPerFloor: 1120,
    baseGoldPerFloor: 950,
    finalRarity: 'legendary',
    cooldownMs: 12 * 60 * 60 * 1000,
  },
  {
    id: 'singularity',
    name: 'Punkt Singularności',
    emoji: '🌌',
    description: 'Serce kwantowej sieci — tu rzeczywistość się kruszy. Tylko najpotężniejsze gildie mogą pokonać Strażnika Singularności.',
    minLevel: 50,
    floors: 7,
    enemies: [
      { id: 'op_quantum_shadow',       name: 'Kwantowy Cień',       emoji: '👁️', hpMult: 1.0 },
      { id: 'op_reality_tear',         name: 'Rozdarcie Realności', emoji: '🌀', hpMult: 1.3 },
      { id: 'op_infinite_looper',      name: 'Nieskończony Pętlarz',emoji: '♾️', hpMult: 1.6 },
      { id: 'op_phase_colossus',       name: 'Fazowy Kolos',        emoji: '⚛️', hpMult: 2.0 },
      { id: 'op_singularity_guardian', name: 'Strażnik Singul.',    emoji: '🔮', hpMult: 2.5 },
      { id: 'op_code_aberration',      name: 'Aberacja Kodu',       emoji: '💠', hpMult: 3.0 },
      { id: 'op_quantum_titan',        name: 'Kwantowy Tytan',      emoji: '🌌', hpMult: 3.6 },
    ],
    enemiesPerFloor: 15,
    baseHpPerMember: 200,
    baseXpPerFloor: 2000,
    baseGoldPerFloor: 1300,
    finalRarity: 'legendary',
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  {
    id: 'orbital_citadel',
    name: 'Cytadela Orbitalna',
    nameEn: 'Orbital Citadel',
    emoji: '🛰️',
    description: 'Bojowa stacja na orbicie planety. Działa plazmowe, mechy szturmowe i sztuczna grawitacja — gildia musi zdobyć ją piętro po piętrze.',
    minLevel: 110,
    floors: 6,
    enemies: [
      { id: 'op_orbital_trooper',   name: 'Żołnierz Orbitalny',  emoji: '🪖', hpMult: 1.0 },
      { id: 'op_plasma_cannon',     name: 'Działo Plazmowe',     emoji: '🔫', hpMult: 1.4 },
      { id: 'op_assault_mech',      name: 'Mech Szturmowy',      emoji: '🤖', hpMult: 1.8 },
      { id: 'op_zero_g_reaper',     name: 'Żniwiarz Zero-G',     emoji: '💫', hpMult: 2.3 },
      { id: 'op_station_core',      name: 'Rdzeń Stacji',        emoji: '🛰️', hpMult: 3.0 },
      { id: 'op_orbital_warlord',   name: 'Warlord Orbity',      emoji: '⚔️', hpMult: 3.8 },
    ],
    enemiesPerFloor: 15,
    baseHpPerMember: 320,
    baseXpPerFloor: 3400,
    baseGoldPerFloor: 2300,
    finalRarity: 'legendary',
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  {
    id: 'antimatter_reactor',
    name: 'Reaktor Antymaterii',
    nameEn: 'Antimatter Reactor',
    emoji: '⚛️',
    description: 'Serce planetarnej sieci energetycznej. Anihilacja czai się w każdym kablu — tylko zgrana gildia wyjdzie stąd żywa.',
    minLevel: 140,
    floors: 7,
    enemies: [
      { id: 'op_reactor_drone',     name: 'Dron Reaktora',       emoji: '⚙️', hpMult: 1.0 },
      { id: 'op_fusion_guard',      name: 'Strażnik Fuzji',      emoji: '🔆', hpMult: 1.4 },
      { id: 'op_antimatter_beast',  name: 'Bestia Antymaterii',  emoji: '💥', hpMult: 1.9 },
      { id: 'op_containment_titan', name: 'Tytan Izolacji',      emoji: '🛡️', hpMult: 2.5 },
      { id: 'op_meltdown_wraith',   name: 'Widmo Stopienia',     emoji: '☢️', hpMult: 3.2 },
      { id: 'op_singular_engine',   name: 'Silnik Singularny',   emoji: '🌀', hpMult: 4.0 },
      { id: 'op_reactor_god',       name: 'Bóstwo Reaktora',     emoji: '🔥', hpMult: 5.0 },
    ],
    enemiesPerFloor: 15,
    baseHpPerMember: 480,
    baseXpPerFloor: 5200,
    baseGoldPerFloor: 3500,
    finalRarity: 'legendary',
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  {
    id: 'genesis_throne',
    name: 'Tron Genezy',
    nameEn: 'Genesis Throne',
    emoji: '🌌',
    description: 'Ostateczna operacja: sam tron, z którego powstał system. Byty spoza czasu bronią go bez litości. Tylko najpotężniejsze gildie mają szansę.',
    minLevel: 180,
    floors: 8,
    enemies: [
      { id: 'op_genesis_herald',    name: 'Herold Genezy',       emoji: '📯', hpMult: 1.0 },
      { id: 'op_void_colossus',     name: 'Kolos Próżni',        emoji: '⬛', hpMult: 1.5 },
      { id: 'op_star_devourer',     name: 'Pożeracz Gwiazd',     emoji: '☄️', hpMult: 2.1 },
      { id: 'op_cosmic_archon',     name: 'Kosmiczny Archont',   emoji: '👁️', hpMult: 2.8 },
      { id: 'op_infinity_warden',   name: 'Strażnik Nieskoń.',   emoji: '♾️', hpMult: 3.6 },
      { id: 'op_reality_ender',     name: 'Koniec Realności',    emoji: '🕳️', hpMult: 4.5 },
      { id: 'op_genesis_avatar',    name: 'Awatar Genezy',       emoji: '🌠', hpMult: 5.6 },
      { id: 'op_the_absolute',      name: 'Absolut',             emoji: '🔚', hpMult: 7.0 },
    ],
    enemiesPerFloor: 15,
    baseHpPerMember: 720,
    baseXpPerFloor: 8000,
    baseGoldPerFloor: 5400,
    finalRarity: 'legendary',
    cooldownMs: 24 * 60 * 60 * 1000,
  },
  // The 20 locations from the GRA "Operacje" map, scaled for group raids.
  ...ALL_DUNGEONS.map(dungeonToGuildOp),
];

/** Pick a random location appropriate for the given hero level.
 *  Eligible = minLevel <= heroLevel. Weighted so higher-tier locations
 *  are more likely (weight = index+1 among eligible). */
export function pickLocationForLevel(heroLevel: number): GuildOpLocation {
  const eligible = GUILD_OP_LOCATIONS.filter(l => l.minLevel <= heroLevel);
  const pool = eligible.length > 0 ? eligible : [GUILD_OP_LOCATIONS[0]];
  const weights = pool.map((_, i) => i + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let rnd = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    rnd -= weights[i];
    if (rnd <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function getFloorEnemy(
  location: GuildOpLocation,
  floor: number,
  memberCount: number,
): { id: string; name: string; emoji: string; hp: number; maxHp: number; count: number } {
  const e = location.enemies[Math.min(floor - 1, location.enemies.length - 1)];
  const hp = Math.max(1, Math.round(location.baseHpPerMember * memberCount * e.hpMult));
  return { id: e.id, name: e.name, emoji: e.emoji, hp, maxHp: hp, count: location.enemiesPerFloor };
}
