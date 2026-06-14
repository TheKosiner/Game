import React from 'react';

interface Props {
  id: string;
  size?: number;
  style?: React.CSSProperties;
}

type Category =
  | 'street_thug' | 'hacker' | 'enforcer' | 'raider' | 'assassin' | 'sniper'
  | 'corp_boss' | 'warlock' | 'drone' | 'turret' | 'swarm' | 'android' | 'mech'
  | 'ai' | 'electric_golem' | 'sand_golem' | 'arcane_golem' | 'rat'
  | 'cyber_animal' | 'wolf' | 'bear' | 'spider' | 'cockroach' | 'ghost'
  | 'ghul' | 'demon' | 'dragon'
  | 'soldier' | 'bio' | 'berserker' | 'plasma' | 'commander' | 'psi'
  | 'glitch' | 'void' | 'reaper'
  | 'skeleton' | 'knight' | 'lich' | 'vampire' | 'mimic';

const ENEMY_CATEGORY: Record<string, Category> = {
  scavenger:           'street_thug',
  street_punk:         'street_thug',
  gangster:            'street_thug',
  gang_leader:         'street_thug',
  street_hacker:       'hacker',
  enforcer:            'enforcer',
  wasteland_raider:    'raider',
  corp_assassin:       'assassin',
  shadow_agent:        'assassin',
  corp_sniper:         'sniper',
  exec_hunter:         'corp_boss',
  corp_general:        'corp_boss',
  nano_witch:          'warlock',
  cyber_warlock:       'warlock',
  quantum_mage:        'warlock',
  psi_hacker:          'warlock',
  patrol_drone:        'drone',
  spy_drone:           'drone',
  nuclear_drone:       'drone',
  psi_drone:           'drone',
  laser_turret:        'turret',
  nano_swarm:          'swarm',
  combat_android:      'android',
  security_android:    'android',
  heavy_mech:          'mech',
  war_mech:            'mech',
  assault_mech:        'mech',
  cyber_titan:         'mech',
  omega_unit:          'mech',
  rogue_ai:            'ai',
  prototype_ai:        'ai',
  mega_ai:             'ai',
  holo_guardian:       'ai',
  electric_golem:      'electric_golem',
  sand_golem:          'sand_golem',
  arcane_golem:        'arcane_golem',
  arcane_titan:        'arcane_golem',
  arcane_omega:        'arcane_golem',
  mutant_rat:          'rat',
  cyber_dog:           'cyber_animal',
  neon_predator:       'cyber_animal',
  cyber_wolf:          'wolf',
  zmutowany_niedzwiedz:'bear',
  mutant_spider:       'spider',
  zmutowany_karaluch:  'cockroach',
  energy_phantom:      'ghost',
  quantum_ghost:       'ghost',
  void_specter:        'ghost',
  arcane_ghost:        'ghost',
  ghul:                'ghul',
  cyber_demon:         'demon',
  neon_dragon:         'dragon',
  void_dragon:         'dragon',
  // ── High-tier zones (lvl 40+) ───────────────────────────────────────────
  spec_ops_soldier:    'soldier',
  plasma_guard:        'plasma',
  plasma_titan:        'plasma',
  bio_hazard_unit:     'bio',
  bio_overlord:        'bio',
  nano_berserker:      'berserker',
  apocalypse_warrior:  'berserker',
  apex_predator:       'cyber_animal',
  zero_commander:      'commander',
  cyber_overlord:      'commander',
  ghost_overlord:      'commander',
  psi_storm:           'psi',
  psi_annihilator:     'psi',
  data_specter:        'glitch',
  digital_phantom:     'glitch',
  glitch_entity:       'glitch',
  system_wraith:       'glitch',
  null_entity:         'glitch',
  network_hunter:      'assassin',
  quantum_assassin:    'assassin',
  matrix_reaper:       'reaper',
  code_reaper:         'reaper',
  end_entity:          'reaper',
  network_titan:       'mech',
  omega_destroyer:     'mech',
  quantum_giant:       'arcane_golem',
  nuclear_overlord:    'sand_golem',
  void_weaver:         'void',
  void_destroyer:      'void',
  void_sovereign:      'void',
  void_prime:          'void',
  nexus_guard:         'void',
  nexus_prime:         'void',
  zero_absolute:       'void',
  // ── Krypta (gothic / undead) ────────────────────────────────────────────
  blood_shadow:        'ghost',
  bone_man:            'skeleton',
  rotten_rat:          'rat',
  specter:             'ghost',
  undead_knight:       'knight',
  necromancer:         'warlock',
  abyss_demon:         'demon',
  undead_mage:         'lich',
  crypt_guardian:      'arcane_golem',
  plague_wraith:       'ghul',
  bone_beast:          'skeleton',
  archlich:            'lich',
  ancient_vampire:     'vampire',
  abomination:         'demon',
  dark_paladin:        'knight',
  poison_spider:       'spider',
  chest_mimic:         'mimic',
  shadow_lord:         'reaper',
  // ── Guild operations ────────────────────────────────────────────────────
  op_data_guardian:    'android',
  op_net_ghost:        'glitch',
  op_fragmentator:     'reaper',
  op_neural_core:      'ai',
  op_aqua_drone:       'drone',
  op_sunken_android:   'android',
  op_leviathan_shark:  'cyber_animal',
  op_kraken_mech:      'mech',
  op_deep_terror:      'void',
  op_orbit_guardian:   'drone',
  op_battle_satellite: 'turret',
  op_cosmic_hunter:    'sniper',
  op_orbital_colossus: 'mech',
  op_ares_destroyer:   'plasma',
  op_contaminated_guard: 'enforcer',
  op_nano_plague:      'bio',
  op_reactor_mech:     'mech',
  op_radiation_mutant: 'sand_golem',
  op_sigma_colossus:   'android',
  op_sigma_reactor:    'ai',
  op_quantum_shadow:   'ghost',
  op_reality_tear:     'psi',
  op_infinite_looper:  'glitch',
  op_phase_colossus:   'arcane_golem',
  op_singularity_guardian: 'void',
  op_code_aberration:  'plasma',
  op_quantum_titan:    'mech',
};

const CATEGORY_COLOR: Record<Category, string> = {
  street_thug:    '#00f5ff',
  hacker:         '#00ff88',
  enforcer:       '#ff6600',
  raider:         '#cc8800',
  assassin:       '#cc44ff',
  sniper:         '#88ff44',
  corp_boss:      '#ffd700',
  warlock:        '#ff00cc',
  drone:          '#4488ff',
  turret:         '#ff2d78',
  swarm:          '#ffaa00',
  android:        '#88ccff',
  mech:           '#ff9900',
  ai:             '#00ffff',
  electric_golem: '#ffff00',
  sand_golem:     '#ff8844',
  arcane_golem:   '#cc44ff',
  rat:            '#88cc44',
  cyber_animal:   '#00f5ff',
  wolf:           '#aaccff',
  bear:           '#ff6644',
  spider:         '#88ff44',
  cockroach:      '#aacc44',
  ghost:          '#aaffff',
  ghul:           '#88ff88',
  demon:          '#ff4444',
  dragon:         '#ff00aa',
  soldier:        '#aacc55',
  bio:            '#66ff33',
  berserker:      '#ff3322',
  plasma:         '#33ffff',
  commander:      '#ffcc33',
  psi:            '#cc44ff',
  glitch:         '#ff0066',
  void:           '#9933ff',
  reaper:         '#88ffaa',
  skeleton:       '#d8d0c0',
  knight:         '#88aacc',
  lich:           '#66ffcc',
  vampire:        '#ff4466',
  mimic:          '#ffaa33',
};

function getEnemyCategory(id: string): Category {
  return ENEMY_CATEGORY[id] ?? 'street_thug';
}

// ─── Individual icon components ───────────────────────────────────────────────

function IconStreetThug({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* hood / head */}
      <ellipse cx="32" cy="12" rx="8" ry="9" fill="#1a1a2e" />
      <path d="M24 10 Q24 4 32 4 Q40 4 40 10 L40 14 Q36 18 32 18 Q28 18 24 14 Z" fill="#222240" />
      {/* cyan eye implant */}
      <ellipse cx="30" cy="12" rx="2.5" ry="1.5" fill={c} opacity="0.9" />
      <circle cx="30" cy="12" r="1" fill="white" opacity="0.7" />
      {/* hoodie body */}
      <path d="M20 18 Q16 20 14 32 L14 48 L50 48 L50 32 Q48 20 44 18 Q40 22 32 22 Q24 22 20 18 Z" fill="#1a1a2e" />
      {/* arm raised with bat */}
      <line x1="44" y1="20" x2="52" y2="8" stroke="#222240" strokeWidth="5" strokeLinecap="round" />
      {/* bat */}
      <rect x="50" y="2" width="5" height="14" rx="2.5" fill="#333" />
      <rect x="49" y="2" width="7" height="5" rx="2" fill="#444" />
      {/* hoodie highlight */}
      <path d="M22 22 Q20 30 20 38" stroke={c} strokeWidth="1" opacity="0.3" fill="none" />
      <path d="M42 22 Q44 30 44 38" stroke={c} strokeWidth="1" opacity="0.3" fill="none" />
    </>
  );
}

function IconHacker({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* crouching body */}
      <path d="M24 20 Q20 22 18 30 L18 44 L46 44 L46 30 Q44 22 40 20 Z" fill="#0d1a0d" />
      {/* hoodie head */}
      <ellipse cx="32" cy="14" rx="7" ry="8" fill="#0d1a0d" />
      <path d="M25 12 Q25 6 32 6 Q39 6 39 12 L39 16 Q35 20 32 20 Q29 20 25 16 Z" fill="#112211" />
      {/* holographic screen in front */}
      <rect x="10" y="28" width="18" height="12" rx="2" fill="#001a00" opacity="0.9" />
      <rect x="11" y="29" width="16" height="10" rx="1" fill={c} opacity="0.15" />
      {/* screen lines (code) */}
      <line x1="12" y1="31" x2="24" y2="31" stroke={c} strokeWidth="1" opacity="0.7" />
      <line x1="12" y1="33" x2="20" y2="33" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="12" y1="35" x2="22" y2="35" stroke={c} strokeWidth="1" opacity="0.6" />
      <line x1="12" y1="37" x2="18" y2="37" stroke={c} strokeWidth="1" opacity="0.4" />
      {/* green glow from screen */}
      <rect x="10" y="28" width="18" height="12" rx="2" fill={c} opacity="0.05" />
      {/* fingers / hands */}
      <line x1="18" y1="36" x2="14" y2="38" stroke="#0d1a0d" strokeWidth="3" strokeLinecap="round" />
      <line x1="19" y1="38" x2="14" y2="40" stroke="#0d1a0d" strokeWidth="3" strokeLinecap="round" />
      {/* eyes glow green */}
      <circle cx="30" cy="14" r="1.5" fill={c} opacity="0.8" />
      <circle cx="34" cy="14" r="1.5" fill={c} opacity="0.8" />
    </>
  );
}

function IconEnforcer({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* helmet */}
      <path d="M20 14 Q20 6 32 6 Q44 6 44 14 L44 22 Q44 26 32 26 Q20 26 20 22 Z" fill="#1a0a00" />
      <rect x="22" y="18" width="20" height="6" rx="2" fill={c} opacity="0.3" />
      {/* visor slit orange */}
      <rect x="24" y="16" width="16" height="4" rx="1.5" fill={c} opacity="0.8" />
      {/* stocky armored body */}
      <path d="M16 26 L16 50 L48 50 L48 26 Q44 22 32 22 Q20 22 16 26 Z" fill="#1a0a00" />
      {/* shoulder pads */}
      <rect x="10" y="26" width="10" height="14" rx="3" fill="#220e00" />
      <rect x="44" y="26" width="10" height="14" rx="3" fill="#220e00" />
      <rect x="11" y="27" width="8" height="3" rx="1" fill={c} opacity="0.5" />
      <rect x="45" y="27" width="8" height="3" rx="1" fill={c} opacity="0.5" />
      {/* chest panel */}
      <rect x="24" y="28" width="16" height="10" rx="2" fill="#2a1200" />
      <rect x="26" y="30" width="12" height="2" rx="1" fill={c} opacity="0.6" />
      <rect x="26" y="34" width="12" height="2" rx="1" fill={c} opacity="0.4" />
      {/* arm-mounted weapon */}
      <rect x="44" y="36" width="14" height="6" rx="2" fill="#1a0a00" />
      <rect x="54" y="34" width="5" height="10" rx="1" fill="#111" />
      <circle cx="57" cy="39" r="2" fill={c} opacity="0.9" />
    </>
  );
}

function IconRaider({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* scraggly head with scrap helmet */}
      <ellipse cx="32" cy="13" rx="9" ry="10" fill="#1a1000" />
      {/* scrap metal helmet pieces (spiky) */}
      <polygon points="24,8 22,2 26,6" fill="#332200" />
      <polygon points="32,6 30,0 34,0 36,6" fill="#332200" />
      <polygon points="40,8 42,2 38,6" fill="#332200" />
      <polygon points="23,14 18,12 22,18" fill="#332200" />
      <polygon points="41,14 46,12 42,18" fill="#332200" />
      {/* face visor scratch */}
      <rect x="24" y="11" width="16" height="5" rx="1" fill="#0d0800" />
      <line x1="25" y1="13" x2="39" y2="13" stroke={c} strokeWidth="1" opacity="0.6" />
      {/* battered body with scrap armor */}
      <path d="M18 22 L14 50 L50 50 L46 22 Q40 18 32 18 Q24 18 18 22 Z" fill="#1a1000" />
      {/* scrap armor plates */}
      <polygon points="18,24 22,24 20,34 16,34" fill="#2a1a00" />
      <polygon points="42,24 46,24 48,34 44,34" fill="#2a1a00" />
      <rect x="24" y="26" width="16" height="10" rx="1" fill="#2a1a00" />
      <line x1="26" y1="28" x2="28" y2="35" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="32" y1="27" x2="32" y2="35" stroke={c} strokeWidth="1" opacity="0.3" />
      <line x1="38" y1="28" x2="36" y2="35" stroke={c} strokeWidth="1" opacity="0.4" />
    </>
  );
}

function IconAssassin({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* slim crouching figure head */}
      <ellipse cx="34" cy="10" rx="6" ry="7" fill="#0d0014" />
      {/* purple visor strip */}
      <rect x="28" y="9" width="12" height="3" rx="1.5" fill={c} opacity="0.9" />
      {/* sleek body crouched */}
      <path d="M24 16 Q20 18 18 26 L18 42 L36 42 L40 30 L44 26 Q42 18 36 16 Z" fill="#0d0014" />
      {/* shin guard */}
      <rect x="18" y="36" width="8" height="10" rx="2" fill="#140020" />
      {/* arm forward with blade */}
      <line x1="40" y1="24" x2="52" y2="20" stroke="#0d0014" strokeWidth="5" strokeLinecap="round" />
      {/* short blade */}
      <polygon points="52,18 56,20 52,26 48,24" fill="#1a0030" />
      <line x1="52" y1="19" x2="55" y2="21" stroke={c} strokeWidth="1" opacity="0.8" />
      {/* body suit neon lines */}
      <line x1="24" y1="18" x2="22" y2="36" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="32" y1="16" x2="32" y2="40" stroke={c} strokeWidth="0.8" opacity="0.3" />
      {/* eye */}
      <circle cx="32" cy="10" r="1" fill={c} opacity="0.9" />
    </>
  );
}

function IconSniper({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* standing figure head */}
      <ellipse cx="24" cy="10" rx="7" ry="8" fill="#0a150a" />
      {/* lime visor */}
      <rect x="18" y="9" width="12" height="3" rx="1.5" fill={c} opacity="0.8" />
      {/* tactical body */}
      <path d="M16 18 L14 50 L34 50 L32 18 Q28 14 24 14 Q20 14 16 18 Z" fill="#0a150a" />
      {/* long rifle diagonal across figure */}
      <line x1="8" y1="48" x2="56" y2="10" stroke="#0d200d" strokeWidth="4" strokeLinecap="round" />
      <line x1="8" y1="48" x2="56" y2="10" stroke="#1a3a1a" strokeWidth="2" strokeLinecap="round" />
      {/* scope on rifle */}
      <rect x="30" y="22" width="12" height="5" rx="1.5" fill="#0a150a" />
      <circle cx="36" cy="24.5" r="2" fill={c} opacity="0.5" />
      {/* muzzle tip glow */}
      <circle cx="56" cy="10" r="2.5" fill={c} opacity="0.8" />
      {/* arm holding rifle */}
      <line x1="24" y1="26" x2="38" y2="20" stroke="#0a150a" strokeWidth="5" strokeLinecap="round" />
      {/* tactical pouch */}
      <rect x="16" y="30" width="8" height="6" rx="1" fill="#0d200d" />
    </>
  );
}

function IconCorpBoss({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* head with monocle implant */}
      <ellipse cx="32" cy="12" rx="8" ry="9" fill="#1a1400" />
      {/* gold monocle */}
      <circle cx="35" cy="11" r="3.5" fill="none" stroke={c} strokeWidth="1.5" />
      <circle cx="35" cy="11" r="1.5" fill={c} opacity="0.4" />
      {/* suit collar and tie */}
      <path d="M24 20 L24 22 L32 26 L40 22 L40 20" fill="#1a1400" />
      <polygon points="32,24 30,30 32,28 34,30" fill={c} opacity="0.7" />
      {/* suit jacket */}
      <path d="M18 22 L14 52 L50 52 L46 22 Q40 18 32 18 Q24 18 18 22 Z" fill="#1a1400" />
      {/* suit lapels */}
      <polygon points="24,20 28,30 24,52 16,52 14,32" fill="#221c00" opacity="0.8" />
      <polygon points="40,20 36,30 40,52 48,52 50,32" fill="#221c00" opacity="0.8" />
      {/* chrome augmented arm right */}
      <rect x="44" y="24" width="10" height="20" rx="4" fill="#888" />
      <rect x="45" y="26" width="8" height="3" rx="1" fill={c} opacity="0.6" />
      <rect x="45" y="32" width="8" height="3" rx="1" fill={c} opacity="0.4" />
      <rect x="45" y="38" width="8" height="3" rx="1" fill={c} opacity="0.3" />
      {/* chest pocket badge */}
      <rect x="26" y="26" width="8" height="6" rx="1" fill="#2a2000" />
      <rect x="27" y="27" width="6" height="4" rx="0.5" fill={c} opacity="0.4" />
    </>
  );
}

function IconWarlock({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* robe / hooded figure */}
      <path d="M20 18 Q12 24 10 50 L54 50 Q52 24 44 18 Q38 22 32 22 Q26 22 20 18 Z" fill="#140014" />
      {/* robe inner */}
      <path d="M24 22 Q16 28 16 50 L48 50 Q48 28 40 22 Q36 26 32 26 Q28 26 24 22 Z" fill="#1a001a" />
      {/* hood */}
      <path d="M22 12 Q22 4 32 4 Q42 4 42 12 L42 18 Q38 24 32 24 Q26 24 22 18 Z" fill="#140014" />
      {/* glowing eyes magenta */}
      <circle cx="28" cy="14" r="2" fill={c} opacity="0.9" />
      <circle cx="36" cy="14" r="2" fill={c} opacity="0.9" />
      {/* arms raised */}
      <line x1="20" y1="24" x2="8" y2="16" stroke="#140014" strokeWidth="5" strokeLinecap="round" />
      <line x1="44" y1="24" x2="56" y2="16" stroke="#140014" strokeWidth="5" strokeLinecap="round" />
      {/* energy orbs at hands */}
      <circle cx="8" cy="14" r="5" fill={c} opacity="0.25" />
      <circle cx="8" cy="14" r="3" fill={c} opacity="0.5" />
      <circle cx="8" cy="14" r="1.5" fill="white" opacity="0.8" />
      <circle cx="56" cy="14" r="5" fill={c} opacity="0.25" />
      <circle cx="56" cy="14" r="3" fill={c} opacity="0.5" />
      <circle cx="56" cy="14" r="1.5" fill="white" opacity="0.8" />
      {/* floating small orbs */}
      <circle cx="16" cy="26" r="2" fill={c} opacity="0.6" />
      <circle cx="48" cy="26" r="2" fill={c} opacity="0.6" />
      <circle cx="20" cy="36" r="1.5" fill={c} opacity="0.4" />
      <circle cx="44" cy="36" r="1.5" fill={c} opacity="0.4" />
      {/* staff */}
      <line x1="32" y1="26" x2="32" y2="52" stroke="#220022" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="52" r="3" fill={c} opacity="0.5" />
    </>
  );
}

function IconDrone({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* main disc body */}
      <ellipse cx="32" cy="30" rx="18" ry="7" fill="#00083a" />
      <ellipse cx="32" cy="28" rx="16" ry="6" fill="#001050" />
      {/* neon ring */}
      <ellipse cx="32" cy="28" rx="16" ry="6" fill="none" stroke={c} strokeWidth="1.5" opacity="0.8" />
      {/* top dome */}
      <ellipse cx="32" cy="24" rx="10" ry="8" fill="#001050" />
      <ellipse cx="32" cy="22" rx="7" ry="5" fill={c} opacity="0.1" />
      {/* 4 rotors */}
      <ellipse cx="12" cy="24" rx="8" ry="3" fill={c} opacity="0.3" />
      <ellipse cx="52" cy="24" rx="8" ry="3" fill={c} opacity="0.3" />
      <ellipse cx="22" cy="14" rx="3" ry="8" fill={c} opacity="0.3" />
      <ellipse cx="42" cy="14" rx="3" ry="8" fill={c} opacity="0.3" />
      {/* rotor hubs */}
      <circle cx="12" cy="24" r="2" fill={c} opacity="0.7" />
      <circle cx="52" cy="24" r="2" fill={c} opacity="0.7" />
      <circle cx="22" cy="14" r="2" fill={c} opacity="0.7" />
      <circle cx="42" cy="14" r="2" fill={c} opacity="0.7" />
      {/* central camera eye below */}
      <circle cx="32" cy="34" r="4" fill="#00083a" />
      <circle cx="32" cy="34" r="3" fill={c} opacity="0.2" />
      <circle cx="32" cy="34" r="1.5" fill={c} opacity="0.8" />
      {/* neon light dots on ring */}
      <circle cx="18" cy="28" r="1.5" fill={c} opacity="0.9" />
      <circle cx="46" cy="28" r="1.5" fill={c} opacity="0.9" />
      <circle cx="32" cy="22" r="1.5" fill={c} opacity="0.9" />
    </>
  );
}

function IconTurret({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* pedestal base */}
      <rect x="20" y="44" width="24" height="8" rx="2" fill="#1a0008" />
      <rect x="24" y="40" width="16" height="8" rx="2" fill="#1a0008" />
      {/* main box body */}
      <rect x="14" y="24" width="36" height="20" rx="3" fill="#1a0008" />
      <rect x="16" y="26" width="32" height="16" rx="2" fill="#220010" />
      {/* sensor lens center */}
      <circle cx="32" cy="34" r="5" fill="#1a0008" />
      <circle cx="32" cy="34" r="4" fill={c} opacity="0.2" />
      <circle cx="32" cy="34" r="2.5" fill={c} opacity="0.6" />
      <circle cx="32" cy="34" r="1" fill="white" opacity="0.9" />
      {/* two forward gun barrels */}
      <rect x="16" y="26" width="16" height="5" rx="1.5" fill="#110008" />
      <rect x="16" y="33" width="16" height="5" rx="1.5" fill="#110008" />
      {/* barrel tips */}
      <rect x="10" y="26" width="8" height="5" rx="1" fill="#0d0006" />
      <rect x="10" y="33" width="8" height="5" rx="1" fill="#0d0006" />
      {/* red targeting dot on lens */}
      <circle cx="32" cy="34" r="1" fill={c} opacity="0.95" />
      {/* targeting laser line */}
      <line x1="10" y1="28" x2="4" y2="28" stroke={c} strokeWidth="1" opacity="0.8" strokeDasharray="2,2" />
      <line x1="10" y1="35" x2="4" y2="38" stroke={c} strokeWidth="1" opacity="0.6" strokeDasharray="2,2" />
      {/* corner armor bolts */}
      <circle cx="16" cy="26" r="1.5" fill={c} opacity="0.5" />
      <circle cx="48" cy="26" r="1.5" fill={c} opacity="0.5" />
      <circle cx="16" cy="44" r="1.5" fill={c} opacity="0.5" />
      <circle cx="48" cy="44" r="1.5" fill={c} opacity="0.5" />
    </>
  );
}

function IconSwarm({ c }: { c: string }): React.ReactElement {
  // Cloud of dots in humanoid arrangement
  const dots: [number, number, number][] = [
    // head area
    [30,6,2],[34,5,1.5],[28,8,1.5],[36,8,1.5],[32,4,1],
    // neck
    [32,12,1.5],[30,14,1],
    // torso
    [26,18,2],[32,16,2],[38,18,2],[28,22,1.5],[34,22,1.5],[40,20,1],
    [24,26,1.5],[30,26,2],[36,26,2],[42,24,1],[22,30,1],[32,30,2],[40,30,1.5],
    // arms
    [18,20,1.5],[14,18,1],[16,24,1],[12,22,1.5],[46,20,1.5],[50,18,1],[48,24,1],[52,22,1.5],
    // legs
    [26,36,2],[30,38,1.5],[34,38,1.5],[38,36,2],[24,44,1.5],[28,46,1],[34,46,1],[38,44,1.5],
    // trail particles
    [20,50,1],[32,52,1],[44,50,1],[16,44,1],[48,44,1],
  ];
  return (
    <>
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={0.4 + (r / 5)} />
      ))}
    </>
  );
}

function IconAndroid({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* angular head */}
      <rect x="22" y="4" width="20" height="18" rx="2" fill="#050e1a" />
      <rect x="24" y="6" width="16" height="14" rx="1" fill="#08182a" />
      {/* glowing visor slit */}
      <rect x="24" y="11" width="16" height="4" rx="1.5" fill={c} opacity="0.8" />
      <rect x="26" y="12" width="12" height="2" rx="1" fill="white" opacity="0.3" />
      {/* neck joint */}
      <rect x="28" y="22" width="8" height="4" rx="1" fill="#050e1a" />
      {/* torso */}
      <rect x="18" y="26" width="28" height="22" rx="2" fill="#050e1a" />
      <rect x="20" y="28" width="24" height="18" rx="1" fill="#08182a" />
      {/* chest panel */}
      <rect x="24" y="30" width="16" height="10" rx="1" fill="#050e1a" />
      <rect x="26" y="32" width="12" height="2" rx="0.5" fill={c} opacity="0.6" />
      <rect x="26" y="36" width="12" height="2" rx="0.5" fill={c} opacity="0.4" />
      {/* shoulders with joint mechanism */}
      <circle cx="18" cy="28" r="4" fill="#050e1a" />
      <circle cx="18" cy="28" r="2.5" fill={c} opacity="0.3" />
      <circle cx="46" cy="28" r="4" fill="#050e1a" />
      <circle cx="46" cy="28" r="2.5" fill={c} opacity="0.3" />
      {/* arms segmented */}
      <rect x="10" y="28" width="8" height="16" rx="2" fill="#050e1a" />
      <rect x="11" y="32" width="6" height="3" rx="0.5" fill={c} opacity="0.3" />
      <rect x="48" y="28" width="8" height="16" rx="2" fill="#050e1a" />
      <rect x="49" y="32" width="6" height="3" rx="0.5" fill={c} opacity="0.3" />
      {/* legs segmented */}
      <rect x="20" y="48" width="10" height="12" rx="2" fill="#050e1a" />
      <rect x="34" y="48" width="10" height="12" rx="2" fill="#050e1a" />
      <rect x="21" y="52" width="8" height="2" rx="0.5" fill={c} opacity="0.3" />
      <rect x="35" y="52" width="8" height="2" rx="0.5" fill={c} opacity="0.3" />
    </>
  );
}

function IconMech({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* cockpit viewport in chest */}
      <rect x="20" y="22" width="24" height="18" rx="3" fill="#1a0800" />
      <rect x="22" y="24" width="20" height="14" rx="2" fill={c} opacity="0.15" />
      <ellipse cx="32" cy="31" rx="7" ry="5" fill={c} opacity="0.1" />
      <circle cx="32" cy="31" r="3" fill={c} opacity="0.3" />
      {/* main body */}
      <rect x="16" y="16" width="32" height="28" rx="3" fill="#1a0800" />
      {/* head */}
      <rect x="22" y="6" width="20" height="12" rx="2" fill="#1a0800" />
      <rect x="24" y="8" width="16" height="8" rx="1" fill="#220e00" />
      <line x1="24" y1="12" x2="40" y2="12" stroke={c} strokeWidth="2" opacity="0.6" />
      {/* massive shoulder cannons */}
      <rect x="4" y="12" width="14" height="8" rx="2" fill="#1a0800" />
      <rect x="4" y="10" width="14" height="5" rx="1.5" fill="#220e00" />
      <circle cx="5" cy="12.5" r="2" fill={c} opacity="0.7" />
      <rect x="46" y="12" width="14" height="8" rx="2" fill="#1a0800" />
      <rect x="46" y="10" width="14" height="5" rx="1.5" fill="#220e00" />
      <circle cx="59" cy="12.5" r="2" fill={c} opacity="0.7" />
      {/* thick legs with hydraulics */}
      <rect x="16" y="44" width="12" height="16" rx="2" fill="#1a0800" />
      <rect x="36" y="44" width="12" height="16" rx="2" fill="#1a0800" />
      {/* hydraulic lines */}
      <line x1="19" y1="46" x2="19" y2="58" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="24" y1="44" x2="24" y2="58" stroke={c} strokeWidth="1" opacity="0.3" />
      <line x1="39" y1="46" x2="39" y2="58" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="44" x2="44" y2="58" stroke={c} strokeWidth="1" opacity="0.3" />
      {/* knee joints */}
      <circle cx="22" cy="50" r="3" fill="#220e00" />
      <circle cx="42" cy="50" r="3" fill="#220e00" />
      <circle cx="22" cy="50" r="1.5" fill={c} opacity="0.5" />
      <circle cx="42" cy="50" r="1.5" fill={c} opacity="0.5" />
    </>
  );
}

function IconAI({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* outer glow ring */}
      <circle cx="32" cy="32" r="26" fill="none" stroke={c} strokeWidth="0.5" opacity="0.3" />
      <circle cx="32" cy="32" r="22" fill="none" stroke={c} strokeWidth="0.5" opacity="0.2" />
      {/* holographic brain orb */}
      <circle cx="32" cy="28" r="16" fill="#001a1a" opacity="0.9" />
      <circle cx="32" cy="28" r="15" fill={c} opacity="0.06" />
      {/* brain lobes */}
      <path d="M20 24 Q20 18 26 18 Q30 18 32 22 Q34 18 38 18 Q44 18 44 24 Q44 30 38 32 Q34 34 32 32 Q30 34 26 32 Q20 30 20 24 Z"
            fill={c} opacity="0.15" />
      <path d="M22 24 Q22 20 26 20 Q30 20 32 23 Q34 20 38 20 Q42 20 42 24 Q42 29 38 31 Q34 33 32 31 Q30 33 26 31 Q22 29 22 24 Z"
            fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
      {/* neural circuit lines */}
      <line x1="32" y1="12" x2="32" y2="18" stroke={c} strokeWidth="1" opacity="0.7" />
      <line x1="18" y1="22" x2="22" y2="24" stroke={c} strokeWidth="1" opacity="0.6" />
      <line x1="46" y1="22" x2="42" y2="24" stroke={c} strokeWidth="1" opacity="0.6" />
      <line x1="20" y1="34" x2="24" y2="31" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="34" x2="40" y2="31" stroke={c} strokeWidth="1" opacity="0.5" />
      {/* radiating data streams */}
      <line x1="32" y1="12" x2="28" y2="6" stroke={c} strokeWidth="0.8" opacity="0.5" />
      <line x1="32" y1="12" x2="36" y2="6" stroke={c} strokeWidth="0.8" opacity="0.5" />
      <line x1="18" y1="22" x2="12" y2="18" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="46" y1="22" x2="52" y2="18" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="20" y1="34" x2="12" y2="40" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="44" y1="34" x2="52" y2="40" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="32" y1="44" x2="32" y2="52" stroke={c} strokeWidth="0.8" opacity="0.5" />
      <line x1="32" y1="44" x2="26" y2="50" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="32" y1="44" x2="38" y2="50" stroke={c} strokeWidth="0.8" opacity="0.4" />
      {/* central glow */}
      <circle cx="32" cy="28" r="4" fill={c} opacity="0.3" />
      <circle cx="32" cy="28" r="2" fill={c} opacity="0.7" />
      <circle cx="32" cy="28" r="1" fill="white" opacity="0.9" />
      {/* node dots */}
      <circle cx="28" cy="6" r="1.5" fill={c} opacity="0.8" />
      <circle cx="36" cy="6" r="1.5" fill={c} opacity="0.8" />
      <circle cx="12" cy="18" r="1.5" fill={c} opacity="0.7" />
      <circle cx="52" cy="18" r="1.5" fill={c} opacity="0.7" />
      <circle cx="12" cy="40" r="1.5" fill={c} opacity="0.7" />
      <circle cx="52" cy="40" r="1.5" fill={c} opacity="0.7" />
      <circle cx="26" cy="50" r="1.5" fill={c} opacity="0.8" />
      <circle cx="38" cy="50" r="1.5" fill={c} opacity="0.8" />
    </>
  );
}

function IconElectricGolem({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* chunky rocky head */}
      <polygon points="22,4 42,4 46,10 42,16 22,16 18,10" fill="#1a1a00" />
      <polygon points="24,6 40,6 43,10 40,14 24,14 21,10" fill="#222200" />
      {/* eyes */}
      <circle cx="27" cy="10" r="2.5" fill={c} opacity="0.9" />
      <circle cx="37" cy="10" r="2.5" fill={c} opacity="0.9" />
      {/* jagged body */}
      <polygon points="14,18 18,16 22,18 22,48 14,48" fill="#1a1a00" />
      <polygon points="42,18 46,16 50,18 50,48 42,48" fill="#1a1a00" />
      <rect x="22" y="14" width="20" height="36" fill="#1a1a00" />
      <polygon points="22,14 32,10 42,14" fill="#222200" />
      {/* lightning from chest core */}
      <circle cx="32" cy="30" r="6" fill="#2a2a00" />
      <circle cx="32" cy="30" r="4" fill={c} opacity="0.3" />
      <circle cx="32" cy="30" r="2" fill={c} opacity="0.7" />
      {/* lightning bolts */}
      <polyline points="32,24 28,28 34,30 26,38" fill="none" stroke={c} strokeWidth="1.5" opacity="0.9" />
      <polyline points="32,24 36,28 30,30 38,38" fill="none" stroke={c} strokeWidth="1.5" opacity="0.9" />
      <polyline points="14,22 18,26 14,30 20,34" fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
      <polyline points="50,22 46,26 50,30 44,34" fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
      {/* rock shards */}
      <polygon points="12,20 14,16 16,20" fill="#2a2a00" />
      <polygon points="48,20 50,16 52,20" fill="#2a2a00" />
      <polygon points="16,44 14,48 18,48" fill="#2a2a00" />
      <polygon points="48,44 50,48 46,48" fill="#2a2a00" />
    </>
  );
}

function IconSandGolem({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* rough irregular head */}
      <path d="M20 14 Q18 8 24 6 Q28 4 32 5 Q36 4 40 6 Q46 8 44 14 Q44 20 38 22 Q34 24 32 23 Q30 24 26 22 Q20 20 20 14 Z"
            fill="#1a0a00" />
      {/* crumbling rocky texture patches */}
      <polygon points="22,12 24,8 26,12" fill="#221000" />
      <polygon points="38,12 40,8 42,12" fill="#221000" />
      <polygon points="28,20 30,16 32,20" fill="#221000" />
      {/* eyes (dull radioactive glow) */}
      <circle cx="27" cy="13" r="2.5" fill={c} opacity="0.7" />
      <circle cx="37" cy="13" r="2.5" fill={c} opacity="0.7" />
      {/* body rough */}
      <path d="M14 24 Q12 22 16 20 L20 22 L22 48 L42 48 L44 22 L48 20 Q52 22 50 24 Q48 38 46 50 L18 50 Q16 38 14 24 Z"
            fill="#1a0a00" />
      {/* sand texture spots */}
      <circle cx="22" cy="30" r="2" fill="#221000" />
      <circle cx="30" cy="26" r="1.5" fill="#221000" />
      <circle cx="38" cy="32" r="2" fill="#221000" />
      <circle cx="26" cy="40" r="1.5" fill="#221000" />
      <circle cx="36" cy="44" r="1.5" fill="#221000" />
      {/* radioactive symbol in chest */}
      <circle cx="32" cy="34" r="6" fill="#0d0600" />
      <circle cx="32" cy="34" r="4" fill={c} opacity="0.2" />
      {/* radiation trefoil */}
      <path d="M32 30 L30 34 L34 34 Z" fill={c} opacity="0.7" />
      <path d="M28 37 L30 34 L28 32 Z" fill={c} opacity="0.7" />
      <path d="M36 37 L34 34 L36 32 Z" fill={c} opacity="0.7" />
      <circle cx="32" cy="34" r="1.5" fill="#0d0600" />
    </>
  );
}

function IconArcaneGolem({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* crystalline head - diamond shapes */}
      <polygon points="32,2 40,10 36,20 28,20 24,10" fill="#140014" />
      <polygon points="32,4 39,11 35,19 29,19 25,11" fill="#1a001a" />
      {/* crystal eye facets */}
      <polygon points="28,10 32,8 36,10 32,14" fill={c} opacity="0.7" />
      {/* geometric crystal body */}
      <polygon points="20,20 44,20 50,32 44,48 20,48 14,32" fill="#140014" />
      <polygon points="22,22 42,22 48,32 42,46 22,46 16,32" fill="#1a001a" />
      {/* body facet lines */}
      <line x1="32" y1="20" x2="32" y2="48" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="20" y1="32" x2="44" y2="32" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="22" y1="22" x2="42" y2="46" stroke={c} strokeWidth="0.5" opacity="0.3" />
      <line x1="42" y1="22" x2="22" y2="46" stroke={c} strokeWidth="0.5" opacity="0.3" />
      {/* central arcane core */}
      <polygon points="32,26 36,30 32,38 28,30" fill={c} opacity="0.3" />
      <circle cx="32" cy="32" r="3" fill={c} opacity="0.5" />
      <circle cx="32" cy="32" r="1.5" fill="white" opacity="0.7" />
      {/* floating runes */}
      <text x="10" y="16" fontSize="6" fill={c} opacity="0.6" fontFamily="monospace">✦</text>
      <text x="48" y="16" fontSize="6" fill={c} opacity="0.6" fontFamily="monospace">✦</text>
      <text x="10" y="48" fontSize="6" fill={c} opacity="0.5" fontFamily="monospace">✧</text>
      <text x="48" y="48" fontSize="6" fill={c} opacity="0.5" fontFamily="monospace">✧</text>
      {/* diamond shoulder crystals */}
      <polygon points="14,26 18,22 20,28 16,32" fill={c} opacity="0.4" />
      <polygon points="50,26 46,22 44,28 48,32" fill={c} opacity="0.4" />
    </>
  );
}

function IconRat({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* hunched body */}
      <ellipse cx="32" cy="34" rx="18" ry="14" fill="#0d1400" />
      {/* head */}
      <ellipse cx="44" cy="24" rx="10" ry="8" fill="#0d1400" />
      {/* snout */}
      <ellipse cx="52" cy="24" rx="4" ry="3" fill="#111a00" />
      {/* red glowing eyes */}
      <circle cx="46" cy="21" r="2" fill="#ff2222" opacity="0.9" />
      <circle cx="42" cy="22" r="1.5" fill="#ff2222" opacity="0.8" />
      {/* ears */}
      <ellipse cx="38" cy="16" rx="4" ry="5" fill="#0d1400" />
      <ellipse cx="46" cy="15" rx="3" ry="4" fill="#0d1400" />
      {/* nose */}
      <circle cx="54" cy="25" r="1.5" fill="#ff5555" opacity="0.7" />
      {/* cybernetic back implants */}
      <rect x="16" y="22" width="16" height="10" rx="2" fill="#112200" />
      <rect x="17" y="23" width="14" height="8" rx="1" fill="#1a3300" />
      <circle cx="20" cy="27" r="2" fill={c} opacity="0.6" />
      <circle cx="26" cy="27" r="2" fill={c} opacity="0.6" />
      <circle cx="32" cy="27" r="2" fill={c} opacity="0.6" />
      {/* implant connectors on spine */}
      <line x1="20" y1="22" x2="20" y2="18" stroke={c} strokeWidth="1.5" opacity="0.7" />
      <line x1="26" y1="22" x2="26" y2="16" stroke={c} strokeWidth="1.5" opacity="0.7" />
      <line x1="32" y1="22" x2="32" y2="18" stroke={c} strokeWidth="1.5" opacity="0.7" />
      {/* long tail */}
      <path d="M14 40 Q8 44 6 50 Q4 54 8 56" fill="none" stroke="#0d1400" strokeWidth="3" strokeLinecap="round" />
      {/* legs */}
      <ellipse cx="20" cy="46" rx="5" ry="4" fill="#0d1400" />
      <ellipse cx="44" cy="46" rx="5" ry="4" fill="#0d1400" />
    </>
  );
}

function IconCyberAnimal({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* sleek panther/dog body in pounce */}
      <ellipse cx="32" cy="32" rx="20" ry="10" fill="#001a1a" transform="rotate(-15 32 32)" />
      {/* head lunging forward */}
      <ellipse cx="50" cy="22" rx="9" ry="7" fill="#001a1a" />
      {/* jaw open */}
      <path d="M46 22 Q50 28 56 26 L56 22 Z" fill="#001a1a" />
      {/* glowing eye */}
      <circle cx="52" cy="20" r="2.5" fill={c} opacity="0.9" />
      <circle cx="52" cy="20" r="1" fill="white" opacity="0.7" />
      {/* teeth */}
      <polygon points="48,24 50,28 52,24" fill="white" opacity="0.7" />
      <polygon points="52,24 54,28 56,24" fill="white" opacity="0.7" />
      {/* mechanical front legs */}
      <line x1="44" y1="34" x2="40" y2="46" stroke="#001a1a" strokeWidth="5" strokeLinecap="round" />
      <line x1="36" y1="36" x2="30" y2="48" stroke="#001a1a" strokeWidth="5" strokeLinecap="round" />
      {/* joint circles on legs */}
      <circle cx="42" cy="38" r="3" fill="#002a2a" />
      <circle cx="42" cy="38" r="1.5" fill={c} opacity="0.6" />
      <circle cx="34" cy="40" r="3" fill="#002a2a" />
      <circle cx="34" cy="40" r="1.5" fill={c} opacity="0.6" />
      {/* back legs */}
      <line x1="20" y1="34" x2="14" y2="46" stroke="#001a1a" strokeWidth="5" strokeLinecap="round" />
      <line x1="26" y1="36" x2="22" y2="48" stroke="#001a1a" strokeWidth="5" strokeLinecap="round" />
      {/* spine neon line */}
      <path d="M14 30 Q22 26 32 28 Q42 26 50 22" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      {/* tail curved */}
      <path d="M12 28 Q6 22 8 16 Q10 10 14 12" fill="none" stroke="#001a1a" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function IconWolf({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* wolf head angular */}
      <polygon points="22,16 42,16 46,22 42,30 22,30 18,22" fill="#0a1020" />
      {/* snout */}
      <polygon points="28,26 36,26 38,32 32,34 26,32" fill="#0d1428" />
      {/* pale blue eyes */}
      <circle cx="26" cy="21" r="2.5" fill={c} opacity="0.9" />
      <circle cx="38" cy="21" r="2.5" fill={c} opacity="0.9" />
      {/* ears pointy */}
      <polygon points="22,16 18,6 26,14" fill="#0a1020" />
      <polygon points="42,16 46,6 38,14" fill="#0a1020" />
      {/* nose */}
      <ellipse cx="32" cy="29" rx="2" ry="1.5" fill="#334466" />
      {/* bared teeth */}
      <line x1="28" y1="32" x2="36" y2="32" stroke="white" strokeWidth="1" opacity="0.6" />
      <polygon points="29,32 30,35 31,32" fill="white" opacity="0.6" />
      <polygon points="32,32 33,35 34,32" fill="white" opacity="0.6" />
      {/* body */}
      <path d="M16 30 Q12 32 10 42 L10 54 L54 54 L54 42 Q52 32 48 30 Z" fill="#0a1020" />
      {/* cybernetic spine visible */}
      <line x1="20" y1="30" x2="44" y2="30" stroke={c} strokeWidth="2" opacity="0.5" />
      <circle cx="24" cy="30" r="2" fill={c} opacity="0.5" />
      <circle cx="32" cy="30" r="2" fill={c} opacity="0.5" />
      <circle cx="40" cy="30" r="2" fill={c} opacity="0.5" />
      {/* front legs */}
      <rect x="14" y="42" width="8" height="14" rx="3" fill="#0a1020" />
      <rect x="42" y="42" width="8" height="14" rx="3" fill="#0a1020" />
      {/* angular ribcage suggestion */}
      <line x1="20" y1="36" x2="18" y2="42" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <line x1="24" y1="34" x2="22" y2="42" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <line x1="44" y1="36" x2="46" y2="42" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <line x1="40" y1="34" x2="42" y2="42" stroke={c} strokeWidth="0.8" opacity="0.3" />
    </>
  );
}

function IconBear({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* massive head */}
      <ellipse cx="32" cy="16" rx="16" ry="14" fill="#1a0800" />
      {/* ears */}
      <circle cx="18" cy="6" r="5" fill="#1a0800" />
      <circle cx="46" cy="6" r="5" fill="#1a0800" />
      {/* small eyes with radiation scar */}
      <circle cx="25" cy="14" r="2.5" fill="#330e00" />
      <circle cx="25" cy="14" r="1.5" fill={c} opacity="0.7" />
      <circle cx="39" cy="14" r="2.5" fill="#330e00" />
      <circle cx="39" cy="14" r="1.5" fill={c} opacity="0.7" />
      {/* snout */}
      <ellipse cx="32" cy="22" rx="7" ry="5" fill="#220e00" />
      {/* scarring lines on face */}
      <line x1="22" y1="10" x2="18" y2="16" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="42" y1="10" x2="46" y2="16" stroke={c} strokeWidth="1" opacity="0.4" />
      {/* massive hunched body */}
      <path d="M8 28 Q4 30 4 46 L4 58 L60 58 L60 46 Q60 30 56 28 Q46 22 32 22 Q18 22 8 28 Z" fill="#1a0800" />
      {/* mechanical claw arm left */}
      <rect x="2" y="28" width="12" height="20" rx="4" fill="#333" />
      <line x1="4" y1="32" x2="4" y2="44" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="9" y1="30" x2="9" y2="44" stroke={c} strokeWidth="1" opacity="0.4" />
      {/* claw fingers */}
      <line x1="2" y1="46" x2="0" y2="52" stroke="#555" strokeWidth="3" strokeLinecap="round" />
      <line x1="6" y1="48" x2="4" y2="54" stroke="#555" strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="48" x2="10" y2="54" stroke="#555" strokeWidth="3" strokeLinecap="round" />
      {/* radiation marks on body */}
      <circle cx="28" cy="38" r="3" fill={c} opacity="0.2" />
      <line x1="26" y1="36" x2="22" y2="32" stroke={c} strokeWidth="1" opacity="0.3" />
      <line x1="30" y1="35" x2="28" y2="30" stroke={c} strokeWidth="1" opacity="0.3" />
      <line x1="24" y1="38" x2="18" y2="38" stroke={c} strokeWidth="1" opacity="0.3" />
    </>
  );
}

function IconSpider({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* engorged abdomen back */}
      <ellipse cx="22" cy="38" rx="14" ry="12" fill="#0d1400" />
      {/* thorax/body front */}
      <ellipse cx="38" cy="32" rx="10" ry="9" fill="#0d1400" />
      {/* multiple eyes */}
      <circle cx="36" cy="28" r="2" fill={c} opacity="0.9" />
      <circle cx="40" cy="27" r="2" fill={c} opacity="0.9" />
      <circle cx="44" cy="29" r="1.5" fill={c} opacity="0.8" />
      <circle cx="34" cy="31" r="1.5" fill={c} opacity="0.7" />
      {/* chelicerae fangs */}
      <line x1="40" y1="38" x2="44" y2="44" stroke="#0d1400" strokeWidth="3" strokeLinecap="round" />
      <line x1="42" y1="38" x2="48" y2="43" stroke="#0d1400" strokeWidth="3" strokeLinecap="round" />
      {/* 8 legs — 4 organic, 4 mechanical alternating */}
      {/* organic legs left */}
      <line x1="30" y1="30" x2="16" y2="20" stroke="#0d1400" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="34" x2="12" y2="30" stroke="#0d1400" strokeWidth="3" strokeLinecap="round" />
      {/* mechanical legs left (with joints) */}
      <line x1="28" y1="38" x2="10" y2="40" stroke="#1a2200" strokeWidth="3" strokeLinecap="round" />
      <circle cx="19" cy="39" r="2.5" fill="#1a2200" />
      <circle cx="19" cy="39" r="1.5" fill={c} opacity="0.5" />
      <line x1="26" y1="42" x2="10" y2="52" stroke="#1a2200" strokeWidth="3" strokeLinecap="round" />
      {/* legs right */}
      <line x1="44" y1="30" x2="58" y2="20" stroke="#0d1400" strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="34" x2="60" y2="30" stroke="#0d1400" strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="38" x2="60" y2="40" stroke="#1a2200" strokeWidth="3" strokeLinecap="round" />
      <circle cx="53" cy="39" r="2.5" fill="#1a2200" />
      <circle cx="53" cy="39" r="1.5" fill={c} opacity="0.5" />
      <line x1="44" y1="42" x2="56" y2="52" stroke="#1a2200" strokeWidth="3" strokeLinecap="round" />
      {/* abdomen markings */}
      <ellipse cx="22" cy="38" rx="6" ry="5" fill={c} opacity="0.1" />
      <line x1="22" y1="28" x2="22" y2="48" stroke={c} strokeWidth="0.8" opacity="0.4" />
    </>
  );
}

function IconCockroach({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* segmented body viewed from above */}
      {/* head */}
      <ellipse cx="32" cy="10" rx="8" ry="7" fill="#111a00" />
      {/* antennae */}
      <line x1="26" y1="6" x2="14" y2="2" stroke="#0d1400" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="6" x2="50" y2="2" stroke="#0d1400" strokeWidth="1.5" strokeLinecap="round" />
      {/* antennae tips */}
      <circle cx="14" cy="2" r="1.5" fill={c} opacity="0.6" />
      <circle cx="50" cy="2" r="1.5" fill={c} opacity="0.6" />
      {/* thorax */}
      <ellipse cx="32" cy="22" rx="12" ry="10" fill="#111a00" />
      {/* wings slightly spread */}
      <ellipse cx="18" cy="24" rx="10" ry="6" fill="#162200" transform="rotate(-20 18 24)" />
      <ellipse cx="46" cy="24" rx="10" ry="6" fill="#162200" transform="rotate(20 46 24)" />
      {/* wing venation lines */}
      <line x1="12" y1="22" x2="26" y2="28" stroke={c} strokeWidth="0.5" opacity="0.3" />
      <line x1="14" y1="26" x2="26" y2="30" stroke={c} strokeWidth="0.5" opacity="0.3" />
      <line x1="52" y1="22" x2="38" y2="28" stroke={c} strokeWidth="0.5" opacity="0.3" />
      <line x1="50" y1="26" x2="38" y2="30" stroke={c} strokeWidth="0.5" opacity="0.3" />
      {/* abdomen segments */}
      <ellipse cx="32" cy="36" rx="10" ry="8" fill="#111a00" />
      <ellipse cx="32" cy="46" rx="8" ry="6" fill="#111a00" />
      <ellipse cx="32" cy="54" rx="5" ry="4" fill="#111a00" />
      {/* segment lines */}
      <line x1="22" y1="36" x2="42" y2="36" stroke={c} strokeWidth="0.6" opacity="0.3" />
      <line x1="24" y1="44" x2="40" y2="44" stroke={c} strokeWidth="0.6" opacity="0.3" />
      {/* 6 legs */}
      <line x1="22" y1="20" x2="8" y2="16" stroke="#111a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="24" x2="6" y2="24" stroke="#111a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="28" x2="8" y2="34" stroke="#111a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="20" x2="56" y2="16" stroke="#111a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="24" x2="58" y2="24" stroke="#111a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="28" x2="56" y2="34" stroke="#111a00" strokeWidth="2" strokeLinecap="round" />
      {/* compound eyes */}
      <circle cx="27" cy="9" r="2" fill={c} opacity="0.7" />
      <circle cx="37" cy="9" r="2" fill={c} opacity="0.7" />
    </>
  );
}

function IconGhost({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* wispy dissolving form, bottom fades into wisps */}
      <path d="M20 20 Q16 18 16 28 Q16 40 20 46 Q26 52 32 50 Q38 52 44 46 Q48 40 48 28 Q48 18 44 20 Q40 14 32 12 Q24 14 20 20 Z"
            fill={c} opacity="0.12" />
      {/* main ghostly body */}
      <path d="M22 22 Q18 20 18 30 Q18 40 22 44 Q28 50 32 48 Q36 50 42 44 Q46 40 46 30 Q46 20 42 22 Q38 16 32 14 Q26 16 22 22 Z"
            fill={c} opacity="0.2" />
      {/* inner glow core */}
      <ellipse cx="32" cy="30" rx="10" ry="14" fill={c} opacity="0.12" />
      {/* dissolving wisps at bottom */}
      <path d="M24 46 Q22 52 20 58" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M28 48 Q27 54 26 60" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M32 50 Q32 56 32 62" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M36 48 Q37 54 38 60" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M40 46 Q42 52 44 58" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* inner bright glow */}
      <ellipse cx="32" cy="28" rx="7" ry="9" fill={c} opacity="0.1" />
      <circle cx="32" cy="26" r="4" fill={c} opacity="0.15" />
      {/* hollow eyes */}
      <ellipse cx="27" cy="26" rx="3" ry="4" fill={c} opacity="0.5" />
      <ellipse cx="37" cy="26" rx="3" ry="4" fill={c} opacity="0.5" />
      <circle cx="27" cy="26" r="1.5" fill="white" opacity="0.4" />
      <circle cx="37" cy="26" r="1.5" fill="white" opacity="0.4" />
      {/* mouth slot */}
      <path d="M28 36 Q30 38 32 38 Q34 38 36 36" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5" />
      {/* energy wisp particles around body */}
      <circle cx="16" cy="24" r="1.5" fill={c} opacity="0.4" />
      <circle cx="48" cy="24" r="1.5" fill={c} opacity="0.4" />
      <circle cx="14" cy="34" r="1" fill={c} opacity="0.3" />
      <circle cx="50" cy="34" r="1" fill={c} opacity="0.3" />
    </>
  );
}

function IconGhul({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* gaunt skull head */}
      <ellipse cx="32" cy="12" rx="10" ry="12" fill="#0d1a00" />
      {/* hollow eye sockets */}
      <ellipse cx="26" cy="10" rx="4" ry="5" fill="#040a00" />
      <ellipse cx="38" cy="10" rx="4" ry="5" fill="#040a00" />
      {/* glowing eyes inside sockets */}
      <circle cx="26" cy="10" r="2.5" fill={c} opacity="0.6" />
      <circle cx="38" cy="10" r="2.5" fill={c} opacity="0.6" />
      {/* jaw open, teeth */}
      <path d="M24 18 Q28 22 32 22 Q36 22 40 18" fill="none" stroke="#0d1a00" strokeWidth="2" />
      <line x1="27" y1="20" x2="26" y2="24" stroke="#aaaaaa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="30" y1="22" x2="29" y2="26" stroke="#aaaaaa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="34" y1="22" x2="35" y2="26" stroke="#aaaaaa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="37" y1="20" x2="38" y2="24" stroke="#aaaaaa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* gaunt body with exposed ribs */}
      <path d="M20 24 L16 52 L48 52 L44 24 Q38 20 32 20 Q26 20 20 24 Z" fill="#0d1a00" />
      {/* rib lines */}
      <line x1="24" y1="28" x2="40" y2="28" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="22" y1="32" x2="42" y2="32" stroke={c} strokeWidth="1" opacity="0.4" />
      <line x1="22" y1="36" x2="42" y2="36" stroke={c} strokeWidth="1" opacity="0.35" />
      <line x1="22" y1="40" x2="42" y2="40" stroke={c} strokeWidth="1" opacity="0.3" />
      {/* spine */}
      <line x1="32" y1="24" x2="32" y2="52" stroke={c} strokeWidth="1.5" opacity="0.3" />
      {/* arms reaching forward */}
      <line x1="22" y1="28" x2="6" y2="38" stroke="#0d1a00" strokeWidth="4" strokeLinecap="round" />
      <line x1="42" y1="28" x2="58" y2="38" stroke="#0d1a00" strokeWidth="4" strokeLinecap="round" />
      {/* grasping hands / claws */}
      <line x1="6" y1="38" x2="2" y2="44" stroke="#0d1a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="38" x2="4" y2="46" stroke="#0d1a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="38" x2="8" y2="46" stroke="#0d1a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="38" x2="62" y2="44" stroke="#0d1a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="38" x2="60" y2="46" stroke="#0d1a00" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="38" x2="56" y2="46" stroke="#0d1a00" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function IconDemon({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* horned head */}
      <ellipse cx="32" cy="14" rx="10" ry="10" fill="#1a0000" />
      {/* horns */}
      <polygon points="24,8 20,0 26,10" fill="#220000" />
      <polygon points="40,8 44,0 38,10" fill="#220000" />
      {/* glowing red eyes */}
      <circle cx="27" cy="13" r="2.5" fill={c} opacity="0.9" />
      <circle cx="37" cy="13" r="2.5" fill={c} opacity="0.9" />
      {/* fanged mouth */}
      <path d="M26 20 Q29 24 32 22 Q35 24 38 20" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      <polygon points="28,21 29,25 30,21" fill="white" opacity="0.6" />
      <polygon points="34,21 35,25 36,21" fill="white" opacity="0.6" />
      {/* cybernetic wings */}
      <path d="M20 22 Q6 14 4 24 Q4 34 16 30 Q18 30 22 26 Z" fill="#1a0000" />
      <path d="M44 22 Q58 14 60 24 Q60 34 48 30 Q46 30 42 26 Z" fill="#1a0000" />
      {/* wing circuit lines */}
      <line x1="20" y1="22" x2="8" y2="18" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="20" y1="24" x2="6" y2="26" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="44" y1="22" x2="56" y2="18" stroke={c} strokeWidth="0.8" opacity="0.4" />
      <line x1="44" y1="24" x2="58" y2="26" stroke={c} strokeWidth="0.8" opacity="0.4" />
      {/* muscular body */}
      <path d="M18 24 L14 54 L50 54 L46 24 Q40 18 32 18 Q24 18 18 24 Z" fill="#1a0000" />
      {/* glowing red energy core chest */}
      <circle cx="32" cy="36" r="7" fill="#2a0000" />
      <circle cx="32" cy="36" r="5" fill={c} opacity="0.2" />
      <circle cx="32" cy="36" r="3" fill={c} opacity="0.5" />
      <circle cx="32" cy="36" r="1.5" fill="white" opacity="0.8" />
      {/* clawed hands */}
      <line x1="16" y1="40" x2="10" y2="46" stroke="#1a0000" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="44" x2="8" y2="48" stroke="#1a0000" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="40" x2="12" y2="50" stroke="#1a0000" strokeWidth="3" strokeLinecap="round" />
      <line x1="48" y1="40" x2="54" y2="46" stroke="#1a0000" strokeWidth="3" strokeLinecap="round" />
      <line x1="48" y1="44" x2="56" y2="48" stroke="#1a0000" strokeWidth="3" strokeLinecap="round" />
      <line x1="48" y1="40" x2="52" y2="50" stroke="#1a0000" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function IconDragon({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* coiled serpentine body */}
      <path d="M50 48 Q58 42 56 32 Q54 20 44 14 Q36 8 28 10 Q18 12 14 22 Q10 32 14 40 Q18 50 28 52 Q38 56 46 52 Q54 48 50 48 Z"
            fill="none" stroke={c} strokeWidth="3" opacity="0.7" />
      <path d="M50 48 Q58 42 56 32 Q54 20 44 14 Q36 8 28 10 Q18 12 14 22 Q10 32 14 40 Q18 50 28 52 Q38 56 46 52 Q54 48 50 48 Z"
            fill="#1a0011" />
      {/* fierce angular head */}
      <polygon points="44,14 54,8 56,18 50,22 44,20" fill="#1a0011" />
      {/* eye */}
      <circle cx="52" cy="13" r="2.5" fill={c} opacity="0.9" />
      <circle cx="52" cy="13" r="1" fill="white" opacity="0.7" />
      {/* horn */}
      <polygon points="54,8 58,2 56,10" fill="#220018" />
      {/* jaw/teeth */}
      <path d="M50,20 Q54,22 56,18" fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
      <polygon points="51,20 52,24 53,20" fill="white" opacity="0.5" />
      <polygon points="53,20 54,23 55,20" fill="white" opacity="0.5" />
      {/* wings spread */}
      <path d="M28 14 Q14 6 8 14 Q4 22 12 24 Q18 26 24 22 Q26 18 28 14 Z" fill="#200014" />
      <path d="M36 10 Q30 2 22 4 Q16 8 18 16 Q22 20 28 18 Q32 14 36 10 Z" fill="#200014" />
      {/* wing neon outline */}
      <path d="M28 14 Q14 6 8 14 Q4 22 12 24 Q18 26 24 22" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      <path d="M36 10 Q30 2 22 4 Q16 8 18 16 Q22 20 28 18" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      {/* body scale suggestion */}
      <path d="M44 14 Q40 18 36 24 Q32 30 30 36 Q28 44 30 52" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5" />
      {/* scale dots */}
      <circle cx="40" cy="20" r="1.5" fill={c} opacity="0.5" />
      <circle cx="36" cy="28" r="1.5" fill={c} opacity="0.4" />
      <circle cx="32" cy="36" r="1.5" fill={c} opacity="0.4" />
      <circle cx="30" cy="44" r="1.5" fill={c} opacity="0.3" />
      {/* tail tip */}
      <line x1="30" y1="52" x2="28" y2="58" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="28" y1="58" x2="32" y2="62" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </>
  );
}

function IconSoldier({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* combat helmet */}
      <path d="M22 12 Q22 4 32 4 Q42 4 42 12 L42 18 L22 18 Z" fill="#1a2008" />
      <rect x="20" y="16" width="24" height="5" rx="2" fill="#222a0c" />
      {/* night-vision visor */}
      <rect x="24" y="11" width="7" height="5" rx="1.5" fill={c} opacity="0.85" />
      <rect x="33" y="11" width="7" height="5" rx="1.5" fill={c} opacity="0.85" />
      <line x1="31" y1="13" x2="33" y2="13" stroke="#1a2008" strokeWidth="1" />
      {/* armored torso + plate carrier */}
      <path d="M16 22 L14 50 L50 50 L48 22 Q40 18 32 18 Q24 18 16 22 Z" fill="#1a2008" />
      <rect x="22" y="24" width="20" height="18" rx="2" fill="#222a0c" />
      {/* mag pouches */}
      <rect x="24" y="30" width="5" height="8" rx="1" fill="#2c3410" />
      <rect x="30" y="30" width="5" height="8" rx="1" fill="#2c3410" />
      <rect x="36" y="30" width="4" height="8" rx="1" fill="#2c3410" />
      {/* shoulder pads */}
      <rect x="10" y="22" width="9" height="12" rx="3" fill="#222a0c" />
      <rect x="45" y="22" width="9" height="12" rx="3" fill="#222a0c" />
      {/* assault rifle held across body */}
      <line x1="12" y1="46" x2="50" y2="30" stroke="#0d1004" strokeWidth="4" strokeLinecap="round" />
      <rect x="30" y="33" width="10" height="4" rx="1" fill="#11160a" transform="rotate(-22 35 35)" />
      <circle cx="50" cy="30" r="1.6" fill={c} opacity="0.7" />
      {/* status light */}
      <circle cx="32" cy="46" r="1.4" fill={c} opacity="0.8" />
    </>
  );
}

function IconBio({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* dripping mutant blob body */}
      <path d="M14 30 Q12 16 26 14 Q32 10 40 14 Q52 16 50 32 Q52 44 44 50 Q38 56 32 52 Q26 56 20 50 Q12 44 14 30 Z"
            fill="#0a1a04" />
      <path d="M18 30 Q16 20 28 18 Q32 16 38 18 Q48 20 46 32 Q48 42 42 47 Q36 52 32 48 Q28 52 22 47 Q16 42 18 30 Z"
            fill={c} opacity="0.12" />
      {/* drips */}
      <path d="M22 50 Q21 56 22 60" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" fill="none" />
      <path d="M42 50 Q43 55 42 59" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" fill="none" />
      <circle cx="22" cy="61" r="1.5" fill={c} opacity="0.5" />
      <circle cx="42" cy="60" r="1.5" fill={c} opacity="0.5" />
      {/* glowing toxic eyes */}
      <circle cx="26" cy="28" r="3.5" fill="#0a1a04" />
      <circle cx="38" cy="28" r="3.5" fill="#0a1a04" />
      <circle cx="26" cy="28" r="2" fill={c} opacity="0.9" />
      <circle cx="38" cy="28" r="2" fill={c} opacity="0.9" />
      {/* biohazard symbol on core */}
      <circle cx="32" cy="38" r="6" fill="#0a1a04" />
      <circle cx="32" cy="38" r="2" fill="none" stroke={c} strokeWidth="1.2" opacity="0.8" />
      <path d="M32 38 L32 33 M32 38 L36 41 M32 38 L28 41" stroke={c} strokeWidth="1.2" opacity="0.8" />
      <circle cx="32" cy="33" r="1.6" fill="none" stroke={c} strokeWidth="1" opacity="0.8" />
      <circle cx="36.5" cy="41" r="1.6" fill="none" stroke={c} strokeWidth="1" opacity="0.8" />
      <circle cx="27.5" cy="41" r="1.6" fill="none" stroke={c} strokeWidth="1" opacity="0.8" />
      {/* spore bubbles */}
      <circle cx="16" cy="20" r="1.5" fill={c} opacity="0.5" />
      <circle cx="48" cy="22" r="1.5" fill={c} opacity="0.5" />
      <circle cx="20" cy="44" r="1" fill={c} opacity="0.4" />
      <circle cx="46" cy="42" r="1" fill={c} opacity="0.4" />
    </>
  );
}

function IconBerserker({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* rage aura */}
      <circle cx="32" cy="32" r="28" fill={c} opacity="0.05" />
      {/* hunched brute head */}
      <ellipse cx="32" cy="16" rx="9" ry="8" fill="#1a0604" />
      {/* furious eyes */}
      <polygon points="25,15 30,14 29,18 25,18" fill={c} opacity="0.9" />
      <polygon points="39,15 34,14 35,18 39,18" fill={c} opacity="0.9" />
      {/* snarling mouth */}
      <path d="M27 21 L37 21 L35 24 L29 24 Z" fill="#0d0302" />
      <polygon points="29,21 30,24 31,21" fill="white" opacity="0.6" />
      <polygon points="33,21 34,24 35,21" fill="white" opacity="0.6" />
      {/* massive hunched shoulders/torso */}
      <path d="M8 30 Q6 24 14 22 Q22 20 32 22 Q42 20 50 22 Q58 24 56 30 L52 50 L12 50 Z" fill="#1a0604" />
      {/* chest core */}
      <circle cx="32" cy="34" r="5" fill="#2a0a06" />
      <circle cx="32" cy="34" r="3" fill={c} opacity="0.4" />
      <circle cx="32" cy="34" r="1.4" fill="white" opacity="0.8" />
      {/* arm blades (left) */}
      <line x1="12" y1="30" x2="4" y2="42" stroke="#1a0604" strokeWidth="6" strokeLinecap="round" />
      <polygon points="4,42 0,52 6,46 8,40" fill="#3a1008" />
      <line x1="2" y1="46" x2="5" y2="44" stroke={c} strokeWidth="1" opacity="0.7" />
      {/* arm blades (right) */}
      <line x1="52" y1="30" x2="60" y2="42" stroke="#1a0604" strokeWidth="6" strokeLinecap="round" />
      <polygon points="60,42 64,52 58,46 56,40" fill="#3a1008" />
      <line x1="62" y1="46" x2="59" y2="44" stroke={c} strokeWidth="1" opacity="0.7" />
      {/* rage cracks on torso */}
      <polyline points="24,38 26,42 23,46" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      <polyline points="40,38 38,42 41,46" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
    </>
  );
}

function IconPlasma({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* containment ring */}
      <circle cx="32" cy="32" r="24" fill="none" stroke={c} strokeWidth="0.6" opacity="0.3" />
      {/* glowing energy body */}
      <path d="M32 8 Q26 18 24 26 Q20 30 22 38 Q24 48 32 54 Q40 48 42 38 Q44 30 40 26 Q38 18 32 8 Z"
            fill={c} opacity="0.18" />
      <path d="M32 12 Q28 20 27 28 Q24 32 26 38 Q28 46 32 50 Q36 46 38 38 Q40 32 37 28 Q36 20 32 12 Z"
            fill={c} opacity="0.3" />
      {/* bright core */}
      <ellipse cx="32" cy="32" rx="5" ry="9" fill={c} opacity="0.6" />
      <ellipse cx="32" cy="32" rx="2.5" ry="6" fill="white" opacity="0.85" />
      {/* plasma eyes */}
      <circle cx="28" cy="24" r="1.6" fill="white" opacity="0.9" />
      <circle cx="36" cy="24" r="1.6" fill="white" opacity="0.9" />
      {/* arcing electricity */}
      <polyline points="22,26 16,22 20,30 12,28" fill="none" stroke={c} strokeWidth="1" opacity="0.7" />
      <polyline points="42,26 48,22 44,30 52,28" fill="none" stroke={c} strokeWidth="1" opacity="0.7" />
      <polyline points="26,48 22,54 28,52 24,58" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      <polyline points="38,48 42,54 36,52 40,58" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      {/* floating sparks */}
      <circle cx="14" cy="20" r="1.4" fill={c} opacity="0.7" />
      <circle cx="50" cy="20" r="1.4" fill={c} opacity="0.7" />
      <circle cx="18" cy="44" r="1" fill={c} opacity="0.5" />
      <circle cx="46" cy="44" r="1" fill={c} opacity="0.5" />
    </>
  );
}

function IconCommander({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* crown */}
      <polygon points="22,8 26,2 30,8 32,2 34,8 38,2 42,8 42,12 22,12" fill={c} opacity="0.85" />
      <circle cx="26" cy="3" r="1" fill="white" opacity="0.8" />
      <circle cx="32" cy="1.5" r="1.2" fill="white" opacity="0.9" />
      <circle cx="38" cy="3" r="1" fill="white" opacity="0.8" />
      {/* head */}
      <ellipse cx="32" cy="17" rx="8" ry="8" fill="#1a1500" />
      {/* cybernetic eye */}
      <circle cx="35" cy="16" r="2.5" fill={c} opacity="0.5" />
      <circle cx="35" cy="16" r="1.2" fill={c} opacity="0.9" />
      <circle cx="29" cy="16" r="1.4" fill={c} opacity="0.7" />
      {/* armored regal torso */}
      <path d="M16 24 L12 52 L52 52 L48 24 Q40 20 32 22 Q24 20 16 24 Z" fill="#1a1500" />
      {/* cape over shoulders */}
      <path d="M14 24 Q8 30 10 52 L18 52 L20 26 Z" fill="#241c00" opacity="0.9" />
      <path d="M50 24 Q56 30 54 52 L46 52 L44 26 Z" fill="#241c00" opacity="0.9" />
      {/* chest insignia */}
      <polygon points="32,28 35,34 32,40 29,34" fill={c} opacity="0.4" />
      <circle cx="32" cy="34" r="2" fill={c} opacity="0.8" />
      {/* rank bars */}
      <rect x="24" y="30" width="5" height="2" rx="1" fill={c} opacity="0.6" />
      <rect x="35" y="30" width="5" height="2" rx="1" fill={c} opacity="0.6" />
      <rect x="24" y="44" width="16" height="2" rx="1" fill={c} opacity="0.4" />
      {/* shoulder epaulets */}
      <rect x="12" y="24" width="8" height="5" rx="2" fill={c} opacity="0.5" />
      <rect x="44" y="24" width="8" height="5" rx="2" fill={c} opacity="0.5" />
    </>
  );
}

function IconPsi({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* swirling vortex arms */}
      <path d="M32 32 Q44 14 56 22 Q44 20 38 30" fill="none" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      <path d="M32 32 Q50 44 42 56 Q44 44 34 38" fill="none" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      <path d="M32 32 Q20 50 8 42 Q20 44 26 34" fill="none" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      <path d="M32 32 Q14 20 22 8 Q20 20 30 26" fill="none" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      {/* inner swirl */}
      <path d="M32 32 Q40 24 48 28" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <path d="M32 32 Q24 40 16 36" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      {/* central psionic eye */}
      <ellipse cx="32" cy="32" rx="9" ry="11" fill="#14001a" />
      <ellipse cx="32" cy="32" rx="7" ry="9" fill={c} opacity="0.25" />
      <ellipse cx="32" cy="32" rx="3.5" ry="5" fill={c} opacity="0.6" />
      <ellipse cx="32" cy="32" rx="1.5" ry="3" fill="white" opacity="0.85" />
      {/* psi sparks */}
      <circle cx="32" cy="14" r="1.6" fill={c} opacity="0.8" />
      <circle cx="52" cy="22" r="1.4" fill={c} opacity="0.7" />
      <circle cx="50" cy="48" r="1.4" fill={c} opacity="0.7" />
      <circle cx="12" cy="44" r="1.4" fill={c} opacity="0.7" />
      <circle cx="14" cy="20" r="1.4" fill={c} opacity="0.7" />
    </>
  );
}

function IconGlitch({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* fragmented humanoid silhouette */}
      <rect x="24" y="8" width="16" height="14" fill="#16000a" />
      <rect x="20" y="22" width="24" height="20" fill="#16000a" />
      <rect x="24" y="42" width="6" height="14" fill="#16000a" />
      <rect x="34" y="42" width="6" height="14" fill="#16000a" />
      {/* displaced glitch slices (chromatic shift) */}
      <rect x="18" y="14" width="16" height="3" fill={c} opacity="0.6" />
      <rect x="34" y="26" width="18" height="3" fill="#00f5ff" opacity="0.5" />
      <rect x="14" y="34" width="16" height="3" fill={c} opacity="0.5" />
      <rect x="30" y="46" width="14" height="2" fill="#00f5ff" opacity="0.4" />
      {/* scan-corruption blocks */}
      <rect x="26" y="10" width="5" height="5" fill={c} opacity="0.3" />
      <rect x="33" y="30" width="6" height="6" fill="#00f5ff" opacity="0.25" />
      <rect x="22" y="36" width="4" height="4" fill={c} opacity="0.3" />
      {/* glitch eyes (misaligned) */}
      <rect x="26" y="14" width="4" height="3" fill={c} opacity="0.95" />
      <rect x="35" y="13" width="4" height="3" fill="#00f5ff" opacity="0.9" />
      {/* data noise dots */}
      <rect x="42" y="18" width="2" height="2" fill={c} opacity="0.7" />
      <rect x="20" y="28" width="2" height="2" fill="#00f5ff" opacity="0.6" />
      <rect x="44" y="40" width="2" height="2" fill={c} opacity="0.6" />
      <rect x="16" y="44" width="2" height="2" fill="#00f5ff" opacity="0.5" />
      {/* tear line */}
      <line x1="12" y1="24" x2="52" y2="24" stroke={c} strokeWidth="0.5" opacity="0.4" strokeDasharray="3,2" />
    </>
  );
}

function IconVoid({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* accretion swirl */}
      <circle cx="32" cy="32" r="26" fill="none" stroke={c} strokeWidth="0.6" opacity="0.25" />
      <path d="M32 8 Q54 14 56 36 Q40 30 32 32" fill="none" stroke={c} strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <path d="M32 56 Q10 50 8 28 Q24 34 32 32" fill="none" stroke={c} strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      {/* event-horizon ring */}
      <circle cx="32" cy="32" r="16" fill="none" stroke={c} strokeWidth="2.5" opacity="0.6" />
      <circle cx="32" cy="32" r="16" fill={c} opacity="0.08" />
      {/* dark core */}
      <circle cx="32" cy="32" r="11" fill="#08000f" />
      <circle cx="32" cy="32" r="11" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      {/* glowing void eyes */}
      <circle cx="28" cy="30" r="2" fill={c} opacity="0.9" />
      <circle cx="36" cy="30" r="2" fill={c} opacity="0.9" />
      <circle cx="28" cy="30" r="0.8" fill="white" opacity="0.7" />
      <circle cx="36" cy="30" r="0.8" fill="white" opacity="0.7" />
      {/* drifting matter / stars */}
      <circle cx="14" cy="18" r="1.2" fill={c} opacity="0.7" />
      <circle cx="50" cy="16" r="1" fill="white" opacity="0.6" />
      <circle cx="52" cy="46" r="1.2" fill={c} opacity="0.6" />
      <circle cx="12" cy="44" r="1" fill="white" opacity="0.5" />
      <circle cx="44" cy="52" r="1" fill={c} opacity="0.5" />
      <circle cx="20" cy="52" r="1" fill={c} opacity="0.5" />
    </>
  );
}

function IconReaper({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* flowing cloak */}
      <path d="M18 18 Q10 26 10 60 L54 60 Q54 26 46 18 Q40 26 32 26 Q24 26 18 18 Z" fill="#0a1408" />
      <path d="M22 22 Q16 30 16 60 L48 60 Q48 30 42 22 Q38 28 32 28 Q26 28 22 22 Z" fill="#0d1a0a" />
      {/* tattered cloak edges */}
      <polygon points="10,60 14,52 18,60" fill="#06100a" />
      <polygon points="22,60 26,52 30,60" fill="#06100a" />
      <polygon points="34,60 38,52 42,60" fill="#06100a" />
      <polygon points="46,60 50,52 54,60" fill="#06100a" />
      {/* hood */}
      <path d="M22 14 Q22 4 32 4 Q42 4 42 14 L42 22 Q37 28 32 28 Q27 28 22 22 Z" fill="#0a1408" />
      {/* dark hollow inside hood */}
      <ellipse cx="32" cy="16" rx="6" ry="8" fill="#020602" />
      {/* glowing eyes in the dark */}
      <circle cx="29" cy="15" r="1.8" fill={c} opacity="0.9" />
      <circle cx="35" cy="15" r="1.8" fill={c} opacity="0.9" />
      <circle cx="29" cy="15" r="0.7" fill="white" opacity="0.8" />
      <circle cx="35" cy="15" r="0.7" fill="white" opacity="0.8" />
      {/* scythe shaft */}
      <line x1="50" y1="6" x2="40" y2="58" stroke="#1a2410" strokeWidth="2.5" strokeLinecap="round" />
      {/* scythe blade */}
      <path d="M50 6 Q62 8 58 22 Q54 14 48 14 Q50 10 50 6 Z" fill={c} opacity="0.25" />
      <path d="M50 6 Q62 8 58 22" fill="none" stroke={c} strokeWidth="2" opacity="0.8" strokeLinecap="round" />
      <path d="M50 6 Q58 9 55 18" fill="none" stroke="white" strokeWidth="0.6" opacity="0.5" />
      {/* skeletal hand on shaft */}
      <line x1="42" y1="36" x2="46" y2="34" stroke="#c8d0b0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="42" y1="38" x2="46" y2="37" stroke="#c8d0b0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </>
  );
}

function IconSkeleton({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* skull */}
      <path d="M22 12 Q22 4 32 4 Q42 4 42 12 Q42 18 38 21 L38 25 L26 25 L26 21 Q22 18 22 12 Z" fill="#16160f" />
      <ellipse cx="32" cy="13" rx="9" ry="9" fill="#1c1c14" />
      {/* eye sockets */}
      <ellipse cx="27" cy="13" rx="3" ry="3.5" fill="#050503" />
      <ellipse cx="37" cy="13" rx="3" ry="3.5" fill="#050503" />
      <circle cx="27" cy="13" r="1.4" fill={c} opacity="0.7" />
      <circle cx="37" cy="13" r="1.4" fill={c} opacity="0.7" />
      {/* nasal cavity + teeth */}
      <polygon points="32,16 30,20 34,20" fill="#050503" />
      <line x1="27" y1="24" x2="37" y2="24" stroke="#050503" strokeWidth="1" />
      <line x1="29" y1="22" x2="29" y2="25" stroke="#050503" strokeWidth="1" />
      <line x1="32" y1="22" x2="32" y2="25" stroke="#050503" strokeWidth="1" />
      <line x1="35" y1="22" x2="35" y2="25" stroke="#050503" strokeWidth="1" />
      {/* spine */}
      <line x1="32" y1="25" x2="32" y2="46" stroke="#1c1c14" strokeWidth="3" />
      <circle cx="32" cy="30" r="1.5" fill={c} opacity="0.3" />
      <circle cx="32" cy="35" r="1.5" fill={c} opacity="0.3" />
      <circle cx="32" cy="40" r="1.5" fill={c} opacity="0.3" />
      {/* ribcage */}
      <path d="M32 28 Q22 30 22 38" fill="none" stroke={c} strokeWidth="1.4" opacity="0.55" />
      <path d="M32 28 Q42 30 42 38" fill="none" stroke={c} strokeWidth="1.4" opacity="0.55" />
      <path d="M32 33 Q24 34 24 41" fill="none" stroke={c} strokeWidth="1.4" opacity="0.5" />
      <path d="M32 33 Q40 34 40 41" fill="none" stroke={c} strokeWidth="1.4" opacity="0.5" />
      <path d="M32 38 Q26 39 26 44" fill="none" stroke={c} strokeWidth="1.4" opacity="0.45" />
      <path d="M32 38 Q38 39 38 44" fill="none" stroke={c} strokeWidth="1.4" opacity="0.45" />
      {/* arm bones */}
      <line x1="22" y1="30" x2="14" y2="44" stroke="#1c1c14" strokeWidth="3" strokeLinecap="round" />
      <line x1="42" y1="30" x2="50" y2="44" stroke="#1c1c14" strokeWidth="3" strokeLinecap="round" />
      <circle cx="14" cy="44" r="2" fill="#1c1c14" />
      <circle cx="50" cy="44" r="2" fill="#1c1c14" />
      {/* leg bones */}
      <line x1="32" y1="46" x2="26" y2="60" stroke="#1c1c14" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="46" x2="38" y2="60" stroke="#1c1c14" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function IconKnight({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* great helm */}
      <path d="M24 6 Q24 2 32 2 Q40 2 40 6 L41 20 Q41 24 32 24 Q23 24 23 20 Z" fill="#14202c" />
      <rect x="24" y="9" width="16" height="3" rx="1" fill="#0a1018" />
      {/* visor glow slit */}
      <rect x="26" y="9" width="5" height="3" rx="1" fill={c} opacity="0.85" />
      <rect x="33" y="9" width="5" height="3" rx="1" fill={c} opacity="0.85" />
      {/* helm crest */}
      <path d="M32 2 Q34 -2 36 2 Q34 0 32 2 Z" fill={c} opacity="0.5" />
      <line x1="32" y1="14" x2="32" y2="22" stroke="#0a1018" strokeWidth="1.5" />
      {/* armored torso / pauldrons */}
      <path d="M18 26 L16 50 L48 50 L46 26 Q39 22 32 24 Q25 22 18 26 Z" fill="#14202c" />
      <ellipse cx="18" cy="27" rx="6" ry="5" fill="#1a2a38" />
      <ellipse cx="46" cy="27" rx="6" ry="5" fill="#1a2a38" />
      {/* chest ridge + emblem */}
      <line x1="32" y1="26" x2="32" y2="48" stroke="#0a1018" strokeWidth="1.5" />
      <polygon points="32,30 36,34 32,40 28,34" fill={c} opacity="0.4" />
      <circle cx="32" cy="34" r="1.6" fill={c} opacity="0.8" />
      {/* shield (left arm) */}
      <path d="M6 28 L6 40 Q6 48 14 50 Q22 48 22 40 L22 28 Z" fill="#1a2a38" />
      <path d="M9 31 L9 40 Q9 45 14 46 Q19 45 19 40 L19 31 Z" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
      <line x1="14" y1="31" x2="14" y2="46" stroke={c} strokeWidth="0.8" opacity="0.4" />
      {/* sword (right arm) raised */}
      <line x1="48" y1="44" x2="56" y2="6" stroke="#0a1018" strokeWidth="2" />
      <polygon points="56,4 58,8 54,8" fill={c} opacity="0.5" />
      <line x1="52" y1="26" x2="56" y2="6" stroke={c} strokeWidth="1" opacity="0.6" />
      <rect x="50" y="42" width="8" height="3" rx="1" fill="#1a2a38" transform="rotate(-12 54 43)" />
      {/* legs */}
      <rect x="22" y="50" width="8" height="10" rx="1" fill="#14202c" />
      <rect x="34" y="50" width="8" height="10" rx="1" fill="#14202c" />
    </>
  );
}

function IconLich({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* floating tattered robe (no legs) */}
      <path d="M18 24 Q12 34 12 50 Q16 46 20 52 Q24 46 26 54 Q29 46 32 54 Q35 46 38 54 Q40 46 44 52 Q48 46 52 50 Q52 34 46 24 Q40 30 32 30 Q24 30 18 24 Z"
            fill="#0d1a16" />
      <path d="M22 26 Q18 34 18 48 Q22 44 26 50 Q30 44 32 50 Q34 44 38 50 Q42 44 46 48 Q46 34 42 26 Q38 30 32 30 Q26 30 22 26 Z"
            fill="#12241e" />
      {/* crown */}
      <polygon points="24,8 26,4 28,8 30,3 32,8 34,3 36,8 38,4 40,8 40,11 24,11" fill={c} opacity="0.7" />
      <circle cx="32" cy="3" r="1" fill="#fff" opacity="0.8" />
      {/* skeletal lich face under hood */}
      <ellipse cx="32" cy="16" rx="7" ry="8" fill="#0a1410" />
      <ellipse cx="29" cy="15" rx="2.2" ry="2.8" fill="#02100a" />
      <ellipse cx="35" cy="15" rx="2.2" ry="2.8" fill="#02100a" />
      <circle cx="29" cy="15" r="1.3" fill={c} opacity="0.95" />
      <circle cx="35" cy="15" r="1.3" fill={c} opacity="0.95" />
      <line x1="30" y1="20" x2="34" y2="20" stroke="#02100a" strokeWidth="1" />
      {/* raised skeletal arms */}
      <line x1="22" y1="28" x2="10" y2="20" stroke="#12241e" strokeWidth="3" strokeLinecap="round" />
      <line x1="42" y1="28" x2="54" y2="20" stroke="#12241e" strokeWidth="3" strokeLinecap="round" />
      {/* conjured death orb */}
      <circle cx="10" cy="18" r="5" fill={c} opacity="0.18" />
      <circle cx="10" cy="18" r="2.6" fill={c} opacity="0.5" />
      <circle cx="10" cy="18" r="1.2" fill="#fff" opacity="0.85" />
      <circle cx="54" cy="18" r="4" fill={c} opacity="0.15" />
      <circle cx="54" cy="18" r="2" fill={c} opacity="0.5" />
      {/* floating soul wisps */}
      <circle cx="20" cy="40" r="1.4" fill={c} opacity="0.5" />
      <circle cx="44" cy="40" r="1.4" fill={c} opacity="0.5" />
      <circle cx="32" cy="44" r="1.6" fill={c} opacity="0.4" />
    </>
  );
}

function IconVampire({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* high-collar cape spread */}
      <path d="M32 22 Q10 24 6 54 Q16 48 22 52 L32 30 L42 52 Q48 48 58 54 Q54 24 32 22 Z" fill="#1a0610" />
      <path d="M32 24 Q16 26 12 50 Q20 46 24 50 L32 32 L40 50 Q44 46 52 50 Q48 26 32 24 Z" fill="#260a18" opacity="0.9" />
      {/* raised collar points */}
      <polygon points="24,22 20,8 30,20" fill="#1a0610" />
      <polygon points="40,22 44,8 34,20" fill="#1a0610" />
      {/* pale head */}
      <ellipse cx="32" cy="16" rx="7" ry="8" fill="#2a2230" />
      {/* slicked hair widow's peak */}
      <path d="M25 12 Q25 6 32 6 Q39 6 39 12 Q36 9 32 13 Q28 9 25 12 Z" fill="#0d0810" />
      {/* glowing red eyes */}
      <ellipse cx="29" cy="16" rx="1.8" ry="1.4" fill={c} opacity="0.95" />
      <ellipse cx="35" cy="16" rx="1.8" ry="1.4" fill={c} opacity="0.95" />
      {/* fanged grin */}
      <path d="M29 20 Q32 22 35 20" fill="none" stroke="#5a1020" strokeWidth="1" />
      <polygon points="30,20 31,23 32,20" fill="#fff" opacity="0.85" />
      <polygon points="32,20 33,23 34,20" fill="#fff" opacity="0.85" />
      {/* chest medallion */}
      <circle cx="32" cy="32" r="3" fill="#0d0810" />
      <circle cx="32" cy="32" r="1.6" fill={c} opacity="0.7" />
      {/* cape inner sheen lines */}
      <path d="M24 30 Q18 38 16 48" fill="none" stroke={c} strokeWidth="0.8" opacity="0.3" />
      <path d="M40 30 Q46 38 48 48" fill="none" stroke={c} strokeWidth="0.8" opacity="0.3" />
    </>
  );
}

function IconMimic({ c }: { c: string }): React.ReactElement {
  return (
    <>
      {/* lower chest body */}
      <path d="M10 36 L10 54 Q10 58 14 58 L50 58 Q54 58 54 54 L54 36 Z" fill="#2a1605" />
      <rect x="10" y="36" width="44" height="4" fill="#1c0f03" />
      {/* metal bands */}
      <rect x="18" y="36" width="4" height="22" fill="#3a2208" />
      <rect x="42" y="36" width="4" height="22" fill="#3a2208" />
      <circle cx="20" cy="40" r="1" fill={c} opacity="0.6" />
      <circle cx="44" cy="40" r="1" fill={c} opacity="0.6" />
      {/* open hinged lid (tilted back) */}
      <path d="M8 34 L12 18 Q12 14 16 14 L48 14 Q52 14 52 18 L56 34 Z" fill="#2a1605" />
      <path d="M12 30 L15 20 L49 20 L52 30 Z" fill="#120a02" />
      {/* upper fangs (from lid) */}
      <polygon points="14,32 17,24 20,32" fill="#efe8d8" />
      <polygon points="22,33 25,24 28,33" fill="#efe8d8" />
      <polygon points="30,33 33,23 36,33" fill="#efe8d8" />
      <polygon points="38,33 41,24 44,33" fill="#efe8d8" />
      <polygon points="46,32 49,24 50,32" fill="#efe8d8" />
      {/* lower fangs (from body) */}
      <polygon points="16,40 19,47 22,40" fill="#efe8d8" />
      <polygon points="25,40 28,48 31,40" fill="#efe8d8" />
      <polygon points="33,40 36,48 39,40" fill="#efe8d8" />
      <polygon points="42,40 45,47 48,40" fill="#efe8d8" />
      {/* glowing tongue/maw */}
      <ellipse cx="32" cy="37" rx="9" ry="2.5" fill={c} opacity="0.35" />
      {/* glowing eyes on the lid */}
      <circle cx="24" cy="22" r="2.2" fill={c} opacity="0.9" />
      <circle cx="40" cy="22" r="2.2" fill={c} opacity="0.9" />
      <circle cx="24" cy="22" r="0.9" fill="#000" opacity="0.7" />
      <circle cx="40" cy="22" r="0.9" fill="#000" opacity="0.7" />
    </>
  );
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<Category, (c: string) => React.ReactElement> = {
  street_thug:    (c) => <IconStreetThug c={c} />,
  hacker:         (c) => <IconHacker c={c} />,
  enforcer:       (c) => <IconEnforcer c={c} />,
  raider:         (c) => <IconRaider c={c} />,
  assassin:       (c) => <IconAssassin c={c} />,
  sniper:         (c) => <IconSniper c={c} />,
  corp_boss:      (c) => <IconCorpBoss c={c} />,
  warlock:        (c) => <IconWarlock c={c} />,
  drone:          (c) => <IconDrone c={c} />,
  turret:         (c) => <IconTurret c={c} />,
  swarm:          (c) => <IconSwarm c={c} />,
  android:        (c) => <IconAndroid c={c} />,
  mech:           (c) => <IconMech c={c} />,
  ai:             (c) => <IconAI c={c} />,
  electric_golem: (c) => <IconElectricGolem c={c} />,
  sand_golem:     (c) => <IconSandGolem c={c} />,
  arcane_golem:   (c) => <IconArcaneGolem c={c} />,
  rat:            (c) => <IconRat c={c} />,
  cyber_animal:   (c) => <IconCyberAnimal c={c} />,
  wolf:           (c) => <IconWolf c={c} />,
  bear:           (c) => <IconBear c={c} />,
  spider:         (c) => <IconSpider c={c} />,
  cockroach:      (c) => <IconCockroach c={c} />,
  ghost:          (c) => <IconGhost c={c} />,
  ghul:           (c) => <IconGhul c={c} />,
  demon:          (c) => <IconDemon c={c} />,
  dragon:         (c) => <IconDragon c={c} />,
  soldier:        (c) => <IconSoldier c={c} />,
  bio:            (c) => <IconBio c={c} />,
  berserker:      (c) => <IconBerserker c={c} />,
  plasma:         (c) => <IconPlasma c={c} />,
  commander:      (c) => <IconCommander c={c} />,
  psi:            (c) => <IconPsi c={c} />,
  glitch:         (c) => <IconGlitch c={c} />,
  void:           (c) => <IconVoid c={c} />,
  reaper:         (c) => <IconReaper c={c} />,
  skeleton:       (c) => <IconSkeleton c={c} />,
  knight:         (c) => <IconKnight c={c} />,
  lich:           (c) => <IconLich c={c} />,
  vampire:        (c) => <IconVampire c={c} />,
  mimic:          (c) => <IconMimic c={c} />,
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function EnemyIcon({ id, size = 64, style }: Props): React.ReactElement {
  const category = getEnemyCategory(id);
  const color = CATEGORY_COLOR[category];
  const render = ICON_MAP[category];
  const filterId = `enemy-glow-${id}`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="64" height="64" fill="rgba(0,0,0,0.7)" rx="4" />
      <g filter={`url(#${filterId})`}>
        {render(color)}
      </g>
    </svg>
  );
}
