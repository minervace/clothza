// ============================================================
// pages/AuthPage.tsx — Clothza v4.0
// Sign in / create account against Supabase Auth.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const { login, signUp } = useMarketplace();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setConfirmationSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (mode === 'signin') {
        const ok = await login(email.trim(), password);
        if (!ok) {
          setError('Wrong email or password.');
          return;
        }
        toast.success('Signed in');
        navigate('/');
      } else {
        if (!name.trim()) { setError('Enter your name.'); return; }
        const result = await signUp(email.trim(), password, name.trim());
        if (!result.ok) {
          setError(result.error ?? 'Could not create the account.');
          return;
        }
        if (result.needsConfirmation) {
          setConfirmationSent(true);
          return;
        }
        toast.success('Account created');
        navigate('/');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <PageTransition>
        <div className="container" style={{ maxWidth: 460, padding: '96px 24px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-title)', fontWeight: 800, marginBottom: 12 }}>
            Accounts are offline
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
            Supabase is not configured in this build, so sign-in is unavailable.
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to
            your <code>.env</code> to enable real accounts.
          </p>
          <Link to="/" className="btn btn-outline btn-pill" style={{ marginTop: 24, display: 'inline-flex' }}>
            Back to shop
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container" style={{ maxWidth: 460, padding: '72px 24px 96px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-title)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
          {mode === 'signin'
            ? 'Sign in to track orders, save favourites and message boutiques.'
            : 'Join Clothza to shop independent Nepali and South Asian boutiques.'}
        </p>

        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-secondary)', padding: 3, borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={mode === m ? 'seg-btn seg-btn--active' : 'seg-btn'}
              style={{
                flex: 1,
                background: mode === m ? 'var(--bg-card)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: mode === m ? 'var(--shadow-card)' : 'none',
              }}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {confirmationSent ? (
          <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: 16, color: 'var(--text-primary)' }}>
            Check your inbox — we sent a confirmation link to <strong>{email}</strong>.
            Open it, then sign in.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <Input
                label="Name"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                leftIcon={<UserIcon size={15} />}
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              leftIcon={<Mail size={15} />}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              leftIcon={<Lock size={15} />}
              hint={mode === 'signup' ? 'At least 6 characters.' : undefined}
            />

            {error && (
              <div role="alert" style={{ color: 'var(--danger)', fontSize: 'var(--text-body)' }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="accent" size="lg" isLoading={busy} style={{ width: '100%', marginTop: 4 }}>
              {mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
            </Button>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
