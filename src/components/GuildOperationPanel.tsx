import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  startGuildOperation, attackGuildEnemy, claimGuildOperationReward, setKnockedOut,
  type Guild, type GuildOperationState,
} from '../lib/cloudSync';
import { GUILD_OP_LOCATIONS } from '../data/guildOperations';
import EnemyPortrait from './EnemyPortrait';
import { createMysteryBox } from '../data/mysteryBoxes';
import { getHeroAttack, rollDamage } from '../utils/combat';
import { useGameStore } from '../store/gameStore';
import { useLangStore } from '../store/langStore';
import { ORB, MONO } from '../utils/styles';
import GameIcon, { LogLine } from './GameIcon';


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
  const [claiming, setClaiming] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [attacking, setAttacking] = useState(false);
  const [now, setNow] = useState(Date.now());
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
  const isEn           = useLangStore(s => s.lang) === 'en';
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
            lines.push({ text: `💀 ${prev.enemyName} ${isEn ? 'defeated!' : 'pokonany!'}`, type: 'kill' });
          }
          if (newOp.floor > prev.floor) {
            lines.push({ text: `⬆ ${isEn ? 'Floor' : 'Piętro'} ${newOp.floor} — ${newOp.enemyName} ${newOp.enemyEmoji}`, type: 'floor' });
          }
          if (newOp.status === 'completed' && prev.status !== 'completed') {
            lines.push({ text: isEn ? '🏆 OPERATION COMPLETED!' : '🏆 OPERACJA UKOŃCZONA!', type: 'done' });
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
      const ok = await startGuildOperation(guildId, myUid, hero.level, memberCount, selectedLocation ?? undefined);
      if (ok) setLog([]);
      else notify(isEn ? 'Cannot start operation.' : 'Nie można uruchomić operacji.', false);
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
        notify(isEn ? 'Operation expired — time\'s up.' : 'Operacja wygasła — czas minął.', false);
        setAutoFight(false);
      } else if (status === 'no_op') {
        notify(isEn ? 'No active operation.' : 'Brak aktywnej operacji.', false);
        setAutoFight(false);
      } else {
        const newRaidHp = Math.max(0, raidHpRef.current - enemyDmg);
        raidHpRef.current = newRaidHp;
        setRaidHp(newRaidHp);
        const newLines: { text: string; type: keyof typeof LOG_COLORS }[] = [
          { text: `⚔ ${isEn ? 'You' : 'Ty'} → ${fmtNum(damage)} dmg ${isEn ? 'on' : 'na'} ${currentOp.enemyName}`, type: 'me' },
          { text: `💥 ${currentOp.enemyName} → −${fmtNum(enemyDmg)} HP`, type: 'enemy' },
        ];
        setLog(l => [...l, ...newLines]);
        if (newRaidHp <= 0) {
          setLog(l => [...l, { text: isEn ? `💀 ${currentHero.name} defeated! You can no longer attack in this operation.` : `💀 ${currentHero.name} pokonany! Nie możesz już atakować w tej operacji.`, type: 'kill' }]);
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
    if (claiming) return;
    setClaiming(true);
    try {
      const reward = await claimGuildOperationReward(guildId, myUid);
      if (!reward) { notify(isEn ? 'No reward to claim.' : 'Brak nagrody do odebrania.', false); return; }
      addXp(reward.xp);
      addGold(reward.gold);
      const opLoc = GUILD_OP_LOCATIONS.find(l => l.id === op?.locationId);
      const boxLevel = opLoc?.minLevel ?? hero.level;
      const box = createMysteryBox(reward.rarity as 'rare' | 'epic' | 'legendary', boxLevel);
      addToInventory(box);
      notify(`+${reward.xp} XP  +${reward.gold} gold  ${box.name}!`, true);
    } finally {
      setClaiming(false);
    }
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

  const alreadyClaimed = isCompleted && !!op.pendingReward?.claimedBy?.[myUid];
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
    // The enemy template is chosen by floor (same logic as getFloorEnemy),
    // so we can derive its id here for the SVG portrait.
    const enemyTpl   = loc?.enemies[Math.min(op.floor - 1, loc.enemies.length - 1)];
    const enemyId    = enemyTpl?.id ?? op.locationId ?? 'op_data_guardian';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifBlock}

        {/* Floor header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...MONO, fontSize: 10, color: 'var(--gold-main)' }}>
            {loc?.name}
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
              <GameIcon name="hourglass" size={9} color={timeLeft < 3_600_000 ? '#f87171' : 'var(--text-dim)'} /> {fmtTime(timeLeft)}
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
            <EnemyPortrait id={enemyId} emoji={op.enemyEmoji} size={60} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ ...MONO, fontSize: 11, color: '#c05050', marginBottom: 3 }}>{op.enemyName}</p>
              <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', marginBottom: 6 }}>
                {isEn ? 'Floor' : 'Piętro'} {op.floor}/{op.maxFloors} · {isEn ? 'Enemy' : 'Wróg'} {enemyIdx + 1}/{enemyTotal}
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
              {isDead ? <GameIcon name="skull" size={10} color="#f87171" /> : <GameIcon name="heart" size={10} color="#f87171" />} {hero.name}
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
              <GameIcon name="skull" size={10} color="#f87171" /> {isEn ? 'Defeated!' : 'Pokonany!'}
            </p>
            <p style={{ ...MONO, fontSize: 9, color: 'rgba(248,113,113,0.6)' }}>
              {isEn ? 'You can no longer attack in this operation.' : 'Nie możesz już atakować w tej operacji.'}
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
              {attacking ? <><GameIcon name="sword" size={10} color="#fff" /> {isEn ? 'Attacking...' : 'Atakuję...'}</> : <><GameIcon name="sword" size={10} color="#fff" /> {isEn ? 'Attack!' : 'Atakuj!'}</>}
            </button>
            <button
              onClick={() => setAutoFight(f => !f)}
              className={autoFight ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: 10, padding: '0 10px', minWidth: 80 }}
            >
              {autoFight ? '■ Stop' : '▶ Auto'}
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
              {isEn ? 'No one has attacked yet.' : 'Nikt jeszcze nie zaatakował.'}
            </p>
          ) : (
            log.map((entry, i) => (
              <p key={i} style={{ color: LOG_COLORS[entry.type], marginBottom: 1 }}>
                <LogLine text={entry.text} iconSize={10} />
              </p>
            ))
          )}
        </div>

        {/* Damage ranking */}
        {participants.length > 0 && (
          <div>
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-dim)', marginBottom: 5 }}>
              {isEn ? 'CONTRIBUTION' : 'WKŁAD'} ({participants.length}) · {isEn ? 'total' : 'łącznie'}: {fmtNum(totalDmg)} dmg
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
                          {p.username}{isMe ? (isEn ? ' (you)' : ' (ty)') : ''}
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
          <GameIcon name="skull" size={28} color="#f87171" style={{ display: 'block', margin: '0 auto 6px' }} />
          <p style={{ ...ORB, fontSize: 10, color: '#f87171', marginBottom: 4 }}>{isEn ? 'OPERATION FAILED' : 'OPERACJA NIEUKOŃCZONA'}</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>
            {loc?.name} — {isEn ? 'time\'s up' : 'czas minął'}
          </p>
        </div>
        {participants.length > 0 && (
          <div style={{ background: 'rgba(5,10,25,0.6)', border: '1px solid rgba(51,65,85,0.4)', padding: '8px 10px' }}>
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-muted)', marginBottom: 6 }}>{isEn ? 'CONTRIBUTION' : 'WKŁAD'}</p>
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
            ▶ {isEn ? 'NEW OPERATION' : 'NOWA OPERACJA'}
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
          <GameIcon name="trophy" size={28} color="#44cc44" style={{ display: 'block', margin: '0 auto 6px' }} />
          <p style={{ ...ORB, fontSize: 10, color: '#44cc44', marginBottom: 4 }}>{isEn ? 'OPERATION COMPLETED!' : 'OPERACJA UKOŃCZONA!'}</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
            {loc?.name}
          </p>
          {op.pendingReward && (
            <div style={{ background: 'rgba(10,25,10,0.7)', border: '1px solid rgba(34,197,94,0.25)', padding: '8px 12px', marginBottom: 10 }}>
              <p style={{ ...MONO, fontSize: 12, color: '#4ade80' }}>
                +{op.pendingReward.xp} XP &nbsp;·&nbsp; +{op.pendingReward.gold} <GameIcon name="coin" size={11} />
              </p>
              <p style={{ ...MONO, fontSize: 11, color: RARITY_COLOR[op.pendingReward.rarity] ?? '#aaa', marginTop: 4 }}>
                [{op.pendingReward.rarity.toUpperCase()}]
              </p>
            </div>
          )}
          {alreadyClaimed ? (
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-muted)' }}><GameIcon name="check" size={9} color="var(--text-muted)" /> {isEn ? 'Reward claimed' : 'Nagrodę odebrano'}</p>
          ) : (
            <button onClick={handleClaim} disabled={claiming} className="btn btn-primary" style={{ fontSize: 10, padding: '8px 16px' }}>
              {claiming ? <GameIcon name="hourglass" size={10} color="#fff" /> : <GameIcon name="bag" size={10} color="#fff" />} {isEn ? 'CLAIM REWARD' : 'ODBIERZ NAGRODĘ'}
            </button>
          )}
        </div>

        {participants.length > 0 && (
          <div>
            <p style={{ ...ORB, fontSize: 9, color: 'var(--text-dim)', marginBottom: 5 }}>{isEn ? 'RANKING' : 'RANKING'}</p>
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
                      {idx + 1}. {p.username}{isMe ? (isEn ? ' (you)' : ' (ty)') : ''}
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
              <GameIcon name="hourglass" size={10} color="var(--text-muted)" /> {isEn ? 'Next operation in:' : 'Następna operacja za:'} {fmtTime(Math.max(0, op.cooldownUntil - now))}
            </p>
          </div>
        )}
        {!inCooldown && isLeader && (
          <button onClick={() => setOp(null)} className="btn btn-secondary" style={{ fontSize: 10 }}>
            ▶ {isEn ? 'NEW OPERATION' : 'NOWA OPERACJA'}
          </button>
        )}
      </div>
    );
  }

  // ── START SCREEN ─────────────────────────────────────────────────────────────
  const availableLocations = GUILD_OP_LOCATIONS.filter(l => l.minLevel <= hero.level);
  const RARITY_COL: Record<string, string> = { rare: '#60a5fa', epic: '#c084fc', legendary: '#f59e0b' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notifBlock}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...ORB, fontSize: 9, color: 'var(--gold-main)' }}>{isEn ? 'GUILD OPERATION' : 'OPERACJA GILDYJNA'}</p>
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>
          <GameIcon name="users" size={9} color="var(--text-muted)" /> {memberCount} {isEn ? 'members' : 'członków'} · {isEn ? 'LVL.' : 'POZ.'} {hero.level}
        </p>
      </div>

      <p style={{ ...MONO, fontSize: 9, color: '#f59e0b' }}>
        <GameIcon name="lightning" size={9} color="#f59e0b" /> {isEn ? 'Operation ends at midnight UTC. Each member fights with their own HP.' : 'Operacja kończy się o północy UTC. Każdy walczy swoim HP.'}
      </p>

      {inCooldown && op ? (
        <div style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(51,65,85,0.5)', padding: '10px', textAlign: 'center' }}>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>
            <GameIcon name="hourglass" size={10} color="var(--text-muted)" /> Następna operacja za: {fmtTime(Math.max(0, op.cooldownUntil - now))}
          </p>
        </div>
      ) : canStart ? (
        <>
          {/* Location picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {availableLocations.map(loc => {
              const sel = selectedLocation === loc.id;
              const rc = RARITY_COL[loc.finalRarity] ?? '#aaa';
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(sel ? null : loc.id)}
                  style={{
                    background: sel ? `${rc}14` : 'rgba(5,8,20,0.8)',
                    border: `1px solid ${sel ? rc + '88' : 'rgba(255,255,255,0.1)'}`,
                    padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 3,
                    transition: 'border-color 0.1s, background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...ORB, fontSize: 10, color: sel ? rc : 'var(--text-bright)' }}>
                      {loc.name}
                    </span>
                    <span style={{ ...MONO, fontSize: 9, color: rc, background: `${rc}18`, border: `1px solid ${rc}44`, padding: '1px 5px' }}>
                      {loc.finalRarity.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>{isEn ? 'LVL.' : 'POZ.'} {loc.minLevel}+</span>
                    <span style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>{loc.floors} {isEn ? 'floors' : 'pięter'}</span>
                    <span style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)' }}>{loc.enemiesPerFloor} {isEn ? 'enemies/floor' : 'wrogów/piętro'}</span>
                  </div>
                  <p style={{ ...MONO, fontSize: 9, color: 'var(--text-dim)', marginTop: 1 }}>
                    {loc.description}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleStart}
            disabled={starting}
            className="btn btn-primary"
            style={{ fontSize: 10 }}
          >
            {starting
              ? <><GameIcon name="hourglass" size={10} color="#fff" /> {isEn ? 'Starting...' : 'Uruchamianie...'}</>
              : selectedLocation
                ? <>{isEn ? 'START —' : 'ROZPOCZNIJ —'} {availableLocations.find(l => l.id === selectedLocation)?.emoji} {availableLocations.find(l => l.id === selectedLocation)?.name}</>
                : (isEn ? 'START OPERATION (random)' : 'ROZPOCZNIJ OPERACJĘ (losowa)')}
          </button>
        </>
      ) : !isLeaderOrOfficer ? (
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          {isEn ? 'Only the leader or officer can start an operation.' : 'Tylko władca lub oficer może uruchomić operację.'}
        </p>
      ) : null}
    </div>
  );
}
