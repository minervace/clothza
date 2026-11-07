// ============================================================
// pages/ProductPage.tsx — Clothza v4.0
// Product detail: image gallery, variant selector, size guide,
// add-to-cart with stock validation, reviews, related products
// ============================================================

import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, ShoppingCart, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition, SectionReveal } from '@/components/layout/PageTransition';
import { ProductCard } from '@/components/commerce/ProductCard';
import { ReviewCard } from '@/components/commerce/ReviewCard';
import { PriceTag } from '@/components/commerce/PriceTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { optimizeImageUrl, formatRating, getStars } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import { sanitizeInput } from '@/lib/sanitize';

export default function ProductPage() {
  const { id }           = useParams<{ id: string }>();
  const {
    getProduct, getStore, getProductReviews, getStoreProducts,
    isFavoriteProduct, toggleFavoriteProduct,
    addToCart, addReview, state,
  } = useMarketplace();

  const product  = getProduct(id ?? '');
  const store    = product ? getStore(product.storeId) : undefined;
  const reviews  = product ? getProductReviews(product.id) : [];

  // Image gallery
  const [activeImage, setActiveImage]   = useState(0);
  const [imgLoaded,   setImgLoaded]     = useState(false);
  const touchStartX = useRef<number | null>(null);

  const imageCount = product?.images.length ?? 0;
  const goToImage = (next: number) => {
    if (imageCount < 2) return;
    setImgLoaded(false);
    setActiveImage(((next % imageCount) + imageCount) % imageCount);
  };

  // Variant selectors
  const [selectedSize,  setSelectedSize]  = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity,      setQuantity]      = useState(1);
  const [addingCart,    setAddingCart]    = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review form
  const [rating,  setRating]  = useState(5);
  const [comment, setComment] = useState('');

  // Derive available colors for selected size
  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find(v => v.size === selectedSize && v.color === selectedColor) ?? null;
  }, [product, selectedSize, selectedColor]);

  const maxQty     = selectedVariant?.stock ?? 99;
  const outOfStock = selectedVariant ? selectedVariant.stock === 0 : false;
  const isFav      = product ? isFavoriteProduct(product.id) : false;

  // Related products (same store, different product)
  const related = product
    ? getStoreProducts(product.storeId).filter(p => p.id !== product.id).slice(0, 4)
    : [];

  if (!product) {
    return (
      <PageTransition>
        <div style={{ paddingTop: 120 }} className="container">
          <EmptyState icon="Package" title="Product not found" cta="Browse Collections" ctaLink="/" />
        </div>
      </PageTransition>
    );
  }

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      toast.warning('Please select a size and colour first.');
      haptic.warning();
      return;
    }
    if (outOfStock) {
      toast.error('This variant is sold out.');
      haptic.error();
      return;
    }
    setAddingCart(true);
    await new Promise(r => setTimeout(r, 400));
    addToCart(product.id, selectedSize, selectedColor, quantity);
    toast.success(`${product.name} added to cart!`);
    haptic.success();
    setAddingCart(false);
  };

  const handleFav = () => {
    toggleFavoriteProduct(product.id);
    haptic.medium();
  };

  const handleSubmitReview = () => {
    if (!state.currentUser) {
      toast.error('Sign in to leave a review.');
      return;
    }
    if (!comment.trim()) return;
    addReview({
      productId: product.id,
      userId:    state.currentUser.id,
      userName:  state.currentUser.name,
      rating,
      comment:   sanitizeInput(comment),
    });
    toast.success('Review submitted!');
    haptic.success();
    setComment('');
    setRating(5);
    setShowReviewForm(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.rating;

  return (
    <PageTransition>
      <div className="container" style={{ paddingTop: 100, paddingBottom: 80 }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          <Link to="/" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Browse</Link>
          <span>/</span>
          {store && <Link to={`/store/${store.slug}`} style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>{store.name}</Link>}
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{product.name}</span>
        </nav>

        {/* Main product grid */}
        <div className="product-layout">
          {/* Left: Image gallery */}
          <div>
            {/* Main image */}
            <div
              className="aspect-product gallery-stage"
              role="group"
              aria-roledescription="carousel"
              aria-label={`${product.name} images`}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'ArrowRight') { e.preventDefault(); goToImage(activeImage + 1); }
                if (e.key === 'ArrowLeft')  { e.preventDefault(); goToImage(activeImage - 1); }
              }}
              onTouchStart={e => { touchStartX.current = e.touches[0]?.clientX ?? null; }}
              onTouchEnd={e => {
                const start = touchStartX.current;
                touchStartX.current = null;
                if (start === null) return;
                const delta = (e.changedTouches[0]?.clientX ?? start) - start;
                if (Math.abs(delta) > 40) goToImage(activeImage + (delta < 0 ? 1 : -1));
              }}
            >
              {!imgLoaded && <Skeleton height="100%" style={{ borderRadius: 0 }} />}
              <AnimatePresence mode="wait">
                <motion.img
                  key={product.images[activeImage]}
                  src={optimizeImageUrl(product.images[activeImage] ?? '', 700, 933)}
                  alt={`${product.name} — view ${activeImage + 1}`}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onLoad={() => setImgLoaded(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </AnimatePresence>

              {imageCount > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-nav gallery-nav--prev"
                    aria-label="Previous image"
                    onClick={() => goToImage(activeImage - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="gallery-nav gallery-nav--next"
                    aria-label="Next image"
                    onClick={() => goToImage(activeImage + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="gallery-counter" aria-hidden="true">
                    {activeImage + 1} / {imageCount}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={activeImage === i}
                    className="gallery-thumb"
                    style={{
                      width:        76,
                      height:       96,
                      borderRadius: 'var(--radius-md)',
                      overflow:     'hidden',
                      background:   'var(--bg-secondary)',
                      border:       `2px solid ${activeImage === i ? 'var(--accent)' : 'var(--border)'}`,
                      padding:      0,
                      cursor:       'pointer',
                      flexShrink:   0,
                      transition:   'border-color var(--dur-fast) var(--spring), transform var(--dur-fast) var(--spring)',
                    }}
                  >
                    <img src={optimizeImageUrl(img, 152, 192)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Category + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 'var(--text-overline)', fontWeight: 700, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                {product.category}
              </span>
              {product.isBestSeller && <span style={{ background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase' }}>Best Seller</span>}
              {product.isTrending && <span style={{ background: 'var(--success)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-pill)', letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase' }}>Trending</span>}
            </div>

            {/* Name */}
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 'var(--leading-tight)', letterSpacing: '-0.02em' }}>
              {product.name}
            </h1>

            {/* Store link + rating */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {store && (
                <Link to={`/store/${store.slug}`} style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                  {store.name}
                </Link>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {getStars(avgRating).map((type, i) => (
                  <Star key={i} size={14} fill={type !== 'empty' ? 'var(--tier-gold)' : 'none'} color={type === 'empty' ? 'var(--border)' : 'var(--tier-gold)'} strokeWidth={type === 'filled' ? 0 : 1.5} />
                ))}
                <span style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 4 }}>{formatRating(avgRating)}</span>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>({reviews.length})</span>
              </div>
            </div>

            {/* Price */}
            <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />

            {/* Description */}
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              {product.description.slice(0, 280)}…
            </p>

            {/* Colour selector */}
            <div>
              <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                Colour{selectedColor && `: ${selectedColor}`}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[...new Set(product.variants.map(v => v.color))].map(color => {
                  const available = product.variants.some(v => v.color === color && (!selectedSize || v.size === selectedSize) && v.stock > 0);
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(c => c === color ? '' : color)}
                      aria-label={`Colour: ${color}`}
                      aria-pressed={selectedColor === color}
                      disabled={!available}
                      style={{
                        padding:      '6px 14px',
                        borderRadius: 'var(--radius-pill)',
                        border:       `1.5px solid ${selectedColor === color ? 'var(--accent)' : 'var(--border)'}`,
                        background:   selectedColor === color ? 'var(--accent-light)' : 'transparent',
                        color:        selectedColor === color ? 'var(--accent)' : available ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                        fontSize:     'var(--text-caption)',
                        fontWeight:   500,
                        cursor:       available ? 'pointer' : 'not-allowed',
                        opacity:      available ? 1 : 0.4,
                        transition:   'all var(--dur-fast) var(--spring)',
                        textDecoration: !available ? 'line-through' : 'none',
                      }}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size selector */}
            <div>
              <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                Size{selectedSize && `: ${selectedSize}`}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[...new Set(product.variants.map(v => v.size))].map(size => {
                  const available = product.variants.some(v => v.size === size && (!selectedColor || v.color === selectedColor) && v.stock > 0);
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(s => s === size ? '' : size)}
                      aria-label={`Size: ${size}`}
                      aria-pressed={selectedSize === size}
                      disabled={!available}
                      style={{
                        minWidth:     42,
                        height:       42,
                        borderRadius: 'var(--radius-md)',
                        border:       `1.5px solid ${selectedSize === size ? 'var(--accent)' : 'var(--border)'}`,
                        background:   selectedSize === size ? 'var(--accent)' : 'transparent',
                        color:        selectedSize === size ? 'var(--accent-fg)' : available ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                        fontSize:     'var(--text-body)',
                        fontWeight:   600,
                        cursor:       available ? 'pointer' : 'not-allowed',
                        opacity:      available ? 1 : 0.35,
                        transition:   'all var(--dur-fast) var(--spring)',
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock level */}
            {selectedVariant && (
              <div style={{ fontSize: 'var(--text-caption)', color: selectedVariant.stock <= 5 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                {outOfStock ? 'Sold Out' : selectedVariant.stock <= 5 ? `Only ${selectedVariant.stock} left` : 'In Stock'}
              </div>
            )}

            {/* Qty + Cart */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Qty counter */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1} style={{ padding: '10px 14px', background: 'none', border: 'none', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', fontSize: 18 }}>−</button>
                <span style={{ padding: '10px 14px', fontWeight: 700, fontSize: 'var(--text-body)', minWidth: 36, textAlign: 'center' }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty} style={{ padding: '10px 14px', background: 'none', border: 'none', cursor: quantity >= maxQty ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', fontSize: 18 }}>+</button>
              </div>

              {/* Add to cart */}
              <Button
                variant="accent"
                size="lg"
                isLoading={addingCart}
                leftIcon={<ShoppingCart size={17} />}
                disabled={outOfStock}
                onClick={handleAddToCart}
                style={{ flex: 1 }}
              >
                {outOfStock ? 'Sold Out' : 'Add to Cart'}
              </Button>

              {/* Favorite */}
              <motion.button
                onClick={handleFav}
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isFav}
                animate={isFav ? { scale: [1, 1.25, 0.9, 1.1, 1] } : {}}
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.4 }}
                style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                  border: `1.5px solid ${isFav ? 'var(--danger)' : 'var(--border)'}`,
                  background: isFav ? 'var(--danger-light)' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--dur-fast) var(--spring)',
                }}
              >
                <Heart size={18} fill={isFav ? 'var(--danger)' : 'none'} color={isFav ? 'var(--danger)' : 'var(--text-tertiary)'} />
              </motion.button>
            </div>

            {/* Trust signals */}
            <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {[
                { icon: <Truck size={14} />, text: 'Free delivery over रू 5,000' },
                { icon: <RotateCcw size={14} />, text: '7-day returns' },
                { icon: <Shield size={14} />, text: 'Verified boutique' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                  {item.icon} {item.text}
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 'var(--text-overline)', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews section */}
        <SectionReveal>
          <div style={{ marginTop: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Reviews ({reviews.length})
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowReviewForm(v => !v)}>
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </Button>
            </div>

            {/* Review form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background:   'var(--bg-card)',
                    border:       '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding:      'var(--space-6)',
                    marginBottom: 24,
                    display:      'flex',
                    flexDirection: 'column',
                    gap:           16,
                    overflow:     'hidden',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Your Rating</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setRating(s)} aria-label={`${s} star${s > 1 ? 's' : ''}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                          <Star size={24} fill={s <= rating ? 'var(--tier-gold)' : 'none'} color={s <= rating ? 'var(--tier-gold)' : 'var(--border)'} strokeWidth={1.5} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="review-comment" style={{ fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--text-tertiary)', display: 'block', marginBottom: 8 }}>Your Review</label>
                    <textarea
                      id="review-comment"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Share your thoughts on this product…"
                      rows={4}
                      className="input-base"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                  <Button variant="accent" onClick={handleSubmitReview} disabled={!comment.trim()}>Submit Review</Button>
                </motion.div>
              )}
            </AnimatePresence>

            {reviews.length === 0 ? (
              <EmptyState icon="Star" title="No reviews yet" description="Be the first to review this product." compact />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
                {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </div>
        </SectionReveal>

        {/* Related products */}
        {related.length > 0 && (
          <SectionReveal>
            <div style={{ marginTop: 80 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28 }}>
                More from {store?.name}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                {related.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </SectionReveal>
        )}
      </div>
    </PageTransition>
  );
}
