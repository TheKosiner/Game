import { useEffect, useState } from 'react';
import { TERRITORY_LIST, type TerritoryDef } from '../data/territories';
import {
  getTerritories, captureTerritory, claimTerritoryReward,
  initOrJoinSiege, commitSiegeDamage,
  type TerritoryState, type Guild,
} from '../lib/cloudSync';
import { useGameStore } from '../store/gameStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Combat types ──────────────────────────────────────────────────────────────

interface SiegeCombatState {
  territory: TerritoryDef;
  heroHp: number;
  heroMaxHp: number;
  heroAtk: number;
  heroDef: number;
  // Local enemy HP (starts at current siege HP from Firestore)
  enemyHp: number;
  enemyStartHp: number; // HP at start of THIS session (to compute damage dealt)
  enemyMaxHp: number;   // Full siege max HP (for progress bar)
  enemyAtk: number;
  enemyDef: number;
  enemyName: string;
  enemyEmoji: string;
  log: string[];
  done: boolean;
  won: boolean;
  damageDealt: number;
}

// ── HP Bar ────────────────────────────────────────────────────────────────────

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max));
  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dark)', height: 8, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, background: color, transition: 'width 0.2s ease' }} />
    </div>
  );
}

// ── Siege Combat ──────────────────────────────────────────────────────────────

function SiegeCombat({
  state,
  onAttack,
  onRetreat,
}: {
  state: SiegeCombatState;
  onAttack: () => void;
  onRetreat: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...PX(7), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
        ⚔ OBLĘŻENIE — {state.territory.emoji} {state.territory.name.toUpperCase()}
      </p>

      {/* Siege overall progress */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(100,60,180,0.4)', padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ ...PX(4), color: '#a080e0' }}>🏰 Oblężenie (łącznie)</p>
          <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{state.enemyHp}/{state.enemyMaxHp} HP</p>
        </div>
        <HpBar current={state.enemyHp} max={state.enemyMaxHp} color="#7040c0" />
        <p style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 4 }}>⚔ Zadałeś już: {state.damageDealt} obrażeń (sesja)</p>
      </div>

      {/* Enemy this session */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(180,40,40,0.4)', padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <p style={{ ...PX(6), color: '#e06060' }}>{state.enemyEmoji} {state.enemyName}</p>
          <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{state.enemyHp}/{state.enemyStartHp} HP</p>
        </div>
        <HpBar current={state.enemyHp} max={state.enemyStartHp} color="#c03030" />
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(40,130,40,0.4)', padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <p style={{ ...PX(6), color: '#60c060' }}>🛡 TY</p>
          <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{state.heroHp}/{state.heroMaxHp} HP</p>
        </div>
        <HpBar current={state.heroHp} max={state.heroMaxHp} color="#30a030" />
      </div>

      {/* Result banner */}
      {state.done && (
        <div style={{
          background: state.won ? 'rgba(20,60,20,0.9)' : 'rgba(60,10,10,0.9)',
          border: `1px solid ${state.won ? '#40a040' : '#a03030'}`,
          padding: 12, textAlign: 'center',
        }}>
          <p style={{ ...PX(9), color: state.won ? '#60e060' : '#e06060', marginBottom: 6 }}>
            {state.won ? '⚔ PODBITO!' : '💀 ODWRÓT'}
          </p>
          <p style={{ ...PX(5), color: 'var(--text-dim)' }}>
            {state.won
              ? 'Terytorium zostało przejęte przez twoją gildię!'
              : `Zadałeś ${state.damageDealt} obrażeń. Wróć z resztą gildii!`}
          </p>
          <button onClick={onRetreat} className="btn btn-primary" style={{ marginTop: 10, fontSize: 6, padding: '8px 16px' }}>
            Powrót do mapy
          </button>
        </div>
      )}

      {/* Buttons */}
      {!state.done && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAttack} className="btn btn-danger" style={{ flex: 1, fontSize: 7, padding: '10px' }}>
            ⚔ ATAKUJ
          </button>
          <button onClick={onRetreat} className="btn btn-secondary" style={{ fontSize: 6, padding: '10px 14px' }}>
            Odwrót
          </button>
        </div>
      )}

      {/* Log */}
      <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-dark)', padding: 8, maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {state.log.slice().reverse().map((line, i) => (
          <p key={i} style={{ ...PX(4), color: 'var(--text-dim)', lineHeight: 1.6 }}>{line}</p>
        ))}
      </div>
    </div>
  );
}

// ── Territory Map ─────────────────────────────────────────────────────────────

export default function TerritoryPanel({ guild, onBack }: { guild: Guild | null; onBack: () => void }) {
  const hero = useGameStore(s => s.hero);
  const addGold = useGameStore(s => s.addGold);
  const addXp = useGameStore(s => s.addXp);
  const [territories, setTerritories] = useState<Record<string, TerritoryState>>({});
  const [loading, setLoading] = useState(true);
  const [combat, setCombat] = useState<SiegeCombatState | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [, forceUpdate] = useState(0);

  async function reloadTerritories() {
    const t = await getTerritories();
    setTerritories(t);
  }

  useEffect(() => {
    reloadTerritories().then(() => setLoading(false));
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // How many territories does my guild own?
  const myOwnedCount = guild
    ? Object.values(territories).filter(t => t.guildId === guild.id).length
    : 0;

  async function handleAttack(def: TerritoryDef, state: TerritoryState | undefined) {
    if (!guild) return;

    // 1-territory cap
    if (myOwnedCount >= 1 && state?.guildId !== guild.id) {
      alert('Twoja gildia może posiadać tylko jedno terytorium na raz. Najpierw stracisz obecne lub zostanie odbite.');
      return;
    }

    const result = await initOrJoinSiege(def.id, guild.id, guild.tag, def.siegeHp);
    if ('blocked' in result) {
      alert(`Inne oblężenie trwa: [${result.byTag}]. Poczekaj aż wygaśnie (2h bez aktywności).`);
      return;
    }

    // Build enemy stats — if enemy-owned, scale by their member stats
    let enemyAtk = def.siegeAtk;
    let enemyDef = def.siegeDef;
    let enemyName = def.guardianName;
    let enemyEmoji = def.guardianEmoji;

    if (state?.guildId && state.guildId !== guild.id) {
      const mult = Math.min(2.5, 1 + Math.sqrt(state.defenderMemberCount || 1) * (state.defenderAvgLevel || 1) / 30);
      enemyAtk = Math.round(def.siegeAtk * mult);
      enemyDef = Math.round(def.siegeDef * mult);
      enemyName = `[${state.guildTag}] ${state.guildName}`;
      enemyEmoji = '🏰';
    }

    const heroHp = hero.maxHp;
    const currentHp = result.currentHp;

    setCombat({
      territory: def,
      heroHp, heroMaxHp: heroHp,
      heroAtk: getHeroAttack(hero), heroDef: getHeroDefense(hero),
      enemyHp: currentHp, enemyStartHp: currentHp, enemyMaxHp: def.siegeHp,
      enemyAtk, enemyDef,
      enemyName, enemyEmoji,
      log: [`Dołączyłeś do oblężenia ${def.name}! HP wroga: ${currentHp}/${def.siegeHp}`],
      done: false, won: false, damageDealt: 0,
    });
  }

  function handleCombatAttack() {
    setCombat(prev => {
      if (!prev || prev.done) return prev;
      let { heroHp, heroAtk, heroDef, enemyHp, enemyAtk, enemyDef, damageDealt } = prev;
      const log = [...prev.log];

      const heroDmg = Math.max(1, Math.round(heroAtk * (0.85 + Math.random() * 0.3)) - enemyDef);
      enemyHp = Math.max(0, enemyHp - heroDmg);
      damageDealt += heroDmg;
      log.push(`Zadajesz ${heroDmg} obrażeń. (Razem: ${damageDealt})`);

      if (enemyHp <= 0) {
        log.push('HP oblężenia zredukowane do 0!');
        return { ...prev, heroHp, enemyHp: 0, damageDealt, log, done: true, won: true };
      }

      const enemyDmg = Math.max(1, Math.round(enemyAtk * (0.85 + Math.random() * 0.3)) - heroDef);
      heroHp = Math.max(0, heroHp - enemyDmg);
      log.push(`Wróg zadaje ci ${enemyDmg} obrażeń.`);

      if (heroHp <= 0) {
        log.push(`Padłeś! Zadałeś ${damageDealt} obrażeń w tej sesji.`);
        return { ...prev, heroHp: 0, enemyHp, damageDealt, log, done: true, won: false };
      }

      return { ...prev, heroHp, enemyHp, damageDealt, log };
    });
  }

  async function handleRetreat() {
    if (!combat || !guild) { setCombat(null); return; }
    setCommitting(true);
    try {
      const newHp = await commitSiegeDamage(combat.territory.id, guild.id, combat.damageDealt);
      if (newHp <= 0 || combat.won) {
        // Capture!
        const members = Object.values(guild.members);
        const avgLevel = members.length > 0
          ? Math.round(members.reduce((s, m) => s + m.level, 0) / members.length)
          : hero.level;
        await captureTerritory(combat.territory.id, guild.id, guild.name, guild.tag, members.length, avgLevel);
      }
      await reloadTerritories();
    } finally {
      setCommitting(false);
      setCombat(null);
    }
  }

  async function handleClaim(def: TerritoryDef) {
    if (!guild) return;
    setClaimingId(def.id);
    try {
      const result = await claimTerritoryReward(def.id, guild.id);
      if (result !== null) {
        addGold(def.dailyGold);
        addXp(def.dailyXp);
        await reloadTerritories();
      }
    } finally { setClaimingId(null); }
  }

  if (committing) {
    return (
      <div style={{ textAlign: 'center', padding: 30 }}>
        <p style={{ ...PX(6), color: 'var(--gold-main)' }}>⏳ Zapisywanie obrażeń...</p>
      </div>
    );
  }

  if (combat) {
    return <SiegeCombat state={combat} onAttack={handleCombatAttack} onRetreat={handleRetreat} />;
  }

  const formatCountdown = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>←</button>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>🗺 MAPA TERYTORIÓW</p>
      </div>

      {guild && myOwnedCount >= 1 && (
        <div style={{ background: 'rgba(20,40,10,0.7)', border: '1px solid rgba(40,120,40,0.4)', padding: 8 }}>
          <p style={{ ...PX(4), color: '#60c060' }}>
            ✦ Twoja gildia posiada terytorium. Możesz mieć tylko 1 — najpierw musi zostać odbite.
          </p>
        </div>
      )}

      {loading && (
        <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>⏳ Ładowanie...</p>
      )}

      {!loading && TERRITORY_LIST.map(def => {
        const state = territories[def.id];
        const ownedByMyGuild = state?.guildId === guild?.id;
        const ownedByEnemy = !!state?.guildId && !ownedByMyGuild;
        const unowned = !state?.guildId;
        const locked = hero.level < def.minLevel;

        const mySiegeActive = state?.siegeGuildId === guild?.id && (state?.siegeCurrentHp ?? 0) > 0;
        const enemySiegeActive = state?.siegeGuildId && state.siegeGuildId !== guild?.id && (state?.siegeCurrentHp ?? 0) > 0;

        const now = Date.now();
        const canClaim = ownedByMyGuild && guild &&
          (state.lastRewardAt === null || now - (state.lastRewardAt ?? 0) >= DAY_MS);
        const nextClaimIn = ownedByMyGuild && !canClaim && state?.lastRewardAt
          ? DAY_MS - (now - state.lastRewardAt)
          : null;

        const canAttack = !locked && !ownedByMyGuild && !!guild && myOwnedCount < 1;

        return (
          <div key={def.id} style={{
            background: ownedByMyGuild
              ? 'linear-gradient(135deg, rgba(20,40,12,0.95), rgba(14,28,8,0.98))'
              : ownedByEnemy
              ? 'linear-gradient(135deg, rgba(40,12,12,0.95), rgba(28,8,8,0.98))'
              : 'var(--bg-inset)',
            border: `1px solid ${ownedByMyGuild ? 'rgba(40,160,40,0.5)' : ownedByEnemy ? 'rgba(160,40,40,0.5)' : 'var(--border-dark)'}`,
            padding: 12,
            opacity: locked ? 0.5 : 1,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 18 }}>{def.emoji}</span>
                  <p style={{ ...PX(7), color: ownedByMyGuild ? '#60c060' : ownedByEnemy ? '#e06060' : 'var(--text-bright)' }}>
                    {def.name}
                  </p>
                </div>
                <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>{def.description}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 2 }}>Nagroda/dzień</p>
                <p style={{ ...PX(5), color: 'var(--gold-bright)' }}>🪙{def.dailyGold}</p>
                <p style={{ ...PX(4), color: '#80a0ff' }}>✨{def.dailyXp} XP</p>
              </div>
            </div>

            <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>
              Min. POZ.{def.minLevel} · {def.guardianEmoji} {def.guardianName} · Oblężenie wymaga ~3 graczy
            </p>

            {/* Siege progress bar */}
            {(mySiegeActive || enemySiegeActive) && state.siegeMaxHp && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <p style={{ ...PX(4), color: mySiegeActive ? '#a080e0' : '#e09040' }}>
                    {mySiegeActive ? '⚔ Wasze oblężenie' : `⚔ Oblężenie [${state.siegeGuildTag}]`}
                  </p>
                  <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                    {state.siegeCurrentHp}/{state.siegeMaxHp} HP
                  </p>
                </div>
                <HpBar
                  current={state.siegeCurrentHp ?? 0}
                  max={state.siegeMaxHp}
                  color={mySiegeActive ? '#7040c0' : '#c07020'}
                />
              </div>
            )}

            {/* Owner */}
            {unowned && <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>Niczyje terytorium</p>}
            {ownedByMyGuild && <p style={{ ...PX(5), color: '#60c060', marginBottom: 6 }}>🏴 Wasza gildia [{guild?.tag}]</p>}
            {ownedByEnemy && <p style={{ ...PX(5), color: '#e06060', marginBottom: 6 }}>🏴 [{state.guildTag}] {state.guildName}</p>}

            {/* Actions */}
            {locked && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>🔒 Wymagany poziom {def.minLevel}</p>
            )}

            {!locked && !ownedByMyGuild && !guild && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>Dołącz do gildii, by atakować terytoria</p>
            )}

            {!locked && !ownedByMyGuild && guild && myOwnedCount >= 1 && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                🔒 Twoja gildia już posiada terytorium
              </p>
            )}

            {canAttack && (
              <button
                onClick={() => handleAttack(def, state)}
                className={mySiegeActive ? 'btn btn-primary' : 'btn btn-danger'}
                style={{ width: '100%', fontSize: 5, padding: '7px' }}
              >
                {mySiegeActive
                  ? `⚔ Kontynuuj oblężenie (${state.siegeCurrentHp} HP zostało)`
                  : unowned
                  ? `⚔ Podbij (vs ${def.guardianEmoji} — ~3 graczy)`
                  : `⚔ Oblęż (vs [${state.guildTag}] — ~3 graczy)`}
              </button>
            )}

            {ownedByMyGuild && canClaim && (
              <button
                onClick={() => handleClaim(def)}
                disabled={claimingId === def.id}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: 5, padding: '7px', marginTop: 4 }}
              >
                {claimingId === def.id ? '⏳ Odbieram...' : `🪙 Odbierz nagrodę (+${def.dailyGold}🪙, +${def.dailyXp}XP)`}
              </button>
            )}

            {ownedByMyGuild && !canClaim && nextClaimIn !== null && (
              <p style={{ ...PX(4), color: 'var(--text-muted)', marginTop: 4 }}>
                ⏳ Następna nagroda za {formatCountdown(nextClaimIn)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
