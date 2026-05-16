import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../tokens';
import TopNav from '../components/TopNav';
import Card from '../components/Card';
import { StatCard, MiniBarChart } from '../components/AdminCharts';
import { fetchAdminStats, fetchStudents, fetchIncorrectCommands } from '../api/queries';

function StudentTable({ students }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Students</span>
        <span style={{ fontSize: 11, color: COLORS.muted }}>{students.length} total</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.bg2 }}>
              {['Username', 'Email', 'Command Accuracy', 'Sessions'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: COLORS.secondary, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{s.username}</td>
                <td style={{ padding: '10px 16px', color: COLORS.secondary }}>{s.email}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ color: s.command_accuracy >= 0.7 ? COLORS.accent : COLORS.warning, fontWeight: 600 }}>
                    {Math.round(s.command_accuracy * 100)}%
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: COLORS.secondary }}>{s.total_sessions}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '20px 16px', textAlign: 'center', color: COLORS.muted }}>No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function IncorrectCommandsTable({ commands }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}` }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Top Incorrect Commands</span>
      </div>
      <div>
        {commands.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: i < commands.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
            <code style={{ fontSize: 12, color: COLORS.danger, background: COLORS.dangerDim, padding: '2px 8px', borderRadius: 4 }}>{c.command}</code>
            <span style={{ fontSize: 12, color: COLORS.muted }}>{c.count}×</span>
          </div>
        ))}
        {commands.length === 0 && (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>No incorrect commands recorded yet.</div>
        )}
      </div>
    </Card>
  );
}

export default function AdminScreen() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: fetchAdminStats });
  const { data: students = [] } = useQuery({ queryKey: ['admin-students'], queryFn: fetchStudents });
  const { data: incorrectCommands = [] } = useQuery({ queryKey: ['admin-incorrect-commands'], queryFn: fetchIncorrectCommands });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopNav />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>Platform Overview</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <StatCard label="Total Students" value={stats?.total_students ?? '—'} />
            <StatCard
              label="Avg Command Accuracy"
              value={stats ? `${Math.round(stats.avg_command_accuracy * 100)}%` : '—'}
              color={stats?.avg_command_accuracy >= 0.7 ? COLORS.accent : COLORS.warning}
            />
            <StatCard label="Total Sessions" value={stats?.total_sessions ?? '—'} />
            <StatCard
              label="Pass Rate"
              value={stats ? `${Math.round(stats.pass_rate * 100)}%` : '—'}
              color={stats?.pass_rate >= 0.7 ? COLORS.accent : COLORS.warning}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <StudentTable students={students} />
            <IncorrectCommandsTable commands={incorrectCommands} />
          </div>
        </div>
      </div>
    </div>
  );
}
