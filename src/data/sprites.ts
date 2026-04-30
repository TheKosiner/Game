// Pixel art sprites encoded as rows of color codes
// Each char = 1 pixel. '_' = transparent.
const P: Record<string, string> = {
  _: 'transparent',
  S: '#FFCC99', // skin
  R: '#CC2211', // red armor
  r: '#FF4444', // bright red
  M: '#999999', // metal
  L: '#DDDDDD', // light metal
  D: '#111111', // dark/outline
  G: '#FFD700', // gold
  B: '#553311', // boot brown
  U: '#1133AA', // blue robe
  u: '#3355DD', // blue robe light
  g: '#228822', // dark green
  F: '#1A3D1A', // forest green (rogue)
  f: '#2D5A2D', // forest green light
  W: '#EEEEEE', // white/bone
  w: '#BBBBBB', // off-white
  k: '#33AA33', // goblin skin
  c: '#AA6633', // orc skin
  P: '#7722AA', // purple
  p: '#AA44CC', // purple light
  O: '#FF6600', // orange fire
  Y: '#FFFF00', // yellow fire
  T: '#00AAAA', // teal
  N: '#886622', // brown
  E: '#4488FF', // eye blue
  H: '#1166AA', // helmet blue
};

function decode(rows: string[]): string[][] {
  return rows.map(row => row.split('').map(ch => P[ch] ?? 'transparent'));
}

export const SPRITE_WARRIOR = decode([
  '____MMMMMMMM____',
  '___MLLLLLLLLM___',
  '___MSSSSSSSSM___',
  '___MSSDDSSDDSM__',
  '____SSSSSSSS____',
  '__RRRRRRRRRRRR__',
  'MM_RRRRRRRRRR_MM',
  'MM_RRRRRRGRRR_MM',
  '__RRRRRRRRRRRR__',
  '__MGRRRRRRRRGM__',
  '__LLLLLLLLLLLL__',
  '__LL____LLLL____',
  '__LL____LLLL____',
  '__LL____LLLL____',
  '__BB_____BB_____',
  '__BB_____BB_____',
]);

export const SPRITE_MAGE = decode([
  '_____PPPPPP_____',
  '____PPPPPPPP____',
  '___PPPPPPPPPP___',
  '____PSSSSSSSP___',
  '____PSDDS_SSP___',
  '_____SSSSSSSS___',
  '___UUUUUUUUUU___',
  '__PUUUUUUUUUUP__',
  '___UUUUUUUUUU___',
  '___UUUUUUUUUU___',
  '___UUUUUUUUUU___',
  '___UUUU__UUUU___',
  '___UUUU__UUUU___',
  '___UUUU__UUUU___',
  '___BBBB__BBBB___',
  '___BBBB__BBBB___',
]);

export const SPRITE_ROGUE = decode([
  '___DDDDDDDD_____',
  '__DFFFFFFFFF____',
  '__DFSSSSSSFD____',
  '__DFSDDS_SFD____',
  '___FSSSSSSF_____',
  '__FFFFFFFFFFF___',
  '_DFFDDDDDDDFD___',
  '__FFDDDDDDDFF___',
  '__FFDDDDDDFF____',
  '__FFFF__FFFF____',
  '__FFFF__FFFF____',
  '__FFFF__FFFF____',
  '__FFFF__FFFF____',
  '__FFFF__FFFF____',
  '__BBBB__BBBB____',
  '__BBBB__BBBB____',
]);

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
