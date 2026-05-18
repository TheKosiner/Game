import { doc, getDoc, setDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { useGameStore } from '../store/gameStore';
import { getHeroAttack } from '../utils/combat';
import { GUILD_BOSSES } from '../data/guildBosses';
import { generateItem } from '../data/itemGenerator';
import type { Hero, Item } from '../types';

export const BOSS_DURATION_MS = 24 * 60 * 60 * 1000;

export interface BossParticipant {
  username: string;
  heroName: string;
  level: number;
  damage: number;
  attackedAt: number;
  rewardClaimed: boolean;
}

export interface GuildBossState {
  bossIdx: number;
  currentHp: number;
  maxHp: number;
  startedAt: number;
  endsAt: number;
  defeated: boolean;
  defeatedAt?: number;
  participants: Record<string, BossParticipant>;
}

export function calcGuildBossDamage(hero: Hero): number {
  const atk = getHeroAttack(hero);
  return Math.round(atk * hero.level * 100 + hero.level * 2000);
}

export function subscribeToBoss(
  guildId: string,
  callback: (boss: GuildBossState | null) => void
): () => void {
  if (!db) return () => {};
  const ref = doc(db, 'guilds', guildId, 'boss', 'active');
  return onSnapshot(ref, snap => {
    callback(snap.exists() ? (snap.data() as GuildBossState) : null);
  }, () => callback(null));
}

export async function ensureBossActive(guildId: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'guilds', guildId, 'boss', 'active');
  const snap = await getDoc(ref);
  const now = Date.now();

  if (!snap.exists()) {
    await spawnBoss(guildId, 0);
    return;
  }

  const data = snap.data() as GuildBossState;

  // Timed out without defeat → reset same boss
  if (!data.defeated && now > data.endsAt) {
    await spawnBoss(guildId, data.bossIdx);
    return;
  }

  // Defeated → wait 24h from defeat then spawn next
  if (data.defeated && data.defeatedAt && now > data.defeatedAt + BOSS_DURATION_MS) {
    await spawnBoss(guildId, (data.bossIdx + 1) % GUILD_BOSSES.length);
  }
}

async function spawnBoss(guildId: string, bossIdx: number): Promise<void> {
  if (!db) return;
  const boss = GUILD_BOSSES[bossIdx];
  const now = Date.now();
  await setDoc(doc(db, 'guilds', guildId, 'boss', 'active'), {
    bossIdx,
    currentHp: boss.hp,
    maxHp: boss.hp,
    startedAt: now,
    endsAt: now + BOSS_DURATION_MS,
    defeated: false,
    participants: {},
  });
}

export async function attackGuildBoss(
  guildId: string,
  uid: string,
  username: string,
  hero: Hero
): Promise<{ success: boolean; damage: number; error?: string }> {
  if (!db) return { success: false, damage: 0, error: 'no_db' };

  const ref = doc(db, 'guilds', guildId, 'boss', 'active');
  const damage = calcGuildBossDamage(hero);

  try {
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('no_boss');

      const data = snap.data() as GuildBossState;
      const now = Date.now();

      if (data.defeated) throw new Error('already_defeated');
      if (now > data.endsAt) throw new Error('expired');

      const existing = data.participants[uid];
      if (existing) {
        const sameDay = new Date(existing.attackedAt).toDateString() === new Date().toDateString();
        if (sameDay) throw new Error('already_attacked');
      }

      const newHp = Math.max(0, data.currentHp - damage);
      const updates: Record<string, unknown> = {
        currentHp: newHp,
        [`participants.${uid}`]: {
          username,
          heroName: hero.name,
          level: hero.level,
          damage,
          attackedAt: now,
          rewardClaimed: false,
        },
      };
      if (newHp <= 0) {
        updates.defeated = true;
        updates.defeatedAt = now;
      }
      tx.update(ref, updates);
    });

    return { success: true, damage };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return { success: false, damage: 0, error: msg };
  }
}

export async function claimBossReward(
  guildId: string,
  uid: string,
  hero: Hero
): Promise<{ xp: number; gold: number; item: Item } | null> {
  if (!db) return null;

  const ref = doc(db, 'guilds', guildId, 'boss', 'active');
  let xp = 0;
  let gold = 0;

  try {
    let bossIdx = 0;
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('no_boss');

      const data = snap.data() as GuildBossState;
      if (!data.defeated) throw new Error('not_defeated');

      const p = data.participants[uid];
      if (!p) throw new Error('not_participant');
      if (p.rewardClaimed) throw new Error('already_claimed');

      bossIdx = data.bossIdx;
      const boss = GUILD_BOSSES[bossIdx];
      const mult = 1 + (hero.level - 1) * 0.05;
      xp = Math.round(boss.xpReward * mult);
      gold = Math.round(boss.goldReward * mult);

      tx.update(ref, { [`participants.${uid}.rewardClaimed`]: true });
    });

    const legendaryChance = bossIdx / 15 * 0.65;
    const item = generateItem(hero.level, Math.random() < legendaryChance ? 'legendary' : 'epic');

    const store = useGameStore.getState();
    store.addXp(xp);
    store.addGold(gold);
    const currentHero = useGameStore.getState().hero;
    if (currentHero.inventory.length < 20) {
      useGameStore.setState(s => ({ hero: { ...s.hero, inventory: [...s.hero.inventory, item] } }));
    }
    store.saveGame();

    return { xp, gold, item };
  } catch {
    return null;
  }
}
