// Pixel art sprites encoded as rows of color codes
// Each char = 1 pixel. '_' = transparent.
const P: Record<string, string> = {
  _: 'transparent',
  S: '#FFCC99', // skin light (overridable)
  s: '#D4956A', // skin shadow (overridable)
  R: '#CC2211', // red armor
  r: '#FF5533', // red armor highlight
  d: '#990000', // red armor shadow
  M: '#909090', // metal mid
  m: '#505050', // metal shadow
  L: '#D8D8D8', // metal light
  A: '#F0F0F0', // metal bright highlight
  D: '#111111', // dark outline
  v: '#252525', // very dark (visor, deep shadow)
  G: '#FFD700', // gold
  z: '#AA8800', // gold shadow
  g: '#228822', // dark green (enemies)
  B: '#3A1C00', // boot dark
  b: '#7A5535', // boot light
  U: '#1133AA', // blue robe
  u: '#2255CC', // blue robe light
  F: '#1A3D1A', // forest green (rogue)
  f: '#2D6B2D', // forest green light
  e: '#102810', // forest green shadow
  W: '#EEEEEE', // white/bone
  w: '#BBBBBB', // off-white
  k: '#33AA33', // goblin skin
  c: '#AA6633', // orc/troll skin
  P: '#7722AA', // purple
  p: '#AA44CC', // purple light
  O: '#FF6600', // orange fire
  Y: '#FFFF00', // yellow fire
  T: '#00AAAA', // teal
  N: '#886622', // brown
  E: '#4488FF', // eye blue
  H: '#1166AA', // helmet blue (enemies)
  h: '#884400', // hair (overridable)
  x: '#C0D0E0', // weapon silver
  X: '#E8F4FF', // weapon shine
  n: '#1A0800', // very dark brown outline
};

function decode(rows: string[]): string[][] {
  return rows.map(row => row.split('').map(ch => P[ch] ?? 'transparent'));
}

// ── Hero sprites 20×32 ────────────────────────────────────────────────────

export const SPRITE_WARRIOR = decode([
  // helmet
  '______DDDDDDD_______',
  '_____DmMMMMMmD______',
  '_____DmMLLALMmD_____',
  '_____DMLSSSSsLMD____',
  '_____DMLSEDDsLMD____',
  '_____DMLSSSSsLMD____',
  '______DSSSSsssD_____',
  // shoulders + chest
  '_____DRRRRRRRRRd____',
  '___DRRRrRRRRrRRRd___',
  '___DRRdRRRRRRdRRd___',
  '___DRRRRGRRRGRRRd___',
  '___DRRrRRRRRRrRRd___',
  '___DRRdRRRRRRdRRd___',
  '____DGGGGGGGGGGd____',
  '___DRRRRRRRRRRRRd___',
  // legs transition
  '____mLLLmDDDmLLLm___',
  '____mLLLmD_DmLLLm___',
  '____mLLLmD_DmLLLm___',
  '____mLmmmd_dmLmmm___',
  '____mmmmmd_dmmmmm___',
  // shins
  '____mLLmmd_dmLLmm___',
  '____mLLmmd_dmLLmm___',
  '____mLmmmd_dmLmmm___',
  '_____LLLmd__dLLLm___',
  '____mLLLmd__dmLLLm__',
  '____mLLLmd__dmLLLm__',
  // boots
  '____BBBBmd__dBBBBm__',
  '____BBbBBd__dBBbBB__',
  '____BBbBBd__dBBbBB__',
  '____bBBBBd__dbBBBB__',
  '___DBBBBBd__dBBBBBD_',
  '___DBBBBBd__dBBBBBD_',
]);

export const SPRITE_MAGE = decode([
  // tall pointy hat
  '__________P_________',
  '_________PPP________',
  '________PPpPP_______',
  '_______PPPpPPP______',
  '______PPPPpPPPP_____',
  '_____DPPPpppPPPD____',
  '____DPPPPpSSSpPPPD__',
  // face
  '____DPPPpSSSSSspPD__',
  '____DPPPpSEDDEspPD__',
  '____DPPPpSSSSsspPD__',
  '_____DPPSSSSSSsPPD__',
  // robe shoulders
  '_____DPUUUUUUUUpD___',
  '___DPPUUuuUUuuUUPPD_',
  '___DpUUUuuUUuuUUUpD_',
  '___DpUUuuUUUUuuUUpD_',
  '___DpUUuUUUUUuUUUpD_',
  // robe body
  '___DpUUUUUUUUUUUpD__',
  '___DpUUUGUUUUUUUpD__',
  '___DpUUUUUUUUUUUpD__',
  '___DpUUUUUUUUUUUpD__',
  '____DpUUUU_UUUUpD___',
  '____DpUUUU_UUUUpD___',
  '____DpUUUU_UUUUpD___',
  '____DpUUUU_UUUUpD___',
  // legs/boots
  '_____DBBBb_bBBBD____',
  '_____DBBBb_bBBBD____',
  '_____DBBBb_bBBBD____',
  '_____bBBBB_BBBBb____',
  '_____bBBBB_BBBBb____',
  '____DBBBBBD_DBBBBBd_',
  '____DBBBBBd_dBBBBBD_',
  '____DBBBBBd_dBBBBBD_',
]);

export const SPRITE_ROGUE = decode([
  // dark hood with hair peeking
  '____DDDDDDDDDDDv____',
  '___DFFFFFFFFFFFFDv__',
  '__DFFfFFFFFFFfFFDv__',
  '__DFFfSSSSSSfFFDv___',
  '__DFFfSEDDEsFFFDv___',
  '__DFFfSSSSSSfFFDv___',
  '__DhhfSSSSSShhFFv___',
  // leather armor
  '__DFFFFFFFFFFFFDv___',
  '_DFFeFFFFFFFeFFDDv__',
  '_DFFFFeFFFFeFFFFDv__',
  '_DFFFFFeFFeFFFFEDv__',
  '_DFFFFFFFFFFFFFDv___',
  '__DFFFFFFFFFFFFDv___',
  '__DFFffFFFFFffFDv___',
  // belt
  '__DFNNNNNNNNNNNFDv__',
  // legs
  '___DFFFFmDDmFFFFDv__',
  '___DFFFFmD_DmFFFFv__',
  '___DFFFFmD_DmFFFFv__',
  '___DFFFmmd_dmmFFFv__',
  '___DFFmmmd_dmmFFFv__',
  // lower legs
  '___DFFFmmd_dmmFFFv__',
  '___DFFFmmd_dmmFFFv__',
  '___DFFFmmd_dmmFFFv__',
  '____DFFmmd__dmmFFv__',
  '____DFFmmd__dmmFFv__',
  '____DFFmmd__dmmFFv__',
  // boots
  '____DBBBmd__dmBBBD__',
  '____DBBbBd__dBbBBD__',
  '____DBBbBd__dBbBBD__',
  '____dbBBBd__dBBBbd__',
  '___DBBBBBd__dBBBBBD_',
  '___DBBBBBd__dBBBBBD_',
]);

// ── Enemy sprites (16×16) ────────────────────────────────────────────────

export const SPRITE_GOBLIN = decode([
  '___kkkkkkkk_____',
  '__kDkDkkkkkk____',
  '__kkkkkkkkkk____',
  '__k_kk__kk_k____',
  '___kkkkkkkkk____',
  '__cccccccccc____',
  '_kcccccccccck___',
  '__cccccccccc____',
  '__cccc__cccc____',
  '___kk____kk_____',
  '___kk____kk_____',
  '___kk____kk_____',
  '___kD____Dk_____',
  '________________',
  '________________',
  '________________',
]);

export const SPRITE_WOLF = decode([
  '__MMMMM_________',
  '_MMMLLMMMM______',
  'MMMLLLSLLMM_____',
  'MMLDDLDLLMM_____',
  '_MMMMMMMMMM_____',
  '__MMMMMMMMM_____',
  '__MMMMMMMMM_____',
  '__MM_MMMM_M_____',
  '__MM_MMMM_M_____',
  '___M_MMMM_M_____',
  '___M__MM__M_____',
  '___M__MM__M_____',
  '___M__MM__M_____',
  '___D__DD__D_____',
  '________________',
  '________________',
]);

export const SPRITE_SKELETON = decode([
  '____WWWWWWW_____',
  '___WWDWWWDWW____',
  '___WWWWWWWWW____',
  '____WWDDDWW_____',
  '_____WWWWW______',
  '___WWWWWWWWW____',
  '__WWWWWWWWWWW___',
  '___WWWWWWWWW____',
  '___WWWWWWWWW____',
  '___WW_WWW_WW____',
  '___WW_WWW_WW____',
  '___WW_WWW_WW____',
  '____W__W__W_____',
  '____W__W__W_____',
  '____W__W__W_____',
  '________________',
]);

export const SPRITE_TROLL = decode([
  '__ccccccccc_____',
  '_cDcDccccccc____',
  '_ccccccccccc____',
  '_cc_cc__cc_cc___',
  '__ccccccccc_____',
  '_ccccccccccccc__',
  'cccccccccccccccc',
  '_ccccccccccccc__',
  '__ccccccccccc___',
  '__cccc___cccc___',
  '__cccc___cccc___',
  '__cccc___cccc___',
  '__cccc___cccc___',
  '__cDDD___DDDc___',
  '________________',
  '________________',
]);

export const SPRITE_VAMPIRE = decode([
  '____DDDDDDD_____',
  '___DPPPPPPPPD___',
  '___DPSSSSSSEPD__',
  '___DPSDDS_SD____',
  '____DSSSSSSD____',
  '___PPPPPPPPP____',
  '__DPPPPPPPPPD___',
  '__DPPPPPPPPPP___',
  '___PPPPPPPPP____',
  '___PPPP_PPPP____',
  '___PPPP_PPPP____',
  '___PPPP_PPPP____',
  '___PPPP_PPPP____',
  '___BBBB_BBBB____',
  '___BBBB_BBBB____',
  '________________',
]);

export const SPRITE_DRAGON = decode([
  '_______GGGGGG___',
  '______GGGGGGGGG_',
  '____GGOGGGOGGGG_',
  '___GGGGGGGGGGGG_',
  '__GGGGGGGGGGGGG_',
  '_GGGGGGGGGGGGGG_',
  'GGGGGGGGGGGGGGG_',
  '_GGGGGGGGGGGGG__',
  '__GGGGGGGGGGGG__',
  '__GGGGG__GGGGG__',
  '__GGGGG__GGGGG__',
  '___GGGG__GGGG___',
  '___GGGGGGGGG____',
  '____GGGGGGG_____',
  '_____GGGGG______',
  '________________',
]);

export const SPRITE_WYVERN = decode([
  '______gggggg____',
  '_____gggggggg___',
  '____gDgggDggg___',
  '___ggggggggggg__',
  '__ggOggggggggg__',
  '_gggggggggggggg_',
  'ggggggggggggggg_',
  '_ggggggggggggg__',
  '__gggggggggggg__',
  '__ggggg__ggggg__',
  '__ggggg__ggggg__',
  '___gggg__gggg___',
  '___ggggggggg____',
  '____ggggggg_____',
  '________________',
  '________________',
]);

export const SPRITE_FIRE = decode([
  '____YYYYYYY_____',
  '___YYYOOYYY_____',
  '__YYYYOOOYYY____',
  '__YOOOOOOOYY____',
  '_YOOOOOOOOYY____',
  '_YOOOOOOOYYY____',
  '__OOOOOOOYY_____',
  '__OOOOOOYY______',
  '___OOOOYY_______',
  '___OOOYY________',
  '____OOY_________',
  '____OY__________',
  '_____Y__________',
  '________________',
  '________________',
  '________________',
]);

export const SPRITE_DARK_KNIGHT = decode([
  '____DDDDDDDD____',
  '___DDLLLLLLDD___',
  '___DDSSSSSSDD___',
  '___DDSDDSDDD____',
  '____SSSSSSSS____',
  '__RRRRRRRRRRRR__',
  'DD_RRRRRRRRRR_DD',
  'DD_RRGRRRRGRR_DD',
  '__RRRRRRRRRRRR__',
  '__DDRRRRRRRRD___',
  '__DDDDDDDDDDDD__',
  '__DD____DDDD____',
  '__DD____DDDD____',
  '__DD____DDDD____',
  '__DDD___DDD_____',
  '__DDD___DDD_____',
]);

export const SPRITE_LICH = decode([
  '____WWWWWWWW____',
  '___WWWWWWWWWW___',
  '___WWDWWWWDWW___',
  '___WWDDDDDWWW___',
  '____WWWWWWWW____',
  '__PPPPPPPPPPPP__',
  '_WPPPPPPPPPPPPW_',
  '__PPPPPPPPPPPP__',
  '__PPPP__PPPPPP__',
  '__PPPP__PPPP____',
  '__PPPP__PPPP____',
  '__PPPP__PPPP____',
  '___PPP__PPP_____',
  '___PPP__PPP_____',
  '___WW____WW_____',
  '________________',
]);

export type SpriteKey =
  | 'warrior' | 'mage' | 'rogue'
  | 'goblin' | 'wolf' | 'orc' | 'bandit'
  | 'bat' | 'skeleton' | 'troll'
  | 'vampire' | 'lich' | 'dark_knight'
  | 'wyvern' | 'fire_elemental' | 'dragon';

export const ENEMY_SPRITES: Record<SpriteKey, string[][]> = {
  warrior: SPRITE_WARRIOR,
  mage: SPRITE_MAGE,
  rogue: SPRITE_ROGUE,
  goblin: SPRITE_GOBLIN,
  wolf: SPRITE_WOLF,
  orc: SPRITE_TROLL,
  bandit: SPRITE_DARK_KNIGHT,
  bat: SPRITE_VAMPIRE,
  skeleton: SPRITE_SKELETON,
  troll: SPRITE_TROLL,
  vampire: SPRITE_VAMPIRE,
  lich: SPRITE_LICH,
  dark_knight: SPRITE_DARK_KNIGHT,
  wyvern: SPRITE_WYVERN,
  fire_elemental: SPRITE_FIRE,
  dragon: SPRITE_DRAGON,
};

// ── Appearance customisation ─────────────────────────────────────────────

export const SKIN_TONES = [
  { name: 'Blada',         light: '#FFE4D0', shadow: '#F5C0A0' },
  { name: 'Jasna',         light: '#FFCC99', shadow: '#D4956A' },
  { name: 'Śniada',        light: '#C8874E', shadow: '#A06030' },
  { name: 'Ciemna',        light: '#8B5A2B', shadow: '#6B3C18' },
  { name: 'Bardzo ciemna', light: '#5C3317', shadow: '#3D1F0A' },
];

export const HAIR_COLORS = [
  { name: 'Blond',    light: '#F5D26C', shadow: '#C8A020' },
  { name: 'Rudy',     light: '#CC4411', shadow: '#882200' },
  { name: 'Brązowy',  light: '#7A4A22', shadow: '#4A2810' },
  { name: 'Czarny',   light: '#1A1208', shadow: '#0A0806' },
  { name: 'Siwy',     light: '#C8C8C8', shadow: '#909090' },
];

export function getHeroPalette(skinTone: number, hairColor: number): Record<string, string> {
  const skin = SKIN_TONES[skinTone] ?? SKIN_TONES[1];
  const hair = HAIR_COLORS[hairColor] ?? HAIR_COLORS[2];
  return {
    '#FFCC99': skin.light,
    '#D4956A': skin.shadow,
    '#884400': hair.light,
  };
}
