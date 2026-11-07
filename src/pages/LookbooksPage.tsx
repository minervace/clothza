// ============================================================
// pages/LookbooksPage.tsx — Clothza v4.0
// Community lookbook gallery: masonry grid, filter tabs,
// sort options, stylist leaderboard
// ============================================================

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Sparkles, BadgeCheck, Grid3X3, LayoutList, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition, SectionReveal } from '@/components/layout/PageTransition';
import { LookbookCard } from '@/components/community/LookbookCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RankBadge } from '@/components/ui/Badge';
import { formatCompactNumber } from '@/lib/formatters';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Lookbook } from '@/context/MarketplaceContext';

type SortKey  = 'trending' | 'newest' | 'most-liked' | 'official';
type ViewMode = 'grid' | 'masonry' | 'list';

const SORT_TABS: Array<{ key: SortKey; label: string; icon: typeof TrendingUp }> = [
  { key: 'trending',   label: 'Trending',   icon: Flame       },
  { key: 'newest',     label: 'Newest',     icon: Sparkles    },
  { key: 'most-liked', label: 'Most Liked', icon: Trophy      },
  { key: 'official',   label: 'Official',   icon: BadgeCheck  },
];

function MasonryGrid({ lookbooks }: { lookbooks: Lookbook[] }) {
  const isNarrow = useMediaQuery('(max-width: 640px)');

  // On phones the columns would stack and scramble the ranking order,
  // so fall back to a single ordered column.
  if (isNarrow) {
    return (
      <div className="masonry-grid masonry-grid--single">
        {lookbooks.map((lb, i) => (
          <SectionReveal key={lb.id} delay={(i % 8) * 0.06}>
            <LookbookCard lookbook={lb} rank={i + 1} />
          </SectionReveal>
        ))}
      </div>
    );
  }

  // Split into 3 columns for masonry effect
  const columns: Lookbook[][] = [[], [], []];
  lookbooks.forEach((lb, i) => columns[i % 3]!.push(lb));

  return (
    <div className="masonry-grid">
      {columns.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {col.map((lb, i) => {
            const globalIdx = ci + i * 3;
            return (
              <SectionReveal key={lb.id} delay={i * 0.06}>
                <LookbookCard lookbook={lb} rank={globalIdx + 1} />
              </SectionReveal>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function LookbooksPage() {
  const { state, getStylistRankings } = useMarketplace();
  const [sort, setSort]   = useState<SortKey>('trending');
  const [view, setView]   = useState<ViewMode>('masonry');
  const rankings          = getStylistRankings();

  const sorted = useMemo<Lookbook[]>(() => {
    const base = [...state.lookbooks];
    switch (sort) {
      case 'newest':
        return base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'most-liked':
        return base.sort((a, b) => b.likes - a.likes);
      case 'official':
        return base.filter(lb => lb.isOfficial).sort((a, b) => b.likes - a.likes);
      case 'trending':
      default:
        // Trending = weighted score: likes × 2 + views × 0.1 (recency dampened)
        return base.sort((a, b) => {
          const scoreA = a.likes * 2 + a.views * 0.1;
          const scoreB = b.likes * 2 + b.views * 0.1;
          return scoreB - scoreA;
        });
    }
  }, [state.lookbooks, sort]);

  return (
    <PageTransition>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop:    100,
          paddingBottom: 72,
          textAlign:     'center',
          background:    'var(--bg-primary)',
          position:      'relative',
          overflow:      'hidden',
          borderBottom:  '1px solid var(--border)',
        }}
      >
        {/* Background orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '30vw', height: '30vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(122,193,131,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '25vw', height: '25vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(210,168,101,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-light)', color: 'var(--accent)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-overline)', fontWeight: 700, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', marginBottom: 24 }}>
              <Trophy size={12} /> Community Lookbooks
            </div>
            <h1
              style={{
                fontFamily:    'var(--font-serif)',
                fontSize:      'clamp(40px, 8vw, 76px)',
                fontWeight:    800,
                color:         'var(--text-primary)',
                lineHeight:    'var(--leading-tight)',
                letterSpacing: '-0.03em',
              }}
            >
              Style, curated
              <br />
              <span className="text-gradient">by the community.</span>
            </h1>
            <p style={{ fontSize: 'var(--text-subtitle)', color: 'var(--text-secondary)', marginTop: 20, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 'var(--leading-relaxed)' }}>
              Every lookbook is a story. Browse editorial collections crafted by our tastemakers — or build your own in the Studio.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
              <Link to="/studio" className="btn btn-accent btn-pill btn-lg">
                <Sparkles size={15} /> Create a Lookbook
              </Link>
              <a href="#lookbooks" className="btn btn-outline btn-pill btn-lg">Browse All</a>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 48 }}>
              {[
                { label: 'Lookbooks',  value: state.lookbooks.length },
                { label: 'Stylists',   value: rankings.length        },
                { label: 'Total Likes', value: state.lookbooks.reduce((s, lb) => s + lb.likes, 0) },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {formatCompactNumber(item.value)}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Top Stylists Leaderboard ─────────────────────────── */}
      {rankings.length > 0 && (
        <SectionReveal>
          <section style={{ padding: '56px 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div className="container">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <Trophy size={20} color="var(--tier-gold)" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Top Stylists
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
                {rankings.slice(0, 8).map((rank, i) => (
                  <motion.div
                    key={rank.creator}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4 }}
                    style={{
                      background:   'var(--bg-card)',
                      border:       `1px solid ${i < 3 ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-xl)',
                      padding:      'var(--space-5)',
                      minWidth:     160,
                      flexShrink:   0,
                      display:      'flex',
                      flexDirection: 'column',
                      alignItems:   'center',
                      gap:          10,
                      textAlign:    'center',
                      cursor:       'default',
                    }}
                  >
                    <RankBadge rank={i + 1} />
                    {/* Avatar with gradient */}
                    <div
                      style={{
                        width:        52,
                        height:       52,
                        borderRadius: '50%',
                        background:   `hsl(${(i * 47 + 120) % 360}, 65%, 55%)`,
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'center',
                        fontSize:     20,
                        fontWeight:   800,
                        color:        '#fff',
                        border:       i < 3 ? '2px solid var(--accent)' : 'none',
                        flexShrink:   0,
                      }}
                    >
                      {rank.creator.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 1.2 }}>{rank.creator}</div>
                      <div style={{ fontSize: 'var(--text-overline)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {formatCompactNumber(rank.totalLikes)} ♥ · {rank.lookbooks.length} {rank.lookbooks.length === 1 ? 'look' : 'looks'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </SectionReveal>
      )}

      {/* ── Lookbook Gallery ─────────────────────────────────── */}
      <section id="lookbooks" style={{ padding: '56px 0 80px' }}>
        <div className="container">
          {/* Controls bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            {/* Sort tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 'var(--radius-lg)' }}>
              {SORT_TABS.map(tab => {
                const Icon     = tab.icon;
                const isActive = sort === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSort(tab.key)}
                    aria-pressed={isActive}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          6,
                      padding:      '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      border:       'none',
                      cursor:       'pointer',
                      background:   isActive ? 'var(--bg-card)' : 'transparent',
                      color:        isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontWeight:   isActive ? 700 : 500,
                      fontSize:     'var(--text-body)',
                      fontFamily:   'var(--font-sans)',
                      transition:   'all var(--dur-fast) var(--spring)',
                      boxShadow:    isActive ? 'var(--shadow-card)' : 'none',
                      whiteSpace:   'nowrap',
                    }}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Count + view toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
                {sorted.length} look{sorted.length !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 2, background: 'var(--bg-secondary)', padding: 3, borderRadius: 'var(--radius-md)' }}>
                {([['grid', Grid3X3], ['masonry', Grid3X3], ['list', LayoutList]] as const).map(([v, Icon]) => (
                  <button
                    key={v}
                    onClick={() => setView(v as ViewMode)}
                    aria-label={`${v} view`}
                    aria-pressed={view === v}
                    style={{
                      padding:      '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border:       'none',
                      cursor:       'pointer',
                      background:   view === v ? 'var(--bg-card)' : 'transparent',
                      color:        view === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      display:      'flex',
                      alignItems:   'center',
                      transition:   'all var(--dur-fast) var(--spring)',
                    }}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            {sorted.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState
                  icon="Layers"
                  title={sort === 'official' ? 'No official lookbooks yet' : 'No lookbooks yet'}
                  description="Be the first to create one in the Style Studio!"
                  cta="Open Studio"
                  ctaLink="/studio"
                />
              </motion.div>
            ) : view === 'masonry' ? (
              <motion.div key="masonry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <MasonryGrid lookbooks={sorted} />
              </motion.div>
            ) : (
              <motion.div
                key={view}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display:             'grid',
                  gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
                  gap:                 view === 'grid' ? 24 : 14,
                }}
              >
                {sorted.map((lb, i) => (
                  <SectionReveal key={lb.id} delay={(i % 8) * 0.04}>
                    <LookbookCard lookbook={lb} rank={i + 1} />
                  </SectionReveal>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  );
}
