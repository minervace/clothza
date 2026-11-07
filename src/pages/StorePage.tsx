// ============================================================
// pages/StorePage.tsx — Clothza v4.0
// Individual store page: banner, info, product grid, messaging
// ============================================================

import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Star, Heart, MessageCircle, AtSign,
} from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition, SectionReveal } from '@/components/layout/PageTransition';
import { ProductCard } from '@/components/commerce/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { TierBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { toast } from '@/lib/toast';
import { optimizeImageUrl, formatRating, formatCompactNumber } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import type { Product, ProductCategory } from '@/context/MarketplaceContext';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export default function StorePage() {
  const { slug }  = useParams<{ slug: string }>();
  const {
    getStore, getStoreProducts, isFavoriteStore, toggleFavoriteStore,
    sendMessage, state,
  } = useMarketplace();

  const store     = getStore(slug ?? '');
  const allProducts = store ? getStoreProducts(store.id) : [];

  const [category,    setCategory]    = useState<ProductCategory | 'All'>('All');
  const [sort,        setSort]        = useState<SortOption>('newest');
  const [msgOpen,     setMsgOpen]     = useState(false);
  const [msgText,     setMsgText]     = useState('');
  const [sendingMsg,  setSendingMsg]  = useState(false);

  if (!store) {
    return (
      <PageTransition>
        <div style={{ paddingTop: 120 }} className="container">
          <EmptyState
            icon="ShoppingBag"
            title="Store not found"
            description="This boutique may have moved or been removed."
            cta="Browse All Stores"
            ctaLink="/"
          />
        </div>
      </PageTransition>
    );
  }

  const isFav   = isFavoriteStore(store.id);

  // Filter + sort
  const filtered = allProducts
    .filter(p => category === 'All' || p.category === category)
    .sort((a: Product, b: Product) => {
      if (sort === 'price-asc')  return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'popular')    return b.views - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categories: Array<ProductCategory | 'All'> = [
    'All', 'Men', 'Women', 'Accessories', 'Footwear', 'Kids',
  ];

  const handleSendMsg = async () => {
    if (!msgText.trim()) return;
    if (!state.currentUser) {
      toast.error('Please sign in to message this store.');
      haptic.error();
      return;
    }
    setSendingMsg(true);
    await new Promise(r => setTimeout(r, 600));
    sendMessage(store.id, msgText.trim());
    toast.success('Message sent to ' + store.name);
    haptic.success();
    setMsgText('');
    setMsgOpen(false);
    setSendingMsg(false);
  };

  return (
    <PageTransition>
      {/* Banner */}
      <div style={{ height: 'clamp(220px, 35vh, 340px)', position: 'relative', overflow: 'hidden' }}>
        <motion.img
          src={optimizeImageUrl(store.banner, 1400, 400)}
          alt={`${store.name} banner`}
          loading="eager"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
      </div>

      {/* Store header card */}
      <div className="container">
        <div
          style={{
            background:   'var(--bg-card)',
            border:       '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding:      'var(--space-6)',
            marginTop:    -48,
            position:     'relative',
            zIndex:       2,
            display:      'flex',
            gap:          20,
            alignItems:   'flex-start',
            flexWrap:     'wrap',
          }}
        >
          {/* Logo */}
          <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--border)', flexShrink: 0, background: 'var(--bg-secondary)' }}>
            <img src={optimizeImageUrl(store.logo, 160, 160)} alt={`${store.name} logo`} loading="eager" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {store.name}
              </h1>
              <TierBadge tier={store.subscriptionTier} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>
                <MapPin size={13} /> {store.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-body)', color: 'var(--text-secondary)' }}>
                <Star size={13} fill="var(--tier-gold)" color="var(--tier-gold)" />
                {formatRating(store.rating)} ({store.reviewCount} reviews)
              </span>
              <span style={{ fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>
                {formatCompactNumber(store.views)} views
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', marginTop: 10, lineHeight: 'var(--leading-relaxed)', maxWidth: 600 }}>
              {store.description.slice(0, 180)}…
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            {store.instagram && (
              <a href={`https://instagram.com/${store.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                <AtSign size={14} /> {store.instagram}
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<MessageCircle size={14} />}
              onClick={() => setMsgOpen(true)}
            >
              Message
            </Button>
            <motion.button
              onClick={() => { toggleFavoriteStore(store.id); haptic.medium(); }}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={isFav}
              animate={isFav ? { scale: [1, 1.2, 0.9, 1.05, 1] } : {}}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className={isFav ? 'btn btn-danger btn-sm' : 'btn btn-outline btn-sm'}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Heart size={14} fill={isFav ? '#fff' : 'none'} />
              {isFav ? 'Saved' : 'Save'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                style={{
                  padding:      '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border:       '1px solid',
                  borderColor:  category === cat ? 'var(--accent)' : 'var(--border)',
                  background:   category === cat ? 'var(--accent-light)' : 'transparent',
                  color:        category === cat ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize:     'var(--text-caption)',
                  fontWeight:   category === cat ? 700 : 500,
                  cursor:       'pointer',
                  transition:   'all var(--dur-fast) var(--spring)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <Select
            options={[
              { value: 'newest',     label: 'Newest First'    },
              { value: 'popular',    label: 'Most Popular'    },
              { value: 'price-asc',  label: 'Price: Low → High' },
              { value: 'price-desc', label: 'Price: High → Low' },
            ]}
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            aria-label="Sort products"
            style={{ width: 'auto', minWidth: 160 }}
          />
        </div>

        {/* Product grid */}
        <SectionReveal>
          {filtered.length === 0 ? (
            <EmptyState
              icon="Package"
              title="No products found"
              description="Try a different category filter."
              onCtaClick={() => setCategory('All')}
              cta="Show All"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} eager={i < 4} />
              ))}
            </div>
          )}
        </SectionReveal>
      </div>

      {/* Message modal */}
      <Modal
        isOpen={msgOpen}
        onClose={() => setMsgOpen(false)}
        title={`Message ${store.name}`}
        description="Your message will be sent directly to the boutique team."
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setMsgOpen(false)}>Cancel</Button>
            <Button variant="accent" isLoading={sendingMsg} onClick={handleSendMsg}>Send Message</Button>
          </div>
        }
      >
        <Input
          label="Your message"
          placeholder="Hi, I'm interested in…"
          value={msgText}
          onChange={e => setMsgText(e.target.value)}
          required
          containerClassName="w-full"
        />
      </Modal>
    </PageTransition>
  );
}
