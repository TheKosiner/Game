import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calcCritChance,
  calcXpToNext,
  getHeroMaxHp,
  getEquipmentStats,
  getHeroAttack,
  getHeroDefense,
  getHeroMagicResistance,
  calcStatBonus,
  calcDmgRange,
  getEnhanceAttackBonus,
  getEnhanceDefenseBonus,
  getEnhanceStatBonus,
  heroAttackEnemy,
  enemyAttackHero,
} from './combat';
import { makeHero, makeItem, makeStats, makeEnemy } from '../tests/fixtures';

afterEach(() => vi.restoreAllMocks());

describe('calcCritChance', () => {
  it('returns the 5% base floor when dexterity is 0', () => {
    expect(calcCritChance(0, 1)).toBeCloseTo(0.05, 10);
  });

  it('never exceeds the 40% hard cap', () => {
    expect(calcCritChance(100_000, 1)).toBeLessThanOrEqual(0.4);
    expect(calcCritChance(100_000, 300)).toBeLessThanOrEqual(0.4);
  });

  it('increases monotonically with dexterity', () => {
    const low = calcCritChance(10, 10);
    const mid = calcCritChance(50, 10);
    const high = calcCritChance(200, 10);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });

  it('requires more dexterity at higher level for the same crit chance', () => {
    // Same dex, higher level => larger soft cap => lower crit chance.
    expect(calcCritChance(50, 50)).toBeLessThan(calcCritChance(50, 1));
  });
});

describe('calcXpToNext', () => {
  it('matches the 100 * level^2.3 curve', () => {
    expect(calcXpToNext(1)).toBe(100);
    expect(calcXpToNext(2)).toBe(Math.floor(100 * Math.pow(2, 2.3)));
    expect(calcXpToNext(10)).toBe(Math.floor(100 * Math.pow(10, 2.3)));
  });

  it('is strictly increasing', () => {
    for (let lvl = 1; lvl < 50; lvl++) {
      expect(calcXpToNext(lvl + 1)).toBeGreaterThan(calcXpToNext(lvl));
    }
  });
});

describe('getHeroMaxHp', () => {
  it('uses base 160 + vitality*24 + level*24', () => {
    expect(getHeroMaxHp(makeStats(), 1)).toBe(160 + 0 + 24);
    expect(getHeroMaxHp(makeStats({ vitality: 10 }), 5)).toBe(160 + 10 * 24 + 5 * 24);
  });

  it('counts vitality granted by equipment', () => {
    const equipment = { armor: makeItem({ slot: 'armor', stats: { vitality: 5 } }) };
    const withGear = getHeroMaxHp(makeStats(), 1, equipment);
    const without = getHeroMaxHp(makeStats(), 1);
    expect(withGear - without).toBe(5 * 24);
  });
});

describe('getEquipmentStats', () => {
  it('returns all-zero stats for empty equipment', () => {
    expect(getEquipmentStats({})).toEqual(makeStats());
  });

  it('sums raw stats across every equipped slot', () => {
    const eq = {
      weapon: makeItem({ slot: 'weapon', stats: { strength: 3 } }),
      ring: makeItem({ slot: 'ring', stats: { strength: 2, dexterity: 4 } }),
    };
    const r = getEquipmentStats(eq);
    expect(r.strength).toBe(5);
    expect(r.dexterity).toBe(4);
  });

  it('adds enhancement bonus from a ring on its dominant stat', () => {
    const eq = {
      ring: makeItem({ slot: 'ring', stats: { strength: 9, vitality: 3 }, enhanceLevel: 9 }),
    };
    const r = getEquipmentStats(eq);
    // base 9 strength + enhance round(9 * 9/9) = 9 => 18
    expect(r.strength).toBe(18);
    // vitality is not the dominant stat, so it gets no enhance bonus
    expect(r.vitality).toBe(3);
  });
});

describe('enhancement bonuses', () => {
  it('getEnhanceAttackBonus only applies to weapons with a base attack bonus', () => {
    const weapon = makeItem({ slot: 'weapon', attackBonus: 90, enhanceLevel: 9 });
    expect(getEnhanceAttackBonus(weapon)).toBe(90); // round(90 * 9/9)
    expect(getEnhanceAttackBonus(makeItem({ slot: 'weapon', attackBonus: 90, enhanceLevel: 0 }))).toBe(0);
    expect(getEnhanceAttackBonus(makeItem({ slot: 'armor', attackBonus: 90, enhanceLevel: 9 }))).toBe(0);
    expect(getEnhanceAttackBonus(undefined as never)).toBe(0);
  });

  it('getEnhanceDefenseBonus applies to armor/helmet/boots only', () => {
    expect(getEnhanceDefenseBonus(makeItem({ slot: 'armor', defenseBonus: 90, enhanceLevel: 9 }))).toBe(90);
    expect(getEnhanceDefenseBonus(makeItem({ slot: 'helmet', defenseBonus: 18, enhanceLevel: 9 }))).toBe(18);
    expect(getEnhanceDefenseBonus(makeItem({ slot: 'weapon', defenseBonus: 90, enhanceLevel: 9 }))).toBe(0);
  });

  it('getEnhanceStatBonus boosts only the dominant stat of rings/amulets', () => {
    const ring = makeItem({ slot: 'ring', stats: { dexterity: 18, strength: 4 }, enhanceLevel: 9 });
    expect(getEnhanceStatBonus(ring)).toEqual({ dexterity: 18 });
    const amulet = makeItem({ slot: 'amulet', stats: { magic: 9 }, enhanceLevel: 3 });
    expect(getEnhanceStatBonus(amulet)).toEqual({ magic: 3 }); // round(9 * 3/9)
    expect(getEnhanceStatBonus(makeItem({ slot: 'weapon', stats: { strength: 9 }, enhanceLevel: 9 }))).toEqual({});
  });
});

describe('getHeroAttack', () => {
  it('uses level base 5 + level*2 when unarmed', () => {
    expect(getHeroAttack(makeHero({ level: 1 }))).toBe(7); // round(7 * (1 + 0/100))
  });

  it('scales unarmed attack with strength via the soft cap', () => {
    const atk100 = getHeroAttack(makeHero({ level: 1, stats: makeStats({ strength: 100 }) }));
    expect(atk100).toBe(14); // 7 * (1 + softCap(100)/100) = 7 * 2

    // Beyond 100 strength the soft cap halves marginal gains.
    const atk200 = getHeroAttack(makeHero({ level: 1, stats: makeStats({ strength: 200 }) }));
    expect(atk200).toBe(18); // softCap(200) = 150 => 7 * 2.5 = 17.5 -> 18
  });

  it('adds the weapon attack bonus on top of the level base', () => {
    const armed = getHeroAttack(makeHero({
      level: 1,
      equipment: { weapon: makeItem({ slot: 'weapon', attackBonus: 10, stats: { strength: 0 } }) },
    }));
    const unarmed = getHeroAttack(makeHero({ level: 1 }));
    expect(armed).toBeGreaterThan(unarmed);
  });
});

describe('getHeroDefense', () => {
  it('uses base 2 + vitality + level with no gear', () => {
    expect(getHeroDefense(makeHero({ level: 1 }))).toBe(3);
    expect(getHeroDefense(makeHero({ level: 5, stats: makeStats({ vitality: 4 }) }))).toBe(2 + 4 + 5);
  });

  it('adds defense bonus and enhancement from armor pieces', () => {
    const hero = makeHero({
      level: 1,
      equipment: { armor: makeItem({ slot: 'armor', defenseBonus: 9, enhanceLevel: 9 }) },
    });
    // base 3 + defenseBonus 9 + enhance round(9*9/9)=9
    expect(getHeroDefense(hero)).toBe(3 + 9 + 9);
  });
});

describe('getHeroMagicResistance', () => {
  it('uses base 2 + magicResistance*2', () => {
    expect(getHeroMagicResistance(makeHero())).toBe(2);
    expect(getHeroMagicResistance(makeHero({ stats: makeStats({ magicResistance: 10 }) }))).toBe(22);
  });
});

describe('calcStatBonus', () => {
  it('sums all provided stat values', () => {
    expect(calcStatBonus({ strength: 3, dexterity: 2, magic: 5 })).toBe(10);
    expect(calcStatBonus({})).toBe(0);
  });
});

describe('calcDmgRange', () => {
  it('produces ordered min/max with crit being double', () => {
    const r = calcDmgRange(50);
    expect(r.min).toBeGreaterThanOrEqual(1);
    expect(r.max).toBeGreaterThanOrEqual(r.min);
    expect(r.critMin).toBe(r.min * 2);
    expect(r.critMax).toBe(r.max * 2);
  });
});

describe('heroAttackEnemy', () => {
  it('deals at least 1 damage and never crits when RNG is high', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // no crit, high variance
    const { damage, isCrit } = heroAttackEnemy(
      makeHero({ level: 10, stats: makeStats({ strength: 20 }) }),
      makeEnemy({ defense: 5 }),
    );
    expect(isCrit).toBe(false);
    expect(damage).toBeGreaterThanOrEqual(1);
  });

  it('doubles damage on a crit relative to a non-crit at the same variance', () => {
    const hero = makeHero({ level: 10, stats: makeStats({ strength: 20 }) });
    const enemy = makeEnemy({ defense: 5 });

    // random() is called for: crit roll, then variance. Mock a queue.
    const noCrit = withRandomQueue([0.99, 0.5], () => heroAttackEnemy(hero, enemy).damage);
    const crit = withRandomQueue([0.0, 0.5], () => heroAttackEnemy(hero, enemy).damage);
    // Crit multiplies the pre-rounded damage by 2, so allow a ±1 rounding gap.
    expect(Math.abs(crit - noCrit * 2)).toBeLessThanOrEqual(1);
    expect(crit).toBeGreaterThan(noCrit);
  });
});

describe('enemyAttackHero', () => {
  it('deals at least 1 damage to the hero', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { damage } = enemyAttackHero(makeEnemy({ attack: 30 }), makeHero({ level: 5 }));
    expect(damage).toBeGreaterThanOrEqual(1);
  });
});

/** Runs `fn` while Math.random yields each queued value in order (last value repeats). */
function withRandomQueue<T>(values: number[], fn: () => T): T {
  let i = 0;
  const spy = vi.spyOn(Math, 'random').mockImplementation(() => values[Math.min(i++, values.length - 1)]);
  try {
    return fn();
  } finally {
    spy.mockRestore();
  }
}
