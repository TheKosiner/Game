import { useEffect, useState } from 'react';
import { TERRITORY_LIST, type TerritoryDef } from '../data/territories';
import {
  getTerritories, captureTerritory, claimTerritoryReward,
  type TerritoryState, type Guild,
} from '../lib/cloudSync';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { getHeroAttack, getHeroDefense } from '../utils/combat';

const PX = (s: number) => ({ fontFamily: "'Press Start 2P', monospace", fontSize: s } as const);
const DAY_MS = 24 * 60 * 60 * 1000;

// ── Combat types ─────────────────────────────────────────────────────────────

interface SiegeCombatState {
  territory: TerritoryDef;
  heroHp: number;
  heroMaxHp: number;
  heroAtk: number;
  heroDef: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAtk: number;
  enemyDef: number;
  enemyName: string;
  enemyEmoji: string;
  log: string[];
  done: boolean;
  won: boolean;
}

// ── HP Bar ───────────────────────────────────────────────────────────────────

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max));
  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dark)', height: 8, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct * 100}%`, background: color, transition: 'width 0.2s ease' }} />
    </div>
  );
}

// ── Siege Combat ─────────────────────────────────────────────────────────────

function SiegeCombat({
  state,
  onAttack,
  onFinish,
}: {
  state: SiegeCombatState;
  onAttack: () => void;
  onFinish: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...PX(7), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>
        ⚔ OBLĘŻENIE — {state.territory.emoji} {state.territory.name.toUpperCase()}
      </p>

      {/* Enemy */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(180,40,40,0.4)', padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <p style={{ ...PX(6), color: '#e06060' }}>{state.enemyEmoji} {state.enemyName}</p>
          <p style={{ ...PX(5), color: 'var(--text-muted)' }}>{state.enemyHp}/{state.enemyMaxHp} HP</p>
        </div>
        <HpBar current={state.enemyHp} max={state.enemyMaxHp} color="#c03030" />
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
            {state.won ? '⚔ ZWYCIĘSTWO!' : '💀 PORAŻKA'}
          </p>
          <p style={{ ...PX(5), color: 'var(--text-dim)' }}>
            {state.won ? 'Terytorium zostało przejęte przez twoją gildię!' : 'Wróg odparł atak. Spróbuj ponownie.'}
          </p>
          <button onClick={onFinish} className="btn btn-primary" style={{ marginTop: 10, fontSize: 6, padding: '8px 16px' }}>
            Powrót
          </button>
        </div>
      )}

      {/* Attack button */}
      {!state.done && (
        <button onClick={onAttack} className="btn btn-danger" style={{ width: '100%', fontSize: 7, padding: '10px' }}>
          ⚔ ATAKUJ
        </button>
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
  const user = useAuthStore(s => s.user);

  const [territories, setTerritories] = useState<Record<string, TerritoryState>>({});
  const [loading, setLoading] = useState(true);
  const [combat, setCombat] = useState<SiegeCombatState | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    getTerritories().then(t => { setTerritories(t); setLoading(false); });
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function buildSiegeState(def: TerritoryDef, state: TerritoryState | undefined): SiegeCombatState {
    const heroHp = hero.maxHp;
    const heroAtk = getHeroAttack(hero);
    const heroDef = getHeroDefense(hero);

    let enemyAtk: number;
    let enemyDef: number;
    let enemyHp: number;
    let enemyName: string;
    let enemyEmoji: string;

    if (state?.guildId && state.guildId !== guild?.id) {
      // enemy-owned: scale by member stats
      const memberCount = state.defenderMemberCount || 1;
      const avgLvl = state.defenderAvgLevel || 1;
      const mult = Math.min(3, 1 + Math.sqrt(memberCount) * avgLvl / 20);
      enemyAtk = Math.round(def.baseAtk * mult);
      enemyDef = Math.round(def.baseDef * mult);
      enemyHp = Math.round(def.baseHp * mult);
      enemyName = `[${state.guildTag}] ${state.guildName}`;
      enemyEmoji = '🏰';
    } else {
      // unowned: fight static guardian
      enemyAtk = def.baseAtk;
      enemyDef = def.baseDef;
      enemyHp = def.baseHp;
      enemyName = def.guardianName;
      enemyEmoji = def.guardianEmoji;
    }

    return {
      territory: def,
      heroHp, heroMaxHp: heroHp,
      heroAtk, heroDef,
      enemyHp, enemyMaxHp: enemyHp,
      enemyAtk, enemyDef,
      enemyName, enemyEmoji,
      log: [`Oblężenie ${def.name} rozpoczęte!`],
      done: false,
      won: false,
    };
  }

  function handleAttack() {
    if (!combat || combat.done) return;
    setCombat(prev => {
      if (!prev) return prev;
      let { heroHp, heroAtk, heroDef, enemyHp, enemyAtk, enemyDef } = prev;
      const log = [...prev.log];

      // hero attacks
      const heroDmg = Math.max(1, Math.round(heroAtk * (0.85 + Math.random() * 0.3)) - enemyDef);
      enemyHp = Math.max(0, enemyHp - heroDmg);
      log.push(`Zadajesz ${heroDmg} obrażeń wrogowi.`);

      if (enemyHp <= 0) {
        log.push('Wróg pokonany!');
        return { ...prev, heroHp, enemyHp: 0, log, done: true, won: true };
      }

      // enemy attacks
      const enemyDmg = Math.max(1, Math.round(enemyAtk * (0.85 + Math.random() * 0.3)) - heroDef);
      heroHp = Math.max(0, heroHp - enemyDmg);
      log.push(`Wróg zadaje ci ${enemyDmg} obrażeń.`);

      if (heroHp <= 0) {
        log.push('Zostałeś pokonany!');
        return { ...prev, heroHp: 0, enemyHp, log, done: true, won: false };
      }

      return { ...prev, heroHp, enemyHp, log };
    });
  }

  async function handleCombatFinish() {
    if (!combat || !guild || !user) { setCombat(null); return; }
    if (combat.won) {
      const members = Object.values(guild.members);
      const avgLevel = members.length > 0
        ? Math.round(members.reduce((s, m) => s + m.level, 0) / members.length)
        : hero.level;
      await captureTerritory(
        combat.territory.id,
        guild.id,
        guild.name,
        guild.tag,
        members.length,
        avgLevel,
      );
      const updated = await getTerritories();
      setTerritories(updated);
    }
    setCombat(null);
  }

  async function handleClaim(def: TerritoryDef) {
    if (!guild || !user) return;
    setClaimingId(def.id);
    try {
      const result = await claimTerritoryReward(def.id, guild.id);
      if (result !== null) {
        addGold(def.dailyGold);
        addXp(def.dailyXp);
        const updated = await getTerritories();
        setTerritories(updated);
      }
    } finally { setClaimingId(null); }
  }

  if (combat) {
    return (
      <div className="card p-3">
        <SiegeCombat state={combat} onAttack={handleAttack} onFinish={handleCombatFinish} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>←</button>
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>🗺 MAPA TERYTORIÓW</p>
      </div>

      {loading && (
        <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>⏳ Ładowanie...</p>
      )}

      {!loading && TERRITORY_LIST.map(def => {
        const state = territories[def.id];
        const ownedByMyGuild = state?.guildId === guild?.id;
        const ownedByEnemy = !!state?.guildId && !ownedByMyGuild;
        const unowned = !state?.guildId;
        const locked = hero.level < def.minLevel;

        const now = Date.now();
        const canClaim = ownedByMyGuild && guild && (state.lastRewardAt === null || now - (state.lastRewardAt ?? 0) >= DAY_MS);
        const nextClaimIn = ownedByMyGuild && !canClaim && state?.lastRewardAt
          ? DAY_MS - (now - state.lastRewardAt)
          : null;

        const formatCountdown = (ms: number) => {
          const h = Math.floor(ms / 3600000);
          const m = Math.floor((ms % 3600000) / 60000);
          return `${h}h ${m}m`;
        };

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

            {/* Min level */}
            <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>
              Min. POZ.{def.minLevel} · Strażnik: {def.guardianEmoji} {def.guardianName}
            </p>

            {/* Owner info */}
            {unowned && (
              <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 6 }}>Niczyje terytorium</p>
            )}
            {ownedByMyGuild && (
              <p style={{ ...PX(5), color: '#60c060', marginBottom: 6 }}>🏴 Wasza gildia [{guild?.tag}]</p>
            )}
            {ownedByEnemy && (
              <p style={{ ...PX(5), color: '#e06060', marginBottom: 6 }}>🏴 [{state.guildTag}] {state.guildName}</p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6 }}>
              {locked && (
                <p style={{ ...PX(4), color: 'var(--text-muted)' }}>🔒 Wymagany poziom {def.minLevel}</p>
              )}

              {!locked && !ownedByMyGuild && guild && (
                <button
                  onClick={() => setCombat(buildSiegeState(def, state))}
                  className="btn btn-danger"
                  style={{ flex: 1, fontSize: 5, padding: '7px' }}
                >
                  {unowned ? `⚔ Podbij (vs ${def.guardianEmoji})` : `⚔ Oblęż (vs [${state.guildTag}])`}
                </button>
              )}

              {!locked && !guild && !ownedByMyGuild && (
                <p style={{ ...PX(4), color: 'var(--text-muted)' }}>Dołącz do gildii, by podbijać terytoria</p>
              )}

              {ownedByMyGuild && canClaim && (
                <button
                  onClick={() => handleClaim(def)}
                  disabled={claimingId === def.id}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: 5, padding: '7px' }}
                >
                  {claimingId === def.id ? '⏳ Odbieram...' : `🪙 Odbierz nagrodę (+${def.dailyGold}🪙, +${def.dailyXp}XP)`}
                </button>
              )}

              {ownedByMyGuild && !canClaim && nextClaimIn !== null && (
                <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                  ⏳ Następna nagroda za {formatCountdown(nextClaimIn)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
