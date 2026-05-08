import { useState, useEffect } from 'react';

export interface TimerResult {
  remaining: number;
  isComplete: boolean;
  formatted: string;
}

export function useTimer(endsAt: number | null): TimerResult {
  const [remaining, setRemaining] = useState(
    endsAt ? Math.max(0, endsAt - Date.now()) : 0
  );

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r === 0) clearInterval(id);
    };

    updateRemaining();
    const id = setInterval(updateRemaining, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  return {
    remaining,
    isComplete: remaining === 0,
    formatted,
  };
}
