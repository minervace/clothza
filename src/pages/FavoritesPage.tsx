// ============================================================
// pages/FavoritesPage.tsx — Clothza v4.0
// Wishlist: saved products (grid + quick add-to-cart) +
// followed stores, animated exit, empty states
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Store, X, ShoppingCart } from 'lucide-react';
import { useMarketplace } from '@/context/MarketplaceContext';
import { PageTransition, SectionReveal } from '@/components/layout/PageTransition';
import { ProductCard } from '@/components/commerce/ProductCard';
import { StoreCard } from '@/components/commerce/StoreCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';

type FavTab = 'products' | 'stores';

export default function FavoritesPage() {
  const {
    state,
    toggleFavoriteProduct,
    toggleFavoriteStore,
    addToCart,
    getProduct,
    getStore,
  } = useMarketplace();

  const [tab, setTab] = useState<FavTab>('products');

  const { favorites } = state;
  const favProducts = favorites.products.map(id => getProduct(id)).filter(Boolean);
  const favStores   = favorites.stores.map(id => getStore(id)).filter(Boolean);

  const handleRemoveProduct = (id: string) => {
    toggleFavoriteProduct(id);
    haptic.light();
    toast.info('Removed from favorites');
  };

  const handleRemoveStore = (id: string) => {
    toggleFavoriteStore(id);
    haptic.light();
    toast.info('Unfollowed store');
  };

  const handleQuickCart = (productId: string) => {
    const product = getProduct(productId);
    if (!product) return;
    const variant = product.variants.find(v => v.stock > 0);
    if (variant) {
      addToCart(productId, variant.size, variant.color, 1);
      toast.success('Added to cart!');
      haptic.success();
    } else {
      toast.warning('Out of stock');
    }
  };

  return (
    <PageTransition>
      {/* ── Header ────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop:    100,
          paddingBottom: 0,
          borderBottom:  '1px solid var(--border)',
          background:    'var(--bg-primary)',
        }}
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ paddingBottom: 32 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <Heart size={26} color="var(--accent)" fill="var(--accent)" />
              <h1
                style={{
                  fontFamily:    'var(--font-serif)',
                  fontSize:      'var(--text-display)',
                  fontWeight:    800,
                  color:         'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Your Favorites
              </h1>
            </div>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginLeft: 38 }}>
              {favProducts.length} saved piece{favProducts.length !== 1 ? 's' : ''} · {favStores.length} followed store{favStores.length !== 1 ? 's' : ''}
            </p>
          </motion.div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)' }}>
            {(
              [
                { key: 'products', label: `Pieces (${favProducts.length})`, Icon: Heart },
                { key: 'stores',   label: `Stores (${favStores.length})`,   Icon: Store },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as FavTab)}
                aria-selected={tab === key}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          7,
                  padding:      '12px 20px',
                  border:       'none',
                  background:   'none',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-sans)',
                  fontSize:     'var(--text-body)',
                  fontWeight:   tab === key ? 700 : 500,
                  color:        tab === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -2,
                  transition:   'all var(--dur-fast) var(--spring)',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Content ───────────────────────────────────────────── */}
      <section style={{ padding: '48px 0 80px' }}>
        <div className="container">
          <AnimatePresence mode="wait">

            {/* Products tab */}
            {tab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {favProducts.length === 0 ? (
                  <EmptyState
                    icon="Heart"
                    title="No saved pieces yet"
                    description="Tap the heart on any product to save it here."
                    cta="Browse Products"
                    ctaLink="/"
                  />
                ) : (
                  <div
                    style={{
                      display:             'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap:                 24,
                    }}
                  >
                    <AnimatePresence>
                      {favProducts.map((product, i) =>
                        product && (
                          <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            style={{ position: 'relative' }}
                          >
                            <ProductCard product={product} />

                            {/* Floating action buttons — appear on card hover */}
                            <div
                              className="fav-card-actions"
                              style={{
                                position:   'absolute',
                                bottom:     12,
                                left:       12,
                                right:      12,
                                display:    'flex',
                                gap:        6,
                                opacity:    0,
                                transition: 'opacity var(--dur-fast) var(--spring)',
                                pointerEvents: 'none',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.opacity      = '1';
                                e.currentTarget.style.pointerEvents = 'all';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.opacity       = '0';
                                e.currentTarget.style.pointerEvents = 'none';
                              }}
                            >
                              <button
                                onClick={() => handleQuickCart(product.id)}
                                aria-label="Quick add to cart"
                                style={{
                                  flex:           1,
                                  display:        'flex',
                                  alignItems:     'center',
                                  justifyContent: 'center',
                                  gap:            6,
                                  padding:        '9px 12px',
                                  background:     'var(--accent)',
                                  color:          'var(--accent-fg)',
                                  border:         'none',
                                  borderRadius:   'var(--radius-pill)',
                                  cursor:         'pointer',
                                  fontWeight:     700,
                                  fontSize:       'var(--text-caption)',
                                  fontFamily:     'var(--font-sans)',
                                  backdropFilter: 'blur(12px)',
                                }}
                              >
                                <ShoppingCart size={13} /> Add to Cart
                              </button>
                              <button
                                onClick={() => handleRemoveProduct(product.id)}
                                aria-label="Remove from favorites"
                                style={{
                                  padding:        '9px 10px',
                                  background:     'rgba(0,0,0,0.6)',
                                  backdropFilter: 'blur(12px)',
                                  color:          '#fff',
                                  border:         'none',
                                  borderRadius:   'var(--radius-pill)',
                                  cursor:         'pointer',
                                  display:        'flex',
                                  alignItems:     'center',
                                }}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* Stores tab */}
            {tab === 'stores' && (
              <motion.div
                key="stores"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {favStores.length === 0 ? (
                  <EmptyState
                    icon="Star"
                    title="No followed stores yet"
                    description="Follow stores you love to keep them here."
                    cta="Explore Stores"
                    ctaLink="/"
                  />
                ) : (
                  <div
                    style={{
                      display:             'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap:                 24,
                    }}
                  >
                    <AnimatePresence>
                      {favStores.map((store, i) =>
                        store && (
                          <motion.div
                            key={store.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            style={{ position: 'relative' }}
                          >
                            <StoreCard store={store} />
                            <button
                              onClick={() => handleRemoveStore(store.id)}
                              aria-label={`Unfollow ${store.name}`}
                              title="Unfollow"
                              style={{
                                position:       'absolute',
                                top:            10,
                                right:          10,
                                background:     'rgba(0,0,0,0.55)',
                                backdropFilter: 'blur(8px)',
                                color:          '#fff',
                                border:         'none',
                                borderRadius:   '50%',
                                width:          30,
                                height:         30,
                                cursor:         'pointer',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                transition:     'background var(--dur-fast) var(--spring)',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,30,30,0.75)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
                            >
                              <X size={14} />
                            </button>
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  );
}
