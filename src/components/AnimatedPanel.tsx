import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  animKey: string;
  style?: React.CSSProperties;
}

// Renders tab content immediately. Previously this faded the panel in from
// opacity:0 via GSAP on every tab switch, which on slower phones made the whole
// screen appear to "load in" gradually. Showing it instantly is snappier.
export default function AnimatedPanel({ children, style }: Props) {
  return <div style={style}>{children}</div>;
}
