import { useState } from 'react';
import { useGameStore, MAX_DAILY_KRYPTA } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { syncToCloud } from '../lib/cloudSync';
import { getHeroAttack, getHeroDefense, getHeroMaxHp } from '../utils/combat';
import { createMysteryBox } from '../data/mysteryBoxes';
import {
  type ActiveBuff, BUFFS, DEBUFFS,
  type KryptaEnemy, buildEnemy, pickRandomEnemy,
  BOSS_TEMPLATE, SPIDER_TEMPLATE, getBossRarity,
} from '../data/krypta';

const TOTAL_ROOMS = 15;
const CRIT_CHANCE = 0.10;
const CRIT_MULT = 1.8;
const COMPANION_ATK_BONUS = 0.20;
const COMPANION_HEAL_PCT = 0.08;
const TRAP_DMG_PCT = 0.15;
const FOUNTAIN_HEAL_PCT = 0.20;
const ALTAR_COST_PCT = 0.20;

// Shrine-exclusive powerful buffs
const SHRINE_BUFFS: ActiveBuff[] = [
  { id: 'sacred_fury', label: '🔥 Święty Gniew',   color: '#ff6600', atkMult: 1.25, defMult: 0.95, hpMult: 1.00 },
  { id: 'iron_will',   label: '🛡️ Żelazna Wola',   color: '#4488ff', atkMult: 1.00, defMult: 1.30, hpMult: 1.10 },
  { id: 'death_mark',  label: '💀 Piętno Śmierci', color: '#cc00ff', atkMult: 1.40, defMult: 0.90, hpMult: 1.00 },
];

const ORB: React.CSSProperties = { fontFamily: "'Orbitron', monospace", fontWeight: 700 };
const MONO: React.CSSProperties = { fontFamily: "'Share Tech Mono', monospace" };

type Phase = 'idle' | 'direction' | 'combat' | 'event' | 'pre_boss' | 'boss_combat' | 'victory' | 'dead' | 'fled';
type EventType = 'chest' | 'lake' | 'companion' | 'trap' | 'fountain' | 'altar' | 'shrine';

function quadDmg(atk: number, def: number): number {
  const base = (atk * atk) / (atk + Math.max(1, def));
  return Math.max(1, Math.round(base * (0.7 + Math.random() * 0.6)));
}

function HpBar({ hp, max, color = '#ff2d78' }: { hp: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(0, hp / max) : 0;
  return (
    <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct * 100}%`,
        background: pct > 0.5 ? color : pct > 0.25 ? '#ffaa00' : '#ff3300',
        borderRadius: 5, transition: 'width 0.3s',
        boxShadow: `0 0 8px ${color}80`,
      }} />
    </div>
  );
}

function Btn({ onClick, children, color = '#ff2d78', disabled = false, small = false }: {
  onClick: () => void; children: React.ReactNode;
  color?: string; disabled?: boolean; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...ORB,
        fontSize: small ? 10 : 12,
        padding: small ? '6px 12px' : '10px 18px',
        background: disabled ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${color}22, ${color}11)`,
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : color + '66'}`,
        color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: 1,
        textShadow: disabled ? 'none' : `0 0 6px ${color}`,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function SvgDoor({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 4px' }}
    >
      <svg width="88" height="124" viewBox="0 0 88 124" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ filter: hov ? 'drop-shadow(0 0 14px #9944cc)' : 'drop-shadow(0 0 4px rgba(153,68,204,0.35))', transition: 'filter 0.2s' }}>
        <rect x="4" y="40" width="80" height="78" rx="2" fill="#0b001a" stroke={hov ? '#bb66ff' : '#6622aa'} strokeWidth="2"/>
        <path d="M4 40 Q4 4 44 4 Q84 4 84 40 Z" fill="#0b001a" stroke={hov ? '#bb66ff' : '#6622aa'} strokeWidth="2"/>
        <path d="M12 40 Q12 16 44 16 Q76 16 76 40 Z" fill={hov ? 'rgba(153,68,204,0.15)' : 'rgba(153,68,204,0.06)'}/>
        <line x1="44" y1="12" x2="44" y2="32" stroke="rgba(153,68,204,0.55)" strokeWidth="1.5"/>
        <line x1="31" y1="22" x2="57" y2="22" stroke="rgba(153,68,204,0.55)" strokeWidth="1.5"/>
        <rect x="8" y="42" width="32" height="72" rx="1" fill="#08000f" stroke="rgba(153,68,204,0.3)" strokeWidth="1"/>
        <rect x="48" y="42" width="32" height="72" rx="1" fill="#08000f" stroke="rgba(153,68,204,0.3)" strokeWidth="1"/>
        <rect x="11" y="46" width="26" height="22" rx="1" fill="rgba(153,68,204,0.07)" stroke="rgba(153,68,204,0.18)" strokeWidth="0.8"/>
        <rect x="11" y="72" width="26" height="38" rx="1" fill="rgba(153,68,204,0.07)" stroke="rgba(153,68,204,0.18)" strokeWidth="0.8"/>
        <rect x="51" y="46" width="26" height="22" rx="1" fill="rgba(153,68,204,0.07)" stroke="rgba(153,68,204,0.18)" strokeWidth="0.8"/>
        <rect x="51" y="72" width="26" height="38" rx="1" fill="rgba(153,68,204,0.07)" stroke="rgba(153,68,204,0.18)" strokeWidth="0.8"/>
        <line x1="44" y1="42" x2="44" y2="114" stroke="rgba(153,68,204,0.28)" strokeWidth="2"/>
        <circle cx="41" cy="78" r="3" fill={hov ? '#bb66ff' : '#9944cc'} opacity="0.85"/>
        <circle cx="47" cy="78" r="3" fill={hov ? '#bb66ff' : '#9944cc'} opacity="0.85"/>
        <ellipse cx="44" cy="76" rx="1.8" ry="2.2" fill={hov ? '#cc88ff' : '#7722bb'}/>
        <path d="M42.5 78 L42 82 L45.5 82 L45 78" fill={hov ? '#cc88ff' : '#7722bb'}/>
        <rect x="4" y="116" width="80" height="6" rx="1" fill="#1a0030" stroke="rgba(153,68,204,0.2)" strokeWidth="1"/>
        {hov && <rect x="8" y="114" width="72" height="2" rx="1" fill="#9944cc" opacity="0.6"/>}
      </svg>
      <span style={{ ...MONO, fontSize: 10, color: hov ? '#cc88ff' : 'rgba(255,255,255,0.6)', letterSpacing: 1, transition: 'color 0.15s' }}>{label}</span>
    </button>
  );
}

export default function KryptaPanel() {
  const hero = useGameStore(s => s.hero);
  const addXp = useGameStore(s => s.addXp);
  const addGold = useGameStore(s => s.addGold);
  const addToInventory = useGameStore(s => s.addToInventory);
  const saveGame = useGameStore(s => s.saveGame);
  const incrementKryptaRuns = useGameStore(s => s.incrementKryptaRuns);
  const user = useAuthStore(s => s.user);

  const [phase, setPhase]           = useState<Phase>('idle');
  const [depth, setDepth]           = useState(0);
  const [raidHp, setRaidHp]         = useState(0);
  const [raidMaxHp, setRaidMaxHp]   = useState(0);
  const [buffs, setBuffs]           = useState<ActiveBuff[]>([]);
  const [hasCompanion, setHasCompanion] = useState(false);
  const [isMiniBoss, setIsMiniBoss] = useState(false);
  const [enemy, setEnemy]           = useState<KryptaEnemy | null>(null);
  const [eventType, setEventType]   = useState<EventType | null>(null);
  const [log, setLog]               = useState<string[]>([]);
  const [totalXp, setTotalXp]       = useState(0);
  const [totalGold, setTotalGold]   = useState(0);

  const baseAtk = getHeroAttack(hero);
  const baseDef = getHeroDefense(hero);

  const atkMult = buffs.reduce((a, b) => a * b.atkMult, 1) * (hasCompanion ? 1 + COMPANION_ATK_BONUS : 1);
  const defMult = buffs.reduce((a, b) => a * b.defMult, 1);
  const effectiveAtk = Math.round(baseAtk * atkMult);
  const effectiveDef = Math.round(baseDef * defMult);

  function pushLog(msgs: string[]) {
    setLog(prev => [...msgs, ...prev].slice(0, 30));
  }

  function afterRoom(newDepth: number, newHp: number, newMaxHp: number) {
    if (newDepth >= TOTAL_ROOMS) {
      setPhase('pre_boss');
    } else {
      setPhase('direction');
    }
    setRaidHp(newHp);
    setRaidMaxHp(newMaxHp);
  }

  function enterCrypt() {
    const maxHp = getHeroMaxHp(hero.stats, hero.level, hero.equipment);
    incrementKryptaRuns();
    setPhase('direction');
    setDepth(0);
    setRaidHp(hero.hp);
    setRaidMaxHp(maxHp);
    setBuffs([]);
    setHasCompanion(false);
    setIsMiniBoss(false);
    setEnemy(null);
    setEventType(null);
    setTotalXp(0);
    setTotalGold(0);
    setLog(['⚰️ Wkraczasz w mroczne głębiny Krypty... Czeka cię długa droga.']);
  }

  function reset() {
    setPhase('idle');
    setDepth(0);
    setEnemy(null);
    setEventType(null);
    setLog([]);
    setBuffs([]);
    setHasCompanion(false);
    setIsMiniBoss(false);
  }

  function chooseDirection(_dir: 'left' | 'center' | 'right') {
    const newDepth = depth + 1;
    setDepth(newDepth);

    // Mini-boss checkpoints: rooms 5 and 10 always spawn a guardian
    if (newDepth === 5 || newDepth === 10) {
      const template = pickRandomEnemy(newDepth);
      const base = buildEnemy(template, hero.level, newDepth);
      const guardian: KryptaEnemy = {
        ...base,
        name: `STRAŻNIK — ${base.name}`,
        hp:      Math.round(base.hp      * 2.2),
        maxHp:   Math.round(base.maxHp   * 2.2),
        attack:  Math.round(base.attack  * 1.6),
        defense: Math.round(base.defense * 1.3),
        xp:      Math.round(base.xp      * 2.0),
        gold:    Math.round(base.gold    * 2.0),
      };
      const title = newDepth === 5 ? 'PIERWSZY STRAŻNIK' : 'DRUGI STRAŻNIK';
      pushLog([`💀 POKÓJ ${newDepth}/${TOTAL_ROOMS}: ${title}! Potężna bestia blokuje przejście!`]);
      setEnemy(guardian);
      setIsMiniBoss(true);
      setPhase('combat');
      return;
    }

    setIsMiniBoss(false);
    const isCombat = Math.random() < 0.65;

    if (isCombat) {
      const template = pickRandomEnemy(newDepth);
      const e = buildEnemy(template, hero.level, newDepth);
      setEnemy(e);
      pushLog([`⚔️ Pokój ${newDepth}/${TOTAL_ROOMS}: Napotykasz ${e.emoji} ${e.name}!`]);
      setPhase('combat');
      return;
    }

    // Event room
    const r = Math.random();
    let evType: EventType;
    if      (r < 0.30) evType = 'chest';
    else if (r < 0.52) evType = 'lake';
    else if (r < 0.64) evType = 'companion';
    else if (r < 0.76) evType = 'fountain';
    else if (r < 0.87) evType = 'trap';
    else if (r < 0.94) evType = 'shrine';
    else               evType = 'altar';

    // Trap: apply damage immediately before showing event card
    if (evType === 'trap') {
      const trapDmg = Math.round(raidMaxHp * TRAP_DMG_PCT);
      const newHp = Math.max(1, raidHp - trapDmg);
      setRaidHp(newHp);
      pushLog([`⚠️ Pokój ${newDepth}/${TOTAL_ROOMS}: PUŁAPKA! Ostrza ze ścian! −${trapDmg} HP!`]);
      setEventType('trap');
      setPhase('event');
      return;
    }

    pushLog([`🚪 Pokój ${newDepth}/${TOTAL_ROOMS}: Odkrywasz tajemnicze pomieszczenie...`]);
    setEventType(evType);
    setPhase('event');
  }

  function doAttack(isBoss: boolean) {
    if (!enemy) return;
    const msgs: string[] = [];
    let e = { ...enemy };
    let hp = raidHp;

    const isCrit = Math.random() < CRIT_CHANCE;
    const dmg = Math.round(quadDmg(effectiveAtk, e.defense) * (isCrit ? CRIT_MULT : 1));
    e.hp = Math.max(0, e.hp - dmg);
    msgs.push(`${isCrit ? '💥 KRYT! ' : ''}⚔️ Zadajesz ${dmg} obrażeń → ${e.emoji} HP: ${e.hp}/${e.maxHp}`);

    if (e.hp <= 0) {
      msgs.push(`✅ ${e.emoji} ${e.name} pokonany!`);
      let newXp   = totalXp   + e.xp;
      let newGold = totalGold + e.gold;

      if (hasCompanion && !isBoss) {
        const heal = Math.round(raidMaxHp * COMPANION_HEAL_PCT);
        hp = Math.min(raidMaxHp, hp + heal);
        msgs.push(`🤝 Kompan leczy cię o ${heal} HP!`);
      }
      msgs.push(`📈 +${e.xp} XP, +${e.gold} 🪙`);

      if (isBoss) {
        addXp(newXp);
        addGold(newGold);
        const box = createMysteryBox(getBossRarity(hero.level), hero.level);
        addToInventory(box);
        saveGame();
        if (user) syncToCloud(user.uid, user.username).catch(() => {});
        pushLog([`🏆 LORD CIENIA pokonany!`, `🎁 ${box.name} trafia do ekwipunku!`, `📈 Łącznie: +${newXp} XP, +${newGold} 🪙`, ...msgs.slice().reverse()]);
        setTotalXp(newXp);
        setTotalGold(newGold);
        setEnemy(null);
        setIsMiniBoss(false);
        setPhase('victory');
        return;
      }

      pushLog([...msgs].reverse());
      setTotalXp(newXp);
      setTotalGold(newGold);
      setRaidHp(hp);
      setEnemy(null);
      setIsMiniBoss(false);
      afterRoom(depth, hp, raidMaxHp);
      return;
    }

    // Enemy counter-attack — harder crits than before
    const eCrit = Math.random() < (isBoss ? 0.09 : 0.07);
    const eDmg = Math.round(quadDmg(e.attack, effectiveDef) * (eCrit ? (isBoss ? 2.8 : 2.2) : 1));
    hp = Math.max(0, hp - eDmg);
    msgs.push(`${eCrit ? '💥 KRYT! ' : ''}${e.emoji} ${e.name} atakuje za ${eDmg} → HP: ${hp}/${raidMaxHp}`);

    pushLog([...msgs].reverse());
    setRaidHp(hp);
    setEnemy({ ...e });

    if (hp <= 0) {
      pushLog(['💀 Padasz pokonany...']);
      setPhase('dead');
      saveGame();
      if (user) syncToCloud(user.uid, user.username).catch(() => {});
    }
  }

  function flee() {
    pushLog(['🏃 Uciekasz z Krypty!']);
    setPhase('fled');
    saveGame();
    if (user) syncToCloud(user.uid, user.username).catch(() => {});
  }

  function startBoss() {
    const e = buildEnemy(BOSS_TEMPLATE, hero.level, TOTAL_ROOMS + 1);
    setEnemy(e);
    pushLog(['☠️ LORD CIENIA staje przed tobą! Walka na śmierć i życie!']);
    setPhase('boss_combat');
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  function handleChestOpen() {
    if (Math.random() < 0.30) {
      const e = buildEnemy(SPIDER_TEMPLATE, hero.level, depth);
      setEnemy(e);
      pushLog(['🕷️ Ze skrzyni wyskakuje Jadowity Pająk!']);
      setEventType(null);
      setPhase('combat');
    } else {
      const gold = Math.round((30 + Math.random() * 70) * (1 + hero.level * 0.05) * (1 + (depth - 1) * 0.15));
      const xp   = Math.round((20 + Math.random() * 40) * (1 + hero.level * 0.05) * (1 + (depth - 1) * 0.15));
      setTotalXp(prev => prev + xp);
      setTotalGold(prev => prev + gold);
      pushLog([`💰 Skrzynia skrywa skarb! +${xp} XP, +${gold} 🪙`]);
      setEventType(null);
      afterRoom(depth, raidHp, raidMaxHp);
    }
  }

  function handleChestLeave() {
    pushLog(['🚶 Omijasz skrzynię ostrożnie.']);
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleLakeDrink() {
    if (Math.random() < 0.50) {
      const b = BUFFS[Math.floor(Math.random() * BUFFS.length)];
      setBuffs(prev => [...prev.filter(x => x.id !== b.id), b]);
      pushLog([`✨ Jezioro cię błogosławi: ${b.label}!`]);
    } else {
      const d = DEBUFFS[Math.floor(Math.random() * DEBUFFS.length)];
      setBuffs(prev => [...prev.filter(x => x.id !== d.id), d]);
      pushLog([`💜 Jezioro cię przeklina: ${d.label}!`]);
    }
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleLakeLeave() {
    pushLog(['🚶 Omijasz jezioro bez dotykania.']);
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleCompanionAccept() {
    setHasCompanion(true);
    pushLog(['🤝 Tajemniczy wojownik dołącza do ciebie! (+20% ATK, leczenie po walce)']);
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleCompanionDecline() {
    pushLog(['🚶 Odrzucasz ofertę nieznajomego.']);
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleTrapContinue() {
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleFountainDrink() {
    const heal = Math.round(raidMaxHp * FOUNTAIN_HEAL_PCT);
    const newHp = Math.min(raidMaxHp, raidHp + heal);
    const actual = newHp - raidHp;
    setRaidHp(newHp);
    pushLog([`🏛️ Uzdrawiająca woda regeneruje siły! +${actual} HP`]);
    setEventType(null);
    afterRoom(depth, newHp, raidMaxHp);
  }

  function handleFountainLeave() {
    pushLog(['🚶 Omijasz fontannę, nie ufając jej.']);
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleAltarRitual() {
    const cost = Math.round(raidMaxHp * ALTAR_COST_PCT);
    const newHp = Math.max(1, raidHp - cost);
    const gold = Math.round((60 + Math.random() * 100) * (1 + hero.level * 0.06) * (1 + (depth - 1) * 0.15));
    const xp   = Math.round((40 + Math.random() * 70)  * (1 + hero.level * 0.06) * (1 + (depth - 1) * 0.15));
    setTotalXp(prev => prev + xp);
    setTotalGold(prev => prev + gold);
    setRaidHp(newHp);
    pushLog([`🗿 Rytuał zakończony! −${cost} HP · +${xp} XP · +${gold} 🪙`]);
    setEventType(null);
    afterRoom(depth, newHp, raidMaxHp);
  }

  function handleAltarLeave() {
    pushLog(['🚶 Odwracasz się od mrocznego ołtarza.']);
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleShrinePray() {
    const r = Math.random();
    if (r < 0.65) {
      const b = SHRINE_BUFFS[Math.floor(Math.random() * SHRINE_BUFFS.length)];
      setBuffs(prev => [...prev.filter(x => x.id !== b.id), b]);
      pushLog([`⛩️ Kapliczka emanuje mocą! ${b.label}`]);
    } else if (r < 0.90) {
      pushLog([`⛩️ Duch kapliczki milczy. Nic się nie dzieje.`]);
    } else {
      const d = DEBUFFS[Math.floor(Math.random() * DEBUFFS.length)];
      setBuffs(prev => [...prev.filter(x => x.id !== d.id), d]);
      pushLog([`⛩️ Zbudziłeś gniewnego ducha! ${d.label}`]);
    }
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  function handleShrineLeave() {
    pushLog(['🚶 Omijasz kapliczkę z szacunkiem.']);
    setEventType(null);
    afterRoom(depth, raidHp, raidMaxHp);
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderHeader() {
    if (phase === 'idle' || phase === 'victory' || phase === 'dead' || phase === 'fled') return null;
    const section = depth <= 5 ? 'I' : depth <= 10 ? 'II' : 'III';
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ ...ORB, fontSize: 11, color: '#00f5ff', letterSpacing: 1 }}>
            {phase === 'boss_combat' || phase === 'pre_boss'
              ? '☠️ BOSS'
              : `POKÓJ ${depth}/${TOTAL_ROOMS} · SEKCJA ${section}`}
          </span>
          <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            {hasCompanion && '🤝 '}
            {buffs.map(b => (
              <span key={b.id} style={{ color: b.color, marginLeft: 4 }}>{b.label}</span>
            ))}
          </span>
        </div>
        <HpBar hp={raidHp} max={raidMaxHp} color="#00f5ff" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>HP: {raidHp}/{raidMaxHp}</span>
          <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>⚔️ {effectiveAtk} 🛡️ {effectiveDef}</span>
        </div>
      </div>
    );
  }

  function renderEnemy() {
    if (!enemy) return null;
    const isGuardian = isMiniBoss;
    return (
      <div style={{
        background: isGuardian ? 'rgba(255,136,0,0.08)' : 'rgba(255,45,120,0.06)',
        border: `1px solid ${isGuardian ? 'rgba(255,136,0,0.3)' : 'rgba(255,45,120,0.2)'}`,
        padding: '12px 16px', marginBottom: 12, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{enemy.emoji}</div>
        <div style={{ ...ORB, fontSize: 13, color: isGuardian ? '#ff8800' : '#ff2d78', marginBottom: 8 }}>{enemy.name}</div>
        <HpBar hp={enemy.hp} max={enemy.maxHp} color={isGuardian ? '#ff8800' : '#ff2d78'} />
        <div style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
          HP: {enemy.hp}/{enemy.maxHp} · ⚔️ {enemy.attack} · 🛡️ {enemy.defense}
        </div>
      </div>
    );
  }

  function renderLog() {
    if (log.length === 0) return null;
    return (
      <div style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
        padding: 10, maxHeight: 160, overflowY: 'auto', marginTop: 12,
      }}>
        {log.map((line, i) => (
          <div key={i} style={{
            ...MONO, fontSize: 10,
            color: i === 0 ? '#fff' : `rgba(255,255,255,${Math.max(0.2, 0.7 - i * 0.05)})`,
            lineHeight: 1.6,
          }}>{line}</div>
        ))}
      </div>
    );
  }

  // ── Phase rendering ─────────────────────────────────────────────────────────

  if (phase === 'idle') {
    const todayRuns = Number.isFinite(hero.kryptaRunsToday) ? hero.kryptaRunsToday : 0;
    const runsLeft = MAX_DAILY_KRYPTA - todayRuns;
    const blocked = runsLeft <= 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, filter: blocked ? 'grayscale(0.7) opacity(0.5)' : 'none' }}>⚰️</div>
        <div style={{ ...ORB, fontSize: 20, color: blocked ? 'rgba(153,68,204,0.4)' : '#9944cc', letterSpacing: 2, textShadow: blocked ? 'none' : '0 0 16px #9944cc' }}>KRYPTA</div>
        <div style={{ ...MONO, fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 360, lineHeight: 1.7 }}>
          Starożytna krypta skrywa mroczne tajemnice. Trzy sekcje po 5 pokoi, dwóch Strażników i Lord Cienia.
          Odkrywaj sekrety, uważaj na pułapki i zmierz się z grozą głębin.
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          <span>💀 {TOTAL_ROOMS} Pokoi</span>
          <span>💀 2 Strażnicy</span>
          <span>☠️ Boss końcowy</span>
          <span>🎁 Skrzynka z nagrodą</span>
        </div>
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          background: blocked ? 'rgba(255,45,120,0.08)' : 'rgba(153,68,204,0.08)',
          border: `1px solid ${blocked ? 'rgba(255,45,120,0.3)' : 'rgba(153,68,204,0.25)'}`,
          padding: '6px 16px',
        }}>
          {Array.from({ length: MAX_DAILY_KRYPTA }).map((_, i) => (
            <span key={i} style={{ fontSize: 14, opacity: i < todayRuns ? 0.2 : 1 }}>⚰️</span>
          ))}
          <span style={{ ...MONO, fontSize: 10, color: blocked ? '#ff2d78' : 'rgba(255,255,255,0.5)', marginLeft: 6 }}>
            {blocked ? 'Limit dzienny wyczerpany' : `${runsLeft}/${MAX_DAILY_KRYPTA} krypt dziś`}
          </span>
        </div>
        {blocked ? (
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,45,120,0.7)', letterSpacing: 0.5 }}>
            Wróć jutro, by ponownie wkroczyć w mroki Krypty.
          </div>
        ) : (
          <Btn onClick={enterCrypt} color="#9944cc">⚰️ WEJDŹ DO KRYPTY</Btn>
        )}
      </div>
    );
  }

  if (phase === 'direction') {
    const section = depth < 5 ? 'I — Korytarze Cienia' : depth < 10 ? 'II — Komnaty Grozy' : 'III — Głębiny Ciemności';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {renderHeader()}
        <div style={{ textAlign: 'center', ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
          Sekcja {section}
        </div>
        <div style={{ textAlign: 'center', ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
          Wybierz kierunek eksploracji:
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <SvgDoor label="← LEWO"    onClick={() => chooseDirection('left')} />
          <SvgDoor label="↑ ŚRODEK"  onClick={() => chooseDirection('center')} />
          <SvgDoor label="→ PRAWO"   onClick={() => chooseDirection('right')} />
        </div>
        {renderLog()}
      </div>
    );
  }

  if (phase === 'combat' || phase === 'boss_combat') {
    const isBoss = phase === 'boss_combat';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {renderHeader()}
        {renderEnemy()}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn onClick={() => doAttack(isBoss)} color="#ff2d78">⚔️ ATAKUJ</Btn>
          {!isBoss && !isMiniBoss && depth < TOTAL_ROOMS && (
            <Btn onClick={flee} color="#888888" small>🏃 UCIEKAJ</Btn>
          )}
        </div>
        {renderLog()}
      </div>
    );
  }

  if (phase === 'event') {
    const trapDmg = Math.round(raidMaxHp * TRAP_DMG_PCT);
    const altarCost = Math.round(raidMaxHp * ALTAR_COST_PCT);
    const fountainHeal = Math.round(raidMaxHp * FOUNTAIN_HEAL_PCT);

    const eventContent = () => {
      if (eventType === 'chest') return (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div style={{ ...ORB, fontSize: 13, color: '#ffd700', marginBottom: 6 }}>Starożytna Skrzynia</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            Stara skrzynia pokryta kurzem wieków. Skarb... albo pułapka?
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={handleChestOpen} color="#ffd700">📦 Otwórz skrzynię</Btn>
            <Btn onClick={handleChestLeave} color="#888888" small>🚶 Idź dalej</Btn>
          </div>
        </>
      );

      if (eventType === 'lake') return (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💧</div>
          <div style={{ ...ORB, fontSize: 13, color: '#00f5ff', marginBottom: 6 }}>Magiczne Jezioro</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            Mroczne jezioro emanuje magiczną energią. Właściwości nieznane — błogosławieństwo lub klątwa.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={handleLakeDrink} color="#00f5ff">💧 Wypij z jeziora</Btn>
            <Btn onClick={handleLakeLeave} color="#888888" small>🚶 Omij jezioro</Btn>
          </div>
        </>
      );

      if (eventType === 'companion') return (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🗡️</div>
          <div style={{ ...ORB, fontSize: 13, color: '#00ff88', marginBottom: 6 }}>Tajemniczy Wojownik</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            Ocalały z głębin krypty oferuje pomoc.
            <br /><span style={{ color: '#00ff88' }}>+20% ATK · Leczy {Math.round(COMPANION_HEAL_PCT * 100)}% HP po każdej walce</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={handleCompanionAccept} color="#00ff88" disabled={hasCompanion}>
              {hasCompanion ? '🤝 Masz już kompana' : '🤝 Przyjmij kompana'}
            </Btn>
            <Btn onClick={handleCompanionDecline} color="#888888" small>🚶 Odrzuć ofertę</Btn>
          </div>
        </>
      );

      if (eventType === 'trap') return (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <div style={{ ...ORB, fontSize: 13, color: '#ff8800', marginBottom: 6 }}>Pokój Pułapek</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            Zbyt późno dostrzegasz mechanizm. Ostrza wyskakują ze ścian i kaleczy cię przy przejściu.
            <br /><span style={{ color: '#ff4400' }}>−{trapDmg} HP</span>
          </div>
          <Btn onClick={handleTrapContinue} color="#ff8800">➡️ Idź dalej</Btn>
        </>
      );

      if (eventType === 'fountain') return (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏛️</div>
          <div style={{ ...ORB, fontSize: 13, color: '#44ddff', marginBottom: 6 }}>Uzdrawiająca Fontanna</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            Starożytna fontanna emanuje ciepłą, złocistą wodą. Wygląda bezpiecznie.
            <br /><span style={{ color: '#44ddff' }}>+{fountainHeal} HP (do max)</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={handleFountainDrink} color="#44ddff">🏛️ Napij się</Btn>
            <Btn onClick={handleFountainLeave} color="#888888" small>🚶 Idź dalej</Btn>
          </div>
        </>
      );

      if (eventType === 'altar') return (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🗿</div>
          <div style={{ ...ORB, fontSize: 13, color: '#aa44ff', marginBottom: 6 }}>Mroczny Ołtarz</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            Ołtarz żąda krwi w zamian za mroczne bogactwa.
            <br /><span style={{ color: '#ff4466' }}>−{altarCost} HP</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}> za </span>
            <span style={{ color: '#ffd700' }}>duże XP i złoto</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={handleAltarRitual} color="#aa44ff" disabled={raidHp <= altarCost}>
              🗿 Złóż ofiarę
            </Btn>
            <Btn onClick={handleAltarLeave} color="#888888" small>🚶 Odejdź</Btn>
          </div>
        </>
      );

      if (eventType === 'shrine') return (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⛩️</div>
          <div style={{ ...ORB, fontSize: 13, color: '#ffcc44', marginBottom: 6 }}>Zapomniana Kapliczka</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            Starożytna kapliczka skrywa boską moc. Modlitwa może przynieść potężne błogosławieństwo.
            <br /><span style={{ color: '#ffcc44' }}>65% silny buff · 25% nic · 10% klątwa</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn onClick={handleShrinePray} color="#ffcc44">⛩️ Módl się</Btn>
            <Btn onClick={handleShrineLeave} color="#888888" small>🚶 Odejdź</Btn>
          </div>
        </>
      );

      return null;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {renderHeader()}
        <div style={{
          background: 'rgba(153,68,204,0.08)', border: '1px solid rgba(153,68,204,0.25)',
          padding: '20px 16px', textAlign: 'center',
        }}>
          {eventContent()}
        </div>
        {renderLog()}
      </div>
    );
  }

  if (phase === 'pre_boss') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {renderHeader()}
        <div style={{
          background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.3)',
          padding: '20px 16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>☠️</div>
          <div style={{ ...ORB, fontSize: 15, color: '#ff2d78', letterSpacing: 2, marginBottom: 8, textShadow: '0 0 12px #ff2d78' }}>
            LORD CIENIA
          </div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.7 }}>
            Przeszedłeś wszystkie trzy sekcje krypty. Czujesz mroczną obecność za ostatnimi drzwiami.
            <br />To ostatnia szansa na ucieczkę.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Btn onClick={startBoss} color="#ff2d78">☠️ ZMIERZ SIĘ Z BOSSEM</Btn>
            <Btn onClick={flee} color="#888888" small>🏃 UCIEKAJ</Btn>
          </div>
        </div>
        {renderLog()}
      </div>
    );
  }

  if (phase === 'victory') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>🏆</div>
        <div style={{ ...ORB, fontSize: 18, color: '#ffd700', letterSpacing: 2, textShadow: '0 0 16px #ffd700' }}>KRYPTA ZDOBYTA!</div>
        <div style={{
          background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)',
          padding: '14px 24px', width: '100%', maxWidth: 320,
        }}>
          <div style={{ ...MONO, fontSize: 12, color: '#ffd700', marginBottom: 6 }}>Nagrody przyznane</div>
          <div style={{ ...ORB, fontSize: 13, color: '#fff' }}>+{totalXp} XP · +{totalGold} 🪙</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            🎁 Skrzynka z nagrodą w ekwipunku
          </div>
        </div>
        <Btn onClick={reset} color="#9944cc">⚰️ ZAGRAJ PONOWNIE</Btn>
        {renderLog()}
      </div>
    );
  }

  if (phase === 'dead') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>💀</div>
        <div style={{ ...ORB, fontSize: 18, color: '#ff2d78', letterSpacing: 2 }}>POLEGŁEŚ</div>
        <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Mroczne siły Krypty okazały się zbyt potężne.<br />
          Żadnych nagród tym razem.
        </div>
        <Btn onClick={reset} color="#888888">↩ POWRÓT</Btn>
        {renderLog()}
      </div>
    );
  }

  if (phase === 'fled') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>🏃</div>
        <div style={{ ...ORB, fontSize: 18, color: '#888888', letterSpacing: 2 }}>UCIECZKA</div>
        <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Opuszczasz Kryptę z życiem, lecz bez nagród.
        </div>
        <Btn onClick={reset} color="#888888">↩ POWRÓT</Btn>
        {renderLog()}
      </div>
    );
  }

  return null;
}
