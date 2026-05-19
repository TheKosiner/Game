import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, CHALLENGE_COOLDOWN } from '../store/gameStore';
import { CHALLENGE_BOSSES } from '../data/challengeBosses';
import type { ChallengePower } from '../types';
import { useT } from '../hooks/useT';
import type { Translations } from '../i18n/en';
import { useLangStore } from '../store/langStore';
import { getItemName } from '../data/itemGenerator';
import cyberGladiatorImg from '../assets/bosses/cyber-gladiator.png';
import neonSlayerImg from '../assets/bosses/neon-slayer.png';
import neuralPhantomImg from '../assets/bosses/neural-phantom.png';
import ironWarlordImg from '../assets/bosses/iron-warlord.png';
import quantumBerserkerImg from '../assets/bosses/quantum-berserker.png';
import { MONO, ORB } from '../utils/styles';

function getPowerInfo(t: Translations): Record<ChallengePower, { label: string; color: string; emoji: string; desc: string }> {
  return {
    regen:         { label: t.challenge.regenLabel,      color: '#ff4444', emoji: '🔴', desc: t.challenge.regenDesc },
    double_strike: { label: t.challenge.doubleLabel,     color: '#ff9900', emoji: '⚡', desc: t.challenge.doubleDesc },
    armor_break:   { label: t.challenge.armorBreakLabel, color: '#cc44ff', emoji: '💥', desc: t.challenge.armorBreakDesc },
    dodge:         { label: t.challenge.dodgeLabel,      color: '#00f5ff', emoji: '💨', desc: t.challenge.dodgeDesc },
    rage:          { label: t.challenge.furyLabel,       color: '#ff6600', emoji: '🔥', desc: t.challenge.furyDesc },
    shield:        { label: t.challenge.shieldLabel,     color: '#4488ff', emoji: '🛡', desc: t.challenge.shieldDesc },
    lifesteal:     { label: t.challenge.vampLabel,       color: '#cc0066', emoji: '💉', desc: t.challenge.vampDesc },
    poison:        { label: t.challenge.poisonLabel,     color: '#44cc44', emoji: '🟢', desc: t.challenge.poisonDesc },
  };
}

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
  const t = useT();
  const info = getPowerInfo(t)[power];
  return (
    <span title={info.desc} style={{
      ...MONO, fontSize: 10,
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
  const t                 = useT();
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

          {/* Boss portrait with shake animation */}
          <div
            key={bossAnimKey}
            style={{
              flexShrink: 0,
              animation: bossAnimKey > 0 ? 'bossShake 0.4s ease' : 'none',
              position: 'relative',
              width: 80, height: 80,
              overflow: 'hidden',
            }}
          >
            <div
              key={bossHitKey}
              style={{ animation: bossHitKey > 0 ? 'bossHit 0.35s ease' : 'none', width: '100%', height: '100%' }}
            >
              <BossSvg id={fight.bossIdx} size={80} />
            </div>

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
              <p style={{ ...ORB, fontSize: 10, color: fight.rageActive ? '#ff6600' : '#c05050' }}>{boss.name}</p>
              {fight.rageActive && (
                <span style={{ ...MONO, fontSize: 10, color: '#ff6600', background: 'rgba(255,102,0,0.2)', border: '1px solid rgba(255,102,0,0.6)', padding: '1px 4px' }}>
                  {t.challenge.furyActive}
                </span>
              )}
            </div>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>
              {t.challenge.roundInfo(boss.level, fight.round)}
            </p>
            <p style={{ ...MONO, fontSize: 10, color: bossHpColor }}>
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
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{hero.name}</span>
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{hero.hp} / {hero.maxHp} HP</span>
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
          style={{ flex: 2, fontSize: 10, padding: '10px' }}
          onClick={() => { setAutoFight(false); attackChallengeBoss(); }}
        >
          {t.challenge.attack}
        </button>
        <button
          className={autoFight ? 'btn btn-danger' : 'btn btn-secondary'}
          style={{ flex: 2, fontSize: 10, padding: '10px' }}
          onClick={() => setAutoFight(v => !v)}
        >
          {autoFight ? t.challenge.stop : t.challenge.auto}
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: 10, padding: '10px 6px', color: 'var(--text-muted)' }}
          onClick={() => { setAutoFight(false); fleeChallengeFight(); }}
        >
          {t.challenge.flee}
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
            line.includes('🏆') || line.includes('ZWYCIĘSTWO') || line.includes('VICTORY') ? '#ffd700' :
            line.includes('💀') || line.includes('KLĘSKA') || line.includes('DEFEAT') ? '#ff4444' :
            line.includes('🔴') || line.includes('REGEN') ? '#ff4444' :
            line.includes('🔥') || line.includes('FURIA') || line.includes('FURY') ? '#ff6600' :
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
            <p key={i} style={{ ...MONO, fontSize: 10, color, lineHeight: 1.7, marginBottom: 0 }}>
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

function ResultView({ onDismiss }: { onDismiss: () => void }) {
  const t    = useT();
  const lang = useLangStore(s => s.lang);
  const result = useGameStore(s => s.challengeResult)!;
  const boss = CHALLENGE_BOSSES[result.bossIdx];
  const [showLog, setShowLog] = useState(false);

  const rarityLabel: Record<string, string> = {
    common: t.equipment.rarityCommon, uncommon: t.equipment.rarityUncommon,
    rare: t.equipment.rarityRare, epic: t.equipment.rarityEpic, legendary: t.equipment.rarityLegendary,
  };
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
          {won ? t.challenge.victory : t.challenge.defeat}
        </p>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>
          {boss.emoji} {boss.name}
        </p>
      </div>

      {/* Rewards */}
      <div style={{
        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
        padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <p style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{t.challenge.rewards}</p>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{t.challenge.experience}</p>
            <p style={{ ...ORB, fontSize: 13, color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>
              +{won ? boss.xpReward.toLocaleString() : Math.floor(boss.xpReward * 0.1).toLocaleString()}
            </p>
          </div>
          {won && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{t.challenge.gold}</p>
              <p style={{ ...ORB, fontSize: 13, color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
                +{boss.goldReward.toLocaleString()} 🪙
              </p>
            </div>
          )}
        </div>

        {/* Loot */}
        {won && result.loot.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            <p style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)' }}>{t.challenge.items}</p>
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
                      {getItemName(item, lang)}
                    </p>
                    <p style={{ ...MONO, fontSize: 10, color: `${rc}99` }}>
                      {rarityLabel[item.rarity]} · Poz. {item.level}
                    </p>
                  </div>
                  <span style={{ ...MONO, fontSize: 10, color: rc, background: `${rc}18`, border: `1px solid ${rc}44`, padding: '2px 6px' }}>
                    {rarityLabel[item.rarity]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!won && (
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', textAlign: 'center' }}>
            {t.challenge.cooldown}
          </p>
        )}
      </div>

      {/* Combat log toggle */}
      <button
        onClick={() => setShowLog(v => !v)}
        style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', cursor: 'pointer', width: '100%' }}
      >
        {showLog ? t.challenge.hideLog : t.challenge.showLog}
      </button>

      {showLog && (
        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)', padding: 8, maxHeight: 200, overflowY: 'auto' }}>
          {result.log.map((line, i) => (
            <p key={i} style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.6 }}>{line}</p>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '12px', fontSize: 10 }}
        onClick={onDismiss}
      >
        {t.challenge.back}
      </button>
    </div>
  );
}

// ── Boss SVG Art ────────────────────────────────────────────────────────────

function BossSvg({ id, size = 220 }: { id: number; size?: number }) {
  const icons: Record<number, React.ReactElement> = {

    // 0 – Cyber Gladiator
    0: (
      <img src={cyberGladiatorImg} width={size} height={size} style={{ objectFit: 'cover', display: 'block', imageRendering: 'pixelated' }} alt="Cyber Gladiator" />
    ),

    // 2 – Neural Phantom
    2: (
      <img src={neuralPhantomImg} width={size} height={size} style={{ objectFit: 'cover', display: 'block', imageRendering: 'pixelated' }} alt="Neural Phantom" />
    ),


    // 4 – Iron Warlord
    4: (
      <img src={ironWarlordImg} width={size} height={size} style={{ objectFit: 'cover', display: 'block', imageRendering: 'pixelated' }} alt="Iron Warlord" />
    ),

    // 6 – Quantum Berserker
    6: (
      <img src={quantumBerserkerImg} width={size} height={size} style={{ objectFit: 'cover', display: 'block', imageRendering: 'pixelated' }} alt="Quantum Berserker" />
    ),

    // 8 – Shadow Protocol: sleek ninja dissolving into shadows with blades
    8: (
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

    // 10 – Void Predator: serpentine dragon from the void
    10: (
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

    // 12 – The Architect: floating brain with mechanical tentacle arms
    12: (
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

    // 15 – Omega Unit ZERO: colossal mech — all systems online
    15: (
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

    // 1 – Neon Slayer
    1: (
      <img src={neonSlayerImg} width={size} height={size} style={{ objectFit: 'cover', display: 'block', imageRendering: 'pixelated' }} alt="Neon Slayer" />
    ),

    // 3 – Plague Bot: corroded robot dripping acid/virus
    3: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="pb"><feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        <ellipse cx="60" cy="153" rx="38" ry="6" fill="#22AA0018"/>
        {/* dripping acid */}
        <ellipse cx="44" cy="155" rx="4" ry="7" fill="#44FF00" opacity="0.3"/>
        <ellipse cx="60" cy="157" rx="5" ry="6" fill="#44FF00" opacity="0.4"/>
        <ellipse cx="76" cy="154" rx="3" ry="6" fill="#44FF00" opacity="0.3"/>
        <line x1="44" y1="140" x2="44" y2="155" stroke="#44FF00" strokeWidth="2" opacity="0.5"/>
        <line x1="60" y1="138" x2="60" y2="157" stroke="#44FF00" strokeWidth="2.5" opacity="0.6"/>
        <line x1="76" y1="142" x2="76" y2="154" stroke="#44FF00" strokeWidth="2" opacity="0.4"/>
        {/* legs — corroded */}
        <rect x="36" y="108" width="20" height="38" rx="4" fill="#3A3A22"/>
        <rect x="64" y="108" width="20" height="38" rx="4" fill="#3A3A22"/>
        <rect x="34" y="136" width="24" height="9" rx="3" fill="#2A2A18"/>
        <rect x="62" y="136" width="24" height="9" rx="3" fill="#2A2A18"/>
        {/* rust patches */}
        <rect x="38" y="112" width="6" height="4" rx="1" fill="#88AA00" opacity="0.5"/>
        <rect x="74" y="118" width="5" height="4" rx="1" fill="#88AA00" opacity="0.5"/>
        {/* torso — bulky, corroded */}
        <rect x="26" y="58" width="68" height="54" rx="7" fill="#3A3A22"/>
        <rect x="30" y="62" width="60" height="46" rx="5" fill="#2E3818" opacity="0.9"/>
        {/* bio-hazard symbol on chest */}
        <circle cx="60" cy="82" r="16" fill="#1A2A00"/>
        <circle cx="60" cy="82" r="13" fill="#2A4400" opacity="0.8"/>
        {/* biohazard simplified */}
        <circle cx="60" cy="82" r="4" fill="#44FF00" opacity="0.9"/>
        <circle cx="60" cy="72" r="4" fill="none" stroke="#44FF00" strokeWidth="2" opacity="0.8"/>
        <circle cx="51" cy="87" r="4" fill="none" stroke="#44FF00" strokeWidth="2" opacity="0.8"/>
        <circle cx="69" cy="87" r="4" fill="none" stroke="#44FF00" strokeWidth="2" opacity="0.8"/>
        <line x1="60" y1="78" x2="60" y2="72" stroke="#44FF00" strokeWidth="2" opacity="0.7"/>
        <line x1="56" y1="84" x2="51" y2="87" stroke="#44FF00" strokeWidth="2" opacity="0.7"/>
        <line x1="64" y1="84" x2="69" y2="87" stroke="#44FF00" strokeWidth="2" opacity="0.7"/>
        {/* vents dripping */}
        <rect x="32" y="96" width="8" height="3" rx="1" fill="#1A2A00"/>
        <rect x="44" y="96" width="8" height="3" rx="1" fill="#1A2A00"/>
        <rect x="68" y="96" width="8" height="3" rx="1" fill="#1A2A00"/>
        <rect x="80" y="96" width="8" height="3" rx="1" fill="#1A2A00"/>
        {/* arms — with injector claws */}
        <rect x="8" y="68" width="18" height="10" rx="4" fill="#2E3818"/>
        <rect x="94" y="68" width="18" height="10" rx="4" fill="#2E3818"/>
        {/* injector tips */}
        <polygon points="8,70 4,73 8,76" fill="#44FF00" opacity="0.8"/>
        <polygon points="112,70 116,73 112,76" fill="#44FF00" opacity="0.8"/>
        {/* neck — corroded pipes */}
        <rect x="50" y="46" width="20" height="14" rx="3" fill="#2E3818"/>
        <line x1="54" y1="46" x2="54" y2="58" stroke="#44FF00" strokeWidth="1" opacity="0.4"/>
        <line x1="60" y1="46" x2="60" y2="58" stroke="#44FF00" strokeWidth="1" opacity="0.4"/>
        <line x1="66" y1="46" x2="66" y2="58" stroke="#44FF00" strokeWidth="1" opacity="0.4"/>
        {/* head — cracked dome */}
        <ellipse cx="60" cy="32" rx="24" ry="26" fill="#3A3A22"/>
        <ellipse cx="60" cy="30" rx="19" ry="21" fill="#2E3818" opacity="0.8"/>
        {/* cracked dome cracks */}
        <line x1="50" y1="14" x2="58" y2="28" stroke="#44FF00" strokeWidth="1" opacity="0.6"/>
        <line x1="70" y1="14" x2="62" y2="30" stroke="#44FF00" strokeWidth="1" opacity="0.5"/>
        {/* glowing eyes — toxic green */}
        <ellipse cx="50" cy="30" rx="7" ry="5" fill="#002200"/>
        <ellipse cx="70" cy="30" rx="7" ry="5" fill="#002200"/>
        <ellipse cx="50" cy="30" rx="5" ry="3.5" fill="#44FF00" opacity="0.9"/>
        <ellipse cx="70" cy="30" rx="5" ry="3.5" fill="#44FF00" opacity="0.9"/>
        <ellipse cx="50" cy="30" rx="2.5" ry="1.8" fill="#AAFFAA"/>
        <ellipse cx="70" cy="30" rx="2.5" ry="1.8" fill="#AAFFAA"/>
        <g filter="url(#pb)">
          <ellipse cx="50" cy="30" rx="6" ry="4" fill="#44FF00" opacity="0.35"/>
          <ellipse cx="70" cy="30" rx="6" ry="4" fill="#44FF00" opacity="0.35"/>
          <circle cx="60" cy="82" r="16" fill="#44FF00" opacity="0.1"/>
        </g>
      </svg>
    ),

    // 5 – Storm Mech: mech with electric arcs between arms
    5: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="sm"><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        <ellipse cx="60" cy="152" rx="40" ry="7" fill="#FFEE0018"/>
        {/* lightning arcs between hands */}
        <path d="M12 72 Q30 55 46 72 Q60 88 74 72 Q90 55 108 72" fill="none" stroke="#FFEE00" strokeWidth="2.5" opacity="0.9"/>
        <path d="M14 76 Q32 62 48 76 Q60 88 72 76 Q88 62 106 76" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.6"/>
        {/* energy spheres at hands */}
        <circle cx="10" cy="72" r="8" fill="#221100"/>
        <circle cx="10" cy="72" r="6" fill="#FFAA00" opacity="0.8"/>
        <circle cx="10" cy="72" r="3.5" fill="#FFEE00"/>
        <circle cx="110" cy="72" r="8" fill="#221100"/>
        <circle cx="110" cy="72" r="6" fill="#FFAA00" opacity="0.8"/>
        <circle cx="110" cy="72" r="3.5" fill="#FFEE00"/>
        {/* legs */}
        <rect x="34" y="110" width="20" height="38" rx="5" fill="#333322"/>
        <rect x="66" y="110" width="20" height="38" rx="5" fill="#333322"/>
        <rect x="32" y="136" width="24" height="10" rx="4" fill="#222211"/>
        <rect x="64" y="136" width="24" height="10" rx="4" fill="#222211"/>
        <rect x="36" y="114" width="6" height="20" rx="2" fill="#FFAA00" opacity="0.25"/>
        <rect x="78" y="114" width="6" height="20" rx="2" fill="#FFAA00" opacity="0.25"/>
        {/* waist */}
        <rect x="32" y="100" width="56" height="14" rx="4" fill="#333322"/>
        {/* torso */}
        <rect x="22" y="52" width="76" height="52" rx="8" fill="#333322"/>
        <rect x="26" y="56" width="68" height="44" rx="6" fill="#2A2A18" opacity="0.8"/>
        {/* chest power core */}
        <circle cx="60" cy="76" r="14" fill="#181800"/>
        <circle cx="60" cy="76" r="12" fill="#554400" opacity="0.8"/>
        <circle cx="60" cy="76" r="8" fill="#FFAA00"/>
        <circle cx="60" cy="76" r="5" fill="#FFEE00"/>
        <circle cx="60" cy="76" r="2.5" fill="white"/>
        {/* electric sparks on chest */}
        <line x1="56" y1="64" x2="52" y2="58" stroke="#FFEE00" strokeWidth="1.5" opacity="0.8"/>
        <line x1="64" y1="64" x2="68" y2="58" stroke="#FFEE00" strokeWidth="1.5" opacity="0.8"/>
        <line x1="72" y1="76" x2="78" y2="72" stroke="#FFEE00" strokeWidth="1.5" opacity="0.7"/>
        <line x1="48" y1="76" x2="42" y2="72" stroke="#FFEE00" strokeWidth="1.5" opacity="0.7"/>
        {/* shoulder pads */}
        <rect x="4" y="52" width="20" height="36" rx="5" fill="#333322"/>
        <rect x="96" y="52" width="20" height="36" rx="5" fill="#333322"/>
        <rect x="6" y="54" width="16" height="32" rx="4" fill="#2A2A18" opacity="0.6"/>
        <rect x="98" y="54" width="16" height="32" rx="4" fill="#2A2A18" opacity="0.6"/>
        {/* neck */}
        <rect x="46" y="42" width="28" height="14" rx="4" fill="#333322"/>
        {/* head */}
        <rect x="28" y="14" width="64" height="32" rx="8" fill="#333322"/>
        <rect x="32" y="18" width="56" height="24" rx="6" fill="#2A2A18"/>
        {/* visor — yellow electric */}
        <rect x="32" y="24" width="56" height="10" rx="3" fill="#110A00"/>
        <rect x="34" y="25" width="52" height="8" rx="2" fill="#FFAA00" opacity="0.35"/>
        <line x1="34" y1="29" x2="86" y2="29" stroke="#FFEE00" strokeWidth="2" opacity="0.95"/>
        {/* lightning bolt on forehead */}
        <polygon points="62,16 56,24 61,24 58,32 66,22 61,22" fill="#FFEE00" opacity="0.8"/>
        <g filter="url(#sm)">
          <circle cx="10" cy="72" r="8" fill="#FFEE00" opacity="0.3"/>
          <circle cx="110" cy="72" r="8" fill="#FFEE00" opacity="0.3"/>
          <path d="M12 72 Q30 55 46 72 Q60 88 74 72 Q90 55 108 72" fill="none" stroke="#FFEE00" strokeWidth="4" opacity="0.2"/>
          <circle cx="60" cy="76" r="15" fill="#FFEE00" opacity="0.2"/>
        </g>
      </svg>
    ),

    // 7 – Virus Entity: glitching digital form with corruption
    7: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="ve"><feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* glitch bg rectangles */}
        <rect x="20" y="60" width="80" height="4" rx="0" fill="#FF0044" opacity="0.15"/>
        <rect x="10" y="90" width="100" height="3" rx="0" fill="#FF0044" opacity="0.1"/>
        <rect x="30" y="120" width="60" height="4" rx="0" fill="#FF0044" opacity="0.12"/>
        {/* body — glitching humanoid */}
        <rect x="36" y="62" width="48" height="56" rx="5" fill="#220011"/>
        {/* glitch slices */}
        <rect x="40" y="68" width="40" height="6" rx="0" fill="#440022" opacity="0.9"/>
        <rect x="44" y="75" width="32" height="5" rx="0" fill="#330011" opacity="0.9"/>
        <rect x="38" y="82" width="44" height="7" rx="0" fill="#440022" opacity="0.9"/>
        <rect x="42" y="90" width="36" height="5" rx="0" fill="#330011" opacity="0.9"/>
        <rect x="36" y="97" width="48" height="6" rx="0" fill="#440022" opacity="0.9"/>
        <rect x="40" y="104" width="40" height="7" rx="0" fill="#330011" opacity="0.9"/>
        {/* glitch color offsets */}
        <rect x="52" y="74" width="20" height="3" rx="0" fill="#FF0044" opacity="0.5"/>
        <rect x="44" y="89" width="28" height="2" rx="0" fill="#FF0044" opacity="0.4"/>
        <rect x="48" y="103" width="16" height="3" rx="0" fill="#00FFAA" opacity="0.3"/>
        {/* chest red core */}
        <circle cx="60" cy="85" r="10" fill="#440000"/>
        <circle cx="60" cy="85" r="8" fill="#CC0033" opacity="0.9"/>
        <circle cx="60" cy="85" r="5" fill="#FF0044"/>
        <circle cx="60" cy="85" r="2.5" fill="#FF88AA"/>
        {/* arms — glitching */}
        <rect x="16" y="64" width="20" height="8" rx="3" fill="#220011"/>
        <rect x="84" y="64" width="20" height="8" rx="3" fill="#220011"/>
        {/* glitch arm offsets */}
        <rect x="17" y="65" width="6" height="6" rx="0" fill="#FF0044" opacity="0.4"/>
        <rect x="97" y="65" width="6" height="6" rx="0" fill="#00FFAA" opacity="0.3"/>
        {/* hands — spike clusters */}
        <polygon points="12,62 8,68 12,74 16,68" fill="#CC0033" opacity="0.8"/>
        <polygon points="108,62 112,68 108,74 104,68" fill="#CC0033" opacity="0.8"/>
        {/* legs — glitch blocks */}
        <rect x="38" y="118" width="18" height="34" rx="3" fill="#220011"/>
        <rect x="64" y="118" width="18" height="34" rx="3" fill="#220011"/>
        <rect x="39" y="122" width="7" height="4" rx="0" fill="#FF0044" opacity="0.4"/>
        <rect x="74" y="130" width="5" height="4" rx="0" fill="#00FFAA" opacity="0.3"/>
        <rect x="36" y="144" width="22" height="7" rx="2" fill="#330011"/>
        <rect x="62" y="144" width="22" height="7" rx="2" fill="#330011"/>
        {/* neck */}
        <rect x="52" y="50" width="16" height="14" rx="3" fill="#220011"/>
        {/* head — glitch box */}
        <rect x="34" y="16" width="52" height="38" rx="6" fill="#220011"/>
        {/* glitch head slices */}
        <rect x="36" y="20" width="48" height="5" rx="0" fill="#330011" opacity="0.9"/>
        <rect x="38" y="27" width="44" height="6" rx="0" fill="#2A0011" opacity="0.9"/>
        <rect x="34" y="35" width="52" height="5" rx="0" fill="#330011" opacity="0.9"/>
        <rect x="36" y="42" width="48" height="7" rx="0" fill="#2A0011" opacity="0.9"/>
        {/* eyes — red glow */}
        <rect x="40" y="26" width="14" height="8" rx="2" fill="#110000"/>
        <rect x="66" y="26" width="14" height="8" rx="2" fill="#110000"/>
        <rect x="41" y="27" width="12" height="6" rx="1" fill="#FF0044" opacity="0.9"/>
        <rect x="67" y="27" width="12" height="6" rx="1" fill="#FF0044" opacity="0.9"/>
        <rect x="44" y="28" width="6" height="4" rx="0" fill="#FF88AA"/>
        <rect x="70" y="28" width="6" height="4" rx="0" fill="#FF88AA"/>
        {/* corruption pixel scatter */}
        <rect x="22" y="44" width="3" height="3" fill="#FF0044" opacity="0.6"/>
        <rect x="95" y="52" width="3" height="3" fill="#00FFAA" opacity="0.5"/>
        <rect x="14" y="100" width="4" height="2" fill="#FF0044" opacity="0.5"/>
        <rect x="102" y="110" width="3" height="3" fill="#FF0044" opacity="0.4"/>
        <g filter="url(#ve)">
          <rect x="41" y="27" width="12" height="6" rx="1" fill="#FF0044" opacity="0.4"/>
          <rect x="67" y="27" width="12" height="6" rx="1" fill="#FF0044" opacity="0.4"/>
          <circle cx="60" cy="85" r="11" fill="#FF0044" opacity="0.2"/>
        </g>
      </svg>
    ),

    // 9 – Chrome Predator: sleek chrome panther/cat in pounce
    9: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="cp"><feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        <ellipse cx="60" cy="154" rx="42" ry="6" fill="#88AACC18"/>
        {/* tail — arching high */}
        <path d="M85 120 Q110 90 105 60 Q102 45 110 30" fill="none" stroke="#667788" strokeWidth="10" strokeLinecap="round"/>
        <path d="M85 120 Q110 90 105 60 Q102 45 110 30" fill="none" stroke="#AABBCC" strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
        <circle cx="110" cy="30" r="4" fill="#AACCEE" opacity="0.8"/>
        {/* body — low slung pounce */}
        <ellipse cx="58" cy="100" rx="38" ry="22" fill="#445566"/>
        <ellipse cx="56" cy="98" rx="32" ry="17" fill="#556677" opacity="0.7"/>
        {/* chrome body shine */}
        <ellipse cx="48" cy="90" rx="16" ry="7" fill="#778899" opacity="0.3" transform="rotate(-20 48 90)"/>
        {/* front legs — reaching forward */}
        <path d="M28 108 Q18 120 10 130" fill="none" stroke="#445566" strokeWidth="12" strokeLinecap="round"/>
        <path d="M28 108 Q18 120 10 130" fill="none" stroke="#667788" strokeWidth="7" strokeLinecap="round" opacity="0.6"/>
        <path d="M44 114 Q38 128 32 140" fill="none" stroke="#445566" strokeWidth="12" strokeLinecap="round"/>
        <path d="M44 114 Q38 128 32 140" fill="none" stroke="#667788" strokeWidth="7" strokeLinecap="round" opacity="0.6"/>
        {/* front paws */}
        <ellipse cx="10" cy="132" rx="8" ry="5" fill="#334455"/>
        <ellipse cx="31" cy="142" rx="8" ry="5" fill="#334455"/>
        {/* claws */}
        <line x1="6" y1="130" x2="3" y2="136" stroke="#AACCEE" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10" y1="135" x2="8" y2="141" stroke="#AACCEE" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14" y1="130" x2="17" y2="136" stroke="#AACCEE" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="27" y1="140" x2="24" y2="146" stroke="#AACCEE" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="31" y1="145" x2="29" y2="151" stroke="#AACCEE" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="35" y1="140" x2="38" y2="146" stroke="#AACCEE" strokeWidth="1.5" strokeLinecap="round"/>
        {/* back legs */}
        <path d="M75 112 Q82 128 86 142" fill="none" stroke="#445566" strokeWidth="12" strokeLinecap="round"/>
        <path d="M75 112 Q82 128 86 142" fill="none" stroke="#667788" strokeWidth="7" strokeLinecap="round" opacity="0.6"/>
        <ellipse cx="86" cy="144" rx="9" ry="5" fill="#334455"/>
        {/* neck — forward lean */}
        <path d="M36 86 Q34 72 40 60" fill="none" stroke="#445566" strokeWidth="16" strokeLinecap="round"/>
        <path d="M36 86 Q34 72 40 60" fill="none" stroke="#667788" strokeWidth="10" strokeLinecap="round" opacity="0.6"/>
        {/* head — sleek feline */}
        <ellipse cx="44" cy="50" rx="22" ry="18" fill="#445566"/>
        <ellipse cx="44" cy="48" rx="18" ry="14" fill="#556677" opacity="0.7"/>
        {/* ears */}
        <polygon points="28,42 24,28 34,38" fill="#445566"/>
        <polygon points="28,42 26,30 32,38" fill="#667788" opacity="0.5"/>
        <polygon points="58,40 62,26 54,38" fill="#445566"/>
        <polygon points="58,40 60,28 56,38" fill="#667788" opacity="0.5"/>
        {/* eyes — chrome blue glow */}
        <ellipse cx="36" cy="48" rx="7" ry="5" fill="#112233"/>
        <ellipse cx="52" cy="48" rx="7" ry="5" fill="#112233"/>
        <ellipse cx="36" cy="48" rx="5" ry="3.5" fill="#4488CC" opacity="0.9"/>
        <ellipse cx="52" cy="48" rx="5" ry="3.5" fill="#4488CC" opacity="0.9"/>
        <ellipse cx="36" cy="48" rx="2.5" ry="2" fill="#AACCFF"/>
        <ellipse cx="52" cy="48" rx="2.5" ry="2" fill="#AACCFF"/>
        {/* muzzle */}
        <ellipse cx="44" cy="56" rx="9" ry="6" fill="#334455"/>
        <line x1="44" y1="54" x2="44" y2="62" stroke="#667788" strokeWidth="1" opacity="0.5"/>
        {/* whiskers */}
        <line x1="36" y1="56" x2="20" y2="52" stroke="#AABBCC" strokeWidth="1" opacity="0.6"/>
        <line x1="36" y1="58" x2="20" y2="58" stroke="#AABBCC" strokeWidth="1" opacity="0.5"/>
        <line x1="52" y1="56" x2="68" y2="52" stroke="#AABBCC" strokeWidth="1" opacity="0.6"/>
        <line x1="52" y1="58" x2="68" y2="58" stroke="#AABBCC" strokeWidth="1" opacity="0.5"/>
        <g filter="url(#cp)">
          <ellipse cx="36" cy="48" rx="6" ry="4" fill="#4488CC" opacity="0.4"/>
          <ellipse cx="52" cy="48" rx="6" ry="4" fill="#4488CC" opacity="0.4"/>
        </g>
      </svg>
    ),

    // 11 – Neural Titan: giant with exposed neural network all over body
    11: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="nt"><feGaussianBlur stdDeviation="2.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        <ellipse cx="60" cy="153" rx="44" ry="7" fill="#00CCFF18"/>
        {/* legs — massive */}
        <rect x="30" y="108" width="24" height="40" rx="6" fill="#112233"/>
        <rect x="66" y="108" width="24" height="40" rx="6" fill="#112233"/>
        <rect x="28" y="136" width="28" height="10" rx="4" fill="#0A1A2A"/>
        <rect x="64" y="136" width="28" height="10" rx="4" fill="#0A1A2A"/>
        {/* neural lines on legs */}
        <path d="M36 112 Q40 120 38 128 Q36 136 40 144" fill="none" stroke="#00AACC" strokeWidth="1" opacity="0.6"/>
        <path d="M80 112 Q76 120 78 128 Q80 136 76 144" fill="none" stroke="#00AACC" strokeWidth="1" opacity="0.6"/>
        <circle cx="38" cy="128" r="2" fill="#00CCFF" opacity="0.7"/>
        <circle cx="78" cy="128" r="2" fill="#00CCFF" opacity="0.7"/>
        {/* waist */}
        <rect x="28" y="98" width="64" height="14" rx="5" fill="#112233"/>
        {/* torso — huge with exposed neural net */}
        <rect x="16" y="46" width="88" height="56" rx="10" fill="#112233"/>
        <rect x="20" y="50" width="80" height="48" rx="8" fill="#0A1A2A" opacity="0.9"/>
        {/* neural network on torso */}
        <circle cx="36" cy="62" r="3" fill="#00AACC"/>
        <circle cx="60" cy="58" r="3" fill="#00AACC"/>
        <circle cx="84" cy="62" r="3" fill="#00AACC"/>
        <circle cx="30" cy="82" r="3" fill="#00AACC"/>
        <circle cx="60" cy="86" r="3" fill="#00AACC"/>
        <circle cx="90" cy="82" r="3" fill="#00AACC"/>
        <circle cx="46" cy="72" r="3" fill="#00CCFF"/>
        <circle cx="74" cy="72" r="3" fill="#00CCFF"/>
        <circle cx="60" cy="70" r="4" fill="#00CCFF"/>
        <line x1="36" y1="62" x2="46" y2="72" stroke="#00AACC" strokeWidth="1" opacity="0.7"/>
        <line x1="60" y1="58" x2="46" y2="72" stroke="#00AACC" strokeWidth="1" opacity="0.7"/>
        <line x1="60" y1="58" x2="74" y2="72" stroke="#00AACC" strokeWidth="1" opacity="0.7"/>
        <line x1="84" y1="62" x2="74" y2="72" stroke="#00AACC" strokeWidth="1" opacity="0.7"/>
        <line x1="46" y1="72" x2="60" y2="70" stroke="#00CCFF" strokeWidth="1.5" opacity="0.8"/>
        <line x1="74" y1="72" x2="60" y2="70" stroke="#00CCFF" strokeWidth="1.5" opacity="0.8"/>
        <line x1="46" y1="72" x2="30" y2="82" stroke="#00AACC" strokeWidth="1" opacity="0.7"/>
        <line x1="60" y1="70" x2="60" y2="86" stroke="#00CCFF" strokeWidth="1.5" opacity="0.8"/>
        <line x1="74" y1="72" x2="90" y2="82" stroke="#00AACC" strokeWidth="1" opacity="0.7"/>
        <line x1="30" y1="82" x2="60" y2="86" stroke="#00AACC" strokeWidth="1" opacity="0.6"/>
        <line x1="90" y1="82" x2="60" y2="86" stroke="#00AACC" strokeWidth="1" opacity="0.6"/>
        {/* shoulder plates */}
        <rect x="2" y="46" width="16" height="28" rx="5" fill="#112233"/>
        <rect x="102" y="46" width="16" height="28" rx="5" fill="#112233"/>
        {/* neural arm lines */}
        <line x1="6" y1="52" x2="12" y2="70" stroke="#00AACC" strokeWidth="1" opacity="0.5"/>
        <line x1="106" y1="52" x2="112" y2="70" stroke="#00AACC" strokeWidth="1" opacity="0.5"/>
        {/* neck */}
        <rect x="44" y="36" width="32" height="14" rx="5" fill="#112233"/>
        <line x1="54" y1="36" x2="54" y2="48" stroke="#00AACC" strokeWidth="1" opacity="0.5"/>
        <line x1="66" y1="36" x2="66" y2="48" stroke="#00AACC" strokeWidth="1" opacity="0.5"/>
        {/* head — exposed brain regions */}
        <ellipse cx="60" cy="22" rx="26" ry="22" fill="#112233"/>
        <ellipse cx="60" cy="20" rx="22" ry="18" fill="#0A1A2A" opacity="0.9"/>
        {/* brain folds visible on top of head */}
        <path d="M42 12 Q50 6 60 8 Q70 6 78 12" fill="none" stroke="#00AACC" strokeWidth="1.5" opacity="0.6"/>
        <path d="M38 18 Q46 12 56 14 Q64 12 72 14 Q80 18 82 22" fill="none" stroke="#00CCFF" strokeWidth="1" opacity="0.5"/>
        {/* eyes — bright neural blue */}
        <ellipse cx="50" cy="22" rx="8" ry="6" fill="#0A1222"/>
        <ellipse cx="70" cy="22" rx="8" ry="6" fill="#0A1222"/>
        <ellipse cx="50" cy="22" rx="6" ry="4.5" fill="#00AACC" opacity="0.9"/>
        <ellipse cx="70" cy="22" rx="6" ry="4.5" fill="#00AACC" opacity="0.9"/>
        <ellipse cx="50" cy="22" rx="3" ry="2.5" fill="#AAFFFF"/>
        <ellipse cx="70" cy="22" rx="3" ry="2.5" fill="#AAFFFF"/>
        {/* neural crown */}
        <line x1="52" y1="4" x2="50" y2="-1" stroke="#00CCFF" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="60" y1="2" x2="60" y2="-2" stroke="#00CCFF" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="68" y1="4" x2="70" y2="-1" stroke="#00CCFF" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="50" cy="-1" r="2" fill="#00CCFF"/>
        <circle cx="60" cy="-2" r="2" fill="#00CCFF"/>
        <circle cx="70" cy="-1" r="2" fill="#00CCFF"/>
        <g filter="url(#nt)">
          <ellipse cx="50" cy="22" rx="7" ry="5" fill="#00AACC" opacity="0.4"/>
          <ellipse cx="70" cy="22" rx="7" ry="5" fill="#00AACC" opacity="0.4"/>
          <circle cx="60" cy="70" r="5" fill="#00CCFF" opacity="0.4"/>
        </g>
      </svg>
    ),

    // 13 – Nexus Core: floating crystal with energy rings
    13: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="nc"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* outer energy rings */}
        <ellipse cx="60" cy="80" rx="55" ry="18" fill="none" stroke="#FF8800" strokeWidth="2" opacity="0.5"/>
        <ellipse cx="60" cy="80" rx="45" ry="14" fill="none" stroke="#FFAA00" strokeWidth="1.5" opacity="0.4" transform="rotate(30 60 80)"/>
        <ellipse cx="60" cy="80" rx="50" ry="16" fill="none" stroke="#FFCC00" strokeWidth="1" opacity="0.3" transform="rotate(60 60 80)"/>
        {/* ring nodes */}
        <circle cx="5" cy="80" r="3" fill="#FF8800" opacity="0.7"/>
        <circle cx="115" cy="80" r="3" fill="#FF8800" opacity="0.7"/>
        <circle cx="60" cy="62" r="3" fill="#FFAA00" opacity="0.7"/>
        <circle cx="60" cy="98" r="3" fill="#FFAA00" opacity="0.7"/>
        {/* energy tether to ground */}
        <line x1="60" y1="120" x2="60" y2="155" stroke="#FF8800" strokeWidth="2" opacity="0.4" strokeDasharray="4,4"/>
        <ellipse cx="60" cy="155" rx="20" ry="5" fill="#FF880020"/>
        {/* main crystal body */}
        <polygon points="60,20 84,52 80,90 60,108 40,90 36,52" fill="#221100"/>
        <polygon points="60,22 82,52 78,88 60,106 42,88 38,52" fill="#553300" opacity="0.9"/>
        {/* crystal facets */}
        <polygon points="60,22 82,52 60,60" fill="#FF8800" opacity="0.3"/>
        <polygon points="60,22 38,52 60,60" fill="#FF8800" opacity="0.2"/>
        <polygon points="60,60 82,52 78,88" fill="#FFAA00" opacity="0.25"/>
        <polygon points="60,60 38,52 42,88" fill="#FFAA00" opacity="0.2"/>
        <polygon points="60,60 78,88 60,106" fill="#FF6600" opacity="0.3"/>
        <polygon points="60,60 42,88 60,106" fill="#FF6600" opacity="0.25"/>
        {/* inner energy core */}
        <circle cx="60" cy="64" r="12" fill="#110800"/>
        <circle cx="60" cy="64" r="10" fill="#FF6600" opacity="0.7"/>
        <circle cx="60" cy="64" r="7" fill="#FFAA00"/>
        <circle cx="60" cy="64" r="4" fill="#FFDD00"/>
        <circle cx="60" cy="64" r="2" fill="white"/>
        {/* crystal edge highlights */}
        <line x1="60" y1="22" x2="82" y2="52" stroke="#FFCC00" strokeWidth="1.5" opacity="0.7"/>
        <line x1="60" y1="22" x2="38" y2="52" stroke="#FF8800" strokeWidth="1" opacity="0.5"/>
        <line x1="78" y1="88" x2="60" y2="106" stroke="#FF6600" strokeWidth="1" opacity="0.5"/>
        <line x1="42" y1="88" x2="60" y2="106" stroke="#FF6600" strokeWidth="1" opacity="0.5"/>
        {/* floating energy fragments */}
        <polygon points="16,40 20,34 24,40 20,46" fill="#FF8800" opacity="0.5"/>
        <polygon points="96,44 100,38 104,44 100,50" fill="#FFAA00" opacity="0.4"/>
        <polygon points="12,110 15,105 18,110 15,115" fill="#FF6600" opacity="0.4"/>
        <polygon points="100,115 104,108 108,115 104,122" fill="#FF8800" opacity="0.4"/>
        <g filter="url(#nc)">
          <circle cx="60" cy="64" r="12" fill="#FFAA00" opacity="0.25"/>
          <ellipse cx="60" cy="80" rx="55" ry="18" fill="none" stroke="#FF8800" strokeWidth="3" opacity="0.15"/>
        </g>
      </svg>
    ),

    // 14 – Void Colossus: massive dark entity with void tendrils
    14: (
      <svg viewBox="0 0 120 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="vc"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
        {/* void aura */}
        <ellipse cx="60" cy="100" rx="56" ry="58" fill="#110022" opacity="0.5"/>
        <ellipse cx="60" cy="155" rx="40" ry="8" fill="#330055" opacity="0.4"/>
        {/* void tendrils */}
        <path d="M20 90 Q4 70 2 50 Q2 35 10 30" fill="none" stroke="#440088" strokeWidth="7" strokeLinecap="round"/>
        <path d="M20 90 Q4 70 2 50 Q2 35 10 30" fill="none" stroke="#8800CC" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
        <circle cx="10" cy="30" r="5" fill="#AA00FF" opacity="0.6"/>
        <path d="M100 90 Q116 70 118 50 Q118 35 110 30" fill="none" stroke="#440088" strokeWidth="7" strokeLinecap="round"/>
        <path d="M100 90 Q116 70 118 50 Q118 35 110 30" fill="none" stroke="#8800CC" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
        <circle cx="110" cy="30" r="5" fill="#AA00FF" opacity="0.6"/>
        <path d="M30 120 Q10 130 6 148" fill="none" stroke="#440088" strokeWidth="6" strokeLinecap="round"/>
        <path d="M30 120 Q10 130 6 148" fill="none" stroke="#8800CC" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <path d="M90 120 Q110 130 114 148" fill="none" stroke="#440088" strokeWidth="6" strokeLinecap="round"/>
        <path d="M90 120 Q110 130 114 148" fill="none" stroke="#8800CC" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        {/* legs */}
        <rect x="32" y="110" width="22" height="38" rx="6" fill="#1A0033"/>
        <rect x="66" y="110" width="22" height="38" rx="6" fill="#1A0033"/>
        <rect x="30" y="136" width="26" height="10" rx="4" fill="#110022"/>
        <rect x="64" y="136" width="26" height="10" rx="4" fill="#110022"/>
        {/* void pulse lines on legs */}
        <line x1="40" y1="114" x2="38" y2="144" stroke="#8800CC" strokeWidth="1.5" opacity="0.5"/>
        <line x1="80" y1="114" x2="82" y2="144" stroke="#8800CC" strokeWidth="1.5" opacity="0.5"/>
        {/* torso — void-dark */}
        <rect x="18" y="54" width="84" height="60" rx="10" fill="#1A0033"/>
        <rect x="22" y="58" width="76" height="52" rx="8" fill="#220044" opacity="0.9"/>
        {/* void vortex on chest */}
        <circle cx="60" cy="82" r="18" fill="#110022"/>
        <circle cx="60" cy="82" r="15" fill="#1A0033" opacity="0.9"/>
        <circle cx="60" cy="82" r="12" fill="none" stroke="#550088" strokeWidth="2" opacity="0.8"/>
        <circle cx="60" cy="82" r="8" fill="none" stroke="#8800CC" strokeWidth="2" opacity="0.7"/>
        <circle cx="60" cy="82" r="4" fill="#AA00FF" opacity="0.8"/>
        <circle cx="60" cy="82" r="2" fill="#CC44FF"/>
        {/* void swirl arms */}
        <path d="M56 74 Q48 72 46 78 Q44 84 50 86" fill="none" stroke="#8800CC" strokeWidth="1.5" opacity="0.6"/>
        <path d="M64 90 Q72 92 74 86 Q76 80 70 78" fill="none" stroke="#8800CC" strokeWidth="1.5" opacity="0.6"/>
        {/* shoulders massive */}
        <ellipse cx="16" cy="66" rx="14" ry="18" fill="#1A0033"/>
        <ellipse cx="104" cy="66" rx="14" ry="18" fill="#1A0033"/>
        <ellipse cx="16" cy="64" rx="10" ry="13" fill="#220044" opacity="0.6"/>
        <ellipse cx="104" cy="64" rx="10" ry="13" fill="#220044" opacity="0.6"/>
        {/* neck */}
        <rect x="46" y="42" width="28" height="16" rx="5" fill="#1A0033"/>
        {/* head — void entity */}
        <ellipse cx="60" cy="28" rx="26" ry="24" fill="#1A0033"/>
        <ellipse cx="60" cy="26" rx="21" ry="19" fill="#220044" opacity="0.8"/>
        {/* void eye cluster */}
        <ellipse cx="50" cy="24" rx="9" ry="7" fill="#0A0011"/>
        <ellipse cx="70" cy="24" rx="9" ry="7" fill="#0A0011"/>
        <ellipse cx="50" cy="24" rx="7" ry="5" fill="#6600AA" opacity="0.9"/>
        <ellipse cx="70" cy="24" rx="7" ry="5" fill="#6600AA" opacity="0.9"/>
        <ellipse cx="50" cy="24" rx="4" ry="3" fill="#CC00FF"/>
        <ellipse cx="70" cy="24" rx="4" ry="3" fill="#CC00FF"/>
        <ellipse cx="50" cy="24" rx="1.5" ry="1.5" fill="white" opacity="0.9"/>
        <ellipse cx="70" cy="24" rx="1.5" ry="1.5" fill="white" opacity="0.9"/>
        {/* third void eye center */}
        <ellipse cx="60" cy="16" rx="6" ry="4" fill="#330044"/>
        <ellipse cx="60" cy="16" rx="4" ry="2.5" fill="#9900CC" opacity="0.8"/>
        <ellipse cx="60" cy="16" rx="2" ry="1.5" fill="#DD44FF"/>
        {/* void crown */}
        <path d="M38 14 Q60 2 82 14" fill="none" stroke="#6600AA" strokeWidth="2" opacity="0.5"/>
        <polygon points="46,12 44,2 50,10" fill="#440066" opacity="0.7"/>
        <polygon points="60,10 60,0 64,8" fill="#550088" opacity="0.7"/>
        <polygon points="74,12 76,2 70,10" fill="#440066" opacity="0.7"/>
        <g filter="url(#vc)">
          <ellipse cx="50" cy="24" rx="8" ry="6" fill="#CC00FF" opacity="0.35"/>
          <ellipse cx="70" cy="24" rx="8" ry="6" fill="#CC00FF" opacity="0.35"/>
          <circle cx="60" cy="16" r="5" fill="#9900CC" opacity="0.35"/>
          <circle cx="60" cy="82" r="19" fill="#6600AA" opacity="0.15"/>
        </g>
      </svg>
    ),
  };

  return icons[id] ?? icons[0];
}

// ── Boss Select View (one boss at a time) ────────────────────────────────────

function SelectView() {
  const t                   = useT();
  const lang                = useLangStore(s => s.lang);
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
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', textAlign: 'center' }}>
          Jesteś legendą Neon-Warszawy.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Progress header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 10, color: accentColor, textShadow: `0 0 10px ${accentColor}80` }}>
          ⚡ BOSS
        </p>
        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', padding: '2px 8px' }}>
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
            ...MONO, fontSize: 10, color: accentColor,
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
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
          {lang === 'en' ? (boss!.descriptionEn ?? boss!.description) : boss!.description}
        </p>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', padding: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>❤ HP</p>
            <p style={{ ...ORB, fontSize: 11, color: '#ff4444' }}>{boss!.maxHp.toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>⚔ ATK</p>
            <p style={{ ...ORB, fontSize: 11, color: '#ff8800' }}>{boss!.attack}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>🛡 DEF</p>
            <p style={{ ...ORB, fontSize: 11, color: '#4488ff' }}>{boss!.defense}</p>
          </div>
        </div>

        {/* Powers */}
        <div style={{ width: '100%' }}>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{lang === 'en' ? 'BOSS POWERS' : 'MOCE BOSSA'}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {boss!.powers.map(p => (
              <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <PowerBadge power={p} />
                <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>
                  {getPowerInfo(t)[p].desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div style={{ display: 'flex', gap: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.15)', padding: '8px 16px', width: '100%', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>XP</p>
            <p style={{ ...ORB, fontSize: 10, color: '#00f5ff' }}>+{boss!.xpReward.toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>ZŁOTO</p>
            <p style={{ ...ORB, fontSize: 10, color: '#ffd700' }}>+{boss!.goldReward.toLocaleString()} 🪙</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>DROP</p>
            <p style={{ ...ORB, fontSize: 10, color: '#cc44ff' }}>
              {t.challenge.drop(Math.round(bossIdx / 15 * 65))}
            </p>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>{t.challenge.dropLabel}</p>
          </div>
        </div>
      </div>



      {/* Cooldown / fight button */}
      {cooldownLeft > 0 ? (
        <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.25)' }}>
          <p style={{ ...MONO, fontSize: 10, color: '#ff4444', marginBottom: 4 }}>⏱ COOLDOWN</p>
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
          ⚡ {lang === 'en' ? 'FIGHT' : 'WALCZ Z'} {boss!.name.toUpperCase()}
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
