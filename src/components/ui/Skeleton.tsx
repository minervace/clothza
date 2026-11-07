// ============================================================
// components/ui/Skeleton.tsx — Clothza v4.0
// Shimmer loading placeholders for all content shapes
// ============================================================

import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  width?:     string | number;
  height?:    string | number;
  circle?:    boolean;
  lines?:     number;   // render N stacked text skeleton lines
  style?:     React.CSSProperties;
}

export function Skeleton({ className, width, height, circle, lines, style }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton-text"
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(circle ? 'skeleton-circle' : 'skeleton', className)}
      style={{
        width:  width  ?? '100%',
        height: height ?? (circle ? width : '100%'),
        borderRadius: circle ? '50%' : undefined,
        flexShrink: 0,
        ...style,
      }}
      aria-busy="true"
      aria-label="Loading…"
      role="status"
    />
  );
}

// ── Product Card Skeleton ────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Image placeholder */}
      <Skeleton height={320} style={{ borderRadius: 0 }} />
      {/* Content */}
      <div style={{ padding: '16px' }}>
        <Skeleton height={10} width="50%" className="skeleton-text" />
        <div style={{ marginTop: 8 }}>
          <Skeleton height={16} width="80%" className="skeleton-text" />
        </div>
        <div style={{ marginTop: 6 }}>
          <Skeleton height={12} width="40%" className="skeleton-text" />
        </div>
        <div style={{ marginTop: 12 }}>
          <Skeleton height={20} width="30%" className="skeleton-text" />
        </div>
      </div>
    </div>
  );
}

// ── Store Card Skeleton ──────────────────────────────────────

export function StoreCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <Skeleton height={180} style={{ borderRadius: 0 }} />
      <div style={{ padding: '20px', display: 'flex', gap: 12 }}>
        <Skeleton width={56} height={56} circle />
        <div style={{ flex: 1 }}>
          <Skeleton height={16} width="60%" className="skeleton-text" />
          <div style={{ marginTop: 6 }}>
            <Skeleton height={12} width="40%" className="skeleton-text" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lookbook Card Skeleton ───────────────────────────────────

export function LookbookCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <Skeleton height={280} style={{ borderRadius: 0 }} />
      <div style={{ padding: '16px' }}>
        <Skeleton height={16} width="75%" className="skeleton-text" />
        <div style={{ marginTop: 8 }}>
          <Skeleton height={12} width="90%" className="skeleton-text" />
        </div>
        <div style={{ marginTop: 6 }}>
          <Skeleton height={12} width="60%" className="skeleton-text" />
        </div>
      </div>
    </div>
  );
}

// ── Text Skeleton Lines ──────────────────────────────────────

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return <Skeleton lines={lines} />;
}

export default Skeleton;
