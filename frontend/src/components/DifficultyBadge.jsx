import { COLORS } from '../tokens';

export default function DifficultyBadge({ level }) {
  const cfg = {
    easy: { label: 'Easy', color: COLORS.accent, bg: COLORS.accentDim },
    medium: { label: 'Medium', color: COLORS.warning, bg: COLORS.warningDim },
    hard: { label: 'Hard', color: COLORS.danger, bg: COLORS.dangerDim },
  };
  const c = cfg[level] || cfg.easy;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: c.color, background: c.bg,
      padding: '3px 10px', borderRadius: 20,
    }}>{c.label}</span>
  );
}
