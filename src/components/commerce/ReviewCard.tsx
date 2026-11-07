// ============================================================
// components/commerce/ReviewCard.tsx — Clothza v4.0
// Star rating display + sanitized review comment
// ============================================================

import { Star } from 'lucide-react';
import { formatRelativeTime, getStars } from '@/lib/formatters';
import { sanitizeInput } from '@/lib/sanitize';
import type { Review } from '@/context/MarketplaceContext';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const stars = getStars(review.rating);

  return (
    <div
      style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding:      'var(--space-5)',
        display:      'flex',
        flexDirection: 'column',
        gap:           12,
      }}
    >
      {/* Header: Avatar + name + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar placeholder */}
          <div
            style={{
              width:          36,
              height:         36,
              borderRadius:   '50%',
              background:     'var(--accent-light)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       'var(--text-body)',
              fontWeight:     600,
              color:          'var(--accent)',
              flexShrink:     0,
            }}
          >
            {review.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontSize:   'var(--text-body)',
                fontWeight: 600,
                color:      'var(--text-primary)',
              }}
            >
              {sanitizeInput(review.userName)}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              {formatRelativeTime(review.createdAt)}
            </div>
          </div>
        </div>

        {/* Stars */}
        <div className="star-rating" aria-label={`${review.rating} out of 5 stars`}>
          {stars.map((type, i) => (
            <Star
              key={i}
              size={14}
              fill={type === 'filled' ? 'var(--tier-gold)' : 'none'}
              color={type === 'empty' ? 'var(--border)' : 'var(--tier-gold)'}
              strokeWidth={type === 'filled' ? 0 : 1.5}
            />
          ))}
        </div>
      </div>

      {/* Comment — sanitized */}
      <p
        style={{
          fontSize:   'var(--text-body)',
          color:      'var(--text-secondary)',
          lineHeight: 'var(--leading-relaxed)',
        }}
      >
        {sanitizeInput(review.comment)}
      </p>
    </div>
  );
}

export default ReviewCard;
