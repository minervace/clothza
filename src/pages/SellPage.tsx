// ============================================================
// pages/SellPage.tsx — Clothza v5.0
// Seller plans: apply for a monthly or yearly shop subscription.
// Role is granted by an admin after the payment is confirmed.
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Store as StoreIcon } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/toast';
import { formatPrice } from '@/lib/formatters';
import {
  SELLER_PLANS,
  applyForSubscription,
  fetchMySubscription,
  type SellerSubscription,
} from '@/lib/supabaseSubscriptions';

export default function SellPage() {
  const { state, authReady } = useMarketplace();
  const user = state.currentUser;

  const [sub, setSub] = useState<SellerSubscription | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !user) return;
    void fetchMySubscription().then(setSub);
  }, [authReady, user]);

  const apply = async (planId: 'monthly' | 'yearly', tier: 'bronze' | 'silver' | 'gold') => {
    setBusy(planId);
    try {
      const result = await applyForSubscription(planId, tier);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not submit the application.');
        return;
      }
      toast.success('Application received. We will be in touch to confirm payment.');
      setSub(await fetchMySubscription());
    } finally {
      setBusy(null);
    }
  };

  // ── Already a shop owner ─────────────────────────────────
  if (user?.role === 'seller' || user?.role === 'admin') {
    return (
      <PageTransition>
        <div className="container" style={{ maxWidth: 640, padding: '96px 24px' }}>
          <div className="text-overline" style={{ color: 'var(--text-tertiary)', marginBottom: 10 }}>Selling on Clothza</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-title)', fontWeight: 500, fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1", marginBottom: 16 }}>
            You already have a shop.
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 'var(--leading-relaxed)' }}>
            Manage your boutique, products and orders from the dashboard. Your plan renews automatically — contact us to change it.
          </p>
          {sub?.status === 'active' && sub.expiresAt && (
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginBottom: 24 }}>
              Plan: {sub.plan} · renews {new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          <Link to="/dashboard" className="btn btn-primary">Open dashboard <ArrowRight size={15} /></Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section style={{ paddingTop: 96, paddingBottom: 64, borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 'var(--text-overline)', fontWeight: 600, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 24, height: 1, background: 'var(--border-strong)' }} />
            Selling on Clothza
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
            fontSize: 'clamp(36px, 4.4vw, 54px)',
            fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.015em',
            maxWidth: 720, marginBottom: 20,
          }}>
            Open a boutique in <span className="text-gradient">Kathmandu.</span>
          </h1>
          <p style={{ fontSize: 'var(--text-subtitle)', color: 'var(--text-secondary)', maxWidth: 520, lineHeight: 'var(--leading-relaxed)' }}>
            A Clothza shop is a single page customers can browse, message and buy from. Pick a plan, and we will confirm payment and switch your account on.
          </p>
        </div>
      </section>

      {/* ── Plans ─────────────────────────────────────────────── */}
      <section>
        <div className="container" style={{ padding: '64px 24px 80px' }}>
          {!user ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Sign in first — a shop belongs to an account.</p>
              <Link to="/signin" className="btn btn-primary">Sign in</Link>
            </div>
          ) : sub ? (
            <div style={{ maxWidth: 560 }}>
              <div style={{ border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: 24 }}>
                <div className="text-overline" style={{ color: 'var(--text-tertiary)', marginBottom: 8 }}>Your application</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
                  {sub.plan === 'monthly' ? 'Monthly' : 'Yearly'} · {sub.tier}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}>
                  {sub.status === 'pending' && 'Waiting for us to confirm your payment. We will email you within one working day.'}
                  {sub.status === 'active' && `Active — renews ${sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-GB') : 'soon'}.`}
                  {sub.status === 'expired' && 'This subscription has lapsed. Apply again below.'}
                  {sub.status === 'cancelled' && 'Cancelled. You can apply again whenever you like.'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20, maxWidth: 760 }}>
              {SELLER_PLANS.map(plan => (
                <div
                  key={plan.id}
                  style={{
                    border: plan.featured ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                    background: plan.featured ? 'var(--bg-card)' : 'transparent',
                    borderRadius: 'var(--radius-md)',
                    padding: 28,
                    display: 'flex', flexDirection: 'column', gap: 16,
                  }}
                >
                  <div>
                    <div className="text-overline" style={{ color: plan.featured ? 'var(--accent)' : 'var(--text-tertiary)', marginBottom: 10 }}>
                      {plan.featured ? 'Best value' : 'Plan'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>{formatPrice(plan.price)}</span>
                      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{plan.period}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)', marginTop: 8 }}>{plan.blurb}</p>
                  </div>

                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0 }}>
                    {plan.perks.map(perk => (
                      <li key={perk} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                        <Check size={14} style={{ marginTop: 3, flexShrink: 0, color: 'var(--accent)' }} />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.featured ? 'accent' : 'outline'}
                    isLoading={busy === plan.id}
                    onClick={() => apply(plan.id, plan.tier)}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    <StoreIcon size={15} /> Apply for {plan.name.toLowerCase()}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <p style={{ marginTop: 32, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', maxWidth: 560, lineHeight: 'var(--leading-relaxed)' }}>
            Payment is arranged directly for now: we confirm your eSewa or bank transfer, then switch your account to shop owner. Nothing is charged automatically.
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
