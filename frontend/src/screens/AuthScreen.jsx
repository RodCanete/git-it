import { useState } from 'react';
import { COLORS } from '../tokens';
import Logo from '../components/Logo';
import Btn from '../components/Btn';
import Input from '../components/Input';
import { useLogin, useRegister } from '../hooks/useAuth';

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', role: 'student' });
  const [errors, setErrors] = useState({});

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs = {};
    if (!form.email.includes('@')) errs.email = 'Enter a valid email address';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (mode === 'register') {
      if (!form.username.trim()) errs.username = 'Username is required';
      if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (mode === 'login') {
      loginMutation.mutate({ email: form.email, password: form.password });
    } else {
      registerMutation.mutate({
        email: form.email,
        username: form.username,
        password: form.password,
        role: form.role || 'student',
      });
    }
  }

  const serverError = loginMutation.error?.response?.data || registerMutation.error?.response?.data;
  const loading = loginMutation.isPending || registerMutation.isPending;
  const reg = mode === 'register';

  const sideContent = [
    { icon: '⬡', title: 'Scenario-Driven Practice', desc: 'Solve real-world Git problems, not abstract drills.' },
    { icon: '◈', title: 'Live DAG Visualization', desc: 'Watch your repository state change with every command.' },
    { icon: '⇌', title: 'Fading Scaffolding', desc: 'Support decreases as your confidence grows.' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'stretch' }}>
      {/* Left panel */}
      <div style={{ flex: '0 0 420px', background: COLORS.bg1, borderRight: `1px solid ${COLORS.border}`, padding: '40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Logo size={28} />
        <p style={{ marginTop: 16, fontSize: 15, color: COLORS.secondary, lineHeight: 1.7 }}>
          The Git learning platform that teaches through doing — not reading.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 }}>
          {sideContent.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: COLORS.accent, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: COLORS.secondary }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
            {reg ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 14, color: COLORS.secondary, marginBottom: 28 }}>
            {reg ? 'Start your Git mastery journey.' : 'Sign in to continue learning.'}
          </p>

          {serverError && (
            <div style={{ background: COLORS.dangerDim, border: `1px solid ${COLORS.danger}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: COLORS.danger }}>
              {typeof serverError === 'string' ? serverError : 'Invalid credentials. Please try again.'}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reg && (
              <Input label="Username" value={form.username} onChange={set('username')} placeholder="alexrivera" error={errors.username} />
            )}
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" error={errors.email} />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" error={errors.password} />
            {reg && (
              <Input label="Confirm password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" error={errors.confirm} />
            )}
            {reg && (
              <div>
                <label style={{ fontSize: 13, color: COLORS.secondary }}>Role</label>
                <select
                  value={form.role || 'student'}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  style={{ width: '100%', marginTop: 6, background: COLORS.bg1, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '11px 14px', color: COLORS.text, fontSize: 14, outline: 'none' }}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <Btn type="submit" disabled={loading} style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}>
              {loading ? 'Please wait…' : (reg ? 'Create account' : 'Sign in')}
            </Btn>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: COLORS.secondary }}>
            {reg ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={() => { setMode(reg ? 'login' : 'register'); setErrors({}); }}
              style={{ color: COLORS.accent, cursor: 'pointer', fontWeight: 600 }}>
              {reg ? 'Sign in' : 'Create one'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
