// Pixel art sprites encoded as rows of color codes
// Each char = 1 pixel. '_' = transparent.
const P: Record<string, string> = {
  _: 'transparent',
  S: '#FFCC99', // skin light (overridable)
  s: '#D4956A', // skin shadow (overridable)
  R: '#CC2211', // red armor
  r: '#FF5533', // red armor highlight
  d: '#990000', // red armor shadow
  M: '#909090', // metal
  m: '#505050', // metal shadow
  L: '#D8D8D8', // metal light
  D: '#111111', // dark outline
  G: '#FFD700', // gold
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
};

function decode(rows: string[]): string[][] {
  return rows.map(row => row.split('').map(ch => P[ch] ?? 'transparent'));
}

// Hero sprites — 16×24 with shading
export const SPRITE_WARRIOR = decode([
  '____mMMMMMMMm___',
  '___mMLLLLLLMm___',
  '___MLSSSSSSsM___',
  '___MLSEDDEsM____',
  '___MLSSSSSSsM___',
  '____SSSSSSSs____',
  '__RRRRRRRRRRRr__',
  '_MRRRrRRRRRrRRM_',
  '_MRRdRRRRRRdRRM_',
  '_MRRRRRGRRRRrRM_',
  '_MRRRdRRRRRdRRM_',
  '__MGGGGGGGGGMM__',
  '__LLmLLLLLLmLL__',
  '___LmLL___LmLL__',
  '___LmLL___LmLL__',
  '___LmLL___LmLL__',
  '___mMmm___mMmm__',
  '___LLLm___LLLm__',
  '___LLLm___LLLm__',
  '___LLmm___LLmm__',
  '___BBbb___BBbb__',
  '___BBbb___BBbb__',
  '___bBBB___bBBB__',
  '___BBBB___BBBB__',
]);

export const SPRITE_MAGE = decode([
  '_____PPPPPP_____',
  '____PppppppP____',
  '___PPpSSSSsPP___',
  '___PPpSEDDsP____',
  '___PPpSSSSsPP___',
  '____pSSSSSsp____',
  '____UUUUUUUU____',
  '__PUUuuUUUuUP___',
  '__pUUuuuuuuUp___',
  '__pUUuUUUUuUp___',
  '__pUUUuuuUUUp___',
  '__pUUUUuUUUUp___',
  '___pUUUUUUUUp___',
  '___pUUUU_UUUp___',
  '___pUUUU_UUUp___',
  '___pUUUU_UUUp___',
  '___pUUUU_UUUp___',
  '___BBBb__BBBb___',
  '___BBBb__BBBb___',
  '___bBBB__bBBB___',
  '___bBBB__bBBB___',
  '___BBBB__BBBB___',
  '________________',
  '________________',
]);

export const SPRITE_ROGUE = decode([
  '____FFFFFFFF____',
  '___FFffffffFF___',
  '__FFfSSSSSSsFf__',
  '__FFfSEDDsEsFf__',
  '__FFfSSSSSsSFf__',
  '__hhfSSSSSshff__',
  '__fFFFFFFFFFf___',
  '_fFFeFFFFFFeFFf_',
  '_fFFFeFFFFFeFff_',
  '_fFFFFFfFFFFFff_',
  '_fFFFFFFFFFFFff_',
  '__fFFFFFFFFFf___',
  '__fFFFFF_FFff___',
  '__fFFFFF_FFff___',
  '__fFFFFF_FFff___',
  '__fFFFFF_FFff___',
  '__fFFFFF_FFff___',
  '___BBBb__BBBb___',
  '___BBBb__BBBb___',
  '___bBBB__bBBB___',
  '___bBBB__bBBB___',
  '___BBBB__BBBB___',
  '________________',
  '________________',
]);

// Enemy sprites — 16×16 (unchanged)
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

// Appearance customisation
export const SKIN_TONES = [
  { name: 'Blada',        light: '#FFE4D0', shadow: '#F5C0A0' },
  { name: 'Jasna',        light: '#FFCC99', shadow: '#D4956A' },
  { name: 'Śniada',       light: '#C8874E', shadow: '#A06030' },
  { name: 'Ciemna',       light: '#8B5A2B', shadow: '#6B3C18' },
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
