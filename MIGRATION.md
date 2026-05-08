# Migration Guide: Old gameStore → New Modular Stores

## Overview
The monolithic `gameStore.ts` has been split into focused modules. This guide shows how to migrate existing components.

## Store Mapping

### Old → New
```typescript
// OLD
import { useGameStore } from './store/gameStore';

// NEW - Import only what you need
import { useHeroStore } from './store/heroStore';
import { useInventoryStore } from './store/inventoryStore';
import { useCombatStore } from './store/combatStore';
import { useQuestStore } from './store/questStore';
import { useShopStore } from './store/shopStore';
import { usePvpStore } from './store/pvpStore';
```

## Component Migration Examples

### Example 1: HeroCard.tsx
```typescript
// OLD
const hero = useGameStore(s => s.hero);
const upgradeAttribute = useGameStore(s => s.upgradeAttribute);
const restHero = useGameStore(s => s.restHero);

// NEW
const hero = useHeroStore(s => s.hero);
const upgradeAttribute = useHeroStore(s => s.upgradeAttribute);
const restHero = useHeroStore(s => s.restHero);
```

### Example 2: InventoryPanel.tsx
```typescript
// OLD
const hero = useGameStore(s => s.hero);
const equipItem = useGameStore(s => s.equipItem);
const unequipItem = useGameStore(s => s.unequipItem);
const sellItem = useGameStore(s => s.sellItem);

// NEW
const hero = useHeroStore(s => s.hero);
const { equipment, inventory } = useInventoryStore();
const equipItem = useInventoryStore(s => s.equipItem);
const unequipItem = useInventoryStore(s => s.unequipItem);
const sellItem = useInventoryStore(s => s.sellItem);
const addGold = useHeroStore(s => s.addGold);

// When selling, call both:
const handleSell = (item: Item) => {
  if (sellItem(item, item.goldValue)) {
    addGold(item.goldValue);
  }
};
```

### Example 3: DungeonPanel.tsx
```typescript
// OLD
const hero = useGameStore(s => s.hero);
const currentDungeon = useGameStore(s => s.currentDungeon);
const currentEnemy = useGameStore(s => s.currentEnemy);
const enterDungeon = useGameStore(s => s.enterDungeon);
const attackEnemy = useGameStore(s => s.attackEnemy);
const exitDungeon = useGameStore(s => s.exitDungeon);

// NEW
const hero = useHeroStore(s => s.hero);
const { currentDungeon, currentEnemy, combatLog } = useCombatStore();
const enterDungeon = useCombatStore(s => s.enterDungeon);
const exitDungeon = useCombatStore(s => s.exitDungeon);
const addXp = useHeroStore(s => s.addXp);
const addGold = useHeroStore(s => s.addGold);
const updateHero = useHeroStore(s => s.updateHero);
const addItem = useInventoryStore(s => s.addItem);

// Attack now returns result object
const handleAttack = () => {
  const result = attackEnemy({
    attack: getHeroAttack(hero),
    defense: getHeroDefense(hero),
    hp: hero.hp,
  });

  if (result) {
    updateHero({ hp: result.heroHp });
    
    if (result.rewards) {
      addXp(result.rewards.xp);
      addGold(result.rewards.gold);
      if (result.rewards.loot) {
        addItem(result.rewards.loot);
      }
    }
  }
};
```

### Example 4: QuestPanel.tsx
```typescript
// OLD
const hero = useGameStore(s => s.hero);
const activeQuest = useGameStore(s => s.activeQuest);
const startQuest = useGameStore(s => s.startQuest);
const collectQuest = useGameStore(s => s.collectQuest);

// NEW
const hero = useHeroStore(s => s.hero);
const activeQuest = useQuestStore(s => s.activeQuest);
const addXp = useHeroStore(s => s.addXp);
const addGold = useHeroStore(s => s.addGold);
const updateHero = useHeroStore(s => s.updateHero);

const handleStartQuest = (quest: Quest) => {
  const started = useQuestStore.getState().startQuest(quest, hero.level);
  if (started) {
    updateHero({ questsCompletedToday: hero.questsCompletedToday + 1 });
  }
};

const handleCollect = () => {
  const rewards = useQuestStore.getState().collectQuest();
  if (rewards) {
    addXp(rewards.xp);
    addGold(rewards.gold);
  }
};
```

### Example 5: ShopPanel.tsx
```typescript
// OLD
const hero = useGameStore(s => s.hero);
const buyItem = useGameStore(s => s.buyItem);
const refreshShop = useGameStore(s => s.refreshShop);

// NEW
const hero = useHeroStore(s => s.hero);
const addGold = useHeroStore(s => s.addGold);
const addItem = useInventoryStore(s => s.addItem);
const canAddItem = useInventoryStore(s => s.canAddItem);
const { shopSeed, canRefresh } = useShopStore();
const refreshShop = useShopStore(s => s.refreshShop);
const purchaseItem = useShopStore(s => s.purchaseItem);

const handleBuy = (item: Item, price: number, slotIndex: number) => {
  if (hero.gold < price) {
    setNotification('Za mało złota!');
    return;
  }
  
  if (!canAddItem()) {
    setNotification('Plecak pełny!');
    return;
  }

  addGold(-price);
  addItem(item);
  purchaseItem(slotIndex);
  setNotification(`Kupiono: ${item.emoji} ${item.name}`);
};
```

### Example 6: LeaderboardPanel.tsx (PvP)
```typescript
// OLD
const performPvp = useGameStore(s => s.performPvp);
const pvpWins = useGameStore(s => s.pvpWins);
const pvpLosses = useGameStore(s => s.pvpLosses);
const lastPvpFight = useGameStore(s => s.lastPvpFight);

// NEW
const hero = useHeroStore(s => s.hero);
const addXp = useHeroStore(s => s.addXp);
const addGold = useHeroStore(s => s.addGold);
const { pvpWins, pvpLosses, lastPvpFight, canFight } = usePvpStore();
const performPvp = usePvpStore(s => s.performPvp);

const handleChallenge = (opponent: PvpOpponent) => {
  const result = performPvp(
    {
      attack: getHeroAttack(hero),
      defense: getHeroDefense(hero),
      maxHp: hero.maxHp,
    },
    opponent
  );

  if (result) {
    addXp(result.xpGained);
    if (result.goldGained > 0) {
      addGold(result.goldGained);
    }
    setLatestResult(result);
  }
};
```

## Save/Load Migration

### OLD
```typescript
const saveGame = useGameStore(s => s.saveGame);
const loadGame = useGameStore(s => s.loadGame);
```

### NEW
```typescript
import { saveGame, loadGame } from './store/saveManager';

// Automatic debounced save - just call it
saveGame();

// Load on app start
const loaded = loadGame();
```

## Constants Migration

### OLD
```typescript
import { MAX_DAILY_DUNGEONS, MAX_DAILY_QUESTS } from './store/gameStore';
```

### NEW
```typescript
import { MAX_DAILY_DUNGEONS, MAX_DAILY_QUESTS } from './utils/constants';
```

## Helper Functions

### NEW - Use these instead of inline logic
```typescript
import {
  isHeroResting,
  isHeroVoluntarilyResting,
  canEnterDungeon,
  canStartQuest,
  formatTime,
  isSameDay
} from './utils/helpers';

// Instead of:
const isResting = hero.restingUntil !== null && Date.now() < hero.restingUntil;

// Use:
const isResting = isHeroResting(hero);
```

## Breaking Changes Checklist

- [ ] Update all `useGameStore` imports
- [ ] Split store selectors by domain
- [ ] Update action calls to return values
- [ ] Handle rewards manually (XP, gold, items)
- [ ] Update save/load calls
- [ ] Update constants imports
- [ ] Replace inline logic with helpers
- [ ] Test all user flows

## Testing After Migration

1. Character creation
2. Leveling up
3. Equipment management
4. Dungeon combat
5. Quest system
6. Shop purchases
7. PvP battles
8. Save/load
9. Daily resets
