// ============================================================
// components/community/LookbookCard.tsx — Clothza v4.0
// Lookbook card with hover reveal, like button, podium rank,
// product thumbnails strip
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, ChevronRight, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMarketplace } from '@/context/MarketplaceContext';
import { optimizeImageUrl, formatCompactNumber, formatRelativeTime } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import type { Lookbook } from '@/context/MarketplaceContext';

interface LookbookCardProps {
  lookbook:  Lookbook;
  rank?:     number;
  className?: string;
}

export function LookbookCard({ lookbook, rank, className }: LookbookCardProps) {
  const { likeLookbook, getProduct } = useMarketplace();
  const [liked,   setLiked]   = useState(false);
  const [likeCount, setLikeCount] = useState(lookbook.likes);

  const products = lookbook.items
    .map(i => getProduct(i.productId))
    .filter(Boolean);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liked) return; // one like per session
    setLiked(true);
    setLikeCount(c => c + 1);
    likeLookbook(lookbook.id);
    haptic.medium();
  };

  const rankColors: Record<number, string> = {
    1: 'var(--tier-gold)',
    2: '#b0b0c0',
    3: '#cd7f32',
  };

  return (
    <motion.div
      className={className}
      whileHover="hover"
      style={{ cursor: 'pointer', position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <Link to={`/lookbooks/${lookbook.id}`} style={{ display: 'block' }}>
        {/* Cover image */}
        <div className="aspect-lookbook" style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          {lookbook.coverImage ? (
            <motion.img
              src={optimizeImageUrl(lookbook.coverImage, 480, 640)}
              alt={`${lookbook.name} lookbook by ${lookbook.creatorName}`}
              loading="lazy"
              decoding="async"
              variants={{ hover: { scale: 1.06 } }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)' }} />
          )}

          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }} />

          {/* Rank badge */}
          {rank !== undefined && rank <= 3 && (
            <motion.div
              style={{
                position:     'absolute',
                top:          12,
                left:         12,
                width:        36,
                height:       36,
                borderRadius: '50%',
                background:   rankColors[rank] ?? 'var(--bg-card)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     16,
                boxShadow:    '0 2px 12px rgba(0,0,0,0.3)',
              }}
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ delay: 0.5 + (rank * 0.1), duration: 0.4 }}
            >
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </motion.div>
          )}

          {/* Official badge */}
          {lookbook.isOfficial && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--accent)', color: 'var(--accent-fg)',
              fontSize: 'var(--text-overline)', fontWeight: 700,
              padding: '3px 8px', borderRadius: 'var(--radius-pill)',
            }}>
              <BadgeCheck size={10} /> Official
            </span>
          )}

          {/* Bottom overlay: creator + stats */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-subtitle)', fontWeight: 600, color: '#fff', lineHeight: 'var(--leading-snug)' }}>
              {lookbook.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 'var(--text-caption)', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                by {lookbook.creatorName}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption)', color: 'rgba(255,255,255,0.7)' }}>
                  <Eye size={12} /> {formatCompactNumber(lookbook.views)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption)', color: liked ? 'var(--accent)' : 'rgba(255,255,255,0.7)' }}>
                  <Heart size={12} fill={liked ? 'var(--accent)' : 'none'} /> {formatCompactNumber(likeCount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product thumbnails strip */}
        {products.length > 0 && (
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: -6 }}>
              {products.slice(0, 4).map((p, i) => (
                <div
                  key={p!.id}
                  style={{
                    width:        36,
                    height:       44,
                    borderRadius: 'var(--radius-sm)',
                    overflow:     'hidden',
                    border:       '2px solid var(--bg-card)',
                    marginLeft:   i > 0 ? -8 : 0,
                    zIndex:       products.length - i,
                    position:     'relative',
                    flexShrink:   0,
                  }}
                >
                  <img
                    src={optimizeImageUrl(p!.images[0] ?? '', 72, 88)}
                    alt={p!.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', flex: 1 }}>
              {products.length} {products.length === 1 ? 'piece' : 'pieces'} · {formatRelativeTime(lookbook.createdAt)}
            </span>
            <ChevronRight size={14} color="var(--text-tertiary)" />
          </div>
        )}
      </Link>

      {/* Like button — outside Link */}
      <motion.button
        onClick={handleLike}
        aria-label={liked ? 'Liked' : 'Like this lookbook'}
        aria-pressed={liked}
        animate={liked ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        whileTap={{ scale: 0.85 }}
        style={{
          position:     'absolute',
          top:          12,
          right:        lookbook.isOfficial ? 90 : 12,
          width:        34,
          height:       34,
          borderRadius: '50%',
          background:   'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          border:       'none',
          cursor:       liked ? 'default' : 'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          zIndex:       3,
        }}
      >
        <Heart
          size={15}
          fill={liked ? 'var(--accent)' : 'none'}
          color={liked ? 'var(--accent)' : '#fff'}
          strokeWidth={2}
        />
      </motion.button>
    </motion.div>
  );
}

export default LookbookCard;
