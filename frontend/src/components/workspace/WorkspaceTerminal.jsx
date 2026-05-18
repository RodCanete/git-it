import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../tokens';

export default function WorkspaceTerminal({ history, onCommand, disabled }) {
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
    <div
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: '#0A1018', fontFamily: "'JetBrains Mono', monospace",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        borderBottom: '1px solid #1A2535', flexShrink: 0, background: '#0D1520',
      }}>
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
            {entry.type === 'output' && (
              <div style={{ color: COLORS.textDim, paddingLeft: 16, whiteSpace: 'pre-wrap' }}>{entry.text}</div>
            )}
            {entry.type === 'error' && (
              <div style={{ color: COLORS.danger, paddingLeft: 16, whiteSpace: 'pre-wrap' }}>{entry.text}</div>
            )}
            {entry.type === 'success' && (
              <div style={{ color: COLORS.accent, paddingLeft: 16, whiteSpace: 'pre-wrap' }}>{entry.text}</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        borderTop: '1px solid #1A2535', background: '#0D1520', flexShrink: 0,
      }}>
        <span style={{ color: COLORS.accent, fontSize: 13, userSelect: 'none', flexShrink: 0 }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Scenario complete' : 'git add .'}
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
