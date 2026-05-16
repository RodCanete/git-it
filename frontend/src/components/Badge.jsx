import { COLORS } from '../tokens';

export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: { bg: COLORS.border, color: COLORS.textDim },
    accent: { bg: COLORS.accentDim, color: COLORS.accent },
    danger: { bg: COLORS.dangerDim, color: COLORS.danger },
    warning: { bg: COLORS.warningDim, color: COLORS.warning },
    blue: { bg: COLORS.blueDim, color: COLORS.blue },
    purple: { bg: 'rgba(139,111,255,0.12)', color: COLORS.purple },
    success: { bg: COLORS.accentDim, color: COLORS.accent },
  };
  const v = variants[variant] || variants.default;
  const sz = size === 'xs' ? { fontSize: 9, px: 6, py: 2 } : { fontSize: 11, px: 8, py: 3 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: v.bg, color: v.color,
      fontSize: sz.fontSize, fontWeight: 600, letterSpacing: '0.04em',
      padding: `${sz.py}px ${sz.px}px`, borderRadius: 4,
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}
