import { useState, useEffect, useRef } from 'react';
import { useGameStore, CHALLENGE_COOLDOWN } from '../store/gameStore';
import { CHALLENGE_BOSSES } from '../data/challengeBosses';
import type { ChallengePower } from '../types';

const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

const POWER_INFO: Record<ChallengePower, { label: string; color: string; emoji: string; desc: string }> = {
  regen:         { label: 'REGEN',     color: '#ff4444', emoji: '🔴', desc: '3% HP/runda' },
  double_strike: { label: 'x2 CIOSY',  color: '#ff9900', emoji: '⚡', desc: 'Atakuje 2×' },
  armor_break:   { label: 'ŁAM.OBR.',  color: '#cc44ff', emoji: '💥', desc: 'Obrona -60%' },
  dodge:         { label: 'UNIK 25%',  color: '#00f5ff', emoji: '💨', desc: '25% szans uniknięcia' },
  rage:          { label: 'FURIA',     color: '#ff6600', emoji: '🔥', desc: 'ATK ×1.6 <30% HP' },
  shield:        { label: 'TARCZA',    color: '#4488ff', emoji: '🛡', desc: '25% maxHP tarczy' },
  lifesteal:     { label: 'VAMP HP',   color: '#cc0066', emoji: '💉', desc: 'Kradnie 25% DMG' },
  poison:        { label: 'TRUCIZNA',  color: '#44cc44', emoji: '🟢', desc: '4% HP trucizny/runda' },
};

function useCooldown(lastAt: number) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const tick = () => setMs(Math.max(0, CHALLENGE_COOLDOWN - (Date.now() - lastAt)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastAt]);
  return ms;
}

function fmtMs(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function PowerBadge({ power, active }: { power: ChallengePower; active?: boolean }) {
  const info = POWER_INFO[power];
  return (
    <span title={info.desc} style={{
      ...MONO, fontSize: 7,
      color: info.color,
      background: active ? `${info.color}30` : `${info.color}10`,
      border: `1px solid ${active ? info.color : info.color + '44'}`,
      padding: '2px 5px',
      whiteSpace: 'nowrap',
      boxShadow: active ? `0 0 8px ${info.color}60` : 'none',
      transition: 'all 0.3s',
    }}>
      {info.emoji} {info.label}
    </span>
  );
}

// ── Interactive Fight View ──────────────────────────────────────────────────

function FightView() {
  const hero              = useGameStore(s => s.hero);
  const fight             = useGameStore(s => s.challengeFight)!;
  const fightLog          = useGameStore(s => s.challengeFightLog);
  const lastHit           = useGameStore(s => s.challengeLastHit);
  const attackChallengeBoss = useGameStore(s => s.attackChallengeBoss);
  const fleeChallengeFight  = useGameStore(s => s.fleeChallengeFight);

  const boss = CHALLENGE_BOSSES[fight.bossIdx];
  const bossHpPct  = Math.max(0, (fight.bossHp / boss.maxHp) * 100);
  const shieldPct  = boss.powers.includes('shield') ? (fight.shieldHp / Math.floor(boss.maxHp * 0.25)) * 100 : 0;
  const heroHpPct  = Math.max(0, (hero.hp / hero.maxHp) * 100);

  // hit effects
  const [bossAnimKey, setBossAnimKey] = useState(0);
  const [heroAnimKey, setHeroAnimKey]  = useState(0);
  const [bossHitKey, setBossHitKey]   = useState(0);

  // floating damage numbers
  const [floatBoss, setFloatBoss] = useState<{ val: number; crit: boolean; key: number } | null>(null);
  const [floatHero, setFloatHero] = useState<{ val: number; key: number } | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  const [autoFight, setAutoFight] = useState(false);
  const autoRef = useRef(autoFight);
  autoRef.current = autoFight;

  useEffect(() => {
    if (!lastHit) return;
    if (lastHit.heroDmg > 0) {
      setBossAnimKey(k => k + 1);
      setBossHitKey(k => k + 1);
      setFloatBoss({ val: lastHit.heroDmg, crit: lastHit.heroCrit, key: lastHit.ts });
    }
    const totalBoss = lastHit.bossDmg1 + lastHit.bossDmg2 + lastHit.poisonDmg;
    if (totalBoss > 0) {
      setHeroAnimKey(k => k + 1);
      setFloatHero({ val: totalBoss, key: lastHit.ts + 1 });
    }
  }, [lastHit?.ts]);

  // auto scroll log
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [fightLog.length]);

  // auto-fight interval
  useEffect(() => {
    if (!autoFight) return;
    const id = setInterval(() => {
      if (!autoRef.current) { clearInterval(id); return; }
      attackChallengeBoss();
    }, 650);
    return () => clearInterval(id);
  }, [autoFight]);

  // stop auto when fight ends
  useEffect(() => {
    if (!fight) setAutoFight(false);
  }, [!!fight]);

  const bossHpColor = bossHpPct > 60 ? '#44cc44' : bossHpPct > 30 ? '#ff9900' : '#ff4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Boss card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,5,5,0.97), rgba(14,4,4,0.99))',
        border: `1px solid ${fight.rageActive ? 'rgba(255,102,0,0.8)' : 'rgba(120,30,30,0.6)'}`,
        padding: 12,
        boxShadow: fight.rageActive ? '0 0 20px rgba(255,102,0,0.25), inset 0 0 20px rgba(255,60,0,0.08)' : 'inset 0 2px 8px rgba(0,0,0,0.5)',
        animation: fight.rageActive ? 'ragePulse 1.2s ease-in-out infinite' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>

          {/* Boss emoji with shake animation */}
          <div
            key={bossAnimKey}
            style={{
              fontSize: 44, flexShrink: 0, lineHeight: 1,
              animation: bossAnimKey > 0 ? 'bossShake 0.4s ease' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56,
              position: 'relative',
            }}
          >
            <span
              key={bossHitKey}
              style={{ animation: bossHitKey > 0 ? 'bossHit 0.35s ease' : 'none' }}
            >
              {boss.emoji}
            </span>

            {/* Floating damage number on boss */}
            {floatBoss && (
              <span
                key={floatBoss.key}
                style={{
                  position: 'absolute', top: -4, right: -8,
                  ...ORB, fontSize: floatBoss.crit ? 13 : 10,
                  color: floatBoss.crit ? '#ffd700' : '#ff4444',
                  textShadow: floatBoss.crit ? '0 0 10px #ffd700' : '0 0 6px #ff4444',
                  pointerEvents: 'none', whiteSpace: 'nowrap',
                  animation: 'floatDmg 0.9s ease forwards',
                }}
              >
                -{floatBoss.val}{floatBoss.crit ? '💥' : ''}
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <p style={{ ...ORB, fontSize: 9, color: fight.rageActive ? '#ff6600' : '#c05050' }}>{boss.name}</p>
              {fight.rageActive && (
                <span style={{ ...MONO, fontSize: 7, color: '#ff6600', background: 'rgba(255,102,0,0.2)', border: '1px solid rgba(255,102,0,0.6)', padding: '1px 4px' }}>
                  🔥 FURIA
                </span>
              )}
            </div>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', marginBottom: 5 }}>
              Poz. {boss.level} · Runda {fight.round}
            </p>
            <p style={{ ...MONO, fontSize: 8, color: bossHpColor }}>
              {fight.bossHp} / {boss.maxHp} HP
            </p>
          </div>
        </div>

        {/* Boss HP bar */}
        <div className="pixel-bar" style={{ marginBottom: fight.shieldHp > 0 ? 4 : 0 }}>
          <div className="pixel-bar-fill" style={{
            width: `${bossHpPct}%`,
            background: fight.rageActive
              ? 'linear-gradient(90deg, #cc2200, #ff6600)'
              : `linear-gradient(90deg, #5a0e0e, ${bossHpColor})`,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Shield bar */}
        {boss.powers.includes('shield') && (
          <div className="pixel-bar" style={{ marginBottom: 6 }}>
            <div className="pixel-bar-fill" style={{
              width: `${shieldPct}%`,
              background: 'linear-gradient(90deg, #1a3a6a, #4488ff)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}

        {/* Power badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {boss.powers.map(p => (
            <PowerBadge
              key={p}
              power={p}
              active={
                (p === 'rage' && fight.rageActive) ||
                (p === 'shield' && fight.shieldHp > 0) ||
                (p === 'regen' && fight.round > 0) ||
                (p === 'poison' && fight.round > 0)
              }
            />
          ))}
        </div>
      </div>

      {/* Hero HP */}
      <div
        key={heroAnimKey}
        style={{
          background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
          padding: 8,
          animation: heroAnimKey > 0 ? 'heroHit 0.5s ease' : 'none',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)' }}>{hero.name}</span>
          <span style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)' }}>{hero.hp} / {hero.maxHp} HP</span>
        </div>
        <div className="pixel-bar">
          <div className="pixel-bar-fill hp-fill" style={{ width: `${heroHpPct}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Floating damage on hero */}
        {floatHero && (
          <span
            key={floatHero.key}
            style={{
              position: 'absolute', top: 2, right: 8,
              ...ORB, fontSize: 11,
              color: '#ff4444',
              textShadow: '0 0 8px #ff4444',
              pointerEvents: 'none',
              animation: 'floatDmg 0.9s ease forwards',
            }}
          >
            -{floatHero.val}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="btn btn-primary"
          style={{ flex: 2, fontSize: 8, padding: '10px' }}
          onClick={() => { setAutoFight(false); attackChallengeBoss(); }}
        >
          ⚔ ATAKUJ
        </button>
        <button
          className={autoFight ? 'btn btn-danger' : 'btn btn-secondary'}
          style={{ flex: 2, fontSize: 8, padding: '10px' }}
          onClick={() => setAutoFight(v => !v)}
        >
          {autoFight ? '⏹ STOP' : '⚡ AUTO'}
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: 7, padding: '10px 6px', color: 'var(--text-muted)' }}
          onClick={() => { setAutoFight(false); fleeChallengeFight(); }}
        >
          🚪 UCIEKAJ
        </button>
      </div>

      {/* Combat log */}
      <div
        ref={logRef}
        style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)',
          padding: 8, maxHeight: 180, overflowY: 'auto',
        }}
      >
        {fightLog.map((line, i) => {
          const color =
            line.includes('🏆') || line.includes('ZWYCIĘSTWO') ? '#ffd700' :
            line.includes('💀') || line.includes('KLĘSKA') ? '#ff4444' :
            line.includes('🔴') || line.includes('REGEN') ? '#ff4444' :
            line.includes('🔥') || line.includes('FURIA') ? '#ff6600' :
            line.includes('🛡') ? '#4488ff' :
            line.includes('💉') ? '#cc0066' :
            line.includes('🟢') || line.includes('TRUCIZNA') ? '#44cc44' :
            line.includes('💨') || line.includes('UNIK') ? '#00f5ff' :
            line.includes('💥') || line.includes('ŁAM') ? '#cc44ff' :
            line.includes('KRYT') ? '#ffd700' :
            line.includes('⚔') ? 'var(--text-main)' :
            line.includes('🤖') || line.includes('[x2]') ? '#ff7777' :
            'var(--text-dim)';
          return (
            <p key={i} style={{ ...MONO, fontSize: 8, color, lineHeight: 1.7, marginBottom: 0 }}>
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ── Result Screen ───────────────────────────────────────────────────────────

const RARITY_COLOR: Record<string, string> = {
  common: '#888899', uncommon: '#00cc66', rare: '#4488ff', epic: '#cc44ff', legendary: '#ffd700',
};
const RARITY_LABEL: Record<string, string> = {
  common: 'ZWYKŁY', uncommon: 'NIEZWYKŁY', rare: 'RZADKI', epic: 'EPICKI', legendary: 'LEGENDARNY',
};

function ResultView({ onDismiss }: { onDismiss: () => void }) {
  const result = useGameStore(s => s.challengeResult)!;
  const boss = CHALLENGE_BOSSES[result.bossIdx];
  const [showLog, setShowLog] = useState(false);

  const won = result.won;
  const accentColor = won ? '#ffd700' : '#ff4444';
  const bgColor     = won ? 'rgba(255,215,0,0.05)' : 'rgba(255,68,68,0.05)';
  const borderColor = won ? 'rgba(255,215,0,0.35)' : 'rgba(255,68,68,0.35)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Result header */}
      <div style={{
        background: bgColor, border: `1px solid ${borderColor}`,
        padding: 20, textAlign: 'center',
        boxShadow: `0 0 30px ${accentColor}18`,
      }}>
        <p style={{ fontSize: 48, marginBottom: 8 }}>{won ? '🏆' : '💀'}</p>
        <p style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 11,
          color: accentColor, textShadow: `0 0 16px ${accentColor}`,
          marginBottom: 6, letterSpacing: '0.05em',
        }}>
          {won ? 'ZWYCIĘSTWO!' : 'KLĘSKA!'}
        </p>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>
          {boss.emoji} {boss.name}
        </p>
      </div>

      {/* Rewards */}
      <div style={{
        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
        padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <p style={{ ...ORB, fontSize: 8, color: 'var(--text-dim)', marginBottom: 2 }}>NAGRODY</p>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', marginBottom: 2 }}>DOŚWIADCZENIE</p>
            <p style={{ ...ORB, fontSize: 13, color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>
              +{won ? boss.xpReward.toLocaleString() : Math.floor(boss.xpReward * 0.1).toLocaleString()}
            </p>
          </div>
          {won && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', marginBottom: 2 }}>ZŁOTO</p>
              <p style={{ ...ORB, fontSize: 13, color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
                +{boss.goldReward.toLocaleString()} 🪙
              </p>
            </div>
          )}
        </div>

        {/* Loot */}
        {won && result.loot.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            <p style={{ ...ORB, fontSize: 8, color: 'var(--text-dim)' }}>PRZEDMIOTY</p>
            {result.loot.map((item, i) => {
              const rc = RARITY_COLOR[item.rarity];
              return (
                <div key={i} style={{
                  background: `linear-gradient(135deg, rgba(0,0,0,0.6), ${rc}08)`,
                  border: `1px solid ${rc}55`,
                  padding: '8px 10px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: `0 0 12px ${rc}18`,
                  animation: 'slide-up 0.3s ease',
                }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ ...MONO, fontSize: 10, color: rc, textShadow: `0 0 6px ${rc}80`, marginBottom: 2 }}>
                      {item.name}
                    </p>
                    <p style={{ ...MONO, fontSize: 8, color: `${rc}99` }}>
                      {RARITY_LABEL[item.rarity]} · Poz. {item.level}
                    </p>
                  </div>
                  <span style={{ ...MONO, fontSize: 8, color: rc, background: `${rc}18`, border: `1px solid ${rc}44`, padding: '2px 6px' }}>
                    {RARITY_LABEL[item.rarity]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!won && (
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>
            Powróć silniejszy — masz godzinę na przygotowanie.
          </p>
        )}
      </div>

      {/* Combat log toggle */}
      <button
        onClick={() => setShowLog(v => !v)}
        style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', cursor: 'pointer', width: '100%' }}
      >
        {showLog ? '▲ UKRYJ LOG WALKI' : '▼ POKAŻ LOG WALKI'}
      </button>

      {showLog && (
        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)', padding: 8, maxHeight: 200, overflowY: 'auto' }}>
          {result.log.map((line, i) => (
            <p key={i} style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', lineHeight: 1.6 }}>{line}</p>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '12px', fontSize: 10 }}
        onClick={onDismiss}
      >
        ← WRÓĆ DO WYZWAŃ
      </button>
    </div>
  );
}

// ── Boss Selection View ─────────────────────────────────────────────────────

function SelectView() {
  const challengeUnlocked = useGameStore(s => s.challengeUnlocked);
  const lastChallengeAt   = useGameStore(s => s.lastChallengeAt);
  const startChallengeFight = useGameStore(s => s.startChallengeFight);

  const cooldownLeft = useCooldown(lastChallengeAt);
  const canFight = cooldownLeft === 0;

  const [selectedIdx, setSelectedIdx] = useState(challengeUnlocked);
  const selected = CHALLENGE_BOSSES[selectedIdx];
  const isUnlocked = selectedIdx <= challengeUnlocked;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 9, color: '#ff9900', textShadow: '0 0 10px rgba(255,153,0,0.5)' }}>
          ⚡ WYZWANIA
        </p>
        {cooldownLeft > 0 ? (
          <span style={{ ...MONO, fontSize: 9, color: '#ff4444', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', padding: '2px 8px' }}>
            ⏱ {fmtMs(cooldownLeft)}
          </span>
        ) : (
          <span style={{ ...MONO, fontSize: 9, color: '#44cc44', background: 'rgba(68,204,68,0.1)', border: '1px solid rgba(68,204,68,0.3)', padding: '2px 8px' }}>
            ● GOTOWY
          </span>
        )}
      </div>

      <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>
        Raz na godzinę możesz wyzwać potężnego przeciwnika. Zwycięstwo odblokowuje kolejnego.
      </p>

      {/* Boss chain */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {CHALLENGE_BOSSES.map((boss, idx) => {
          const unlocked = idx <= challengeUnlocked;
          const defeated = idx < challengeUnlocked;
          const isSel = idx === selectedIdx;
          const bColor = defeated ? '#44cc4466' : unlocked ? '#ff990066' : '#33333366';
          return (
            <div
              key={boss.id}
              onClick={() => unlocked && setSelectedIdx(idx)}
              style={{
                background: isSel ? 'rgba(255,153,0,0.1)' : defeated ? 'rgba(68,204,68,0.04)' : unlocked ? 'rgba(255,153,0,0.05)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${isSel ? '#ff9900aa' : bColor}`,
                padding: '7px 10px',
                cursor: unlocked ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: unlocked ? 1 : 0.45,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{unlocked ? boss.emoji : '🔒'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...ORB, fontSize: 8, color: defeated ? '#44cc44' : unlocked ? '#ff9900' : 'var(--text-muted)' }}>
                  {defeated ? '✓ ' : ''}{boss.name}
                </p>
                <p style={{ ...MONO, fontSize: 7, color: 'var(--text-dim)' }}>Poz.{boss.level} · Min. {boss.minLevel}</p>
              </div>
              {unlocked && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-end', maxWidth: 110 }}>
                  {boss.powers.slice(0, 3).map(p => <PowerBadge key={p} power={p} />)}
                  {boss.powers.length > 3 && <span style={{ ...MONO, fontSize: 7, color: 'var(--text-muted)' }}>+{boss.powers.length - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected boss details */}
      <div style={{
        background: 'rgba(255,153,0,0.04)',
        border: '1px solid rgba(255,153,0,0.22)',
        padding: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 26 }}>{isUnlocked ? selected.emoji : '🔒'}</span>
          <div style={{ flex: 1 }}>
            <p style={{ ...ORB, fontSize: 10, color: '#ff9900' }}>{selected.name}</p>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)' }}>Poziom {selected.level}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ ...MONO, fontSize: 9, color: '#ffd700' }}>+{selected.xpReward.toLocaleString()} XP</p>
            <p style={{ ...MONO, fontSize: 9, color: '#ffd700' }}>+{selected.goldReward.toLocaleString()} 🪙</p>
          </div>
        </div>

        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-main)', marginBottom: 8 }}>{selected.description}</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <span style={{ ...MONO, fontSize: 9, color: '#ff4444' }}>❤ {selected.hp.toLocaleString()}</span>
          <span style={{ ...MONO, fontSize: 9, color: '#ff9900' }}>⚔ {selected.attack}</span>
          <span style={{ ...MONO, fontSize: 9, color: '#4488ff' }}>🛡 {selected.defense}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {selected.powers.map(p => (
            <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <PowerBadge power={p} />
              <span style={{ ...MONO, fontSize: 6, color: 'var(--text-muted)' }}>{POWER_INFO[p].desc}</span>
            </div>
          ))}
        </div>

        <p style={{ ...MONO, fontSize: 8, color: '#cc44ff', marginBottom: 10 }}>
          Drop: {selectedIdx >= 5 ? '3× ✨ LEGENDARNY' : selectedIdx >= 2 ? '2× 🟪 EPICKI/LEGENDARNY' : '1× 🟪 EPICKI'}
        </p>

        {!isUnlocked ? (
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>🔒 Pokonaj poprzedniego bossa aby odblokować</p>
        ) : !canFight ? (
          <p style={{ ...MONO, fontSize: 9, color: '#ff9900', textAlign: 'center' }}>⏱ Następna próba za: {fmtMs(cooldownLeft)}</p>
        ) : (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: 10, letterSpacing: '0.1em' }}
            onClick={() => startChallengeFight(selectedIdx)}
          >
            ⚡ WALCZ Z {selected.name.toUpperCase()}
          </button>
        )}
      </div>

    </div>
  );
}

export default function ChallengePanel() {
  const challengeFight       = useGameStore(s => s.challengeFight);
  const challengeResult      = useGameStore(s => s.challengeResult);
  const clearChallengeResult = useGameStore(s => s.clearChallengeResult);

  if (challengeFight) return <FightView />;
  if (challengeResult) return <ResultView onDismiss={clearChallengeResult} />;
  return <SelectView />;
}
