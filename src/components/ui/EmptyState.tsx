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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: compact ? '40px 24px' : undefined }}
    >
      {/* Animated icon container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width:        80,
          height:       80,
          borderRadius: '50%',
          background:   'var(--bg-tertiary)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <IconComponent
          size={compact ? 28 : 36}
          color="var(--text-tertiary)"
          strokeWidth={1.25}
        />
      </motion.div>

      <h3 className="empty-state-title">{title}</h3>

      {description && (
        <p className="empty-state-desc">{description}</p>
      )}

      {/* CTA */}
      {cta && (ctaLink || onCtaClick) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {ctaLink ? (
            <Link
              to={ctaLink}
              className="btn btn-accent btn-pill"
              style={{ marginTop: 8 }}
            >
              {cta}
            </Link>
          ) : (
            <button
              onClick={onCtaClick}
              className="btn btn-accent btn-pill"
              style={{ marginTop: 8 }}
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
