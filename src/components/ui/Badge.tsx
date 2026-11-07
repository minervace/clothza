// ============================================================
// components/ui/Badge.tsx — Clothza v4.0
// Variants: status, category, rank, subscription tier
// ============================================================

import React from 'react';
import { clsx } from 'clsx';
import type { SubscriptionTier, OrderStatus } from '@/context/MarketplaceContext';

type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'free'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'rank-1'
  | 'rank-2'
  | 'rank-3';

interface BadgeProps {
  variant?:  BadgeVariant;
  children:  React.ReactNode;
  dot?:      boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'badge badge-default',
  accent:   'badge badge-accent',
  success:  'badge badge-success',
  warning:  'badge badge-warning',
  danger:   'badge badge-danger',
  free:     'badge badge-free',
  bronze:   'badge badge-bronze',
  silver:   'badge badge-silver',
  gold:     'badge badge-gold',
  'rank-1': 'badge badge-rank-1',
  'rank-2': 'badge badge-rank-2',
  'rank-3': 'badge badge-rank-3',
};

export function Badge({ variant = 'default', children, dot, className }: BadgeProps) {
  return (
    <span className={clsx(variantClasses[variant], className)}>
      {dot && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'currentColor',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

// ── Tier Badge ───────────────────────────────────────────────

const TIER_EMOJI: Record<SubscriptionTier, string> = {
  free:   '',
  bronze: '🥉',
  silver: '🥈',
  gold:   '🥇',
};

interface TierBadgeProps {
  tier:      SubscriptionTier;
  showEmoji?: boolean;
  className?: string;
}

export function TierBadge({ tier, showEmoji = true, className }: TierBadgeProps) {
  const tierLabels: Record<SubscriptionTier, string> = {
    free:   'Free',
    bronze: 'Bronze',
    silver: 'Silver',
    gold:   'Gold',
  };

  return (
    <Badge variant={tier} className={className}>
      {showEmoji && TIER_EMOJI[tier] && (
        <span aria-hidden="true">{TIER_EMOJI[tier]} </span>
      )}
      {tierLabels[tier]}
    </Badge>
  );
}

// ── Order Status Badge ───────────────────────────────────────

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending:    'warning',
  processing: 'accent',
  shipped:    'accent',
  delivered:  'success',
  cancelled:  'danger',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'Pending',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

interface OrderStatusBadgeProps {
  status:    OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} dot className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ── Rank Badge ───────────────────────────────────────────────

interface RankBadgeProps {
  rank:      number;
  className?: string;
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  const variant: BadgeVariant =
    rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'default';
  const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <Badge variant={variant} className={className}>
      {rank <= 3 ? emoji : `#${rank}`}
    </Badge>
  );
}

// ── Category Badge ───────────────────────────────────────────

interface CategoryBadgeProps {
  category:  string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <Badge variant="default" className={className}>
      {category}
    </Badge>
  );
}

export default Badge;
