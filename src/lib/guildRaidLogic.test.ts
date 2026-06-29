import { describe, it, expect } from 'vitest';
import { guildEnemyDamage, applyRaidDamage, guildOpReward } from './guildRaidLogic';
import { getFloorEnemy, pickLocationForLevel, GUILD_OP_LOCATIONS } from '../data/guildOperations';

describe('guildEnemyDamage', () => {
  it('scales up with floor', () => {
    const f1 = guildEnemyDamage(100, 1, 0.5);
    const f5 = guildEnemyDamage(100, 5, 0.5);
    expect(f5).toBeGreaterThan(f1);
  });

  it('variance=0 is the low end, variance≈1 the high end', () => {
    const low  = guildEnemyDamage(100, 1, 0);
    const high = guildEnemyDamage(100, 1, 0.999);
    expect(high).toBeGreaterThan(low);
    // base = round(100 * 1 * 0.38) = 38; low = round(38*0.7)=27, high≈round(38*1.3)=49
    expect(low).toBe(27);
    expect(high).toBe(49);
  });

  it('never returns less than 1', () => {
    expect(guildEnemyDamage(0, 1, 0)).toBeGreaterThanOrEqual(1);
  });

  it('treats floor < 1 as floor 1', () => {
    expect(guildEnemyDamage(100, 0, 0.5)).toBe(guildEnemyDamage(100, 1, 0.5));
  });
});

describe('applyRaidDamage', () => {
  it('subtracts damage from HP', () => {
    expect(applyRaidDamage(100, 30)).toEqual({ raidHp: 70, knockedOut: false });
  });

  it('clamps HP at 0 and flags knockout', () => {
    expect(applyRaidDamage(20, 50)).toEqual({ raidHp: 0, knockedOut: true });
  });

  it('knocks out on an exact-zero hit', () => {
    expect(applyRaidDamage(40, 40)).toEqual({ raidHp: 0, knockedOut: true });
  });

  it('never refills HP on negative/zero damage', () => {
    expect(applyRaidDamage(50, 0)).toEqual({ raidHp: 50, knockedOut: false });
    expect(applyRaidDamage(50, -10)).toEqual({ raidHp: 50, knockedOut: false });
  });
});

describe('guildOpReward', () => {
  it('scales with floors, members and level', () => {
    const base = guildOpReward(500, 400, 4, 1, 1);
    // lvlMult = 1, memberMult xp = 1.12^? -> (1 + 1*0.12)=1.12
    expect(base.xp).toBe(Math.floor(500 * 4 * 1.12));
    expect(base.gold).toBe(Math.floor(400 * 4 * 1.08));

    const more = guildOpReward(500, 400, 4, 5, 10);
    expect(more.xp).toBeGreaterThan(base.xp);
    expect(more.gold).toBeGreaterThan(base.gold);
  });

  it('treats level < 1 as level 1', () => {
    expect(guildOpReward(500, 400, 4, 1, 0)).toEqual(guildOpReward(500, 400, 4, 1, 1));
  });
});

describe('getFloorEnemy', () => {
  const loc = GUILD_OP_LOCATIONS[0];

  it('returns full HP equal to maxHp', () => {
    const e = getFloorEnemy(loc, 1, 3);
    expect(e.hp).toBe(e.maxHp);
    expect(e.hp).toBeGreaterThan(0);
  });

  it('scales enemy HP with member count', () => {
    const solo = getFloorEnemy(loc, 1, 1);
    const team = getFloorEnemy(loc, 1, 5);
    expect(team.hp).toBeGreaterThan(solo.hp);
  });

  it('picks tougher enemies on deeper floors', () => {
    const f1 = getFloorEnemy(loc, 1, 3);
    const last = getFloorEnemy(loc, loc.enemies.length, 3);
    expect(last.hp).toBeGreaterThan(f1.hp);
  });

  it('clamps the enemy template to the last floor entry', () => {
    const beyond = getFloorEnemy(loc, loc.enemies.length + 10, 3);
    const last = getFloorEnemy(loc, loc.enemies.length, 3);
    expect(beyond.id).toBe(last.id);
  });
});

describe('pickLocationForLevel', () => {
  it('only returns locations the hero meets the level requirement for', () => {
    const lvl = 20;
    for (let i = 0; i < 50; i++) {
      expect(pickLocationForLevel(lvl).minLevel).toBeLessThanOrEqual(lvl);
    }
  });

  it('falls back to the first location below the minimum level', () => {
    expect(pickLocationForLevel(1).id).toBe(GUILD_OP_LOCATIONS[0].id);
  });
});
