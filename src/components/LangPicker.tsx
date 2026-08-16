import { useLangStore } from '../store/langStore';
import { LANGUAGES } from '../i18n';
import { MONO } from '../utils/styles';

/**
 * Language selector. With seven languages a row of code buttons no longer fits
 * the header, so this is a native <select> — compact, keyboard accessible and
 * rendered with the platform's own dropdown on mobile.
 */
export default function LangPicker({ compact }: { compact?: boolean }) {
  const lang = useLangStore(s => s.lang);
  const setLang = useLangStore(s => s.setLang);

  return (
    <select
      value={lang}
      onChange={e => setLang(e.target.value as typeof lang)}
      aria-label="Language / Język"
      style={{
        ...MONO,
        fontSize: compact ? 10 : 11,
        lineHeight: 1,
        padding: compact ? '3px 4px' : '4px 6px',
        color: '#00f5ff',
        background: 'rgba(0,245,255,0.06)',
        border: '1px solid rgba(0,245,255,0.3)',
        borderRadius: 0,
        cursor: 'pointer',
        appearance: 'none',
        textAlign: 'center',
      }}
    >
      {LANGUAGES.map(l => (
        <option key={l.code} value={l.code} style={{ background: '#0a0a14', color: '#e8e8ff' }}>
          {compact ? l.label : `${l.label} · ${l.name}`}
        </option>
      ))}
    </select>
  );
}
