// ============================================================
// components/admin/SubscriptionReview.tsx
// Admin: approve or cancel seller applications. Approval is the
// only place a seller role and its expiry date are granted.
// ============================================================

import { useEffect, useState } from 'react';
import { Check, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/formatters';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { SellerSubscription } from '@/lib/supabaseSubscriptions';
import { activateSubscription, cancelSubscription } from '@/lib/supabaseSubscriptions';

type Row = Record<string, unknown>;

interface Applicant extends SellerSubscription {
  email: string;
}

const PLAN_LABEL = { monthly: 'Monthly', yearly: 'Yearly' } as const;

export function SubscriptionReview() {
  const [rows, setRows] = useState<Applicant[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!isSupabaseConfigured) return;

    const { data } = await supabase
      .from('seller_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!data) return;

    const parsed = (data as Row[]).map(r => ({
      id:        String(r['id']),
      plan:      (r['plan'] as SellerSubscription['plan']) ?? 'monthly',
      tier:      (r['tier'] as SellerSubscription['tier']) ?? 'bronze',
      status:    (r['status'] as SellerSubscription['status']) ?? 'pending',
      amount:    Number(r['amount'] ?? 0),
      startedAt: (r['started_at'] as string) ?? undefined,
      expiresAt: (r['expires_at'] as string) ?? undefined,
      createdAt: String(r['created_at'] ?? ''),
      email:     '',
    }));

    // Attach applicant emails in one query
    const ids = (data as Row[]).map(r => String(r['user_id']));
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,email')
        .in('id', ids);
      const byId = new Map((profiles ?? []).map(p => [String((p as Row)['id']), String((p as Row)['email'] ?? '')]));
      const userIds = new Map((data as Row[]).map(r => [String(r['id']), String(r['user_id'])]));
      for (const row of parsed) {
        row.email = byId.get(userIds.get(row.id) ?? '') ?? '';
      }
    }

    setRows(parsed);
  };

  useEffect(() => { void load(); }, []);

  const approve = async (id: string) => {
    setBusy(id);
    try {
      const result = await activateSubscription(id);
      if (!result.ok) { toast.error(result.error ?? 'Could not activate'); return; }
      toast.success('Subscription activated — account is now a shop owner');
      await load();
    } finally { setBusy(null); }
  };

  const cancel = async (id: string) => {
    setBusy(id);
    try {
      const result = await cancelSubscription(id);
      if (!result.ok) { toast.error(result.error ?? 'Could not cancel'); return; }
      toast.success('Application cancelled');
      await load();
    } finally { setBusy(null); }
  };

  if (rows.length === 0) {
    return <EmptyState icon="Inbox" title="No applications yet" description="Seller applications will appear here for approval." compact />;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 500, fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Seller subscriptions
        </h1>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>{rows.length}</span>
      </div>

      <div className="admin-table">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Applicant', 'Plan', 'Tier', 'Applied', 'Expires', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 'var(--text-overline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px', fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{row.email || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>{PLAN_LABEL[row.plan]}</td>
                <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Crown size={13} color="var(--accent)" /> {row.tier}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{row.createdAt ? formatDate(row.createdAt) : '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{row.expiresAt ? formatDate(row.expiresAt) : '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', fontWeight: 600, textTransform: 'capitalize', color: row.status === 'active' ? 'var(--success)' : row.status === 'pending' ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                  {row.status}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {row.status === 'pending' && (
                      <>
                        <Button variant="accent" size="sm" isLoading={busy === row.id} onClick={() => approve(row.id)}>
                          <Check size={13} /> Activate
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => cancel(row.id)}>
                          <X size={13} /> Reject
                        </Button>
                      </>
                    )}
                    {row.status === 'active' && (
                      <Button variant="ghost" size="sm" onClick={() => cancel(row.id)}>
                        <X size={13} /> Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 20, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', maxWidth: 620, lineHeight: 'var(--leading-relaxed)' }}>
        Activating grants the shop-owner role and sets the renewal date (one month or one year from today). Cancelling ends access but keeps the store and its products intact.
      </p>
    </div>
  );
}
