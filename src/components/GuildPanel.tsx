import { useEffect, useState } from 'react';
import { useIsDesktop } from '../hooks/useIsDesktop';
import {
  getMyGuildId, getGuild, getMyInvites, createGuild, inviteToGuild, getGuildSentInvites,
  acceptInvite, declineInvite, leaveGuild, disbandGuild, transferLeadership, setMemberRole,
  getLeaderboard, depositToTreasury, upgradeGuildStat, guildUpgradeCost, updateGuildDescription,
  getGuildMemberLevels,
  type Guild, type GuildInvite, type LeaderboardEntry,
} from '../lib/cloudSync';
import GuildWarPanel from './GuildWarPanel';
import GuildChat from './GuildChat';
import GuildBossPanel from './GuildBossPanel';
import GuildOperationPanel from './GuildOperationPanel';
import { isFirebaseConfigured } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';
import { useLangStore } from '../store/langStore';
import { PX } from '../utils/styles';
import { portraitSrc, resolvePortrait } from '../data/portraits';
import GameIcon from './GameIcon';

// ── Create Guild Form ────────────────────────────────────────────────────────

function CreateGuildForm({ onCreated }: { onCreated: () => void }) {
  const user = useAuthStore(s => s.user);
  const hero = useGameStore(s => s.hero);
  const t = useT();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!user) return;
    const trimName = name.trim();
    const trimTag = tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (trimName.length < 3) { setError(t.guild.nameError); return; }
    if (trimTag.length < 2 || trimTag.length > 4) { setError(t.guild.tagError); return; }
    setLoading(true); setError('');
    try {
      await createGuild(user.uid, user.username, hero.name, hero.level, trimName, trimTag, desc.trim(), hero.portrait);
      onCreated();
    } catch { setError(t.guild.createError); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)' }}>{t.guild.title}</p>
      <p style={{ ...PX(5), color: 'var(--text-dim)' }}>{t.guild.noGuildDesc}</p>

      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...PX(5), color: 'var(--gold-main)', marginBottom: 2 }}>{t.guild.createTitle}</p>

        <div>
          <label htmlFor="guild-name" style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{t.guild.nameLabel}</label>
          <input
            id="guild-name"
            value={name} onChange={e => setName(e.target.value)} maxLength={24}
            placeholder={t.guild.namePlaceholder}
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--text-bright)', fontFamily: "'Press Start 2P', monospace", fontSize: 10, padding: '7px 8px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="guild-tag" style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{t.guild.tagLabel}</label>
          <input
            id="guild-tag"
            value={tag} onChange={e => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))} maxLength={4}
            placeholder={t.guild.tagPlaceholder}
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--gold-bright)', fontFamily: "'Press Start 2P', monospace", fontSize: 10, padding: '7px 8px', boxSizing: 'border-box', letterSpacing: '0.1em' }}
          />
        </div>

        <div>
          <label htmlFor="guild-desc" style={{ ...PX(4), color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{t.guild.descLabel}</label>
          <textarea
            id="guild-desc"
            value={desc} onChange={e => setDesc(e.target.value)} maxLength={120}
            placeholder={t.guild.descPlaceholder}
            rows={2}
            style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--text-dim)', fontFamily: "'Press Start 2P', monospace", fontSize: 10, padding: '7px 8px', boxSizing: 'border-box', resize: 'none' }}
          />
        </div>

        {error && <p style={{ ...PX(5), color: 'var(--hp-bright)' }}>{error}</p>}

        <button onClick={handleCreate} disabled={loading} className="btn btn-primary" style={{ fontSize: 10, padding: '9px' }}>
          {loading ? t.guild.creating : t.guild.createBtn}
        </button>
      </div>

    </div>
  );
}

// ── Invite List ──────────────────────────────────────────────────────────────

function InvitesList({ invites, onRefresh }: { invites: GuildInvite[]; onRefresh: () => void }) {
  const user = useAuthStore(s => s.user);
  const hero = useGameStore(s => s.hero);
  const t = useT();
  const [acting, setActing] = useState<string | null>(null);

  async function handleAccept(inv: GuildInvite) {
    if (!user) return;
    setActing(inv.id);
    try {
      await acceptInvite(inv.id, inv.guildId, user.uid, user.username, hero.name, hero.level, hero.portrait);
      onRefresh();
    } finally { setActing(null); }
  }

  async function handleDecline(inv: GuildInvite) {
    setActing(inv.id);
    try { await declineInvite(inv.id); onRefresh(); }
    finally { setActing(null); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...PX(6), color: 'var(--gold-main)', marginBottom: 2 }}>{t.guild.invitesTitle}</p>
      {invites.map(inv => (
        <div key={inv.id} style={{ background: 'var(--bg-inset)', border: '1px solid var(--gold-darker)', padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <p style={{ ...PX(7), color: 'var(--gold-bright)', marginBottom: 3 }}>[{inv.guildTag}] {inv.guildName}</p>
              <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{t.guild.inviteFrom(inv.fromUsername)}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => handleAccept(inv)} disabled={acting === inv.id} className="btn btn-primary" style={{ flex: 1, fontSize: 10, padding: '6px' }}>
              {t.guild.joinBtn}
            </button>
            <button onClick={() => handleDecline(inv)} disabled={acting === inv.id} className="btn btn-secondary" style={{ flex: 1, fontSize: 10, padding: '6px' }}>
              {t.guild.declineBtn}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── In-game Confirm / Alert Dialog ──────────────────────────────────────────

function ConfirmDialog({ msg, okLabel = 'TAK', cancelLabel, onOk, onCancel }: {
  msg: string;
  okLabel?: string;
  cancelLabel?: string;
  onOk: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={cancelLabel ? onCancel : onOk}
    >
      <div
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-main)', padding: '16px 14px', maxWidth: 300, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ ...PX(9), color: 'var(--text-bright)', textAlign: 'center', lineHeight: 1.7 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {cancelLabel && (
            <button onClick={onCancel} className="btn btn-secondary" style={{ fontSize: 10, flex: 1 }}>
              {cancelLabel}
            </button>
          )}
          <button onClick={onOk} className={cancelLabel ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: 10, flex: 1 }}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Guild View ───────────────────────────────────────────────────────────────

function InviteModal({ guild, onClose }: { guild: Guild; onClose: () => void }) {
  const user = useAuthStore(s => s.user);
  const t = useT();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    Promise.all([
      getLeaderboard(),
      getGuildSentInvites(guild.id, user?.uid ?? ''),
    ]).then(([list, alreadyInvited]) => {
      setPlayers(list.filter(p => p.uid !== user?.uid && !guild.members[p.uid]));
      setSent(new Set(alreadyInvited));
      setLoading(false);
    });
  }, []);

  async function handleInvite(entry: LeaderboardEntry) {
    if (!user || !guild) return;
    setSent(s => new Set(s).add(entry.uid));
    try {
      await inviteToGuild(guild.id, guild.name, guild.tag, user.uid, user.username, entry.uid, entry.username);
    } catch { setSent(s => { const n = new Set(s); n.delete(entry.uid); return n; }); }
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label={t.guild.inviteModalTitle}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: 'var(--bg-panel)', border: '1px solid var(--border-main)', padding: 14, maxHeight: '70vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ ...PX(6), color: 'var(--gold-main)' }}>{t.guild.inviteModalTitle}</p>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
        {loading && <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>{t.guild.loading}</p>}
        {!loading && players.length === 0 && <p style={{ ...PX(5), color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>{t.guild.noPlayersToInvite}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {players.map(p => {
            const alreadySent = sent.has(p.uid);
            return (
              <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '6px 8px' }}>
                <div style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={portraitSrc(resolvePortrait(p.portrait, p.username))} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...PX(6), color: 'var(--text-bright)', marginBottom: 1 }}>{p.username}</p>
                  <p style={{ ...PX(4), color: 'var(--text-muted)' }}>{t.guild.levelShort}{p.level}</p>
                </div>
                <button
                  onClick={() => handleInvite(p)}
                  disabled={alreadySent}
                  className={alreadySent ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{ fontSize: 10, padding: '5px 8px', flexShrink: 0, opacity: alreadySent ? 0.6 : 1 }}
                >
                  {alreadySent ? t.guild.inviteSent : t.guild.inviteBtn}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GuildUpgrades({ guild, myUid, onRefresh }: { guild: Guild; myUid: string; onRefresh: () => void }) {
  const t = useT();
  const isDesktop = useIsDesktop();
  const hero = useGameStore(s => s.hero);
  const [depositAmt, setDepositAmt] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depositErr, setDepositErr] = useState('');
  const [upgrading, setUpgrading] = useState<'exp' | 'gold' | null>(null);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState(guild.description ?? '');
  const [savingDesc, setSavingDesc] = useState(false);
  const isLeader = guild.leaderUid === myUid;
  const isOfficer = guild.members[myUid]?.role === 'officer';
  const canManage = isLeader || isOfficer;
  const treasury = guild.treasury ?? 0;
  const expLvl = guild.expUpgrade ?? 0;
  const goldLvl = guild.goldUpgrade ?? 0;
  const expCost = guildUpgradeCost(expLvl);
  const goldCost = guildUpgradeCost(goldLvl);

  async function handleDeposit() {
    const amount = parseInt(depositAmt, 10);
    if (!amount || amount <= 0) return;
    if (amount > hero.gold) { setDepositErr(t.guild.depositError); return; }
    setDepositing(true); setDepositErr('');
    try {
      await depositToTreasury(guild.id, myUid, amount);
      const s = useGameStore.getState();
      useGameStore.setState({ hero: { ...s.hero, gold: s.hero.gold - amount } });
      useGameStore.getState().saveGame();
      setDepositAmt('');
      onRefresh();
    } catch { setDepositErr('Error'); }
    finally { setDepositing(false); }
  }

  async function handleUpgrade(type: 'exp' | 'gold') {
    setUpgrading(type);
    try { await upgradeGuildStat(guild.id, myUid, type); onRefresh(); }
    catch { }
    finally { setUpgrading(null); }
  }

  async function handleSaveDesc() {
    setSavingDesc(true);
    try { await updateGuildDescription(guild.id, myUid, descVal.trim()); onRefresh(); setEditingDesc(false); }
    catch { }
    finally { setSavingDesc(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: isDesktop ? 'nowrap' : 'wrap' }}>

        {/* Guild image – left column on PC */}
        <div style={{ flex: isDesktop ? '0 0 240px' : '0 0 100%', position: 'relative', alignSelf: 'stretch', minHeight: 120, overflow: 'hidden', border: '1px solid rgba(157,78,221,0.3)' }}>
          <img src="/guild_base.webp" alt="Guild base" style={{ width: '100%', height: isDesktop ? '100%' : 'auto', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
          {/* Name / tag badge */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ ...PX(5), color: 'var(--gold-main)', background: 'rgba(0,0,0,0.65)', padding: '2px 6px', border: '1px solid rgba(255,215,0,0.35)' }}>[{guild.tag}]</span>
            <span style={{ ...PX(6), color: '#fff', background: 'rgba(0,0,0,0.65)', padding: '2px 6px', textShadow: '0 0 6px #000' }}>{guild.name}</span>
          </div>
        </div>

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Three boxes */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
        {/* EXP upgrade */}
        {(['exp', 'gold'] as const).map((type, idx) => {
          const lvl = type === 'exp' ? expLvl : goldLvl;
          const cost = type === 'exp' ? expCost : goldCost;
          const color = type === 'exp' ? '#00e5ff' : '#ffd700';
          const title = type === 'exp' ? t.guild.upgradeExpTitle : t.guild.upgradeGoldTitle;
          const maxed = lvl >= 50;
          const canAfford = treasury >= cost;
          const upgradeBox = (
            <div key={type} style={{
              flex: 1, background: 'var(--bg-inset)', border: `1px solid ${type === 'exp' ? 'rgba(0,229,255,0.25)' : 'rgba(255,215,0,0.25)'}`,
              padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <p style={{ ...PX(4), color, textShadow: `0 0 6px ${color}` }}>{title}</p>
              <p style={{ ...PX(8), color: '#fff', textAlign: 'center' }}>{t.guild.upgradeBonus(lvl)}</p>
              <p style={{ ...PX(4), color: 'var(--text-muted)', textAlign: 'center' }}>{t.guild.upgradeLevel(lvl)}</p>
              {!maxed && <p style={{ ...PX(4), color: canAfford ? '#ffd700' : '#555', textAlign: 'center' }}>{t.guild.upgradeCost(cost)}</p>}
              {maxed ? (
                <p style={{ ...PX(5), color, textAlign: 'center' }}>{t.guild.upgradeMaxed}</p>
              ) : canManage ? (
                <button onClick={() => handleUpgrade(type)} disabled={!!upgrading || !canAfford} className="btn btn-primary"
                  style={{ fontSize: 9, padding: '5px 4px', opacity: canAfford ? 1 : 0.4, marginTop: 'auto' }}>
                  {upgrading === type ? <GameIcon name="hourglass" size={10} /> : t.guild.upgradeBtn}
                </button>
              ) : (
                <p style={{ ...PX(4), color: '#555', textAlign: 'center' }}>{t.guild.upgradeNotLeader}</p>
              )}
            </div>
          );

          if (idx === 1) return upgradeBox;

          // Between EXP and Gold: treasury + deposit
          const depositBox = (
            <div key="deposit" style={{
              flex: 1.1, background: 'var(--bg-inset)', border: '1px solid rgba(255,215,0,0.25)',
              padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center',
            }}>
              <p style={{ ...PX(4), color: '#ffd700' }}>{t.guild.treasury}</p>
              <p style={{ ...PX(7), color: '#ffd700', textShadow: '0 0 8px rgba(255,215,0,0.5)', display: 'flex', alignItems: 'center', gap: 2 }}>{treasury.toLocaleString()}<GameIcon name="coin" size={10} /></p>
              <input
                type="number" min={1} max={hero.gold} value={depositAmt}
                onChange={e => { setDepositAmt(e.target.value); setDepositErr(''); }}
                placeholder={t.guild.depositLabel}
                style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontSize: 9, padding: '5px 6px', boxSizing: 'border-box' }}
              />
              <button onClick={handleDeposit} disabled={depositing} className="btn btn-primary" style={{ fontSize: 9, padding: '5px 8px', width: '100%' }}>
                {depositing ? <GameIcon name="hourglass" size={10} /> : t.guild.depositBtn}
              </button>
              {depositErr && <p style={{ ...PX(4), color: 'var(--hp-bright)' }}>{depositErr}</p>}
            </div>
          );

          return [upgradeBox, depositBox];
        })}
      </div>

      {/* Description — editable by leader */}
      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: '8px 10px' }}>
        {editingDesc ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              value={descVal} onChange={e => setDescVal(e.target.value)} maxLength={200} rows={3}
              style={{ width: '100%', background: 'var(--bg-deep)', border: '1px solid var(--border-main)', color: 'var(--text-dim)', fontFamily: "'Press Start 2P', monospace", fontSize: 9, padding: '6px 8px', boxSizing: 'border-box', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleSaveDesc} disabled={savingDesc} className="btn btn-primary" style={{ flex: 1, fontSize: 9, padding: '5px' }}>{savingDesc ? <GameIcon name="hourglass" size={10} /> : <><GameIcon name="check" size={9} /> ZAPISZ</>}</button>
              <button onClick={() => { setEditingDesc(false); setDescVal(guild.description ?? ''); }} className="btn btn-secondary" style={{ flex: 1, fontSize: 9, padding: '5px' }}>✕ ANULUJ</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <p style={{ ...PX(4), color: guild.description ? 'var(--text-dim)' : 'var(--text-muted)', fontStyle: guild.description ? 'normal' : 'italic', flex: 1 }}>
              {guild.description || (canManage ? '— dodaj opis gildii —' : '—')}
            </p>
            {canManage && (
              <button onClick={() => setEditingDesc(true)} className="btn btn-secondary" style={{ fontSize: 9, padding: '3px 7px', flexShrink: 0 }}>✎</button>
            )}
          </div>
        )}
      </div>

        </div>{/* end right column */}
      </div>{/* end image+content row */}
    </div>
  );
}

const ROLE_ORDER: Record<string, number> = { leader: 0, officer: 1, member: 2 };

function GuildView({ guild, myUid, onRefresh, playerPortraits, guildTab }: { guild: Guild; myUid: string; onRefresh: () => void; playerPortraits: Record<string, number>; guildTab: import('./BottomNav').GuildTabSub }) {
  const t = useT();
  const isEn = useLangStore(s => s.lang) === 'en';
  const [showInvite, setShowInvite] = useState(false);
  const [acting, setActing] = useState(false);
  const [leaderWarn, setLeaderWarn] = useState(false);
  type DlgState = { msg: string; okLabel?: string; cancelLabel?: string; onOk: () => void } | null;
  const [dlg, setDlg] = useState<DlgState>(null);
  function showConfirm(msg: string, onOk: () => void) {
    setDlg({ msg, cancelLabel: isEn ? 'Cancel' : 'Anuluj', onOk });
  }
  function showAlert(msg: string) {
    setDlg({ msg, okLabel: 'OK', onOk: () => setDlg(null) });
  }
  const isLeader = guild.leaderUid === myUid;
  const isOfficer = guild.members[myUid]?.role === 'officer';
  const canManage = isLeader || isOfficer;
  const members = Object.entries(guild.members).map(([uid, data]) => ({ uid, ...data }))
    .sort((a, b) => {
      const ro = (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2);
      return ro !== 0 ? ro : b.level - a.level;
    });
  const memberCount = members.length;

  function handleLeave() {
    if (isLeader && memberCount > 1) { setLeaderWarn(true); return; }
    showConfirm(isLeader ? t.guild.disbandConfirm : t.guild.leaveConfirm, async () => {
      setDlg(null);
      setActing(true);
      try {
        if (isLeader) await disbandGuild(guild.id, myUid);
        else await leaveGuild(guild.id, myUid);
        onRefresh();
      } finally { setActing(false); }
    });
  }

  function handleKick(uid: string, username: string) {
    showConfirm(t.guild.kickConfirm(username), async () => {
      setDlg(null);
      setActing(true);
      try { await leaveGuild(guild.id, uid); onRefresh(); }
      finally { setActing(false); }
    });
  }

  function handleTransfer(uid: string, username: string) {
    showConfirm(t.guild.transferConfirm(username), async () => {
      setDlg(null);
      setActing(true);
      try {
        await transferLeadership(guild.id, myUid, uid);
        onRefresh();
      } catch (e: any) {
        showAlert(isEn ? `Transfer failed: ${e?.message ?? 'unknown error'}` : `Błąd przekazania: ${e?.message ?? 'nieznany błąd'}`);
      } finally {
        setActing(false);
      }
    });
  }

  function handleSetOfficer(uid: string, currentRole: string) {
    const newRole = currentRole === 'officer' ? 'member' : 'officer';
    const label = newRole === 'officer'
      ? (isEn ? 'Promote to Officer?' : 'Mianować oficerem?')
      : (isEn ? 'Demote from Officer?' : 'Odebrać stopień oficera?');
    showConfirm(label, async () => {
      setDlg(null);
      setActing(true);
      try {
        await setMemberRole(guild.id, myUid, uid, newRole);
        onRefresh();
      } catch (e: any) {
        showAlert(isEn ? `Failed: ${e?.message ?? 'unknown error'}` : `Błąd: ${e?.message ?? 'nieznany błąd'}`);
      } finally {
        setActing(false);
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {showInvite && <InviteModal guild={guild} onClose={() => setShowInvite(false)} />}
      {dlg && <ConfirmDialog msg={dlg.msg} okLabel={dlg.okLabel} cancelLabel={dlg.cancelLabel} onOk={dlg.onOk} onCancel={() => setDlg(null)} />}

      {leaderWarn && (
        <div style={{ background: 'rgba(40,10,10,0.8)', border: '1px solid rgba(200,50,50,0.5)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...PX(4), color: '#f87171' }}>{t.guild.leaderWarning}</p>
          <button onClick={() => setLeaderWarn(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
      )}


      {/* CHAT view */}
      {guildTab === 'chat' && (
        <GuildChat
          guildId={guild.id}
          currentUid={myUid}
          username={members.find(m => m.uid === myUid)?.username ?? ''}
          portrait={members.find(m => m.uid === myUid)?.portrait ?? 0}
        />
      )}

      {/* OPS view */}
      {guildTab === 'ops' && (
        <GuildOperationPanel guild={guild} guildId={guild.id} myUid={myUid} />
      )}

      {/* BOSS view */}
      {guildTab === 'boss' && (
        <GuildBossPanel
          guildId={guild.id}
          username={members.find(m => m.uid === myUid)?.username ?? ''}
        />
      )}

      {/* WAR view */}
      {guildTab === 'war' && (
        <GuildWarPanel guild={guild} myUid={myUid} />
      )}

      {/* INFO view */}
      {guildTab === 'info' && <>

      {/* Guild base image with overlaid treasury + upgrades */}
      <GuildUpgrades guild={guild} myUid={myUid} onRefresh={onRefresh} />

      {/* Members */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...PX(5), color: 'var(--gold-main)' }}>{t.guild.membersTitle}</p>
          {canManage && (
            <button onClick={() => setShowInvite(true)} className="btn btn-primary" style={{ fontSize: 10, padding: '4px 8px' }}>
              {t.guild.inviteBtn}
            </button>
          )}
        </div>

        {members.map(m => {
          const isMe = m.uid === myUid;
          const borderColor = m.role === 'leader' ? 'var(--gold-darker)' : m.role === 'officer' ? 'rgba(100,180,255,0.4)' : 'var(--border-dark)';
          const nameColor   = m.role === 'leader' ? 'var(--gold-bright)' : m.role === 'officer' ? '#7dd3fc' : 'var(--text-bright)';
          // Officers can kick regular members; leader can kick anyone except self
          const canKick = !isMe && m.role !== 'leader' && (isLeader || (isOfficer && m.role === 'member'));
          return (
            <div key={m.uid} style={{
              background: isMe ? 'rgba(28,20,8,0.7)' : 'var(--bg-inset)',
              border: `1px solid ${borderColor}`,
              padding: '7px 8px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0 }}>
                <img src={portraitSrc(resolvePortrait(playerPortraits[m.uid] ?? m.portrait, m.username))} alt="portret" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
                  <p style={{ ...PX(6), color: nameColor }}>
                    {m.role === 'leader' ? <><GameIcon name="crown" size={10} color="#ffd700" /> </> : ''}{m.username}{isMe ? ' ◀' : ''}
                  </p>
                  {m.role === 'officer' && (
                    <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#7dd3fc', background: 'rgba(100,180,255,0.1)', border: '1px solid rgba(100,180,255,0.35)', padding: '1px 4px' }}>
                      OFICER
                    </span>
                  )}
                </div>
                <p style={{ ...PX(4), color: 'var(--text-muted)' }}>POZ.{m.level}</p>
                {(guild.contributions?.[m.uid] ?? 0) > 0 && (
                  <p style={{ ...PX(4), color: '#ffd700', marginTop: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <GameIcon name="coin" size={10} /> {(guild.contributions?.[m.uid] ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {isLeader && !isMe && (
                  <>
                    <button
                      onClick={() => handleSetOfficer(m.uid, m.role)}
                      disabled={acting}
                      className="btn btn-secondary"
                      style={{ fontSize: 10, padding: '3px 5px', color: m.role === 'officer' ? '#fbbf24' : '#7dd3fc' }}
                      title={m.role === 'officer' ? (isEn ? 'Demote from Officer' : 'Odbierz stopień oficera') : (isEn ? 'Promote to Officer' : 'Mianuj oficerem')}
                    >
                      <GameIcon name="star" size={11} color={m.role === 'officer' ? '#fbbf24' : '#7dd3fc'} />
                    </button>
                    <button
                      onClick={() => handleTransfer(m.uid, m.username)}
                      disabled={acting}
                      className="btn btn-secondary"
                      style={{ fontSize: 10, padding: '3px 5px' }}
                      title={isEn ? 'Transfer leadership' : 'Przekaż przywództwo'}
                    ><GameIcon name="crown" size={11} color="#ffd700" /></button>
                  </>
                )}
                {canKick && (
                  <button
                    onClick={() => handleKick(m.uid, m.username)}
                    disabled={acting}
                    className="btn btn-danger"
                    style={{ fontSize: 10, padding: '3px 5px' }}
                    title={t.guild.kickBtn}
                  >✕</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave / disband */}
      <button
        onClick={handleLeave}
        disabled={acting}
        className="btn btn-danger"
        style={{ width: '100%', fontSize: 10, padding: '8px' }}
      >
        {isLeader ? t.guild.disbandBtn : t.guild.leaveBtn}
      </button>
      </>}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export default function GuildPanel({ guildTab, onGuildTabChange }: { guildTab: import('./BottomNav').GuildTabSub; onGuildTabChange: (t: import('./BottomNav').GuildTabSub) => void }) {
  const user = useAuthStore(s => s.user);
  const t = useT();
  const setGuildBonuses = useGameStore(s => s.setGuildBonuses);

  const [guild, setGuild] = useState<Guild | null>(null);
  const [invites, setInvites] = useState<GuildInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerPortraits, setPlayerPortraits] = useState<Record<string, number>>({});

  async function load() {
    if (!user || !isFirebaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const [guildId, myInvites, leaderboard] = await Promise.all([
        getMyGuildId(user.uid),
        getMyInvites(user.uid),
        getLeaderboard(),
      ]);
      const portraits: Record<string, number> = {};
      for (const e of leaderboard) portraits[e.uid] = resolvePortrait(e.portrait, e.username);
      setPlayerPortraits(portraits);
      setInvites(myInvites);
      if (guildId) {
        const g = await getGuild(guildId);
        if (g) {
          const memberUids = Object.keys(g.members);
          const liveData = await getGuildMemberLevels(memberUids);
          const updatedMembers = { ...g.members };
          for (const [uid, live] of Object.entries(liveData)) {
            if (updatedMembers[uid]) {
              updatedMembers[uid] = {
                ...updatedMembers[uid],
                level: live.level,
                heroName: live.heroName || updatedMembers[uid].heroName,
                portrait: live.portrait ?? updatedMembers[uid].portrait,
              };
            }
          }
          setGuild({ ...g, members: updatedMembers });
          setGuildBonuses(g.expUpgrade ?? 0, g.goldUpgrade ?? 0);
        } else {
          setGuild(null);
          setGuildBonuses(0, 0);
        }
      } else {
        setGuild(null);
        setGuildBonuses(0, 0);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user?.uid]);

  if (!isFirebaseConfigured || !user) {
    return (
      <div className="card p-3">
        <p style={{ ...PX(8), color: 'var(--gold-main)', textShadow: '0 0 10px var(--gold-glow)', marginBottom: 10 }}>{t.guild.title}</p>
        <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-dark)', padding: 16, textAlign: 'center' }}>
          <p style={{ ...PX(6), color: 'var(--text-muted)' }}>{t.guild.needAccount}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-3">
        <p style={{ ...PX(6), color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>{t.guild.loading}</p>
      </div>
    );
  }

  return (
    <div className="card p-3">
      {guild ? (
        <GuildView guild={guild} myUid={user.uid} onRefresh={load} playerPortraits={playerPortraits} guildTab={guildTab} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {invites.length > 0 && <InvitesList invites={invites} onRefresh={load} />}
          <CreateGuildForm onCreated={load} />
        </div>
      )}
    </div>
  );
}
