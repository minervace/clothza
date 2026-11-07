// ============================================================
// components/commerce/CartDrawer.tsx — Clothza v4.0
// Sliding cart panel with stock conflict check + swipe-to-close
// ============================================================

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, AlertTriangle } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { optimizeImageUrl, formatPrice } from '@/lib/formatters';
import { calcOrderTotal } from '@/lib/formatters';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { PriceTag } from '@/components/commerce/PriceTag';
import { haptic } from '@/lib/haptics';
import { toast } from '@/lib/toast';

interface CartDrawerProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    state,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    getProduct,
  } = useMarketplace();

  const { cart } = state;

  // Detect stock conflicts
  const stockConflicts = useMemo(() => {
    return cart.filter(item => {
      const product = getProduct(item.productId);
      const variant = product?.variants.find(
        v => v.size === item.size && v.color === item.color
      );
      return variant !== undefined && variant.stock < item.quantity;
    });
  }, [cart, getProduct]);

  const { deliveryFee, total } = calcOrderTotal(cartSubtotal);

  const handleRemove = (productId: string, size: string, color: string) => {
    removeFromCart(productId, size, color);
    haptic.light();
  };

  const handleQty = (productId: string, size: string, color: string, qty: number) => {
    if (qty < 1) return;
    const product = getProduct(productId);
    const variant = product?.variants.find(v => v.size === size && v.color === color);
    if (variant && qty > variant.stock) {
      toast.warning(`Only ${variant.stock} in stock`);
      haptic.warning();
      updateCartQuantity(productId, size, color, variant.stock);
      return;
    }
    updateCartQuantity(productId, size, color, qty);
    haptic.light();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Your Cart"
      footer={
        cart.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Order summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>{formatPrice(cartSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? <span style={{ color: 'var(--success)' }}>Free</span> : formatPrice(deliveryFee)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--text-subtitle)', color: 'var(--text-primary)' }}>
                <span>Total</span>
                <span style={{ fontFamily: 'var(--font-serif)' }}>{formatPrice(total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={onClose}
              className="btn btn-accent btn-pill btn-lg"
              style={{ textAlign: 'center', width: '100%' }}
            >
              Checkout — {formatPrice(total)}
            </Link>
          </div>
        ) : undefined
      }
    >
      {/* Stock conflict warning */}
      <AnimatePresence>
        {stockConflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background:   'var(--warning-light)',
              border:       '1px solid var(--warning)',
              borderRadius: 'var(--radius-md)',
              padding:      '12px 14px',
              marginBottom: 16,
              display:      'flex',
              gap:          10,
              alignItems:   'flex-start',
            }}
          >
            <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--warning)' }}>
                Stock adjusted
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: 3 }}>
                Some items in your cart are low in stock. Quantities have been adjusted.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart items */}
      {cart.length === 0 ? (
        <EmptyState
          icon="ShoppingCart"
          title="Your cart is empty"
          description="Time to discover something beautiful."
          cta="Browse Collections"
          ctaLink="/"
          compact
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence>
            {cart.map(item => {
              const product = getProduct(item.productId);
              if (!product) return null;

              const isConflict = stockConflicts.some(
                c => c.productId === item.productId && c.size === item.size && c.color === item.color
              );

              return (
                <motion.div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display:      'flex',
                    gap:          14,
                    padding:      '14px 0',
                    borderBottom: '1px solid var(--border)',
                    position:     'relative',
                    outline:      isConflict ? `2px solid var(--warning)` : 'none',
                    borderRadius: isConflict ? 'var(--radius-md)' : 0,
                    paddingLeft:  isConflict ? 10 : 0,
                    paddingRight: isConflict ? 10 : 0,
                  }}
                >
                  {/* Product image */}
                  <div style={{ width: 72, height: 90, borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                    <img
                      src={optimizeImageUrl(product.images[0] ?? '', 144, 180)}
                      alt={product.name}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 'var(--leading-snug)' }} className="line-clamp-2">
                      {product.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                      {item.size} · {item.color}
                    </div>
                    <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => handleQty(item.productId, item.size, item.color, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1}
                        style={{
                          width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: item.quantity <= 1 ? 0.4 : 1,
                          transition: 'background var(--dur-fast) var(--spring)',
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 'var(--text-body)', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQty(item.productId, item.size, item.color, item.quantity + 1)}
                        aria-label="Increase quantity"
                        style={{
                          width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background var(--dur-fast) var(--spring)',
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(item.productId, item.size, item.color)}
                    aria-label={`Remove ${product.name} from cart`}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-tertiary)', padding: 4, alignSelf: 'flex-start',
                      borderRadius: 'var(--radius-sm)', display: 'flex',
                      transition: 'color var(--dur-fast) var(--spring)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </Drawer>
  );
}

export default CartDrawer;
