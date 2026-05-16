import { COLORS } from '../tokens';

export default function Logo({ size = 24, withText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill={COLORS.accentDim} />
        <circle cx="10" cy="10" r="3" fill={COLORS.accent} />
        <circle cx="22" cy="10" r="3" fill={COLORS.accent} />
        <circle cx="16" cy="22" r="3" fill={COLORS.accent} />
        <line x1="10" y1="10" x2="22" y2="10" stroke={COLORS.accent} strokeWidth="1.5" />
        <line x1="10" y1="10" x2="16" y2="22" stroke={COLORS.accent} strokeWidth="1.5" />
        <line x1="22" y1="10" x2="16" y2="22" stroke={COLORS.accent} strokeWidth="1.5" />
      </svg>
      {withText && (
        <span style={{ fontSize: size * 0.75, fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.text, display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ letterSpacing: '0.06em' }}>GIT</span>
          <span style={{ color: COLORS.accent }}>it!</span>
        </span>
      )}
    </div>
  );
}
