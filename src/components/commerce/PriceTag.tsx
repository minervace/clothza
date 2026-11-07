// ============================================================
// components/commerce/PriceTag.tsx — Clothza v4.0
// NPR price formatting with compareAtPrice strikethrough
// ============================================================

import { formatPrice, calcDiscountPercent } from '@/lib/formatters';

interface PriceTagProps {
  price:          number;
  compareAtPrice?: number;
  size?:          'sm' | 'md' | 'lg';
  showDiscount?:  boolean;
}

const sizeMap = {
  sm: { price: 'var(--text-body)',    compare: 'var(--text-caption)' },
  md: { price: 'var(--text-subtitle)', compare: 'var(--text-body)'  },
  lg: { price: '24px',               compare: 'var(--text-body)'   },
};

export function PriceTag({
  price,
  compareAtPrice,
  size         = 'md',
  showDiscount = true,
}: PriceTagProps) {
  const hasDiscount = compareAtPrice !== undefined && compareAtPrice > price;
  const discountPct = hasDiscount ? calcDiscountPercent(compareAtPrice!, price) : 0;
  const sizes       = sizeMap[size];

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      {/* Sale price */}
      <span
        style={{
          fontSize:   sizes.price,
          fontWeight: 'var(--weight-bold)',
          color:      hasDiscount ? 'var(--danger)' : 'var(--text-primary)',
          fontFamily: 'var(--font-serif)',
          letterSpacing: '-0.01em',
        }}
      >
        {formatPrice(price)}
      </span>

      {/* Original price strikethrough */}
      {hasDiscount && (
        <span
          className="price-compare"
          style={{ fontSize: sizes.compare }}
          aria-label={`Original price: ${formatPrice(compareAtPrice!)}`}
        >
          {formatPrice(compareAtPrice!)}
        </span>
      )}

      {/* Discount badge */}
      {hasDiscount && showDiscount && discountPct > 0 && (
        <span
          style={{
            background:   'var(--danger-light)',
            color:        'var(--danger)',
            fontSize:     'var(--text-overline)',
            fontWeight:   'var(--weight-semibold)',
            padding:      '2px 6px',
            borderRadius: 'var(--radius-sm)',
            letterSpacing: 'var(--tracking-wide)',
          }}
          aria-label={`${discountPct}% off`}
        >
          −{discountPct}%
        </span>
      )}
    </div>
  );
}

export default PriceTag;
