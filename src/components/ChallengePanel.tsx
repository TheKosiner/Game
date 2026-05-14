import React, { useState, useEffect, useRef } from 'react';
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

// ── Boss SVG Art ────────────────────────────────────────────────────────────

function BossSvg({ id, size = 220 }: { id: number; size?: number }) {
  const icons: Record<number, React.ReactElement> = {

    // 0 – Cyber Gladiator: armored fighter, energy sword + shield
    0: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="cg"><feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* aura */}
        <ellipse cx="60" cy="150" rx="40" ry="8" fill="#ff990020"/>
        {/* legs */}
        <rect x="42" y="108" width="14" height="35" rx="4" fill="#CC5500"/>
        <rect x="64" y="108" width="14" height="35" rx="4" fill="#CC5500"/>
        <rect x="40" y="136" width="18" height="8" rx="3" fill="#884400"/>
        <rect x="62" y="136" width="18" height="8" rx="3" fill="#884400"/>
        {/* torso */}
        <rect x="34" y="60" width="52" height="52" rx="6" fill="#DD6600"/>
        <rect x="38" y="64" width="44" height="44" rx="4" fill="#FF8800" opacity="0.6"/>
        {/* chest reactor */}
        <circle cx="60" cy="84" r="10" fill="#331100"/>
        <circle cx="60" cy="84" r="8" fill="#FF4400" opacity="0.7"/>
        <circle cx="60" cy="84" r="5" fill="#FFCC00"/>
        <circle cx="60" cy="84" r="2.5" fill="white"/>
        {/* shoulders */}
        <ellipse cx="30" cy="72" rx="12" ry="14" fill="#DD6600"/>
        <ellipse cx="90" cy="72" rx="12" ry="14" fill="#DD6600"/>
        <ellipse cx="30" cy="70" rx="9" ry="10" fill="#FF8800" opacity="0.4"/>
        <ellipse cx="90" cy="70" rx="9" ry="10" fill="#FF8800" opacity="0.4"/>
        {/* shield arm left */}
        <rect x="6" y="68" width="20" height="28" rx="3" fill="#226688"/>
        <rect x="8" y="70" width="16" height="24" rx="2" fill="#00AADD" opacity="0.5"/>
        <line x1="16" y1="70" x2="16" y2="92" stroke="#00F5FF" strokeWidth="1.5" opacity="0.8"/>
        <line x1="10" y1="80" x2="22" y2="80" stroke="#00F5FF" strokeWidth="1.5" opacity="0.8"/>
        {/* sword arm right */}
        <rect x="96" y="60" width="6" height="52" rx="2" fill="#886644"/>
        <polygon points="99,12 103,60 95,60" fill="#DDDDEE"/>
        <polygon points="99,12 101,60 99,60" fill="#00F5FF" opacity="0.8"/>
        <line x1="99" y1="14" x2="99" y2="58" stroke="white" strokeWidth="1" opacity="0.6"/>
        <rect x="93" y="58" width="12" height="5" rx="1" fill="#886644"/>
        {/* neck */}
        <rect x="50" y="50" width="20" height="14" rx="3" fill="#AA4400"/>
        {/* helmet */}
        <ellipse cx="60" cy="38" rx="22" ry="24" fill="#DD6600"/>
        <ellipse cx="60" cy="36" rx="18" ry="20" fill="#CC5500"/>
        {/* visor */}
        <rect x="42" y="32" width="36" height="12" rx="5" fill="#001122"/>
        <rect x="44" y="33" width="32" height="10" rx="4" fill="#00AAFF" opacity="0.3"/>
        <line x1="44" y1="38" x2="76" y2="38" stroke="#00F5FF" strokeWidth="1.5" opacity="0.9"/>
        {/* helmet crest */}
        <ellipse cx="60" cy="16" rx="6" ry="10" fill="#FF4400"/>
        <ellipse cx="60" cy="14" rx="4" ry="8" fill="#FF8800"/>
        {/* helmet horns */}
        <polygon points="38,28 32,10 44,26" fill="#AA4400"/>
        <polygon points="82,28 88,10 76,26" fill="#AA4400"/>
        <g filter="url(#cg)">
          <line x1="99" y1="14" x2="99" y2="58" stroke="#00F5FF" strokeWidth="2" opacity="0.7"/>
          <circle cx="60" cy="84" r="6" fill="#FFCC00" opacity="0.5"/>
        </g>
      </svg>
    ),

    // 1 – Neural Phantom: ghostly floating entity with circuit patterns
    1: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="np"><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* ghost trail bottom */}
        <ellipse cx="60" cy="148" rx="30" ry="10" fill="#4400AA" opacity="0.3"/>
        {/* wisps */}
        <ellipse cx="35" cy="130" rx="8" ry="20" fill="#6622CC" opacity="0.3"/>
        <ellipse cx="60" cy="138" rx="12" ry="18" fill="#6622CC" opacity="0.4"/>
        <ellipse cx="85" cy="132" rx="8" ry="20" fill="#6622CC" opacity="0.3"/>
        {/* body */}
        <ellipse cx="60" cy="95" rx="28" ry="42" fill="#220066" opacity="0.85"/>
        <ellipse cx="60" cy="90" rx="22" ry="36" fill="#4400AA" opacity="0.6"/>
        {/* circuit lines on body */}
        <line x1="44" y1="80" x2="76" y2="80" stroke="#AA44FF" strokeWidth="1" opacity="0.7"/>
        <line x1="44" y1="90" x2="76" y2="90" stroke="#AA44FF" strokeWidth="1" opacity="0.7"/>
        <line x1="44" y1="100" x2="76" y2="100" stroke="#AA44FF" strokeWidth="1" opacity="0.5"/>
        <line x1="54" y1="72" x2="54" y2="112" stroke="#AA44FF" strokeWidth="1" opacity="0.5"/>
        <line x1="66" y1="72" x2="66" y2="112" stroke="#AA44FF" strokeWidth="1" opacity="0.5"/>
        <circle cx="44" cy="80" r="2" fill="#CC88FF"/>
        <circle cx="76" cy="80" r="2" fill="#CC88FF"/>
        <circle cx="54" cy="90" r="2" fill="#CC88FF"/>
        <circle cx="66" cy="90" r="2" fill="#CC88FF"/>
        {/* arms — wispy */}
        <ellipse cx="22" cy="90" rx="10" ry="5" fill="#4400AA" opacity="0.6" transform="rotate(-30 22 90)"/>
        <ellipse cx="98" cy="90" rx="10" ry="5" fill="#4400AA" opacity="0.6" transform="rotate(30 98 90)"/>
        <circle cx="14" cy="86" r="5" fill="#AA44FF" opacity="0.7"/>
        <circle cx="106" cy="86" r="5" fill="#AA44FF" opacity="0.7"/>
        {/* neck */}
        <rect x="52" y="50" width="16" height="12" rx="4" fill="#330088" opacity="0.9"/>
        {/* head */}
        <ellipse cx="60" cy="36" rx="24" ry="28" fill="#220066" opacity="0.9"/>
        <ellipse cx="60" cy="34" rx="18" ry="22" fill="#4400AA" opacity="0.5"/>
        {/* eyes — glowing */}
        <ellipse cx="50" cy="32" rx="8" ry="5" fill="#001100"/>
        <ellipse cx="70" cy="32" rx="8" ry="5" fill="#001100"/>
        <ellipse cx="50" cy="32" rx="6" ry="3.5" fill="#AA00FF" opacity="0.9"/>
        <ellipse cx="70" cy="32" rx="6" ry="3.5" fill="#AA00FF" opacity="0.9"/>
        <ellipse cx="50" cy="32" rx="3" ry="2" fill="#EE88FF"/>
        <ellipse cx="70" cy="32" rx="3" ry="2" fill="#EE88FF"/>
        {/* circuit headband */}
        <path d="M38 28 Q60 20 82 28" fill="none" stroke="#CC88FF" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="60" cy="20" r="3" fill="#AA44FF"/>
        <circle cx="44" cy="26" r="2" fill="#AA44FF"/>
        <circle cx="76" cy="26" r="2" fill="#AA44FF"/>
        <g filter="url(#np)">
          <ellipse cx="50" cy="32" rx="7" ry="4" fill="#AA00FF" opacity="0.4"/>
          <ellipse cx="70" cy="32" rx="7" ry="4" fill="#AA00FF" opacity="0.4"/>
          <ellipse cx="60" cy="138" rx="14" ry="20" fill="#6622CC" opacity="0.2"/>
        </g>
      </svg>
    ),

    // 2 – Iron Warlord: massive robot with shoulder cannons
    2: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="iw"><feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        <ellipse cx="60" cy="152" rx="40" ry="6" fill="#44000020"/>
        {/* legs — thick */}
        <rect x="36" y="108" width="20" height="40" rx="5" fill="#444455"/>
        <rect x="64" y="108" width="20" height="40" rx="5" fill="#444455"/>
        <rect x="34" y="136" width="24" height="10" rx="4" fill="#333344"/>
        <rect x="62" y="136" width="24" height="10" rx="4" fill="#333344"/>
        <rect x="36" y="110" width="7" height="26" rx="2" fill="#5566AA" opacity="0.4"/>
        <rect x="77" y="110" width="7" height="26" rx="2" fill="#5566AA" opacity="0.4"/>
        {/* waist */}
        <rect x="36" y="100" width="48" height="12" rx="4" fill="#333344"/>
        {/* torso — huge */}
        <rect x="24" y="52" width="72" height="52" rx="8" fill="#555566"/>
        <rect x="28" y="56" width="64" height="44" rx="6" fill="#444455" opacity="0.8"/>
        {/* chest armor plates */}
        <rect x="30" y="58" width="26" height="20" rx="3" fill="#666677"/>
        <rect x="64" y="58" width="26" height="20" rx="3" fill="#666677"/>
        {/* chest core — red */}
        <circle cx="60" cy="78" r="12" fill="#220000"/>
        <circle cx="60" cy="78" r="10" fill="#AA0000" opacity="0.8"/>
        <circle cx="60" cy="78" r="7" fill="#FF2200"/>
        <circle cx="60" cy="78" r="4" fill="#FF8800"/>
        <circle cx="60" cy="78" r="2" fill="#FFDD00"/>
        {/* belly vents */}
        <rect x="36" y="86" width="8" height="3" rx="1" fill="#222233"/>
        <rect x="48" y="86" width="8" height="3" rx="1" fill="#222233"/>
        <rect x="64" y="86" width="8" height="3" rx="1" fill="#222233"/>
        <rect x="76" y="86" width="8" height="3" rx="1" fill="#222233"/>
        {/* shoulder cannons */}
        <ellipse cx="18" cy="60" rx="14" ry="16" fill="#333344"/>
        <rect x="4" y="52" width="28" height="12" rx="4" fill="#444455"/>
        <rect x="2" y="55" width="18" height="6" rx="2" fill="#222233"/>
        <rect x="2" y="57" width="16" height="2" rx="1" fill="#FF4400" opacity="0.7"/>
        <ellipse cx="102" cy="60" rx="14" ry="16" fill="#333344"/>
        <rect x="88" y="52" width="28" height="12" rx="4" fill="#444455"/>
        <rect x="100" y="55" width="18" height="6" rx="2" fill="#222233"/>
        <rect x="102" y="57" width="16" height="2" rx="1" fill="#FF4400" opacity="0.7"/>
        {/* neck */}
        <rect x="48" y="42" width="24" height="14" rx="4" fill="#444455"/>
        {/* head */}
        <rect x="32" y="14" width="56" height="32" rx="8" fill="#555566"/>
        <rect x="36" y="18" width="48" height="24" rx="6" fill="#444455"/>
        {/* visor — red band */}
        <rect x="36" y="24" width="48" height="10" rx="3" fill="#110000"/>
        <rect x="38" y="25" width="44" height="8" rx="2" fill="#FF2200" opacity="0.5"/>
        <line x1="38" y1="29" x2="82" y2="29" stroke="#FF4400" strokeWidth="2" opacity="0.9"/>
        {/* head bolts */}
        <circle cx="38" cy="20" r="3" fill="#333344"/>
        <circle cx="82" cy="20" r="3" fill="#333344"/>
        <circle cx="38" cy="40" r="3" fill="#333344"/>
        <circle cx="82" cy="40" r="3" fill="#333344"/>
        <g filter="url(#iw)">
          <line x1="38" y1="29" x2="82" y2="29" stroke="#FF4400" strokeWidth="3" opacity="0.4"/>
          <circle cx="60" cy="78" r="13" fill="#FF2200" opacity="0.2"/>
        </g>
      </svg>
    ),

    // 3 – Quantum Berserker: rage-filled humanoid with energy erupting
    3: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="qb"><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* rage energy aura */}
        <ellipse cx="60" cy="100" rx="52" ry="58" fill="#FF220010"/>
        {/* energy cracks */}
        <line x1="60" y1="40" x2="30" y2="10" stroke="#FF6600" strokeWidth="2" opacity="0.8"/>
        <line x1="60" y1="40" x2="90" y2="5" stroke="#FFAA00" strokeWidth="1.5" opacity="0.7"/>
        <line x1="20" y1="80" x2="2" y2="65" stroke="#FF4400" strokeWidth="2" opacity="0.8"/>
        <line x1="100" y1="80" x2="118" y2="60" stroke="#FF4400" strokeWidth="2" opacity="0.8"/>
        <line x1="20" y1="80" x2="4" y2="95" stroke="#FF8800" strokeWidth="1.5" opacity="0.6"/>
        <line x1="100" y1="80" x2="116" y2="98" stroke="#FF8800" strokeWidth="1.5" opacity="0.6"/>
        {/* legs */}
        <rect x="36" y="112" width="18" height="36" rx="4" fill="#882200"/>
        <rect x="66" y="112" width="18" height="36" rx="4" fill="#882200"/>
        <rect x="34" y="138" width="22" height="8" rx="3" fill="#661100"/>
        <rect x="64" y="138" width="22" height="8" rx="3" fill="#661100"/>
        {/* cracked energy legs */}
        <line x1="45" y1="115" x2="42" y2="145" stroke="#FF6600" strokeWidth="1.5" opacity="0.6"/>
        <line x1="75" y1="115" x2="78" y2="145" stroke="#FF6600" strokeWidth="1.5" opacity="0.6"/>
        {/* torso — cracked armor */}
        <rect x="30" y="60" width="60" height="56" rx="6" fill="#882200"/>
        <rect x="34" y="64" width="52" height="48" rx="4" fill="#AA3300" opacity="0.7"/>
        {/* cracks showing energy */}
        <line x1="42" y1="64" x2="55" y2="80" stroke="#FFCC00" strokeWidth="2" opacity="0.9"/>
        <line x1="78" y1="64" x2="65" y2="80" stroke="#FF8800" strokeWidth="2" opacity="0.9"/>
        <line x1="36" y1="90" x2="52" y2="100" stroke="#FFAA00" strokeWidth="1.5" opacity="0.7"/>
        <line x1="84" y1="90" x2="68" y2="100" stroke="#FF8800" strokeWidth="1.5" opacity="0.7"/>
        {/* chest energy core — cracked */}
        <circle cx="60" cy="84" r="14" fill="#440000"/>
        <circle cx="60" cy="84" r="12" fill="#CC2200" opacity="0.8"/>
        <circle cx="60" cy="84" r="8" fill="#FF6600"/>
        <circle cx="60" cy="84" r="4" fill="#FFEE00"/>
        {/* arms raised in rage */}
        <rect x="8" y="58" width="22" height="12" rx="4" fill="#882200" transform="rotate(-40 19 64)"/>
        <rect x="4" y="44" width="14" height="22" rx="4" fill="#882200" transform="rotate(-25 11 55)"/>
        <rect x="90" y="58" width="22" height="12" rx="4" fill="#882200" transform="rotate(40 101 64)"/>
        <rect x="102" y="44" width="14" height="22" rx="4" fill="#882200" transform="rotate(25 109 55)"/>
        {/* fists with energy */}
        <circle cx="8" cy="42" r="8" fill="#AA3300"/>
        <circle cx="8" cy="42" r="5" fill="#FF6600" opacity="0.7"/>
        <circle cx="112" cy="42" r="8" fill="#AA3300"/>
        <circle cx="112" cy="42" r="5" fill="#FF6600" opacity="0.7"/>
        {/* neck */}
        <rect x="50" y="50" width="20" height="14" rx="3" fill="#882200"/>
        {/* head — enraged */}
        <ellipse cx="60" cy="36" rx="22" ry="24" fill="#992200"/>
        <ellipse cx="60" cy="34" rx="17" ry="19" fill="#BB3300" opacity="0.7"/>
        {/* angry eyes */}
        <ellipse cx="50" cy="32" rx="7" ry="5" fill="#110000"/>
        <ellipse cx="70" cy="32" rx="7" ry="5" fill="#110000"/>
        <ellipse cx="50" cy="32" rx="5" ry="3.5" fill="#FF4400"/>
        <ellipse cx="70" cy="32" rx="5" ry="3.5" fill="#FF4400"/>
        <ellipse cx="50" cy="33" rx="2.5" ry="2" fill="#FFEE00"/>
        <ellipse cx="70" cy="33" rx="2.5" ry="2" fill="#FFEE00"/>
        {/* angry brow lines */}
        <line x1="44" y1="26" x2="56" y2="30" stroke="#661100" strokeWidth="2"/>
        <line x1="76" y1="26" x2="64" y2="30" stroke="#661100" strokeWidth="2"/>
        {/* mouth open/roar */}
        <rect x="50" y="40" width="20" height="8" rx="3" fill="#220000"/>
        <rect x="52" y="41" width="16" height="6" rx="2" fill="#FF0000" opacity="0.5"/>
        <g filter="url(#qb)">
          <circle cx="60" cy="84" r="14" fill="#FF6600" opacity="0.3"/>
          <circle cx="8" cy="42" r="8" fill="#FF6600" opacity="0.4"/>
          <circle cx="112" cy="42" r="8" fill="#FF6600" opacity="0.4"/>
        </g>
      </svg>
    ),

    // 4 – Shadow Protocol: sleek ninja dissolving into shadows with blades
    4: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="sp"><feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* shadow wisps at bottom */}
        <ellipse cx="60" cy="150" rx="36" ry="10" fill="#220044" opacity="0.5"/>
        <ellipse cx="40" cy="145" rx="12" ry="8" fill="#440088" opacity="0.3"/>
        <ellipse cx="80" cy="148" rx="10" ry="7" fill="#440088" opacity="0.3"/>
        {/* shadow blades — multiple dodge arms */}
        <line x1="90" y1="50" x2="118" y2="20" stroke="#CC44FF" strokeWidth="2.5" opacity="0.8"/>
        <line x1="90" y1="55" x2="115" y2="30" stroke="#8822AA" strokeWidth="1.5" opacity="0.5"/>
        <line x1="88" y1="60" x2="112" y2="40" stroke="#8822AA" strokeWidth="1" opacity="0.4"/>
        <line x1="30" y1="50" x2="2" y2="20" stroke="#CC44FF" strokeWidth="2.5" opacity="0.7"/>
        <line x1="30" y1="55" x2="5" y2="30" stroke="#8822AA" strokeWidth="1.5" opacity="0.4"/>
        {/* legs — thin, agile */}
        <rect x="44" y="110" width="12" height="38" rx="3" fill="#110022"/>
        <rect x="64" y="110" width="12" height="38" rx="3" fill="#110022"/>
        <rect x="42" y="136" width="16" height="8" rx="2" fill="#220044"/>
        <rect x="62" y="136" width="16" height="8" rx="2" fill="#220044"/>
        {/* purple leg stripe */}
        <line x1="50" y1="112" x2="50" y2="136" stroke="#CC44FF" strokeWidth="1" opacity="0.6"/>
        <line x1="70" y1="112" x2="70" y2="136" stroke="#CC44FF" strokeWidth="1" opacity="0.6"/>
        {/* torso — slim */}
        <rect x="36" y="62" width="48" height="52" rx="5" fill="#110022"/>
        <rect x="40" y="66" width="40" height="44" rx="4" fill="#220044" opacity="0.7"/>
        {/* chest emblem */}
        <polygon points="60,68 66,76 60,84 54,76" fill="#440088"/>
        <polygon points="60,70 65,76 60,82 55,76" fill="#CC44FF" opacity="0.7"/>
        <circle cx="60" cy="76" r="3" fill="#EE88FF"/>
        {/* belt gadgets */}
        <rect x="40" y="104" width="40" height="6" rx="2" fill="#220044"/>
        <circle cx="52" cy="107" r="2" fill="#CC44FF" opacity="0.7"/>
        <circle cx="60" cy="107" r="2" fill="#CC44FF" opacity="0.7"/>
        <circle cx="68" cy="107" r="2" fill="#CC44FF" opacity="0.7"/>
        {/* arms — raised with blades */}
        <rect x="20" y="62" width="16" height="10" rx="3" fill="#110022" transform="rotate(-30 28 67)"/>
        <rect x="84" y="62" width="16" height="10" rx="3" fill="#110022" transform="rotate(30 92 67)"/>
        {/* neck */}
        <rect x="52" y="52" width="16" height="12" rx="3" fill="#110022"/>
        {/* head — masked */}
        <ellipse cx="60" cy="38" rx="20" ry="22" fill="#110022"/>
        <ellipse cx="60" cy="37" rx="15" ry="17" fill="#220044" opacity="0.7"/>
        {/* visor — purple slit */}
        <rect x="42" y="34" width="36" height="8" rx="3" fill="#110011"/>
        <rect x="44" y="35" width="32" height="6" rx="2" fill="#CC44FF" opacity="0.4"/>
        <line x1="44" y1="38" x2="76" y2="38" stroke="#EE88FF" strokeWidth="1.5" opacity="0.9"/>
        {/* hood shadow */}
        <path d="M42 28 Q60 18 78 28 L76 32 Q60 22 44 32 Z" fill="#220044" opacity="0.5"/>
        <g filter="url(#sp)">
          <line x1="44" y1="38" x2="76" y2="38" stroke="#EE88FF" strokeWidth="2" opacity="0.5"/>
          <line x1="90" y1="50" x2="118" y2="20" stroke="#CC44FF" strokeWidth="3" opacity="0.3"/>
          <line x1="30" y1="50" x2="2" y2="20" stroke="#CC44FF" strokeWidth="3" opacity="0.3"/>
        </g>
      </svg>
    ),

    // 5 – Void Predator: serpentine dragon from the void
    5: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="vp"><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* void energy bg */}
        <ellipse cx="60" cy="100" rx="55" ry="55" fill="#00220020"/>
        {/* tail */}
        <path d="M30 150 Q50 140 55 120 Q58 110 60 100" fill="none" stroke="#004422" strokeWidth="14" strokeLinecap="round"/>
        <path d="M30 150 Q50 140 55 120 Q58 110 60 100" fill="none" stroke="#00AA44" strokeWidth="8" strokeLinecap="round" opacity="0.7"/>
        {/* body coil */}
        <ellipse cx="60" cy="105" rx="30" ry="20" fill="#003322" opacity="0.8"/>
        <ellipse cx="60" cy="105" rx="24" ry="15" fill="#005533" opacity="0.6"/>
        {/* spine ridge on body */}
        <path d="M30 100 Q60 88 90 100" fill="none" stroke="#00FF88" strokeWidth="2" opacity="0.6"/>
        <circle cx="40" cy="95" r="2" fill="#00FF88" opacity="0.8"/>
        <circle cx="55" cy="91" r="2" fill="#00FF88" opacity="0.8"/>
        <circle cx="70" cy="91" r="2" fill="#00FF88" opacity="0.8"/>
        <circle cx="85" cy="95" r="2" fill="#00FF88" opacity="0.8"/>
        {/* wings */}
        <path d="M30 80 Q6 60 10 40 Q18 30 26 50 Q32 70 40 80" fill="#002211" opacity="0.8"/>
        <path d="M30 80 Q6 60 10 40 Q18 30 26 50 Q32 70 40 80" fill="none" stroke="#00AA44" strokeWidth="1.5" opacity="0.6"/>
        <path d="M90 80 Q114 60 110 40 Q102 30 94 50 Q88 70 80 80" fill="#002211" opacity="0.8"/>
        <path d="M90 80 Q114 60 110 40 Q102 30 94 50 Q88 70 80 80" fill="none" stroke="#00AA44" strokeWidth="1.5" opacity="0.6"/>
        {/* wing membrane details */}
        <line x1="26" y1="50" x2="18" y2="70" stroke="#00AA44" strokeWidth="1" opacity="0.4"/>
        <line x1="94" y1="50" x2="102" y2="70" stroke="#00AA44" strokeWidth="1" opacity="0.4"/>
        {/* neck */}
        <path d="M44 80 Q50 60 52 40" fill="none" stroke="#004422" strokeWidth="18" strokeLinecap="round"/>
        <path d="M44 80 Q50 60 52 40" fill="none" stroke="#006633" strokeWidth="12" strokeLinecap="round" opacity="0.8"/>
        {/* head */}
        <ellipse cx="56" cy="30" rx="22" ry="16" fill="#003322"/>
        <ellipse cx="58" cy="29" rx="18" ry="13" fill="#005533" opacity="0.8"/>
        {/* horns */}
        <polygon points="46,20 38,6 48,18" fill="#004422"/>
        <polygon points="66,20 74,6 64,18" fill="#004422"/>
        <line x1="42" y1="13" x2="38" y2="7" stroke="#00FF88" strokeWidth="1" opacity="0.7"/>
        <line x1="70" y1="13" x2="74" y2="7" stroke="#00FF88" strokeWidth="1" opacity="0.7"/>
        {/* eyes — glowing void */}
        <ellipse cx="48" cy="28" rx="6" ry="5" fill="#001100"/>
        <ellipse cx="66" cy="28" rx="6" ry="5" fill="#001100"/>
        <ellipse cx="48" cy="28" rx="4" ry="3.5" fill="#00FF88" opacity="0.9"/>
        <ellipse cx="66" cy="28" rx="4" ry="3.5" fill="#00FF88" opacity="0.9"/>
        <ellipse cx="48" cy="28" rx="2" ry="2" fill="#AAFFCC"/>
        <ellipse cx="66" cy="28" rx="2" ry="2" fill="#AAFFCC"/>
        {/* mouth/maw */}
        <path d="M44 35 Q58 42 72 35" fill="none" stroke="#00AA44" strokeWidth="2" opacity="0.8"/>
        {/* fangs */}
        <polygon points="50,36 48,42 52,36" fill="#AAFFCC" opacity="0.8"/>
        <polygon points="64,36 62,42 66,36" fill="#AAFFCC" opacity="0.8"/>
        {/* void breath */}
        <path d="M72 34 Q88 26 100 18" fill="none" stroke="#00FF88" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <circle cx="100" cy="18" r="4" fill="#00FF88" opacity="0.5"/>
        <g filter="url(#vp)">
          <ellipse cx="48" cy="28" rx="5" ry="4" fill="#00FF88" opacity="0.4"/>
          <ellipse cx="66" cy="28" rx="5" ry="4" fill="#00FF88" opacity="0.4"/>
          <path d="M72 34 Q88 26 100 18" fill="none" stroke="#00FF88" strokeWidth="5" opacity="0.2"/>
        </g>
      </svg>
    ),

    // 6 – The Architect: floating brain with mechanical tentacle arms
    6: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="ta"><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* hover glow below */}
        <ellipse cx="60" cy="154" rx="32" ry="6" fill="#00FFFF20"/>
        {/* tentacle arms */}
        <path d="M30 90 Q14 110 8 135" fill="none" stroke="#006688" strokeWidth="6" strokeLinecap="round"/>
        <path d="M30 90 Q14 110 8 135" fill="none" stroke="#00AACC" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <circle cx="8" cy="135" r="5" fill="#00CCFF" opacity="0.8"/>
        <path d="M90 90 Q106 110 112 135" fill="none" stroke="#006688" strokeWidth="6" strokeLinecap="round"/>
        <path d="M90 90 Q106 110 112 135" fill="none" stroke="#00AACC" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <circle cx="112" cy="135" r="5" fill="#00CCFF" opacity="0.8"/>
        <path d="M26 80 Q10 75 4 60" fill="none" stroke="#006688" strokeWidth="5" strokeLinecap="round"/>
        <path d="M26 80 Q10 75 4 60" fill="none" stroke="#00AACC" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
        <circle cx="4" cy="60" r="4" fill="#00CCFF" opacity="0.7"/>
        <path d="M94 80 Q110 75 116 60" fill="none" stroke="#006688" strokeWidth="5" strokeLinecap="round"/>
        <path d="M94 80 Q110 75 116 60" fill="none" stroke="#00AACC" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
        <circle cx="116" cy="60" r="4" fill="#00CCFF" opacity="0.7"/>
        {/* central body / exo-frame */}
        <ellipse cx="60" cy="100" rx="30" ry="22" fill="#002233" opacity="0.9"/>
        <ellipse cx="60" cy="100" rx="24" ry="17" fill="#003344" opacity="0.7"/>
        {/* circuit nodes */}
        <circle cx="44" cy="96" r="3" fill="#00AACC"/>
        <circle cx="76" cy="96" r="3" fill="#00AACC"/>
        <circle cx="60" cy="88" r="3" fill="#00AACC"/>
        <circle cx="60" cy="112" r="3" fill="#00AACC"/>
        <line x1="44" y1="96" x2="60" y2="88" stroke="#00AACC" strokeWidth="1" opacity="0.6"/>
        <line x1="76" y1="96" x2="60" y2="88" stroke="#00AACC" strokeWidth="1" opacity="0.6"/>
        <line x1="44" y1="96" x2="60" y2="112" stroke="#00AACC" strokeWidth="1" opacity="0.6"/>
        <line x1="76" y1="96" x2="60" y2="112" stroke="#00AACC" strokeWidth="1" opacity="0.6"/>
        {/* brain pod */}
        <ellipse cx="60" cy="52" rx="34" ry="36" fill="#002233"/>
        <ellipse cx="60" cy="50" rx="30" ry="32" fill="#003344" opacity="0.9"/>
        {/* brain surface folds */}
        <path d="M32 50 Q38 38 50 42 Q60 46 70 42 Q82 38 88 50" fill="none" stroke="#00AACC" strokeWidth="1.5" opacity="0.6"/>
        <path d="M32 58 Q40 50 52 54 Q60 58 68 54 Q80 50 88 58" fill="none" stroke="#00AACC" strokeWidth="1.5" opacity="0.5"/>
        <path d="M36 44 Q40 32 52 36 Q60 40 68 36 Q80 32 84 44" fill="none" stroke="#00CCFF" strokeWidth="1" opacity="0.4"/>
        {/* central eye / main sensor */}
        <circle cx="60" cy="52" r="12" fill="#001122"/>
        <circle cx="60" cy="52" r="10" fill="#004466" opacity="0.8"/>
        <circle cx="60" cy="52" r="7" fill="#00AACC" opacity="0.8"/>
        <circle cx="60" cy="52" r="4" fill="#00FFFF"/>
        <circle cx="60" cy="52" r="2" fill="white"/>
        {/* scanning ring */}
        <circle cx="60" cy="52" r="14" fill="none" stroke="#00FFFF" strokeWidth="1.5" opacity="0.5" strokeDasharray="4,3"/>
        {/* glass dome reflection */}
        <ellipse cx="48" cy="30" rx="8" ry="5" fill="white" opacity="0.06" transform="rotate(-20 48 30)"/>
        <g filter="url(#ta)">
          <circle cx="60" cy="52" r="8" fill="#00FFFF" opacity="0.3"/>
          <circle cx="8" cy="135" r="6" fill="#00CCFF" opacity="0.3"/>
          <circle cx="112" cy="135" r="6" fill="#00CCFF" opacity="0.3"/>
        </g>
      </svg>
    ),

    // 7 – Omega Unit ZERO: colossal mech — all systems online
    7: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="ou"><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* power aura */}
        <ellipse cx="60" cy="100" rx="58" ry="60" fill="#FFCC0008"/>
        {/* legs — massive */}
        <rect x="30" y="108" width="24" height="42" rx="6" fill="#222200"/>
        <rect x="66" y="108" width="24" height="42" rx="6" fill="#222200"/>
        <rect x="28" y="138" width="28" height="10" rx="5" fill="#111100"/>
        <rect x="64" y="138" width="28" height="10" rx="5" fill="#111100"/>
        {/* leg power cells */}
        <rect x="32" y="112" width="8" height="24" rx="2" fill="#FFAA00" opacity="0.3"/>
        <rect x="80" y="112" width="8" height="24" rx="2" fill="#FFAA00" opacity="0.3"/>
        {/* waist */}
        <rect x="28" y="98" width="64" height="14" rx="5" fill="#333300"/>
        <rect x="32" y="100" width="56" height="10" rx="3" fill="#444400" opacity="0.7"/>
        {/* torso — huge golden */}
        <rect x="16" y="44" width="88" height="58" rx="10" fill="#554400"/>
        <rect x="20" y="48" width="80" height="50" rx="8" fill="#665500" opacity="0.8"/>
        {/* power conduits on torso */}
        <rect x="20" y="52" width="6" height="38" rx="2" fill="#FFAA00" opacity="0.4"/>
        <rect x="94" y="52" width="6" height="38" rx="2" fill="#FFAA00" opacity="0.4"/>
        {/* chest — tri-reactor */}
        <circle cx="44" cy="70" r="10" fill="#221100"/>
        <circle cx="44" cy="70" r="8" fill="#FF6600" opacity="0.8"/>
        <circle cx="44" cy="70" r="5" fill="#FFCC00"/>
        <circle cx="44" cy="70" r="2.5" fill="white"/>
        <circle cx="76" cy="70" r="10" fill="#221100"/>
        <circle cx="76" cy="70" r="8" fill="#FF6600" opacity="0.8"/>
        <circle cx="76" cy="70" r="5" fill="#FFCC00"/>
        <circle cx="76" cy="70" r="2.5" fill="white"/>
        <circle cx="60" cy="86" r="10" fill="#221100"/>
        <circle cx="60" cy="86" r="8" fill="#FF4400" opacity="0.9"/>
        <circle cx="60" cy="86" r="5" fill="#FF8800"/>
        <circle cx="60" cy="86" r="2.5" fill="#FFDD00"/>
        {/* massive shoulder weapon systems */}
        <rect x="0" y="44" width="18" height="28" rx="5" fill="#333300"/>
        <rect x="2" y="46" width="14" height="24" rx="4" fill="#444400" opacity="0.7"/>
        <rect x="0" y="52" width="22" height="8" rx="3" fill="#222200"/>
        <rect x="0" y="54" width="20" height="4" rx="2" fill="#FFCC00" opacity="0.5"/>
        <rect x="102" y="44" width="18" height="28" rx="5" fill="#333300"/>
        <rect x="104" y="46" width="14" height="24" rx="4" fill="#444400" opacity="0.7"/>
        <rect x="98" y="52" width="22" height="8" rx="3" fill="#222200"/>
        <rect x="100" y="54" width="20" height="4" rx="2" fill="#FFCC00" opacity="0.5"/>
        {/* extra weapon arms */}
        <rect x="4" y="76" width="14" height="6" rx="2" fill="#222200"/>
        <circle cx="2" cy="79" r="3" fill="#FF4400" opacity="0.7"/>
        <rect x="102" y="76" width="14" height="6" rx="2" fill="#222200"/>
        <circle cx="118" cy="79" r="3" fill="#FF4400" opacity="0.7"/>
        {/* neck */}
        <rect x="44" y="34" width="32" height="14" rx="5" fill="#443300"/>
        {/* head — imposing */}
        <rect x="26" y="8" width="68" height="30" rx="8" fill="#554400"/>
        <rect x="30" y="12" width="60" height="22" rx="6" fill="#443300" opacity="0.8"/>
        {/* visor — full golden band */}
        <rect x="30" y="18" width="60" height="10" rx="4" fill="#110800"/>
        <rect x="32" y="19" width="56" height="8" rx="3" fill="#FFAA00" opacity="0.4"/>
        <line x1="32" y1="23" x2="88" y2="23" stroke="#FFDD00" strokeWidth="2.5" opacity="0.9"/>
        {/* secondary eye sensors */}
        <circle cx="36" cy="14" r="3" fill="#FFAA00" opacity="0.6"/>
        <circle cx="84" cy="14" r="3" fill="#FFAA00" opacity="0.6"/>
        {/* crown antennae */}
        <line x1="50" y1="8" x2="46" y2="2" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round"/>
        <line x1="60" y1="8" x2="60" y2="1" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round"/>
        <line x1="70" y1="8" x2="74" y2="2" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="46" cy="2" r="2" fill="#FFDD00"/>
        <circle cx="60" cy="1" r="2" fill="#FFDD00"/>
        <circle cx="74" cy="2" r="2" fill="#FFDD00"/>
        <g filter="url(#ou)">
          <line x1="32" y1="23" x2="88" y2="23" stroke="#FFDD00" strokeWidth="3" opacity="0.5"/>
          <circle cx="44" cy="70" r="11" fill="#FFCC00" opacity="0.2"/>
          <circle cx="76" cy="70" r="11" fill="#FFCC00" opacity="0.2"/>
          <circle cx="60" cy="86" r="11" fill="#FF8800" opacity="0.2"/>
        </g>
      </svg>
    ),
  };

  return icons[id] ?? icons[0];
}

// ── Boss Select View (one boss at a time) ────────────────────────────────────

function SelectView() {
  const challengeUnlocked  = useGameStore(s => s.challengeUnlocked);
  const lastChallengeAt    = useGameStore(s => s.lastChallengeAt);
  const startChallengeFight = useGameStore(s => s.startChallengeFight);

  const cooldownLeft = useCooldown(lastChallengeAt);

  const allDefeated = challengeUnlocked >= CHALLENGE_BOSSES.length;
  const boss        = allDefeated ? null : CHALLENGE_BOSSES[challengeUnlocked];
  const bossIdx     = challengeUnlocked;

  const accentColor = '#ff9900';

  // All bosses defeated screen
  if (allDefeated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '20px 0' }}>
        <p style={{ fontSize: 56 }}>🏆</p>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ffd700', textShadow: '0 0 20px #ffd700', textAlign: 'center' }}>
          WSZYSCY BOSSOWIE POKONANI
        </p>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', textAlign: 'center' }}>
          Jesteś legendą Neon-Warszawy.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Progress header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 9, color: accentColor, textShadow: `0 0 10px ${accentColor}80` }}>
          ⚡ WYZWANIE BOSSU
        </p>
        <span style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', padding: '2px 8px' }}>
          {bossIdx}/{CHALLENGE_BOSSES.length} 💀
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,153,0,0.2)', height: 6, borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${(bossIdx / CHALLENGE_BOSSES.length) * 100}%`,
          background: 'linear-gradient(90deg, #cc5500, #ff9900)',
          boxShadow: '0 0 8px rgba(255,153,0,0.5)',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Boss art card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,8,2,0.97), rgba(12,5,1,0.99))',
        border: `1px solid ${accentColor}44`,
        padding: 16,
        boxShadow: `0 0 30px ${accentColor}12, inset 0 2px 12px rgba(0,0,0,0.6)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        {/* Boss SVG portrait */}
        <div style={{
          position: 'relative',
          padding: 8,
          background: 'radial-gradient(circle, rgba(255,153,0,0.08) 0%, transparent 70%)',
          border: `1px solid ${accentColor}22`,
        }}>
          <BossSvg id={bossIdx} size={220} />
          {/* level badge */}
          <div style={{
            position: 'absolute', top: 10, right: 10,
            ...MONO, fontSize: 8, color: accentColor,
            background: 'rgba(0,0,0,0.8)', border: `1px solid ${accentColor}55`,
            padding: '2px 6px',
          }}>
            POZ. {boss!.level}
          </div>
        </div>

        {/* Boss name */}
        <p style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 11,
          color: accentColor, textShadow: `0 0 16px ${accentColor}`,
          textAlign: 'center', letterSpacing: '0.06em',
        }}>
          {boss!.name}
        </p>

        {/* Description */}
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
          {boss!.description}
        </p>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', padding: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginBottom: 3 }}>❤ HP</p>
            <p style={{ ...ORB, fontSize: 11, color: '#ff4444' }}>{boss!.maxHp.toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginBottom: 3 }}>⚔ ATK</p>
            <p style={{ ...ORB, fontSize: 11, color: '#ff8800' }}>{boss!.attack}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginBottom: 3 }}>🛡 DEF</p>
            <p style={{ ...ORB, fontSize: 11, color: '#4488ff' }}>{boss!.defense}</p>
          </div>
        </div>

        {/* Powers */}
        <div style={{ width: '100%' }}>
          <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginBottom: 6 }}>MOCE BOSSA</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {boss!.powers.map(p => (
              <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <PowerBadge power={p} />
                <span style={{ ...MONO, fontSize: 6, color: 'var(--text-muted)' }}>
                  {POWER_INFO[p].desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div style={{ display: 'flex', gap: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.15)', padding: '8px 16px', width: '100%', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginBottom: 2 }}>XP</p>
            <p style={{ ...ORB, fontSize: 10, color: '#00f5ff' }}>+{boss!.xpReward.toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginBottom: 2 }}>ZŁOTO</p>
            <p style={{ ...ORB, fontSize: 10, color: '#ffd700' }}>+{boss!.goldReward.toLocaleString()} 🪙</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 8, color: 'var(--text-muted)', marginBottom: 2 }}>DROP</p>
            <p style={{ ...ORB, fontSize: 10, color: '#cc44ff' }}>{bossIdx >= 5 ? '3×✨' : bossIdx >= 2 ? '2×🟪' : '1×🟪'}</p>
          </div>
        </div>
      </div>

      {/* Min level warning */}
      {boss!.minLevel > 0 && (
        <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', textAlign: 'center' }}>
          Min. poziom do walki: <span style={{ color: accentColor }}>{boss!.minLevel}</span>
        </p>
      )}

      {/* Cooldown / fight button */}
      {cooldownLeft > 0 ? (
        <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.25)' }}>
          <p style={{ ...MONO, fontSize: 9, color: '#ff4444', marginBottom: 4 }}>⏱ COOLDOWN</p>
          <p style={{ ...ORB, fontSize: 16, color: '#ff4444', textShadow: '0 0 10px rgba(255,68,68,0.5)' }}>
            {fmtMs(cooldownLeft)}
          </p>
        </div>
      ) : (
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: 11, letterSpacing: '0.1em',
            boxShadow: `0 0 20px ${accentColor}30` }}
          onClick={() => startChallengeFight(bossIdx)}
        >
          ⚡ WALCZ Z {boss!.name.toUpperCase()}
        </button>
      )}
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
