import { COLORS } from '../tokens';
import Card from './Card';

export function MiniBarChart({ data, color, height = 60 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: color || COLORS.accent, height: `${(d.value / max) * (height - 16)}px`, minHeight: 2, transition: 'height 0.4s ease', opacity: 0.85 }} />
          <span style={{ fontSize: 9, color: COLORS.muted, textAlign: 'center', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SparkLine({ data, color, width = 120, height = 36 }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 4)}`).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color || COLORS.accent} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={data.length > 1 ? width : 0} cy={height - (data[data.length - 1] / max) * (height - 4)} r="3" fill={color || COLORS.accent} />
    </svg>
  );
}

export function StatCard({ label, value, change, trend, color }) {
  const isPos = change >= 0;
  return (
    <Card style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.secondary, marginBottom: 6, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: color || COLORS.text }}>{value}</div>
          {change !== undefined && (
            <div style={{ fontSize: 12, color: isPos ? COLORS.accent : COLORS.danger, marginTop: 4 }}>
              {isPos ? '↑' : '↓'} {Math.abs(change)}% vs last week
            </div>
          )}
        </div>
        {trend && <SparkLine data={trend} color={color || COLORS.accent} />}
      </div>
    </Card>
  );
}
