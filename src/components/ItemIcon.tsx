import React from 'react';
import type { Item, Rarity } from '../types';
import cannonFusionSrc from '../assets/cannon_fusion.png';
import mysteryBoxSrc from '../assets/mystery-box.png';
import mysteryBoxUncommonSrc from '../assets/mystery-box-uncommon.png';
import mysteryBoxCommonSrc from '../assets/mystery-box-common.png';

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
  if (id.startsWith('blade_')) return 'sword';
  if (id === 'cannon_fusion') return 'fusion_cannon';
  if (id.startsWith('cannon_')) return 'cannon';
  if (id.startsWith('baton_') || id.startsWith('mace_') || id.startsWith('hammer_') || id.startsWith('maul_')) return 'hammer';
  if (id.startsWith('pike_') || id.startsWith('lance_')) return 'lance';
  if (id.startsWith('railgun_')) return 'railgun';
  if (id.startsWith('knife_') || id.startsWith('shiv_') || id.startsWith('dagger_') || id.startsWith('cutter_')) return 'knife';
  if (id.startsWith('smg_') || id.startsWith('rifle_')) return 'rifle';
  if (id.startsWith('pistol_') || id.startsWith('sniper_')) return 'sniper';
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

const ICON_MAP: Record<string, (c: Colors) => React.ReactElement> = {
  sword:         (c) => <IconSword c={c} />,
  cannon:        (c) => <IconCannon c={c} />,
  fusion_cannon: (c) => <IconFusionCannon c={c} />,
  hammer:  (c) => <IconHammer c={c} />,
  lance:   (c) => <IconLance c={c} />,
  railgun: (c) => <IconRailgun c={c} />,
  knife:   (c) => <IconKnife c={c} />,
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
      common:   mysteryBoxCommonSrc,
      uncommon: mysteryBoxUncommonSrc,
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
