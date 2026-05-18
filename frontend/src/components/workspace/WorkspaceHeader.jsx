import { COLORS } from '../../tokens';
import Btn from '../Btn';
import PanelToggle from './PanelToggle';
import CommandLimitMeter from './CommandLimitMeter';
import { getDifficultyTheme, isTierUnlocked } from './difficultyTheme';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

function HeaderBtn({ children, onClick, title, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        border: `1px solid ${COLORS.border}`,
        background: 'transparent',
        color: COLORS.secondary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function WorkspaceHeader({
  module,
  scenario,
  panels,
  onPanelChange,
  difficulty,
  onDifficultyChange,
  tierProgress,
  commandCount,
  hardCap,
  onRetry,
  onReset,
  onDashboard,
  busy,
}) {
  const theme = getDifficultyTheme(difficulty);
  const moduleLabel = module ? `Module ${(module.order ?? 0) + 1}` : 'Module';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '0 20px', height: 56, flexShrink: 0,
      background: COLORS.bg1, borderBottom: `1px solid ${COLORS.border}`,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <Btn variant="ghost" size="sm" onClick={onDashboard}>← Dashboard</Btn>
        <span style={{ width: 1, height: 24, background: COLORS.border, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: COLORS.secondary, whiteSpace: 'nowrap' }}>{moduleLabel}</span>
        <span style={{ color: COLORS.border }}>|</span>
        <span style={{
          width: 8, height: 8, borderRadius: 2, background: theme.accent,
          boxShadow: `0 0 6px ${theme.accentGlow}`, flexShrink: 0,
        }} />
        <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {scenario?.title || '…'}
        </span>
        {scenario?.order != null && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            background: theme.accentDim, color: theme.accent, letterSpacing: '0.04em',
          }}>
            SCENARIO {scenario.order}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <PanelToggle label="Live DAG" active={panels.live} onChange={v => onPanelChange('live', v)} theme={theme} />
        <PanelToggle label="Target State" active={panels.target} onChange={v => onPanelChange('target', v)} theme={theme} />
        <PanelToggle label="Consequence Feedback" active={panels.feedback} onChange={v => onPanelChange('feedback', v)} theme={theme} />

        <span style={{ width: 1, height: 20, background: COLORS.border, margin: '0 4px' }} />

        {DIFFICULTIES.map(d => {
          const dTheme = getDifficultyTheme(d);
          const active = difficulty === d;
          const unlocked = isTierUnlocked(d, tierProgress);
          return (
            <button
              key={d}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && onDifficultyChange(d)}
              title={unlocked ? undefined : `Complete ${d === 'medium' ? 'Easy' : 'Medium'} first`}
              style={{
                padding: '4px 10px', borderRadius: 6,
                cursor: unlocked ? 'pointer' : 'not-allowed',
                textTransform: 'capitalize',
                fontSize: 11, fontWeight: 600,
                opacity: unlocked ? 1 : 0.4,
                border: `1px solid ${active ? dTheme.accent : COLORS.border}`,
                background: active ? dTheme.accentDim : 'transparent',
                color: active ? dTheme.accent : COLORS.muted,
              }}
            >
              {d}
            </button>
          );
        })}

        <span style={{ width: 1, height: 20, background: COLORS.border, margin: '0 4px' }} />

        {hardCap > 0 && <CommandLimitMeter used={commandCount} limit={hardCap} theme={theme} />}

        <HeaderBtn title="Try a different version of this scenario." onClick={onRetry} disabled={busy}>
          Retry
        </HeaderBtn>
        <HeaderBtn title="Start this scenario over from the beginning." onClick={onReset} disabled={busy}>
          Reset
        </HeaderBtn>
      </div>
    </div>
  );
}
