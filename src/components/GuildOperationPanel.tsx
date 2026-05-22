import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  startGuildOperation, attackGuildEnemy, claimGuildOperationReward,
  type Guild, type GuildOperationState,
} from '../lib/cloudSync';
import { GUILD_OP_LOCATIONS } from '../data/guildOperations';
import { useGameStore } from '../store/gameStore';

const PX = (n: number): React.CSSProperties => ({
  fontFamily: "'Press Start 2P', monospace",
  fontSize: n,
});
const MONO: React.CSSProperties = { fontFamily: "'Share Tech Mono', monospace" };

const RARITY_COLOR: Record<string, string> = {
  rare: '#60a5fa', epic: '#c084fc', legendary: '#f59e0b',
};

function CooldownBtn({ lastAtk, onAttack }: { lastAtk: number; onAttack: () => void }) {
  const [left, setLeft] = useState(Math.max(0, lastAtk + 30000 - Date.now()));
  useEffect(() => {
    const r = Math.max(0, lastAtk + 30000 - Date.now());
    setLeft(r);
    if (r <= 0) return;
    const id = setInterval(() => {
      const rem = Math.max(0, lastAtk + 30000 - Date.now());
      setLeft(rem);
      if (rem === 0) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [lastAtk]);

  return (
    <button
      onClick={onAttack}
      disabled={left > 0}
      className="btn btn-primary"
      style={{ flex: 1, fontSize: 10, padding: '10px 0', opacity: left > 0 ? 0.5 : 1 }}
    >
      {left > 0 ? `⏳ ${Math.ceil(left / 1000)}s` : '⚔ ATAK!'}
    </button>
  );
}

function CooldownTimer({ until }: { until: number }) {
  const [left, setLeft] = useState(Math.max(0, until - Date.now()));
  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, until - Date.now());
      setLeft(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [until]);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <span style={{ color: '#60a5fa' }}>{h}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>;
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

  const hero   = useGameStore(s => s.hero);
  const addXp  = useGameStore(s => s.addXp);
  const addGold = useGameStore(s => s.addGold);
  const isLeader = guild.leaderUid === myUid;
  const memberCount = Object.keys(guild.members).length;

  useEffect(() => {
    if (!db || !guildId) return;
    const unsub = onSnapshot(doc(db, 'guilds', guildId), snap => {
      if (snap.exists()) setOp(snap.data().guildOperation ?? null);
    });
    return () => unsub();
  }, [guildId]);

  function notify(text: string, ok: boolean) {
    setNotification({ text, ok });
    setTimeout(() => setNotification(null), 3000);
  }

  async function handleStart(locationId: string) {
    setStarting(true);
    try {
      const ok = await startGuildOperation(guildId, myUid, locationId, memberCount);
      if (!ok) notify('Nie można uruchomić operacji.', false);
    } finally { setStarting(false); }
  }

  async function handleAttack() {
    if (attacking) return;
    setAttacking(true);
    try {
      const { status, damage } = await attackGuildEnemy(guildId, myUid, hero.level);
      if (status === 'cooldown') notify('Odczekaj przed następnym atakiem!', false);
      else if (status === 'no_op') notify('Brak aktywnej operacji.', false);
      else if (status === 'completed') notify(`Zadano ${damage} dmg! Operacja ukończona! 🎉`, true);
      else if (status === 'advanced') notify(`Zadano ${damage} dmg! Następne piętro! ⬆️`, true);
      else notify(`Zadano ${damage} dmg!`, true);
    } finally { setAttacking(false); }
  }

  async function handleClaim() {
    const reward = await claimGuildOperationReward(guildId, myUid);
    if (!reward) { notify('Brak nagrody do odebrania.', false); return; }
    addXp(reward.xp);
    addGold(reward.gold);
    notify(`+${reward.xp} XP  +${reward.gold} 🪙  [${reward.rarity.toUpperCase()}]`, true);
  }

  const isActive    = !!op && op.pendingReward === null;
  const isCompleted = !!op && op.pendingReward !== null;
  const inCooldown  = !!op && op.cooldownUntil > Date.now();
  const canStart    = isLeader && !isActive && (!inCooldown);
  const alreadyClaimed = isCompleted && !!op.pendingReward?.claimedBy[myUid];

  const hpPct = op ? Math.max(0, op.enemyHp / op.enemyMaxHp) * 100 : 0;
  const members = Object.entries(guild.members)
    .map(([uid, d]) => ({ uid, username: d.username, dmg: op?.contributions[uid] ?? 0 }))
    .sort((a, b) => b.dmg - a.dmg);

  const lastAtk = op?.lastAttacks[myUid] ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Notification */}
      {notification && (
        <div style={{
          background: notification.ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${notification.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          padding: '8px 12px', textAlign: 'center',
          color: notification.ok ? '#4ade80' : '#f87171', ...PX(9),
        }}>
          {notification.text}
        </div>
      )}

      {/* === ACTIVE FIGHT === */}
      {isActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Location + floor header */}
          <div style={{
            background: 'rgba(10,20,40,0.8)', border: '1px solid rgba(51,65,85,0.6)',
            padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ ...PX(8), color: 'var(--gold-main)' }}>
                {GUILD_OP_LOCATIONS.find(l => l.id === op.locationId)?.emoji} {GUILD_OP_LOCATIONS.find(l => l.id === op.locationId)?.name}
              </p>
              <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                Piętro {op.floor} / {op.maxFloors}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: op.maxFloors }, (_, i) => (
                <div key={i} style={{
                  width: 8, height: 8,
                  background: i < op.floor - 1 ? '#4ade80' : i === op.floor - 1 ? 'var(--gold-main)' : 'rgba(51,65,85,0.5)',
                  border: '1px solid rgba(51,65,85,0.4)',
                }} />
              ))}
            </div>
          </div>

          {/* Enemy */}
          <div style={{
            background: op.isBoss ? 'rgba(40,5,5,0.9)' : 'rgba(5,10,25,0.9)',
            border: `1px solid ${op.isBoss ? 'rgba(239,68,68,0.5)' : 'rgba(51,65,85,0.5)'}`,
            padding: '12px 10px', textAlign: 'center',
            boxShadow: op.isBoss ? '0 0 20px rgba(239,68,68,0.15)' : 'none',
          }}>
            {op.isBoss && (
              <p style={{ ...PX(7), color: '#f87171', marginBottom: 4 }}>⚠ BOSS ⚠</p>
            )}
            <p style={{ fontSize: op.isBoss ? 40 : 32, marginBottom: 6 }}>{op.enemyEmoji}</p>
            <p style={{ ...PX(9), color: op.isBoss ? '#f87171' : 'var(--text-bright)', marginBottom: 10 }}>
              {op.enemyName}
            </p>

            {/* HP bar */}
            <div style={{ background: 'rgba(20,30,50,0.8)', border: '1px solid rgba(51,65,85,0.4)', height: 14, marginBottom: 4 }}>
              <div style={{
                background: op.isBoss
                  ? `linear-gradient(90deg, #dc2626, #f87171)`
                  : `linear-gradient(90deg, #16a34a, #4ade80)`,
                width: `${hpPct}%`, height: '100%',
                transition: 'width 0.4s ease',
              }} />
            </div>
            <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>
              {op.enemyHp.toLocaleString()} / {op.enemyMaxHp.toLocaleString()} HP
            </p>
          </div>

          {/* Attack button */}
          <div style={{ display: 'flex', gap: 8 }}>
            <CooldownBtn lastAtk={lastAtk} onAttack={handleAttack} />
          </div>

          {/* Contributions */}
          <div style={{ background: 'rgba(5,10,25,0.6)', border: '1px solid rgba(51,65,85,0.4)', padding: '8px 10px' }}>
            <p style={{ ...PX(7), color: 'var(--text-muted)', marginBottom: 6 }}>WKŁAD CZŁONKÓW</p>
            {members.map(m => (
              <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ ...MONO, fontSize: 11, color: m.uid === myUid ? '#ffd700' : 'var(--text-dim)' }}>
                  {m.uid === myUid ? '▶ ' : ''}{m.username}
                </span>
                <span style={{ ...MONO, fontSize: 11, color: m.dmg > 0 ? '#f87171' : 'var(--text-muted)' }}>
                  {m.dmg > 0 ? `${m.dmg.toLocaleString()} dmg` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === REWARD PHASE === */}
      {isCompleted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            background: 'rgba(5,20,5,0.85)', border: '1px solid rgba(34,197,94,0.4)',
            padding: '14px 12px', textAlign: 'center',
            boxShadow: '0 0 20px rgba(34,197,94,0.1)',
          }}>
            <p style={{ fontSize: 28, marginBottom: 6 }}>🏆</p>
            <p style={{ ...PX(9), color: '#4ade80', marginBottom: 4 }}>OPERACJA UKOŃCZONA!</p>
            <p style={{ ...MONO, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              {GUILD_OP_LOCATIONS.find(l => l.id === op.locationId)?.name}
            </p>

            {/* Reward info */}
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
              <p style={{ ...PX(8), color: 'var(--text-muted)' }}>✓ Nagrodę odebrano</p>
            ) : (
              <button onClick={handleClaim} className="btn btn-primary" style={{ fontSize: 10, padding: '8px 16px' }}>
                🎁 ODBIERZ NAGRODĘ
              </button>
            )}
          </div>

          {/* Contributions */}
          <div style={{ background: 'rgba(5,10,25,0.6)', border: '1px solid rgba(51,65,85,0.4)', padding: '8px 10px' }}>
            <p style={{ ...PX(7), color: 'var(--text-muted)', marginBottom: 6 }}>WKŁAD FINALNY</p>
            {members.map(m => (
              <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ ...MONO, fontSize: 11, color: m.uid === myUid ? '#ffd700' : 'var(--text-dim)' }}>
                  {m.uid === myUid ? '▶ ' : ''}{m.username}
                </span>
                <span style={{ ...MONO, fontSize: 11, color: m.dmg > 0 ? '#f87171' : 'var(--text-muted)' }}>
                  {m.dmg > 0 ? `${m.dmg.toLocaleString()} dmg` : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Cooldown */}
          {inCooldown && (
            <div style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(51,65,85,0.5)', padding: '8px 10px', textAlign: 'center' }}>
              <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>
                Następna operacja za: <CooldownTimer until={op.cooldownUntil} />
              </p>
            </div>
          )}

          {/* Start new (if cooldown done and leader) */}
          {!inCooldown && isLeader && (
            <button onClick={() => setOp(null)} className="btn btn-secondary" style={{ fontSize: 10 }}>
              ▶ NOWA OPERACJA
            </button>
          )}
        </div>
      )}

      {/* === LOCATION SELECTION === */}
      {!isActive && !isCompleted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ ...PX(8), color: 'var(--gold-main)', marginBottom: 4 }}>WYBIERZ LOKACJĘ</p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            Trudność skaluje się z liczbą członków gildii ({memberCount} członków).
            {!isLeader && ' Tylko władca może uruchomić operację.'}
          </p>

          {GUILD_OP_LOCATIONS.map(loc => {
            const rarColor = RARITY_COLOR[loc.finalRarity] ?? '#aaa';
            return (
              <div key={loc.id} style={{
                background: 'rgba(5,10,25,0.8)',
                border: `1px solid ${rarColor}33`,
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <p style={{ ...PX(8), color: rarColor }}>
                      {loc.emoji} {loc.name}
                    </p>
                    <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      {loc.floors} pięter · nagroda: [{loc.finalRarity.toUpperCase()}]
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ ...MONO, fontSize: 10, color: '#4ade80' }}>+{loc.baseXpPerFloor * loc.floors}+ XP</p>
                    <p style={{ ...MONO, fontSize: 10, color: '#ffd700' }}>+{loc.baseGoldPerFloor * loc.floors}+ 🪙</p>
                  </div>
                </div>
                <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                  {loc.description}
                </p>
                {canStart && (
                  <button
                    onClick={() => handleStart(loc.id)}
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
      )}
    </div>
  );
}
