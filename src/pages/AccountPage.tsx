// ============================================================
// pages/AccountPage.tsx — Clothza v5.1
// Profile, addresses, orders, security and account deletion.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package, Store as StoreIcon, LogOut, KeyRound, UserRound, ChevronRight,
  MapPin, Plus, Trash2, Star, Camera, ShieldAlert, MessageCircle,
} from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/lib/toast';
import { formatPrice, formatDate } from '@/lib/formatters';
import { changePassword, updateDisplayName, getAuthProvider } from '@/lib/supabaseAuth';
import { uploadImage } from '@/lib/supabaseStorage';
import {
  fetchAddresses, saveAddress, deleteAddress, savePhone,
  fetchOrderStats, deleteMyAccount,
  type Address, type OrderStats,
} from '@/lib/supabaseAccount';
import supabase from '@/lib/supabase';
import { ConversationView } from '@/components/messages/ConversationView';
import { fetchMyConversations, type Conversation } from '@/lib/supabaseMessages';

type Panel = 'profile' | 'addresses' | 'messages' | 'password' | 'danger';

const emptyAddress: Omit<Address, 'id' | 'createdAt'> = {
  label: 'Home', fullName: '', phone: '', address: '', city: '', province: '', isDefault: false,
};

export default function AccountPage() {
  const { state, authReady, logout } = useMarketplace();
  const user = state.currentUser;

  const [searchParams] = useSearchParams();
  const initialPanel = (searchParams.get('tab') as Panel | null) ?? 'profile';
  const [panel, setPanel] = useState<Panel>(
    ['profile', 'addresses', 'messages', 'password', 'danger'].includes(initialPanel) ? initialPanel : 'profile'
  );
  const [provider, setProvider] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [busy, setBusy] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [stats, setStats] = useState<OrderStats>({ orders: 0, spent: 0 });
  const [editing, setEditing] = useState<Address | null>(null);
  const [draft, setDraft] = useState(emptyAddress);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setAvatar(user.avatarUrl);
    void getAuthProvider().then(setProvider);
    void fetchAddresses().then(setAddresses);
    void fetchOrderStats().then(setStats);
    void fetchMyConversations().then(setConversations);
  }, [user]);

  const myOrders = state.orders.filter(o => o.userId === user?.id);
  const myStore = user
    ? state.stores.find(s => s.ownerId === user.id || s.id === user.storeId)
    : undefined;

  if (!authReady) {
    return <div className="container" style={{ padding: '120px 24px', color: 'var(--text-tertiary)' }}>Checking your session…</div>;
  }

  if (!user) {
    return (
      <PageTransition>
        <div style={{ paddingTop: 96 }} className="container">
          <EmptyState icon="Layers" title="You are not signed in" description="Sign in to see your account, orders and shop." cta="Sign in" ctaLink="/signin" />
        </div>
      </PageTransition>
    );
  }

  const saveProfile = async () => {
    if (!name.trim()) { toast.error('Enter a name.'); return; }
    setBusy(true);
    try {
      const r1 = await updateDisplayName(name.trim());
      if (!r1.ok) { toast.error(r1.error ?? 'Could not save'); return; }
      const r2 = await savePhone(phone);
      if (!r2.ok) { toast.error(r2.error ?? 'Could not save phone'); return; }
      toast.success('Profile updated');
    } finally { setBusy(false); }
  };

  const savePassword = async () => {
    if (pass.length < 6) { toast.error('Use at least 6 characters.'); return; }
    if (pass !== pass2) { toast.error('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      const r = await changePassword(pass);
      if (!r.ok) { toast.error(r.error ?? 'Could not change the password'); return; }
      toast.success('Password changed');
      setPass(''); setPass2('');
    } finally { setBusy(false); }
  };

  const onAvatar = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await uploadImage(file, 'avatars');
      if (!r.ok || !r.url) { toast.error(r.error ?? 'Upload failed'); return; }
      setAvatar(r.url);
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;
      if (id) await supabase.from('profiles').update({ avatar_url: r.url }).eq('id', id);
      toast.success('Photo updated');
    } finally { setBusy(false); }
  };

  const startEdit = (a?: Address) => {
    setEditing(a ?? null);
    setDraft(a ? { ...a } : { ...emptyAddress, fullName: name, phone });
  };

  const submitAddress = async () => {
    if (!draft.fullName.trim() || !draft.phone.trim() || !draft.address.trim() || !draft.city.trim()) {
      toast.error('Name, phone, address and city are required.');
      return;
    }
    setBusy(true);
    try {
      const r = await saveAddress({ ...draft, id: editing?.id });
      if (!r.ok) { toast.error(r.error ?? 'Could not save'); return; }
      toast.success(editing ? 'Address updated' : 'Address saved');
      setAddresses(await fetchAddresses());
      setEditing(null);
      setDraft(emptyAddress);
    } finally { setBusy(false); }
  };

  const removeAddress = async (id: string) => {
    const r = await deleteAddress(id);
    if (!r.ok) { toast.error(r.error ?? 'Could not remove'); return; }
    toast.success('Address removed');
    setAddresses(await fetchAddresses());
  };

  const removeAccount = async () => {
    const r = await deleteMyAccount();
    if (!r.ok) { toast.error(r.error ?? 'Could not delete the account'); setConfirmDelete(false); return; }
    toast.success('Account deleted');
    window.location.href = '/';
  };

  const roleLabel =
    user.role === 'admin' ? 'Administrator'
    : user.role === 'seller' ? 'Shop owner'
    : 'Customer';

  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  const TABS: Array<{ id: Panel; label: string; icon: typeof UserRound }> = [
    { id: 'profile',   label: 'Profile',   icon: UserRound },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'messages',  label: 'Messages',  icon: MessageCircle },
    { id: 'password',  label: 'Password',  icon: KeyRound },
    { id: 'danger',    label: 'Delete',    icon: ShieldAlert },
  ];

  return (
    <PageTransition>
      {/* Header */}
      <section className="account-header" style={{ paddingBottom: 28, borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {avatar
                  ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 500, fontVariationSettings: "'opsz' 72, 'SOFT' 50" }}>{initial}</span>}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                aria-label="Change photo"
                style={{
                  position: 'absolute', right: -2, bottom: -2, width: 26, height: 26,
                  borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-secondary)',
                }}
              >
                <Camera size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => void onAvatar(e.target.files?.[0])} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-title)', fontWeight: 500, fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1", lineHeight: 1.1 }}>
                {user.name || 'Your account'}
              </h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap', color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}>
                <span>{user.email}</span><span>·</span><span>{roleLabel}</span>
                {provider && <><span>·</span><span style={{ textTransform: 'capitalize' }}>{provider}</span></>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 28, borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>{stats.orders}</div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Orders</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>{formatPrice(stats.spent)}</div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>Spent</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '32px 24px 96px' }}>
        <div className="account-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="account-card">
              <div className="account-card__head"><StoreIcon size={16} color="var(--text-tertiary)" /><span>Your shop</span></div>
              {myStore ? (
                <>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{myStore.name}</div>
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
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginBottom: 16 }}>You have a shop-owner account but no boutique yet.</p>
                  <Link to="/dashboard" className="btn btn-primary btn-sm">Open your boutique</Link>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginBottom: 16 }}>Do you make clothes? Open a boutique and sell across Nepal.</p>
                  <Link to="/sell" className="btn btn-outline btn-sm">See selling plans</Link>
                </>
              )}
            </div>

            <div className="account-card">
              <div className="account-card__head">
                <Package size={16} color="var(--text-tertiary)" /><span>Recent orders</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-serif)' }}>{myOrders.length}</span>
              </div>
              {myOrders.length === 0 ? (
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                  No orders yet. <Link to="/" style={{ color: 'var(--accent)' }}>Browse the boutiques</Link>.
                </p>
              ) : (
                <>
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
                  <Link to="/orders" className="btn btn-outline btn-sm" style={{ marginTop: 12, alignSelf: 'flex-start' }}>All orders</Link>
                </>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="account-card">
            <div style={{ display: 'flex', gap: 2, marginBottom: 22, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPanel(tab.id)}
                  aria-pressed={panel === tab.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 12px', background: 'none', border: 'none',
                    borderBottom: `2px solid ${panel === tab.id ? 'var(--text-primary)' : 'transparent'}`,
                    color: panel === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontWeight: panel === tab.id ? 600 : 400,
                    fontFamily: 'var(--font-sans)', fontSize: 'var(--text-body)',
                    cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
                  }}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {panel === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="Display name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+977 98…" hint="Used for delivery updates." />
                <Input label="Email" value={user.email} readOnly hint={provider === 'google' ? 'Managed by your Google account.' : 'Contact us to change your email.'} />
                <Button variant="primary" isLoading={busy} onClick={saveProfile} style={{ alignSelf: 'flex-start' }}>Save changes</Button>
              </div>
            )}

            {panel === 'addresses' && (
              <div>
                {addresses.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
                    {addresses.map(a => (
                      <div key={a.id} className="account-row" style={{ alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-body)', fontWeight: 600 }}>
                            {a.label}
                            {a.isDefault && <Star size={11} fill="var(--accent)" color="var(--accent)" />}
                          </div>
                          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {a.fullName} · {a.phone}<br />{a.address}, {a.city}{a.province ? `, ${a.province}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => startEdit(a)} className="btn btn-ghost btn-sm">Edit</button>
                          <button onClick={() => void removeAddress(a.id)} className="btn btn-ghost btn-sm" aria-label={`Remove ${a.label}`}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!editing ? (
                  <Button variant="outline" onClick={() => startEdit()} style={{ alignSelf: 'flex-start' }}>
                    <Plus size={14} /> Add an address
                  </Button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <Input label="Label" value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} placeholder="Home, Office…" />
                    <Input label="Full name" value={draft.fullName} onChange={e => setDraft({ ...draft, fullName: e.target.value })} />
                    <Input label="Phone" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} placeholder="+977 98…" />
                    <Input label="Street address" value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input label="City" value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })} />
                      <Input label="Province" value={draft.province} onChange={e => setDraft({ ...draft, province: e.target.value })} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={draft.isDefault} onChange={e => setDraft({ ...draft, isDefault: e.target.checked })} />
                      Use as my default address
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="primary" isLoading={busy} onClick={submitAddress}>
                        {editing.id ? 'Save address' : 'Add address'}
                      </Button>
                      <Button variant="ghost" onClick={() => { setEditing(null); setDraft(emptyAddress); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {panel === 'messages' && (
              <ConversationView
                conversations={conversations}
                meId={user.id}
                titleOf={c => c.storeName || 'Boutique'}
                emptyHint="Message a boutique from its page and the conversation will appear here."
              />
            )}

            {panel === 'password' && (
              provider !== 'email' ? (
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                  You signed in with Google, so there is no Clothza password to change — your access is managed by Google.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Input label="New password" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" hint="At least 6 characters." autoComplete="new-password" />
                  <Input label="Repeat new password" type="password" value={pass2} onChange={e => setPass2(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                  <Button variant="primary" isLoading={busy} onClick={savePassword} style={{ alignSelf: 'flex-start' }}>Update password</Button>
                </div>
              )
            )}

            {panel === 'danger' && (
              <div>
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 16 }}>
                  Deleting your account removes your profile, saved addresses, favourites and reviews. Orders you have placed stay with the boutique, as their records.
                </p>
                {myStore && (
                  <p style={{ fontSize: 'var(--text-caption)', color: 'var(--warning)', marginBottom: 16 }}>
                    You own <strong>{myStore.name}</strong>. Close any open orders first, or deletion will be refused.
                  </p>
                )}
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete my account
                </Button>
              </div>
            )}

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
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

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={removeAccount}
        title="Delete your account?"
        message="This cannot be undone. Your profile, addresses, favourites and reviews will be removed."
        confirmLabel="Delete account"
        variant="danger"
      />
    </PageTransition>
  );
}
