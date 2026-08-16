import { useState } from 'react';
import { useLangStore } from '../store/langStore';
import { MONO, ORB } from '../utils/styles';
import logoImg from '../assets/logo.webp';
import CyberpunkBg from './CyberpunkBg';
import { LANDING } from '../i18n/landing';
import { LANGUAGES, type Lang } from '../i18n';
import { APK_URL } from '../lib/publicRoutes';

// Screenshot files; alt text/captions live in LANDING[lang].shots, same order.
const SHOT_SRCS = [
  '/screens/hero.webp', '/screens/dungeon.webp', '/screens/boss.webp',
  '/screens/arena.webp', '/screens/krypta.webp', '/screens/shop.webp',
];



// ── Shared chrome ─────────────────────────────────────────────────────────────
function LangToggle({ onSwitchLang }: { onSwitchLang: (l: Lang) => void }) {
  const lang = useLangStore(s => s.lang);
  return (
    <select
      value={lang}
      onChange={e => onSwitchLang(e.target.value as Lang)}
      aria-label="Language"
      style={{
        ...MONO, fontSize: 11, lineHeight: 1, padding: '5px 6px',
        color: '#00f5ff', background: 'rgba(0,245,255,0.06)',
        border: '1px solid rgba(0,245,255,0.3)', borderRadius: 0,
        cursor: 'pointer', appearance: 'none',
      }}
    >
      {LANGUAGES.map(l => (
        <option key={l.code} value={l.code} style={{ background: '#0a0a14', color: '#e8e8ff' }}>
          {l.label} · {l.name}
        </option>
      ))}
    </select>
  );
}

function Logo({ size = 15 }: { size?: number }) {
  return (
    <span style={{ ...ORB, fontSize: size, fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap' }}>
      <span style={{ color: '#00f5ff', textShadow: '0 0 8px #00f5ff' }}>Glitch</span>
      <span style={{ color: '#ff2d78', textShadow: '0 0 8px #ff2d78' }}>Soul</span>
    </span>
  );
}

function TopBar({ onPlay, onHome, showHome, onSwitchLang }: { onPlay: () => void; onHome?: () => void; showHome?: boolean; onSwitchLang: (l: Lang) => void }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(6,6,16,0.92)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,45,120,0.25)',
      padding: 'calc(8px + env(safe-area-inset-top, 0px)) 12px 8px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {showHome
          ? <button onClick={onHome} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Logo /></button>
          : <Logo />}
        <span style={{ flex: 1 }} />
        <LangToggle onSwitchLang={onSwitchLang} />
        <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 9, padding: '7px 12px' }}>
          <PlayLabel />
        </button>
      </div>
    </header>
  );
}

function PlayLabel() {
  const lang = useLangStore(s => s.lang);
  return <>{LANDING[lang].navPlay}</>;
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{ padding: '40px 14px', ...style }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      ...ORB, fontSize: 17, fontWeight: 900, color: '#00f5ff',
      textShadow: '0 0 14px rgba(0,245,255,0.5)', letterSpacing: '0.04em',
      marginBottom: 12, lineHeight: 1.3,
    }}>{children}</h2>
  );
}

function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ ...MONO, fontSize: 13, lineHeight: 1.75, color: 'var(--text-dim)', ...style }}>{children}</p>;
}

// ── Landing page ──────────────────────────────────────────────────────────────
interface Props {
  onPlay: () => void;
  onDownloadPage: () => void;
  onHome: () => void;
  onSwitchLang: (l: Lang) => void;
  page: 'landing' | 'download';
}

export default function LandingPage({ onPlay, onDownloadPage, onHome, onSwitchLang, page }: Props) {
  const lang = useLangStore(s => s.lang);
  const t = LANDING[lang];
  const [shot, setShot] = useState<string | null>(null);

  if (page === 'download') {
    return (
      <>
        <CyberpunkBg />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <TopBar onPlay={onPlay} onHome={onHome} showHome onSwitchLang={onSwitchLang} />
          <main style={{ flex: 1 }}>
            <Section>
              <button onClick={onHome} style={{ ...MONO, fontSize: 11, color: '#00f5ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16 }}>
                {t.backHome}
              </button>
              <h1 style={{ ...ORB, fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 14, textShadow: '0 0 18px rgba(255,45,120,0.35)' }}>
                {t.downloadTitle}
              </h1>
              <Body style={{ marginBottom: 24, maxWidth: 640 }}>{t.downloadLead}</Body>

              <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
                {t.downloadSteps.map((s, i) => (
                  <li key={i} className="card p-3" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ ...ORB, fontSize: 14, color: '#ff2d78', textShadow: '0 0 10px rgba(255,45,120,0.6)', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ ...MONO, fontSize: 12, lineHeight: 1.7, color: 'var(--text-dim)' }}>{s}</span>
                  </li>
                ))}
              </ol>

              <a href={APK_URL} className="btn btn-primary" style={{ display: 'inline-block', fontSize: 11, padding: '14px 26px', textDecoration: 'none' }}>
                {t.ctaDownload}
              </a>
              <Body style={{ marginTop: 16, fontSize: 11, maxWidth: 640 }}>{t.downloadNote}</Body>
              <div style={{ marginTop: 24 }}>
                <button onClick={onPlay} style={{ ...MONO, fontSize: 12, color: '#00f5ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {t.orBrowser}
                </button>
              </div>
            </Section>
          </main>
          <Footer onDownloadPage={onDownloadPage} onPlay={onPlay} />
        </div>
      </>
    );
  }

  return (
    <>
      <CyberpunkBg />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <TopBar onPlay={onPlay} onSwitchLang={onSwitchLang} />

        <main>
          {/* ── HERO ── */}
          <Section style={{ paddingTop: 34, paddingBottom: 30 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, alignItems: 'center' }}>
              <div style={{ flex: '1 1 340px', minWidth: 0 }}>
                <img src={logoImg} alt="GlitchSoul" width={200} height={68}
                  style={{ height: 68, width: 'auto', marginBottom: 16, filter: 'drop-shadow(0 0 18px rgba(0,245,255,0.5))' }} />
                <h1 style={{ ...ORB, fontSize: 25, fontWeight: 900, color: '#fff', lineHeight: 1.22, marginBottom: 14, textShadow: '0 0 22px rgba(255,45,120,0.4)' }}>
                  {t.heroTitle}
                </h1>
                <Body style={{ fontSize: 13.5, marginBottom: 18 }}>{t.heroLead}</Body>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {t.badges.map(b => (
                    <li key={b} style={{
                      ...MONO, fontSize: 10, color: '#00f5ff', letterSpacing: '0.04em',
                      background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.28)',
                      padding: '5px 10px',
                    }}>✓ {b}</li>
                  ))}
                </ul>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 11, padding: '14px 24px' }}>
                    {t.ctaPlay}
                  </button>
                  <button onClick={onDownloadPage} className="btn btn-secondary" style={{ fontSize: 11, padding: '14px 24px' }}>
                    {t.ctaDownload}
                  </button>
                </div>
                <Body style={{ fontSize: 11, marginTop: 14, color: 'var(--text-muted)' }}>{t.ctaNote}</Body>
              </div>

              <div style={{ flex: '0 1 280px', display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                <img src="/screens/hero.webp" alt={LANDING[lang].shots[0]} width={260} height={532} loading="eager"
                  style={{
                    width: '100%', maxWidth: 260, height: 'auto',
                    border: '1px solid rgba(255,45,120,0.35)',
                    boxShadow: '0 0 40px rgba(255,45,120,0.18), 0 20px 60px rgba(0,0,0,0.7)',
                  }} />
              </div>
            </div>
          </Section>

          {/* ── STATS ── */}
          <Section style={{ paddingTop: 20, paddingBottom: 20 }}>
            <h2 style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>
              {t.statsTitle}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {t.statsItems.map(s => (
                <div key={s.l} className="card p-3" style={{ textAlign: 'center' }}>
                  <p style={{ ...ORB, fontSize: 20, fontWeight: 900, color: '#ff2d78', textShadow: '0 0 14px rgba(255,45,120,0.5)' }}>{s.n}</p>
                  <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── NO PAY-TO-WIN ── */}
          <Section>
            <div style={{ border: '1px solid rgba(255,45,120,0.35)', background: 'rgba(255,45,120,0.04)', padding: '26px 18px' }}>
              <H2>{t.p2wTitle}</H2>
              <Body style={{ marginBottom: 22, maxWidth: 720, fontSize: 13.5 }}>{t.p2wLead}</Body>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {t.p2wPoints.map(p => (
                  <div key={p.h}>
                    <h3 style={{ ...ORB, fontSize: 12, color: '#ff2d78', marginBottom: 7, letterSpacing: '0.03em' }}>{p.h}</h3>
                    <Body style={{ fontSize: 12 }}>{p.p}</Body>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── FEATURES ── */}
          <Section>
            <H2>{t.featTitle}</H2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginTop: 18 }}>
              {t.feats.map(f => (
                <article key={f.h} className="card p-3">
                  <p style={{ fontSize: 22, lineHeight: 1, marginBottom: 8 }} aria-hidden="true">{f.icon}</p>
                  <h3 style={{ ...ORB, fontSize: 12, color: '#00f5ff', marginBottom: 7, letterSpacing: '0.03em' }}>{f.h}</h3>
                  <Body style={{ fontSize: 12 }}>{f.p}</Body>
                </article>
              ))}
            </div>
          </Section>

          {/* ── SCREENSHOTS ── */}
          <Section>
            <H2>{t.shotsTitle}</H2>
            <Body style={{ marginBottom: 18 }}>{t.shotsLead}</Body>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {SHOT_SRCS.map((src, i) => (
                <figure key={src} style={{ margin: 0 }}>
                  <button onClick={() => setShot(src)} style={{ display: 'block', width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'zoom-in' }}>
                    <img src={src} alt={LANDING[lang].shots[i]} loading="lazy" width={200} height={409}
                      style={{
                        width: '100%', height: 'auto', display: 'block',
                        border: '1px solid rgba(0,245,255,0.25)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                      }} />
                  </button>
                  <figcaption style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.45 }}>
                    {LANDING[lang].shots[i]}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>

          {/* ── BY PLAYERS ── */}
          <Section>
            <div style={{ border: '1px solid rgba(0,245,255,0.28)', background: 'rgba(0,245,255,0.03)', padding: '26px 18px' }}>
              <H2>{t.byPlayersTitle}</H2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 780 }}>
                {t.byPlayersBody.map((p, i) => <Body key={i}>{p}</Body>)}
              </div>
            </div>
          </Section>

          {/* ── PLATFORMS ── */}
          <Section>
            <H2>{t.playTitle}</H2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 18 }}>
              <article className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ ...ORB, fontSize: 13, color: '#00f5ff' }}>{t.playBrowser.h}</h3>
                <Body style={{ fontSize: 12, flex: 1 }}>{t.playBrowser.p}</Body>
                <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 10, padding: '12px' }}>{t.playBrowser.cta}</button>
              </article>
              <article className="card p-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ ...ORB, fontSize: 13, color: '#ff2d78' }}>{t.playApk.h}</h3>
                <Body style={{ fontSize: 12, flex: 1 }}>{t.playApk.p}</Body>
                <button onClick={onDownloadPage} className="btn btn-secondary" style={{ fontSize: 10, padding: '12px' }}>{t.playApk.cta}</button>
              </article>
            </div>
          </Section>

          {/* ── FAQ ── */}
          <Section>
            <H2>{t.faqTitle}</H2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {t.faq.map(f => (
                <details key={f.q} className="card" style={{ padding: '12px 14px' }}>
                  <summary style={{ ...ORB, fontSize: 12, color: 'var(--text-bright)', cursor: 'pointer', letterSpacing: '0.02em', lineHeight: 1.5 }}>
                    {f.q}
                  </summary>
                  <Body style={{ fontSize: 12, marginTop: 10 }}>{f.a}</Body>
                </details>
              ))}
            </div>
          </Section>

          {/* ── FINAL CTA ── */}
          <Section style={{ paddingBottom: 44 }}>
            <div style={{ textAlign: 'center', border: '1px solid rgba(255,45,120,0.35)', padding: '32px 18px', background: 'rgba(255,45,120,0.05)' }}>
              <h2 style={{ ...ORB, fontSize: 19, fontWeight: 900, color: '#fff', marginBottom: 10, textShadow: '0 0 18px rgba(255,45,120,0.5)' }}>
                {t.finalTitle}
              </h2>
              <Body style={{ marginBottom: 20, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>{t.finalBody}</Body>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                <button onClick={onPlay} className="btn btn-primary" style={{ fontSize: 11, padding: '14px 28px' }}>{t.ctaPlay}</button>
                <button onClick={onDownloadPage} className="btn btn-secondary" style={{ fontSize: 11, padding: '14px 28px' }}>{t.ctaDownload}</button>
              </div>
            </div>
          </Section>
        </main>

        <Footer onDownloadPage={onDownloadPage} onPlay={onPlay} />
      </div>

      {/* Screenshot lightbox */}
      {shot && (
        <div onClick={() => setShot(null)} role="dialog" aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out',
          }}>
          <img src={shot} alt="" style={{ maxWidth: '100%', maxHeight: '100%', border: '1px solid rgba(0,245,255,0.4)' }} />
        </div>
      )}
    </>
  );
}

function Footer({ onDownloadPage, onPlay }: { onDownloadPage: () => void; onPlay: () => void }) {
  const lang = useLangStore(s => s.lang);
  const t = LANDING[lang];
  return (
    <footer style={{ borderTop: '1px solid rgba(255,45,120,0.2)', padding: '26px 14px calc(26px + env(safe-area-inset-bottom, 0px))', background: 'rgba(4,4,12,0.7)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px' }}>
          <Logo size={14} />
          <p style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)', marginTop: 7, lineHeight: 1.6 }}>{t.footerTagline}</p>
        </div>
        <nav style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={onPlay} style={{ ...MONO, fontSize: 11, color: '#00f5ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t.navPlay}</button>
          <button onClick={onDownloadPage} style={{ ...MONO, fontSize: 11, color: '#00f5ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t.navDownload}</button>
        </nav>
      </div>
      <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
        © {new Date().getFullYear()} GlitchSoul. {t.footerRights}
      </p>
    </footer>
  );
}
