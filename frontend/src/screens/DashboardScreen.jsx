import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../tokens';
import TopNav from '../components/TopNav';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import ModuleIcon from '../components/ModuleIcon';
import DifficultyBadge from '../components/DifficultyBadge';
import { fetchModules, fetchProgress } from '../api/queries';

function ScenarioRow({ scenario, moduleId, onStart }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onStart(scenario)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
        background: hov ? COLORS.cardHover : 'transparent',
        border: `1px solid ${hov ? COLORS.borderLight : 'transparent'}`,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{scenario.title}</div>
        <DifficultyBadge level={scenario.difficulty} />
      </div>
      <div style={{ fontSize: 11, color: COLORS.muted }}>{scenario.specific_objective}</div>
    </div>
  );
}

function ModuleCard({ module, expanded, onToggle, onStart }) {
  const completed = 0;
  const total = module.scenarios?.length || 0;
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
          cursor: 'pointer', borderBottom: expanded ? `1px solid ${COLORS.border}` : 'none',
        }}
      >
        <ModuleIcon moduleId={module.order} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{module.title}</span>
            <Badge variant="default">{completed}/{total}</Badge>
          </div>
          <ProgressBar value={completed} max={total || 1} color={module.color} height={3} />
        </div>
        <span style={{ fontSize: 16, color: COLORS.muted, userSelect: 'none' }}>{expanded ? '▴' : '▾'}</span>
      </div>
      {expanded && (
        <div style={{ padding: '8px 6px' }}>
          {module.scenarios?.map(sc => (
            <ScenarioRow key={sc.id} scenario={sc} moduleId={module.id} onStart={onStart} />
          ))}
          {(!module.scenarios || module.scenarios.length === 0) && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: COLORS.muted }}>No scenarios yet.</div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function DashboardScreen() {
  const navigate = useNavigate();
  const [expandedModule, setExpandedModule] = useState(null);

  const { data: modules = [], isLoading: modulesLoading } = useQuery({ queryKey: ['modules'], queryFn: fetchModules });
  const { data: progress } = useQuery({ queryKey: ['progress'], queryFn: fetchProgress });

  function handleStartScenario(scenario) {
    navigate(`/workspace/${scenario.id}`, { state: { title: scenario.title } });
  }

  const totalScenarios = modules.reduce((sum, m) => sum + (m.scenarios?.length || 0), 0);
  const accuracy = progress ? Math.round(progress.command_accuracy * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopNav />

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 0, background: COLORS.bg1, borderBottom: `1px solid ${COLORS.border}`, padding: '12px 24px', flexShrink: 0 }}>
        {[
          { label: 'Command Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? COLORS.accent : COLORS.warning },
          { label: 'Sessions', value: progress?.total_sessions ?? 0 },
          { label: 'Pass Sessions', value: progress?.pass_sessions ?? 0, color: COLORS.accent },
          { label: 'Scenarios', value: totalScenarios },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, padding: '0 16px', borderLeft: i > 0 ? `1px solid ${COLORS.border}` : 'none' }}>
            <div style={{ fontSize: 11, color: COLORS.secondary, marginBottom: 3 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color || COLORS.text }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Learning Path</h2>
              <p style={{ fontSize: 13, color: COLORS.secondary, marginTop: 2 }}>
                {modules.length} modules · {totalScenarios} scenarios
              </p>
            </div>
          </div>

          {modulesLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.muted }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modules.map(mod => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  expanded={expandedModule === mod.id}
                  onToggle={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  onStart={handleStartScenario}
                />
              ))}
            </div>
          )}
          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  );
}
