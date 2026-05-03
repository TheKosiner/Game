// Pixel art sprites — single char per pixel
const P: Record<string, string> = {
  _: 'transparent',
  // Skin (palette-overridable)
  S: '#FFCC99', s: '#D4956A', q: '#C07840',
  // Hair (palette-overridable)
  h: '#884400', H: '#BB6600',
  // Eye
  E: '#1A4AFF', e: '#0D2ABB',
  // Warrior armor — red plate
  R: '#CC2211', r: '#FF4422', d: '#881100', K: '#FF7755',
  // Mage robe — deep blue
  U: '#0E2A7A', u: '#1744B0', J: '#2A5FCC', j: '#0A1C52',
  // Rogue leather — forest dark
  F: '#1C3A10', f: '#2E5C1E', V: '#3D7828', v: '#122508',
  // Metals — armor/trim
  M: '#A0A8B0', m: '#606870', L: '#D8DDE2', A: '#F0F3F5',
  // Gold
  G: '#FFD700', z: '#AA8800', Z: '#FFF0A0',
  // Dark outline
  D: '#0A0C10',
  // Very dark / visor
  X: '#1A1E28', x: '#2A3040',
  // Boots / leather
  B: '#2C1A08', b: '#5C3A18', c: '#7A5028',
  // Goblin green
  k: '#3A7A22', K2: '#5AAA30',
  // Brown / orc
  O: '#7A4422', o: '#A06030',
  // Undead / bone
  W: '#E8E0CC', w: '#C0B898', Q: '#A09070',
  // Purple / magic
  P2: '#6622AA', p: '#9944DD', T: '#CC88FF',
  // Fire
  Y: '#FFEE00', y: '#FF8800', g: '#FF4400',
  // Teal / ice
  I: '#00CCCC', i: '#008888',
  // Dark green enemy
  N: '#225522', n: '#337733',
  // White / silver
  C: '#CCCCCC', c2: '#888888',
  // Blood red accent
  t: '#880000',
};

function decode(rows: string[]): string[][] {
  // multi-char codes replaced before split — use single chars only
  return rows.map(row => [...row].map(ch => P[ch] ?? 'transparent'));
}

// ── WARRIOR 20×32 ───────────────────────────────────────────────────────────
export const SPRITE_WARRIOR = decode([
  // Great helm — rounded top with visor
  '______DDDDDDDDD_____',
  '_____DmMMMMMMmD_____',
  '_____DmMLLLLMmD_____',
  '_____DMLXXXXLMD_____',
  '_____DMLXEeXLMD_____',
  '_____DMLXEeXLMD_____',
  '_____DMLXXXXLMD_____',
  '______DmmmmmmD______',
  // Gorget + pauldrons
  '___DDRRRRRRRRRRdD___',
  '__DRRrRRRRRRRrRRd___',
  '__DRdRRRRRRRRdRRd___',
  '__DRRRRGGGGRRRRRd___',
  '__DRRrRRRRRRrRRRd___',
  '__DRdRRRRRRRRdRRd___',
  '___DGGGGzGzGGGGd____',
  // Belt + upper legs
  '___DRRRRRRRRRRRRd___',
  '____DmLLmmDDmmLLmd__',
  '____DmLLmmD_DmmLLmd_',
  '____DmLmmmD_DmmmLmd_',
  '____Dmmmmmd_dmmmmmd_',
  // Greaves
  '____DmLLmmd_dmmLLmd_',
  '____DmLLmmd_dmmLLmd_',
  '____DmLmLmd_dmLmLmd_',
  '____DmLLmmd_dmmLLmd_',
  '____DmLLmmd_dmmLLmd_',
  '_____DLLmmd_dmmLLd__',
  // Sabatons
  '____DBBBbmd_dmbBBBD_',
  '____DBBbBBd_dBBbBBD_',
  '____DBBbBBd_dBBbBBD_',
  '____DBBBBBd_dBBBBBD_',
  '___DBBBBBBd_dBBBBBBD',
  '___DBBBBBBd_dBBBBBBD',
]);

// ── MAGE 20×32 ──────────────────────────────────────────────────────────────
export const SPRITE_MAGE = decode([
  // Tall conical hat
  '__________p_________',
  '_________ppp________',
  '________pP2pp_______',
  '_______pP2P2pp______',
  '______pP2P2P2pp_____',
  '_____DpP2P2P2ppD____',
  '____DpP2P2P2P2ppD___',
  // Hat brim + face
  '____DpppSSSSSpppD___',
  '____DpppSSSSSpppD___',
  '____DpppSEesSppD____',
  '_____DpSSSSSSppD____',
  '_____DpSSSSSSpD_____',
  // Collar + robe shoulders
  '____DpUUUUUUUUpD____',
  '___DjUUuJJJuUUUjD___',
  '___DjUUJjjjjJUUjD___',
  '___DjUUuJJJuUUUjD___',
  // Robe body with star gem
  '___DjUUUUUUUUUUjD___',
  '___DjUUUGZGUUUUjD___',
  '___DjUUUZGZUUUUjD___',
  '___DjUUUGZGUUUUjD___',
  '____DjUUUUUUUUjD____',
  '____DjUUUUUUUUjD____',
  '____DjUU_UUUUUjD____',
  '____DjUU_UUUUUjD____',
  // Legs
  '_____DjBBB_BBBjD____',
  '_____DjBBB_BBBjD____',
  '_____DjBBb_bBBjD____',
  '_____DjBBb_bBBjD____',
  // Boots
  '____DBBBBb_bBBBBD___',
  '____DBBBBb_bBBBBD___',
  '____DBBbBBD_DBbBBD__',
  '____DBBbBBD_DBbBBD__',
]);

// ── ROGUE 20×32 ─────────────────────────────────────────────────────────────
export const SPRITE_ROGUE = decode([
  // Dark cowl
  '____DDDDDDDDDDDDD___',
  '___DFFFFFFFFFFFFFDv_',
  '__DFFfFFFFFFFfFFFDvv',
  '__DFFfSSSSSSfFFFFDv_',
  '__DFFfSEesSfFFFFFDv_',
  '__DFFfSSSSSSfFFFFDv_',
  '__DhhfSSqsSShhFFFDv_',
  // Leather torso with buckles
  '__DFFFFFFFFFFFFFFDv_',
  '_DFFFeFFFFFFFeFFFDvv',
  '_DFFFFeFFFFFeFFFFFv_',
  '_DFFFFFeFFFeFFFFFDv_',
  '_DFFFFFFeFFFFFFFFFv_',
  '__DFFFFFFFFFFFFFDvv_',
  '__DFFfzGGGGGzfFFDv__',
  // Belt + daggers
  '__DFNNNNGGGNNNNFDv__',
  // Legs
  '___DFFFFmDDmFFFFDv__',
  '___DFFFFmD_DmFFFFv__',
  '___DFFFFmD_DmFFFFv__',
  '___DFFFmmd_dmmFFFv__',
  '___DFFmmmd_dmmFFFv__',
  // Lower legs — wrapped
  '___DFFFmmd_dmmFFFv__',
  '___DFFFmmd_dmmFFFv__',
  '___DFFFmmd_dmmFFFv__',
  '____DFFmmd__dmmFFv__',
  '____DFFmmd__dmmFFv__',
  '____DFFmmd__dmmFFv__',
  // Boots
  '____DBBBmd__dmBBBD__',
  '____DBBbBd__dBbBBD__',
  '____DBBbBd__dBbBBD__',
  '____DBBBBd__dBBBBD__',
  '___DBBBBBd__dBBBBBD_',
  '___DBBBBBd__dBBBBBD_',
]);

// ── ENEMIES 16×20 ───────────────────────────────────────────────────────────

export const SPRITE_GOBLIN = decode([
  // Head — big ears, yellow eyes, spiky hair
  '____DDDvDDD_____',
  '___DkkkDkkkD____',
  '__DkkkkkkkkkkD__',
  '__DkDkkkkkDkD___',
  '__DkDYYkkYYD____',  // yellow eyes
  '__DkkkkkkkkkD___',
  '__DkkssskkkD____',  // nose/mouth area — s=skin
  '__DkkSSSkkkD____',
  '__DkkkSkkkD_____',
  // Body — leather vest
  '___DkkkkkkD_____',
  '__Dkkkkkkkk D___',
  '__DkkBbbBkkD____',
  '__DkkkBkBkkD____',
  '___DkkkkkD______',
  // Legs
  '____DkkkkD______',
  '____DkD_DkD_____',
  '____DkD_DkD_____',
  '____DbD_DbD_____',
  '____DbD_DbD_____',
  '________________',
]);

export const SPRITE_WOLF = decode([
  // Head + ears
  '____MMMMMM______',
  '__MMmLLmMMMM____',
  '_MMLLmmLLLMM____',
  '_MMmSSmSSmMM____',  // S=skin snout area
  '__MMmmSSmmMM____',
  '___MMMSSMMM_____',
  '___MMMmmMMM_____',
  // Body
  '__MMMMmMMMMMM___',
  '_MMMmMMMMmMMM___',
  '_MMMMMMMmMMMM___',
  '__MMMMMMMMMMM___',
  '___MMMMmMMMMM___',
  // Legs
  '____MM_MMM______',
  '____MM_MMM______',
  '____MM_MMM______',
  '___mMm_mMm______',
  '___mMm_mMm______',
  '___DDm_mDD______',
  '________________',
  '________________',
]);

export const SPRITE_SKELETON = decode([
  // Skull
  '____WWWWWW______',
  '___WWWwwwWWW____',
  '__WWWwwwwwWWW___',
  '__WWWDwwwDWWW___',  // D=dark eye sockets
  '__WWWDwwwDWWW___',
  '__WWWwwwwwWWW___',
  '___WWwQQwwWW____',  // Q=teeth
  '____DWwwwWD_____',
  // Ribcage + spine
  '___WWwwwwwWW____',
  '__WWQwwQwwQWW___',
  '__WWwwQwQwwWW___',
  '__WWQwwwwwQWW___',
  '____WWwwwWW_____',
  // Pelvis + legs
  '____WWWWWWW_____',
  '____WW___WW_____',
  '____WW___WW_____',
  '____WW___WW_____',
  '____WW___WW_____',
  '____QWW_WWQ_____',
  '________________',
]);

export const SPRITE_TROLL = decode([
  // Head — big, rocky skin
  '___ooooooooo____',
  '__oDooooooooD___',
  '__ooooooooooo___',
  '__oo_oo__oo_o___',  // eyes
  '__ooDDoooDDoo___',
  '__ooooooooooo___',
  '__oooSSooooooo__',  // S=tusk/teeth
  // Shoulders + torso (huge)
  '_ooooooooooooo__',
  'oooooooooooooooo',
  'oooooooooooooooo',
  'oooooooooooooooo',
  '_oooooooooooooo_',
  // Arms + lower body
  '__ooooooooooo___',
  '__oooo___oooo___',
  '__oooo___oooo___',
  '__oooo___oooo___',
  '__oooo___oooo___',
  '__oDDD___DDDo___',
  '________________',
  '________________',
]);

export const SPRITE_VAMPIRE = decode([
  // Head — pale, slicked hair
  '____DDDDDDD_____',
  '___DHHhHHHhD____',
  '___DSSSSSSSSD___',
  '___DSEeSSSSD____',
  '___DSSSsSSSD____',
  '___DSSSSSSSD____',
  '____DSSqSSD_____',  // q=fang tip
  // Cape collar + body
  '___DP2P2P2P2D___',
  '__DP2P2SSSP2P2D_',
  '__DP2P2SSsP2P2D_',
  '__DP2P2P2P2P2P2D',
  '___DP2P2P2P2P2D_',
  '___DP2P2P2P2P2D_',
  // Lower cape
  '____DP2P2P2P2D__',
  '____DP2PP2P2P2D_',
  '____DP2P2_P2P2D_',
  '____DP2P2_P2P2D_',
  '____DBBBb_bBBBD_',
  '____DBBBb_bBBBD_',
  '________________',
]);

export const SPRITE_DRAGON = decode([
  // Head + horns
  '_________GGG____',
  '________GGGGG___',
  '_______GGoGoGG__',  // o=orange fire/eye
  '______GGGGGGGGG_',
  '______GGGGGGGGGG',
  // Neck
  '_____GGGGGGGGGGG',
  '____GGGGGGGGGGGG',
  // Body + wings
  '___GGGGGGGGGGGGG',
  '__GGGGGGgGGGGGGG',
  '_GGGGGGGGGGGGGgG',
  'GGGGGGGgGGGGGGGG',
  '_GGGGGGGGGGGGgGG',
  '__GGGGGGgGGGGGGG',
  // Tail
  '___GGGGGGGGGGgg_',
  '____GGGGGGGGgg__',
  '____GGGGG_gg____',
  '____GGGGGGgg____',
  '____GGGGGGg_____',
  '________________',
  '________________',
]);

export const SPRITE_WYVERN = decode([
  '______NNNNNN____',
  '_____NNNNNNNN___',
  '____NNNDNDNNnn__',
  '___NNNNNNNNNnn__',
  '__NNgNNNNNNNnn__',  // g=orange eye
  '_NNNNNNNNNNNNN__',
  'NNNNNNNNNNNNNn__',
  '_NNNNNNNNNNNNn__',
  '__NNNNNNNNNNNn__',
  '__NNNNN__NNNNn__',
  '__NNNNN__NNNNn__',
  '___NNNN__NNNn___',
  '___NNNNNNNNn____',
  '____NNNNNNn_____',
  '_____NNNnn______',
  '________________',
  '________________',
  '________________',
  '________________',
  '________________',
]);

export const SPRITE_FIRE = decode([
  '____YYYYYY______',
  '___YYYyyyYY_____',
  '__YYYYyggYYY____',
  '__YYgggggYYY____',
  '_YYggggggYYY____',
  '_YYgggggYYY_____',
  '__YYggggYY______',
  '__YYgggYY_______',
  '___YYgYY________',
  '___YYgY_________',
  '____YgY_________',
  '____YY__________',
  '_____Y__________',
  '________________',
  '________________',
  '________________',
  '________________',
  '________________',
  '________________',
  '________________',
]);

export const SPRITE_DARK_KNIGHT = decode([
  // Helmet — full visor, glowing eye slit
  '____DDDDDDDD____',
  '___DmMMMMMmD____',
  '___DmMLLLMmD____',
  '___DMXXXXXmD____',
  '____DXEeXXD_____',  // glowing red eye slit
  '____DXXXXXXD____',
  '____DmmmmmD_____',
  // Gorget + dark plate shoulders
  '__DDRRRRRRRRdD__',
  'DDRRRRdRRdRRRRDD',
  'DDRRRRRRRRRRRRdd',
  '__DDRRRRRRRRdD__',
  '___DRRRRRRRRd___',
  '___DRRdRRdRRd___',
  '___DGGGGzGGGd___',
  // Lower plate
  '___DRRRRRRRRd___',
  '____DmLmmLmd____',
  '____DmLmmLmd____',
  '____DmmmmmD_____',
  '____DBBBBBd_____',
  '____DBBbBBd_____',
]);

export const SPRITE_LICH = decode([
  // Skull crown
  '____WWWWWWW_____',
  '___WGWWwwWGWW___',
  '___WWWWWWWWWW___',
  '___WWDwwwDWWW___',
  '___WWDwwwDWWW___',
  '___WWWwwwwWWW___',
  '____WwQQQwW_____',
  // Robe — purple/black
  '___P2P2P2P2P2___',
  '__P2P2WWWP2P2P2_',
  '__P2P2WWwP2P2P2_',
  '__P2P2P2P2P2P2__',
  '___P2P2P2P2P2___',
  '___P2P2P2P2P2___',
  '___P2P2P2P2P2___',
  '____TP2P2P2T____',  // T=magic glow
  '____TP2_P2T_____',
  '____TP2_P2T_____',
  '____TWW_WWT_____',
  '____TWW_WWT_____',
  '________________',
]);

export type SpriteKey =
  | 'warrior' | 'mage' | 'rogue'
  | 'goblin' | 'wolf' | 'orc' | 'bandit'
  | 'bat' | 'skeleton' | 'troll'
  | 'vampire' | 'lich' | 'dark_knight'
  | 'wyvern' | 'fire_elemental' | 'dragon';

export const ENEMY_SPRITES: Record<SpriteKey, string[][]> = {
  warrior:        SPRITE_WARRIOR,
  mage:           SPRITE_MAGE,
  rogue:          SPRITE_ROGUE,
  goblin:         SPRITE_GOBLIN,
  wolf:           SPRITE_WOLF,
  orc:            SPRITE_TROLL,
  bandit:         SPRITE_DARK_KNIGHT,
  bat:            SPRITE_VAMPIRE,
  skeleton:       SPRITE_SKELETON,
  troll:          SPRITE_TROLL,
  vampire:        SPRITE_VAMPIRE,
  lich:           SPRITE_LICH,
  dark_knight:    SPRITE_DARK_KNIGHT,
  wyvern:         SPRITE_WYVERN,
  fire_elemental: SPRITE_FIRE,
  dragon:         SPRITE_DRAGON,
};

// ── Appearance customisation ─────────────────────────────────────────────────

export const SKIN_TONES = [
  { name: 'Blada',         light: '#FFE4D0', shadow: '#F5C0A0' },
  { name: 'Jasna',         light: '#FFCC99', shadow: '#D4956A' },
  { name: 'Śniada',        light: '#C8874E', shadow: '#A06030' },
  { name: 'Ciemna',        light: '#8B5A2B', shadow: '#6B3C18' },
  { name: 'Bardzo ciemna', light: '#5C3317', shadow: '#3D1F0A' },
];

export const HAIR_COLORS = [
  { name: 'Blond',   light: '#F5D26C', shadow: '#C8A020' },
  { name: 'Rudy',    light: '#CC4411', shadow: '#882200' },
  { name: 'Brązowy', light: '#7A4A22', shadow: '#4A2810' },
  { name: 'Czarny',  light: '#1A1208', shadow: '#0A0806' },
  { name: 'Siwy',    light: '#C8C8C8', shadow: '#909090' },
];

export function getHeroPalette(skinTone: number, hairColor: number): Record<string, string> {
  const skin = SKIN_TONES[skinTone] ?? SKIN_TONES[1];
  const hair = HAIR_COLORS[hairColor] ?? HAIR_COLORS[2];
  return {
    '#FFCC99': skin.light,
    '#D4956A': skin.shadow,
    '#C07840': skin.shadow,
    '#884400': hair.light,
    '#BB6600': hair.shadow,
  };
}
