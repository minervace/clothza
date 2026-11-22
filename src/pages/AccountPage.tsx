// ============================================================
// pages/AccountPage.tsx — Clothza v5.0
// Everything about the signed-in person: profile, their shop,
// their orders, password, and sign out.
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Store as StoreIcon, LogOut, KeyRound, UserRound, ChevronRight,
} from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/lib/toast';
import { formatPrice, formatDate } from '@/lib/formatters';
import { changePassword, updateDisplayName, getAuthProvider } from '@/lib/supabaseAuth';

type Panel = 'profile' | 'password';

export default function AccountPage() {
  const { state, authReady, logout } = useMarketplace();
  const user = state.currentUser;

  const [panel, setPanel] = useState<Panel>('profile');
  const [provider, setProvider] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    void getAuthProvider().then(setProvider);
  }, [user]);

  const myOrders = state.orders.filter(o => o.userId === user?.id);
  const myStore = user
    ? state.stores.find(s => s.ownerId === user.id || s.id === user.storeId)
    : undefined;

  if (!authReady) {
    return (
      <div className="container" style={{ padding: '120px 24px', color: 'var(--text-tertiary)' }}>
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div style={{ paddingTop: 96 }} className="container">
          <EmptyState
            icon="Layers"
            title="You are not signed in"
            description="Sign in to see your account, orders and shop."
            cta="Sign in"
            ctaLink="/signin"
          />
        </div>
      </PageTransition>
    );
  }

  const saveName = async () => {
    if (!name.trim()) { toast.error('Enter a name.'); return; }
    setBusy(true);
    try {
      const result = await updateDisplayName(name.trim());
      if (!result.ok) { toast.error(result.error ?? 'Could not save'); return; }
      toast.success('Name updated');
    } finally { setBusy(false); }
  };

  const savePassword = async () => {
    if (pass.length < 6) { toast.error('Use at least 6 characters.'); return; }
    if (pass !== pass2) { toast.error('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      const result = await changePassword(pass);
      if (!result.ok) { toast.error(result.error ?? 'Could not change the password'); return; }
      toast.success('Password changed');
      setPass(''); setPass2('');
    } finally { setBusy(false); }
  };

  const roleLabel =
    user.role === 'admin' ? 'Administrator'
    : user.role === 'seller' ? 'Shop owner'
    : 'Customer';

  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  return (
    <PageTransition>
      {/* ── Header ─────────────────────────────────────────── */}
      <section style={{ paddingTop: 56, paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 500,
              fontVariationSettings: "'opsz' 72, 'SOFT' 50",
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-title)', fontWeight: 500, fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1", lineHeight: 1.1 }}>
                {user.name || 'Your account'}
              </h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap', color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}>
                <span>{user.email}</span>
                <span>·</span>
                <span>{roleLabel}</span>
                {provider && (
                  <>
                    <span>·</span>
                    <span style={{ textTransform: 'capitalize' }}>{provider}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '40px 24px 96px' }}>
        <div className="account-grid">

          {/* ── Left: shop + orders ─────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Shop */}
            <div className="account-card">
              <div className="account-card__head">
                <StoreIcon size={16} color="var(--text-tertiary)" />
                <span>Your shop</span>
              </div>
              {myStore ? (
                <>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
                    {myStore.name}
                  </div>
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    {myStore.location || 'No location set'} · {state.products.filter(p => p.storeId === myStore.id).length} pieces listed
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link to="/dashboard" className="btn btn-primary btn-sm">Manage shop</Link>
                    <Link to={`/store/${myStore.slug}`} className="btn btn-outline btn-sm">View storefront</Link>
                  </div>
                </>
              ) : user.role === 'seller' || user.role === 'admin' ? (
                <>
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    You have a shop-owner account but no boutique yet.
                  </p>
                  <Link to="/dashboard" className="btn btn-primary btn-sm">Open your boutique</Link>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Do you make clothes? Open a boutique and sell to customers across Nepal.
                  </p>
                  <Link to="/sell" className="btn btn-outline btn-sm">See selling plans</Link>
                </>
              )}
            </div>

            {/* Orders */}
            <div className="account-card">
              <div className="account-card__head">
                <Package size={16} color="var(--text-tertiary)" />
                <span>Orders</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-serif)' }}>{myOrders.length}</span>
              </div>
              {myOrders.length === 0 ? (
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                  No orders yet. <Link to="/" style={{ color: 'var(--accent)' }}>Browse the boutiques</Link>.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {myOrders.slice(0, 4).map(o => (
                    <Link key={o.id} to="/orders" className="account-row">
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{o.trackingId}</div>
                        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{formatDate(o.createdAt)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 'var(--text-body)' }}>{formatPrice(o.total)}</span>
                        <ChevronRight size={15} color="var(--text-tertiary)" />
                      </div>
                    </Link>
                  ))}
                  <Link to="/orders" className="btn btn-outline btn-sm" style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                    All orders
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: settings ─────────────────────────────── */}
          <div>
            <div className="account-card">
              <div className="account-card__head">
                <UserRound size={16} color="var(--text-tertiary)" />
                <span>Account settings</span>
              </div>

              <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
                {([
                  { id: 'profile', label: 'Profile', icon: UserRound },
                  { id: 'password', label: 'Password', icon: KeyRound },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPanel(tab.id)}
                    aria-pressed={panel === tab.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 14px', background: 'none', border: 'none',
                      borderBottom: `2px solid ${panel === tab.id ? 'var(--text-primary)' : 'transparent'}`,
                      color: panel === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontWeight: panel === tab.id ? 600 : 400,
                      fontFamily: 'var(--font-sans)', fontSize: 'var(--text-body)',
                      cursor: 'pointer', marginBottom: -1,
                    }}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              {panel === 'profile' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Input
                    label="Display name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                  />
                  <Input
                    label="Email"
                    value={user.email}
                    readOnly
                    hint={provider === 'google' ? 'Managed by your Google account.' : 'Contact us to change your email.'}
                  />
                  <Button variant="primary" isLoading={busy} onClick={saveName} style={{ alignSelf: 'flex-start' }}>
                    Save changes
                  </Button>
                </div>
              ) : provider !== 'email' ? (
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                  You signed in with Google, so there is no Clothza password to change — your access is managed by Google.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Input
                    label="New password"
                    type="password"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="••••••••"
                    hint="At least 6 characters."
                    autoComplete="new-password"
                  />
                  <Input
                    label="Repeat new password"
                    type="password"
                    value={pass2}
                    onChange={e => setPass2(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <Button variant="primary" isLoading={busy} onClick={savePassword} style={{ alignSelf: 'flex-start' }}>
                    Update password
                  </Button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => { logout(); window.location.href = '/'; }}
                className="btn btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
