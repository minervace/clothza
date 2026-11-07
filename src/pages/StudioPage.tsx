// ============================================================
// pages/StudioPage.tsx — Clothza v4.0
// AI Style Studio: drag-and-drop lookbook builder
// Mix & match products, save to lookbook, swappable slots
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, X, Save, Shuffle, BookOpen } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/lib/toast';
import { optimizeImageUrl, formatPrice } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import { sanitizeInput } from '@/lib/sanitize';
import type { Product } from '@/context/MarketplaceContext';

interface StudioSlot {
  product:      Product;
  selectedSize: string;
  selectedColor: string;
}

export default function StudioPage() {
  const { state, addLookbook, addToCart } = useMarketplace();
  const [slots,       setSlots]       = useState<StudioSlot[]>([]);
  const [saveOpen,    setSaveOpen]    = useState(false);
  const [lookbookName, setLookbookName] = useState('');
  const [lookbookDesc, setLookbookDesc] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');

  const allProducts = state.products;
  const filtered    = search
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : allProducts;

  const totalValue  = slots.reduce((sum, s) => sum + s.product.price, 0);
  const isInStudio  = (id: string) => slots.some(s => s.product.id === id);

  const addToStudio = (product: Product) => {
    if (isInStudio(product.id)) return;
    if (slots.length >= 6) {
      toast.warning('Maximum 6 pieces per lookbook.');
      haptic.warning();
      return;
    }
    const firstVariant = product.variants.find(v => v.stock > 0);
    setSlots(prev => [...prev, {
      product,
      selectedSize:  firstVariant?.size  ?? '',
      selectedColor: firstVariant?.color ?? '',
    }]);
    haptic.light();
  };

  const removeFromStudio = (id: string) => {
    setSlots(prev => prev.filter(s => s.product.id !== id));
    haptic.light();
  };

  const shuffleStudio = () => {
    const pool    = allProducts.filter(p => !isInStudio(p.id));
    const needed  = Math.min(3, pool.length);
    const sample  = pool.sort(() => Math.random() - 0.5).slice(0, needed);
    sample.forEach(p => addToStudio(p));
    haptic.medium();
    toast.info('Studio shuffled!');
  };

  const addAllToCart = () => {
    if (slots.length === 0) return;
    slots.forEach(s => {
      if (s.selectedSize && s.selectedColor) {
        addToCart(s.product.id, s.selectedSize, s.selectedColor, 1);
      }
    });
    toast.success(`${slots.length} pieces added to cart!`);
    haptic.success();
  };

  const handleSaveLookbook = async () => {
    if (!lookbookName.trim() || slots.length === 0) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    addLookbook({
      storeId:     slots[0]!.product.storeId,
      creatorName: state.currentUser?.name ?? 'Anonymous Stylist',
      name:        sanitizeInput(lookbookName),
      description: sanitizeInput(lookbookDesc),
      coverImage:  slots[0]?.product.images[0],
      items:       slots.map(s => ({ productId: s.product.id, selectedSize: s.selectedSize, selectedColor: s.selectedColor })),
      isOfficial:  false,
    });
    toast.success('Lookbook saved to the community!');
    haptic.success();
    setSaving(false);
    setSaveOpen(false);
    setLookbookName('');
    setLookbookDesc('');
    setSlots([]);
  };

  return (
    <PageTransition>
      {/* Header */}
      <div
        style={{
          paddingTop:    80,
          paddingBottom: 0,
          background:    'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
          borderBottom:  '1px solid var(--border)',
        }}
      >
        <div className="container" style={{ paddingTop: 28, paddingBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-light)', color: 'var(--accent)', padding: '5px 12px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-overline)', fontWeight: 700, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', marginBottom: 12 }}>
                <Sparkles size={12} /> Style Studio
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 'var(--leading-tight)' }}>
                Build your look.
              </h1>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 'var(--leading-relaxed)' }}>
                Mix and match pieces from any boutique. Save as a lookbook or add everything to cart.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" leftIcon={<Shuffle size={15} />} onClick={shuffleStudio}>Shuffle</Button>
              {slots.length > 0 && (
                <>
                  <Button variant="outline" leftIcon={<BookOpen size={15} />} onClick={() => setSaveOpen(true)}>Save Lookbook</Button>
                  <Button variant="accent" leftIcon={<Plus size={15} />} onClick={addAllToCart}>Add All to Cart</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
          {/* Product browser */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <Input
                placeholder="Search pieces…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search products to add to studio"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {filtered.map(p => {
                const inStudio = isInStudio(p.id);
                return (
                  <motion.button
                    key={p.id}
                    onClick={() => inStudio ? removeFromStudio(p.id) : addToStudio(p)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background:   inStudio ? 'var(--accent-light)' : 'var(--bg-card)',
                      border:       `1.5px solid ${inStudio ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-xl)',
                      overflow:     'hidden',
                      cursor:       'pointer',
                      textAlign:    'left',
                      padding:      0,
                      position:     'relative',
                    }}
                    aria-pressed={inStudio}
                    aria-label={inStudio ? `Remove ${p.name} from studio` : `Add ${p.name} to studio`}
                  >
                    <div style={{ height: 200, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                      <img src={optimizeImageUrl(p.images[0] ?? '', 360, 400)} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s', }} />
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 'var(--leading-snug)' }} className="line-clamp-2">{p.name}</div>
                      <div style={{ fontSize: 'var(--text-caption)', color: inStudio ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 700 }}>{formatPrice(p.price)}</div>
                    </div>
                    {inStudio && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} color="white" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Studio canvas */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{
              background:   'var(--bg-card)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding:      'var(--space-5)',
              minHeight:    340,
              display:      'flex',
              flexDirection: 'column',
              gap:           16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-subtitle)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Your Look ({slots.length}/6)
                </h2>
                {slots.length > 0 && (
                  <button onClick={() => setSlots([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}>
                    Clear all
                  </button>
                )}
              </div>

              {slots.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '32px 16px', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border)' }}>
                  <Sparkles size={28} color="var(--text-tertiary)" strokeWidth={1.5} />
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 'var(--leading-relaxed)' }}>
                    Click any piece to add it to your look
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {slots.map((slot, i) => (
                    <motion.div
                      key={slot.product.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      style={{ display: 'flex', gap: 10, alignItems: 'center' }}
                    >
                      <div style={{ width: 52, height: 64, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                        <img src={optimizeImageUrl(slot.product.images[0] ?? '', 104, 128)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-primary)' }} className="line-clamp-2">{slot.product.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{slot.selectedSize} · {slot.selectedColor}</div>
                        <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>{formatPrice(slot.product.price)}</div>
                      </div>
                      <button onClick={() => removeFromStudio(slot.product.id)} aria-label={`Remove ${slot.product.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, flexShrink: 0 }}>
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {slots.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)', marginBottom: 12 }}>
                    <span>Total Look Value</span>
                    <span style={{ fontFamily: 'var(--font-serif)' }}>{formatPrice(totalValue)}</span>
                  </div>
                  <Button variant="accent" size="md" onClick={addAllToCart} style={{ width: '100%' }}>
                    <Plus size={15} /> Add All to Cart
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save lookbook modal */}
      <Modal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save as Lookbook"
        description="Share your style with the community."
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button variant="accent" isLoading={saving} onClick={handleSaveLookbook} disabled={!lookbookName.trim()}>
              <Save size={14} /> Save Lookbook
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Lookbook Name" placeholder="My Tokyo Evening Look" value={lookbookName} onChange={e => setLookbookName(e.target.value)} required />
          <div>
            <label htmlFor="lb-desc" className="label-base">Description</label>
            <textarea id="lb-desc" className="input-base" rows={3} placeholder="Describe the mood, occasion, or inspiration…" value={lookbookDesc} onChange={e => setLookbookDesc(e.target.value)} style={{ width: '100%', marginTop: 6, resize: 'vertical' }} />
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
