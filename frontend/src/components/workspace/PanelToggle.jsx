import { COLORS } from '../../tokens';

export default function PanelToggle({ label, active, onChange, theme }) {
  const accent = theme?.accent ?? COLORS.accent;
  const accentDim = theme?.accentDim ?? COLORS.accentDim;

  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 6,
        border: `1px solid ${active ? accent : COLORS.border}`,
        background: active ? accentDim : 'transparent',
        color: active ? accent : COLORS.secondary,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? accent : COLORS.muted,
      }} />
      {label}
    </button>
  );
}
