// ============================================================
// pages/OrdersPage.tsx — Clothza v4.0
// Customer order history: status timeline, tracking,
// delivery details, item breakdown, reorder action
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, RotateCcw,
  MapPin, CreditCard, Clock, CheckCircle2,
  Truck, Box, XCircle,
} from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition, SectionReveal } from '@/components/layout/PageTransition';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { toast } from '@/lib/toast';
import { formatPrice, formatDate } from '@/lib/formatters';
import { optimizeImageUrl } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import type { Order, OrderStatus } from '@/context/MarketplaceContext';

// ── Status timeline steps ─────────────────────────────────────
const STATUS_STEPS: Array<{ key: OrderStatus; label: string; icon: typeof Clock }> = [
  { key: 'pending',    label: 'Order Placed',  icon: Clock        },
  { key: 'processing', label: 'Processing',    icon: Box          },
  { key: 'shipped',    label: 'Shipped',       icon: Truck        },
  { key: 'delivered',  label: 'Delivered',     icon: CheckCircle2 },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending:    0,
  processing: 1,
  shipped:    2,
  delivered:  3,
  cancelled:  -1,
};

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 'var(--text-body)', fontWeight: 600 }}>
        <XCircle size={16} /> Order Cancelled
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STATUS_STEPS.map((step, i) => {
        const Icon      = step.icon;
        const isReached = i <= currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <motion.div
                initial={false}
                animate={{
                  background:   isReached ? (isCurrent ? 'var(--accent)' : 'var(--success)') : 'var(--bg-secondary)',
                  borderColor:  isReached ? (isCurrent ? 'var(--accent)' : 'var(--success)') : 'var(--border)',
                }}
                style={{
                  width:        32,
                  height:       32,
                  borderRadius: '50%',
                  border:       '2px solid',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  flexShrink:   0,
                }}
              >
                <Icon size={14} color={isReached ? '#fff' : 'var(--text-tertiary)'} />
              </motion.div>
              <span style={{
                fontSize:   10,
                fontWeight: isCurrent ? 700 : 500,
                color:      isCurrent ? 'var(--text-primary)' : isReached ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                whiteSpace: 'nowrap',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase',
              }}>
                {step.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <motion.div
                initial={false}
                animate={{ background: i < currentIdx ? 'var(--success)' : 'var(--border)' }}
                style={{ flex: 1, height: 2, marginBottom: 22, marginLeft: 4, marginRight: 4 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const { getProduct, addToCart } = useMarketplace();
  const [expanded, setExpanded] = useState(false);

  const handleReorder = () => {
    let added = 0;
    order.items.forEach(item => {
      const product = getProduct(item.productId);
      if (product) {
        const variant = product.variants.find(
          v => v.size === item.size && v.color === item.color && v.stock > 0
        );
        if (variant) {
          addToCart(item.productId, item.size, item.color, item.quantity);
          added++;
        }
      }
    });
    if (added > 0) {
      toast.success(`${added} item${added > 1 ? 's' : ''} added to cart!`);
      haptic.success();
    } else {
      toast.warning('Some items are out of stock.');
      haptic.warning();
    }
  };

  return (
    <motion.div
      layout
      style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow:     'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 'var(--tracking-widest)' }}>
                #{order.trackingId}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--text-subtitle)', color: 'var(--text-primary)' }}>
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginTop: 4 }}>
              <Clock size={11} /> Placed {formatDate(order.createdAt)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {formatPrice(order.total)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {order.status !== 'cancelled' && (
                <button
                  onClick={handleReorder}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RotateCcw size={13} /> Reorder
                </button>
              )}
              <button
                onClick={() => setExpanded(v => !v)}
                className="btn btn-ghost btn-sm"
                aria-expanded={expanded}
                aria-label={expanded ? 'Collapse order details' : 'Expand order details'}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expanded ? 'Less' : 'Details'}
              </button>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div style={{ marginTop: 28 }}>
          <OrderTimeline status={order.status} />
        </div>

        {/* Item thumbnail strip */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {order.items.slice(0, 5).map((item, i) => {
            const product = getProduct(item.productId);
            return product ? (
              <div key={i} style={{ position: 'relative' }}>
                <Link to={`/product/${product.id}`}>
                  <img
                    src={optimizeImageUrl(product.images[0] ?? '', 80, 100)}
                    alt={product.name}
                    width={48}
                    height={60}
                    loading="lazy"
                    style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)', display: 'block' }}
                  />
                </Link>
                {item.quantity > 1 && (
                  <span style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.quantity}
                  </span>
                )}
              </div>
            ) : null;
          })}
          {order.items.length > 5 && (
            <div style={{ width: 48, height: 60, borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-tertiary)' }}>
              +{order.items.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid var(--border)', padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {/* Items breakdown */}
              <div>
                <h3 style={{ fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)', marginBottom: 14 }}>
                  Items
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {order.items.map((item, i) => {
                    const product = getProduct(item.productId);
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {product && (
                          <Link to={`/product/${product.id}`}>
                            <img
                              src={optimizeImageUrl(product.images[0] ?? '', 80, 100)}
                              alt={product.name}
                              width={44}
                              height={55}
                              loading="lazy"
                              style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border)', display: 'block', flexShrink: 0 }}
                            />
                          </Link>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }} className="line-clamp-2">
                            {product?.name ?? 'Product'}
                          </div>
                          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {item.size} · {item.color} · Qty {item.quantity}
                          </div>
                          {product && (
                            <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {formatPrice(product.price * item.quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery + payment info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                    Delivery Address
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <MapPin size={14} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.deliveryAddress.fullName}</div>
                      <div>{order.deliveryAddress.address}</div>
                      <div>{order.deliveryAddress.city}, {order.deliveryAddress.province}</div>
                      <div>{order.deliveryAddress.phone}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                    Payment
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CreditCard size={14} color="var(--text-tertiary)" />
                    <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                    </span>
                    <span style={{ fontSize: 'var(--text-caption)', color: order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)', fontWeight: 600, background: order.paymentStatus === 'paid' ? 'var(--success-light)' : 'var(--warning-light)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Price breakdown */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)', color: 'var(--success)', marginBottom: 6 }}>
                      <span>Discount</span>
                      <span>− {formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                    <span>Delivery</span>
                    <span>{order.deliveryFee === 0 ? <span style={{ color: 'var(--success)' }}>Free</span> : formatPrice(order.deliveryFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 'var(--text-body)', color: 'var(--text-primary)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <span>Total</span>
                    <span style={{ fontFamily: 'var(--font-serif)' }}>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function OrdersPage() {
  const { state, getUserOrders } = useMarketplace();
  const { currentUser } = state;

  const userOrders = currentUser ? getUserOrders(currentUser.id) : [];
  const sorted     = [...userOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!currentUser) {
    return (
      <PageTransition>
        <div style={{ paddingTop: 120, paddingBottom: 80 }} className="container">
          <EmptyState
            icon="Package"
            title="Sign in to view your orders"
            description="Your order history will appear here after signing in."
            cta="Sign In"
            ctaLink="/signin"
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div style={{ paddingTop: 100, paddingBottom: 80, maxWidth: 900, margin: '0 auto', padding: '100px var(--space-6) 80px' }} className="container">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Your Orders
          </h1>
          {sorted.length > 0 && (
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
              {sorted.length} order{sorted.length > 1 ? 's' : ''} · {sorted.filter(o => o.status === 'delivered').length} delivered
            </p>
          )}
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon="Package"
            title="No orders yet"
            description="Once you place an order, you can track it here in real time."
            cta="Start Shopping"
            ctaLink="/"
          />
        ) : (
          <SectionReveal>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sorted.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </SectionReveal>
        )}
      </div>
    </PageTransition>
  );
}
