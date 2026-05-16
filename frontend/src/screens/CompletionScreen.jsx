import { useLocation, useNavigate } from 'react-router-dom';
import { COLORS } from '../tokens';
import TopNav from '../components/TopNav';
import Btn from '../components/Btn';
import Card from '../components/Card';

function Stars({ count }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '20px 0' }}>
      {[0, 1, 2].map(i => (
        <svg key={i} width="40" height="40" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i < count ? COLORS.warning : 'transparent'}
            stroke={i < count ? COLORS.warning : COLORS.border}
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  );
}

export default function CompletionScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { result, commandsUsed, minCommands, scenarioTitle, nextScenarioId } = state || {};

  const pass = result === 'pass';
  const stars = pass ? (commandsUsed <= minCommands ? 3 : commandsUsed <= minCommands + 1 ? 2 : 1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopNav />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Card style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{pass ? '🎉' : '💡'}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
            {pass ? 'Scenario Complete!' : 'Nice Try!'}
          </h1>
          <p style={{ fontSize: 14, color: COLORS.secondary, marginBottom: 4 }}>
            {scenarioTitle || 'Scenario'}
          </p>

          <Stars count={stars} />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: pass ? COLORS.accent : COLORS.warning }}>{commandsUsed}</div>
              <div style={{ fontSize: 11, color: COLORS.secondary }}>Commands used</div>
            </div>
            <div style={{ width: 1, background: COLORS.border }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{minCommands}</div>
              <div style={{ fontSize: 11, color: COLORS.secondary }}>Minimum required</div>
            </div>
            <div style={{ width: 1, background: COLORS.border }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: pass ? COLORS.accent : COLORS.danger }}>{pass ? 'PASS' : 'MISS'}</div>
              <div style={{ fontSize: 11, color: COLORS.secondary }}>Result</div>
            </div>
          </div>

          {!pass && (
            <p style={{ fontSize: 13, color: COLORS.secondary, marginBottom: 20 }}>
              Either the target state wasn't achieved, or you used more than the minimum number of commands.
              Try again with a fresh approach!
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn variant="ghost" onClick={() => navigate(-1)}>Try again</Btn>
            {nextScenarioId ? (
              <Btn onClick={() => navigate(`/workspace/${nextScenarioId}`)}>Next scenario →</Btn>
            ) : (
              <Btn onClick={() => navigate('/dashboard')}>Back to dashboard</Btn>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
