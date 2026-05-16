import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../tokens';
import TopNav from '../components/TopNav';
import DAGRenderer, { ExpectedStatePanel } from '../components/DAGRenderer';
import DifficultyBadge from '../components/DifficultyBadge';
import Btn from '../components/Btn';
import { fetchNextTemplate, fetchScenario } from '../api/queries';
import useGitEngine from '../hooks/useGitEngine';
import useSession from '../hooks/useSession';

function Terminal({ history, onCommand, disabled }) {
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

  function submit(e) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    setCmdHistory(h => [cmd, ...h]);
    setHistIdx(-1);
    onCommand(cmd);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setInput(cmdHistory[next] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? '' : cmdHistory[next] || '');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0A1018', fontFamily: "'JetBrains Mono', monospace" }}
      onClick={() => inputRef.current?.focus()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `1px solid #1A2535`, flexShrink: 0, background: '#0D1520' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5A6A' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F5A623' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#01C38D' }} />
        <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.muted }}>git-it terminal</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {history.length === 0 && (
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            <span style={{ color: COLORS.accent }}>GIT it!</span> terminal — type git commands to solve the scenario
          </div>
        )}
        {history.map((entry, i) => (
          <div key={i} style={{ fontSize: 12, lineHeight: 1.6 }}>
            {entry.type === 'command' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: COLORS.accent, userSelect: 'none' }}>$</span>
                <span style={{ color: COLORS.text }}>{entry.text}</span>
              </div>
            )}
            {entry.type === 'output' && <div style={{ color: COLORS.textDim, paddingLeft: 16, whiteSpace: 'pre-wrap' }}>{entry.text}</div>}
            {entry.type === 'error' && <div style={{ color: COLORS.danger, paddingLeft: 16, whiteSpace: 'pre-wrap' }}>{entry.text}</div>}
            {entry.type === 'success' && <div style={{ color: COLORS.accent, paddingLeft: 16, whiteSpace: 'pre-wrap' }}>{entry.text}</div>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderTop: `1px solid #1A2535`, background: '#0D1520', flexShrink: 0 }}>
        <span style={{ color: COLORS.accent, fontSize: 13, userSelect: 'none', flexShrink: 0 }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Scenario complete' : 'git checkout feature/login'}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: COLORS.text, fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      </form>
    </div>
  );
}

export default function WorkspaceScreen() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState('easy');
  const [termHistory, setTermHistory] = useState([]);
  const [done, setDone] = useState(false);
  const [template, setTemplate] = useState(null);

  const { data: scenario } = useQuery({ queryKey: ['scenario', scenarioId], queryFn: () => fetchScenario(scenarioId) });
  const { data: nextTemplate } = useQuery({ queryKey: ['next-template', scenarioId], queryFn: () => fetchNextTemplate(scenarioId), enabled: !!scenarioId });

  const { repoState, initRepo, runCommand, isComplete } = useGitEngine();
  const { startSession, recordCommand, finishSession, commandCount } = useSession();

  useEffect(() => {
    if (nextTemplate && !template) {
      setTemplate(nextTemplate);
      initRepo(nextTemplate).then(() => {
        startSession(scenarioId, nextTemplate.id);
      });
    }
  }, [nextTemplate]);

  async function handleCommand(cmd) {
    if (done) return;

    setTermHistory(h => [...h, { type: 'command', text: cmd }]);

    const result = await runCommand(cmd);
    if (result.output) {
      setTermHistory(h => [...h, { type: result.error ? 'error' : 'output', text: result.output }]);
    }

    await recordCommand(cmd, result.valid);
    const newCount = commandCount + 1;

    const hardCap = template?.hard_cap ?? 10;
    if (newCount >= hardCap) {
      await finishSession(false, true);
      setDone(true);
      setTermHistory(h => [...h, { type: 'error', text: `⚠ Hard cap reached (${hardCap} commands). Session ended as MISS.` }]);
      navigate('/completion', { state: { result: 'miss', commandsUsed: newCount, minCommands: template?.min_commands, scenarioTitle: scenario?.title } });
      return;
    }

    if (result.repoState && isComplete(template?.target_state, result.repoState)) {
      setDone(true);
      setTermHistory(h => [...h, { type: 'success', text: '✓ Target state achieved!' }]);
      const sessionResult = await finishSession(true, false);
      navigate('/completion', {
        state: {
          result: sessionResult?.result || 'pass',
          commandsUsed: newCount,
          minCommands: template?.min_commands,
          scenarioTitle: scenario?.title,
        }
      });
    }
  }

  const showExpected = difficulty === 'easy' || difficulty === 'medium';
  const showFeedback = difficulty === 'easy';
  const narrative = template ? (template.narrative) : 'Loading scenario…';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopNav />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 340px', overflow: 'hidden' }}>
        {/* Left — Scenario Context */}
        <div style={{ borderRight: `1px solid ${COLORS.border}`, padding: 18, overflowY: 'auto', background: COLORS.bg1 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
              {scenario?.specific_objective}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{scenario?.title}</div>
          </div>

          {/* Difficulty switcher */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {['easy', 'medium', 'hard'].map(d => (
              <button key={d} onClick={() => setDifficulty(d)} style={{
                flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${difficulty === d ? COLORS.accent : COLORS.border}`,
                background: difficulty === d ? COLORS.accentDim : 'transparent',
                color: difficulty === d ? COLORS.accent : COLORS.secondary,
                fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              }}>{d}</button>
            ))}
          </div>

          <div style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.7, marginBottom: 16 }}>{narrative}</div>

          {showFeedback && (
            <div style={{ background: COLORS.bg2, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, marginBottom: 6 }}>FEEDBACK</div>
              <div style={{ fontSize: 12, color: COLORS.secondary }}>
                {done ? '✓ Scenario complete!' : `Commands used: ${commandCount} / ${template?.hard_cap ?? '?'}`}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Btn variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← Dashboard</Btn>
          </div>
        </div>

        {/* Center — DAG panels */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${COLORS.border}` }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.accent }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live State</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <DAGRenderer repoState={repoState} animated={true} />
            </div>
          </div>

          {showExpected && template && (
            <div style={{ height: '40%', borderTop: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
              <ExpectedStatePanel targetState={template.target_state} style={{ height: '100%', border: 'none', borderRadius: 0 }} />
            </div>
          )}
        </div>

        {/* Right — Terminal */}
        <div style={{ overflow: 'hidden' }}>
          <Terminal history={termHistory} onCommand={handleCommand} disabled={done} />
        </div>
      </div>
    </div>
  );
}
