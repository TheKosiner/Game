import { useState } from 'react';
import EnemyIcon from './EnemyIcon';

const ASSETS_BASE = 'https://raw.githubusercontent.com/thekosiner/game/assets/enemies';

export default function EnemyPortrait({
  id,
  emoji,
  size = 64,
  style,
}: {
  id: string;
  emoji?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);

  const b = Math.max(6, Math.round(size * 0.16));
  const frameStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    flexShrink: 0,
    border: '1px solid rgba(255,45,120,0.4)',
    boxShadow: '0 0 14px rgba(255,45,120,0.18), inset 0 0 8px rgba(0,0,0,0.55)',
    background: 'rgba(3,3,12,0.6)',
    overflow: 'hidden',
    ...style,
  };

  const corners = (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, width: b, height: b, borderTop: '1.5px solid #00f5ff', borderLeft: '1.5px solid #00f5ff', zIndex: 3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: b, height: b, borderTop: '1.5px solid #00f5ff', borderRight: '1.5px solid #00f5ff', zIndex: 3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: b, height: b, borderBottom: '1.5px solid #ff2d78', borderLeft: '1.5px solid #ff2d78', zIndex: 3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: b, height: b, borderBottom: '1.5px solid #ff2d78', borderRight: '1.5px solid #ff2d78', zIndex: 3, pointerEvents: 'none' }} />
    </>
  );

  const scanlines = (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
      zIndex: 2, pointerEvents: 'none',
    }} />
  );

  if (failed) {
    if (emoji) {
      return (
        <div style={{ ...frameStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.55) }}>
          {emoji}
          {corners}
          {scanlines}
        </div>
      );
    }
    return (
      <div style={frameStyle}>
        <EnemyIcon id={id} size={size} />
        {corners}
        {scanlines}
      </div>
    );
  }

  return (
    <div style={frameStyle}>
      <img
        src={`${ASSETS_BASE}/${id}.webp`}
        width={size}
        height={size}
        alt=""
        onError={() => setFailed(true)}
        style={{ display: 'block', objectFit: 'contain' }}
      />
      {corners}
      {scanlines}
    </div>
  );
}
