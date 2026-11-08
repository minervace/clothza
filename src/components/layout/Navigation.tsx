// ============================================================
// components/layout/Navigation.tsx — Clothza v4.0
// Floating pill-shaped glass navbar + mobile bottom tab bar
// Scroll > 80px → height shrinks + blur intensifies
// ============================================================

import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sun, Moon, Heart, ShoppingCart, User,
  LogOut, LayoutDashboard, ShieldCheck, Package,
  Home, BookOpen, Sparkles, ChevronDown, Monitor,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMarketplace } from '@/hooks/useMarketplace';
import type { ThemePreference } from '@/hooks/useTheme';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDebounce } from '@/hooks/useDebounce';
import { isSupabaseConfigured } from '@/lib/supabase';

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'Auto',
};

const THEME_NEXT: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

export function Navigation() {
  const {
    state, themePreference, cycleTheme, cartCount, logout,
    searchAll,
  } = useMarketplace();
  const { currentUser, favorites } = state;
  const navigate  = useNavigate();
  const location  = useLocation();

  const [scrolled,        setScrolled]        = useState(false);
  const [searchOpen,      setSearchOpen]       = useState(false);
  const [searchQuery,     setSearchQuery]      = useState('');
  const [userMenuOpen,    setUserMenuOpen]     = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchResults  = debouncedQuery.length > 1 ? searchAll(debouncedQuery) : null;

  // Track scroll position
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setSearchOpen(false);
    setUserMenuOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Click-outside refs
  const userMenuRef   = useClickOutside<HTMLDivElement>(() => setUserMenuOpen(false));
  const searchRef     = useClickOutside<HTMLDivElement>(() => setSearchOpen(false));

  // Keyboard shortcut: Ctrl+K → open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Admin shortcut: Ctrl+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const favCount =
    favorites.products.length + favorites.stores.length;

  const navLinks = [
    { to: '/',         label: 'Browse'       },
    { to: '/lookbooks', label: 'Lookbooks'   },
    { to: '/studio',   label: '✨ Studio'    },
  ];

  return (
    <>
      {/* ── Desktop Floating Navbar ─────────────────────── */}
      <nav className="nav-wrapper" aria-label="Main navigation">
        <motion.div
          className={clsx('nav-pill glass-nav', scrolled && 'scrolled')}
          animate={{ paddingTop: scrolled ? 8 : 12, paddingBottom: scrolled ? 8 : 12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <Link to="/" className="nav-logo text-gradient" aria-label="Clothza home">
            Clothza
          </Link>

          {/* Center links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  clsx('nav-link', isActive && 'active')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Search */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost btn-icon"
                aria-label="Search stores and products"
                onClick={() => setSearchOpen(v => !v)}
              >
                <Search size={17} />
              </button>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{    opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position:     'absolute',
                      top:          'calc(100% + 10px)',
                      right:        0,
                      width:        340,
                      background:   'var(--bg-card)',
                      border:       '1px solid var(--border)',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow:    'var(--shadow-elevated)',
                      overflow:     'hidden',
                      zIndex:       'var(--z-dropdown)',
                    }}
                  >
                    {/* Input */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ position: 'relative' }}>
                        <Search
                          size={15}
                          color="var(--text-tertiary)"
                          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                          autoFocus
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search stores, products…"
                          className="input-base"
                          style={{ paddingLeft: 32, fontSize: 'var(--text-body)' }}
                          aria-label="Search"
                        />
                      </div>
                    </div>

                    {/* Results */}
                    {searchResults && (
                      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {searchResults.stores.length === 0 && searchResults.products.length === 0 ? (
                          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-body)' }}>
                            No results for &ldquo;{debouncedQuery}&rdquo;
                          </div>
                        ) : (
                          <>
                            {searchResults.stores.slice(0, 3).map(store => (
                              <button
                                key={store.id}
                                onClick={() => { navigate(`/store/${store.slug}`); setSearchOpen(false); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  width: '100%', padding: '10px 16px', background: 'none',
                                  border: 'none', cursor: 'pointer', textAlign: 'left',
                                  transition: 'background var(--dur-fast) var(--spring)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                              >
                                <img src={store.logo} alt="" width={32} height={32} style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} loading="lazy" />
                                <div>
                                  <div style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--text-primary)' }}>{store.name}</div>
                                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{store.location}</div>
                                </div>
                              </button>
                            ))}
                            {searchResults.products.slice(0, 4).map(prod => (
                              <button
                                key={prod.id}
                                onClick={() => { navigate(`/product/${prod.id}`); setSearchOpen(false); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  width: '100%', padding: '10px 16px', background: 'none',
                                  border: 'none', cursor: 'pointer', textAlign: 'left',
                                  transition: 'background var(--dur-fast) var(--spring)',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                              >
                                <img src={prod.images[0]} alt="" width={32} height={40} style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} loading="lazy" />
                                <div>
                                  <div style={{ fontSize: 'var(--text-body)', fontWeight: 500, color: 'var(--text-primary)' }}>{prod.name}</div>
                                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{prod.category}</div>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {!searchResults && (
                      <div style={{ padding: '16px', color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)', textAlign: 'center' }}>
                        Type to search stores and products…
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme: light → dark → auto */}
            <motion.button
              className="btn btn-ghost btn-icon"
              aria-label={`Theme: ${THEME_LABELS[themePreference]}. Switch to ${THEME_LABELS[THEME_NEXT[themePreference]]}.`}
              title={`Theme: ${THEME_LABELS[themePreference]}`}
              onClick={cycleTheme}
              whileTap={{ rotate: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={themePreference}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{    rotate:  90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex' }}
                >
                  {themePreference === 'system'
                    ? <Monitor size={17} />
                    : themePreference === 'dark'
                      ? <Moon size={17} />
                      : <Sun size={17} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {/* Favorites */}
            <Link
              to="/favorites"
              className="btn btn-ghost btn-icon"
              aria-label={`Favorites (${favCount})`}
              style={{ position: 'relative' }}
            >
              <Heart size={17} />
              {favCount > 0 && (
                <motion.span
                  key={favCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  style={{
                    position:     'absolute',
                    top:          -4,
                    right:        -4,
                    background:   'var(--accent)',
                    color:        'var(--accent-fg)',
                    fontSize:     9,
                    fontWeight:   700,
                    width:        16,
                    height:       16,
                    borderRadius: '50%',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                  }}
                >
                  {favCount > 9 ? '9+' : favCount}
                </motion.span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/checkout"
              className="btn btn-ghost btn-icon"
              aria-label={`Cart (${cartCount} items)`}
              style={{ position: 'relative' }}
            >
              <ShoppingCart size={17} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{    scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    style={{
                      position:     'absolute',
                      top:          -4,
                      right:        -4,
                      background:   'var(--accent)',
                      color:        'var(--accent-fg)',
                      fontSize:     9,
                      fontWeight:   700,
                      width:        16,
                      height:       16,
                      borderRadius: '50%',
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center',
                    }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* User dropdown */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost btn-icon"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                onClick={() => setUserMenuOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    width={26}
                    height={26}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <User size={17} />
                )}
                <ChevronDown
                  size={13}
                  style={{
                    transition: 'transform var(--dur-fast) var(--spring)',
                    transform:  userMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{    opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position:     'absolute',
                      top:          'calc(100% + 10px)',
                      right:        0,
                      minWidth:     200,
                      background:   'var(--bg-card)',
                      border:       '1px solid var(--border)',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow:    'var(--shadow-elevated)',
                      overflow:     'hidden',
                      zIndex:       'var(--z-dropdown)',
                    }}
                  >
                    {currentUser ? (
                      <>
                        {/* User info */}
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{currentUser.name}</div>
                          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>{currentUser.email}</div>
                        </div>

                        {/* Menu items */}
                        {(currentUser.role === 'seller' || currentUser.role === 'admin') && (
                          <DropdownItem icon={<LayoutDashboard size={15} />} label="Dashboard" to="/dashboard" />
                        )}
                        <DropdownItem icon={<Package size={15} />} label="My Orders" to="/orders" />
                        {currentUser.role === 'admin' && (
                          <DropdownItem icon={<ShieldCheck size={15} />} label="Admin Panel" to="/admin" />
                        )}

                        <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          style={{
                            display:    'flex', alignItems: 'center', gap: 10,
                            width:      '100%', padding: '10px 16px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color:      'var(--danger)', fontSize: 'var(--text-body)',
                            fontWeight: 500, textAlign: 'left',
                            transition: 'background var(--dur-fast) var(--spring)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                        >
                          <LogOut size={15} /> Sign out
                        </button>
                      </>
                    ) : (
                      <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Link to="/signin" className="btn btn-primary" style={{ textAlign: 'center' }} onClick={() => setUserMenuOpen(false)}>
                          Sign in
                        </Link>
                        {!isSupabaseConfigured && (
                          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '0 8px' }}>
                            demo@clothza.com / demo1234
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* ── Mobile Bottom Tab Bar ───────────────────────── */}
      <MobileTabBar cartCount={cartCount} favCount={favCount} themePreference={themePreference} onCycleTheme={cycleTheme} />
    </>
  );
}

// ── Dropdown Item Helper ─────────────────────────────────────

function DropdownItem({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        display:    'flex', alignItems: 'center', gap: 10,
        width:      '100%', padding: '10px 16px',
        background: 'none', border: 'none', cursor: 'pointer',
        color:      'var(--text-secondary)', fontSize: 'var(--text-body)',
        fontWeight: 500, textAlign: 'left',
        transition: 'background var(--dur-fast) var(--spring), color var(--dur-fast) var(--spring)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-secondary)';
        e.currentTarget.style.color      = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.color      = 'var(--text-secondary)';
      }}
    >
      {icon} {label}
    </button>
  );
}

// ── Mobile Bottom Tab Bar ────────────────────────────────────

function MobileTabBar({ cartCount: _cartCount, favCount, themePreference, onCycleTheme }: { cartCount: number; favCount: number; themePreference: ThemePreference; onCycleTheme: () => void }) {
  const location = useLocation();

  const tabs = [
    { to: '/',         icon: Home,         label: 'Browse'    },
    { to: '/lookbooks', icon: BookOpen,    label: 'Lookbooks' },
    { to: '/studio',   icon: Sparkles,     label: 'Studio'    },
    { to: '/favorites', icon: Heart,     label: 'Saved',    badge: favCount },
    { to: '/orders',    icon: User,       label: 'Orders'   },
  ];

  return (
    <div className="bottom-tab-bar" role="navigation" aria-label="Mobile navigation">
      {tabs.map(tab => {
        const Icon    = tab.icon;
        const isActive = location.pathname === tab.to ||
          (tab.to !== '/' && location.pathname.startsWith(tab.to));
        return (
          <Link
            key={tab.label}
            to={tab.to}
            className={clsx('bottom-tab-item', isActive && 'active')}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            style={{ position: 'relative' }}
          >
            <Icon size={22} />
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: '50%', transform: 'translateX(10px)',
                background: 'var(--accent)', color: 'var(--accent-fg)',
                fontSize: 9, fontWeight: 700, width: 14, height: 14,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
            <span className="bottom-tab-label">{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onCycleTheme}
        className="bottom-tab-item"
        aria-label={`Theme: ${THEME_LABELS[themePreference]}. Switch to ${THEME_LABELS[THEME_NEXT[themePreference]]}.`}
        style={{ background: 'none', border: 'none', font: 'inherit' }}
      >
        {themePreference === 'system'
          ? <Monitor size={22} />
          : themePreference === 'dark'
            ? <Moon size={22} />
            : <Sun size={22} />}
        <span className="bottom-tab-label">{THEME_LABELS[themePreference]}</span>
      </button>
    </div>
  );
}

export default Navigation;
