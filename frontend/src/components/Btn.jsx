import { useState } from 'react';
import { COLORS } from '../tokens';

export default function Btn({ children, variant = 'primary', onClick, disabled, style: s, size = 'md', icon }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'inherit', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 8, border: 'none', transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1, letterSpacing: '-0.01em',
  };
  const sizes = {
    sm: { fontSize: 13, padding: '7px 14px' },
    md: { fontSize: 14, padding: '10px 20px' },
    lg: { fontSize: 16, padding: '13px 28px' },
  };
  const variants = {
    primary: { background: hov ? COLORS.accentDark : COLORS.accent, color: '#0A1520' },
    ghost: { background: hov ? COLORS.cardHover : 'transparent', color: hov ? COLORS.text : COLORS.textDim, border: `1px solid ${COLORS.border}` },
    danger: { background: hov ? '#CC3A48' : COLORS.danger, color: '#fff' },
    subtle: { background: hov ? COLORS.cardHover : COLORS.card, color: COLORS.text, border: `1px solid ${hov ? COLORS.borderLight : COLORS.border}` },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...s }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
