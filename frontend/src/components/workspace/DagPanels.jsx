import { COLORS } from '../../tokens';
import DAGRenderer from '../DAGRenderer';

function PanelChrome({ label, dotColor, commitCount, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>
      <div style={{
        padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
          <span style={{
            fontSize: 11, fontWeight: 600, color: dotColor,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {label}
          </span>
        </div>
        {commitCount != null && (
          <span style={{ fontSize: 10, color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace" }}>
            {commitCount} commit{commitCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

export function LiveDagPanel({ repoState, theme }) {
  const count = repoState?.commits?.length ?? 0;
  const accent = theme?.accent ?? COLORS.accent;
  return (
    <PanelChrome label="Live repository state" dotColor={accent} commitCount={count}>
      <DAGRenderer repoState={repoState} animated />
    </PanelChrome>
  );
}

export function TargetDagPanel({ targetState }) {
  const count = targetState?.commits?.length ?? 0;
  return (
    <PanelChrome label="Target state" dotColor={COLORS.blue} commitCount={count}>
      <DAGRenderer repoState={targetState} compact animated={false} />
    </PanelChrome>
  );
}
