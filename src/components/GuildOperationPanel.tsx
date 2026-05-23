import { useEffect, useRef, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  startGuildOperation, attackGuildEnemy, claimGuildOperationReward,
  MAX_GUILD_ATTACKS_PER_DAY,
  type Guild, type GuildOperationState,
} from '../lib/cloudSync';
import { GUILD_OP_LOCATIONS } from '../data/guildOperations';
import { useGameStore } from '../store/gameStore';
import { ORB, MONO } from '../utils/styles';

const RARITY_COLOR: Record<string, string> = {
  rare: '#60a5fa', epic: '#c084fc', legendary: '#f59e0b',
};

const LOG_COLORS = {
  kill:    '#f87171',
  hit:     '#86efac',
  me:      '#ff2d78',
  floor:   '#ffd700',
  done:    '#4ade80',
  enemy:   '#fb923c',
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

  const [log, setLog] = useState<{ text: string; type: keyof typeof LOG_COLORS }[]>([]);
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
        if (newOp && prev) {
          const prevParts = prev.participants ?? {};
          const newParts  = newOp.participants ?? {};
          const lines: { text: string; type: keyof typeof LOG_COLORS }[] = [];
          for (const [uid, p] of Object.entries(newParts)) {
            if (uid === myUid) continue; // own attacks logged locally in handleAttack
            if (!prevParts[uid] || p.attackedAt !== prevParts[uid].attackedAt) {
              const dmgDelta = p.damage - (prevParts[uid]?.damage ?? 0);
              lines.push({ text: `⚔ ${p.heroName} → ${fmtNum(dmgDelta)} dmg`, type: 'hit' });
            }
          }
          if (newOp.enemyInFloor > (prev.enemyInFloor ?? 0) && newOp.floor === prev.floor) {
            lines.push({ text: `💀 ${prev.enemyName} pokonany!`, type: 'kill' });
          }
          if (newOp.floor > prev.floor) {
            lines.push({ text: `⬆ Piętro ${newOp.floor} — ${newOp.enemyName} ${newOp.enemyEmoji}`, type: 'floor' });
          }
          if (newOp.status === 'completed' && prev.status !== 'completed') {
            lines.push({ text: '🏆 OPERACJA UKOŃCZONA!', type: 'done' });
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
      else notify('Nie można uruchomić operacji.', false);
    } finally { setStarting(false); }
  }

  async function handleAttack() {
    if (attacking || !op) return;
    setAttacking(true);
    const enemyNameSnap  = op.enemyName;
    const enemyEmojiSnap = op.enemyEmoji;
    const enemyMaxHpSnap = op.enemyMaxHp;
    try {
      const { status, damage, attacksLeft } = await attackGuildEnemy(
        guildId, myUid, hero.maxHp,
        { username: myUsername, heroName: hero.name },
      );
      if (status === 'cooldown') {
        notify(`Wyczerpałeś ${MAX_GUILD_ATTACKS_PER_DAY} ataków na dziś!`, false);
      } else if (status === 'failed') {
        notify('Operacja wygasła — czas minął.', false);
      } else if (status === 'no_op') {
        notify('Brak aktywnej operacji.', false);
      } else {
        const counterDmg = Math.max(1, Math.round(enemyMaxHpSnap / 18 * (0.7 + Math.random() * 0.6)));
        const newLines: { text: string; type: keyof typeof LOG_COLORS }[] = [
          { text: `⚔ Ty (${hero.name}) → ${fmtNum(damage)} dmg na ${enemyNameSnap} ${enemyEmojiSnap}`, type: 'me' },
          { text: `💥 ${enemyNameSnap} kontruje: −${fmtNum(counterDmg)} HP`, type: 'enemy' },
        ];
        if (status === 'enemy_killed')  newLines.push({ text: `💀 ${enemyNameSnap} pokonany!`, type: 'kill' });
        if (status === 'advanced')      newLines.push({ text: `⬆ Przejście na następne piętro!`, type: 'floor' });
        if (status === 'completed')     newLines.push({ text: `🏆 OPERACJA UKOŃCZONA!`, type: 'done' });
        setLog(l => [...l, ...newLines]);
        const leftMsg = attacksLeft > 0 ? ` (${attacksLeft} ataków zostało)` : ' (limit na dziś)';
        notify(`+${fmtNum(damage)} dmg!${leftMsg}`, true);
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
    ? Object.entries(op.participants ?? {}).sort((a, b) => b[1].damage - a[1].damage)
    : [];
  const totalDmg = participants.reduce((s, [, p]) => s + p.damage, 0);

  const myEntry = op?.participants?.[myUid];
  const today = new Date(now).toISOString().split('T')[0];
  const attacksUsedToday = myEntry
    ? (new Date(myEntry.attackedAt).toISOString().split('T')[0] === today ? (myEntry.attacksToday ?? 0) : 0)
    : 0;
  const attacksLeft = MAX_GUILD_ATTACKS_PER_DAY - attacksUsedToday;
  const attackedToday = attacksLeft <= 0;

  const alreadyClaimed = isCompleted && !!op.pendingReward?.claimedBy[myUid];
  const loc = op ? GUILD_OP_LOCATIONS.find(l => l.id === op.locationId) : null;

  const hpPct   = op ? Math.max(0, (op.enemyHp / op.enemyMaxHp) * 100) : 0;

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
    const enemyIdx   = op.enemyInFloor  ?? 0;
    const enemyTotal = op.enemiesOnFloor ?? 1;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifBlock}

        {/* Floor header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--gold-main)' }}>
            {loc?.emoji} {loc?.name}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
            <span style={{ ...MONO, fontSize: 9, color: timeLeft < 3_600_000 ? '#f87171' : 'var(--text-dim)' }}>
              ⏱ {fmtTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Enemy card — DungeonPanel style */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(20,5,5,0.97), rgba(14,4,4,0.99))',
          border: '1px solid rgba(100,30,30,0.6)',
          padding: 10,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 60, lineHeight: 1, flexShrink: 0 }}>{op.enemyEmoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ ...MONO, fontSize: 11, color: '#c05050', marginBottom: 3 }}>{op.enemyName}</p>
              <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', marginBottom: 6 }}>
                Piętro {op.floor} · Wróg {enemyIdx + 1}/{enemyTotal}
              </p>
              <p style={{ ...MONO, fontSize: 10, color: '#903040' }}>
                {fmtNum(op.enemyHp)} / {fmtNum(op.enemyMaxHp)} HP
              </p>
            </div>
          </div>
          <div className="pixel-bar">
            <div className="pixel-bar-fill" style={{
              width: `${hpPct}%`,
              background: 'linear-gradient(90deg, #5a0e0e, #b83030)',
            }} />
          </div>
        </div>

        {/* Your contribution */}
        <div style={{
          background: 'var(--bg-inset)', border: '1px solid var(--border-dark)',
          padding: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>
              {hero.name}
            </span>
            <span style={{ ...MONO, fontSize: 10, color: attackedToday ? '#f87171' : '#86efac' }}>
              {attacksUsedToday}/{MAX_GUILD_ATTACKS_PER_DAY} ataków · {fmtNum(myEntry?.damage ?? 0)} dmg łącznie
            </span>
          </div>
          <div className="pixel-bar">
            <div className="pixel-bar-fill" style={{
              width: `${(attacksUsedToday / MAX_GUILD_ATTACKS_PER_DAY) * 100}%`,
              background: attackedToday
                ? 'linear-gradient(90deg, #7f1d1d, #dc2626)'
                : 'linear-gradient(90deg, #1e40af, #3b82f6)',
            }} />
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={handleAttack}
          disabled={attacking || attackedToday}
          className="btn btn-primary"
          style={{
            width: '100%', fontSize: 10,
            opacity: attackedToday ? 0.5 : 1,
            cursor: attackedToday ? 'not-allowed' : 'pointer',
          }}
        >
          {attacking
            ? '⚔ Atakuję...'
            : attackedToday
            ? `✓ Wyczerpano ${MAX_GUILD_ATTACKS_PER_DAY}/${MAX_GUILD_ATTACKS_PER_DAY} ataków — wróć jutro`
            : `⚔ Atakuj! [${attacksLeft}/${MAX_GUILD_ATTACKS_PER_DAY}] (−${fmtNum(Math.round(hero.maxHp / MAX_GUILD_ATTACKS_PER_DAY))} HP)`}
        </button>

        {/* Combat log */}
        <div
          ref={logRef}
          className="combat-log"
        >
          {log.length === 0 ? (
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
              Nikt jeszcze nie zaatakował.
            </p>
          ) : (
            log.map((entry, i) => (
              <p key={i} style={{ color: LOG_COLORS[entry.type], marginBottom: 1 }}>
                {entry.text}
              </p>
            ))
          )}
        </div>

        {/* Damage ranking */}
        {participants.length > 0 && (
          <div>
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-dim)', marginBottom: 5 }}>
              WKŁAD ({participants.length}) · łącznie: {fmtNum(totalDmg)} dmg
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {participants.map(([uid, p], idx) => {
                const pct  = totalDmg > 0 ? (p.damage / totalDmg) * 100 : 0;
                const isMe = uid === myUid;
                return (
                  <div key={uid} style={{
                    background: isMe ? 'rgba(255,45,120,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isMe ? 'rgba(255,45,120,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ ...MONO, fontSize: 9, color: idx === 0 ? '#ffd700' : 'var(--text-muted)', width: 14, flexShrink: 0 }}>
                      {idx + 1}.
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ ...MONO, fontSize: 10, color: isMe ? '#ff2d78' : 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.heroName}{isMe ? ' (ty)' : ''}
                        </span>
                        <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', flexShrink: 0, marginLeft: 8 }}>
                          {fmtNum(p.damage)}
                        </span>
                      </div>
                      <div style={{ height: 3, background: '#111', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isMe ? '#ff2d78' : '#4488ff' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
          <p style={{ ...ORB, fontSize: 10, color: '#f87171', marginBottom: 4 }}>OPERACJA NIEUKOŃCZONA</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>
            {loc?.emoji} {loc?.name} — czas minął
          </p>
        </div>
        {participants.length > 0 && (
          <div style={{ background: 'rgba(5,10,25,0.6)', border: '1px solid rgba(51,65,85,0.4)', padding: '8px 10px' }}>
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-muted)', marginBottom: 6 }}>WKŁAD</p>
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
            ▶ NOWA OPERACJA
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
          <p style={{ ...ORB, fontSize: 10, color: '#44cc44', marginBottom: 4 }}>OPERACJA UKOŃCZONA!</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
            {loc?.emoji} {loc?.name}
          </p>
          {op.pendingReward && (
            <div style={{ background: 'rgba(10,25,10,0.7)', border: '1px solid rgba(34,197,94,0.25)', padding: '8px 12px', marginBottom: 10 }}>
              <p style={{ ...MONO, fontSize: 12, color: '#4ade80' }}>
                +{op.pendingReward.xp} XP &nbsp;·&nbsp; +{op.pendingReward.gold} 🪙
              </p>
              <p style={{ ...MONO, fontSize: 11, color: RARITY_COLOR[op.pendingReward.rarity] ?? '#aaa', marginTop: 4 }}>
                [{op.pendingReward.rarity.toUpperCase()}]
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
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-dim)', marginBottom: 5 }}>RANKING</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {participants.map(([uid, p], idx) => {
                const isMe = uid === myUid;
                return (
                  <div key={uid} style={{
                    background: isMe ? 'rgba(255,45,120,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isMe ? 'rgba(255,45,120,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ ...MONO, fontSize: 10, color: isMe ? '#ff2d78' : 'var(--text-bright)' }}>
                      {idx + 1}. {p.heroName}{isMe ? ' (ty)' : ''}
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
              ⏳ Następna operacja za: {fmtTime(Math.max(0, op.cooldownUntil - now))}
            </p>
          </div>
        )}
        {!inCooldown && isLeader && (
          <button onClick={() => setOp(null)} className="btn btn-secondary" style={{ fontSize: 10 }}>
            ▶ NOWA OPERACJA
          </button>
        )}
      </div>
    );
  }

  // ── LOCATION SELECTION ───────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notifBlock}
      <p style={{ ...ORB, fontSize: 9, color: 'var(--gold-main)', marginBottom: 2 }}>WYBIERZ OPERACJĘ</p>
      <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
        Trudność skaluje się z liczbą członków ({memberCount}).
        {!isLeader && ' Tylko władca może uruchomić operację.'}
      </p>
      <p style={{ ...MONO, fontSize: 10, color: '#f59e0b', marginBottom: 6 }}>
        ⚡ Każdy atakuje raz dziennie swoim pełnym HP. Operacja musi zakończyć się przed północą (UTC).
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
                  {location.floors} pięter · {location.enemiesPerFloor} wrogów/piętro · [{location.finalRarity.toUpperCase()}]
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
