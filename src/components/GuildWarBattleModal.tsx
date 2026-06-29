import { useEffect, useState } from 'react';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { PX } from '../utils/styles';
import { portraitSrc, resolvePortrait } from '../data/portraits';
import type { GuildWar, WarDuel, WarFighter } from '../lib/guildWar';

const CSS = `
@keyframes gwb-clash { 0%{transform:scale(0.4);opacity:0} 40%{transform:scale(1.3);opacity:1} 100%{transform:scale(1);opacity:0.9} }
@keyframes gwb-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
@keyframes gwb-enter-l { from{transform:translateX(-40px);opacity:0} to{transform:translateX(0);opacity:1} }
@keyframes gwb-enter-r { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
@keyframes gwb-win { 0%,100%{box-shadow:0 0 12px var(--gwc)} 50%{box-shadow:0 0 28px var(--gwc)} }
`;

const RED = '#f87171';
const BLUE = '#7dd3fc';

function Fighter({ f, side, state }: { f: WarFighter | null; side: 'atk' | 'def'; state: 'idle' | 'won' | 'lost' }) {
  const color = side === 'atk' ? RED : BLUE;
  const hp = state === 'lost' ? 0 : 100;
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: state === 'won' ? `${color}1a` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${state === 'lost' ? 'rgba(255,255,255,0.08)' : color + '66'}`,
      padding: '10px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      opacity: state === 'lost' ? 0.45 : 1,
      filter: state === 'lost' ? 'grayscale(0.8)' : 'none',
      transition: 'opacity 0.4s, filter 0.4s, background 0.4s',
      animation: `${side === 'atk' ? 'gwb-enter-l' : 'gwb-enter-r'} 0.35s ease, ${state === 'won' ? 'gwb-win 1s ease infinite' : 'none'}`,
      ['--gwc' as string]: color,
    }}>
      <div style={{
        width: 52, height: 52, overflow: 'hidden', flexShrink: 0,
        border: `2px solid ${color}`, boxShadow: `0 0 8px ${color}55`,
        animation: state === 'lost' ? 'gwb-shake 0.4s ease' : 'none',
      }}>
        {f
          ? <img src={portraitSrc(resolvePortrait(f.portrait, f.username))} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💤</div>}
      </div>
      <p style={{ ...PX(5), color: state === 'lost' ? 'var(--text-muted)' : 'var(--text-bright)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {f ? f.username : '—'}
      </p>
      <p style={{ ...PX(4), color }}>{f ? `POZ.${f.level}` : ''}</p>
      <div style={{ width: '100%', height: 6, background: '#111', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${hp}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function GuildWarBattleModal({ war, onClose }: { war: GuildWar; onClose: () => void }) {
  const t = useT();
  const isEn = useLangStore(s => s.lang) === 'en';
  const duels: WarDuel[] = war.result?.duels ?? [];
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (step >= duels.length) return;
    setRevealed(false);
    const t1 = setTimeout(() => setRevealed(true), 750);
    const t2 = setTimeout(() => setStep(s => s + 1), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step, duels.length]);

  const finished = step >= duels.length;
  const completed = finished ? duels.length : (revealed ? step + 1 : step);
  const atkScore = duels.slice(0, completed).filter(d => d.winner === 'attacker').length;
  const defScore = duels.slice(0, completed).filter(d => d.winner === 'defender').length;
  const cur = duels[step];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'rgba(2,0,8,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <style>{CSS}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'linear-gradient(160deg,rgba(12,4,18,0.98),rgba(6,2,12,0.99))', border: '1px solid rgba(200,50,50,0.4)', boxShadow: '0 0 40px rgba(200,50,50,0.15)', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {/* Header: guilds + live score */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ ...PX(6), color: 'var(--gold-bright)', marginBottom: 6 }}>
            <span style={{ color: RED }}>[{war.attackerGuildTag}]</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>vs</span>
            <span style={{ color: BLUE }}>[{war.defenderGuildTag}]</span>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <span style={{ ...PX(8), color: RED }}>{atkScore}</span>
            <span style={{ ...PX(5), color: 'var(--text-muted)' }}>:</span>
            <span style={{ ...PX(8), color: BLUE }}>{defScore}</span>
          </div>
        </div>

        {!finished && (
          <>
            <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center' }}>
              {t.guild.warDuel} {step + 1}/{duels.length}
            </p>

            {/* Arena */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, position: 'relative' }}>
              <Fighter f={cur?.atk ?? null} side="atk" state={!revealed ? 'idle' : cur?.winner === 'attacker' ? 'won' : 'lost'} />

              {/* Center clash / VS */}
              <div style={{ flexShrink: 0, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {revealed
                  ? <span key={step} style={{ fontSize: 26, animation: 'gwb-clash 0.5s ease', filter: 'drop-shadow(0 0 8px #ffd700)' }}>⚔</span>
                  : <span style={{ ...PX(6), color: 'var(--text-muted)' }}>VS</span>}
              </div>

              <Fighter f={cur?.def ?? null} side="def" state={!revealed ? 'idle' : cur?.winner === 'defender' ? 'won' : 'lost'} />
            </div>

            {/* Outcome caption */}
            <p style={{ ...PX(4), textAlign: 'center', color: revealed ? (cur?.winner === 'attacker' ? RED : BLUE) : 'transparent', minHeight: 14 }}>
              {revealed && cur && (
                (() => {
                  const winF = cur.winner === 'attacker' ? cur.atk : cur.def;
                  const loseF = cur.winner === 'attacker' ? cur.def : cur.atk;
                  if (!loseF) return `${winF?.username} — ${t.guild.warWalkover}`;
                  return isEn ? `${winF?.username} defeats ${loseF?.username}` : `${winF?.username} pokonuje ${loseF?.username}`;
                })()
              )}
            </p>

            <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: 9, padding: '5px' }}>
              {t.guild.warSkip}
            </button>
          </>
        )}

        {finished && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
            <div style={{
              background: war.result?.winner === 'attacker' ? 'rgba(40,10,10,0.8)' : 'rgba(10,20,50,0.8)',
              border: `1px solid ${war.result?.winner === 'attacker' ? 'rgba(200,50,50,0.6)' : 'rgba(100,150,255,0.6)'}`,
              padding: '14px 12px',
            }}>
              {war.result?.winner === 'attacker' ? (
                <>
                  <p style={{ ...PX(8), color: RED, marginBottom: 4 }}>🏆 {t.guild.warAtkWon}</p>
                  <p style={{ ...PX(6), color: 'var(--gold-bright)' }}>[{war.attackerGuildTag}] {t.guild.warWins}</p>
                </>
              ) : (
                <>
                  <p style={{ ...PX(8), color: BLUE, marginBottom: 4 }}>🛡 {t.guild.warDefWon}</p>
                  <p style={{ ...PX(6), color: 'var(--gold-bright)' }}>[{war.defenderGuildTag}] {t.guild.warHolds}</p>
                </>
              )}
              <p style={{ ...PX(5), color: 'var(--text-muted)', marginTop: 6 }}>
                {war.result?.attackerScore} : {war.result?.defenderScore}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(0)} className="btn btn-secondary" style={{ flex: 1, fontSize: 9, padding: '7px' }}>
                {t.guild.warReplay}
              </button>
              <button onClick={onClose} className="btn btn-primary" style={{ flex: 1, fontSize: 9, padding: '7px' }}>
                {t.guild.warClose}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
