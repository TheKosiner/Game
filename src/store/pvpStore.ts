import { create } from 'zustand';
import type { PvpResult, PvpOpponent } from '../types';
import { PVP_COOLDOWN_MS, MAX_PVP_ROUNDS } from '../utils/constants';

interface PvpState {
  lastPvpFight: number;
  pvpWins: number;
  pvpLosses: number;
  pvpLog: PvpResult[];

  canFight: () => boolean;
  performPvp: (
    heroStats: { attack: number; defense: number; maxHp: number },
    opponent: PvpOpponent
  ) => PvpResult | null;
}

function simulatePvp(
  heroAtk: number,
  heroDef: number,
  heroHp: number,
  oppAtk: number,
  oppDef: number,
  oppHp: number
): boolean {
  let hHp = heroHp;
  let oHp = oppHp;

  for (let i = 0; i < MAX_PVP_ROUNDS; i++) {
    oHp -= Math.max(1, Math.round(heroAtk * (0.85 + Math.random() * 0.3)) - oppDef);
    if (oHp <= 0) return true;

    hHp -= Math.max(1, Math.round(oppAtk * (0.85 + Math.random() * 0.3)) - heroDef);
    if (hHp <= 0) return false;
  }

  return hHp >= oHp;
}

export const usePvpStore = create<PvpState>((set, get) => ({
  lastPvpFight: 0,
  pvpWins: 0,
  pvpLosses: 0,
  pvpLog: [],

  canFight: () => {
    const { lastPvpFight } = get();
    return Date.now() - lastPvpFight >= PVP_COOLDOWN_MS;
  },

  performPvp: (heroStats, opponent) => {
    if (!get().canFight()) return null;

    const won = simulatePvp(
      heroStats.attack,
      heroStats.defense,
      heroStats.maxHp,
      opponent.attack ?? 10,
      opponent.defense ?? 5,
      opponent.maxHp ?? 100
    );

    const xpGained = won ? Math.max(20, opponent.level * 20) : 8;
    const goldGained = won ? Math.max(10, opponent.level * 10) : 0;

    const result: PvpResult = {
      won,
      opponentName: opponent.heroName,
      xpGained,
      goldGained,
      timestamp: Date.now(),
    };

    set(state => ({
      lastPvpFight: Date.now(),
      pvpWins: won ? state.pvpWins + 1 : state.pvpWins,
      pvpLosses: won ? state.pvpLosses : state.pvpLosses + 1,
      pvpLog: [result, ...state.pvpLog].slice(0, 10),
    }));

    return result;
  },
}));
