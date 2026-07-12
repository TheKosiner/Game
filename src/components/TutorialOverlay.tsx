import { useEffect, useState } from 'react';
import { useT } from '../hooks/useT';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { PX, MONO, ORB } from '../utils/styles';
import type { MainTab, PlaySub, SocialSub, ShopSub, GuildTabSub } from './BottomNav';
import type { Translations } from '../i18n';

// ── Persistence ───────────────────────────────────────────────────────────────
// done: the player finished or dismissed the tour (never auto-open again)
// auto: master switch — show the tutorial automatically at startup
const CFG_KEY = 'glitchsoul_tutorial';

export interface TutorialCfg { done: boolean; auto: boolean }

export function getTutorialCfg(): TutorialCfg {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) return { done: false, auto: true };
    const p = JSON.parse(raw);
    return { done: !!p.done, auto: p.auto !== false };
  } catch { return { done: false, auto: true }; }
}

export function saveTutorialCfg(patch: Partial<TutorialCfg>) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify({ ...getTutorialCfg(), ...patch })); } catch {}
}

// ── Step data ─────────────────────────────────────────────────────────────────
export interface TutorialNav {
  tab: MainTab;
  playSub?: PlaySub;
  socialSub?: SocialSub;
  shopSub?: ShopSub;
  guildTab?: GuildTabSub;
}

type SectionId = keyof Translations['tutorial']['sections'];
type StepKey   = keyof Translations['tutorial']['steps'];

interface TutStep { key: StepKey; section: SectionId; nav: TutorialNav }

const STEPS: TutStep[] = [
  // Basics — the hero screen is a calm backdrop for interface steps
  { key: 'topbar',    section: 'basics', nav: { tab: 'hero' } },
  { key: 'navbar',    section: 'basics', nav: { tab: 'hero' } },
  // Hero
  { key: 'heroCard',  section: 'hero',   nav: { tab: 'hero' } },
  { key: 'inventory', section: 'hero',   nav: { tab: 'hero' } },
  // Play
  { key: 'dungeon',   section: 'play',   nav: { tab: 'play', playSub: 'dungeon' } },
  { key: 'boss',      section: 'play',   nav: { tab: 'play', playSub: 'challenge' } },
  { key: 'quests',    section: 'play',   nav: { tab: 'play', playSub: 'quests' } },
  { key: 'arena',     section: 'play',   nav: { tab: 'play', playSub: 'pvp' } },
  { key: 'krypta',    section: 'play',   nav: { tab: 'play', playSub: 'krypta' } },
  // Guild
  { key: 'guildInfo', section: 'guild',  nav: { tab: 'guild', guildTab: 'info' } },
  { key: 'guildBoss', section: 'guild',  nav: { tab: 'guild', guildTab: 'boss' } },
  { key: 'guildOps',  section: 'guild',  nav: { tab: 'guild', guildTab: 'ops' } },
  { key: 'guildWar',  section: 'guild',  nav: { tab: 'guild', guildTab: 'war' } },
  // Social
  { key: 'ranking',   section: 'social', nav: { tab: 'social', socialSub: 'ranking' } },
  { key: 'mail',      section: 'social', nav: { tab: 'social', socialSub: 'mail' } },
  { key: 'chat',      section: 'social', nav: { tab: 'social', socialSub: 'chat' } },
  // Market
  { key: 'shop',      section: 'market', nav: { tab: 'shop', shopSub: 'shop' } },
  { key: 'gems',      section: 'market', nav: { tab: 'shop', shopSub: 'gems' } },
  { key: 'smith',     section: 'market', nav: { tab: 'shop', shopSub: 'smith' } },
  { key: 'casino',    section: 'market', nav: { tab: 'shop', shopSub: 'casino' } },
  { key: 'enchanter', section: 'market', nav: { tab: 'shop', shopSub: 'enchanter' } },
  // Lobby
  { key: 'lobby',     section: 'lobby',  nav: { tab: 'lobby' } },
];

const SECTION_ORDER: SectionId[] = ['basics', 'hero', 'play', 'guild', 'social', 'market', 'lobby'];

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (nav: TutorialNav) => void;
}

export default function TutorialOverlay({ open, onClose, onNavigate }: Props) {
  const t = useT();
  const isDesktop = useIsDesktop();
  const [phase, setPhase] = useState<'intro' | 'tour' | 'outro'>('intro');
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(() => getTutorialCfg().auto);

  // Restart from the intro every time the tutorial is opened
  useEffect(() => {
    if (open) { setPhase('intro'); setIdx(0); setAuto(getTutorialCfg().auto); }
  }, [open]);

  // Drive the app to the screen the current step describes
  useEffect(() => {
    if (!open || phase !== 'tour') return;
    onNavigate(STEPS[idx].nav);
  }, [open, phase, idx]);

  if (!open) return null;

  const step = STEPS[idx];
  const sectionIdx = SECTION_ORDER.indexOf(step.section);

  const finish = () => { saveTutorialCfg({ done: true }); onClose(); };

  const toggleAuto = () => {
    const next = !auto;
    setAuto(next);
    saveTutorialCfg({ auto: next });
  };

  const next = () => {
    if (idx >= STEPS.length - 1) setPhase('outro');
    else setIdx(idx + 1);
  };
  const back = () => { if (idx > 0) setIdx(idx - 1); };
  const skipSection = () => {
    const after = STEPS.findIndex((s, i) => i > idx && s.section !== step.section);
    if (after === -1) setPhase('outro');
    else setIdx(after);
  };

  const autoToggle = (
    <button
      onClick={toggleAuto}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
      }}
    >
      <span style={{
        width: 30, height: 16, borderRadius: 8, position: 'relative', flexShrink: 0,
        background: auto ? 'rgba(0,245,255,0.35)' : 'rgba(255,255,255,0.12)',
        border: `1px solid ${auto ? '#00f5ff' : 'rgba(255,255,255,0.25)'}`,
        transition: 'all 0.15s ease',
      }}>
        <span style={{
          position: 'absolute', top: 1, left: auto ? 15 : 1,
          width: 12, height: 12, borderRadius: '50%',
          background: auto ? '#00f5ff' : 'rgba(255,255,255,0.5)',
          boxShadow: auto ? '0 0 6px #00f5ff' : 'none',
          transition: 'all 0.15s ease',
        }} />
      </span>
      <span style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)' }}>
        {t.tutorial.autoShow}: <span style={{ color: auto ? '#00f5ff' : 'var(--text-muted)' }}>{auto ? t.tutorial.on : t.tutorial.off}</span>
      </span>
    </button>
  );

  // ── Intro / outro: centered modal with dim ──
  if (phase === 'intro' || phase === 'outro') {
    const isIntro = phase === 'intro';
    return (
      // 9998: above in-page panels (HeroCard sits at 9997) but below fixed modals (9999+)
      <div className="overlay-fade" style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div className="modal-pop" style={{
          width: '100%', maxWidth: 400,
          background: 'linear-gradient(160deg, rgba(10,14,26,0.98), rgba(16,8,26,0.99))',
          border: '1px solid rgba(0,245,255,0.4)',
          boxShadow: '0 0 40px rgba(0,245,255,0.15), 0 0 80px rgba(255,45,120,0.08)',
          padding: '22px 18px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <p style={{ fontSize: 34, lineHeight: 1 }}>{isIntro ? '🎓' : '🏆'}</p>
          <p style={{ ...ORB, fontSize: 15, fontWeight: 900, color: '#00f5ff', textShadow: '0 0 12px rgba(0,245,255,0.6)' }}>
            {isIntro ? t.tutorial.introTitle : t.tutorial.outroTitle}
          </p>
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7, textAlign: 'left' }}>
            {isIntro ? t.tutorial.introBody : t.tutorial.outroBody}
          </p>
          {autoToggle}
          {isIntro ? (
            <>
              <button onClick={() => setPhase('tour')} className="btn btn-primary" style={{ width: '100%', fontSize: 10, padding: 11 }}>
                {t.tutorial.start}
              </button>
              <button onClick={finish} className="btn btn-secondary" style={{ width: '100%', fontSize: 10, padding: 9, color: 'var(--text-muted)' }}>
                {t.tutorial.skipAll}
              </button>
            </>
          ) : (
            <button onClick={finish} className="btn btn-primary" style={{ width: '100%', fontSize: 10, padding: 11 }}>
              {t.tutorial.finish}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Tour: floating card, the live screen stays visible and interactive ──
  const info = t.tutorial.steps[step.key];
  return (
    <div style={{
      position: 'fixed', zIndex: 9998, pointerEvents: 'none',
      ...(isDesktop
        ? { right: 20, bottom: 20, width: 360 }
        : { left: 8, right: 8, bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))' }),
    }}>
      <div className="modal-pop" style={{
        pointerEvents: 'auto',
        background: 'linear-gradient(160deg, rgba(10,14,26,0.97), rgba(16,8,26,0.98))',
        border: '1px solid rgba(0,245,255,0.45)',
        boxShadow: '0 0 30px rgba(0,245,255,0.18), 0 8px 40px rgba(0,0,0,0.7)',
        padding: '12px 12px 10px',
        display: 'flex', flexDirection: 'column', gap: 8,
        maxWidth: 480, margin: '0 auto',
      }}>
        {/* Header: section chips + step counter + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3, flex: 1 }}>
            {SECTION_ORDER.map((s, i) => (
              <span key={s} style={{
                flex: 1, height: 3,
                background: i < sectionIdx ? 'rgba(0,245,255,0.55)'
                  : i === sectionIdx ? '#ff2d78'
                  : 'rgba(255,255,255,0.12)',
                boxShadow: i === sectionIdx ? '0 0 6px #ff2d78' : 'none',
              }} />
            ))}
          </div>
          <span style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
            {t.tutorial.step(idx + 1, STEPS.length)}
          </span>
          <button
            onClick={finish}
            aria-label={t.tutorial.close}
            style={{
              background: 'none', border: '1px solid rgba(255,45,120,0.4)', color: '#ff2d78',
              width: 22, height: 22, lineHeight: 1, cursor: 'pointer', fontSize: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Section + title */}
        <div>
          <p style={{ ...PX(5), color: '#ff2d78', marginBottom: 3, letterSpacing: '0.1em' }}>
            {t.tutorial.title} · {t.tutorial.sections[step.section]}
          </p>
          <p style={{ ...ORB, fontSize: 12, fontWeight: 900, color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.5)' }}>
            {info.title}
          </p>
        </div>

        <p style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.65 }}>
          {info.body}
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={back}
            disabled={idx === 0}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: 9, padding: '8px 4px', opacity: idx === 0 ? 0.4 : 1 }}
          >{t.tutorial.back}</button>
          <button
            onClick={skipSection}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: 9, padding: '8px 4px', color: 'var(--text-muted)' }}
          >{t.tutorial.skipSection}</button>
          <button
            onClick={next}
            className="btn btn-primary"
            style={{ flex: 1.3, fontSize: 9, padding: '8px 4px' }}
          >{idx >= STEPS.length - 1 ? t.tutorial.finish : t.tutorial.next}</button>
        </div>
      </div>
    </div>
  );
}
