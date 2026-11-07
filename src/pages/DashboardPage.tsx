// ============================================================
// pages/DashboardPage.tsx — Clothza v4.0
// Seller dashboard: stats, products CRUD (add/edit modal),
// orders management with status update, messages, coupon CRUD
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ShoppingBag, MessageCircle,
  Tag, BarChart2, Plus, Pencil, Trash2,
  DollarSign, Star, Check,
  ChevronDown,
} from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderStatusBadge, TierBadge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/lib/toast';
import { formatPrice, formatDate, formatRating } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import { optimizeImageUrl } from '@/lib/formatters';
import type { Product, OrderStatus } from '@/context/MarketplaceContext';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

type DashTab = 'overview' | 'products' | 'orders' | 'messages' | 'coupons';

const TABS: Array<{ id: DashTab; label: string; icon: typeof Package }> = [
  { id: 'overview',  label: 'Overview',  icon: BarChart2     },
  { id: 'products',  label: 'Products',  icon: Package       },
  { id: 'orders',    label: 'Orders',    icon: ShoppingBag   },
  { id: 'messages',  label: 'Messages',  icon: MessageCircle },
  { id: 'coupons',   label: 'Coupons',   icon: Tag           },
];

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// ── Product Form Modal ────────────────────────────────────────

interface ProductFormState {
  name:         string;
  description:  string;
  price:        string;
  compareAt:    string;
  category:     string;
  tags:         string;   // comma-separated
  images:       string;   // newline-separated URLs
  isBestSeller: boolean;
  isTrending:   boolean;
  isSponsored:  boolean;
}

const emptyProductForm = (): ProductFormState => ({
  name:         '',
  description:  '',
  price:        '',
  compareAt:    '',
  category:     'Women',
  tags:         '',
  images:       '',
  isBestSeller: false,
  isTrending:   false,
  isSponsored:  false,
});

function productToForm(p: Product): ProductFormState {
  return {
    name:         p.name,
    description:  p.description,
    price:        String(p.price),
    compareAt:    p.compareAtPrice ? String(p.compareAtPrice) : '',
    category:     p.category,
    tags:         p.tags.join(', '),
    images:       p.images.join('\n'),
    isBestSeller: p.isBestSeller ?? false,
    isTrending:   p.isTrending   ?? false,
    isSponsored:  p.isSponsored  ?? false,
  };
}

interface ProductModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  storeId:   string;
  editProduct?: Product;
}

function ProductModal({ isOpen, onClose, storeId, editProduct }: ProductModalProps) {
  const { addProduct, updateProduct } = useMarketplace();
  const isEdit = Boolean(editProduct);

  const [form, setForm] = useState<ProductFormState>(() =>
    editProduct ? productToForm(editProduct) : emptyProductForm()
  );
  const [saving, setSaving] = useState(false);

  const set = (field: keyof ProductFormState, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const validate = (): string | null => {
    if (!form.name.trim())        return 'Product name is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      return 'A valid price is required.';
    if (!form.images.trim())      return 'At least one image URL is required.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSaving(true);
    await new Promise(r => setTimeout(r, 400)); // simulate async

    const imageList  = form.images.split('\n').map(u => u.trim()).filter(Boolean);
    const tagList    = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (isEdit && editProduct) {
      updateProduct({
        id:             editProduct.id,
        name:           form.name.trim(),
        description:    form.description.trim(),
        price:          Number(form.price),
        compareAtPrice: form.compareAt ? Number(form.compareAt) : undefined,
        category:       form.category as Product['category'],
        tags:           tagList,
        images:         imageList,
        isBestSeller:   form.isBestSeller,
        isTrending:     form.isTrending,
        isSponsored:    form.isSponsored,
      });
      toast.success('Product updated!');
    } else {
      addProduct({
        storeId,
        name:           form.name.trim(),
        description:    form.description.trim(),
        price:          Number(form.price),
        compareAtPrice: form.compareAt ? Number(form.compareAt) : undefined,
        category:       form.category as Product['category'],
        tags:           tagList,
        images:         imageList,
        variants:       [{ size: 'M', color: 'Default', stock: 10 }],
        isBestSeller:   form.isBestSeller,
        isTrending:     form.isTrending,
        isSponsored:    form.isSponsored,
        rating:         0,
        reviewCount:    0,
        views:          0,
        clicks:         0,
      });
      toast.success('Product added!');
    }

    haptic.success();
    setSaving(false);
    onClose();
  };

  const inputStyle: React.CSSProperties = { marginBottom: 16 };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add New Product'}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <Button variant="accent" isLoading={saving} onClick={handleSubmit} leftIcon={<Check size={14} />}>
            {isEdit ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Input
            label="Product Name *"
            placeholder="e.g. Cashmere Turtleneck"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            containerClassName="mb-4"
            style={inputStyle}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Description *
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe the product, materials, fit…"
            rows={3}
            style={{
              width:        '100%',
              padding:      '10px 12px',
              borderRadius: 'var(--radius-md)',
              border:       '1px solid var(--border)',
              background:   'var(--bg-secondary)',
              color:        'var(--text-primary)',
              fontFamily:   'var(--font-sans)',
              fontSize:     'var(--text-body)',
              lineHeight:   'var(--leading-relaxed)',
              resize:       'vertical',
              outline:      'none',
              marginBottom: 16,
              boxSizing:    'border-box',
            }}
          />
        </div>

        <Input
          label="Price (NPR) *"
          type="number"
          placeholder="e.g. 12500"
          value={form.price}
          onChange={e => set('price', e.target.value)}
          style={inputStyle}
        />
        <Input
          label="Compare-at Price (NPR)"
          type="number"
          placeholder="e.g. 15000"
          value={form.compareAt}
          onChange={e => set('compareAt', e.target.value)}
          style={inputStyle}
        />

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Category
          </label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            style={{
              width:        '100%',
              padding:      '10px 12px',
              borderRadius: 'var(--radius-md)',
              border:       '1px solid var(--border)',
              background:   'var(--bg-secondary)',
              color:        'var(--text-primary)',
              fontFamily:   'var(--font-sans)',
              fontSize:     'var(--text-body)',
              outline:      'none',
              cursor:       'pointer',
              marginBottom: 16,
            }}
          >
            {PRODUCT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <Input
          label="Tags (comma-separated)"
          placeholder="e.g. wool, winter, minimalist"
          value={form.tags}
          onChange={e => set('tags', e.target.value)}
          style={inputStyle}
        />

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Image URLs (one per line) *
          </label>
          <textarea
            value={form.images}
            onChange={e => set('images', e.target.value)}
            placeholder="https://images.unsplash.com/…"
            rows={3}
            style={{
              width:        '100%',
              padding:      '10px 12px',
              borderRadius: 'var(--radius-md)',
              border:       '1px solid var(--border)',
              background:   'var(--bg-secondary)',
              color:        'var(--text-primary)',
              fontFamily:   'monospace',
              fontSize:     'var(--text-caption)',
              resize:       'vertical',
              outline:      'none',
              marginBottom: 16,
              boxSizing:    'border-box',
            }}
          />
        </div>

        {/* Toggles */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {(
            [
              { key: 'isBestSeller', label: '🏆 Best Seller' },
              { key: 'isTrending',   label: '🔥 Trending'    },
              { key: 'isSponsored',  label: '⭐ Sponsored'   },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontSize: 'var(--text-body)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={form[key] as boolean}
                onChange={e => set(key, e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── Coupon Form Modal ─────────────────────────────────────────

interface CouponFormState {
  code:          string;
  discountType:  'percentage' | 'fixed';
  discountValue: string;
  minOrder:      string;
  maxUses:       string;
}

const emptyCouponForm = (): CouponFormState => ({
  code:          '',
  discountType:  'percentage',
  discountValue: '',
  minOrder:      '0',
  maxUses:       '100',
});

interface CouponModalProps {
  isOpen:  boolean;
  onClose: () => void;
  storeId: string;
}

function CouponModal({ isOpen, onClose, storeId }: CouponModalProps) {
  const { addCoupon } = useMarketplace();
  const [form,   setForm]   = useState<CouponFormState>(emptyCouponForm);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof CouponFormState, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.code.trim()) { toast.error('Coupon code is required.'); return; }
    if (!form.discountValue || Number(form.discountValue) <= 0) { toast.error('Discount value must be positive.'); return; }
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) { toast.error('Percentage cannot exceed 100.'); return; }

    setSaving(true);
    await new Promise(r => setTimeout(r, 350));

    addCoupon({
      storeId,
      code:           form.code.toUpperCase().trim(),
      discountType:   form.discountType,
      discountValue:  Number(form.discountValue),
      minOrderAmount: Number(form.minOrder) || 0,
      maxUses:        Number(form.maxUses)  || 100,
      isActive:       true,
    });

    toast.success(`Coupon ${form.code.toUpperCase()} created!`);
    haptic.success();
    setSaving(false);
    setForm(emptyCouponForm());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Coupon"
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <Button variant="accent" isLoading={saving} onClick={handleSubmit} leftIcon={<Check size={14} />}>
            Create Coupon
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Coupon Code *"
          placeholder="e.g. SUMMER20"
          value={form.code}
          onChange={e => set('code', e.target.value.toUpperCase())}
          hint="Will be displayed in uppercase"
        />

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Discount Type
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['percentage', 'fixed'] as const).map(type => (
              <button
                key={type}
                onClick={() => set('discountType', type)}
                style={{
                  flex:         1,
                  padding:      '8px',
                  border:       `2px solid ${form.discountType === type ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  background:   form.discountType === type ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  color:        form.discountType === type ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight:   form.discountType === type ? 700 : 500,
                  fontSize:     'var(--text-body)',
                  fontFamily:   'var(--font-sans)',
                  cursor:       'pointer',
                  transition:   'all var(--dur-fast) var(--spring)',
                }}
              >
                {type === 'percentage' ? '% Percent' : 'रू Fixed'}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={`Discount Value ${form.discountType === 'percentage' ? '(%)' : '(NPR)'} *`}
          type="number"
          placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
          value={form.discountValue}
          onChange={e => set('discountValue', e.target.value)}
        />
        <Input
          label="Minimum Order Amount (NPR)"
          type="number"
          placeholder="0 = no minimum"
          value={form.minOrder}
          onChange={e => set('minOrder', e.target.value)}
        />
        <Input
          label="Maximum Uses"
          type="number"
          placeholder="e.g. 100"
          value={form.maxUses}
          onChange={e => set('maxUses', e.target.value)}
        />
      </div>
    </Modal>
  );
}

// ── Status Dropdown ───────────────────────────────────────────

function StatusDropdown({ orderId, current }: { orderId: string; current: OrderStatus }) {
  const { updateOrderStatus } = useMarketplace();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '5px 10px',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          background:   'var(--bg-secondary)',
          color:        'var(--text-secondary)',
          cursor:       'pointer',
          fontFamily:   'var(--font-sans)',
          fontSize:     'var(--text-caption)',
          fontWeight:   600,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <OrderStatusBadge status={current} />
        <ChevronDown size={11} style={{ flexShrink: 0 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position:     'absolute',
              top:          'calc(100% + 6px)',
              right:        0,
              zIndex:       200,
              background:   'var(--bg-card)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow:    'var(--shadow-elevated)',
              minWidth:     140,
              padding:      4,
              listStyle:    'none',
              margin:       0,
            }}
          >
            {ORDER_STATUSES.map(s => (
              <li key={s}>
                <button
                  role="option"
                  aria-selected={s === current}
                  onClick={() => { updateOrderStatus(orderId, s); setOpen(false); haptic.light(); }}
                  style={{
                    width:        '100%',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          8,
                    padding:      '7px 10px',
                    border:       'none',
                    background:   s === current ? 'var(--bg-secondary)' : 'none',
                    cursor:       'pointer',
                    borderRadius: 'var(--radius-sm)',
                    textAlign:    'left',
                  }}
                  onMouseEnter={e => { if (s !== current) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { if (s !== current) e.currentTarget.style.background = 'none'; }}
                >
                  <OrderStatusBadge status={s} />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    state, getStore, getStoreProducts, getStoreOrders,
    getStoreMessages, deleteProduct, deleteCoupon,
  } = useMarketplace();
  const { currentUser } = state;

  const [activeTab,    setActiveTab]    = useState<DashTab>('overview');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteType,   setDeleteType]   = useState<'product' | 'coupon'>('product');
  const [productModal, setProductModal] = useState(false);
  const [editTarget,   setEditTarget]   = useState<Product | undefined>(undefined);
  const [couponModal,  setCouponModal]  = useState(false);

  // Auth guard
  if (!currentUser || currentUser.role === 'customer') {
    return (
      <PageTransition>
        <div style={{ paddingTop: 120 }} className="container">
          <EmptyState
            icon="Layers"
            title="Seller access required"
            description="Sign in with a seller or admin account to access the dashboard."
            cta="Go Home"
            ctaLink="/"
          />
        </div>
      </PageTransition>
    );
  }

  const store    = currentUser.storeId ? getStore(currentUser.storeId) : undefined;
  const products = store ? getStoreProducts(store.id) : [];
  const orders   = store ? getStoreOrders(store.id)   : [];
  const messages = store ? getStoreMessages(store.id) : [];
  const coupons  = state.coupons.filter(c => c.storeId === store?.id);

  const revenue  = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  const avgRating = products.length > 0
    ? products.reduce((s, p) => s + p.rating, 0) / products.length
    : 0;

  const stats = [
    { label: 'Revenue',    value: formatPrice(revenue),    icon: DollarSign, color: 'var(--success)' },
    { label: 'Products',   value: products.length,          icon: Package,    color: 'var(--accent)'  },
    { label: 'Orders',     value: orders.length,            icon: ShoppingBag, color: 'var(--warning)' },
    { label: 'Avg Rating', value: formatRating(avgRating),  icon: Star,       color: 'var(--tier-gold)' },
  ];

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteType === 'product') {
      deleteProduct(deleteTarget);
      toast.success('Product deleted.');
    } else {
      deleteCoupon(deleteTarget);
      toast.success('Coupon deleted.');
    }
    haptic.medium();
    setDeleteTarget(null);
  };

  const openAdd = () => { setEditTarget(undefined); setProductModal(true); };
  const openEdit = (p: Product) => { setEditTarget(p); setProductModal(true); };

  return (
    <PageTransition>
      <div style={{ paddingTop: 80, display: 'flex', minHeight: '100vh' }}>
        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside
          style={{
            width:      240,
            borderRight: '1px solid var(--border)',
            background:  'var(--bg-card)',
            padding:     '32px 12px',
            flexShrink:  0,
            position:    'sticky',
            top:         80,
            height:      'calc(100vh - 80px)',
            overflowY:   'auto',
          }}
        >
          {store && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 28 }}>
              <img
                src={optimizeImageUrl(store.logo, 80, 80)}
                alt={store.name}
                width={36}
                height={36}
                style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 1.2 }}>{store.name}</div>
                <TierBadge tier={store.subscriptionTier} showEmoji={false} />
              </div>
            </div>
          )}
          <nav aria-label="Dashboard navigation">
            {TABS.map(tab => {
              const Icon     = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                    width:        '100%',
                    padding:      '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border:       'none',
                    cursor:       'pointer',
                    background:   isActive ? 'var(--accent-light)' : 'transparent',
                    color:        isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight:   isActive ? 700 : 500,
                    fontSize:     'var(--text-body)',
                    fontFamily:   'var(--font-sans)',
                    marginBottom: 4,
                    transition:   'all var(--dur-fast) var(--spring)',
                    textAlign:    'left',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ──────────────────────────────────── */}
        <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 32, letterSpacing: '-0.02em' }}>
                Dashboard
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.4 }}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)' }}>{stat.label}</span>
                        <Icon size={18} color={stat.color} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{stat.value}</div>
                    </motion.div>
                  );
                })}
              </div>

              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Recent Orders</h2>
              {orders.length === 0 ? (
                <EmptyState icon="ShoppingBag" title="No orders yet" compact />
              ) : (
                <div className="admin-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Tracking ID', 'Customer', 'Date', 'Total', 'Status', 'Update'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 'var(--text-overline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>{o.trackingId}</td>
                          <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{o.deliveryAddress.fullName}</td>
                          <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{formatDate(o.createdAt)}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{formatPrice(o.total)}</td>
                          <td style={{ padding: '12px 14px' }}><OrderStatusBadge status={o.status} /></td>
                          <td style={{ padding: '12px 14px' }}><StatusDropdown orderId={o.id} current={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Products */}
          {activeTab === 'products' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Products</h1>
                <Button variant="accent" leftIcon={<Plus size={15} />} onClick={openAdd}>
                  Add Product
                </Button>
              </div>
              {products.length === 0 ? (
                <EmptyState icon="Package" title="No products yet" description="Add your first product to get started." cta="Add Product" onCtaClick={openAdd} />
              ) : (
                <div className="admin-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 'var(--text-overline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img src={optimizeImageUrl(p.images[0] ?? '', 80, 100)} alt={p.name} width={40} height={50} style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)' }} loading="lazy" />
                                <span style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--text-primary)', maxWidth: 180 }} className="line-clamp-2">{p.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>{p.category}</td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{formatPrice(p.price)}</td>
                            <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: totalStock <= 5 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{totalStock}</td>
                            <td style={{ padding: '12px 14px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', fontWeight: 600 }}>⭐ {formatRating(p.rating)}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => openEdit(p)}
                                  aria-label={`Edit ${p.name}`}
                                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '5px 8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'all var(--dur-fast) var(--spring)' }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => { setDeleteTarget(p.id); setDeleteType('product'); }}
                                  aria-label={`Delete ${p.name}`}
                                  style={{ background: 'none', border: '1px solid var(--danger-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '5px 8px', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 28, letterSpacing: '-0.02em' }}>Orders</h1>
              {orders.length === 0 ? (
                <EmptyState icon="ShoppingBag" title="No orders yet" compact />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {orders.map(o => (
                    <motion.div
                      key={o.id}
                      layout
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{o.trackingId}</div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)', marginTop: 4 }}>
                          {o.deliveryAddress.fullName} — {o.deliveryAddress.city}
                        </div>
                        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {o.items.length} items · {o.paymentMethod.toUpperCase()} · {formatDate(o.createdAt)}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 'var(--text-subtitle)', color: 'var(--text-primary)' }}>{formatPrice(o.total)}</div>
                      <StatusDropdown orderId={o.id} current={o.status} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {activeTab === 'messages' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 28, letterSpacing: '-0.02em' }}>Messages</h1>
              {messages.length === 0 ? (
                <EmptyState icon="MessageCircle" title="No messages" description="Customer messages will appear here." compact />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {msg.customerName.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{msg.customerName}</span>
                          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{formatDate(msg.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Coupons */}
          {activeTab === 'coupons' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Coupons</h1>
                <Button variant="accent" leftIcon={<Plus size={15} />} onClick={() => setCouponModal(true)}>
                  New Coupon
                </Button>
              </div>
              {coupons.length === 0 ? (
                <EmptyState icon="Inbox" title="No coupons yet" description="Create discount coupons to boost sales." cta="Create Coupon" onCtaClick={() => setCouponModal(true)} compact />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {coupons.map(c => (
                    <motion.div layout key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '8px 14px', fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--text-subtitle)', color: 'var(--text-primary)', letterSpacing: 'var(--tracking-wider)' }}>{c.code}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {c.discountType === 'percentage' ? `${c.discountValue}% off` : `${formatPrice(c.discountValue)} off`}
                        </div>
                        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                          Min order: {formatPrice(c.minOrderAmount)} · {c.usageCount}/{c.maxUses} used
                        </div>
                      </div>
                      <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: c.isActive ? 'var(--success)' : 'var(--text-tertiary)', background: c.isActive ? 'var(--success-light)' : 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => { setDeleteTarget(c.id); setDeleteType('coupon'); }}
                        aria-label={`Delete coupon ${c.code}`}
                        style={{ background: 'none', border: '1px solid var(--danger-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '6px 10px', color: 'var(--danger)', display: 'flex' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      {store && (
        <>
          <ProductModal
            isOpen={productModal}
            onClose={() => setProductModal(false)}
            storeId={store.id}
            editProduct={editTarget}
          />
          <CouponModal
            isOpen={couponModal}
            onClose={() => setCouponModal(false)}
            storeId={store.id}
          />
        </>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete this ${deleteType}?`}
        message={`This action cannot be undone. The ${deleteType} will be permanently removed.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageTransition>
  );
}
