import { useState, useRef } from 'react';
import { ALL_DUNGEONS } from '../data/dungeons';
import { MONO } from '../utils/styles';

type Dungeon = (typeof ALL_DUNGEONS)[0];

interface Props {
  isDungeonUnlocked: (idx: number) => boolean;
  completed: string[];
  selected: Dungeon | null;
  onSelect: (d: Dungeon) => void;
  isEn: boolean;
}

// SVG viewBox 160 × 90 — positions match ALL_DUNGEONS index order
const POS: [number, number][] = [
  [10,  76], // 0  forest        — Slumsy
  [22,  62], // 1  cave          — Tech Podziemia
  [40,  52], // 2  castle        — Korpo HQ
  [18,  38], // 3  westland      — Pustkowia
  [44,  26], // 4  dragon_lair   — Twierdza
  [64,  36], // 5  sewers        — Kanały
  [62,  62], // 6  neon_undercity— Neon Undercity
  [84,  72], // 7  biotech_lab   — Lab Biotech
  [90,  54], // 8  zero_zone     — Strefa Zero
  [102, 36], // 9  ghost_network — Sieć Widm
  [116, 22], // 10 corrupted_matrix — Zak. Matryca
  [130, 38], // 11 system_core   — Jądro Systemu
  [134, 62], // 12 apocalypse_zone— Str. Apokalipsy
  [148, 46], // 13 void_nexus    — Nexus Próżni
  [152, 24], // 14 network_end   — Koniec Sieci
];

// Sequential path + a few aesthetic cross-connections
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
  [2, 4], [5, 8], [9, 11], // aesthetic branches
];

// Deterministic pseudo-noise for city background (seeded, stable)
function rng(i: number): number {
  return Math.abs((Math.sin(i * 9301 + 49297) * 233280) % 1);
}

// Pre-computed city blocks — stable across renders
const BLOCKS = Array.from({ length: 230 }, (_, i) => ({
  x: rng(i) * 160,
  y: rng(i + 100) * 90,
  w: 0.4 + rng(i + 200) * 1.8,
  h: 0.3 + rng(i + 300) * 1.4,
  cyan: rng(i + 400) > 0.52,
  op: 0.1 + rng(i + 500) * 0.32,
}));

const W = 160, H = 90;
const NODE_R = 2.9;

export default function DungeonMapView({ isDungeonUnlocked, completed, selected, onSelect, isEn }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const completedSet = new Set(completed);

  type Popup = { idx: number; left: number; top: number };
  const [popup, setPopup] = useState<Popup | null>(null);

  // ── Node colour ──────────────────────────────────────────────────────────
  function nodeColor(idx: number): string {
    const d = ALL_DUNGEONS[idx];
    if (selected?.id === d.id) return '#ff2d78';
    if (!isDungeonUnlocked(idx)) return '#5a4a78';
    if (completedSet.has(d.id)) return '#2de5ff';
    return '#ffc83a';
  }

  // ── Edge styling ─────────────────────────────────────────────────────────
  function edgeInfo(a: number, b: number) {
    const ac = completedSet.has(ALL_DUNGEONS[a].id);
    const bc = completedSet.has(ALL_DUNGEONS[b].id);
    const au = isDungeonUnlocked(a);
    const bu = isDungeonUnlocked(b);
    if (ac && bc) return { color: 'rgba(45,229,255,0.75)', op: 0.80, flow: true };
    if (au && bu) return { color: 'rgba(255,200,58,0.55)',  op: 0.60, flow: false };
    return { color: 'rgba(74,31,122,0.3)', op: 0.35, flow: false };
  }

  // ── Node click → calculate popup position ────────────────────────────────
  function handleNodeClick(idx: number, e: React.MouseEvent<SVGGElement>) {
    e.stopPropagation();
    if (popup?.idx === idx) { setPopup(null); return; }
    const wrap = wrapRef.current;
    if (!wrap) return;
    const W_px = wrap.clientWidth;
    const H_px = wrap.clientHeight;
    const [sx, sy] = POS[idx];
    const px = (sx / W) * W_px;
    const py = (sy / H) * H_px;

    const PW = 192, PH = 195;
    let left = px + 18;
    let top  = py - 55;
    if (left + PW > W_px - 8) left = px - PW - 18;
    if (top  + PH > H_px - 8) top  = H_px - PH - 8;
    if (top < 8) top = 8;
    if (left < 8) left = 8;
    setPopup({ idx, left, top });
  }

  function handleSelect(idx: number) {
    onSelect(ALL_DUNGEONS[idx]);
    setPopup(null);
  }

  // ── Popup data ────────────────────────────────────────────────────────────
  const pd   = popup ? ALL_DUNGEONS[popup.idx] : null;
  const pUnl = popup ? isDungeonUnlocked(popup.idx) : false;
  const pCmp = pd ? completedSet.has(pd.id) : false;
  const pSel = pd ? selected?.id === pd.id : false;
  const pAcc = pCmp ? '#2de5ff' : pUnl ? '#ffc83a' : '#5a4a78';

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', aspectRatio: '16/9',
        // Let the location popup extend past the (short, 16:9) map without being
        // clipped; raise z so the overflowing part draws above the sections below.
        overflow: 'visible', zIndex: popup ? 5 : 'auto',
        background: 'rgba(6,3,13,0.97)', border: '1px solid rgba(74,31,122,0.5)' }}
      onClick={() => setPopup(null)}
    >
      {/* ─── SVG MAP ─────────────────────────────────────────────────────── */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
        <defs>
          <filter id="dm-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="0.55" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="dm-dots" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.13" fill="rgba(142,122,168,0.18)" />
          </pattern>
          <radialGradient id="dm-hot-pink" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(255,45,143,0.38)" />
            <stop offset="100%" stopColor="rgba(255,45,143,0)" />
          </radialGradient>
          <radialGradient id="dm-hot-cyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(45,229,255,0.30)" />
            <stop offset="100%" stopColor="rgba(45,229,255,0)" />
          </radialGradient>
        </defs>

        {/* Dot-grid base */}
        <rect width={W} height={H} fill="url(#dm-dots)" />

        {/* Location glows */}
        {ALL_DUNGEONS.map((_, idx) => {
          const [nx, ny] = POS[idx];
          const unlocked = isDungeonUnlocked(idx);
          return (
            <circle key={idx} cx={nx} cy={ny} r={14}
              fill={unlocked ? 'url(#dm-hot-pink)' : 'url(#dm-hot-cyan)'}
              opacity={unlocked ? 0.35 : 0.15}
            />
          );
        })}

        {/* City blocks */}
        {BLOCKS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
            fill={b.cyan ? 'rgba(45,229,255,1)' : 'rgba(255,45,143,1)'}
            opacity={b.op * 0.5}
          />
        ))}

        {/* Grid roads */}
        <g stroke="rgba(45,229,255,0.09)" strokeWidth="0.11" fill="none">
          {[12, 26, 40, 54, 68, 80].map(y => <line key={y} x1={0} y1={y} x2={W} y2={y} />)}
          {[16, 32, 48, 64, 80, 96, 112, 128, 144].map(x => <line key={x} x1={x} y1={0} x2={x} y2={H} />)}
        </g>

        {/* River */}
        <path d="M -2 74 Q 14 68 28 60 Q 44 52 60 48 Q 78 44 96 42 Q 114 38 132 30 Q 146 24 162 20"
          stroke="rgba(45,229,255,0.14)" strokeWidth="2.1" fill="none" />
        <path d="M -2 74 Q 14 68 28 60 Q 44 52 60 48 Q 78 44 96 42 Q 114 38 132 30 Q 146 24 162 20"
          stroke="rgba(45,229,255,0.38)" strokeWidth="0.17" fill="none" strokeDasharray="0.3 0.6" />

        {/* District subtle boundary lines */}
        <g fill="none" strokeWidth="0.1" strokeDasharray="0.5 0.5" opacity="0.35">
          <path d="M 4 90 L 4 68 L 34 66 L 34 90"           stroke="rgba(77,255,155,0.6)" />
          <path d="M 34 66 L 30 24 L 60 22 L 64 70"         stroke="rgba(185,77,255,0.5)" />
          <path d="M 60 22 L 58 4 L 110 4 L 112 26"         stroke="rgba(255,200,58,0.5)" />
          <path d="M 108 4 L 106 2 L 158 2 L 158 26"        stroke="rgba(45,229,255,0.5)" />
          <path d="M 106 42 L 104 68 L 156 70 L 158 44"     stroke="rgba(255,61,87,0.5)" />
        </g>

        {/* District labels */}
        <g fontFamily="'Press Start 2P', monospace" fontSize="1.05" letterSpacing="0.2"
          fill="rgba(90,74,120,0.7)" textAnchor="middle"
          paintOrder="stroke" stroke="rgba(6,3,13,0.9)" strokeWidth="0.3">
          <text x="18" y="89">{isEn ? 'STARTER ZONE' : 'STREFA STARTOWA'}</text>
          <text x="50" y="12">{isEn ? 'MID SECTORS' : 'SEKTORY ŚRODKOWE'}</text>
          <text x="128" y="10">{isEn ? 'DEEP NET' : 'GŁĘBOKA SIEĆ'}</text>
          <text x="136" y="84">{isEn ? 'END ZONE' : 'STREFA KOŃCA'}</text>
        </g>

        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const [ax, ay] = POS[a];
          const [bx, by] = POS[b];
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2 - 3.5;
          const d = `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
          const { color, op, flow } = edgeInfo(a, b);
          return (
            <g key={i}>
              <path d={d} stroke={color} strokeWidth="0.2" fill="none" opacity={op} />
              {flow && (
                <path d={d} stroke={color} strokeWidth="0.42" fill="none" opacity={0.48}
                  strokeDasharray="1.2 1.4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.4s" repeatCount="indefinite" />
                </path>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {ALL_DUNGEONS.map((d, idx) => {
          const [nx, ny] = POS[idx];
          const col      = nodeColor(idx);
          const unlocked = isDungeonUnlocked(idx);
          const isSel    = selected?.id === d.id;
          const isComp   = completedSet.has(d.id);
          const r = NODE_R;
          const pts = `0,${-r} ${r},0 0,${r} ${-r},0`;
          const rawName = isEn ? ((d as any).nameEn ?? d.name) as string : d.name;
          const dispName = rawName.length > 11 ? rawName.slice(0, 10) + '…' : rawName;

          return (
            <g key={d.id}
              transform={`translate(${nx} ${ny})`}
              style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
              onClick={e => handleNodeClick(idx, e)}
            >
              {/* Large transparent hit area */}
              <circle r={r + 4} fill="transparent" />

              {/* Pulse ring on selected */}
              {isSel && (
                <polygon points={pts} fill="none" stroke="#ff2d78" strokeWidth="0.22" opacity="0.85">
                  <animateTransform attributeName="transform" type="scale" values="1;3.0" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.85;0" dur="2s" repeatCount="indefinite" />
                </polygon>
              )}

              {/* Outer diamond */}
              <polygon points={pts}
                fill={unlocked ? 'rgba(10,5,22,0.97)' : 'rgba(18,10,34,0.92)'}
                stroke={col}
                strokeWidth={isSel ? 0.50 : 0.30}
                filter={unlocked ? 'url(#dm-glow)' : undefined}
                opacity={unlocked ? 1 : 0.58}
              />
              {/* Inner diamond (accent) */}
              <polygon points={`0,${-r*0.55} ${r*0.55},0 0,${r*0.55} ${-r*0.55},0`}
                fill="none" stroke={col} strokeWidth="0.12"
                opacity={unlocked ? 0.6 : 0.22}
              />

              {/* Emoji icon */}
              <text x={0} y={r * 0.40} textAnchor="middle"
                fontSize={r * 1.10}
                opacity={unlocked ? 1 : 0.35}
                style={unlocked ? { filter: `drop-shadow(0 0 1.2px ${col})` } : undefined}
              >
                {d.emoji}
              </text>

              {/* Completed ✓ badge */}
              {isComp && (
                <text x={r + 0.7} y={-r + 1.3} textAnchor="start" fontSize="1.5" fill="#4ade80"
                  paintOrder="stroke" stroke="rgba(6,3,13,0.9)" strokeWidth="0.4">✓</text>
              )}

              {/* Name label */}
              <text y={r + 2.1} textAnchor="middle"
                fontFamily="'Share Tech Mono', monospace"
                fontSize="1.2" letterSpacing="0.07"
                fill={isSel ? '#ff2d78' : unlocked ? '#e8d8ff' : '#8e7aa8'}
                paintOrder="stroke" stroke="rgba(6,3,13,0.95)" strokeWidth="0.38"
                style={{ textTransform: 'uppercase' }}
              >
                {dispName}
              </text>

              {/* Level / lock label */}
              <text y={r + 3.5} textAnchor="middle"
                fontFamily="'VT323', monospace"
                fontSize="1.3"
                fill={unlocked ? col : '#5a4a78'}
                paintOrder="stroke" stroke="rgba(6,3,13,0.95)" strokeWidth="0.3"
              >
                {!unlocked ? '⌧ ' : ''}{d.minLevel}
              </text>
            </g>
          );
        })}

        {/* ── Radar decoration (bottom-right) ─────────────────────────── */}
        <g transform="translate(156 86)">
          <circle r="2.5"  fill="rgba(10,4,22,0.7)" stroke="rgba(45,229,255,0.35)" strokeWidth="0.10" />
          <circle r="1.65" fill="none" stroke="rgba(45,229,255,0.20)" strokeWidth="0.07" />
          <circle r="0.80" fill="none" stroke="rgba(45,229,255,0.15)" strokeWidth="0.06" />
          <line x1="0" y1="0" x2="2.5" y2="0" stroke="rgba(45,229,255,0.55)" strokeWidth="0.13">
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4s" repeatCount="indefinite" />
          </line>
          <circle r="0.22" fill="rgba(45,229,255,0.75)" />
        </g>

        {/* ── Header tag ───────────────────────────────────────────────── */}
        <g transform="translate(4 5)">
          <rect x="0" y="-3.5" width="36" height="5" fill="rgba(10,4,22,0.75)" stroke="rgba(255,45,143,0.3)" strokeWidth="0.12" />
          <text x="2" y="0.2" fontFamily="'Press Start 2P', monospace" fontSize="1.6" fill="rgba(255,45,143,0.9)" letterSpacing="0.3">
            {isEn ? '// DUNGEON MAP' : '// MAPA LOCHÓW'}
          </text>
        </g>
      </svg>

      {/* ── CRT scanline overlay ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)',
        opacity: 0.65,
      }} />

      {/* ── Popup ────────────────────────────────────────────────────────── */}
      {popup && pd && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', left: popup.left, top: popup.top,
            width: 192,
            background: 'rgba(8,3,20,0.97)',
            border: `1px solid ${pAcc}`,
            padding: '10px 12px',
            zIndex: 20,
            backdropFilter: 'blur(6px)',
            boxShadow: `0 0 0 1px ${pAcc}22, 0 0 26px rgba(0,0,0,0.65)`,
          }}
        >
          {/* Close */}
          <button
            onClick={() => setPopup(null)}
            style={{ position: 'absolute', top: 4, right: 6, background: 'none', border: 'none',
              color: '#5a4a78', fontSize: 13, cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >✕</button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingRight: 20 }}>
            <div style={{ width: 36, height: 36, display: 'grid', placeItems: 'center',
              fontSize: 20, border: `1px solid ${pAcc}`, background: 'rgba(8,3,18,0.85)',
              flexShrink: 0 }}>
              {pd.emoji}
            </div>
            <div>
              <p style={{ ...MONO, fontSize: 10, color: pAcc, marginBottom: 2 }}>
                {(isEn ? ((pd as any).nameEn ?? pd.name) : pd.name) as string}
                {pCmp && <span style={{ color: '#4ade80', marginLeft: 4 }}>✓</span>}
              </p>
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: '#5a4a78', letterSpacing: '0.08em' }}>
                {isEn ? 'REC' : 'POL'}.LVL {pd.minLevel} · {pd.floors} {isEn ? 'fl.' : 'pięter'}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em',
              color: pAcc, border: `1px solid ${pAcc}`, padding: '2px 6px' }}>
              {pCmp ? (isEn ? 'COMPLETED' : 'UKOŃCZONO') :
               pUnl ? (pSel ? (isEn ? 'SELECTED' : 'WYBRANA') : (isEn ? 'AVAILABLE' : 'DOSTĘPNA')) :
                      (isEn ? 'LOCKED' : 'ZABLOKOWANA')}
            </span>
          </div>

          {/* Description */}
          <p style={{ fontSize: 9, fontFamily: 'monospace', color: '#8e7aa8', marginBottom: 10, lineHeight: 1.55 }}>
            {((isEn ? ((pd as any).descEn ?? pd.description) : pd.description) as string).slice(0, 130)}
          </p>

          {/* CTA button */}
          {pUnl ? (
            <button
              onClick={() => handleSelect(popup.idx)}
              style={{
                display: 'block', width: '100%', padding: '8px 4px',
                background: pSel ? `rgba(255,45,120,0.12)` : 'transparent',
                border: `1px solid ${pSel ? '#ff2d78' : pAcc}`,
                color: pSel ? '#ff2d78' : pAcc,
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9, cursor: 'pointer', letterSpacing: '0.15em',
                textShadow: '0 0 6px currentColor',
              }}
            >
              <span>{pSel ? '◆ WYBRANA' : '► WYBIERZ'}</span>
            </button>
          ) : (
            <div style={{ padding: '7px', textAlign: 'center',
              border: '1px solid #5a4a78',
              fontSize: 8, fontFamily: "'Press Start 2P', monospace",
              color: '#5a4a78', letterSpacing: '0.1em' }}>
              ⌧ {isEn ? 'COMPLETE PREV.' : 'UKOŃCZ POPRZEDNI'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
