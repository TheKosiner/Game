import { useEffect, useRef, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  startGuildOperation, attackGuildEnemy, claimGuildOperationReward,
  type Guild, type GuildOperationState,
} from '../lib/cloudSync';
import { GUILD_OP_LOCATIONS } from '../data/guildOperations';
import { useGameStore } from '../store/gameStore';
import { ORB, MONO } from '../utils/styles';

const RARITY_COLOR: Record<string, string> = {
  rare: '#60a5fa', epic: '#c084fc', legendary: '#f59e0b',
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function fmtTime(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

export default function GuildOperationPanel({
  guild,
  guildId,
  myUid,
}: {
  guild: Guild;
  guildId: string;
  myUid: string;
}) {
  const [op, setOp] = useState<GuildOperationState | null>(guild.guildOperation ?? null);
  const [notification, setNotification] = useState<{ text: string; ok: boolean } | null>(null);
  const [starting, setStarting] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [now, setNow] = useState(Date.now());

  // animation
  const [shakeKey, setShakeKey]   = useState(0);
  const [hitKey, setHitKey]       = useState(0);
  const [floatDmg, setFloatDmg]   = useState<{ val: number; key: number } | null>(null);

  // combat log
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const hero    = useGameStore(s => s.hero);
  const addXp   = useGameStore(s => s.addXp);
  const addGold = useGameStore(s => s.addGold);
  const isLeader    = guild.leaderUid === myUid;
  const memberCount = Object.keys(guild.members).length;
  const myUsername  = guild.members[myUid]?.username ?? '';

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!db || !guildId) return;
    const unsub = onSnapshot(doc(db, 'guilds', guildId), snap => {
      if (!snap.exists()) return;
      const newOp = snap.data().guildOperation as GuildOperationState | null ?? null;
      setOp(prev => {
        // build log diff
        if (newOp && prev) {
          const prevParts = prev.participants ?? {};
          const newParts  = newOp.participants ?? {};
          const lines: string[] = [];
          for (const [uid, p] of Object.entries(newParts)) {
            if (!prevParts[uid]) {
              const tag = uid === myUid ? ' (ty)' : '';
              lines.push(`⚔ ${p.heroName}${tag} zadał ${fmtNum(p.damage)} dmg`);
            }
          }
          if (newOp.floor > prev.floor) {
            lines.push(`⬆ Piętro ${newOp.floor} — ${newOp.enemyName} ${newOp.enemyEmoji}`);
          }
          if (newOp.status === 'completed' && prev.status !== 'completed') {
            lines.push('🏆 RAJD UKOŃCZONY!');
          }
          if (lines.length) setLog(l => [...l, ...lines]);
        }
        return newOp;
      });
    });
    return () => unsub();
  }, [guildId]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log.length]);

  function notify(text: string, ok: boolean) {
    setNotification({ text, ok });
    setTimeout(() => setNotification(null), 3500);
  }

  async function handleStart(locationId: string) {
    setStarting(true);
    try {
      const ok = await startGuildOperation(guildId, myUid, locationId, memberCount);
      if (ok) setLog([]);
      else notify('Nie można uruchomić rajdu.', false);
    } finally { setStarting(false); }
  }

  async function handleAttack() {
    if (attacking) return;
    setAttacking(true);
    try {
      const { status, damage } = await attackGuildEnemy(
        guildId, myUid, hero.maxHp,
        { username: myUsername, heroName: hero.name },
      );
      if (status === 'cooldown')       notify('Wyczerpałeś ataki na dziś. Wróć po północy.', false);
      else if (status === 'failed')    notify('Rajd wygasł — czas minął.', false);
      else if (status === 'no_op')     notify('Brak aktywnego rajdu.', false);
      else {
        setShakeKey(k => k + 1);
        setHitKey(k => k + 1);
        setFloatDmg({ val: damage, key: Date.now() });
        if (status === 'completed')    notify(`Zadano ${fmtNum(damage)} dmg! 🏆 Rajd ukończony!`, true);
        else if (status === 'advanced')notify(`Zadano ${fmtNum(damage)} dmg! ⬆ Następne piętro!`, true);
        else if (status === 'enemy_killed') notify(`Zadano ${fmtNum(damage)} dmg! Wróg pokonany! 💀`, true);
        else notify(`Zadano ${fmtNum(damage)} dmg! 💥`, true);
      }
    } finally { setAttacking(false); }
  }

  async function handleClaim() {
    const reward = await claimGuildOperationReward(guildId, myUid);
    if (!reward) { notify('Brak nagrody do odebrania.', false); return; }
    addXp(reward.xp);
    addGold(reward.gold);
    notify(`+${reward.xp} XP  +${reward.gold} 🪙  [${reward.rarity.toUpperCase()}]`, true);
  }

  const deadline   = op?.deadline ?? 0;
  const isExpired  = deadline > 0 && deadline <= now;
  const timeLeft   = Math.max(0, deadline - now);

  const isActive    = !!op && op.status === 'active' && !isExpired;
  const isFailed    = !!op && (op.status === 'failed' || (op.status === 'active' && isExpired));
  const isCompleted = !!op && op.status === 'completed';
  const inCooldown  = isCompleted && (op.cooldownUntil ?? 0) > now;
  const canStart    = isLeader && !isActive && !inCooldown;

  const participants = op
    ? Object.entries(op.participants ?? {}).sort((a, b) => b[1].attackedAt - a[1].attackedAt)
    : [];
  const totalDmg = participants.reduce((s, [, p]) => s + p.damage, 0);

  const myEntry = op?.participants?.[myUid];
  const today = new Date(now).toISOString().split('T')[0];
  const myAtkInfo = op?.attackInfo?.[myUid];
  const attacksUsedToday = myAtkInfo?.dateStr === today ? (myAtkInfo.count ?? 0) : 0;
  const attacksLeft = Math.max(0, 5 - attacksUsedToday);
  const exhausted = attacksLeft === 0;
  const attackDmg = Math.max(1, Math.floor(hero.maxHp / 5));

  const alreadyClaimed = isCompleted && !!op.pendingReward?.claimedBy[myUid];

  const hpPct = op ? Math.max(0, (op.enemyHp / op.enemyMaxHp) * 100) : 0;
  const hpColor = hpPct > 60 ? '#44cc44' : hpPct > 30 ? '#ff9900' : '#ff4444';

  const loc = op ? GUILD_OP_LOCATIONS.find(l => l.id === op.locationId) : null;

  // ── Notification
  const notifBlock = notification && (
    <div style={{
      background: notification.ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      border: `1px solid ${notification.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
      padding: '8px 12px', textAlign: 'center',
      color: notification.ok ? '#4ade80' : '#f87171', ...ORB, fontSize: 9,
    }}>
      {notification.text}
    </div>
  );

  // ── ACTIVE FIGHT ─────────────────────────────────────────────────────────────
  if (isActive && op) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifBlock}

        {/* Enemy card */}
        <div style={{
          background: op.isBoss
            ? 'linear-gradient(135deg, rgba(40,4,4,0.97), rgba(20,2,2,0.99))'
            : 'linear-gradient(135deg, rgba(5,10,30,0.97), rgba(3,5,18,0.99))',
          border: `1px solid ${op.isBoss ? 'rgba(220,38,38,0.4)' : 'rgba(51,65,85,0.5)'}`,
          padding: '14px 12px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Enemy emoji with animations */}
          <div
            key={shakeKey}
            style={{
              flexShrink: 0, position: 'relative',
              width: 80, height: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: shakeKey > 0 ? 'bossShake 0.4s ease' : 'none',
            }}
          >
            <div key={hitKey} style={{ animation: hitKey > 0 ? 'bossHit 0.35s ease' : 'none', lineHeight: 1 }}>
              <span style={{ fontSize: 60 }}>{op.enemyEmoji}</span>
            </div>
            {floatDmg && (
              <span
                key={floatDmg.key}
                style={{
                  position: 'absolute', top: -4, right: -12,
                  ...ORB, fontSize: 11, color: '#ff4444',
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
            {/* Location + floor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>
                {loc?.emoji} {loc?.name}
              </p>
              {/* floor dots */}
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: op.maxFloors }, (_, i) => (
                  <div key={i} style={{
                    width: 7, height: 7,
                    background: i < op.floor - 1 ? '#4ade80' : i === op.floor - 1 ? '#ffd700' : 'rgba(51,65,85,0.5)',
                    border: '1px solid rgba(51,65,85,0.4)',
                  }} />
                ))}
              </div>
            </div>

            {op.isBoss && (
              <p style={{ ...ORB, fontSize: 9, color: '#f87171', marginBottom: 2 }}>⚠ BOSS</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ ...ORB, fontSize: 11, color: op.isBoss ? '#f87171' : 'var(--text-bright)' }}>
                {op.enemyName}
              </p>
              {!op.isBoss && (
                <p style={{ ...MONO, fontSize: 10, color: '#f59e0b' }}>
                  Wróg {(op.enemyInFloor ?? 0) + 1}/{op.enemiesOnFloor ?? 1}
                </p>
              )}
            </div>

            {/* HP bar */}
            <div style={{ height: 10, background: '#0a0505', border: '1px solid rgba(100,20,20,0.4)', overflow: 'hidden', borderRadius: 2, marginBottom: 4 }}>
              <div style={{
                width: `${hpPct}%`, height: '100%',
                background: hpPct > 60
                  ? 'linear-gradient(90deg,#3a8a0a,#6acc20)'
                  : hpPct > 30
                  ? 'linear-gradient(90deg,#8a4400,#ff9900)'
                  : 'linear-gradient(90deg,#660000,#ff2020)',
                transition: 'width 0.8s ease',
                boxShadow: `0 0 6px ${hpColor}55`,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ ...MONO, fontSize: 10, color: hpColor }}>
                {fmtNum(op.enemyHp)} / {fmtNum(op.enemyMaxHp)} HP
              </span>
              <span style={{ ...MONO, fontSize: 10, color: timeLeft < 3_600_000 ? '#f87171' : 'var(--text-dim)' }}>
                ⏱ {fmtTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Attack section */}
        <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ ...ORB, fontSize: 9, color: 'var(--text-dim)' }}>TWÓJ ATAK DZIŚ</span>
              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10,
                    background: i < attacksUsedToday ? '#6b7280' : '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 2,
                  }} />
                ))}
                <span style={{ ...MONO, fontSize: 9, color: exhausted ? '#6b7280' : '#f59e0b', marginLeft: 4 }}>
                  {attacksLeft}/5 pozostało
                </span>
              </div>
            </div>
            <span style={{ ...MONO, fontSize: 10, color: (myEntry?.damage ?? 0) > 0 ? '#f87171' : 'var(--text-dim)' }}>
              {(myEntry?.damage ?? 0) > 0
                ? `${fmtNum(myEntry!.damage)} dmg`
                : `−${fmtNum(attackDmg)} HP/atak`}
            </span>
          </div>
          <button
            onClick={handleAttack}
            disabled={attacking || exhausted}
            className="btn btn-danger"
            style={{
              width: '100%', fontSize: 10,
              cursor: exhausted ? 'not-allowed' : 'pointer',
              opacity: exhausted ? 0.5 : 1,
            }}
          >
            {attacking
              ? '⚔ ATAKUJĘ...'
              : exhausted
              ? '⚔ WYCZERPANY — wróć po północy'
              : `⚔ ATAKUJ! (−${fmtNum(attackDmg)} HP)`}
          </button>
        </div>

        {/* Combat log */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-dim)' }}>LOG WALKI</p>
            <span style={{ ...MONO, fontSize: 10, color: '#888' }}>
              łącznie: {fmtNum(totalDmg)} dmg · {participants.length} graczy
            </span>
          </div>
          <div
            ref={logRef}
            style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)',
              padding: 8, maxHeight: 150, overflowY: 'auto',
            }}
          >
            {log.length === 0 ? (
              <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                Nikt jeszcze nie zaatakował.
              </p>
            ) : (
              log.map((line, i) => (
                <p key={i} style={{
                  ...MONO, fontSize: 10, lineHeight: 1.7,
                  color: line.includes('(ty)') ? '#ff2d78' : line.startsWith('🏆') ? '#ffd700' : 'var(--text-dim)',
                }}>
                  {line}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Damage ranking */}
        <div>
          <p style={{ ...ORB, fontSize: 9, color: 'var(--text-dim)', marginBottom: 6 }}>
            RANKING ({participants.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {participants.map(([uid, p], idx) => {
              const pct  = op.enemyMaxHp > 0 ? (p.damage / op.enemyMaxHp) * 100 : 0;
              const isMe = uid === myUid;
              return (
                <div key={uid} style={{
                  background: isMe ? 'rgba(255,45,120,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isMe ? 'rgba(255,45,120,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ ...ORB, fontSize: 10, color: idx === 0 ? '#ffd700' : idx === 1 ? '#aaa' : idx === 2 ? '#cd7f32' : 'var(--text-muted)', flexShrink: 0, width: 16 }}>
                    {idx + 1}.
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ ...MONO, fontSize: 10, color: isMe ? '#ff2d78' : 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.heroName} {isMe ? '(ty)' : ''}
                      </span>
                      <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', flexShrink: 0, marginLeft: 8 }}>
                        {fmtNum(p.damage)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ height: 3, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, pct * 5)}%`, height: '100%', background: isMe ? '#ff2d78' : '#4488ff' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── FAILED ──────────────────────────────────────────────────────────────────
  if (isFailed && op) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifBlock}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30,5,5,0.97), rgba(18,2,2,0.99))',
          border: '1px solid rgba(200,20,20,0.3)',
          padding: '14px 12px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 28, marginBottom: 6 }}>💀</p>
          <p style={{ ...ORB, fontSize: 10, color: '#f87171', marginBottom: 4 }}>RAJD NIEUKOŃCZONY</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>
            {loc?.emoji} {loc?.name} — czas minął
          </p>
        </div>
        {participants.length > 0 && (
          <div style={{ background: 'rgba(5,10,25,0.6)', border: '1px solid rgba(51,65,85,0.4)', padding: '8px 10px' }}>
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-muted)', marginBottom: 6 }}>WKŁAD FINALNY</p>
            {participants.map(([uid, p]) => (
              <div key={uid} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ ...MONO, fontSize: 11, color: uid === myUid ? '#ffd700' : 'var(--text-dim)' }}>
                  {uid === myUid ? '▶ ' : ''}{p.heroName}
                </span>
                <span style={{ ...MONO, fontSize: 11, color: '#f87171' }}>{fmtNum(p.damage)} dmg</span>
              </div>
            ))}
          </div>
        )}
        {isLeader && (
          <button onClick={() => setOp(null)} className="btn btn-secondary" style={{ fontSize: 10 }}>
            ▶ NOWY RAJD
          </button>
        )}
      </div>
    );
  }

  // ── REWARD PHASE ────────────────────────────────────────────────────────────
  if (isCompleted && op) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifBlock}
        <div style={{
          background: 'linear-gradient(135deg, rgba(10,40,10,0.97), rgba(5,25,5,0.99))',
          border: '1px solid rgba(68,200,68,0.4)',
          padding: '14px 12px', textAlign: 'center',
          boxShadow: '0 0 20px rgba(68,200,68,0.1)',
        }}>
          <p style={{ fontSize: 28, marginBottom: 6 }}>🏆</p>
          <p style={{ ...ORB, fontSize: 10, color: '#44cc44', marginBottom: 4 }}>RAJD UKOŃCZONY!</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
            {loc?.emoji} {loc?.name}
          </p>
          {op.pendingReward && (
            <div style={{ background: 'rgba(10,25,10,0.7)', border: '1px solid rgba(34,197,94,0.25)', padding: '8px 12px', marginBottom: 10 }}>
              <p style={{ ...MONO, fontSize: 12, color: '#4ade80' }}>
                +{op.pendingReward.xp} XP &nbsp;·&nbsp; +{op.pendingReward.gold} 🪙
              </p>
              <p style={{ ...MONO, fontSize: 11, color: RARITY_COLOR[op.pendingReward.rarity] ?? '#aaa', marginTop: 4 }}>
                Item: [{op.pendingReward.rarity.toUpperCase()}]
              </p>
            </div>
          )}
          {alreadyClaimed ? (
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-muted)' }}>✓ Nagrodę odebrano</p>
          ) : (
            <button onClick={handleClaim} className="btn btn-primary" style={{ fontSize: 10, padding: '8px 16px' }}>
              🎁 ODBIERZ NAGRODĘ
            </button>
          )}
        </div>

        {participants.length > 0 && (
          <div>
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-dim)', marginBottom: 6 }}>RANKING</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {participants.sort((a, b) => b[1].damage - a[1].damage).map(([uid, p], idx) => {
                const isMe = uid === myUid;
                return (
                  <div key={uid} style={{
                    background: isMe ? 'rgba(255,45,120,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isMe ? 'rgba(255,45,120,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ ...MONO, fontSize: 10, color: isMe ? '#ff2d78' : 'var(--text-bright)' }}>
                      {idx + 1}. {p.heroName} {isMe ? '(ty)' : ''}
                    </span>
                    <span style={{ ...MONO, fontSize: 10, color: '#f87171' }}>{fmtNum(p.damage)} dmg</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {inCooldown && (
          <div style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(51,65,85,0.5)', padding: '8px 10px', textAlign: 'center' }}>
            <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>
              ⏳ Następny rajd za: {fmtTime(Math.max(0, op.cooldownUntil - now))}
            </p>
          </div>
        )}
        {!inCooldown && isLeader && (
          <button onClick={() => setOp(null)} className="btn btn-secondary" style={{ fontSize: 10 }}>
            ▶ NOWY RAJD
          </button>
        )}
      </div>
    );
  }

  // ── LOCATION SELECTION ───────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notifBlock}
      <p style={{ ...ORB, fontSize: 9, color: 'var(--gold-main)', marginBottom: 4 }}>WYBIERZ LOKACJĘ</p>
      <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
        Trudność skaluje się z liczbą członków ({memberCount}).
        {!isLeader && ' Tylko władca może uruchomić rajd.'}
      </p>
      <p style={{ ...MONO, fontSize: 10, color: '#f59e0b', marginBottom: 6 }}>
        ⚡ Każdy atakuje raz dziennie całym swoim HP. Rajd kończy się o północy (UTC).
      </p>

      {GUILD_OP_LOCATIONS.map(location => {
        const rarColor = RARITY_COLOR[location.finalRarity] ?? '#aaa';
        return (
          <div key={location.id} style={{
            background: 'rgba(5,10,25,0.8)',
            border: `1px solid ${rarColor}33`,
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <p style={{ ...ORB, fontSize: 9, color: rarColor }}>
                  {location.emoji} {location.name}
                </p>
                <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {location.floors} pięter · [{location.finalRarity.toUpperCase()}]
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ ...MONO, fontSize: 10, color: '#4ade80' }}>+{location.baseXpPerFloor * location.floors}+ XP</p>
                <p style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>+{location.baseGoldPerFloor * location.floors}+ 🪙</p>
              </div>
            </div>
            <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
              {location.description}
            </p>
            {canStart && (
              <button
                onClick={() => handleStart(location.id)}
                disabled={starting}
                className="btn btn-primary"
                style={{ fontSize: 9, padding: '6px 10px', width: '100%' }}
              >
                ▶ ROZPOCZNIJ
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
