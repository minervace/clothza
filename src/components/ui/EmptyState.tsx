// ============================================================
// components/ui/EmptyState.tsx — Clothza v4.0
// Reusable empty/null state component with configurable
// icon, heading, description, and CTA button
// ============================================================

import { motion } from 'framer-motion';
import {
  Heart,
  Trophy,
  Search,
  Package,
  ShoppingBag,
  MessageCircle,
  ShoppingCart,
  SearchX,
  Inbox,
  Star,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type EmptyIcon =
  | 'Heart'
  | 'Trophy'
  | 'Search'
  | 'Package'
  | 'ShoppingBag'
  | 'MessageCircle'
  | 'ShoppingCart'
  | 'SearchX'
  | 'Inbox'
  | 'Star'
  | 'Layers';

const ICON_MAP: Record<EmptyIcon, LucideIcon> = {
  Heart:         Heart,
  Trophy:        Trophy,
  Search:        Search,
  Package:       Package,
  ShoppingBag:   ShoppingBag,
  MessageCircle: MessageCircle,
  ShoppingCart:  ShoppingCart,
  SearchX:       SearchX,
  Inbox:         Inbox,
  Star:          Star,
  Layers:        Layers,
};

interface EmptyStateProps {
  icon?:        EmptyIcon;
  title:        string;
  description?: string;
  cta?:         string;
  ctaLink?:     string;
  onCtaClick?:  () => void;
  compact?:     boolean;   // smaller padding for inline use
}

export function EmptyState({
  icon        = 'Inbox',
  title,
  description,
  cta,
  ctaLink,
  onCtaClick,
  compact     = false,
}: EmptyStateProps) {
  const IconComponent = ICON_MAP[icon];

  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ padding: compact ? '40px 24px' : undefined }}
    >
      <IconComponent
        size={compact ? 24 : 30}
        color="var(--text-tertiary)"
        strokeWidth={1.25}
        style={{ marginBottom: 18 }}
      />

      <h3 className="empty-state-title">{title}</h3>

      {description && (
        <p className="empty-state-desc">{description}</p>
      )}

      {/* CTA */}
      {cta && (ctaLink || onCtaClick) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {ctaLink ? (
            <Link
              to={ctaLink}
              className="btn btn-accent"
              style={{ marginTop: 20 }}
            >
              {cta}
            </Link>
          ) : (
            <button
              onClick={onCtaClick}
              className="btn btn-accent"
              style={{ marginTop: 20 }}
            >
              {cta}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default EmptyState;
