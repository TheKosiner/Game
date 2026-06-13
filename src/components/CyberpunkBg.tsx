// Slow aurora/nebula gradient background — pure CSS, no canvas
export default function CyberpunkBg() {
  const base: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Pink blob — top-left */}
      <div style={{
        ...base,
        width: '55vw', height: '55vw',
        top: '-15%', left: '-12%',
        background: 'radial-gradient(circle, rgba(255,45,120,0.18) 0%, transparent 70%)',
        animation: 'aurora-drift-1 32s ease-in-out infinite',
      }} />
      {/* Cyan blob — top-right */}
      <div style={{
        ...base,
        width: '50vw', height: '50vw',
        top: '-10%', right: '-10%',
        background: 'radial-gradient(circle, rgba(0,245,255,0.14) 0%, transparent 70%)',
        animation: 'aurora-drift-2 28s ease-in-out infinite',
      }} />
      {/* Purple blob — center */}
      <div style={{
        ...base,
        width: '60vw', height: '60vw',
        top: '30%', left: '20%',
        background: 'radial-gradient(circle, rgba(157,78,221,0.11) 0%, transparent 70%)',
        animation: 'aurora-drift-3 38s ease-in-out infinite',
      }} />
      {/* Gold blob — bottom-right */}
      <div style={{
        ...base,
        width: '40vw', height: '40vw',
        bottom: '-10%', right: '-5%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.09) 0%, transparent 70%)',
        animation: 'aurora-drift-4 24s ease-in-out infinite',
      }} />
      {/* Cyan accent — bottom-left */}
      <div style={{
        ...base,
        width: '38vw', height: '38vw',
        bottom: '5%', left: '-8%',
        background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)',
        animation: 'aurora-drift-2 34s ease-in-out infinite reverse',
      }} />
    </div>
  );
}
