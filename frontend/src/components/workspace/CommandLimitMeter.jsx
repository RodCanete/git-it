import { COLORS } from '../../tokens';

export default function CommandLimitMeter({ used, limit, theme }) {
  const remaining = Math.max(0, limit - used);
  const capped = Math.min(limit, 12);
  const showSegments = limit <= 12;

  const baseAccent = theme?.accent ?? COLORS.accent;
  let accent = baseAccent;
  if (remaining === 0) accent = COLORS.danger;
  else if (remaining === 1) accent = COLORS.warning;

  const tooltip = `You have ${remaining} command${remaining === 1 ? '' : 's'} left. Exceeding the limit ends this session as a miss.`;

  return (
    <div title={tooltip} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, color: COLORS.secondary, fontWeight: 500 }}>Command limit</span>
      {showSegments ? (
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: capped }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i < used ? COLORS.muted : accent,
                opacity: i < used ? 0.5 : 1,
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ width: 64, height: 6, borderRadius: 3, background: COLORS.bg2, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, (used / limit) * 100)}%`,
            height: '100%',
            background: accent,
            borderRadius: 3,
          }} />
        </div>
      )}
      <span style={{ fontSize: 12, fontWeight: 600, color: accent, fontFamily: "'JetBrains Mono', monospace" }}>
        {remaining} / {limit}
      </span>
    </div>
  );
}
