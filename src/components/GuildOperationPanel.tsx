import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  startGuildOperation, attackGuildEnemy, claimGuildOperationReward, setKnockedOut,
  type Guild, type GuildOperationState,
} from '../lib/cloudSync';
import { GUILD_OP_LOCATIONS } from '../data/guildOperations';
import { createMysteryBox } from '../data/mysteryBoxes';
import { getHeroAttack, rollDamage } from '../utils/combat';
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
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => GUILD_OP_LOCATIONS[0].id);

  const [log, setLog] = useState<{ text: string; type: keyof typeof LOG_COLORS }[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [autoFight, setAutoFight] = useState(false);
  const attackingRef = useRef(false);

  // Local combat HP — arena-style: starts at maxHp, drains during raid, never touches hero.hp.
  // Starts at 0 if the player was already knocked out in this operation (handles re-navigation).
  const [raidHp, setRaidHp] = useState(() => {
    if (guild.guildOperation?.participants?.[myUid]?.knockedOut) return 0;
    return useGameStore.getState().hero.maxHp;
  });
  const raidHpRef = useRef(raidHp);

  const hero           = useGameStore(s => s.hero);
  const addXp          = useGameStore(s => s.addXp);
  const addGold        = useGameStore(s => s.addGold);
  const addToInventory = useGameStore(s => s.addToInventory);
  const isLeader         = guild.leaderUid === myUid;
  const isLeaderOrOfficer = isLeader || guild.members[myUid]?.role === 'officer';
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
              lines.push({ text: `⚔ ${p.username} → ${fmtNum(dmgDelta)} dmg`, type: 'hit' });
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

  async function handleStart() {
    setStarting(true);
    try {
      const ok = await startGuildOperation(guildId, myUid, hero.level, memberCount, selectedLocationId);
      if (ok) setLog([]);
      else notify('Nie można uruchomić operacji.', false);
    } finally { setStarting(false); }
  }

  const handleAttack = useCallback(async () => {
    if (attackingRef.current) return;
    const currentOp = op;
    const currentHero = useGameStore.getState().hero;
    if (!currentOp || raidHpRef.current <= 0) return;

    attackingRef.current = true;
    setAttacking(true);

    const locData = GUILD_OP_LOCATIONS.find(l => l.id === currentOp.locationId);
    const heroDamage = Math.max(1, rollDamage(getHeroAttack(currentHero)));
    const enemyBaseDmg = Math.max(3, Math.round(
      (locData?.baseHpPerMember ?? 40) * (1 + (currentOp.floor - 1) * 0.18) * 0.38,
    ));
    const enemyDmg = Math.max(1, Math.round(enemyBaseDmg * (0.7 + Math.random() * 0.6)));

    try {
      const { status, damage } = await attackGuildEnemy(
        guildId, myUid, heroDamage, currentHero.maxHp,
        { username: myUsername, heroName: currentHero.name },
      );
      if (status === 'failed') {
        notify('Operacja wygasła — czas minął.', false);
        setAutoFight(false);
      } else if (status === 'no_op') {
        notify('Brak aktywnej operacji.', false);
        setAutoFight(false);
      } else {
        const newRaidHp = Math.max(0, raidHpRef.current - enemyDmg);
        raidHpRef.current = newRaidHp;
        setRaidHp(newRaidHp);
        const newLines: { text: string; type: keyof typeof LOG_COLORS }[] = [
          { text: `⚔ Ty → ${fmtNum(damage)} dmg na ${currentOp.enemyName}`, type: 'me' },
          { text: `💥 ${currentOp.enemyName} → −${fmtNum(enemyDmg)} HP`, type: 'enemy' },
        ];
        setLog(l => [...l, ...newLines]);
        if (newRaidHp <= 0) {
          setLog(l => [...l, { text: `💀 ${currentHero.name} pokonany! Nie możesz już atakować w tej operacji.`, type: 'kill' }]);
          setAutoFight(false);
          setKnockedOut(guildId, myUid).catch(() => {});
        }
        if (status === 'completed') setAutoFight(false);
      }
    } finally {
      attackingRef.current = false;
      setAttacking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op, guildId, myUid, myUsername]);

  useEffect(() => {
    if (!autoFight) return;
    const id = setInterval(() => {
      if (!attackingRef.current) handleAttack();
    }, 500);
    return () => clearInterval(id);
  }, [autoFight, handleAttack]);

  // Reset local combat HP when a new operation starts
  useEffect(() => {
    if (!op?.startedAt) return;
    const maxHp = useGameStore.getState().hero.maxHp;
    raidHpRef.current = maxHp;
    setRaidHp(maxHp);
    setLog([]);
  }, [op?.startedAt]);

  // Sync knocked-out state arriving from Firestore (e.g. after a page re-open)
  useEffect(() => {
    if (op?.participants?.[myUid]?.knockedOut && raidHpRef.current > 0) {
      raidHpRef.current = 0;
      setRaidHp(0);
      setAutoFight(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op?.participants?.[myUid]?.knockedOut]);

  async function handleClaim() {
    const reward = await claimGuildOperationReward(guildId, myUid);
    if (!reward) { notify('Brak nagrody do odebrania.', false); return; }
    addXp(reward.xp);
    addGold(reward.gold);
    const opLoc = GUILD_OP_LOCATIONS.find(l => l.id === op?.locationId);
    const boxLevel = opLoc?.minLevel ?? hero.level;
    const box = createMysteryBox(reward.rarity as 'rare' | 'epic' | 'legendary', boxLevel);
    addToInventory(box);
    notify(`+${reward.xp} XP  +${reward.gold} 🪙  📦 ${box.name}!`, true);
  }

  const deadline   = op?.deadline ?? 0;
  const isExpired  = deadline > 0 && deadline <= now;
  const timeLeft   = Math.max(0, deadline - now);

  const isActive    = !!op && op.status === 'active' && !isExpired;
  const isFailed    = !!op && (op.status === 'failed' || (op.status === 'active' && isExpired));
  const isCompleted = !!op && op.status === 'completed';
  const inCooldown  = isCompleted && (op.cooldownUntil ?? 0) > now;
  const canStart    = isLeaderOrOfficer && !isActive && !inCooldown;

  const participants = useMemo(
    () => op ? Object.entries(op.participants ?? {}).sort((a, b) => b[1].damage - a[1].damage) : [],
    [op],
  );
  const totalDmg = useMemo(
    () => participants.reduce((s, [, p]) => s + p.damage, 0),
    [participants],
  );

  const isDead          = raidHp <= 0;
  const hpPctHero  = hero.maxHp > 0 ? Math.max(0, (raidHp / hero.maxHp) * 100) : 0;

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
                Piętro {op.floor}/{op.maxFloors} · Wróg {enemyIdx + 1}/{enemyTotal}
                {loc?.minLevel ? ` · POZ. ${loc.minLevel}+` : ''}
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

        {/* Hero combat HP (local, like arena — doesn't affect real hero HP) */}
        <div style={{
          background: 'var(--bg-inset)',
          border: `1px solid ${isDead ? 'rgba(239,68,68,0.4)' : 'var(--border-dark)'}`,
          padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ ...MONO, fontSize: 10, color: isDead ? '#f87171' : 'var(--text-dim)' }}>
              {isDead ? '💀' : '❤'} {hero.name}
            </span>
            <span style={{ ...MONO, fontSize: 10, color: isDead ? '#f87171' : '#86efac' }}>
              {fmtNum(raidHp)} / {fmtNum(hero.maxHp)} HP
            </span>
          </div>
          <div className="pixel-bar">
            <div className="pixel-bar-fill" style={{
              width: `${hpPctHero}%`,
              background: hpPctHero > 50
                ? 'linear-gradient(90deg, #166534, #22c55e)'
                : hpPctHero > 25
                ? 'linear-gradient(90deg, #92400e, #f59e0b)'
                : 'linear-gradient(90deg, #7f1d1d, #dc2626)',
            }} />
          </div>
        </div>

        {/* Buttons */}
        {isDead ? (
          <div style={{
            background: 'rgba(30,5,5,0.9)', border: '1px solid rgba(239,68,68,0.3)',
            padding: '10px 12px', textAlign: 'center',
          }}>
            <p style={{ ...MONO, fontSize: 10, color: '#f87171', marginBottom: 2 }}>
              💀 Pokonany!
            </p>
            <p style={{ ...MONO, fontSize: 9, color: 'rgba(248,113,113,0.6)' }}>
              Nie możesz już atakować w tej operacji.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleAttack}
              disabled={attacking}
              className="btn btn-primary"
              style={{ flex: 1, fontSize: 10 }}
            >
              {attacking ? '⚔ Atakuję...' : '⚔ Atakuj!'}
            </button>
            <button
              onClick={() => setAutoFight(f => !f)}
              className={autoFight ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: 10, padding: '0 10px', minWidth: 80 }}
            >
              {autoFight ? '⏹ Stop' : '▶ Auto'}
            </button>
          </div>
        )}

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
                          {p.username}{isMe ? ' (ty)' : ''}
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
                  {uid === myUid ? '▶ ' : ''}{p.username}
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
                      {idx + 1}. {p.username}{isMe ? ' (ty)' : ''}
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

  // ── START SCREEN ─────────────────────────────────────────────────────────────
  const selectedLoc = GUILD_OP_LOCATIONS.find(l => l.id === selectedLocationId) ?? GUILD_OP_LOCATIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notifBlock}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 9, color: 'var(--gold-main)' }}>WYBIERZ OPERACJĘ</p>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>
          👥 {memberCount} członków · POZ. {hero.level}
        </p>
      </div>

      {/* Location list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {GUILD_OP_LOCATIONS.map(loc => {
          const locked   = hero.level < loc.minLevel;
          const selected = loc.id === selectedLocationId;
          const rc       = RARITY_COLOR[loc.finalRarity] ?? '#aaa';
          return (
            <button
              key={loc.id}
              onClick={() => !locked && setSelectedLocationId(loc.id)}
              disabled={locked}
              style={{
                background: selected
                  ? `linear-gradient(135deg, rgba(0,0,0,0.7), ${rc}12)`
                  : 'rgba(5,8,20,0.6)',
                border: `1px solid ${selected ? rc + '66' : locked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
                padding: '8px 10px',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.45 : 1,
                display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left',
                boxShadow: selected ? `0 0 10px ${rc}18` : 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{loc.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ ...MONO, fontSize: 10, color: locked ? 'var(--text-muted)' : selected ? rc : 'var(--text-bright)' }}>
                    {loc.name}
                  </span>
                  <span style={{ ...MONO, fontSize: 9, color: rc, background: `${rc}14`, border: `1px solid ${rc}33`, padding: '1px 5px', flexShrink: 0 }}>
                    {loc.finalRarity.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ ...MONO, fontSize: 9, color: locked ? '#f87171' : 'var(--text-dim)' }}>
                    {locked ? `🔒 POZ. ${loc.minLevel}+` : `POZ. ${loc.minLevel}+`}
                  </span>
                  <span style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>
                    {loc.floors} piętra
                  </span>
                </div>
              </div>
              {selected && !locked && (
                <div style={{ width: 6, height: 6, background: rc, borderRadius: '50%', flexShrink: 0, boxShadow: `0 0 6px ${rc}` }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected location description */}
      <div style={{
        background: `linear-gradient(135deg, rgba(0,0,0,0.6), ${RARITY_COLOR[selectedLoc.finalRarity] ?? '#aaa'}08)`,
        border: `1px solid ${RARITY_COLOR[selectedLoc.finalRarity] ?? '#aaa'}33`,
        padding: '8px 10px',
      }}>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          {selectedLoc.description}
        </p>
        <p style={{ ...MONO, fontSize: 9, color: '#f59e0b', marginTop: 4 }}>
          ⚡ Operacja kończy się o północy UTC. Każdy walczy swoim HP.
        </p>
      </div>

      {inCooldown && op ? (
        <div style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(51,65,85,0.5)', padding: '10px', textAlign: 'center' }}>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>
            ⏳ Następna operacja za: {fmtTime(Math.max(0, op.cooldownUntil - now))}
          </p>
        </div>
      ) : canStart ? (
        <button
          onClick={handleStart}
          disabled={starting || hero.level < selectedLoc.minLevel}
          className="btn btn-primary"
          style={{ fontSize: 10 }}
        >
          {starting ? '⏳ Uruchamianie...' : `▶ ROZPOCZNIJ — ${selectedLoc.emoji} ${selectedLoc.name}`}
        </button>
      ) : !isLeaderOrOfficer ? (
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          Tylko władca lub oficer może uruchomić operację.
        </p>
      ) : null}
    </div>
  );
}
