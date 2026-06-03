import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useLangStore } from '../store/langStore';
import { GUILD_BOSSES } from '../data/guildBosses';
import {
  subscribeToBoss, ensureBossActive, attackGuildBoss, claimBossReward,
  calcGuildBossDamage,
  type GuildBossState,
} from '../lib/guildBoss';
import { generateItem, getItemName } from '../data/itemGenerator';
import { syncToCloud } from '../lib/cloudSync';

import { MONO, ORB } from '../utils/styles';

function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function fmtTime(ms: number, expired: string): string {
  if (ms <= 0) return expired;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function midnightAfter(ts: number): number {
  const d = new Date(ts);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function buildLog(boss: GuildBossState, myUid: string, isEn: boolean): string[] {
  return Object.entries(boss.participants)
    .sort((a, b) => a[1].attackedAt - b[1].attackedAt)
    .map(([uid, p]) => {
      const pct = boss.maxHp > 0 ? ((p.damage / boss.maxHp) * 100).toFixed(2) : '0.00';
      const tag = uid === myUid ? (isEn ? ' (you)' : ' (ty)') : '';
      return isEn
        ? `⚔ ${p.username}${tag} dealt ${fmtNum(p.damage)} dmg — ${pct}% boss HP`
        : `⚔ ${p.username}${tag} zadał ${fmtNum(p.damage)} dmg — ${pct}% HP bossa`;
    });
}

export default function GuildBossPanel({ guildId, username }: { guildId: string; username: string }) {
  const hero = useGameStore(s => s.hero);
  const user = useAuthStore(s => s.user);
  const lang = useLangStore(s => s.lang);
  const isEn = lang === 'en';
  const [boss, setBoss] = useState<GuildBossState | null | 'loading'>('loading');
  const [now, setNow] = useState(Date.now());
  const [attacking, setAttacking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ xp: number; gold: number; item: ReturnType<typeof generateItem> } | null>(null);

  // animation state
  const [bossAnimKey, setBossAnimKey] = useState(0);
  const [bossHitKey, setBossHitKey] = useState(0);
  const [floatDmg, setFloatDmg] = useState<{ val: number; key: number } | null>(null);

  // combat log
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!guildId || initialized.current) return;
    initialized.current = true;
    ensureBossActive(guildId).catch(() => {});
    const unsub = subscribeToBoss(guildId, b => {
      setBoss(b);
      if (b && user) setLog(buildLog(b, user.uid, isEn));
    });
    return unsub;
  }, [guildId]);

  // auto-scroll log
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log.length]);

  if (boss === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>{isEn ? 'Loading boss...' : 'Ładowanie bossa...'}</p>
      </div>
    );
  }

  if (!boss) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>{isEn ? 'No active boss.' : 'Brak aktywnego bossa.'}</p>
      </div>
    );
  }

  const bossData = GUILD_BOSSES[boss.bossIdx] ?? GUILD_BOSSES[0];
  const hpPct = Math.min(100, (boss.currentHp / boss.maxHp) * 100);
  const timeLeft = boss.endsAt - now;
  const isExpired = !boss.defeated && now > boss.endsAt;
  const myEntry = user ? boss.participants[user.uid] : undefined;
  const myDamage = myEntry?.damage ?? 0;
  const alreadyAttackedToday = !!myEntry &&
    new Date(myEntry.attackedAt).toDateString() === new Date().toDateString();
  const canClaim = boss.defeated && !!myEntry && !myEntry.rewardClaimed;
  const estimatedDmg = calcGuildBossDamage(hero);
  const participants = Object.entries(boss.participants)
    .sort((a, b) => b[1].damage - a[1].damage);
  const totalDmg = participants.reduce((s, [, p]) => s + p.damage, 0);

  const nextResetLabel = boss.defeated && boss.defeatedAt
    ? (isEn
        ? `Next boss at midnight: ${fmtTime(midnightAfter(boss.defeatedAt) - now, 'EXPIRED')}`
        : `Następny boss o północy: ${fmtTime(midnightAfter(boss.defeatedAt) - now, 'CZAS MINĄŁ')}`)
    : isExpired
      ? (isEn ? 'Resetting soon...' : 'Reset za chwilę...')
      : null;

  const hpColor = hpPct > 60 ? '#44cc44' : hpPct > 30 ? '#ff9900' : '#ff4444';

  async function handleAttack() {
    if (!user || attacking || alreadyAttackedToday || boss === 'loading' || !boss) return;
    setAttacking(true);
    try {
      const res = await attackGuildBoss(guildId, user.uid, username, hero);
      if (res.success) {
        setBossAnimKey(k => k + 1);
        setBossHitKey(k => k + 1);
        setFloatDmg({ val: res.damage, key: Date.now() });
        if (user) syncToCloud(user.uid, username).catch(() => {});
      }
    } finally {
      setAttacking(false);
    }
  }

  async function handleClaim() {
    if (!user || claiming || !boss || boss === 'loading') return;
    setClaiming(true);
    try {
      const res = await claimBossReward(guildId, user.uid, hero);
      if (res) setClaimResult(res);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Boss card with animation */}
      <div style={{
        background: boss.defeated
          ? 'linear-gradient(135deg, rgba(10,40,10,0.97), rgba(5,25,5,0.99))'
          : isExpired
          ? 'linear-gradient(135deg, rgba(30,15,5,0.97), rgba(20,10,3,0.99))'
          : 'linear-gradient(135deg, rgba(30,4,4,0.97), rgba(18,2,2,0.99))',
        border: `1px solid ${boss.defeated ? 'rgba(68,200,68,0.3)' : isExpired ? 'rgba(200,120,20,0.3)' : 'rgba(200,20,20,0.3)'}`,
        padding: '14px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>

        {/* Boss emoji with shake+flash animation */}
        <div
          key={bossAnimKey}
          style={{
            flexShrink: 0,
            position: 'relative',
            width: 80, height: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: bossAnimKey > 0 ? 'bossShake 0.4s ease' : 'none',
          }}
        >
          <div
            key={bossHitKey}
            style={{
              animation: bossHitKey > 0 ? 'bossHit 0.35s ease' : 'none',
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: 64 }}>{bossData.emoji}</span>
          </div>

          {/* Floating damage number */}
          {floatDmg && (
            <span
              key={floatDmg.key}
              style={{
                position: 'absolute', top: -4, right: -12,
                ...ORB, fontSize: 11,
                color: '#ff4444',
                textShadow: '0 0 8px #ff4444',
                pointerEvents: 'none', whiteSpace: 'nowrap',
                animation: 'floatDmg 0.9s ease forwards',
              }}
            >
              -{fmtNum(floatDmg.val)}
            </span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{
            ...ORB, fontSize: 10,
            color: boss.defeated ? '#44cc44' : '#ff4444',
            textShadow: `0 0 12px ${boss.defeated ? '#44cc44' : '#ff4444'}`,
            marginBottom: 3,
          }}>
            {bossData.name}
          </p>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>
            {isEn ? (bossData.descriptionEn ?? bossData.description) : bossData.description}
          </p>

          {/* HP bar */}
          <div style={{ height: 10, background: '#1a0505', border: '1px solid rgba(100,20,20,0.4)', overflow: 'hidden', borderRadius: 2, marginBottom: 4 }}>
            <div style={{
              width: `${hpPct}%`, height: '100%',
              background: hpPct > 60 ? 'linear-gradient(90deg,#3a8a0a,#6acc20)'
                : hpPct > 30 ? 'linear-gradient(90deg,#8a4400,#ff9900)'
                : 'linear-gradient(90deg,#660000,#ff2020)',
              transition: 'width 0.8s ease',
              boxShadow: `0 0 6px ${hpColor}55`,
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ ...MONO, fontSize: 10, color: hpColor }}>
              {fmtNum(boss.currentHp)} / {fmtNum(boss.maxHp)} HP
            </span>
            {!boss.defeated && !isExpired && (
              <span style={{ ...MONO, fontSize: 10, color: timeLeft < 3_600_000 ? '#ff6030' : 'var(--text-dim)' }}>
                ⏱ {fmtTime(timeLeft, isEn ? 'EXPIRED' : 'CZAS MINĄŁ')}
              </span>
            )}
            {nextResetLabel && (
              <span style={{ ...MONO, fontSize: 10, color: '#888' }}>{nextResetLabel}</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        {boss.defeated && (
          <span style={{ ...ORB, fontSize: 10, background: 'rgba(68,200,68,0.15)',
            border: '1px solid rgba(68,200,68,0.4)', color: '#44cc44',
            padding: '3px 8px', borderRadius: 2, flexShrink: 0 }}>
            ✅ {isEn ? 'DEFEATED' : 'POKONANY'}
          </span>
        )}
        {isExpired && !boss.defeated && (
          <span style={{ ...ORB, fontSize: 10, background: 'rgba(200,120,20,0.15)',
            border: '1px solid rgba(200,120,20,0.4)', color: '#e08030',
            padding: '3px 8px', borderRadius: 2, flexShrink: 0 }}>
            ⏰ {isEn ? 'EXPIRED' : 'CZAS MINĄŁ'}
          </span>
        )}
      </div>

      {/* Attack section */}
      {!boss.defeated && !isExpired && (
        <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)' }}>{isEn ? 'YOUR ATTACK TODAY' : 'TWÓJ ATAK DZIŚ'}</span>
            <span style={{ ...MONO, fontSize: 10, color: alreadyAttackedToday ? '#44cc44' : 'var(--text-dim)' }}>
              {alreadyAttackedToday ? `✅ ${fmtNum(myDamage)} dmg` : `~${fmtNum(estimatedDmg)} dmg`}
            </span>
          </div>
          <button
            onClick={handleAttack}
            disabled={attacking || alreadyAttackedToday}
            className="btn btn-danger"
            style={{ width: '100%', fontSize: 10, cursor: alreadyAttackedToday ? 'not-allowed' : 'pointer',
              opacity: alreadyAttackedToday ? 0.5 : 1 }}>
            {attacking ? '...' : alreadyAttackedToday
              ? (isEn ? '⚔ ALREADY ATTACKED TODAY' : '⚔ JUŻ ZAATAKOWAŁEŚ DZIŚ')
              : (isEn ? '⚔ ATTACK BOSS' : '⚔ ATAKUJ BOSSA')}
          </button>
        </div>
      )}

      {/* Claim reward */}
      {canClaim && !claimResult && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(10,40,10,0.97), rgba(5,25,5,0.99))',
          border: '1px solid rgba(68,200,68,0.4)',
          padding: '12px', textAlign: 'center',
          boxShadow: '0 0 16px rgba(68,200,68,0.1)',
        }}>
          <p style={{ ...ORB, fontSize: 10, color: '#44cc44', marginBottom: 6 }}>
            {isEn ? '🏆 BOSS DEFEATED — REWARD AWAITS!' : '🏆 BOSS POKONANY — NAGRODA CZEKA!'}
          </p>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginBottom: 10 }}>
            {isEn ? `Your contribution: ${fmtNum(myDamage)} dmg` : `Twój udział: ${fmtNum(myDamage)} obrażeń`}
          </p>
          <button onClick={handleClaim} disabled={claiming} className="btn btn-primary"
            style={{ width: '100%', fontSize: 10, borderColor: 'rgba(68,200,68,0.5)', background: 'rgba(68,200,68,0.15)' }}>
            {claiming ? '...' : (isEn ? '🎁 CLAIM REWARD' : '🎁 ODBIERZ NAGRODĘ')}
          </button>
        </div>
      )}

      {/* Claim result */}
      {claimResult && (
        <div style={{
          background: 'linear-gradient(135deg,rgba(20,10,40,0.97),rgba(12,5,28,0.99))',
          border: '1px solid rgba(150,80,255,0.4)',
          padding: 12, textAlign: 'center',
          boxShadow: '0 0 20px rgba(150,80,255,0.1)',
        }}>
          <p style={{ ...ORB, fontSize: 10, color: '#cc88ff', marginBottom: 8 }}>✨ {isEn ? 'REWARDS CLAIMED' : 'NAGRODY ODEBRANE'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 6 }}>
            <span style={{ ...ORB, fontSize: 10, color: '#4488ff' }}>+{fmtNum(claimResult.xp)} XP</span>
            <span style={{ ...ORB, fontSize: 10, color: '#ffd700' }}>+{fmtNum(claimResult.gold)} 🪙</span>
          </div>
          <p style={{ ...MONO, fontSize: 10, color: claimResult.item.rarity === 'legendary' ? '#ffd700' : '#cc44ff' }}>
            {claimResult.item.rarity === 'legendary'
              ? (isEn ? '✨ LEGENDARY' : '✨ LEGENDARNY')
              : (isEn ? '💜 EPIC' : '💜 EPICKI')}: {claimResult.item.emoji} {getItemName(claimResult.item, lang)}
          </p>
        </div>
      )}

      {/* Rewards info */}
      <div style={{ background: 'rgba(150,80,255,0.05)', border: '1px solid rgba(150,80,255,0.15)', padding: '8px 12px' }}>
        <p style={{ ...ORB, fontSize: 10, color: '#9955cc', marginBottom: 5 }}>{isEn ? 'DEFEAT REWARDS' : 'NAGRODY ZA POKONANIE'}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ ...MONO, fontSize: 10, color: '#4488ff' }}>+{fmtNum(Math.round(bossData.xpReward * (1 + (hero.level-1)*0.05)))} XP</span>
          <span style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>+{fmtNum(Math.round(bossData.goldReward * (1 + (hero.level-1)*0.05)))} 🪙</span>
          <span style={{ ...MONO, fontSize: 10, color: '#cc44ff' }}>{isEn ? 'Epic' : 'Epicki'} / {Math.round(bossData.id / 15 * 65)}% Legen.</span>
        </div>
      </div>

      {/* Combat log */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <p style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)' }}>{isEn ? 'COMBAT LOG' : 'LOG WALKI'}</p>
          <span style={{ ...MONO, fontSize: 10, color: '#888' }}>
            {isEn ? 'total' : 'łącznie'}: {fmtNum(totalDmg)} dmg · {participants.length} {isEn ? 'players' : 'graczy'}
          </span>
        </div>
        <div
          ref={logRef}
          style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)',
            padding: 8, maxHeight: 180, overflowY: 'auto',
          }}
        >
          {log.length === 0 ? (
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
              {isEn ? 'No one has attacked yet.' : 'Nikt jeszcze nie zaatakował.'}
            </p>
          ) : (
            log.map((line, i) => {
              const isMe = line.includes('(ty)') || line.includes('(you)');
              const isVictory = line.includes('🏆');
              return (
                <p key={i} style={{
                  ...MONO, fontSize: 10, lineHeight: 1.7,
                  color: isVictory ? '#ffd700' : isMe ? '#ff2d78' : 'var(--text-dim)',
                }}>
                  {line}
                </p>
              );
            })
          )}
          {boss.defeated && (
            <p style={{ ...ORB, fontSize: 10, color: '#ffd700', marginTop: 6, textAlign: 'center' }}>
              🏆 {isEn ? 'BOSS DEFEATED!' : 'BOSS POKONANY!'}
            </p>
          )}
        </div>
      </div>

      {/* Participants leaderboard */}
      <div>
        <p style={{ ...ORB, fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>
          {isEn ? 'DAMAGE RANKING' : 'RANKING OBRAŻEŃ'} ({participants.length})
        </p>
        {participants.length === 0 && (
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
            {isEn ? 'No one has attacked yet.' : 'Nikt jeszcze nie zaatakował.'}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {participants.map(([uid, p], idx) => {
            const pct = boss.maxHp > 0 ? (p.damage / boss.maxHp) * 100 : 0;
            const isMe = uid === user?.uid;
            return (
              <div key={uid} style={{
                background: isMe ? 'rgba(255,45,120,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isMe ? 'rgba(255,45,120,0.2)' : 'rgba(255,255,255,0.05)'}`,
                padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ ...ORB, fontSize: 10, color: idx === 0 ? '#ffd700' : idx === 1 ? '#aaaaaa' : idx === 2 ? '#cd7f32' : 'var(--text-muted)', flexShrink: 0, width: 16 }}>
                  {idx + 1}.
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ ...MONO, fontSize: 10, color: isMe ? '#ff2d78' : 'var(--text-bright)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.username} {isMe ? (isEn ? '(you)' : '(ty)') : ''}
                    </span>
                    <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', flexShrink: 0, marginLeft: 8 }}>
                      {fmtNum(p.damage)} ({pct.toFixed(2)}%)
                    </span>
                  </div>
                  <div style={{ height: 3, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, pct * 10)}%`, height: '100%',
                      background: isMe ? '#ff2d78' : '#4488ff' }} />
                  </div>
                </div>
                {p.rewardClaimed && <span style={{ fontSize: 10 }}>✅</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
