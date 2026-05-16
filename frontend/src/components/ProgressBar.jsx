import { COLORS } from '../tokens';

export default function ProgressBar({ value, max = 100, color, height = 4, animated = false }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = color || COLORS.accent;
  return (
    <div style={{ width: '100%', height, background: COLORS.border, borderRadius: height }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: c,
        borderRadius: height, transition: 'width 0.6s ease',
        boxShadow: animated ? `0 0 8px ${c}` : 'none',
      }} />
    </div>
  );
}
