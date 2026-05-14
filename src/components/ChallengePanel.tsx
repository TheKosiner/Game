import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CHALLENGE_COOLDOWN } from '../store/gameStore';
import { CHALLENGE_BOSSES } from '../data/challengeBosses';
import type { ChallengePower } from '../types';

const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;
const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;

const POWER_INFO: Record<ChallengePower, { label: string; color: string; emoji: string; desc: string }> = {
  regen:         { label: 'REGEN',      color: '#ff4444', emoji: '🔴', desc: 'Regeneruje 3% HP/runda' },
  double_strike: { label: 'x2 CIOSY',   color: '#ff9900', emoji: '⚡', desc: 'Atakuje dwa razy' },
  armor_break:   { label: 'ŁAM.OBR.',   color: '#cc44ff', emoji: '💥', desc: 'Twoja obrona -60%' },
  dodge:         { label: 'UNIK 25%',   color: '#00f5ff', emoji: '💨', desc: '25% szans uniknięcia' },
  rage:          { label: 'FURIA',      color: '#ff6600', emoji: '🔥', desc: 'ATK x1.6 gdy HP<30%' },
  shield:        { label: 'TARCZA',     color: '#4488ff', emoji: '🛡', desc: 'Pochłania 25% max HP' },
  lifesteal:     { label: 'VAMP HP',    color: '#cc0066', emoji: '💉', desc: 'Kradnie 25% DMG' },
  poison:        { label: 'TRUCIZNA',   color: '#44cc44', emoji: '🟢', desc: 'Zadaje 4% HP/runda' },
};

function useCooldownMs(lastChallengeAt: number) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, CHALLENGE_COOLDOWN - (Date.now() - lastChallengeAt));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastChallengeAt]);
  return remaining;
}

function fmtMs(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function PowerBadge({ power }: { power: ChallengePower }) {
  const info = POWER_INFO[power];
  return (
    <span title={info.desc} style={{
      ...MONO, fontSize: 7,
      color: info.color,
      background: `${info.color}14`,
      border: `1px solid ${info.color}44`,
      padding: '2px 5px',
      whiteSpace: 'nowrap',
    }}>
      {info.emoji} {info.label}
    </span>
  );
}

function LogLine({ line }: { line: string }) {
  const color =
    line.includes('ZWYCIĘSTWO') || line.includes('🏆') ? '#ffd700' :
    line.includes('KLĘSKA') || line.includes('💀') ? '#ff4444' :
    line.includes('REGEN') ? '#ff4444' :
    line.includes('FURIA') ? '#ff6600' :
    line.includes('TARCZA') || line.includes('🛡') ? '#4488ff' :
    line.includes('VAMP') ? '#cc0066' :
    line.includes('TRUCIZNA') || line.includes('🟢') ? '#44cc44' :
    line.includes('UNIK') || line.includes('💨') ? '#00f5ff' :
    line.includes('ŁAM') || line.includes('💥') ? '#cc44ff' :
    line.includes('⚔') ? 'var(--text-main)' :
    line.includes('🤖') ? '#ff7777' :
    'var(--text-dim)';
  return <p style={{ ...MONO, fontSize: 9, color, lineHeight: 1.6 }}>{line}</p>;
}

export default function ChallengePanel() {
  const hero             = useGameStore(s => s.hero);
  const challengeUnlocked = useGameStore(s => s.challengeUnlocked);
  const lastChallengeAt  = useGameStore(s => s.lastChallengeAt);
  const challengeResult  = useGameStore(s => s.challengeResult);
  const fightChallengeBoss = useGameStore(s => s.fightChallengeBoss);

  const cooldownLeft = useCooldownMs(lastChallengeAt);
  const canFight = cooldownLeft === 0;

  const [selectedIdx, setSelectedIdx] = useState(challengeUnlocked);
  const [showLog, setShowLog] = useState(false);

  const selected = CHALLENGE_BOSSES[selectedIdx];
  const isUnlocked = selectedIdx <= challengeUnlocked;
  const meetsLevel = hero.level >= selected.minLevel;

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {CHALLENGE_BOSSES.map((boss, idx) => {
          const unlocked = idx <= challengeUnlocked;
          const defeated = idx < challengeUnlocked;
          const isSel = idx === selectedIdx;
          const borderColor = defeated ? '#44cc4466' : unlocked ? '#ff990066' : '#33333366';
          const bgColor = defeated ? 'rgba(68,204,68,0.04)' : unlocked ? 'rgba(255,153,0,0.06)' : 'rgba(0,0,0,0.3)';
          return (
            <div
              key={boss.id}
              onClick={() => unlocked && setSelectedIdx(idx)}
              style={{
                background: isSel ? `rgba(255,153,0,0.1)` : bgColor,
                border: `1px solid ${isSel ? '#ff9900aa' : borderColor}`,
                padding: '8px 10px',
                cursor: unlocked ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: isSel ? '0 0 10px rgba(255,153,0,0.15)' : 'none',
                transition: 'all 0.15s ease',
                opacity: unlocked ? 1 : 0.5,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{unlocked ? boss.emoji : '🔒'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...ORB, fontSize: 8, color: defeated ? '#44cc44' : unlocked ? '#ff9900' : 'var(--text-muted)' }}>
                  {defeated ? '✓ ' : ''}{boss.name}
                </p>
                <p style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)' }}>
                  Poz.{boss.level} · Min. poz. {boss.minLevel}
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-end', maxWidth: 120 }}>
                {unlocked && boss.powers.map(p => <PowerBadge key={p} power={p} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected boss detail */}
      <div style={{
        background: 'rgba(255,153,0,0.05)',
        border: '1px solid rgba(255,153,0,0.25)',
        padding: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>{isUnlocked ? selected.emoji : '🔒'}</span>
          <div>
            <p style={{ ...ORB, fontSize: 10, color: '#ff9900' }}>{selected.name}</p>
            <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)' }}>
              Poziom {selected.level} · Min. {selected.minLevel} poz.
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ ...MONO, fontSize: 9, color: '#ffd700' }}>+{selected.xpReward.toLocaleString()} XP</p>
            <p style={{ ...MONO, fontSize: 9, color: '#ffd700' }}>+{selected.goldReward.toLocaleString()} 🪙</p>
          </div>
        </div>

        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-main)', marginBottom: 8 }}>
          {selected.description}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <span style={{ ...MONO, fontSize: 9, color: '#ff4444' }}>❤ {selected.hp.toLocaleString()} HP</span>
          <span style={{ ...MONO, fontSize: 9, color: '#ff9900' }}>⚔ {selected.attack} ATK</span>
          <span style={{ ...MONO, fontSize: 9, color: '#4488ff' }}>🛡 {selected.defense} DEF</span>
        </div>

        {/* Powers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {selected.powers.map(p => (
            <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <PowerBadge power={p} />
              <span style={{ ...MONO, fontSize: 7, color: 'var(--text-muted)' }}>{POWER_INFO[p].desc}</span>
            </div>
          ))}
        </div>

        {/* Drop info */}
        <p style={{ ...MONO, fontSize: 8, color: '#cc44ff', marginBottom: 10 }}>
          Drop: {selectedIdx >= 5 ? '3× ✨ LEGENDARNY' : selectedIdx >= 2 ? '2× 🟪 EPICKI/LEGENDARNY' : '1× 🟪 EPICKI'}
        </p>

        {/* Fight button */}
        {!isUnlocked ? (
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
            🔒 Pokonaj poprzedniego bossa aby odblokować
          </p>
        ) : !meetsLevel ? (
          <p style={{ ...MONO, fontSize: 9, color: '#ff4444', textAlign: 'center' }}>
            ⚠ Wymagany poziom: {selected.minLevel} (twój: {hero.level})
          </p>
        ) : !canFight ? (
          <p style={{ ...MONO, fontSize: 9, color: '#ff9900', textAlign: 'center' }}>
            ⏱ Następna próba za: {fmtMs(cooldownLeft)}
          </p>
        ) : (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: 10, letterSpacing: '0.1em' }}
            onClick={() => { fightChallengeBoss(selectedIdx); setShowLog(true); }}
          >
            ⚡ WALCZ Z {selected.name.toUpperCase()}
          </button>
        )}
      </div>

      {/* Last result */}
      {challengeResult && (
        <div style={{
          background: challengeResult.won ? 'rgba(68,204,68,0.05)' : 'rgba(255,68,68,0.05)',
          border: `1px solid ${challengeResult.won ? 'rgba(68,204,68,0.3)' : 'rgba(255,68,68,0.3)'}`,
          padding: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <p style={{ ...ORB, fontSize: 9, color: challengeResult.won ? '#44cc44' : '#ff4444' }}>
              {challengeResult.won ? '🏆 ZWYCIĘSTWO' : '💀 PORAŻKA'} — {CHALLENGE_BOSSES[challengeResult.bossIdx]?.name}
            </p>
            <button
              onClick={() => setShowLog(v => !v)}
              style={{ ...MONO, fontSize: 8, color: 'var(--text-dim)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', cursor: 'pointer' }}
            >
              {showLog ? '▲ UKRYJ' : '▼ LOG'}
            </button>
          </div>

          {challengeResult.won && challengeResult.loot.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ ...MONO, fontSize: 8, color: '#cc44ff', marginBottom: 4 }}>Zdobyte przedmioty:</p>
              {challengeResult.loot.map((item, i) => (
                <p key={i} style={{ ...MONO, fontSize: 9, color: item.rarity === 'legendary' ? '#ffd700' : '#cc44ff' }}>
                  {item.rarity === 'legendary' ? '✨' : '🟪'} {item.emoji} {item.name}
                </p>
              ))}
            </div>
          )}

          {showLog && (
            <div style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 4, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 4 }}>
              {challengeResult.log.map((line, i) => <LogLine key={i} line={line} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
