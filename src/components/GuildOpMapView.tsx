import { useRef, useState } from 'react';
import { GUILD_OP_LOCATIONS } from '../data/guildOperations';
import { MONO } from '../utils/styles';

interface Props {
  heroLevel: number;
  selected: string | null;
  onSelect: (id: string) => void;
  isEn: boolean;
}

const W = 160, H = 90;
const NODE_R = 3.4;

// Positions for the 5 guild-op locations (index order = GUILD_OP_LOCATIONS), low → high tier.
const POS: [number, number][] = [
  [22, 64], [52, 42], [84, 62], [114, 36], [144, 58],
];
const EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4]];

const RARITY_COL: Record<string, string> = { rare: '#60a5fa', epic: '#c084fc', legendary: '#f59e0b' };

function rng(i: number): number { return Math.abs((Math.sin(i * 9301 + 49297) * 233280) % 1); }
const BLOCKS = Array.from({ length: 140 }, (_, i) => ({
  x: rng(i) * W, y: rng(i + 100) * H,
  w: 0.4 + rng(i + 200) * 1.6, h: 0.3 + rng(i + 300) * 1.2,
  cyan: rng(i + 400) > 0.5, op: 0.08 + rng(i + 500) * 0.28,
}));

export default function GuildOpMapView({ heroLevel, selected, onSelect, isEn }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<{ idx: number; left: number; top: number } | null>(null);

  function unlocked(idx: number) { return GUILD_OP_LOCATIONS[idx].minLevel <= heroLevel; }
  function nodeColor(idx: number): string {
    const l = GUILD_OP_LOCATIONS[idx];
    if (selected === l.id) return '#ff2d78';
    if (!unlocked(idx)) return '#5a4a78';
    return RARITY_COL[l.finalRarity] ?? '#ffc83a';
  }

  function handleNodeClick(idx: number, e: React.MouseEvent<SVGGElement>) {
    e.stopPropagation();
    if (popup?.idx === idx) { setPopup(null); return; }
    const wrap = wrapRef.current;
    if (!wrap) return;
    const [sx, sy] = POS[idx];
    const px = (sx / W) * wrap.clientWidth;
    const py = (sy / H) * wrap.clientHeight;
    const PW = 196;
    let left = px + 16;
    if (left + PW > wrap.clientWidth - 8) left = px - PW - 16;
    if (left < 8) left = 8;
    let top = py - 40;
    if (top < 8) top = 8;
    setPopup({ idx, left, top });
  }

  const pd = popup ? GUILD_OP_LOCATIONS[popup.idx] : null;
  const pUnl = popup ? unlocked(popup.idx) : false;
  const pSel = pd ? selected === pd.id : false;
  const pAcc = pd ? (pUnl ? (RARITY_COL[pd.finalRarity] ?? '#ffc83a') : '#5a4a78') : '#5a4a78';

  return (
    <div
      ref={wrapRef}
      onClick={() => setPopup(null)}
      style={{ position: 'relative', width: '100%', aspectRatio: '16/9',
        overflow: 'visible', zIndex: popup ? 5 : 'auto',
        background: 'rgba(6,3,13,0.97)', border: '1px solid rgba(74,31,122,0.5)' }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
        <defs>
          <radialGradient id="gm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,45,143,0.32)" />
            <stop offset="100%" stopColor="rgba(255,45,143,0)" />
          </radialGradient>
        </defs>

        {/* City blocks */}
        {BLOCKS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
            fill={b.cyan ? 'rgba(45,229,255,1)' : 'rgba(255,45,143,1)'} opacity={b.op * 0.5} />
        ))}

        {/* Grid */}
        <g stroke="rgba(45,229,255,0.08)" strokeWidth="0.11" fill="none">
          {[18, 36, 54, 72].map(y => <line key={y} x1={0} y1={y} x2={W} y2={y} />)}
          {[24, 48, 72, 96, 120, 144].map(x => <line key={x} x1={x} y1={0} x2={x} y2={H} />)}
        </g>

        {/* Location glows */}
        {GUILD_OP_LOCATIONS.map((_, idx) => {
          const [nx, ny] = POS[idx];
          return <circle key={idx} cx={nx} cy={ny} r={13} fill="url(#gm-glow)" opacity={unlocked(idx) ? 0.4 : 0.12} />;
        })}

        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const [ax, ay] = POS[a]; const [bx, by] = POS[b];
          const mx = (ax + bx) / 2, my = (ay + by) / 2 - 4;
          const open = unlocked(a) && unlocked(b);
          return <path key={i} d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`}
            stroke={open ? 'rgba(255,200,58,0.5)' : 'rgba(74,31,122,0.35)'} strokeWidth="0.22" fill="none" />;
        })}

        {/* Nodes */}
        {GUILD_OP_LOCATIONS.map((l, idx) => {
          const [nx, ny] = POS[idx];
          const col = nodeColor(idx);
          const unl = unlocked(idx);
          const isSel = selected === l.id;
          const r = NODE_R;
          const pts = `0,${-r} ${r},0 0,${r} ${-r},0`;
          const nm = (isEn ? ((l as { nameEn?: string }).nameEn ?? l.name) : l.name);
          const disp = nm.length > 13 ? nm.slice(0, 12) + '…' : nm;
          return (
            <g key={l.id} transform={`translate(${nx} ${ny})`}
              style={{ cursor: unl ? 'pointer' : 'not-allowed' }}
              onClick={e => handleNodeClick(idx, e)}>
              <circle r={r + 4} fill="transparent" />
              {isSel && (
                <polygon points={pts} fill="none" stroke="#ff2d78" strokeWidth="0.22" opacity="0.85">
                  <animateTransform attributeName="transform" type="scale" values="1;2.6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.85;0" dur="2s" repeatCount="indefinite" />
                </polygon>
              )}
              <polygon points={pts}
                fill={unl ? 'rgba(10,5,22,0.97)' : 'rgba(18,10,34,0.92)'}
                stroke={col} strokeWidth={isSel ? 0.5 : 0.3} opacity={unl ? 1 : 0.6} />
              <text x={0} y={r * 0.42} textAnchor="middle" fontSize={r * 1.05} opacity={unl ? 1 : 0.35}
                style={unl ? { filter: `drop-shadow(0 0 1.2px ${col})` } : undefined}>{l.emoji}</text>
              <text y={r + 2.3} textAnchor="middle" fontFamily="'Share Tech Mono', monospace"
                fontSize="1.25" fill={isSel ? '#ff2d78' : unl ? '#e8d8ff' : '#8e7aa8'}
                paintOrder="stroke" stroke="rgba(6,3,13,0.95)" strokeWidth="0.38"
                style={{ textTransform: 'uppercase' }}>{disp}</text>
              <text y={r + 3.7} textAnchor="middle" fontFamily="'VT323', monospace" fontSize="1.3"
                fill={unl ? col : '#5a4a78'} paintOrder="stroke" stroke="rgba(6,3,13,0.95)" strokeWidth="0.3">
                {!unl ? '⌧ ' : ''}{l.minLevel}+</text>
            </g>
          );
        })}

        {/* Header tag */}
        <g transform="translate(4 5)">
          <rect x="0" y="-3.5" width="44" height="5" fill="rgba(10,4,22,0.75)" stroke="rgba(255,45,143,0.3)" strokeWidth="0.12" />
          <text x="2" y="0.2" fontFamily="'Press Start 2P', monospace" fontSize="1.6" fill="rgba(255,45,143,0.9)" letterSpacing="0.3">
            {isEn ? '// OPERATIONS MAP' : '// MAPA OPERACJI'}
          </text>
        </g>
      </svg>

      {/* Popup */}
      {popup && pd && (
        <div onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', left: popup.left, top: popup.top, width: 196,
            background: 'rgba(8,3,20,0.98)', border: `1px solid ${pAcc}`, padding: '10px 12px',
            zIndex: 20, boxShadow: `0 0 0 1px ${pAcc}22, 0 0 26px rgba(0,0,0,0.65)` }}>
          <button onClick={() => setPopup(null)}
            style={{ position: 'absolute', top: 4, right: 6, background: 'none', border: 'none',
              color: '#5a4a78', fontSize: 13, cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingRight: 18 }}>
            <div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', fontSize: 19,
              border: `1px solid ${pAcc}`, background: 'rgba(8,3,18,0.85)', flexShrink: 0 }}>{pd.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ ...MONO, fontSize: 10, color: pAcc, marginBottom: 2 }}>
                {(isEn ? ((pd as { nameEn?: string }).nameEn ?? pd.name) : pd.name)}
              </p>
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: '#5a4a78', letterSpacing: '0.06em' }}>
                {isEn ? 'LVL' : 'POZ'}.{pd.minLevel}+ · {pd.floors} {isEn ? 'fl.' : 'pięter'}
              </p>
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em',
              color: pAcc, border: `1px solid ${pAcc}`, padding: '2px 6px' }}>
              {pd.finalRarity.toUpperCase()} {isEn ? 'BOX' : 'SKRZYNKA'}
            </span>
          </div>
          <p style={{ fontSize: 9, fontFamily: 'monospace', color: '#8e7aa8', marginBottom: 10, lineHeight: 1.5 }}>
            {pd.description.slice(0, 120)}
          </p>
          {pUnl ? (
            <button onClick={() => { onSelect(pd.id); setPopup(null); }}
              style={{ display: 'block', width: '100%', padding: '8px 4px',
                background: pSel ? 'rgba(255,45,120,0.12)' : 'transparent',
                border: `1px solid ${pSel ? '#ff2d78' : pAcc}`, color: pSel ? '#ff2d78' : pAcc,
                fontFamily: "'Press Start 2P', monospace", fontSize: 9, cursor: 'pointer',
                letterSpacing: '0.15em', textShadow: '0 0 6px currentColor' }}>
              {pSel ? (isEn ? '◆ SELECTED' : '◆ WYBRANA') : (isEn ? '► SELECT' : '► WYBIERZ')}
            </button>
          ) : (
            <div style={{ padding: '7px', textAlign: 'center', border: '1px solid #5a4a78',
              fontSize: 8, fontFamily: "'Press Start 2P', monospace", color: '#5a4a78', letterSpacing: '0.1em' }}>
              ⌧ {isEn ? `REQUIRES LVL ${pd.minLevel}` : `WYMAGA POZ. ${pd.minLevel}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
