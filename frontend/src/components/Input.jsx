import { useState } from 'react';
import { COLORS } from '../tokens';

export default function Input({ label, type = 'text', value, onChange, placeholder, error, hint, icon, style: s }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...s }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.textDim }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted, fontSize: 14 }}>
            {icon}
          </span>
        )}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', background: COLORS.bg1,
            border: `1px solid ${error ? COLORS.danger : focused ? COLORS.accent : COLORS.border}`,
            borderRadius: 8, padding: `11px ${icon ? 36 : 14}px`,
            color: COLORS.text, fontSize: 14,
            outline: 'none', transition: 'border-color 0.15s ease',
            boxShadow: focused ? `0 0 0 3px ${error ? COLORS.dangerDim : COLORS.accentDim}` : 'none',
          }}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: COLORS.danger }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 12, color: COLORS.muted }}>{hint}</span>}
    </div>
  );
}
