/** Shared style constants — enforces WCAG minimum font sizes */

/** Press Start 2P pixel font. Minimum enforced at 10px for WCAG readability. */
export const PX = (s: number) => ({
  fontFamily: "'Press Start 2P', monospace",
  fontSize: Math.max(s, 10),
} as const);

/** Share Tech Mono — body/value text */
export const MONO = { fontFamily: "'Share Tech Mono', monospace" } as const;

/** Orbitron — accent/title text */
export const ORB  = { fontFamily: "'Orbitron', monospace", fontWeight: 700 } as const;
