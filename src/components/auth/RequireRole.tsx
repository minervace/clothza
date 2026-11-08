// ============================================================
// components/auth/RequireRole.tsx
// Route guard: sends guests to sign-in and blocks roles that are
// not allowed to see the page.
// ============================================================

import type { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import type { Role } from '@/context/MarketplaceContext';

const ROLE_LABEL: Record<Role, string> = {
  customer: 'customer',
  seller: 'shop owner',
  admin: 'admin',
};

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { state } = useMarketplace();
  const user = state.currentUser;

  if (!user) return <Navigate to="/signin" replace />;

  if (!roles.includes(user.role)) {
    return (
      <div className="container" style={{ maxWidth: 560, padding: '120px 24px 96px', textAlign: 'center' }}>
        <ShieldAlert size={36} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, marginBottom: 10 }}>
          Not available for your account
        </h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
          You are signed in as a {ROLE_LABEL[user.role]}. This area is only open to{' '}
          {roles.map(r => ROLE_LABEL[r]).join(' or ')} accounts.
        </p>
        <Link to="/" className="btn btn-outline btn-pill" style={{ marginTop: 24, display: 'inline-flex' }}>
          Back to shop
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
