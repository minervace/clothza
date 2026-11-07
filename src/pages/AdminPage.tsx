// ============================================================
// pages/AdminPage.tsx — Clothza v4.0
// Super admin panel: user management, store oversight,
// platform stats, admin passcode (SHA-256 lockout)
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Users, Store, BarChart2, Trash2,
  Eye, Crown, Lock, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useAdminLockout } from '@/hooks/useAdminLockout';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { TierBadge, OrderStatusBadge } from '@/components/ui/Badge';
import { toast } from '@/lib/toast';
import { formatPrice, formatDate, formatCountdown } from '@/lib/formatters';
import { verifyAdminPassword } from '@/lib/crypto';
import { DEMO_CREDENTIALS } from '@/lib/constants';
import { haptic } from '@/lib/haptics';

type AdminTab = 'stats' | 'users' | 'stores' | 'orders';

const TABS: Array<{ id: AdminTab; label: string; icon: typeof Users }> = [
  { id: 'stats',  label: 'Platform Stats', icon: BarChart2   },
  { id: 'users',  label: 'Users',          icon: Users       },
  { id: 'stores', label: 'Stores',         icon: Store       },
  { id: 'orders', label: 'All Orders',     icon: CheckCircle2 },
];

export default function AdminPage() {
  const { state, deleteUser, updateOrderStatus } = useMarketplace();
  const { currentUser } = state;

  // Admin lockout hook
  const { isLocked, remainingMs, attemptsRemaining, recordFailedAttempt, resetLockout } = useAdminLockout();

  // SHA-256 passcode gate
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode,       setPasscode]      = useState('');
  const [checking,       setChecking]      = useState(false);
  const [countdown,      setCountdown]     = useState(0);

  // Countdown timer for lockout display
  useEffect(() => {
    if (!isLocked) { setCountdown(0); return; }
    setCountdown(Math.ceil(remainingMs / 1000));
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, remainingMs]);

  const [activeTab, setActiveTab]       = useState<AdminTab>('stats');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteType,   setDeleteType]   = useState<'user'>('user');

  // Role-based access: only admin role can skip passcode for certain views
  // But we always require the passcode as an extra layer
  const handleAuth = async () => {
    if (isLocked || !passcode) return;
    setChecking(true);
    await new Promise(r => setTimeout(r, 400)); // UX delay
    const valid = await verifyAdminPassword(passcode);
    setChecking(false);
    if (valid) {
      setAuthenticated(true);
      resetLockout();
      haptic.success();
      toast.success('Admin access granted.');
    } else {
      recordFailedAttempt();
      haptic.error();
      toast.error(`Incorrect passcode. ${attemptsRemaining - 1} attempt${attemptsRemaining - 1 === 1 ? '' : 's'} remaining.`);
      setPasscode('');
    }
  };

  // ── Passcode gate ────────────────────────────────────────────
  if (!authenticated) {
    return (
      <PageTransition>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass"
            style={{ maxWidth: 400, width: '100%', padding: 40, borderRadius: 'var(--radius-2xl)', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', textAlign: 'center' }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: isLocked ? 'var(--danger-light)' : 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isLocked ? <Lock size={28} color="var(--danger)" /> : <ShieldCheck size={28} color="var(--accent)" />}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isLocked ? 'Access Locked' : 'Admin Access'}
              </h1>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 'var(--leading-relaxed)' }}>
                {isLocked
                  ? `Too many failed attempts. Try again in ${formatCountdown(countdown)}.`
                  : 'Enter the admin passcode to access the control panel.'}
              </p>
            </div>

            {!isLocked && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input
                  type="password"
                  label="Admin Passcode"
                  placeholder="••••••••"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAuth(); }}
                  hint={`Default: ${DEMO_CREDENTIALS.admin.passcode}`}
                  autoFocus
                />
                {attemptsRemaining < 5 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 'var(--text-caption)', color: 'var(--warning)', fontWeight: 600 }}>
                    <AlertTriangle size={13} /> {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                  </div>
                )}
                <Button variant="accent" isLoading={checking} onClick={handleAuth} disabled={!passcode.trim()} style={{ width: '100%' }}>
                  Authenticate
                </Button>
              </div>
            )}

            {isLocked && countdown > 0 && (
              <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.05em' }}>
                {formatCountdown(countdown)}
              </div>
            )}
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // ── Authenticated Admin UI ───────────────────────────────────
  const allOrders = state.orders;
  const totalRevenue = allOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);

  const platformStats = [
    { label: 'Total Users',    value: state.users.length,    icon: Users,    color: 'var(--accent)'   },
    { label: 'Active Stores',  value: state.stores.length,   icon: Store,    color: 'var(--success)'  },
    { label: 'Total Products', value: state.products.length, icon: BarChart2, color: 'var(--warning)' },
    { label: 'Platform Revenue', value: formatPrice(totalRevenue), icon: Crown, color: 'var(--tier-gold)' },
  ];

  return (
    <PageTransition>
      <div style={{ paddingTop: 80, display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{ width: 240, borderRight: '1px solid var(--border)', background: 'var(--bg-card)', padding: '32px 12px', flexShrink: 0, position: 'sticky', top: 80, height: 'calc(100vh - 80px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 28 }}>
            <ShieldCheck size={22} color="var(--accent)" />
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--text-subtitle)', color: 'var(--text-primary)' }}>Admin Panel</div>
          </div>
          <nav aria-label="Admin navigation">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-current={isActive ? 'page' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', background: isActive ? 'var(--accent-light)' : 'transparent', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isActive ? 700 : 500, fontSize: 'var(--text-body)', fontFamily: 'var(--font-sans)', marginBottom: 4, transition: 'all var(--dur-fast) var(--spring)', textAlign: 'left' }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-secondary)'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; } }}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </nav>

          <div style={{ position: 'absolute', bottom: 24, left: 12, right: 12 }}>
            <button onClick={() => setAuthenticated(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--danger)', fontWeight: 500, fontSize: 'var(--text-body)', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>
              <Lock size={14} /> Lock Admin
            </button>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {/* Platform Stats */}
          {activeTab === 'stats' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 32, letterSpacing: '-0.02em' }}>
                Platform Overview
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                {platformStats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 'var(--text-overline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)' }}>{stat.label}</span>
                        <Icon size={18} color={stat.color} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{stat.value}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users tab */}
          {activeTab === 'users' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 28, letterSpacing: '-0.02em' }}>
                All Users ({state.users.length})
              </h1>
              <div className="admin-table">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['User', 'Email', 'Role', 'Tier', 'Joined', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 'var(--text-overline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 'var(--text-body)', flexShrink: 0 }}>
                              {u.avatarUrl ? <img src={u.avatarUrl} alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} loading="lazy" /> : u.name.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{u.email}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: u.role === 'admin' ? 'var(--danger)' : u.role === 'seller' ? 'var(--accent)' : 'var(--text-secondary)', background: u.role === 'admin' ? 'var(--danger-light)' : u.role === 'seller' ? 'var(--accent-light)' : 'var(--bg-secondary)', padding: '3px 8px', borderRadius: 'var(--radius-pill)', textTransform: 'capitalize' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}><TierBadge tier={u.subscriptionTier} showEmoji={false} /></td>
                        <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{formatDate(u.joinedAt)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {u.id !== currentUser?.id && (
                            <button onClick={() => { setDeleteTarget(u.id); setDeleteType('user'); }} aria-label={`Delete user ${u.name}`} style={{ background: 'none', border: '1px solid var(--danger-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '5px 8px', color: 'var(--danger)', display: 'flex' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stores tab */}
          {activeTab === 'stores' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 28, letterSpacing: '-0.02em' }}>
                All Stores ({state.stores.length})
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {state.stores.map(s => (
                  <div key={s.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                    <div style={{ height: 100, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                      <img src={s.banner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    </div>
                    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={s.logo} alt={s.name} width={36} height={36} style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }} loading="lazy" />
                        <div>
                          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{s.location}</div>
                        </div>
                        <div style={{ marginLeft: 'auto' }}><TierBadge tier={s.subscriptionTier} /></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                        <span>⭐ {s.rating}</span>
                        <span><Eye size={11} style={{ display: 'inline', marginRight: 3 }} />{s.views.toLocaleString()}</span>
                        <span>{s.reviewCount} reviews</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders tab */}
          {activeTab === 'orders' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 28, letterSpacing: '-0.02em' }}>
                All Orders ({allOrders.length})
              </h1>
              {allOrders.length === 0 ? (
                <EmptyState icon="ShoppingBag" title="No orders placed yet" compact />
              ) : (
                <div className="admin-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Tracking', 'Customer', 'Date', 'Total', 'Status', 'Action'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 'var(--text-overline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>{o.trackingId}</td>
                          <td style={{ padding: '12px 14px', fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{o.deliveryAddress.fullName}</td>
                          <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{formatDate(o.createdAt)}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{formatPrice(o.total)}</td>
                          <td style={{ padding: '12px 14px' }}><OrderStatusBadge status={o.status} /></td>
                          <td style={{ padding: '12px 14px' }}>
                            {o.status === 'pending' && (
                              <button onClick={() => { updateOrderStatus(o.id, 'processing'); toast.success('Order marked as processing'); }} style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 10px', cursor: 'pointer' }}>
                                Mark Processing
                              </button>
                            )}
                            {o.status === 'processing' && (
                              <button onClick={() => { updateOrderStatus(o.id, 'shipped'); toast.success('Order marked as shipped'); }} style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--success)', background: 'var(--success-light)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 10px', cursor: 'pointer' }}>
                                Mark Shipped
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteType === 'user' && deleteTarget) {
            deleteUser(deleteTarget);
            toast.success('User deleted.');
          }
          setDeleteTarget(null);
          haptic.medium();
        }}
        title="Delete this user?"
        message="This action is permanent. The user account will be removed from the platform."
        confirmLabel="Delete User"
        variant="danger"
      />
    </PageTransition>
  );
}
