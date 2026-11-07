// ============================================================
// pages/LookbookDetailPage.tsx — Clothza v4.0
// Full lookbook story page: hero, description, items with
// size/colour callouts, total look value, like + share,
// add-all-to-cart action, creator profile
// ============================================================

import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Eye, BadgeCheck, ShoppingCart, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useMarketplace } from '@/context/MarketplaceContext';
import { PageTransition, SectionReveal } from '@/components/layout/PageTransition';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { optimizeImageUrl, formatCompactNumber, formatDate, formatPrice } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';

export default function LookbookDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const { state, likeLookbook, getProduct, addToCart } = useMarketplace();

  const lookbook    = state.lookbooks.find(lb => lb.id === id);
  const [liked,     setLiked]     = useState(false);
  const [likeCount, setLikeCount] = useState(lookbook?.likes ?? 0);
  const [copied,    setCopied]    = useState(false);
  const [addingAll, setAddingAll] = useState(false);

  if (!lookbook) {
    return (
      <PageTransition>
        <div style={{ paddingTop: 120 }} className="container">
          <EmptyState
            icon="Layers"
            title="Lookbook not found"
            description="This lookbook may have been removed."
            cta="Browse Lookbooks"
            ctaLink="/lookbooks"
          />
        </div>
      </PageTransition>
    );
  }

  // Resolve products — keep pairing with the item's selected size + colour
  const itemsWithProducts = lookbook.items
    .map(item => ({ item, product: getProduct(item.productId) }))
    .filter(({ product }) => Boolean(product));

  const totalValue = itemsWithProducts.reduce(
    (sum, { product }) => sum + (product?.price ?? 0),
    0
  );

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLikeCount(c => c + 1);
    likeLookbook(lookbook.id);
    haptic.success();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      haptic.light();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const handleAddAll = async () => {
    setAddingAll(true);
    await new Promise(r => setTimeout(r, 500));
    let added = 0;
    itemsWithProducts.forEach(({ item, product }) => {
      if (!product) return;
      const variant = product.variants.find(
        v => v.size === item.selectedSize && v.color === item.selectedColor && v.stock > 0
      ) ?? product.variants.find(v => v.stock > 0);
      if (variant) {
        addToCart(product.id, variant.size, variant.color, 1);
        added++;
      }
    });
    setAddingAll(false);
    if (added > 0) {
      toast.success(`${added} piece${added > 1 ? 's' : ''} added to your cart!`);
      haptic.success();
    } else {
      toast.warning('All pieces in this look are currently sold out.');
      haptic.warning();
    }
  };

  return (
    <PageTransition>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(380px, 60vh, 580px)', overflow: 'hidden' }}>
        {lookbook.coverImage ? (
          <motion.img
            src={optimizeImageUrl(lookbook.coverImage, 1400, 700)}
            alt={lookbook.name}
            loading="eager"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--gradient-primary)' }} />
        )}

        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />

        {/* Back button */}
        <motion.button
          onClick={() => navigate(-1)}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="btn btn-ghost"
          style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
          aria-label="Go back"
        >
          <ArrowLeft size={15} /> Back
        </motion.button>

        {/* Share button */}
        <motion.button
          onClick={handleShare}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-lg)', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-body)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
          aria-label="Share this lookbook"
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? 'Copied!' : 'Share'}
        </motion.button>

        {/* Hero copy */}
        <motion.div
          className="container"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ maxWidth: 700 }}>
            {lookbook.isOfficial && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 'var(--text-overline)', fontWeight: 700, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 'var(--radius-pill)', marginBottom: 14 }}>
                <BadgeCheck size={12} /> Official Edit
              </span>
            )}
            <h1
              style={{
                fontFamily:    'var(--font-serif)',
                fontSize:      'clamp(32px, 6vw, 58px)',
                fontWeight:    800,
                color:         '#fff',
                lineHeight:    'var(--leading-tight)',
                letterSpacing: '-0.02em',
              }}
            >
              {lookbook.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-body)', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                by {lookbook.creatorName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-caption)', color: 'rgba(255,255,255,0.6)' }}>
                <Eye size={12} /> {formatCompactNumber(lookbook.views)} views
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-caption)', color: 'rgba(255,255,255,0.6)' }}>
                <Heart size={12} /> {formatCompactNumber(likeCount)} likes
              </span>
              <span style={{ fontSize: 'var(--text-caption)', color: 'rgba(255,255,255,0.5)' }}>
                {formatDate(lookbook.createdAt)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="container" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 64, alignItems: 'start' }}>
          {/* Left: description + items */}
          <div>
            {lookbook.description && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize:   'var(--text-subtitle)',
                  color:      'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  fontFamily: 'var(--font-serif)',
                  fontStyle:  'italic',
                  marginBottom: 48,
                  paddingLeft: 20,
                  borderLeft: '3px solid var(--accent)',
                }}
              >
                "{lookbook.description}"
              </motion.p>
            )}

            {/* The Pieces */}
            <SectionReveal>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28 }}>
                The Pieces ({itemsWithProducts.length})
              </h2>

              {itemsWithProducts.length === 0 ? (
                <EmptyState icon="Package" title="No products in this look" compact />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                  {itemsWithProducts.map(({ item, product }, i) => (
                    product && (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -6 }}
                      >
                        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                          <div
                            style={{
                              background:   'var(--bg-card)',
                              border:       '1px solid var(--border)',
                              borderRadius: 'var(--radius-xl)',
                              overflow:     'hidden',
                              transition:   'border-color var(--dur-fast) var(--spring)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >
                            {/* Product image */}
                            <div style={{ height: 240, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                              <img
                                src={optimizeImageUrl(product.images[0] ?? '', 440, 480)}
                                alt={product.name}
                                loading={i < 4 ? 'eager' : 'lazy'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                                onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.04)'; }}
                                onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                              />
                            </div>

                            {/* Info */}
                            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ fontSize: 'var(--text-overline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-widest)', color: 'var(--text-tertiary)' }}>
                                {product.category}
                              </div>
                              <div style={{ fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 'var(--leading-snug)' }} className="line-clamp-2">
                                {product.name}
                              </div>

                              {/* Selected size + colour tags */}
                              {(item.selectedSize || item.selectedColor) && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                                  {item.selectedSize && (
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: 'var(--radius-pill)' }}>
                                      {item.selectedSize}
                                    </span>
                                  )}
                                  {item.selectedColor && (
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: 'var(--radius-pill)' }}>
                                      {item.selectedColor}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div style={{ fontWeight: 800, fontSize: 'var(--text-body)', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', marginTop: 4 }}>
                                {formatPrice(product.price)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    )
                  ))}
                </div>
              )}
            </SectionReveal>
          </div>

          {/* Right: sticky sidebar */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div
              style={{
                background:   'var(--bg-card)',
                border:       '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding:      'var(--space-6)',
                display:      'flex',
                flexDirection: 'column',
                gap:           20,
              }}
            >
              {/* Creator info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width:        44,
                    height:       44,
                    borderRadius: '50%',
                    background:   'var(--gradient-primary)',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    fontSize:     18,
                    fontWeight:   800,
                    color:        '#fff',
                    flexShrink:   0,
                  }}
                >
                  {lookbook.creatorName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{lookbook.creatorName}</div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                    {lookbook.isOfficial ? '✓ Official Stylist' : 'Community Stylist'}
                  </div>
                </div>
              </div>

              {/* Meta rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Pieces',     value: itemsWithProducts.length   },
                  { label: 'Views',      value: formatCompactNumber(lookbook.views) },
                  { label: 'Likes',      value: formatCompactNumber(likeCount)      },
                  { label: 'Published',  value: formatDate(lookbook.createdAt)      },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-body)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{row.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Total look value */}
              {totalValue > 0 && (
                <div
                  style={{
                    display:      'flex',
                    justifyContent: 'space-between',
                    alignItems:   'center',
                    background:   'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    padding:      '12px 14px',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>Total Look Value</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-subtitle)', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatPrice(totalValue)}
                  </span>
                </div>
              )}

              {/* Like button */}
              <motion.button
                onClick={handleLike}
                aria-pressed={liked}
                aria-label={liked ? 'Liked' : 'Like this lookbook'}
                whileTap={{ scale: 0.95 }}
                animate={liked ? { scale: [1, 1.12, 0.95, 1.04, 1] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  width:          '100%',
                  padding:        '12px',
                  borderRadius:   'var(--radius-pill)',
                  border:         `2px solid ${liked ? 'var(--accent)' : 'var(--border)'}`,
                  background:     liked ? 'var(--accent-light)' : 'transparent',
                  color:          liked ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight:     700,
                  fontSize:       'var(--text-body)',
                  fontFamily:     'var(--font-sans)',
                  cursor:         liked ? 'default' : 'pointer',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            8,
                  transition:     'all var(--dur-normal) var(--spring)',
                }}
              >
                <Heart size={16} fill={liked ? 'var(--accent)' : 'none'} />
                {liked ? 'Loved it!' : `Love this look (${formatCompactNumber(likeCount)})`}
              </motion.button>

              {/* Add all to cart */}
              {itemsWithProducts.length > 0 && (
                <Button
                  variant="accent"
                  leftIcon={<ShoppingCart size={15} />}
                  isLoading={addingAll}
                  onClick={handleAddAll}
                  style={{ width: '100%' }}
                >
                  Add All to Cart
                </Button>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 'var(--text-body)', fontFamily: 'var(--font-sans)', fontWeight: 500, transition: 'all var(--dur-fast) var(--spring)', width: '100%' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? 'Copied link!' : 'Share lookbook'}
              </button>

              <Link to="/lookbooks" className="btn btn-ghost" style={{ textAlign: 'center', justifyContent: 'center' }}>
                ← More Lookbooks
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
