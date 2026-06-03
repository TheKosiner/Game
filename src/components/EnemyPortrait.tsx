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

  if (failed) {
    if (emoji) {
      return (
        <div style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.55),
          ...style,
        }}>
          {emoji}
        </div>
      );
    }
    return <EnemyIcon id={id} size={size} style={style} />;
  }

  return (
    <img
      src={`${ASSETS_BASE}/${id}.webp`}
      width={size}
      height={size}
      alt=""
      onError={() => setFailed(true)}
      style={{
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        borderRadius: 4,
        ...style,
      }}
    />
  );
}
