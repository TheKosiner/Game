import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { GUILD_BOSSES } from '../data/guildBosses';
import {
  subscribeToBoss, ensureBossActive, attackGuildBoss, claimBossReward,
  calcGuildBossDamage, BOSS_DURATION_MS,
  type GuildBossState,
} from '../lib/guildBoss';
import { generateItem } from '../data/itemGenerator';
import { syncToCloud } from '../lib/cloudSync';

const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;
const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function fmtTime(ms: number): string {
  if (ms <= 0) return 'CZAS MINĄŁ';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

export default function GuildBossPanel({ guildId, username }: { guildId: string; username: string }) {
  const hero = useGameStore(s => s.hero);
  const user = useAuthStore(s => s.user);
  const [boss, setBoss] = useState<GuildBossState | null | 'loading'>('loading');
  const [now, setNow] = useState(Date.now());
  const [attacking, setAttacking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [lastResult, setLastResult] = useState<{ damage: number } | null>(null);
  const [claimResult, setClaimResult] = useState<{ xp: number; gold: number; item: ReturnType<typeof generateItem> } | null>(null);
  const initialized = useRef(false);

  // tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ensure boss exists, then subscribe
  useEffect(() => {
    if (!guildId || initialized.current) return;
    initialized.current = true;

    ensureBossActive(guildId).catch(() => {});
    const unsub = subscribeToBoss(guildId, b => setBoss(b));
    return unsub;
  }, [guildId]);

  if (boss === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>Ładowanie bossa...</p>
      </div>
    );
  }

  if (!boss) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>Brak aktywnego bossa.</p>
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

  // Next reset time
  const nextResetLabel = boss.defeated && boss.defeatedAt
    ? `Następny boss za: ${fmtTime(boss.defeatedAt + BOSS_DURATION_MS - now)}`
    : isExpired ? 'Reset za chwilę...'
    : null;

  async function handleAttack() {
    if (!user || attacking || alreadyAttackedToday || boss === 'loading' || !boss) return;
    setAttacking(true);
    try {
      const res = await attackGuildBoss(guildId, user.uid, username, hero);
      if (res.success) {
        setLastResult({ damage: res.damage });
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

      {/* Boss header */}
      <div style={{
        background: boss.defeated
          ? 'linear-gradient(135deg, rgba(10,40,10,0.97), rgba(5,25,5,0.99))'
          : isExpired
          ? 'linear-gradient(135deg, rgba(30,15,5,0.97), rgba(20,10,3,0.99))'
          : 'linear-gradient(135deg, rgba(30,4,4,0.97), rgba(18,2,2,0.99))',
        border: `1px solid ${boss.defeated ? 'rgba(68,200,68,0.3)' : isExpired ? 'rgba(200,120,20,0.3)' : 'rgba(200,20,20,0.3)'}`,
        padding: '14px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 52, lineHeight: 1 }}>{bossData.emoji}</span>
        <div>
          <p style={{ ...ORB, fontSize: 11, color: boss.defeated ? '#44cc44' : '#ff4444', marginBottom: 4,
            textShadow: `0 0 12px ${boss.defeated ? '#44cc44' : '#ff4444'}` }}>
            {bossData.name}
          </p>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', maxWidth: 260, margin: '0 auto' }}>
            {bossData.description}
          </p>
        </div>

        {/* Status badge */}
        {boss.defeated && (
          <span style={{ ...ORB, fontSize: 7, background: 'rgba(68,200,68,0.15)',
            border: '1px solid rgba(68,200,68,0.4)', color: '#44cc44',
            padding: '3px 10px', borderRadius: 2 }}>
            ✅ POKONANY
          </span>
        )}
        {isExpired && !boss.defeated && (
          <span style={{ ...ORB, fontSize: 7, background: 'rgba(200,120,20,0.15)',
            border: '1px solid rgba(200,120,20,0.4)', color: '#e08030',
            padding: '3px 10px', borderRadius: 2 }}>
            ⏰ CZAS MINĄŁ — RESET...
          </span>
        )}
      </div>

      {/* HP bar */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ ...ORB, fontSize: 7, color: '#ff4444' }}>HP BOSSA</span>
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>
            {fmtNum(boss.currentHp)} / {fmtNum(boss.maxHp)}
          </span>
        </div>
        <div style={{ height: 12, background: '#1a0505', border: '1px solid rgba(100,20,20,0.4)', overflow: 'hidden', borderRadius: 2 }}>
          <div style={{
            width: `${hpPct}%`, height: '100%',
            background: hpPct > 50 ? 'linear-gradient(90deg,#6a1010,#cc2020)'
              : hpPct > 20 ? 'linear-gradient(90deg,#8a2000,#ff6000)'
              : 'linear-gradient(90deg,#660000,#ff0000)',
            transition: 'width 0.8s ease',
            boxShadow: `0 0 8px rgba(255,${hpPct > 50 ? 30 : hpPct > 20 ? 100 : 0},0,0.5)`,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ ...MONO, fontSize: 9, color: '#888' }}>
            Zadano łącznie: {fmtNum(totalDmg)}
          </span>
          {!boss.defeated && !isExpired && (
            <span style={{ ...MONO, fontSize: 9, color: timeLeft < 3_600_000 ? '#ff6030' : 'var(--text-dim)' }}>
              ⏱ {fmtTime(timeLeft)}
            </span>
          )}
          {nextResetLabel && (
            <span style={{ ...MONO, fontSize: 9, color: '#888' }}>{nextResetLabel}</span>
          )}
        </div>
      </div>

      {/* Claim reward */}
      {canClaim && !claimResult && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(10,40,10,0.97), rgba(5,25,5,0.99))',
          border: '1px solid rgba(68,200,68,0.4)',
          padding: '12px', textAlign: 'center',
          boxShadow: '0 0 16px rgba(68,200,68,0.1)',
        }}>
          <p style={{ ...ORB, fontSize: 8, color: '#44cc44', marginBottom: 6 }}>🏆 BOSS POKONANY — NAGRODA CZEKA!</p>
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', marginBottom: 10 }}>
            Twój udział: {fmtNum(myDamage)} obrażeń
          </p>
          <button onClick={handleClaim} disabled={claiming} className="btn btn-primary"
            style={{ width: '100%', fontSize: 7, borderColor: 'rgba(68,200,68,0.5)', background: 'rgba(68,200,68,0.15)' }}>
            {claiming ? '...' : '🎁 ODBIERZ NAGRODĘ'}
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
          <p style={{ ...ORB, fontSize: 8, color: '#cc88ff', marginBottom: 8 }}>✨ NAGRODY ODEBRANE</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 6 }}>
            <span style={{ ...ORB, fontSize: 9, color: '#4488ff' }}>+{fmtNum(claimResult.xp)} XP</span>
            <span style={{ ...ORB, fontSize: 9, color: '#ffd700' }}>+{fmtNum(claimResult.gold)} 🪙</span>
          </div>
          <p style={{ ...MONO, fontSize: 10, color: claimResult.item.rarity === 'legendary' ? '#ffd700' : '#cc44ff' }}>
            {claimResult.item.rarity === 'legendary' ? '✨ LEGENDARNY' : '💜 EPICKI'}: {claimResult.item.emoji} {claimResult.item.name}
          </p>
        </div>
      )}

      {/* Attack section */}
      {!boss.defeated && !isExpired && (
        <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ ...ORB, fontSize: 7, color: 'var(--text-dim)' }}>TWÓJ ATAK DZIŚ</span>
            <span style={{ ...MONO, fontSize: 10, color: alreadyAttackedToday ? '#44cc44' : 'var(--text-dim)' }}>
              {alreadyAttackedToday ? `✅ ${fmtNum(myDamage)} dmg` : `~${fmtNum(estimatedDmg)} dmg`}
            </span>
          </div>
          {lastResult && (
            <p style={{ ...ORB, fontSize: 7, color: '#ff6060', marginBottom: 6, textAlign: 'center' }}>
              ⚔ Zadałeś {fmtNum(lastResult.damage)} obrażeń!
            </p>
          )}
          <button
            onClick={handleAttack}
            disabled={attacking || alreadyAttackedToday}
            className="btn btn-danger"
            style={{ width: '100%', fontSize: 7, cursor: alreadyAttackedToday ? 'not-allowed' : 'pointer',
              opacity: alreadyAttackedToday ? 0.5 : 1 }}>
            {attacking ? '...' : alreadyAttackedToday ? '⚔ JUŻ ZAATAKOWAŁEŚ DZIŚ' : '⚔ ATAKUJ BOSSA'}
          </button>
        </div>
      )}

      {/* Rewards info */}
      <div style={{ background: 'rgba(150,80,255,0.05)', border: '1px solid rgba(150,80,255,0.15)', padding: '8px 12px' }}>
        <p style={{ ...ORB, fontSize: 6, color: '#9955cc', marginBottom: 5 }}>NAGRODY ZA POKONANIE</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ ...MONO, fontSize: 9, color: '#4488ff' }}>+{fmtNum(Math.round(bossData.xpReward * (1 + (hero.level-1)*0.05)))} XP</span>
          <span style={{ ...MONO, fontSize: 9, color: '#ffd700' }}>+{fmtNum(Math.round(bossData.goldReward * (1 + (hero.level-1)*0.05)))} 🪙</span>
          <span style={{ ...MONO, fontSize: 9, color: '#cc44ff' }}>Epicki / {Math.round(bossData.id / 15 * 65)}% Legen.</span>
        </div>
      </div>

      {/* Participants */}
      <div>
        <p style={{ ...ORB, fontSize: 7, color: 'var(--text-dim)', marginBottom: 6 }}>
          UCZESTNICY ({participants.length})
        </p>
        {participants.length === 0 && (
          <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
            Nikt jeszcze nie zaatakował.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {participants.map(([uid, p]) => {
            const pct = boss.maxHp > 0 ? (p.damage / boss.maxHp) * 100 : 0;
            const isMe = uid === user?.uid;
            return (
              <div key={uid} style={{
                background: isMe ? 'rgba(255,45,120,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isMe ? 'rgba(255,45,120,0.2)' : 'rgba(255,255,255,0.05)'}`,
                padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ ...MONO, fontSize: 9, color: isMe ? '#ff2d78' : 'var(--text-bright)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.heroName} {isMe ? '(ty)' : ''}
                    </span>
                    <span style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', flexShrink: 0, marginLeft: 8 }}>
                      {fmtNum(p.damage)} dmg ({pct.toFixed(1)}%)
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
