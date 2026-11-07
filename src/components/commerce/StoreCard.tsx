// ============================================================
// components/commerce/StoreCard.tsx — Clothza v4.0
// Store card with image optimization, hover effects, tier badge
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { useMarketplace } from '@/context/MarketplaceContext';
import { optimizeImageUrl, formatRating } from '@/lib/formatters';
import { TierBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Store } from '@/context/MarketplaceContext';
import { haptic } from '@/lib/haptics';

interface StoreCardProps {
  store:     Store;
  className?: string;
}

export function StoreCard({ store, className }: StoreCardProps) {
  const { isFavoriteStore, toggleFavoriteStore } = useMarketplace();
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [logoLoaded,   setLogoLoaded]   = useState(false);
  const isFav = isFavoriteStore(store.id);

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteStore(store.id);
    haptic.medium();
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={clsx('card', className)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <Link to={`/store/${store.slug}`} style={{ display: 'block' }}>
        {/* Banner */}
        <div className="aspect-banner img-zoom-container" style={{ position: 'relative' }}>
          {!bannerLoaded && <Skeleton className="w-full h-full" style={{ borderRadius: 0 }} />}
          <img
            src={optimizeImageUrl(store.banner, 600, 200)}
            alt={`${store.name} banner`}
            loading="lazy"
            decoding="async"
            onLoad={() => setBannerLoaded(true)}
            className="img-zoom"
            style={{
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              opacity:    bannerLoaded ? 1 : 0,
              transition: 'opacity 400ms ease',
              position:   'absolute',
              inset:      0,
            }}
          />

          {/* Sponsored badge */}
          {store.isSponsored && (
            <span
              style={{
                position:   'absolute',
                top:         10,
                left:        10,
                background:  'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                color:       '#fff',
                fontSize:    'var(--text-overline)',
                fontWeight:  600,
                padding:     '3px 8px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: 'var(--tracking-wider)',
              }}
            >
              SPONSORED
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Logo + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="aspect-logo" style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0, border: '1px solid var(--border)' }}>
              {!logoLoaded && <Skeleton className="w-full h-full" />}
              <img
                src={optimizeImageUrl(store.logo, 100, 100)}
                alt={`${store.name} logo`}
                loading="lazy"
                decoding="async"
                onLoad={() => setLogoLoaded(true)}
                style={{
                  width:     '100%',
                  height:    '100%',
                  objectFit: 'cover',
                  opacity:   logoLoaded ? 1 : 0,
                  transition: 'opacity 300ms ease',
                  display:   'block',
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 'var(--text-subtitle)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {store.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <MapPin size={11} color="var(--text-tertiary)" />
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                  {store.location}
                </span>
              </div>
            </div>
            <TierBadge tier={store.subscriptionTier} showEmoji />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={13} fill="var(--tier-gold)" color="var(--tier-gold)" />
              <span style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatRating(store.rating)}
              </span>
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                ({store.reviewCount})
              </span>
            </div>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              {store.views.toLocaleString()} views
            </span>
          </div>
        </div>
      </Link>

      {/* Favorite button — outside Link to prevent nav */}
      <motion.button
        onClick={handleFav}
        aria-label={isFav ? `Remove ${store.name} from favorites` : `Add ${store.name} to favorites`}
        aria-pressed={isFav}
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        style={{
          position:     'absolute',
          top:          10,
          right:        10,
          width:        34,
          height:       34,
          borderRadius: '50%',
          background:   'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          border:       'none',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          zIndex:       2,
        }}
      >
        <Heart
          size={15}
          fill={isFav ? '#fff' : 'none'}
          color="#fff"
          strokeWidth={2}
        />
      </motion.button>
    </motion.div>
  );
}

export default StoreCard;
