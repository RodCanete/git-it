import { COLORS } from '../../tokens';
import ConsequenceFeedback from './ConsequenceFeedback';
import { getDifficultyTheme, getTierStatus, isTierUnlocked } from './difficultyTheme';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const B = 'div';

function SectionLabel({ children }) {
  return (
    <B style={{
      fontSize: 10, fontWeight: 700, color: COLORS.muted,
      letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
    }}>
      {children}
    </B>
  );
}

function ProgressIcon({ status, theme }) {
  if (status === 'locked') {
    return (
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `1.5px solid ${COLORS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: COLORS.muted, fontSize: 10, flexShrink: 0,
      }}>🔒</span>
    );
  }
  if (status === 'completed') {
    return (
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: 'rgba(1,195,141,0.15)', border: `1.5px solid ${theme.completed}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: theme.completed, fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>✓</span>
    );
  }
  if (status === 'current') {
    return (
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `2px solid ${theme.accent}`,
        boxShadow: `0 0 8px ${theme.accentGlow}`,
        flexShrink: 0,
      }} />
    );
  }
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      border: `1.5px solid ${COLORS.muted}`, flexShrink: 0,
    }} />
  );
}

export default function ScenarioSidebar({
  narrative,
  difficulty,
  onDifficultyChange,
  tierProgress,
  showConsequence,
  consequence,
  hintMode,
  banner,
}) {
  const theme = getDifficultyTheme(difficulty);

  return (
    <B style={{
      height: '100%',
      borderRight: `1px solid ${COLORS.border}`,
      padding: 18,
      overflowY: 'auto',
      background: COLORS.bg1,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {banner}

      <section>
        <SectionLabel>Scenario context</SectionLabel>
        <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.7, margin: 0 }}>
          {narrative || 'Loading scenario…'}
        </p>
      </section>

      <section>
        <SectionLabel>Objective</SectionLabel>
        <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.7, margin: 0 }}>
          Reach the target repository state shown in the expected state panel.
        </p>
      </section>

      <section>
        <SectionLabel>Progress</SectionLabel>
        <B style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DIFFICULTIES.map(d => {
            const status = getTierStatus(d, difficulty, tierProgress);
            const unlocked = isTierUnlocked(d, tierProgress);
            const isCurrent = status === 'current';
            const rowTheme = isCurrent ? getDifficultyTheme(d) : theme;

            return (
              <button
                key={d}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && onDifficultyChange(d)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.45,
                  border: `1px solid ${isCurrent ? rowTheme.accent : COLORS.border}`,
                  background: isCurrent ? rowTheme.accentDim : 'transparent',
                  color: isCurrent ? rowTheme.accent : COLORS.secondary,
                  fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                  textAlign: 'left',
                }}
              >
                <ProgressIcon status={status} theme={rowTheme} />
                <span style={{ flex: 1 }}>{d}</span>
                {isCurrent && (
                  <span style={{ fontSize: 10, opacity: 0.9 }}>— current</span>
                )}
                {status === 'locked' && (
                  <span style={{ fontSize: 10, color: COLORS.muted }}>locked</span>
                )}
              </button>
            );
          })}
        </B>
      </section>

      {hintMode && (
        <B style={{
          padding: 12, borderRadius: 8,
          border: `1px solid ${COLORS.warning}`,
          background: 'rgba(245,166,35,0.1)',
        }}>
          <p style={{ fontSize: 12, color: COLORS.warning, lineHeight: 1.65, margin: 0 }}>
            <strong>Need a nudge?</strong> Review the lesson overview or try Reset to replay this variant from the start.
          </p>
        </B>
      )}

      {difficulty === 'hard' && (
        <B style={{
          padding: 12, borderRadius: 8,
          border: `1px solid ${theme.accent}`,
          background: theme.accentDim,
        }}>
          <p style={{ fontSize: 12, color: theme.accent, lineHeight: 1.65, margin: 0 }}>
            <strong>Hard mode:</strong> No expected state diagram. Use the live DAG and your
            understanding of repository state to determine the correct path.
          </p>
        </B>
      )}

      {showConsequence && (
        <section>
          <SectionLabel>Consequence feedback</SectionLabel>
          <ConsequenceFeedback consequence={consequence} theme={theme} />
        </section>
      )}
    </B>
  );
}
