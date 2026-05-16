import { useNavigate, useLocation } from 'react-router-dom';
import { COLORS } from '../tokens';
import Logo from './Logo';
import useAuthStore from '../store/authStore';

export default function TopNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const currentScreen = pathname.startsWith('/admin') ? 'admin' : 'dashboard';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56,
      background: COLORS.bg1, borderBottom: `1px solid ${COLORS.border}`,
      flexShrink: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Logo size={22} withText={true} />
        {user && (
          <div style={{ display: 'flex', gap: 4 }}>
            {['dashboard', ...(user.role === 'admin' ? ['admin'] : [])].map(s => (
              <button key={s} onClick={() => navigate(`/${s}`)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none',
                background: currentScreen === s ? COLORS.accentDim : 'transparent',
                color: currentScreen === s ? COLORS.accent : COLORS.secondary,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>{s === 'admin' ? 'Admin' : 'Dashboard'}</button>
            ))}
          </div>
        )}
      </div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user.username}</div>
              <div style={{ fontSize: 11, color: COLORS.secondary }}>{user.email}</div>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: COLORS.accentDim, border: `2px solid ${COLORS.accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: COLORS.accent,
            }}>{(user.username || 'U')[0].toUpperCase()}</div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '5px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}`,
            background: 'transparent', color: COLORS.secondary, fontSize: 12, cursor: 'pointer',
          }}>Sign out</button>
        </div>
      )}
    </div>
  );
}
