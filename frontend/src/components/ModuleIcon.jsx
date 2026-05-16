import { COLORS } from '../tokens';

const ICONS = {
  0: { symbol: '◉', color: COLORS.purple },
  1: { symbol: '⬡', color: COLORS.blue },
  2: { symbol: '↩', color: COLORS.warning },
  3: { symbol: '⇌', color: COLORS.accent },
  4: { symbol: '⚡', color: COLORS.danger },
};

export default function ModuleIcon({ moduleId, size = 36 }) {
  const ic = ICONS[moduleId] || ICONS[1];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: `${ic.color}18`, border: `1px solid ${ic.color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, color: ic.color, flexShrink: 0,
    }}>
      {ic.symbol}
    </div>
  );
}
