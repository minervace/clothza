// ============================================================
// pages/CheckoutPage.tsx — Clothza v4.0
// 3-step checkout: cart review → delivery → payment
// Coupon validation, eSewa/Khalti payment methods
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, MapPin, CreditCard, CheckCircle2, Tag, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition } from '@/components/layout/PageTransition';
import { PriceTag } from '@/components/commerce/PriceTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/lib/toast';
import { formatPrice, calcOrderTotal } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import { optimizeImageUrl } from '@/lib/formatters';
import { NP_PROVINCES } from '@/lib/constants';
import type { PaymentMethod, DeliveryAddress } from '@/context/MarketplaceContext';

// ── Zod schema ────────────────────────────────────────────────
const deliverySchema = z.object({
  fullName:  z.string().min(2, 'Full name is required'),
  phone:     z.string().min(10, 'Valid phone number is required'),
  address:   z.string().min(5, 'Street address is required'),
  city:      z.string().min(2, 'City is required'),
  province:  z.string().min(1, 'Province is required'),
});
type DeliveryForm = z.infer<typeof deliverySchema>;

// ── Steps ─────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: 'Cart',     icon: ShoppingCart },
  { id: 2, label: 'Delivery', icon: MapPin       },
  { id: 3, label: 'Payment',  icon: CreditCard   },
];

const PAYMENT_METHODS: Array<{ id: PaymentMethod; name: string; desc: string }> = [
  { id: 'esewa',   name: 'eSewa',   desc: 'Pay with your eSewa wallet'   },
  { id: 'khalti',  name: 'Khalti',  desc: 'Pay with your Khalti account' },
  { id: 'fonepay', name: 'FonePay', desc: 'Scan QR with any bank app'    },
  { id: 'card',    name: 'Card',    desc: 'Visa, Mastercard, Amex'        },
];

export default function CheckoutPage() {
  const navigate    = useNavigate();
  const {
    state, getProduct, cartSubtotal,
    placeOrder, applyCouponCode,
  } = useMarketplace();
  const { cart } = state;

  const [step,          setStep]          = useState<Step>(1);
  const [payment,       setPayment]       = useState<PaymentMethod>('esewa');
  const [couponInput,   setCouponInput]   = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [placingOrder,  setPlacingOrder]  = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema),
  });

  const storeId = cart.length > 0
    ? (getProduct(cart[0]!.productId)?.storeId ?? '')
    : '';

  const discount = appliedCoupon?.discount ?? 0;
  const { deliveryFee, total } = calcOrderTotal(cartSubtotal, discount);

  // Apply coupon
  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const result = applyCouponCode(couponInput.trim().toUpperCase(), storeId, cartSubtotal);
    if (result) {
      setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discount: result.discount });
      toast.success(`Coupon applied! You save ${formatPrice(result.discount)}`);
      haptic.success();
    } else {
      toast.error('Invalid or expired coupon code.');
      haptic.error();
    }
    setCouponInput('');
  };

  const handlePlaceOrder = async (data: DeliveryForm) => {
    setPlacingOrder(true);
    await new Promise(r => setTimeout(r, 1200)); // Simulate payment processing
    const order = placeOrder(
      cart,
      data as DeliveryAddress,
      payment,
      appliedCoupon?.code
    );
    toast.success(`Order placed! Tracking: ${order.trackingId}`);
    haptic.success();
    navigate('/orders');
    setPlacingOrder(false);
  };

  if (cart.length === 0) {
    return (
      <PageTransition>
        <div style={{ paddingTop: 120, paddingBottom: 80 }} className="container">
          <EmptyState
            icon="ShoppingCart"
            title="Your cart is empty"
            description="Add some beautiful pieces before checking out."
            cta="Browse Collections"
            ctaLink="/"
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container" style={{ paddingTop: 100, paddingBottom: 80, maxWidth: 960 }}>
        {/* Heading */}
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 40, letterSpacing: '-0.02em' }}>
          Checkout
        </h1>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48, gap: 0 }}>
          {STEPS.map((s, i) => {
            const Icon     = s.icon;
            const isActive = step === s.id;
            const isDone   = step > s.id;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--bg-secondary)',
                    border: `2px solid ${isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDone || isActive ? '#fff' : 'var(--text-tertiary)',
                    transition: 'all var(--dur-normal) var(--spring)',
                  }}>
                    {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                  </div>
                  <span style={{ fontSize: 'var(--text-body)', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > s.id ? 'var(--success)' : 'var(--border)', margin: '0 16px', transition: 'background var(--dur-normal) var(--spring)' }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>
          {/* Main panel */}
          <div>
            <AnimatePresence mode="wait">
              {/* Step 1: Cart review */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
                    Review Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {cart.map(item => {
                      const product = getProduct(item.productId);
                      if (!product) return null;
                      return (
                        <div key={`${item.productId}-${item.size}-${item.color}`} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ width: 70, height: 88, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                            <img src={optimizeImageUrl(product.images[0] ?? '', 140, 176)} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 'var(--leading-snug)' }}>{product.name}</div>
                            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginTop: 4 }}>{item.size} · {item.color} · Qty {item.quantity}</div>
                            <div style={{ marginTop: 8 }}>
                              <PriceTag price={product.price * item.quantity} size="sm" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="accent" size="lg" onClick={() => setStep(2)} style={{ marginTop: 28, width: '100%' }}>
                    Continue to Delivery →
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Delivery */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
                    Delivery Details
                  </h2>
                  <form onSubmit={handleSubmit(() => setStep(3))} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Input label="Full Name" placeholder="Aarav Sharma" error={errors.fullName?.message} {...register('fullName')} required />
                      <Input label="Phone Number" placeholder="98XXXXXXXX" error={errors.phone?.message} {...register('phone')} required />
                    </div>
                    <Input label="Street Address" placeholder="123 Thamel Street" error={errors.address?.message} {...register('address')} required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Input label="City" placeholder="Kathmandu" error={errors.city?.message} {...register('city')} required />
                      <Select
                        label="Province"
                        options={NP_PROVINCES.map(p => ({ value: p, label: p }))}
                        placeholder="Select province"
                        error={errors.province?.message}
                        {...register('province')}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <Button variant="ghost" onClick={() => setStep(1)} type="button">← Back</Button>
                      <Button variant="accent" size="lg" type="submit" style={{ flex: 1 }}>Continue to Payment →</Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
                    Payment Method
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {PAYMENT_METHODS.map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setPayment(pm.id)}
                        aria-pressed={payment === pm.id}
                        style={{
                          display:      'flex',
                          alignItems:   'center',
                          justifyContent: 'space-between',
                          padding:      '14px 16px',
                          borderRadius: 'var(--radius-lg)',
                          border:       `1.5px solid ${payment === pm.id ? 'var(--accent)' : 'var(--border)'}`,
                          background:   payment === pm.id ? 'var(--accent-light)' : 'var(--bg-card)',
                          cursor:       'pointer',
                          textAlign:    'left',
                          transition:   'all var(--dur-fast) var(--spring)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-body)', color: payment === pm.id ? 'var(--accent)' : 'var(--text-primary)' }}>{pm.name}</div>
                          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{pm.desc}</div>
                        </div>
                        {payment === pm.id && <CheckCircle2 size={18} color="var(--accent)" />}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                    <Button variant="ghost" onClick={() => setStep(2)} type="button">← Back</Button>
                    <Button
                      variant="accent"
                      size="lg"
                      isLoading={placingOrder}
                      onClick={handleSubmit(handlePlaceOrder)}
                      style={{ flex: 1 }}
                    >
                      Place Order — {formatPrice(total)}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order summary sidebar */}
          <div style={{ position: 'sticky', top: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 'var(--text-subtitle)', color: 'var(--text-primary)' }}>
              Order Summary
            </h3>

            {/* Coupon */}
            <div>
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--success)', fontWeight: 700 }}>
                    <Tag size={13} /> {appliedCoupon.code} — {formatPrice(appliedCoupon.discount)} off
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: 2 }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="COUPON CODE"
                    className="input-base"
                    style={{ flex: 1, fontSize: 'var(--text-caption)', letterSpacing: 'var(--tracking-wider)' }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                    aria-label="Coupon code"
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyCoupon}>Apply</Button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span><span>{formatPrice(cartSubtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body)', color: 'var(--success)' }}>
                  <span>Discount</span><span>− {formatPrice(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? <span style={{ color: 'var(--success)' }}>Free</span> : formatPrice(deliveryFee)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 'var(--text-subtitle)', color: 'var(--text-primary)' }}>
                <span>Total</span>
                <span style={{ fontFamily: 'var(--font-serif)' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
