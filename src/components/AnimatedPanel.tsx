import { useEffect, useRef, type ReactNode } from 'react';
import { animatePanelIn } from '../lib/gsapAnimations';

interface Props {
  children: ReactNode;
  animKey: string;
  style?: React.CSSProperties;
}

export default function AnimatedPanel({ children, animKey, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animatePanelIn(ref.current);
  }, [animKey]);

  return (
    <div ref={ref} style={{ ...style, opacity: 0 }}>
      {children}
    </div>
  );
}
