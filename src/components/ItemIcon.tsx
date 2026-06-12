import React from 'react';
import type { Item, Rarity } from '../types';
import cannonFusionSrc from '../assets/cannon_fusion.webp';
import mysteryBoxSrc from '../assets/mystery-box.webp';
import mysteryBoxUncommonSrc from '../assets/mystery-box-uncommon.webp';
import mysteryBoxCommonSrc from '../assets/mystery-box-common.webp';
import mysteryBoxRareSrc from '../assets/mystery-box-rare.webp';
import mysteryBoxLegendarySrc from '../assets/mystery-box-legendary.webp';

interface Colors {
  primary: string;
  light: string;
  dark: string;
  glow: string;
}

const RARITY_COLORS: Record<Rarity, Colors> = {
  common:    { primary: '#8FA4B8', light: '#C8D8E8', dark: '#3A4858', glow: '#8FA4B8' },
  uncommon:  { primary: '#4A9B5C', light: '#7DCC8C', dark: '#2A5E35', glow: '#5DCC70' },
  rare:      { primary: '#3A78D4', light: '#7AAEF8', dark: '#1A4A9C', glow: '#5A9AFF' },
  epic:      { primary: '#9040C8', light: '#C078F0', dark: '#5A2080', glow: '#B060E8' },
  legendary: { primary: '#D48020', light: '#F8C840', dark: '#8A4800', glow: '#FFD060' },
};

function getCategory(item: Item): string {
  const id = item.id;
  if (id.startsWith('staff_')) return 'staff';
  if (id.startsWith('wand_')) return 'wand';
  if (id.startsWith('orb_')) return 'orb';
  if (id === 'cannon_fusion') return 'fusion_cannon';
  if (id.startsWith('cannon_')) return 'cannon';
  if (id.startsWith('baton_') || id.startsWith('mace_') || id.startsWith('hammer_') || id.startsWith('maul_')) return 'hammer';
  if (id.startsWith('pike_') || id.startsWith('lance_')) return 'lance';
  if (id.startsWith('railgun_')) return 'railgun';
  if (id.startsWith('grenade_')) return 'grenade_launcher';
  if (id.startsWith('bow_')) return 'bow';
  if (id.startsWith('flamer_')) return 'flamer';
  if (id.startsWith('pistol_')) return 'pistol';
  if (id.startsWith('sniper_')) return 'sniper';
  if (id.startsWith('smg_') || id.startsWith('rifle_')) return 'rifle';
  if (id.startsWith('knife_') || id.startsWith('shiv_') || id.startsWith('dagger_') || id.startsWith('cutter_')) return 'knife';
  if (id.startsWith('whip_')) return 'whip';
  if (id.startsWith('axe_') || id.startsWith('cleaver_')) return 'axe';
  if (id.startsWith('bio_')) return 'knife';
  // blade_ prefix: most are swords, but a few are knife-type (stealth/neurotox/ghost)
  if (id === 'blade_stealth' || id === 'blade_neurotox' || id === 'blade_ghost') return 'knife';
  if (id.startsWith('blade_')) return 'sword';
  if (id.startsWith('vest_')) return 'vest';
  if (id.startsWith('exo_')) return 'exo';
  if (id.startsWith('suit_') || id.startsWith('coat_')) return 'suit';
  if (id.startsWith('visor_')) return 'visor';
  if (id.startsWith('helmet_')) return 'helmet';
  if (id.startsWith('mask_')) return 'mask';
  if (id.startsWith('boots_')) return 'boots';
  if (id.startsWith('implant_') || id.startsWith('chip_') || id.startsWith('ring_')) return 'chip';
  if (id.startsWith('core_') || id.startsWith('pendant_') || id.startsWith('amulet_') || id.startsWith('amplifier_') || id.startsWith('signal_') || id.startsWith('data_')) return 'amulet';
  if (id.startsWith('medkit_')) return 'medkit';
  // Fallback for procedurally generated items (gen_* IDs) — use item flags + emoji
  if (item.ranged) {
    if (item.emoji === '🎯') return 'sniper';
    if (item.emoji === '🔱') return 'lance';
    if (item.emoji === '💥') return 'grenade_launcher';
    if (item.emoji === '🏹') return 'bow';
    if (item.emoji === '🔥') return 'flamer';
    if (item.emoji === '💢') return 'pistol';
    return 'rifle';
  }
  if (item.magicDamage) return 'orb';
  // Melee fallback by emoji
  if (item.emoji === '🪓') return 'axe';
  if (item.emoji === '〰')  return 'whip';
  switch (item.slot) {
    case 'weapon': return 'sword';
    case 'armor': return 'vest';
    case 'helmet': return 'helmet';
    case 'boots': return 'boots';
    case 'ring': return 'chip';
    case 'amulet': return 'amulet';
    default: return 'sword';
  }
}

function IconSword({ c }: { c: Colors }) {
  return (
    <>
      {/* blade */}
      <polygon points="24,3 26,22 22,22" fill={c.light} />
      <polygon points="24,3 25,22 24,22" fill={c.primary} />
      {/* edge glow */}
      <line x1="24" y1="4" x2="24" y2="21" stroke={c.glow} strokeWidth="1.5" opacity="0.6" />
      {/* crossguard */}
      <rect x="15" y="22" width="18" height="4" rx="1" fill={c.dark} />
      <rect x="13" y="23" width="4" height="2" rx="1" fill={c.primary} />
      <rect x="31" y="23" width="4" height="2" rx="1" fill={c.primary} />
      {/* handle */}
      <rect x="21" y="26" width="6" height="14" rx="2" fill={c.dark} />
      <rect x="22" y="28" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.5" />
      <rect x="22" y="32" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.5" />
      <rect x="22" y="36" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.5" />
      {/* pommel */}
      <ellipse cx="24" cy="41" rx="5" ry="3" fill={c.primary} />
    </>
  );
}

function IconCannon({ c }: { c: Colors }) {
  return (
    <>
      {/* body */}
      <rect x="6" y="16" width="24" height="16" rx="3" fill={c.dark} />
      <rect x="8" y="18" width="20" height="12" rx="2" fill={c.primary} />
      {/* barrel cluster */}
      <rect x="30" y="14" width="12" height="5" rx="1.5" fill={c.dark} />
      <rect x="30" y="21" width="12" height="6" rx="1.5" fill={c.dark} />
      <rect x="30" y="29" width="12" height="5" rx="1.5" fill={c.dark} />
      <rect x="31" y="15" width="10" height="3" rx="1" fill={c.light} opacity="0.6" />
      <rect x="31" y="22" width="10" height="4" rx="1" fill={c.light} opacity="0.6" />
      <rect x="31" y="30" width="10" height="3" rx="1" fill={c.light} opacity="0.6" />
      {/* muzzle glow */}
      <circle cx="42" cy="16.5" r="2" fill={c.glow} opacity="0.8" />
      <circle cx="42" cy="24" r="2.5" fill={c.glow} opacity="0.9" />
      <circle cx="42" cy="31.5" r="2" fill={c.glow} opacity="0.8" />
      {/* grip */}
      <rect x="12" y="32" width="8" height="10" rx="2" fill={c.dark} />
      <rect x="13" y="33" width="6" height="8" rx="1" fill={c.primary} opacity="0.5" />
      {/* logo panel */}
      <rect x="10" y="19" width="6" height="4" rx="1" fill={c.light} opacity="0.3" />
    </>
  );
}

function IconFusionCannon({ c }: { c: Colors }) {
  return (
    <>
      {/* thick dark body */}
      <rect x="6" y="14" width="30" height="20" rx="3" fill={c.dark} />
      <rect x="8" y="16" width="26" height="16" rx="2" fill="#0D1117" />
      {/* orange accent lines running along the full length */}
      <rect x="9" y="17" width="24" height="2.5" rx="1" fill={c.glow} opacity="0.9" />
      <rect x="9" y="28.5" width="24" height="2.5" rx="1" fill={c.glow} opacity="0.9" />
      {/* fusion orb — the SUN core */}
      <circle cx="22" cy="24" r="7.5" fill={c.dark} />
      <circle cx="22" cy="24" r="6.5" fill={c.primary} opacity="0.35" />
      <circle cx="22" cy="24" r="5" fill={c.glow} opacity="0.55" />
      <circle cx="22" cy="24" r="3.5" fill={c.light} opacity="0.85" />
      <circle cx="22" cy="24" r="1.8" fill="white" opacity="0.95" />
      <circle cx="22" cy="24" r="7.5" fill="none" stroke={c.glow} strokeWidth="1.5" opacity="0.45" />
      {/* 3-barrel cluster pointing right */}
      <rect x="36" y="13" width="10" height="5" rx="1.5" fill={c.dark} />
      <rect x="36" y="20" width="10" height="6" rx="1.5" fill={c.dark} />
      <rect x="36" y="29" width="10" height="5" rx="1.5" fill={c.dark} />
      <rect x="37" y="14" width="8" height="3" rx="1" fill="#1A1A2A" />
      <rect x="37" y="21" width="8" height="4" rx="1" fill="#1A1A2A" />
      <rect x="37" y="30" width="8" height="3" rx="1" fill="#1A1A2A" />
      {/* muzzle glow */}
      <circle cx="45" cy="15.5" r="2.5" fill={c.glow} opacity="0.95" />
      <circle cx="45" cy="23" r="3" fill={c.glow} opacity="0.95" />
      <circle cx="45" cy="31.5" r="2.5" fill={c.glow} opacity="0.95" />
      {/* heat vent details */}
      <rect x="29" y="14" width="2" height="2" rx="0.5" fill={c.primary} opacity="0.6" />
      <rect x="32" y="14" width="2" height="2" rx="0.5" fill={c.primary} opacity="0.6" />
      <rect x="29" y="32" width="2" height="2" rx="0.5" fill={c.primary} opacity="0.6" />
      <rect x="32" y="32" width="2" height="2" rx="0.5" fill={c.primary} opacity="0.6" />
      {/* grip/stock — back left */}
      <rect x="4" y="24" width="6" height="14" rx="2" fill={c.dark} />
      <rect x="5" y="25" width="4" height="12" rx="1" fill={c.primary} opacity="0.35" />
    </>
  );
}

function IconHammer({ c }: { c: Colors }) {
  return (
    <>
      {/* handle */}
      <rect x="22" y="18" width="4" height="26" rx="1.5" fill={c.dark} />
      <rect x="23" y="20" width="2" height="22" rx="1" fill={c.primary} opacity="0.4" />
      {/* head */}
      <rect x="12" y="6" width="24" height="16" rx="3" fill={c.primary} />
      <rect x="14" y="8" width="20" height="12" rx="2" fill={c.light} opacity="0.2" />
      {/* electric glow on head */}
      <rect x="14" y="8" width="20" height="3" rx="1" fill={c.light} opacity="0.5" />
      <circle cx="24" cy="14" r="4" fill={c.glow} opacity="0.4" />
      <circle cx="16" cy="12" r="1.5" fill={c.light} opacity="0.7" />
      <circle cx="32" cy="12" r="1.5" fill={c.light} opacity="0.7" />
      {/* sparks */}
      <line x1="18" y1="7" x2="15" y2="4" stroke={c.glow} strokeWidth="1.5" opacity="0.9" />
      <line x1="30" y1="7" x2="33" y2="4" stroke={c.glow} strokeWidth="1.5" opacity="0.9" />
      <line x1="24" y1="6" x2="24" y2="3" stroke={c.glow} strokeWidth="1.5" opacity="0.9" />
    </>
  );
}

function IconLance({ c }: { c: Colors }) {
  return (
    <>
      {/* shaft diagonal */}
      <line x1="38" y1="5" x2="8" y2="43" stroke={c.dark} strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="5" x2="8" y2="43" stroke={c.primary} strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="5" x2="8" y2="43" stroke={c.light} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* tip */}
      <polygon points="38,5 43,3 41,10 36,8" fill={c.light} />
      {/* tech bands on shaft */}
      <rect x="20" y="20" width="12" height="3" rx="1" fill={c.primary} opacity="0.7"
            transform="rotate(45 26 21.5)" />
      <rect x="28" y="12" width="10" height="2" rx="1" fill={c.primary} opacity="0.5"
            transform="rotate(45 33 13)" />
      {/* butt */}
      <circle cx="9" cy="42" r="3" fill={c.dark} />
      <circle cx="9" cy="42" r="1.5" fill={c.primary} />
    </>
  );
}

function IconRailgun({ c }: { c: Colors }) {
  return (
    <>
      {/* main barrel diagonal */}
      <line x1="40" y1="4" x2="6" y2="40" stroke={c.dark} strokeWidth="7" strokeLinecap="round" />
      <line x1="40" y1="4" x2="6" y2="40" stroke={c.primary} strokeWidth="4" strokeLinecap="round" />
      {/* magnetic rings */}
      <circle cx="34" cy="10" r="4" fill="none" stroke={c.light} strokeWidth="2" opacity="0.8" />
      <circle cx="26" cy="18" r="4" fill="none" stroke={c.light} strokeWidth="2" opacity="0.6" />
      <circle cx="18" cy="26" r="4" fill="none" stroke={c.light} strokeWidth="2" opacity="0.4" />
      {/* energy trail */}
      <line x1="40" y1="4" x2="6" y2="40" stroke={c.glow} strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray="4,3" opacity="0.9" />
      {/* muzzle flash */}
      <circle cx="41" cy="3" r="3" fill={c.glow} opacity="0.8" />
      {/* grip */}
      <rect x="8" y="32" width="7" height="10" rx="2" fill={c.dark} transform="rotate(45 11.5 37)" />
    </>
  );
}

function IconKnife({ c }: { c: Colors }) {
  return (
    <>
      {/* blade diagonal */}
      <polygon points="40,4 44,8 16,36 10,36" fill={c.light} />
      <polygon points="40,4 42,6 14,36 10,36" fill={c.primary} />
      {/* edge highlight */}
      <line x1="40" y1="4" x2="12" y2="36" stroke={c.glow} strokeWidth="1" opacity="0.7" />
      {/* guard */}
      <rect x="12" y="34" width="10" height="4" rx="1" fill={c.dark}
            transform="rotate(-45 17 36)" />
      {/* handle */}
      <rect x="6" y="36" width="6" height="14" rx="2" fill={c.dark}
            transform="rotate(-45 9 43)" />
      <line x1="5" y1="40" x2="12" y2="47" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </>
  );
}

function IconRifle({ c }: { c: Colors }) {
  return (
    <>
      {/* receiver/body */}
      <rect x="6" y="18" width="22" height="10" rx="2" fill={c.primary} />
      <rect x="7" y="19" width="20" height="8" rx="1.5" fill={c.light} opacity="0.15" />
      {/* barrel */}
      <rect x="28" y="20" width="14" height="6" rx="1.5" fill={c.dark} />
      <rect x="29" y="21" width="12" height="4" rx="1" fill={c.primary} opacity="0.6" />
      {/* muzzle */}
      <rect x="41" y="19" width="3" height="8" rx="1" fill={c.dark} />
      <circle cx="42.5" cy="23" r="2" fill={c.glow} opacity="0.7" />
      {/* magazine */}
      <rect x="14" y="28" width="8" height="10" rx="2" fill={c.dark} />
      <rect x="15" y="29" width="6" height="8" rx="1" fill={c.primary} opacity="0.4" />
      {/* stock */}
      <rect x="4" y="20" width="8" height="8" rx="2" fill={c.dark} />
      {/* scope */}
      <rect x="14" y="14" width="12" height="4" rx="1" fill={c.dark} />
      <rect x="15" y="15" width="10" height="2" rx="0.5" fill={c.primary} opacity="0.5" />
    </>
  );
}

function IconSniper({ c }: { c: Colors }) {
  return (
    <>
      {/* long barrel */}
      <rect x="10" y="20" width="34" height="5" rx="1.5" fill={c.dark} />
      <rect x="11" y="21" width="32" height="3" rx="1" fill={c.primary} opacity="0.6" />
      {/* muzzle brake */}
      <rect x="42" y="18" width="4" height="9" rx="1" fill={c.dark} />
      <circle cx="44" cy="22.5" r="2.5" fill={c.glow} opacity="0.8" />
      {/* body */}
      <rect x="14" y="15" width="16" height="14" rx="2" fill={c.primary} />
      {/* scope */}
      <rect x="16" y="10" width="12" height="6" rx="2" fill={c.dark} />
      <rect x="17" y="11" width="10" height="4" rx="1.5" fill={c.light} opacity="0.3" />
      <circle cx="22" cy="13" r="2" fill={c.glow} opacity="0.6" />
      {/* scope mounts */}
      <rect x="18" y="15" width="3" height="3" rx="0.5" fill={c.dark} />
      <rect x="23" y="15" width="3" height="3" rx="0.5" fill={c.dark} />
      {/* stock */}
      <polygon points="14,25 14,29 6,32 6,28" fill={c.dark} />
      {/* grip/trigger */}
      <rect x="18" y="27" width="6" height="10" rx="2" fill={c.dark} />
    </>
  );
}

function IconStaff({ c }: { c: Colors }) {
  return (
    <>
      {/* shaft */}
      <rect x="22" y="14" width="4" height="30" rx="1.5" fill={c.dark} />
      <rect x="23" y="16" width="2" height="26" rx="1" fill={c.primary} opacity="0.5" />
      {/* crystal top */}
      <polygon points="24,2 28,10 24,14 20,10" fill={c.primary} />
      <polygon points="24,2 26,10 24,14 22,10" fill={c.light} opacity="0.7" />
      <polygon points="24,2 25,6 24,10" fill={c.light} />
      {/* magic glow at top */}
      <circle cx="24" cy="8" r="5" fill={c.glow} opacity="0.3" />
      <circle cx="24" cy="8" r="3" fill={c.glow} opacity="0.2" />
      {/* orb rings */}
      <ellipse cx="24" cy="8" rx="7" ry="3" fill="none" stroke={c.light} strokeWidth="1" opacity="0.6" />
      <ellipse cx="24" cy="8" rx="3" ry="7" fill="none" stroke={c.light} strokeWidth="1" opacity="0.4" />
      {/* bottom cap */}
      <ellipse cx="24" cy="43" rx="4" ry="2" fill={c.primary} />
      {/* rune marks */}
      <rect x="21" y="22" width="6" height="1.5" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="21" y="28" width="6" height="1.5" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="21" y="34" width="6" height="1.5" rx="0.5" fill={c.primary} opacity="0.7" />
    </>
  );
}

function IconWand({ c }: { c: Colors }) {
  return (
    <>
      {/* wand body - slightly diagonal */}
      <line x1="36" y1="8" x2="12" y2="40" stroke={c.dark} strokeWidth="5" strokeLinecap="round" />
      <line x1="36" y1="8" x2="12" y2="40" stroke={c.primary} strokeWidth="3" strokeLinecap="round" />
      {/* magic tip */}
      <circle cx="37" cy="7" r="5" fill={c.glow} opacity="0.5" />
      <circle cx="37" cy="7" r="3" fill={c.light} />
      <circle cx="37" cy="7" r="1.5" fill="white" />
      {/* magic sparkles */}
      <circle cx="42" cy="3" r="1.5" fill={c.glow} opacity="0.9" />
      <circle cx="44" cy="8" r="1" fill={c.glow} opacity="0.7" />
      <circle cx="32" cy="3" r="1" fill={c.glow} opacity="0.7" />
      {/* magic rings around tip */}
      <circle cx="37" cy="7" r="8" fill="none" stroke={c.light} strokeWidth="1" opacity="0.4" strokeDasharray="3,3" />
      {/* handle wrap */}
      <line x1="20" y1="28" x2="14" y2="38" stroke={c.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" strokeDasharray="2,4" />
    </>
  );
}

function IconOrb({ c }: { c: Colors }) {
  return (
    <>
      {/* outer magic rings */}
      <ellipse cx="24" cy="24" rx="18" ry="8" fill="none" stroke={c.light} strokeWidth="1" opacity="0.4" />
      <ellipse cx="24" cy="24" rx="8" ry="18" fill="none" stroke={c.light} strokeWidth="1" opacity="0.4" />
      <ellipse cx="24" cy="24" rx="18" ry="8" fill="none" stroke={c.primary} strokeWidth="1" opacity="0.5"
               transform="rotate(60 24 24)" />
      {/* orb */}
      <circle cx="24" cy="24" r="13" fill={c.dark} />
      <circle cx="24" cy="24" r="12" fill={c.primary} opacity="0.8" />
      {/* inner glow */}
      <circle cx="24" cy="24" r="8" fill={c.glow} opacity="0.4" />
      <circle cx="24" cy="24" r="4" fill={c.light} opacity="0.5" />
      {/* highlight */}
      <ellipse cx="20" cy="19" rx="4" ry="3" fill="white" opacity="0.2" transform="rotate(-30 20 19)" />
      {/* inner symbol */}
      <line x1="18" y1="24" x2="30" y2="24" stroke={c.light} strokeWidth="1.5" opacity="0.8" />
      <line x1="24" y1="18" x2="24" y2="30" stroke={c.light} strokeWidth="1.5" opacity="0.8" />
      <circle cx="24" cy="24" r="2" fill={c.light} opacity="0.9" />
    </>
  );
}

function IconVest({ c }: { c: Colors }) {
  return (
    <>
      {/* body */}
      <path d="M12 10 L12 36 Q12 40 16 40 L32 40 Q36 40 36 36 L36 10 Q30 8 24 8 Q18 8 12 10 Z"
            fill={c.primary} />
      <path d="M14 12 L14 36 Q14 38 16 38 L32 38 Q34 38 34 36 L34 12 Q28 11 24 11 Q20 11 14 12 Z"
            fill={c.dark} />
      {/* neck cutout */}
      <path d="M18 8 Q20 12 24 12 Q28 12 30 8" fill={c.dark} />
      {/* chest panels */}
      <rect x="16" y="16" width="10" height="10" rx="1" fill={c.primary} opacity="0.5" />
      <rect x="22" y="16" width="10" height="10" rx="1" fill={c.primary} opacity="0.5" />
      {/* center strap */}
      <rect x="22" y="12" width="4" height="26" rx="1" fill={c.primary} opacity="0.3" />
      {/* tech details */}
      <rect x="17" y="18" width="8" height="1.5" rx="0.5" fill={c.light} opacity="0.5" />
      <rect x="17" y="21" width="8" height="1.5" rx="0.5" fill={c.light} opacity="0.5" />
      <rect x="23" y="18" width="8" height="1.5" rx="0.5" fill={c.light} opacity="0.5" />
      <rect x="23" y="21" width="8" height="1.5" rx="0.5" fill={c.light} opacity="0.5" />
    </>
  );
}

function IconExo({ c }: { c: Colors }) {
  return (
    <>
      {/* shoulder pads */}
      <rect x="4" y="8" width="12" height="18" rx="3" fill={c.primary} />
      <rect x="32" y="8" width="12" height="18" rx="3" fill={c.primary} />
      <rect x="5" y="9" width="10" height="16" rx="2" fill={c.light} opacity="0.15" />
      <rect x="33" y="9" width="10" height="16" rx="2" fill={c.light} opacity="0.15" />
      {/* chest plate */}
      <path d="M16 6 L32 6 L36 12 L36 36 L30 42 L18 42 L12 36 L12 12 Z"
            fill={c.primary} />
      <path d="M18 9 L30 9 L34 14 L34 34 L28 40 L20 40 L14 34 L14 14 Z"
            fill={c.dark} />
      {/* chest reactor */}
      <circle cx="24" cy="22" r="6" fill={c.dark} />
      <circle cx="24" cy="22" r="5" fill={c.primary} opacity="0.6" />
      <circle cx="24" cy="22" r="3" fill={c.glow} opacity="0.8" />
      <circle cx="24" cy="22" r="1.5" fill="white" opacity="0.9" />
      {/* tech lines */}
      <line x1="16" y1="16" x2="18" y2="18" stroke={c.light} strokeWidth="1.5" opacity="0.6" />
      <line x1="32" y1="16" x2="30" y2="18" stroke={c.light} strokeWidth="1.5" opacity="0.6" />
      <rect x="20" y="30" width="8" height="2" rx="0.5" fill={c.primary} opacity="0.6" />
      <rect x="21" y="34" width="6" height="2" rx="0.5" fill={c.primary} opacity="0.4" />
      {/* shoulder bolts */}
      <circle cx="10" cy="14" r="2" fill={c.light} opacity="0.6" />
      <circle cx="38" cy="14" r="2" fill={c.light} opacity="0.6" />
    </>
  );
}

function IconSuit({ c }: { c: Colors }) {
  return (
    <>
      {/* full body coat outline */}
      <path d="M14 4 Q10 4 10 8 L10 44 Q10 46 12 46 L36 46 Q38 46 38 44 L38 8 Q38 4 34 4 Z"
            fill={c.dark} />
      {/* collar */}
      <path d="M18 4 L24 12 L30 4 Z" fill={c.primary} />
      {/* coat body */}
      <path d="M12 10 L12 44 L36 44 L36 10 L28 8 L24 14 L20 8 Z"
            fill={c.primary} opacity="0.7" />
      {/* center seam */}
      <line x1="24" y1="12" x2="24" y2="44" stroke={c.dark} strokeWidth="1.5" />
      {/* buttons/clasps */}
      <circle cx="24" cy="18" r="1.5" fill={c.light} opacity="0.7" />
      <circle cx="24" cy="24" r="1.5" fill={c.light} opacity="0.7" />
      <circle cx="24" cy="30" r="1.5" fill={c.light} opacity="0.7" />
      <circle cx="24" cy="36" r="1.5" fill={c.light} opacity="0.7" />
      {/* tech stripes */}
      <rect x="12" y="14" width="5" height="20" rx="1" fill={c.primary} opacity="0.3" />
      <rect x="31" y="14" width="5" height="20" rx="1" fill={c.primary} opacity="0.3" />
      {/* neon line */}
      <line x1="12" y1="8" x2="36" y2="8" stroke={c.glow} strokeWidth="1.5" opacity="0.6" />
    </>
  );
}

function IconVisor({ c }: { c: Colors }) {
  return (
    <>
      {/* frame */}
      <rect x="6" y="16" width="36" height="16" rx="4" fill={c.dark} />
      {/* lens left */}
      <rect x="8" y="18" width="14" height="12" rx="3" fill={c.primary} opacity="0.7" />
      <rect x="9" y="19" width="12" height="10" rx="2" fill={c.glow} opacity="0.3" />
      {/* lens right */}
      <rect x="26" y="18" width="14" height="12" rx="3" fill={c.primary} opacity="0.7" />
      <rect x="27" y="19" width="12" height="10" rx="2" fill={c.glow} opacity="0.3" />
      {/* lens divider */}
      <rect x="22" y="18" width="4" height="12" rx="0" fill={c.dark} />
      {/* lens highlights */}
      <rect x="10" y="20" width="6" height="3" rx="1" fill="white" opacity="0.2" />
      <rect x="28" y="20" width="6" height="3" rx="1" fill="white" opacity="0.2" />
      {/* scan line */}
      <rect x="8" y="22" width="14" height="1.5" rx="0.5" fill={c.glow} opacity="0.7" />
      <rect x="26" y="22" width="14" height="1.5" rx="0.5" fill={c.glow} opacity="0.7" />
      {/* strap attachment points */}
      <rect x="3" y="20" width="4" height="8" rx="1" fill={c.dark} />
      <rect x="41" y="20" width="4" height="8" rx="1" fill={c.dark} />
      {/* tech detail */}
      <circle cx="22" cy="24" r="1.5" fill={c.primary} />
      <circle cx="26" cy="24" r="1.5" fill={c.primary} />
    </>
  );
}

function IconHelmet({ c }: { c: Colors }) {
  return (
    <>
      {/* helmet shell */}
      <path d="M10 24 Q10 6 24 5 Q38 6 38 24 L38 34 Q38 38 34 38 L14 38 Q10 38 10 34 Z"
            fill={c.primary} />
      <path d="M12 24 Q12 9 24 8 Q36 9 36 24 L36 34 Q36 36 34 36 L14 36 Q12 36 12 34 Z"
            fill={c.dark} />
      {/* visor */}
      <path d="M14 20 Q14 16 24 16 Q34 16 34 20 L34 28 Q34 30 24 30 Q14 30 14 28 Z"
            fill={c.primary} opacity="0.6" />
      <path d="M15 21 Q15 17 24 17 Q33 17 33 21 L33 27 Q33 29 24 29 Q15 29 15 27 Z"
            fill={c.glow} opacity="0.3" />
      {/* visor highlight */}
      <path d="M16 18 Q20 17 28 17 L28 20 Q20 19 16 20 Z" fill="white" opacity="0.15" />
      {/* ear piece */}
      <rect x="6" y="22" width="5" height="10" rx="2" fill={c.primary} />
      <rect x="37" y="22" width="5" height="10" rx="2" fill={c.primary} />
      {/* chin guard */}
      <rect x="16" y="36" width="16" height="6" rx="2" fill={c.primary} />
      {/* tech strip on top */}
      <rect x="18" y="8" width="12" height="2" rx="1" fill={c.light} opacity="0.5" />
    </>
  );
}

function IconMask({ c }: { c: Colors }) {
  return (
    <>
      {/* mask shape */}
      <path d="M8 18 Q8 10 24 10 Q40 10 40 18 L40 30 Q40 38 24 38 Q8 38 8 30 Z"
            fill={c.primary} />
      <path d="M10 19 Q10 12 24 12 Q38 12 38 19 L38 30 Q38 36 24 36 Q10 36 10 30 Z"
            fill={c.dark} />
      {/* eye slits */}
      <rect x="12" y="17" width="10" height="5" rx="2" fill={c.glow} opacity="0.8" />
      <rect x="26" y="17" width="10" height="5" rx="2" fill={c.glow} opacity="0.8" />
      <rect x="13" y="18" width="8" height="3" rx="1" fill={c.light} opacity="0.5" />
      <rect x="27" y="18" width="8" height="3" rx="1" fill={c.light} opacity="0.5" />
      {/* nose vent */}
      <rect x="20" y="24" width="8" height="4" rx="1" fill={c.primary} opacity="0.5" />
      {/* mouth grille */}
      <rect x="14" y="30" width="20" height="4" rx="1" fill={c.primary} opacity="0.4" />
      <line x1="17" y1="30" x2="17" y2="34" stroke={c.dark} strokeWidth="1.5" />
      <line x1="21" y1="30" x2="21" y2="34" stroke={c.dark} strokeWidth="1.5" />
      <line x1="25" y1="30" x2="25" y2="34" stroke={c.dark} strokeWidth="1.5" />
      <line x1="29" y1="30" x2="29" y2="34" stroke={c.dark} strokeWidth="1.5" />
    </>
  );
}

function IconBoots({ c }: { c: Colors }) {
  return (
    <>
      {/* shaft of boot */}
      <rect x="12" y="6" width="14" height="24" rx="3" fill={c.primary} />
      <rect x="13" y="7" width="12" height="22" rx="2" fill={c.dark} />
      {/* toe box */}
      <path d="M12 28 L12 38 Q12 42 16 42 L34 42 Q38 42 38 40 L38 34 Q38 30 30 30 L26 30 L26 28 Z"
            fill={c.primary} />
      <path d="M14 30 L14 38 Q14 40 16 40 L34 40 Q36 40 36 38 L36 34 Q36 32 30 32 L28 32 L28 30 Z"
            fill={c.dark} />
      {/* neon sole strip */}
      <rect x="12" y="40" width="26" height="3" rx="1.5" fill={c.glow} opacity="0.9" />
      {/* tech straps */}
      <rect x="12" y="14" width="14" height="3" rx="1" fill={c.primary} opacity="0.6" />
      <rect x="12" y="20" width="14" height="3" rx="1" fill={c.primary} opacity="0.6" />
      {/* boot detail */}
      <rect x="15" y="8" width="8" height="18" rx="1" fill={c.primary} opacity="0.2" />
      <rect x="16" y="32" width="12" height="2" rx="0.5" fill={c.light} opacity="0.3" />
    </>
  );
}

function IconChip({ c }: { c: Colors }) {
  return (
    <>
      {/* chip body */}
      <rect x="10" y="10" width="28" height="28" rx="3" fill={c.primary} />
      <rect x="12" y="12" width="24" height="24" rx="2" fill={c.dark} />
      {/* circuit traces */}
      <rect x="14" y="14" width="8" height="8" rx="1" fill={c.primary} opacity="0.5" />
      <rect x="26" y="14" width="8" height="8" rx="1" fill={c.primary} opacity="0.5" />
      <rect x="14" y="26" width="8" height="8" rx="1" fill={c.primary} opacity="0.5" />
      <rect x="26" y="26" width="8" height="8" rx="1" fill={c.primary} opacity="0.5" />
      {/* center processor */}
      <rect x="19" y="19" width="10" height="10" rx="1.5" fill={c.primary} />
      <rect x="20" y="20" width="8" height="8" rx="1" fill={c.glow} opacity="0.6" />
      {/* connection pins */}
      <rect x="6" y="16" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="6" y="22" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="6" y="28" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="38" y="16" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="38" y="22" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="38" y="28" width="4" height="2" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="16" y="6" width="2" height="4" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="22" y="6" width="2" height="4" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="28" y="6" width="2" height="4" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="16" y="38" width="2" height="4" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="22" y="38" width="2" height="4" rx="0.5" fill={c.primary} opacity="0.7" />
      <rect x="28" y="38" width="2" height="4" rx="0.5" fill={c.primary} opacity="0.7" />
    </>
  );
}

function IconAmulet({ c }: { c: Colors }) {
  return (
    <>
      {/* chain */}
      <path d="M24 6 Q32 6 36 12" fill="none" stroke={c.dark} strokeWidth="2" strokeLinecap="round" />
      <path d="M24 6 Q16 6 12 12" fill="none" stroke={c.dark} strokeWidth="2" strokeLinecap="round" />
      {/* pendant hexagon */}
      <polygon points="24,12 32,16 32,28 24,32 16,28 16,16" fill={c.primary} />
      <polygon points="24,14 30,17.5 30,26.5 24,30 18,26.5 18,17.5" fill={c.dark} />
      {/* inner glow */}
      <polygon points="24,16 29,19 29,25 24,28 19,25 19,19" fill={c.primary} opacity="0.4" />
      <circle cx="24" cy="22" r="4" fill={c.glow} opacity="0.5" />
      <circle cx="24" cy="22" r="2" fill={c.light} opacity="0.8" />
      {/* rune marks */}
      <line x1="20" y1="19" x2="22" y2="21" stroke={c.light} strokeWidth="1" opacity="0.7" />
      <line x1="28" y1="19" x2="26" y2="21" stroke={c.light} strokeWidth="1" opacity="0.7" />
      <line x1="20" y1="25" x2="22" y2="23" stroke={c.light} strokeWidth="1" opacity="0.7" />
      <line x1="28" y1="25" x2="26" y2="23" stroke={c.light} strokeWidth="1" opacity="0.7" />
      {/* chain links */}
      <circle cx="24" cy="6" r="2.5" fill="none" stroke={c.primary} strokeWidth="1.5" />
      <circle cx="32" cy="9" r="1.5" fill="none" stroke={c.primary} strokeWidth="1" opacity="0.5" />
      <circle cx="16" cy="9" r="1.5" fill="none" stroke={c.primary} strokeWidth="1" opacity="0.5" />
    </>
  );
}

function IconMedkit() {
  const bg   = '#003d33';
  const body = '#00a88a';
  const light= '#00d4b0';
  const cross= '#80ffe8';
  const glow = '#00ffcc';
  return (
    <>
      {/* case body */}
      <rect x="8" y="10" width="32" height="28" rx="4" fill={bg} />
      <rect x="9" y="11" width="30" height="26" rx="3" fill={body} />
      {/* cross vertical */}
      <rect x="20" y="16" width="8" height="16" rx="2" fill={cross} />
      {/* cross horizontal */}
      <rect x="15" y="21" width="18" height="6" rx="2" fill={cross} />
      {/* glow center */}
      <circle cx="24" cy="24" r="4" fill={glow} opacity="0.35" />
      {/* top latch */}
      <rect x="19" y="7" width="10" height="5" rx="2" fill={light} />
      <rect x="20" y="8" width="8" height="3" rx="1" fill={bg} opacity="0.6" />
      {/* highlight stripe */}
      <rect x="10" y="12" width="3" height="22" rx="1.5" fill={light} opacity="0.25" />
    </>
  );
}

function IconGrenadeLauncher({ c }: { c: Colors }) {
  return (
    <>
      {/* stock */}
      <rect x="4" y="19" width="8" height="10" rx="2" fill={c.dark} />
      <rect x="5" y="20" width="6" height="8" rx="1" fill={c.primary} opacity="0.38" />
      {/* receiver body */}
      <rect x="10" y="16" width="26" height="14" rx="2" fill={c.primary} />
      <rect x="11" y="17" width="24" height="12" rx="1.5" fill={c.light} opacity="0.1" />
      {/* short fat barrel */}
      <rect x="36" y="14" width="10" height="18" rx="2.5" fill={c.dark} />
      <rect x="37" y="15" width="8" height="16" rx="2" fill={c.primary} opacity="0.5" />
      {/* wide bore muzzle ring */}
      <circle cx="45" cy="23" r="5.5" fill={c.dark} />
      <circle cx="45" cy="23" r="4" fill={c.primary} opacity="0.25" />
      <circle cx="45" cy="23" r="2.2" fill={c.glow} opacity="0.75" />
      <circle cx="45" cy="23" r="1" fill="white" opacity="0.5" />
      {/* drum magazine */}
      <circle cx="22" cy="37" r="8.5" fill={c.dark} />
      <circle cx="22" cy="37" r="7.5" fill={c.primary} opacity="0.72" />
      <circle cx="22" cy="37" r="4.5" fill={c.dark} />
      <circle cx="22" cy="37" r="2.5" fill={c.glow} opacity="0.45" />
      {/* drum bolt holes */}
      <circle cx="16" cy="32" r="1.5" fill={c.light} opacity="0.45" />
      <circle cx="28" cy="32" r="1.5" fill={c.light} opacity="0.45" />
      <circle cx="15" cy="41" r="1.5" fill={c.light} opacity="0.45" />
      <circle cx="29" cy="41" r="1.5" fill={c.light} opacity="0.45" />
      {/* grip */}
      <rect x="30" y="29" width="7" height="12" rx="2" fill={c.dark} />
      <rect x="31" y="30" width="5" height="10" rx="1" fill={c.primary} opacity="0.42" />
      {/* top sight rail */}
      <rect x="14" y="12" width="20" height="4" rx="1" fill={c.dark} />
      <circle cx="24" cy="14" r="2" fill={c.glow} opacity="0.65" />
    </>
  );
}

function IconBow({ c }: { c: Colors }) {
  return (
    <>
      {/* ── TOP LIMB: recurve shape — dark base then primary, tapers to tip ── */}
      <path d="M22,18 C23,13 28,8 33,6 C36,5 40,6 41,8"
            fill="none" stroke={c.dark} strokeWidth="6" strokeLinecap="round"/>
      <path d="M22,18 C23,13 28,8 33,6 C36,5 40,6 41,8"
            fill="none" stroke={c.primary} strokeWidth="4" strokeLinecap="round"/>
      {/* inner lamination edge — shows composite structure */}
      <path d="M22,19 C23,14 28,9 33,7 C36,6 39,7 40,9"
            fill="none" stroke={c.dark} strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
      {/* outer highlight (back face of limb) */}
      <path d="M22,17 C23,12 28,7 33,5"
            fill="none" stroke={c.light} strokeWidth="0.9" strokeLinecap="round" opacity="0.4"/>
      {/* mid-limb binding wrap (two stacked lines = wrapped cord) */}
      <line x1="27" y1="13.5" x2="29.5" y2="18.5" stroke={c.glow} strokeWidth="2.2" strokeLinecap="round" opacity="0.55"/>
      <line x1="29" y1="12.5" x2="31.5" y2="17.5" stroke={c.glow} strokeWidth="2.2" strokeLinecap="round" opacity="0.35"/>
      <line x1="28" y1="13"   x2="30.5" y2="18"   stroke={c.light} strokeWidth="0.5" strokeLinecap="round" opacity="0.6"/>

      {/* ── BOTTOM LIMB ── mirror of top */}
      <path d="M22,30 C23,35 28,40 33,42 C36,43 40,42 41,40"
            fill="none" stroke={c.dark} strokeWidth="6" strokeLinecap="round"/>
      <path d="M22,30 C23,35 28,40 33,42 C36,43 40,42 41,40"
            fill="none" stroke={c.primary} strokeWidth="4" strokeLinecap="round"/>
      <path d="M22,29 C23,34 28,39 33,41 C36,42 39,41 40,39"
            fill="none" stroke={c.dark} strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
      <path d="M22,31 C23,36 28,41 33,43"
            fill="none" stroke={c.light} strokeWidth="0.9" strokeLinecap="round" opacity="0.4"/>
      <line x1="27" y1="34.5" x2="29.5" y2="29.5" stroke={c.glow} strokeWidth="2.2" strokeLinecap="round" opacity="0.55"/>
      <line x1="29" y1="35.5" x2="31.5" y2="30.5" stroke={c.glow} strokeWidth="2.2" strokeLinecap="round" opacity="0.35"/>
      <line x1="28" y1="35"   x2="30.5" y2="30"   stroke={c.light} strokeWidth="0.5" strokeLinecap="round" opacity="0.6"/>

      {/* ── RISER: ergonomic handle with window cutout ── */}
      {/* riser body */}
      <path d="M17,16 C19,14 22,13 26,14 L27,15 L27,23 L27,25 L27,33 L26,34 C22,35 19,34 17,32 C16,30 15.5,27 16,24 C15.5,21 16,18 17,16 Z"
            fill={c.primary}/>
      {/* riser window / shadow — the cut-out that reduces weight and allows aiming */}
      <path d="M18,17 L25,16 L25,21 L23,22 L23,26 L25,27 L25,32 L18,31 C17.5,29 17.5,27 18,24 C17.5,21 17.5,19 18,17 Z"
            fill={c.dark} opacity="0.5"/>
      {/* limb pocket top (where limb bolts into riser) */}
      <rect x="21" y="13" width="6" height="3.5" rx="1" fill={c.dark} opacity="0.75"/>
      {/* limb pocket bottom */}
      <rect x="21" y="31.5" width="6" height="3.5" rx="1" fill={c.dark} opacity="0.75"/>
      {/* arrow shelf (rest) */}
      <path d="M17,22.5 L13,22 L12.5,23.5 L13,24.5 L17,24 Z" fill={c.primary} opacity="0.9"/>
      {/* bow sight — crosshair circle on the riser */}
      <circle cx="15" cy="20" r="1.8" fill="none" stroke={c.glow} strokeWidth="0.8" opacity="0.6"/>
      <line x1="13.8" y1="20" x2="16.2" y2="20" stroke={c.glow} strokeWidth="0.4" opacity="0.55"/>
      <line x1="15"   y1="18.8" x2="15" y2="21.2" stroke={c.glow} strokeWidth="0.4" opacity="0.55"/>
      {/* grip texture — diagonal ridges */}
      <line x1="16.5" y1="25.5" x2="21" y2="26"   stroke={c.light} strokeWidth="0.7" opacity="0.35"/>
      <line x1="16.5" y1="27"   x2="21" y2="27.5" stroke={c.light} strokeWidth="0.7" opacity="0.35"/>
      <line x1="16.5" y1="28.5" x2="21" y2="29"   stroke={c.light} strokeWidth="0.7" opacity="0.35"/>
      {/* riser left-edge highlight */}
      <line x1="16.5" y1="18" x2="16.5" y2="30" stroke={c.light} strokeWidth="0.7" opacity="0.28"/>

      {/* ── TIP CAPS (glowing nock grooves at limb ends) ── */}
      <circle cx="41" cy="8"  r="3.2" fill={c.glow} opacity="0.85"/>
      <circle cx="41" cy="8"  r="1.6" fill={c.dark} opacity="0.6"/>
      <circle cx="41" cy="40" r="3.2" fill={c.glow} opacity="0.85"/>
      <circle cx="41" cy="40" r="1.6" fill={c.dark} opacity="0.6"/>

      {/* ── BOWSTRING ── */}
      {/* soft bloom around the drawn string */}
      <line x1="41" y1="8"  x2="30" y2="24" stroke={c.glow} strokeWidth="6" opacity="0.09" strokeLinecap="round"/>
      <line x1="41" y1="40" x2="30" y2="24" stroke={c.glow} strokeWidth="6" opacity="0.09" strokeLinecap="round"/>
      {/* white inner strand */}
      <line x1="41" y1="8"  x2="30" y2="24" stroke={c.light} strokeWidth="1" opacity="0.35" strokeLinecap="round"/>
      <line x1="41" y1="40" x2="30" y2="24" stroke={c.light} strokeWidth="1" opacity="0.35" strokeLinecap="round"/>
      {/* main energy string */}
      <line x1="41" y1="8"  x2="30" y2="24" stroke={c.glow} strokeWidth="1.8" opacity="0.95" strokeLinecap="round"/>
      <line x1="41" y1="40" x2="30" y2="24" stroke={c.glow} strokeWidth="1.8" opacity="0.95" strokeLinecap="round"/>
      {/* serving / nocking point — wrapped cord around center */}
      <rect x="28.5" y="22.4" width="3" height="3.2" rx="0.5" fill="none" stroke={c.glow} strokeWidth="1" opacity="0.65"/>
      <line x1="29.5" y1="22.4" x2="29.5" y2="25.6" stroke={c.glow} strokeWidth="0.4" opacity="0.5"/>
      {/* idle brace string — faint arc tip to tip */}
      <path d="M41,8 Q43.5,24 41,40" fill="none" stroke={c.glow} strokeWidth="0.8" opacity="0.18" strokeDasharray="2,3"/>

      {/* ── ARROW ── */}
      {/* shaft */}
      <line x1="8" y1="24" x2="33" y2="24" stroke={c.light} strokeWidth="2" strokeLinecap="round"/>
      {/* shaft underside shadow for depth */}
      <line x1="8" y1="24.7" x2="33" y2="24.7" stroke={c.dark} strokeWidth="0.7" opacity="0.3"/>
      {/* 3 vanes — top, bottom, and angled side */}
      <path d="M8,24 L12,19 L16.5,24" fill={c.primary} opacity="0.92"/>
      <line x1="12.5" y1="19.5" x2="13" y2="24" stroke={c.light} strokeWidth="0.5" opacity="0.5"/>
      <path d="M8,24 L12,29 L16.5,24" fill={c.primary} opacity="0.92"/>
      <line x1="12.5" y1="28.5" x2="13" y2="24" stroke={c.light} strokeWidth="0.5" opacity="0.5"/>
      {/* side vane (rotated ~120° — gives 3D depth illusion) */}
      <path d="M9,23 L12,20.5 L16,23" fill={c.dark} opacity="0.65"/>
      {/* nock — the V-shaped notch at the rear of the arrow */}
      <path d="M5,22.5 L8,24 L5,25.5" fill="none" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="5" cy="24" r="1" fill={c.dark} opacity="0.6"/>
      {/* field point tip */}
      <path d="M33,22.8 L38.5,24 L33,25.2 Z" fill={c.light}/>
      <line x1="33.5" y1="23.5" x2="38" y2="24" stroke={c.primary} strokeWidth="0.5" opacity="0.4"/>
    </>
  );
}

function IconFlamer({ c }: { c: Colors }) {
  return (
    <>
      {/* fuel canister */}
      <rect x="3" y="13" width="14" height="22" rx="4" fill={c.dark} />
      <rect x="5" y="15" width="10" height="18" rx="3" fill={c.primary} opacity="0.68" />
      {/* tank fuel-level bar */}
      <rect x="6" y="17" width="8" height="3" rx="1" fill={c.dark} opacity="0.5" />
      <rect x="6" y="17" width="6" height="3" rx="1" fill={c.glow} opacity="0.55" />
      {/* tank cap/valve */}
      <rect x="7" y="11" width="7" height="3" rx="1" fill={c.primary} />
      <circle cx="10.5" cy="11" r="1.5" fill={c.light} opacity="0.6" />
      {/* pressure hose */}
      <path d="M17 23 Q20 20 23 23" fill="none" stroke={c.dark} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M17 23 Q20 20 23 23" fill="none" stroke={c.primary} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      {/* barrel body */}
      <rect x="22" y="18" width="20" height="10" rx="2" fill={c.primary} />
      <rect x="23" y="19" width="18" height="8" rx="1.5" fill={c.dark} opacity="0.38" />
      {/* barrel vent slots */}
      <rect x="28" y="20" width="8" height="1.5" rx="0.5" fill={c.light} opacity="0.3" />
      <rect x="28" y="24" width="8" height="1.5" rx="0.5" fill={c.light} opacity="0.3" />
      {/* nozzle flare */}
      <path d="M42 17 L46 14 L46 32 L42 29 Z" fill={c.dark} />
      <path d="M42 18 L45 15.5 L45 30.5 L42 28 Z" fill={c.primary} opacity="0.5" />
      {/* flame burst outer */}
      <ellipse cx="47" cy="24" rx="4.5" ry="9"  fill={c.glow} opacity="0.28" />
      <ellipse cx="46" cy="24" rx="3.2" ry="6.5" fill={c.glow} opacity="0.55" />
      <ellipse cx="45" cy="24" rx="2"   ry="4"   fill={c.light} opacity="0.8" />
      {/* flame tendrils */}
      <path d="M44 16 Q48 11 46 7"  fill="none" stroke={c.glow} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M44 32 Q48 37 46 41" fill="none" stroke={c.glow} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* grip */}
      <rect x="28" y="27" width="7" height="12" rx="2" fill={c.dark} />
      <rect x="29" y="28" width="5" height="10" rx="1" fill={c.primary} opacity="0.42" />
    </>
  );
}

function IconPistol({ c }: { c: Colors }) {
  return (
    <>
      {/* hammer/back block */}
      <rect x="10" y="17" width="5" height="9" rx="1" fill={c.dark} />
      <rect x="11" y="18" width="3" height="7" rx="0.5" fill={c.primary} opacity="0.4" />
      {/* slide / main body */}
      <rect x="13" y="15" width="22" height="13" rx="2" fill={c.primary} />
      <rect x="14" y="16" width="20" height="11" rx="1.5" fill={c.light} opacity="0.12" />
      {/* tech panel on slide */}
      <rect x="21" y="17" width="10" height="5" rx="0.5" fill={c.dark} opacity="0.35" />
      {/* barrel */}
      <rect x="35" y="18" width="10" height="7" rx="1.5" fill={c.dark} />
      <rect x="36" y="19" width="8" height="5" rx="1" fill={c.primary} opacity="0.55" />
      {/* muzzle energy */}
      <circle cx="45" cy="21.5" r="2.5" fill={c.glow} opacity="0.9" />
      <circle cx="45" cy="21.5" r="1.2" fill="white" opacity="0.55" />
      {/* sight rail */}
      <rect x="16" y="12" width="18" height="3" rx="1" fill={c.dark} />
      <rect x="18" y="12" width="2" height="3" rx="0.5" fill={c.primary} opacity="0.6" />
      <rect x="30" y="12" width="2" height="3" rx="0.5" fill={c.primary} opacity="0.6" />
      {/* angled grip */}
      <polygon points="15,28 22,28 19,44 12,44" fill={c.dark} />
      <polygon points="16,29 21,29 18,43 13,43" fill={c.primary} opacity="0.45" />
      {/* grip texture lines */}
      <line x1="14" y1="34" x2="20.5" y2="34" stroke={c.light} strokeWidth="1" opacity="0.28" />
      <line x1="13.5" y1="39" x2="19.5" y2="39" stroke={c.light} strokeWidth="1" opacity="0.28" />
      {/* trigger guard arc */}
      <path d="M22 28 Q23 36 16 36 L13 36 L13 28" fill="none" stroke={c.dark} strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
}

function IconWhip({ c }: { c: Colors }) {
  return (
    <>
      {/* handle body */}
      <rect x="4" y="35" width="13" height="8" rx="2" fill={c.dark} />
      <rect x="5" y="36" width="11" height="6" rx="1.5" fill={c.primary} opacity="0.65" />
      {/* grip bands */}
      <line x1="5" y1="38.5" x2="16" y2="38.5" stroke={c.light} strokeWidth="1.2" opacity="0.3" />
      <line x1="5" y1="40.5" x2="16" y2="40.5" stroke={c.light} strokeWidth="1.2" opacity="0.3" />
      {/* emitter at tip of handle */}
      <circle cx="17" cy="39" r="2.5" fill={c.glow} opacity="0.6" />
      {/* whip cord — thick shadow pass */}
      <path d="M17 39 C22 33 27 27 33 20 C37 15 40 10 43 4"
            fill="none" stroke={c.dark} strokeWidth="4.5" strokeLinecap="round" />
      {/* whip cord — main color */}
      <path d="M17 39 C22 33 27 27 33 20 C37 15 40 10 43 4"
            fill="none" stroke={c.primary} strokeWidth="2.5" strokeLinecap="round" />
      {/* whip cord — energy glow overlay */}
      <path d="M17 39 C22 33 27 27 33 20 C37 15 40 10 43 4"
            fill="none" stroke={c.glow} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      {/* energy nodes along cord */}
      <circle cx="24" cy="31" r="2" fill={c.glow} opacity="0.7" />
      <circle cx="31" cy="22" r="1.8" fill={c.glow} opacity="0.75" />
      <circle cx="38" cy="13" r="1.5" fill={c.glow} opacity="0.8" />
      {/* electric arcs off cord */}
      <line x1="24" y1="31" x2="28" y2="27" stroke={c.glow} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      <line x1="32" y1="21" x2="36" y2="17" stroke={c.glow} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      {/* crackling tip */}
      <circle cx="43" cy="4" r="4" fill={c.glow} opacity="0.3" />
      <circle cx="43" cy="4" r="2.5" fill={c.glow} opacity="0.65" />
      <circle cx="43" cy="4" r="1.2" fill={c.light} opacity="0.95" />
      {/* tip sparks */}
      <line x1="43" y1="4" x2="47" y2="1" stroke={c.glow} strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
      <line x1="43" y1="4" x2="46" y2="7" stroke={c.glow} strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
      <line x1="43" y1="4" x2="39" y2="1" stroke={c.glow} strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
    </>
  );
}

function IconAxe({ c }: { c: Colors }) {
  return (
    <>
      {/* shaft */}
      <rect x="21" y="20" width="6" height="26" rx="2" fill={c.dark} />
      <rect x="22.5" y="22" width="3" height="22" rx="1" fill={c.primary} opacity="0.42" />
      {/* shaft grip bands */}
      <rect x="21" y="29" width="6" height="2" rx="0.5" fill={c.primary} opacity="0.55" />
      <rect x="21" y="37" width="6" height="2" rx="0.5" fill={c.primary} opacity="0.55" />
      {/* pommel */}
      <ellipse cx="24" cy="47" rx="4.5" ry="2" fill={c.primary} />
      {/* axe head — wide blade extending left from shaft */}
      <path d="M24 3 L30 4 L28 22 L20 22 Q7 21 5 13 Q3 5 24 3 Z" fill={c.primary} />
      <path d="M24 6 L28 7 L26 20 L21 20 Q10 19 9 13 Q7 7 24 6 Z" fill={c.dark} />
      {/* cutting edge plasma glow */}
      <path d="M5 13 Q3 5 24 3" fill="none" stroke={c.glow} strokeWidth="3" opacity="0.95" strokeLinecap="round" />
      {/* secondary glow line (inner edge) */}
      <path d="M8 16 Q7 8 22 5" fill="none" stroke={c.glow} strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
      {/* blade surface etch lines */}
      <line x1="22" y1="9" x2="13" y2="13" stroke={c.light} strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      <line x1="22" y1="15" x2="10" y2="17" stroke={c.light} strokeWidth="1" opacity="0.35" strokeLinecap="round" />
      {/* top spike of blade */}
      <polygon points="24,3 31,4 28,0 23,0" fill={c.light} opacity="0.75" />
    </>
  );
}

const ICON_MAP: Record<string, (c: Colors) => React.ReactElement> = {
  sword:         (c) => <IconSword c={c} />,
  cannon:        (c) => <IconCannon c={c} />,
  fusion_cannon: (c) => <IconFusionCannon c={c} />,
  hammer:  (c) => <IconHammer c={c} />,
  lance:   (c) => <IconLance c={c} />,
  railgun: (c) => <IconRailgun c={c} />,
  knife:   (c) => <IconKnife c={c} />,
  grenade_launcher: (c) => <IconGrenadeLauncher c={c} />,
  bow:     (c) => <IconBow c={c} />,
  flamer:  (c) => <IconFlamer c={c} />,
  pistol:  (c) => <IconPistol c={c} />,
  whip:    (c) => <IconWhip c={c} />,
  axe:     (c) => <IconAxe c={c} />,
  rifle:   (c) => <IconRifle c={c} />,
  sniper:  (c) => <IconSniper c={c} />,
  staff:   (c) => <IconStaff c={c} />,
  wand:    (c) => <IconWand c={c} />,
  orb:     (c) => <IconOrb c={c} />,
  vest:    (c) => <IconVest c={c} />,
  exo:     (c) => <IconExo c={c} />,
  suit:    (c) => <IconSuit c={c} />,
  visor:   (c) => <IconVisor c={c} />,
  helmet:  (c) => <IconHelmet c={c} />,
  mask:    (c) => <IconMask c={c} />,
  boots:   (c) => <IconBoots c={c} />,
  chip:    (c) => <IconChip c={c} />,
  amulet:  (c) => <IconAmulet c={c} />,
  medkit:  (_c) => <IconMedkit />,
};

interface Props {
  item: Item;
  size?: number;
  scale?: number;
  style?: React.CSSProperties;
}

const ITEM_IMAGE_MAP: Partial<Record<string, { src: string; w: number; h: number }>> = {
  cannon_fusion: { src: cannonFusionSrc, w: 2.4, h: 1 },
};

export default function ItemIcon({ item, size, scale, style }: Props) {
  const px = size ?? (scale ? scale * 12 : 48);

  if (item.slot === 'mystery_box') {
    const BOX_IMG: Partial<Record<string, string>> = {
      common:    mysteryBoxCommonSrc,
      uncommon:  mysteryBoxRareSrc,
      rare:      mysteryBoxUncommonSrc,
      epic:      mysteryBoxSrc,
      legendary: mysteryBoxLegendarySrc,
    };
    const src = BOX_IMG[item.rarity] ?? mysteryBoxSrc;
    return (
      <img
        src={src}
        width={px}
        height={px}
        style={{ display: 'block', flexShrink: 0, objectFit: 'contain', ...style }}
        alt={item.name}
      />
    );
  }

  const custom = ITEM_IMAGE_MAP[item.id];
  if (custom) {
    return (
      <img
        src={custom.src}
        width={Math.round(px * custom.w)}
        height={Math.round(px * custom.h)}
        style={{ display: 'block', flexShrink: 0, objectFit: 'contain', ...style }}
        alt={item.name}
      />
    );
  }

  const colors = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common;
  const category = getCategory(item);
  const render = ICON_MAP[category] ?? ICON_MAP.sword;
  const filterId = `glow-${item.rarity}`;

  return (
    <svg
      viewBox="0 0 48 48"
      width={px}
      height={px}
      style={{ display: 'block', flexShrink: 0, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {render(colors)}
      </g>
    </svg>
  );
}
