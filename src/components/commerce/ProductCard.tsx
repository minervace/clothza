// ============================================================
// components/commerce/ProductCard.tsx — Clothza v4.0
// Quick-add to cart, image zoom on hover, skeleton load,
// favorite button with heart animation, sponsored badge
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { useMarketplace } from '@/context/MarketplaceContext';
import { optimizeImageUrl, formatRating } from '@/lib/formatters';
import { PriceTag } from '@/components/commerce/PriceTag';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import type { Product } from '@/context/MarketplaceContext';

interface ProductCardProps {
  product:   Product;
  className?: string;
  eager?:    boolean; // above-the-fold: use loading="eager"
}

export function ProductCard({ product, className, eager = false }: ProductCardProps) {
  const { isFavoriteProduct, toggleFavoriteProduct, addToCart, getStore } = useMarketplace();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);

  const isFav  = isFavoriteProduct(product.id);
  const store  = getStore(product.storeId);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteProduct(product.id);
    haptic.medium();
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Quick-add: pick first available variant
    const variant = product.variants.find(v => v.stock > 0);
    if (!variant) {
      toast.error('Out of stock');
      haptic.error();
      return;
    }
    setIsAddingCart(true);
    addToCart(product.id, variant.size, variant.color, 1);
    haptic.success();
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setIsAddingCart(false), 600);
  };

  const hasDiscount = product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
  const isOutOfStock = product.variants.every(v => v.stock === 0);

  return (
    <motion.div
      className={clsx('card card-hover', className)}
      style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
      whileHover="hover"
    >
      <Link to={`/product/${product.id}`} style={{ display: 'block' }}>
        {/* Image container */}
        <div className="aspect-product" style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          {/* Skeleton */}
          {!imageLoaded && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <Skeleton className="w-full h-full" style={{ borderRadius: 0 }} />
            </div>
          )}

          {/* Product image with zoom on card hover */}
          <motion.img
            src={optimizeImageUrl(product.images[0] ?? '', 600, 800)}
            alt={`${product.name} — ${product.category} from ${store?.name ?? 'Clothza'}`}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            variants={{ hover: { scale: 1.07 } }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              opacity:    imageLoaded ? 1 : 0,
              transition: 'opacity 400ms ease',
              display:    'block',
            }}
          />

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                background: 'rgba(0,0,0,0.7)', color: '#fff',
                fontSize: 'var(--text-caption)', fontWeight: 600,
                padding: '6px 14px', borderRadius: 'var(--radius-pill)',
              }}>
                Sold Out
              </span>
            </div>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {product.isBestSeller && (
              <span style={{ background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase' }}>
                Best Seller
              </span>
            )}
            {product.isTrending && !product.isBestSeller && (
              <span style={{ background: 'var(--success)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase' }}>
                Trending
              </span>
            )}
            {product.isSponsored && (
              <span style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase' }}>
                Sponsored
              </span>
            )}
          </div>

          {/* Quick add — appears on hover */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            variants={{ hover: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.2 }}
            style={{
              position:  'absolute',
              bottom:    10,
              left:      10,
              right:     10,
            }}
            onClick={e => e.stopPropagation()}
          >
            <motion.button
              onClick={handleQuickAdd}
              disabled={isOutOfStock || isAddingCart}
              aria-label={`Quick add ${product.name} to cart`}
              whileTap={{ scale: 0.96 }}
              style={{
                width:         '100%',
                background:    isAddingCart ? 'var(--success)' : 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(12px)',
                color:         '#fff',
                border:        'none',
                borderRadius:  'var(--radius-pill)',
                padding:       '9px 16px',
                fontSize:      'var(--text-caption)',
                fontWeight:    600,
                fontFamily:    'var(--font-sans)',
                cursor:        isOutOfStock ? 'not-allowed' : 'pointer',
                display:       'flex',
                alignItems:    'center',
                justifyContent: 'center',
                gap:           6,
                transition:    'background 300ms ease',
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isAddingCart ? (
                  <motion.span key="added" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    ✓ Added!
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShoppingCart size={13} /> Quick Add
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>

        {/* Product info */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Category label */}
          <span style={{ fontSize: 'var(--text-overline)', fontWeight: 600, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {product.category}
          </span>

          {/* Product name */}
          <h3
            style={{
              fontFamily:  'var(--font-serif)',
              fontSize:    'var(--text-body)',
              fontWeight:  600,
              color:       'var(--text-primary)',
              lineHeight:  'var(--leading-snug)',
            }}
            className="line-clamp-2"
          >
            {product.name}
          </h3>

          {/* Store name */}
          {store && (
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              {store.name}
            </span>
          )}

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={11} fill="var(--tier-gold)" color="var(--tier-gold)" />
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatRating(product.rating)}
            </span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <PriceTag
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            size="sm"
          />
        </div>
      </Link>

      {/* Favorite button */}
      <motion.button
        onClick={handleFav}
        aria-label={isFav ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
        aria-pressed={isFav}
        style={{
          position:     'absolute',
          top:          12,
          right:        12,
          width:        32,
          height:       32,
          borderRadius: '50%',
          background:   'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          border:       'none',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          boxShadow:    'var(--shadow-card)',
          zIndex:       2,
        }}
        animate={isFav ? { scale: [1, 1.3, 0.9, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        whileTap={{ scale: 0.85 }}
      >
        <Heart
          size={14}
          fill={isFav ? 'var(--danger)' : 'none'}
          color={isFav ? 'var(--danger)' : 'var(--text-tertiary)'}
          strokeWidth={2}
        />
      </motion.button>
    </motion.div>
  );
}

export default ProductCard;
