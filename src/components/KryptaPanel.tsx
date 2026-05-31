import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { syncToCloud } from '../lib/cloudSync';
import { getHeroAttack, getHeroDefense, getHeroMaxHp } from '../utils/combat';
import { createMysteryBox } from '../data/mysteryBoxes';
import {
  ActiveBuff, BUFFS, DEBUFFS,
  KryptaEnemy, buildEnemy, pickRandomEnemy,
  BOSS_TEMPLATE, SPIDER_TEMPLATE, getBossRarity,
} from '../data/krypta';

const TOTAL_ROOMS = 5;
const CRIT_CHANCE = 0.10;
const CRIT_MULT = 1.8;
const COMPANION_ATK_BONUS = 0.20;
const COMPANION_HEAL_PCT = 0.08;

const ORB: React.CSSProperties = { fontFamily: "'Orbitron', monospace", fontWeight: 700 };
const MONO: React.CSSProperties = { fontFamily: "'Share Tech Mono', monospace" };

type Phase = 'idle' | 'direction' | 'combat' | 'event' | 'pre_boss' | 'boss_combat' | 'victory' | 'dead' | 'fled';
type EventType = 'chest' | 'lake' | 'companion';

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

export default function KryptaPanel() {
  const hero = useGameStore(s => s.hero);
  const addXp = useGameStore(s => s.addXp);
  const addGold = useGameStore(s => s.addGold);
  const addToInventory = useGameStore(s => s.addToInventory);
  const saveGame = useGameStore(s => s.saveGame);
  const user = useAuthStore(s => s.user);

  const [phase, setPhase]           = useState<Phase>('idle');
  const [depth, setDepth]           = useState(0);
  const [raidHp, setRaidHp]         = useState(0);
  const [raidMaxHp, setRaidMaxHp]   = useState(0);
  const [buffs, setBuffs]           = useState<ActiveBuff[]>([]);
  const [hasCompanion, setHasCompanion] = useState(false);
  const [enemy, setEnemy]           = useState<KryptaEnemy | null>(null);
  const [eventType, setEventType]   = useState<EventType | null>(null);
  const [log, setLog]               = useState<string[]>([]);
  const [totalXp, setTotalXp]       = useState(0);
  const [totalGold, setTotalGold]   = useState(0);
  const [isBossPhase, setIsBossPhase] = useState(false);

  const baseAtk     = getHeroAttack(hero);
  const baseDef     = getHeroDefense(hero);
  const baseMaxHp   = getHeroMaxHp(hero.stats, hero.level, hero.equipment);

  const atkMult = buffs.reduce((a, b) => a * b.atkMult, 1) * (hasCompanion ? 1 + COMPANION_ATK_BONUS : 1);
  const defMult = buffs.reduce((a, b) => a * b.defMult, 1);
  const effectiveAtk = Math.round(baseAtk * atkMult);
  const effectiveDef = Math.round(baseDef * defMult);

  function pushLog(msgs: string[]) {
    setLog(prev => [...msgs, ...prev].slice(0, 25));
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
    setPhase('direction');
    setDepth(0);
    setRaidHp(maxHp);
    setRaidMaxHp(maxHp);
    setBuffs([]);
    setHasCompanion(false);
    setEnemy(null);
    setEventType(null);
    setTotalXp(0);
    setTotalGold(0);
    setIsBossPhase(false);
    setLog(['⚰️ Wkraczasz w mroczne głębiny Krypty...']);
  }

  function reset() {
    setPhase('idle');
    setDepth(0);
    setEnemy(null);
    setEventType(null);
    setLog([]);
    setBuffs([]);
    setHasCompanion(false);
    setIsBossPhase(false);
  }

  function chooseDirection(_dir: 'left' | 'center' | 'right') {
    const newDepth = depth + 1;
    setDepth(newDepth);
    const isCombat = Math.random() < 0.60;
    if (isCombat) {
      const template = pickRandomEnemy(newDepth);
      const e = buildEnemy(template, hero.level, newDepth);
      setEnemy(e);
      pushLog([`⚔️ Pokój ${newDepth}/${TOTAL_ROOMS}: Napotykasz ${e.emoji} ${e.name}!`]);
      setPhase('combat');
    } else {
      const r = Math.random();
      const evType: EventType = r < 0.40 ? 'chest' : r < 0.75 ? 'lake' : 'companion';
      setEventType(evType);
      pushLog([`🚪 Pokój ${newDepth}/${TOTAL_ROOMS}: Odkrywasz tajemnicze pomieszczenie...`]);
      setPhase('event');
    }
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
      let newXp = totalXp + e.xp;
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
        if (user) syncToCloud(useGameStore.getState().hero, user.uid).catch(() => {});
        pushLog([`🏆 LORD CIENIA pokonany!`, `🎁 ${box.name} trafia do ekwipunku!`, `📈 Łącznie: +${newXp} XP, +${newGold} 🪙`, ...msgs.slice().reverse()]);
        setTotalXp(newXp);
        setTotalGold(newGold);
        setEnemy(null);
        setPhase('victory');
        return;
      }

      pushLog([...msgs].reverse());
      setTotalXp(newXp);
      setTotalGold(newGold);
      setRaidHp(hp);
      setEnemy(null);
      afterRoom(depth, hp, raidMaxHp);
      return;
    }

    // Enemy strikes back
    const eCrit = Math.random() < (isBoss ? 0.07 : 0.05);
    const eDmg = Math.round(quadDmg(e.attack, effectiveDef) * (eCrit ? (isBoss ? 2.5 : 2) : 1));
    hp = Math.max(0, hp - eDmg);
    msgs.push(`${eCrit ? '💥 KRYT! ' : ''}${e.emoji} ${e.name} atakuje za ${eDmg} → HP: ${hp}/${raidMaxHp}`);

    pushLog([...msgs].reverse());
    setRaidHp(hp);
    setEnemy({ ...e });

    if (hp <= 0) {
      pushLog(['💀 Padasz pokonany...']);
      setPhase('dead');
    }
  }

  function flee() {
    pushLog(['🏃 Uciekasz z Krypty!']);
    setPhase('fled');
  }

  function startBoss() {
    const e = buildEnemy(BOSS_TEMPLATE, hero.level, TOTAL_ROOMS + 1);
    setEnemy(e);
    setIsBossPhase(true);
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
      const gold = Math.round((30 + Math.random() * 70) * (1 + hero.level * 0.05) * (1 + (depth - 1) * 0.20));
      const xp   = Math.round((20 + Math.random() * 40) * (1 + hero.level * 0.05) * (1 + (depth - 1) * 0.20));
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

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderHeader() {
    if (phase === 'idle' || phase === 'victory' || phase === 'dead' || phase === 'fled') return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ ...ORB, fontSize: 11, color: '#00f5ff', letterSpacing: 1 }}>
            {phase === 'boss_combat' || phase === 'pre_boss'
              ? '☠️ BOSS'
              : `POKÓJ ${depth}/${TOTAL_ROOMS}`}
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
    return (
      <div style={{
        background: 'rgba(255,45,120,0.06)', border: '1px solid rgba(255,45,120,0.2)',
        padding: '12px 16px', marginBottom: 12, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{enemy.emoji}</div>
        <div style={{ ...ORB, fontSize: 13, color: '#ff2d78', marginBottom: 8 }}>{enemy.name}</div>
        <HpBar hp={enemy.hp} max={enemy.maxHp} color="#ff2d78" />
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
            color: i === 0 ? '#fff' : `rgba(255,255,255,${Math.max(0.2, 0.7 - i * 0.06)})`,
            lineHeight: 1.6,
          }}>{line}</div>
        ))}
      </div>
    );
  }

  // ── Phase rendering ─────────────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>⚰️</div>
        <div style={{ ...ORB, fontSize: 20, color: '#9944cc', letterSpacing: 2, textShadow: '0 0 16px #9944cc' }}>KRYPTA</div>
        <div style={{ ...MONO, fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 360, lineHeight: 1.7 }}>
          Starożytna krypta skrywa mroczne tajemnice. Przemierzaj jej korytarze, walcz z potworami,
          odkrywaj sekrety i zmierz się z Lordem Cienia. Nagrody skalują się z Twoim poziomem.
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          <span>💀 {TOTAL_ROOMS} Pokoi</span>
          <span>☠️ Boss końcowy</span>
          <span>🎁 Skrzynka z nagrodą</span>
        </div>
        <Btn onClick={enterCrypt} color="#9944cc">⚰️ WEJDŹ DO KRYPTY</Btn>
      </div>
    );
  }

  if (phase === 'direction') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        {renderHeader()}
        <div style={{ textAlign: 'center', ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
          Wybierz kierunek eksploracji:
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {(['left', 'center', 'right'] as const).map((dir, i) => (
            <Btn key={dir} onClick={() => chooseDirection(dir)} color="#9944cc">
              {['← LEWO', '↑ ŚRODEK', '→ PRAWO'][i]}
            </Btn>
          ))}
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
          {!isBoss && depth < TOTAL_ROOMS && (
            <Btn onClick={flee} color="#888888" small>🏃 UCIEKAJ</Btn>
          )}
        </div>
        {renderLog()}
      </div>
    );
  }

  if (phase === 'event') {
    const eventContent = () => {
      if (eventType === 'chest') return (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div style={{ ...ORB, fontSize: 13, color: '#ffd700', marginBottom: 6 }}>Starożytna Skrzynia</div>
          <div style={{ ...MONO, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
            Widzisz starożytną skrzynię pokrytą kurzem wieków. Czy ją otworzysz?
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
            Przed tobą jarzy się magiczne jezioro o nieznanych właściwościach. Wypijesz z niego?
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
            Nieznajomy wojownik wyłania się z cienia i oferuje pomoc. Przyjmiesz go?
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
            Czujesz mroczną obecność za ostatnimi drzwiami. Władca Krypty czeka.
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
