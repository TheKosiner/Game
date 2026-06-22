import { useState, useEffect, useRef } from 'react';
import { useLangStore } from '../store/langStore';
import { useT } from '../hooks/useT';
import { PX } from '../utils/styles';
import { portraitSrc, resolvePortrait } from '../data/portraits';
import GameIcon from './GameIcon';
import {
  subscribeToGuildWar, subscribeToActiveWars, declareWar, joinWar, resolveWar,
  type GuildWar,
} from '../lib/guildWar';
import { listGuilds } from '../lib/cloudSync';
import type { Guild } from '../lib/cloudSync';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const WAR_VISIBLE_MS = 12 * 60 * 60 * 1000; // 12 hours

function getRecentWarCache(guildId: string): { warId: string; resolvedAt: number } | null {
  try {
    const raw = localStorage.getItem(`guildwar_last_${guildId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { warId: string; resolvedAt: number };
    if (Date.now() - parsed.resolvedAt < WAR_VISIBLE_MS) return parsed;
    localStorage.removeItem(`guildwar_last_${guildId}`);
    return null;
  } catch { return null; }
}

export default function GuildWarPanel({ guild, myUid, onRefresh, onWarSeen }: { guild: Guild; myUid: string; onRefresh: () => void; onWarSeen?: () => void }) {
  const t = useT();
  const isEn = useLangStore(s => s.lang) === 'en';
  const isLeader = guild.leaderUid === myUid;
  const isOfficer = guild.members[myUid]?.role === 'officer';
  const canDeclare = isLeader || isOfficer;

  // undefined = loading, null = no war
  const [war, setWar] = useState<GuildWar | null | undefined>(undefined);
  const [guilds, setGuilds] = useState<Array<{ id: string; name: string; tag: string; memberCount: number }>>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeclareForm, setShowDeclareForm] = useState(false);
  const [declaring, setDeclaring] = useState<string | null>(null);
  const [declareError, setDeclareError] = useState('');
  const [joining, setJoining] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [now, setNow] = useState(Date.now());
  // Set immediately after declareWar returns so the UI doesn't wait for guild refresh
  const [pendingWarId, setPendingWarId] = useState<string | null>(null);
  const [activeWars, setActiveWars] = useState<GuildWar[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => subscribeToActiveWars(setActiveWars), []);

  const activeWarId = (guild as Guild & { activeWarId?: string }).activeWarId;
  // Fallback to localStorage when the war is finished and guild no longer has activeWarId
  const [cachedWarId, setCachedWarId] = useState<string | null>(() => getRecentWarCache(guild.id)?.warId ?? null);
  const effectiveWarId = pendingWarId ?? activeWarId ?? cachedWarId ?? null;

  // Clear pendingWarId once the parent guild reflects the war (avoids double subscription)
  useEffect(() => {
    if (pendingWarId && activeWarId === pendingWarId) setPendingWarId(null);
  }, [activeWarId, pendingWarId]);

  // When there's no active war, re-check cache in case it was stored during this session
  useEffect(() => {
    if (!activeWarId && !pendingWarId) {
      const cached = getRecentWarCache(guild.id);
      setCachedWarId(cached?.warId ?? null);
    } else {
      setCachedWarId(null);
    }
  }, [activeWarId, pendingWarId, guild.id]);

  const unsubWarRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (unsubWarRef.current) { unsubWarRef.current(); unsubWarRef.current = null; }
    if (!effectiveWarId) { setWar(null); return; }
    setWar(undefined);
    const unsub = subscribeToGuildWar(effectiveWarId, snap => {
      setWar(snap);
      // Persist finished wars so they stay viewable for 12h
      if (snap?.status === 'finished' && snap.resolvedAt) {
        const cacheKey = `guildwar_last_${guild.id}`;
        const unseenKey = `guildwar_unseen_${guild.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({ warId: snap.id, resolvedAt: snap.resolvedAt }));
        // Only mark unseen once (don't overwrite if the user already dismissed it)
        if (!localStorage.getItem(unseenKey)) {
          localStorage.setItem(unseenKey, snap.id);
        }
      }
    });
    unsubWarRef.current = unsub;
    return () => { unsub(); unsubWarRef.current = null; };
  }, [effectiveWarId, guild.id]);

  // Auto-resolve when signup window closes
  useEffect(() => {
    if (!war || war.status !== 'signup' || now < war.signupEndsAt || resolving) return;
    setResolving(true);
    resolveWar(war.id).catch(() => {}).finally(() => setResolving(false));
  }, [war, now, resolving]);

  // Mark battle as seen when this panel is shown with a finished war
  useEffect(() => {
    if (war?.status === 'finished') {
      localStorage.removeItem(`guildwar_unseen_${guild.id}`);
      onWarSeen?.();
    }
  }, [war?.status, guild.id, onWarSeen]);

  async function handleLoadGuilds() {
    if (guilds.length > 0) { setShowDeclareForm(true); return; }
    setLoadingGuilds(true);
    try {
      const list = await listGuilds();
      setGuilds(list.filter(g => g.id !== guild.id));
      setShowDeclareForm(true);
    } finally {
      setLoadingGuilds(false);
    }
  }

  const hero = useGameStore(s => s.hero);
  const authUser = useAuthStore(s => s.user);

  const myGuildId = guild.id;
  const mySide = war
    ? (myGuildId === war.attackerGuildId ? 'attackers' : myGuildId === war.defenderGuildId ? 'defenders' : null)
    : null;
  const hasJoined = !!(war && mySide && war[mySide]?.[myUid]);

  async function handleDeclare(targetId: string) {
    setDeclaring(targetId);
    setDeclareError('');
    try {
      const { warId } = await declareWar(targetId);
      setShowDeclareForm(false);
      // Subscribe immediately using the returned warId — don't wait for guild refresh
      setPendingWarId(warId);
      onRefresh(); // refresh guild in background to sync activeWarId
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('already has an active war') || msg.includes('jest już')) {
        setDeclareError(isEn ? t.guild.warAlreadyAtWar : t.guild.warAlreadyAtWar);
      } else {
        setDeclareError(isEn ? t.guild.warDeclareError : t.guild.warDeclareError);
      }
    } finally {
      setDeclaring(null);
    }
  }

  async function handleJoin() {
    if (!war || !mySide) return;
    // Optimistic update — show the player as joined immediately
    const optimisticParticipant = {
      username: authUser?.username ?? '',
      level: hero.level,
      portrait: hero.portrait,
      joinedAt: Date.now(),
    };
    setWar(prev => prev ? {
      ...prev,
      [mySide]: { ...prev[mySide], [myUid]: optimisticParticipant },
    } : prev);
    setJoining(true);
    try { await joinWar(war.id); } catch {
      // On error, revert optimistic update
      setWar(prev => prev ? {
        ...prev,
        [mySide]: Object.fromEntries(Object.entries(prev[mySide]).filter(([k]) => k !== myUid)),
      } : prev);
    } finally { setJoining(false); }
  }

  const filtered = guilds.filter(g =>
    !searchTerm ||
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (war === undefined) {
    return <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>{t.guild.loading}</p>;
  }

  if (!war) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img src="/guild_war.webp" alt="Guild War" style={{ width: '100%', height: 180, objectFit: 'cover', objectPosition: 'center 30%', display: 'block', border: '1px solid rgba(200,50,50,0.35)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
        </div>
        <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 16, textAlign: 'center' }}>
          <p style={{ ...PX(7), color: 'var(--text-dim)', marginBottom: 8 }}>☮ {t.guild.warNone}</p>
          <p style={{ ...PX(4), color: 'var(--text-muted)', lineHeight: 1.7 }}>{t.guild.warNoneDesc}</p>
        </div>

        {canDeclare && !showDeclareForm && (
          <button
            onClick={handleLoadGuilds}
            disabled={loadingGuilds}
            className="btn btn-danger"
            style={{ fontSize: 10, padding: '8px' }}
          >
            {loadingGuilds ? <GameIcon name="hourglass" size={10} /> : t.guild.warDeclare}
          </button>
        )}

        {showDeclareForm && (
          <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(200,50,50,0.4)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ ...PX(5), color: '#f87171' }}>{t.guild.warSelectTarget}</p>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.guild.warSearchPlaceholder}
              style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--text-bright)', fontFamily: "'Press Start 2P', monospace", fontSize: 9, padding: '6px 8px', boxSizing: 'border-box' }}
            />
            {declareError && <p style={{ ...PX(4), color: '#f87171' }}>{declareError}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>{t.guild.warNoGuilds}</p>
              )}
              {filtered.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-deep)', border: '1px solid var(--border-dark)', padding: '6px 8px' }}>
                  <div>
                    <span style={{ ...PX(5), color: 'var(--gold-main)' }}>[{g.tag}]</span>
                    <span style={{ ...PX(5), color: 'var(--text-bright)', marginLeft: 6 }}>{g.name}</span>
                    <span style={{ ...PX(4), color: 'var(--text-muted)', marginLeft: 6 }}>{g.memberCount} {t.guild.warMembers}</span>
                  </div>
                  <button
                    onClick={() => handleDeclare(g.id)}
                    disabled={declaring !== null}
                    className="btn btn-danger"
                    style={{ fontSize: 9, padding: '4px 8px', flexShrink: 0 }}
                  >
                    {declaring === g.id ? <GameIcon name="hourglass" size={9} /> : t.guild.warDeclareBtn}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowDeclareForm(false)} className="btn btn-secondary" style={{ fontSize: 9, padding: '5px' }}>
              ✕ {t.guild.warCancel}
            </button>
          </div>
        )}
      </div>
    );
  }

  const isSignup = war.status === 'signup';
  const isFinished = war.status === 'finished';
  const isBattle = war.status === 'battle';
  const signupOpen = isSignup && now < war.signupEndsAt;
  const timeLeft = war.signupEndsAt - now;

  const attackerList = Object.entries(war.attackers ?? {});
  const defenderList = Object.entries(war.defenders ?? {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* War image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="/guild_war.webp" alt="Guild War" style={{ width: '100%', height: 180, objectFit: 'cover', objectPosition: 'center 30%', display: 'block', border: '1px solid rgba(200,50,50,0.35)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
      </div>

      {/* War header */}
      <div style={{ background: 'rgba(40,10,10,0.8)', border: '1px solid rgba(200,50,50,0.5)', padding: '10px 12px', textAlign: 'center' }}>
        <p style={{ ...PX(7), color: '#f87171', marginBottom: 6 }}>{t.guild.warTab}</p>
        <p style={{ ...PX(6), color: 'var(--gold-bright)' }}>
          <span style={{ color: '#f87171' }}>[{war.attackerGuildTag}]</span>
          {' '}{war.attackerGuildName}
          <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>vs</span>
          <span style={{ color: '#7dd3fc' }}>[{war.defenderGuildTag}]</span>
          {' '}{war.defenderGuildName}
        </p>
      </div>

      {/* Status section */}
      {isSignup && signupOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Role banner */}
          <div style={{
            background: myGuildId === war.attackerGuildId ? 'rgba(80,10,10,0.7)' : 'rgba(10,20,60,0.7)',
            border: `1px solid ${myGuildId === war.attackerGuildId ? 'rgba(200,50,50,0.5)' : 'rgba(80,120,255,0.5)'}`,
            padding: '8px 12px',
          }}>
            <p style={{ ...PX(5), color: myGuildId === war.attackerGuildId ? '#f87171' : '#7dd3fc' }}>
              {myGuildId === war.attackerGuildId
                ? (isEn ? `⚔ You declared war on [${war.defenderGuildTag}] ${war.defenderGuildName}` : `⚔ Wypowiedziałeś wojnę gildii [${war.defenderGuildTag}] ${war.defenderGuildName}`)
                : (isEn ? `🛡 Guild [${war.attackerGuildTag}] ${war.attackerGuildName} declared war on you!` : `🛡 Gildia [${war.attackerGuildTag}] ${war.attackerGuildName} wypowiedziała Ci wojnę!`)}
            </p>
          </div>

          {/* Countdown + join */}
          <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--gold-darker)', padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4 }}>{t.guild.warSignupEnds}</p>
            <p style={{ ...PX(10), color: 'var(--gold-bright)', textShadow: '0 0 8px rgba(255,215,0,0.5)', marginBottom: 8 }}>
              {formatCountdown(timeLeft)}
            </p>
            {mySide && !hasJoined && (
              <button onClick={handleJoin} disabled={joining} className="btn btn-primary" style={{ fontSize: 10, padding: '8px 20px' }}>
                {joining ? <GameIcon name="hourglass" size={10} /> : t.guild.warJoin}
              </button>
            )}
            {hasJoined && (
              <p style={{ ...PX(5), color: '#4ade80' }}>{t.guild.warJoined}</p>
            )}
            {!mySide && (
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>
                {isEn ? 'You are a spectator of this war.' : 'Jesteś obserwatorem tej wojny.'}
              </p>
            )}
          </div>
        </div>
      )}

      {isSignup && !signupOpen && (
        <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(200,50,50,0.3)', padding: '10px 12px', textAlign: 'center' }}>
          <p style={{ ...PX(6), color: '#f87171' }}>
            {resolving ? `⚔ ${t.guild.warBattling}` : `⏳ ${t.guild.warStarting}`}
          </p>
        </div>
      )}

      {isBattle && (
        <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(200,50,50,0.3)', padding: '10px 12px', textAlign: 'center' }}>
          <p style={{ ...PX(6), color: '#f87171' }}>⚔ {t.guild.warBattling}</p>
        </div>
      )}

      {/* Participant columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(200,50,50,0.3)', padding: 8 }}>
          <p style={{ ...PX(4), color: '#f87171', marginBottom: 6, textAlign: 'center' }}>
            ⚔ {t.guild.warAttackers} ({attackerList.length})
          </p>
          {attackerList.length === 0 && (
            <p style={{ ...PX(3), color: 'var(--text-muted)', textAlign: 'center' }}>{t.guild.warNoneEnlisted}</p>
          )}
          {attackerList.map(([uid, p]) => (
            <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, overflow: 'hidden', flexShrink: 0 }}>
                <img src={portraitSrc(resolvePortrait(p.portrait, p.username))} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...PX(4), color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username}</p>
                <p style={{ ...PX(3), color: 'var(--text-muted)' }}>POZ.{p.level}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-inset)', border: '1px solid rgba(50,100,200,0.3)', padding: 8 }}>
          <p style={{ ...PX(4), color: '#7dd3fc', marginBottom: 6, textAlign: 'center' }}>
            🛡 {t.guild.warDefenders} ({defenderList.length})
          </p>
          {defenderList.length === 0 && (
            <p style={{ ...PX(3), color: 'var(--text-muted)', textAlign: 'center' }}>{t.guild.warNoneEnlisted}</p>
          )}
          {defenderList.map(([uid, p]) => (
            <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, overflow: 'hidden', flexShrink: 0 }}>
                <img src={portraitSrc(resolvePortrait(p.portrait, p.username))} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...PX(4), color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username}</p>
                <p style={{ ...PX(3), color: 'var(--text-muted)' }}>POZ.{p.level}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Battle result */}
      {isFinished && war.result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            background: war.result.winner === 'attacker' ? 'rgba(40,10,10,0.8)' : 'rgba(10,20,50,0.8)',
            border: `1px solid ${war.result.winner === 'attacker' ? 'rgba(200,50,50,0.6)' : 'rgba(100,150,255,0.6)'}`,
            padding: '12px 14px',
            textAlign: 'center',
          }}>
            {war.result.winner === 'attacker' ? (
              <>
                <p style={{ ...PX(8), color: '#f87171', marginBottom: 4 }}>🏆 {t.guild.warAtkWon}</p>
                <p style={{ ...PX(6), color: 'var(--gold-bright)' }}>[{war.attackerGuildTag}] {t.guild.warWins}</p>
              </>
            ) : (
              <>
                <p style={{ ...PX(8), color: '#7dd3fc', marginBottom: 4 }}>🛡 {t.guild.warDefWon}</p>
                <p style={{ ...PX(6), color: 'var(--gold-bright)' }}>[{war.defenderGuildTag}] {t.guild.warHolds}</p>
              </>
            )}
            <p style={{ ...PX(5), color: 'var(--text-muted)', marginTop: 6 }}>
              {war.result.attackerScore} : {war.result.defenderScore}
            </p>
          </div>

          <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-dark)', padding: 10, maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {war.result.log.map((line, i) => (
              <p key={i} style={{
                ...PX(4),
                color: (line.startsWith('🏆') || line.startsWith('🛡 OBRONA') || line.startsWith('🛡 DEFENSE'))
                  ? 'var(--gold-bright)'
                  : line.startsWith('⚔')
                    ? '#f87171'
                    : line.startsWith('🛡')
                      ? '#7dd3fc'
                      : 'var(--text-dim)',
                lineHeight: 1.7,
              }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── Active wars across all guilds ───────────────────────────────── */}
      {activeWars.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ ...PX(5), color: 'var(--gold-main)' }}>
            ⚔ {isEn ? 'Ongoing Wars' : 'Toczące się Wojny'} ({activeWars.length})
          </p>
          {activeWars.map(w => {
            const isMyWar = w.attackerGuildId === myGuildId || w.defenderGuildId === myGuildId;
            const timeLeft = w.signupEndsAt - now;
            const atkCount = Object.keys(w.attackers ?? {}).length;
            const defCount = Object.keys(w.defenders ?? {}).length;
            return (
              <div key={w.id} style={{
                background: isMyWar ? 'rgba(60,10,10,0.8)' : 'var(--bg-inset)',
                border: `1px solid ${isMyWar ? 'rgba(220,50,50,0.55)' : 'var(--border-dark)'}`,
                padding: '8px 10px',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <p style={{ ...PX(5), color: 'var(--text-bright)', flex: 1, minWidth: 0 }}>
                    <span style={{ color: '#f87171' }}>[{w.attackerGuildTag}]</span>
                    {' '}{w.attackerGuildName}
                    <span style={{ color: 'var(--text-muted)', margin: '0 5px' }}>vs</span>
                    <span style={{ color: '#7dd3fc' }}>[{w.defenderGuildTag}]</span>
                    {' '}{w.defenderGuildName}
                  </p>
                  {isMyWar && (
                    <span style={{ ...PX(3), color: '#f87171', background: 'rgba(200,50,50,0.2)', border: '1px solid rgba(200,50,50,0.4)', padding: '1px 5px', flexShrink: 0 }}>
                      {isEn ? 'YOUR WAR' : 'TWOJA'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ ...PX(3), color: '#f87171' }}>⚔ {atkCount}</p>
                  <p style={{ ...PX(3), color: 'var(--text-muted)' }}>vs</p>
                  <p style={{ ...PX(3), color: '#7dd3fc' }}>🛡 {defCount}</p>
                  <p style={{ ...PX(3), color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {w.status === 'signup' && timeLeft > 0
                      ? (isEn ? 'Signup: ' : 'Zapisy: ') + formatCountdown(timeLeft)
                      : `⚔ ${isEn ? 'Battle' : 'Bitwa'}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
