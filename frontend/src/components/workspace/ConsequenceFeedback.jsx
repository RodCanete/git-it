import { COLORS } from '../../tokens';

const TONE_COLORS = {
  positive: COLORS.accent,
  negative: COLORS.danger,
  neutral: COLORS.textDim,
};

export default function ConsequenceFeedback({ consequence, theme }) {
  const message = consequence?.message ?? 'Run a command to see what changed in the repository.';
  const tone = consequence?.tone ?? 'neutral';
  const toneColors = { ...TONE_COLORS, positive: theme?.accent ?? COLORS.accent };
  const color = toneColors[tone] ?? COLORS.textDim;

  return (
    <div style={{
      background: COLORS.bg2,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      padding: 12,
      minHeight: 72,
    }}>
      <div style={{ fontSize: 12, color, lineHeight: 1.65 }}>{message}</div>
    </div>
  );
}
