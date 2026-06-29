// Pure, framework-free logic for guild raid (operation) combat.
// Kept out of cloudSync.ts (which pulls in Firebase) so it can be unit-tested.

/**
 * Damage the enemy deals back to an attacking member, scaled by floor.
 * `variance` is a [0,1) roll (Math.random()) injected by the caller so the
 * function stays pure/deterministic for tests.
 */
export function guildEnemyDamage(baseHpPerMember: number, floor: number, variance: number): number {
  const base = Math.max(3, Math.round(baseHpPerMember * (1 + (Math.max(1, floor) - 1) * 0.18) * 0.38));
  return Math.max(1, Math.round(base * (0.7 + variance * 0.6)));
}

/** Apply enemy damage to a member's raid HP. HP never goes below 0; knockout at 0. */
export function applyRaidDamage(currentRaidHp: number, enemyDmg: number): { raidHp: number; knockedOut: boolean } {
  const raidHp = Math.max(0, currentRaidHp - Math.max(0, enemyDmg));
  return { raidHp, knockedOut: raidHp <= 0 };
}

/** XP/gold awarded for completing an operation, scaled by floors, members and level. */
export function guildOpReward(
  baseXpPerFloor: number,
  baseGoldPerFloor: number,
  maxFloors: number,
  memberCount: number,
  heroLevel: number,
): { xp: number; gold: number } {
  const lvlMult = 1 + (Math.max(1, heroLevel) - 1) * 0.04;
  return {
    xp:   Math.floor(baseXpPerFloor   * maxFloors * (1 + memberCount * 0.12) * lvlMult),
    gold: Math.floor(baseGoldPerFloor * maxFloors * (1 + memberCount * 0.08) * lvlMult),
  };
}
