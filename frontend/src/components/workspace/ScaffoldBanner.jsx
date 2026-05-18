import { COLORS } from '../../tokens';

export default function ScaffoldBanner({ message, hintMode, variantLabel, attemptLabel, theme }) {
  if (!message) return null;

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: `1px solid ${hintMode ? COLORS.warning : theme.accent}`,
        background: hintMode ? 'rgba(245,166,35,0.1)' : theme.accentDim,
        marginBottom: 4,
      }}
    >
      <p style={{
        fontSize: 12,
        fontWeight: 600,
        color: hintMode ? COLORS.warning : theme.accent,
        margin: 0,
        lineHeight: 1.5,
      }}>
        {message}
      </p>
      {(variantLabel || attemptLabel) && (
        <p style={{ fontSize: 11, color: COLORS.secondary, margin: '6px 0 0' }}>
          {[variantLabel, attemptLabel].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}
