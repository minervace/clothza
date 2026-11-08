// ============================================================
// pages/HomePage.tsx — Clothza v4.0
// Browse page: hero + filters + store/product grids
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, SlidersHorizontal,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMarketplace } from '@/hooks/useMarketplace';
import { PageTransition, SectionReveal } from '@/components/layout/PageTransition';
import { ProductCard } from '@/components/commerce/ProductCard';
import { StoreCard } from '@/components/commerce/StoreCard';
import { LookbookCard } from '@/components/community/LookbookCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCompactNumber } from '@/lib/formatters';
import type { ProductCategory } from '@/context/MarketplaceContext';

type SortOption = 'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'popular';

const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Relevance',
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Top rated',
  popular: 'Most popular',
};

const CATEGORIES: Array<ProductCategory | 'All'> = ['All', 'Women', 'Men', 'Accessories', 'Footwear', 'Kids'];
const VIEW_MODES  = ['stores', 'products', 'lookbooks'] as const;
type ViewMode = typeof VIEW_MODES[number];

export default function HomePage() {
  const { state, searchAll } = useMarketplace();
  const [query,      setQuery]    = useState('');
  const [view,       setView]     = useState<ViewMode>('stores');
  const [category,   setCategory] = useState<ProductCategory | 'All'>('All');
  const [sort,       setSort]     = useState<SortOption>('relevance');
  const [showFilter, setShowFilter] = useState(false);
  const [priceMin,   setPriceMin] = useState('');
  const [priceMax,   setPriceMax] = useState('');
  const [onlyBestSeller, setOnlyBestSeller] = useState(false);
  const [onlyTrending,   setOnlyTrending]   = useState(false);

  // Collapse the toolbar to a single row while scrolling down (phones only)
  const [compactBar, setCompactBar] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 120) setCompactBar(false);
      else if (y > lastY + 8) setCompactBar(true);
      else if (y < lastY - 8) setCompactBar(false);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const debouncedQuery = useDebounce(query, 250);

  // Filtered + sorted results
  const filteredStores = useMemo(() => {
    let stores = debouncedQuery
      ? searchAll(debouncedQuery).stores
      : state.stores;

    if (sort === 'rating')  stores = [...stores].sort((a, b) => b.rating - a.rating);
    if (sort === 'popular') stores = [...stores].sort((a, b) => b.views - a.views);

    return stores;
  }, [debouncedQuery, state.stores, sort, searchAll]);

  const filteredProducts = useMemo(() => {
    let products = debouncedQuery
      ? searchAll(debouncedQuery).products
      : state.products;

    if (category !== 'All')     products = products.filter(p => p.category === category);
    if (onlyBestSeller)         products = products.filter(p => p.isBestSeller);
    if (onlyTrending)           products = products.filter(p => p.isTrending);
    if (priceMin)               products = products.filter(p => p.price >= Number(priceMin));
    if (priceMax)               products = products.filter(p => p.price <= Number(priceMax));

    switch (sort) {
      case 'newest':    return [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'price-asc': return [...products].sort((a, b) => a.price - b.price);
      case 'price-desc':return [...products].sort((a, b) => b.price - a.price);
      case 'rating':    return [...products].sort((a, b) => b.rating - a.rating);
      case 'popular':   return [...products].sort((a, b) => b.views - a.views);
      default:          return products;
    }
  }, [debouncedQuery, state.products, category, sort, onlyBestSeller, onlyTrending, priceMin, priceMax, searchAll]);

  const filteredLookbooks = useMemo(() => {
    return [...state.lookbooks].sort((a, b) => b.likes - a.likes);
  }, [state.lookbooks]);

  const heroCovers = useMemo(
    () =>
      state.lookbooks
        .map(lb => lb.coverImage)
        .filter((src): src is string => Boolean(src))
        .slice(0, 3),
    [state.lookbooks]
  );

  const resetFilters = useCallback(() => {
    setCategory('All');
    setPriceMin('');
    setPriceMax('');
    setOnlyBestSeller(false);
    setOnlyTrending(false);
    setSort('relevance');
    setQuery('');
  }, []);

  const activeFilterCount = [
    category !== 'All',
    !!priceMin,
    !!priceMax,
    onlyBestSeller,
    onlyTrending,
    sort !== 'relevance',
  ].filter(Boolean).length;

  const activeChips: Array<{ key: string; label: string; clear: () => void }> = [];
  if (category !== 'All') activeChips.push({ key: 'cat', label: category, clear: () => setCategory('All') });
  if (priceMin) activeChips.push({ key: 'min', label: `≥ रू${Number(priceMin).toLocaleString('en-IN')}`, clear: () => setPriceMin('') });
  if (priceMax) activeChips.push({ key: 'max', label: `≤ रू${Number(priceMax).toLocaleString('en-IN')}`, clear: () => setPriceMax('') });
  if (onlyBestSeller) activeChips.push({ key: 'best', label: 'Best sellers', clear: () => setOnlyBestSeller(false) });
  if (onlyTrending) activeChips.push({ key: 'trend', label: 'Trending', clear: () => setOnlyTrending(false) });
  if (sort !== 'relevance') activeChips.push({ key: 'sort', label: `Sort: ${SORT_LABELS[sort]}`, clear: () => setSort('relevance') });

  return (
    <PageTransition>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop:    '100px',
          paddingBottom: '64px',
          background:    'var(--bg-primary)',
          position:      'relative',
          overflow:      'hidden',
        }}
      >
        {/* Background gradient orbs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(122,193,131,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(210,168,101,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-grid">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: 680 }}
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-light)', color: 'var(--accent)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-overline)', fontWeight: 700, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', marginBottom: 24 }}
            >
              <Sparkles size={12} />
              {formatCompactNumber(state.products.length)}+ pieces · {state.stores.length} boutiques
            </motion.div>

            {/* Headline */}
            <h1
              style={{
                fontFamily:    'var(--font-serif)',
                fontSize:      'clamp(40px, 5.3vw, 68px)',
                fontWeight:    800,
                letterSpacing: '-0.03em',
                lineHeight:    'var(--leading-tight)',
                color:         'var(--text-primary)',
                marginBottom:  20,
              }}
            >
              Where designers
              <br />
              meet{' '}
              <span className="text-gradient">tastemakers.</span>
            </h1>

            <p style={{ fontSize: 'var(--text-subtitle)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', maxWidth: 520 }}>
              Discover South Asia's most curated independent boutiques. Shop limited editions, style your own lookbooks, and join a community that cares about craft.
            </p>

            {/* Hero CTA */}
            <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
              <motion.button
                onClick={() => setView('products')}
                className="btn btn-accent btn-pill btn-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Explore Products <ArrowRight size={16} />
              </motion.button>
              <Link to="/lookbooks" className="btn btn-outline btn-pill btn-lg">
                Browse Lookbooks
              </Link>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
              {[
                { label: 'Boutiques', value: state.stores.length       },
                { label: 'Products',  value: state.products.length     },
                { label: 'Lookbooks', value: state.lookbooks.length    },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {formatCompactNumber(item.value)}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {heroCovers.length > 0 && (
            <div className="hero-collage" aria-hidden="true">
              {heroCovers.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`hero-collage-img hero-collage-img--${i}`}
                />
              ))}
            </div>
          )}
          </div>
        </div>
      </section>

      {/* ── Search + View Toggle Bar ─────────────────────────── */}
      <div className={compactBar ? 'browse-toolbar browse-toolbar--compact' : 'browse-toolbar'}>
        <div className="container browse-toolbar__inner">
          {/* Search input */}
          <div className="browse-search" style={{ flex: 1, position: 'relative', minWidth: 220 }}>
            <Search size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              id="home-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search boutiques, products, styles…"
              aria-label="Search"
              className="input-base"
              style={{ paddingLeft: 36, paddingRight: query ? 36 : 12 }}
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="browse-toolbar__controls">
          <button
            type="button"
            className="browse-compact-search"
            aria-label="Show search"
            onClick={() => { setCompactBar(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <Search size={15} />
          </button>
          {/* View mode pills */}
          <div className="browse-toolbar__tabs" style={{ display: 'flex', gap: 2, background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-lg)' }}>
            {VIEW_MODES.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={view === v ? 'seg-btn seg-btn--active' : 'seg-btn'}
                style={{
                  background: view === v ? 'var(--bg-card)' : 'transparent',
                  color: view === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow: view === v ? 'var(--shadow-card)' : 'none',
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Filter button */}
          {view === 'products' && (
            <button
              onClick={() => setShowFilter(v => !v)}
              aria-expanded={showFilter}
              aria-label="Toggle filters"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 'var(--radius-lg)',
                border: `1px solid ${showFilter ? 'var(--accent)' : 'var(--border)'}`,
                background: showFilter ? 'var(--accent-light)' : 'transparent',
                color: showFilter ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: 500, fontSize: 'var(--text-body)', fontFamily: 'var(--font-sans)',
                cursor: 'pointer', transition: 'all var(--dur-fast) var(--spring)',
              }}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{ background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Sort selector */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            aria-label="Sort results"
            className="input-base browse-sort"
            style={{ width: 'auto' }}
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Most Popular</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
          </select>
          </div>
        </div>

        {activeChips.length > 0 && view === 'products' && (
          <div className="container">
            <div className="browse-toolbar__chips">
              {activeChips.map(chip => (
                <button
                  key={chip.key}
                  type="button"
                  className="chip"
                  onClick={chip.clear}
                  aria-label={`Clear filter: ${chip.label}`}
                >
                  {chip.label}
                  <X size={11} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter panel */}
        <AnimatePresence>
          {showFilter && view === 'products' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
            >
              <div className="container" style={{ padding: '16px 0', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Categories */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      aria-pressed={category === cat}
                      style={{
                        padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                        border: `1px solid ${category === cat ? 'var(--accent)' : 'var(--border)'}`,
                        background: category === cat ? 'var(--accent-light)' : 'transparent',
                        color: category === cat ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: 'var(--text-caption)', fontWeight: category === cat ? 700 : 500,
                        cursor: 'pointer', transition: 'all var(--dur-fast) var(--spring)',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

                {/* Price range */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" placeholder="Min रू" value={priceMin} onChange={e => setPriceMin(e.target.value)} aria-label="Minimum price" className="input-base" style={{ width: 90 }} min={0} />
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}>–</span>
                  <input type="number" placeholder="Max रू" value={priceMax} onChange={e => setPriceMax(e.target.value)} aria-label="Maximum price" className="input-base" style={{ width: 90 }} min={0} />
                </div>

                <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

                {/* Toggles */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { label: '🏆 Best Sellers', state: onlyBestSeller, setter: setOnlyBestSeller },
                    { label: '🔥 Trending',     state: onlyTrending,   setter: setOnlyTrending   },
                  ].map(toggle => (
                    <button
                      key={toggle.label}
                      onClick={() => toggle.setter(v => !v)}
                      aria-pressed={toggle.state}
                      style={{
                        padding: '5px 12px', borderRadius: 'var(--radius-pill)',
                        border: `1px solid ${toggle.state ? 'var(--accent)' : 'var(--border)'}`,
                        background: toggle.state ? 'var(--accent-light)' : 'transparent',
                        color: toggle.state ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: 'var(--text-caption)', fontWeight: toggle.state ? 700 : 500,
                        cursor: 'pointer', transition: 'all var(--dur-fast) var(--spring)',
                      }}
                    >
                      {toggle.label}
                    </button>
                  ))}
                </div>

                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Reset all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Content area ─────────────────────────────────────── */}
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        {/* Stores view */}
        <AnimatePresence mode="wait">
          {view === 'stores' && (
            <motion.div key="stores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {/* Sponsored */}
              {filteredStores.some(s => s.isSponsored) && (
                <SectionReveal>
                  <div style={{ marginBottom: 48 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <span style={{ fontSize: 'var(--text-overline)', fontWeight: 700, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Sponsored</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 24 }}>
                      {filteredStores.filter(s => s.isSponsored).map(store => (
                        <StoreCard key={store.id} store={store} />
                      ))}
                    </div>
                  </div>
                </SectionReveal>
              )}

              {/* All boutiques */}
              <SectionReveal>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {debouncedQuery ? `Results for "${debouncedQuery}"` : 'All Boutiques'}
                  </h2>
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                    {filteredStores.filter(s => !s.isSponsored).length}
                  </span>
                </div>
                {filteredStores.filter(s => !s.isSponsored).length === 0 ? (
                  <EmptyState icon="SearchX" title="No boutiques found" description={`No results for "${debouncedQuery}"`} cta="Clear Search" onCtaClick={() => setQuery('')} />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 24 }}>
                    {filteredStores.filter(s => !s.isSponsored).map((store, i) => (
                      <SectionReveal key={store.id} delay={i * 0.04}>
                        <StoreCard store={store} />
                      </SectionReveal>
                    ))}
                  </div>
                )}
              </SectionReveal>
            </motion.div>
          )}

          {/* Products view */}
          {view === 'products' && (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {debouncedQuery ? `"${debouncedQuery}"` : 'All Products'}
                </h2>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                  {filteredProducts.length}
                </span>
              </div>
              {filteredProducts.length === 0 ? (
                <EmptyState icon="SearchX" title="No products found" description="Try adjusting your filters or search query." cta="Reset Filters" onCtaClick={resetFilters} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                  {filteredProducts.map((p, i) => (
                    <SectionReveal key={p.id} delay={(i % 12) * 0.03}>
                      <ProductCard product={p} eager={i < 8} />
                    </SectionReveal>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Lookbooks view */}
          {view === 'lookbooks' && (
            <motion.div key="lookbooks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>Community Lookbooks</h2>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                  {filteredLookbooks.length}
                </span>
              </div>
              {filteredLookbooks.length === 0 ? (
                <EmptyState icon="Layers" title="No lookbooks yet" description="Be the first to create one in the Style Studio!" cta="Open Studio" ctaLink="/studio" />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 24 }}>
                  {filteredLookbooks.map((lb, i) => (
                    <SectionReveal key={lb.id} delay={i * 0.04}>
                      <LookbookCard lookbook={lb} rank={i + 1} />
                    </SectionReveal>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
