import { ORB } from '../utils/styles';

/**
 * Unified notification bar: slides in, auto-fades out (CSS .toast-anim, ~3.4s).
 * The owner still clears its state on a timer; the fade just makes the removal
 * invisible instead of an abrupt pop.
 */
export default function Toast({ text, ok }: { text: string; ok: boolean }) {
  return (
    <div
      className="toast-anim"
      style={{
        background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        padding: '8px 12px', textAlign: 'center',
        color: ok ? '#4ade80' : '#f87171', ...ORB, fontSize: 9,
      }}
    >
      {text}
    </div>
  );
}
