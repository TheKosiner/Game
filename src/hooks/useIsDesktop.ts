import { useState, useEffect } from 'react';

export function useIsDesktop(breakpoint = 1024): boolean {
  const [desktop, setDesktop] = useState(() => window.innerWidth >= breakpoint);
  useEffect(() => {
    const handler = () => setDesktop(window.innerWidth >= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return desktop;
}
