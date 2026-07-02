import { useEffect, useRef, useState } from 'react';

const CSS = `
@keyframes an-gain { 0% { transform: scale(1); } 40% { transform: scale(1.22); } 100% { transform: scale(1); } }
@keyframes an-loss { 0% { transform: scale(1); } 40% { transform: scale(0.88); } 100% { transform: scale(1); } }
`;
let cssInjected = false;

/**
 * Number that counts toward its new value instead of snapping, with a small
 * scale "pop" on gain (and a dip on loss). Used for gold/gem counters.
 */
export default function AnimatedNumber({ value, gainColor }: { value: number; gainColor?: string }) {
  const [display, setDisplay] = useState(value);
  const [pulse, setPulse] = useState<'gain' | 'loss' | null>(null);
  const prev = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!cssInjected) {
      cssInjected = true;
      const el = document.createElement('style');
      el.textContent = CSS;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    setPulse(value > from ? 'gain' : 'loss');

    const dur = 500;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const t = setTimeout(() => setPulse(null), 600);
    return () => { cancelAnimationFrame(rafRef.current); clearTimeout(t); };
  }, [value]);

  return (
    <span style={{
      display: 'inline-block',
      animation: pulse ? `${pulse === 'gain' ? 'an-gain' : 'an-loss'} 0.5s ease` : 'none',
      textShadow: pulse === 'gain' && gainColor ? `0 0 12px ${gainColor}` : undefined,
      transition: 'text-shadow 0.4s',
    }}>
      {display}
    </span>
  );
}
