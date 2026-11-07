// ============================================================
// App.tsx — Clothza v4.0
// Router + AnimatePresence page transitions + layout shell
// Lazy-loaded pages with Suspense skeletons
// ============================================================

import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/commerce/CartDrawer';
import { ClothzaToaster } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';

// ── Lazy Pages ────────────────────────────────────────────────

const HomePage       = lazy(() => import('@/pages/HomePage'));
const StorePage      = lazy(() => import('@/pages/StorePage'));
const ProductPage    = lazy(() => import('@/pages/ProductPage'));
const LookbooksPage  = lazy(() => import('@/pages/LookbooksPage'));
const LookbookDetail = lazy(() => import('@/pages/LookbookDetailPage'));
const CheckoutPage   = lazy(() => import('@/pages/CheckoutPage'));
const DashboardPage  = lazy(() => import('@/pages/DashboardPage'));
const AdminPage      = lazy(() => import('@/pages/AdminPage'));
const StudioPage     = lazy(() => import('@/pages/StudioPage'));
const OrdersPage     = lazy(() => import('@/pages/OrdersPage'));
const NotFoundPage   = lazy(() => import('@/pages/NotFoundPage'));
const FavoritesPage  = lazy(() => import('@/pages/FavoritesPage'));

// ── Page loading skeleton ────────────────────────────────────

function PageLoader() {
  return (
    <div style={{ padding: '120px var(--space-6) 60px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height={380} style={{ borderRadius: 'var(--radius-xl)' }} />
        ))}
      </div>
    </div>
  );
}

// ── Animated Routes ──────────────────────────────────────────

function AnimatedRoutes({
  cartOpen,
  setCartOpen,
}: {
  cartOpen:    boolean;
  setCartOpen: (v: boolean) => void;
}) {
  const location = useLocation();

  return (
    <>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/"              element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
          <Route path="/store/:slug"   element={<Suspense fallback={<PageLoader />}><StorePage /></Suspense>} />
          <Route path="/product/:id"  element={<Suspense fallback={<PageLoader />}><ProductPage /></Suspense>} />
          <Route path="/lookbooks"     element={<Suspense fallback={<PageLoader />}><LookbooksPage /></Suspense>} />
          <Route path="/lookbooks/:id" element={<Suspense fallback={<PageLoader />}><LookbookDetail /></Suspense>} />
          <Route path="/checkout"      element={<Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense>} />
          <Route path="/dashboard"     element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/admin"         element={<Suspense fallback={<PageLoader />}><AdminPage /></Suspense>} />
          <Route path="/studio"        element={<Suspense fallback={<PageLoader />}><StudioPage /></Suspense>} />
          <Route path="/orders"        element={<Suspense fallback={<PageLoader />}><OrdersPage /></Suspense>} />
          <Route path="/favorites"      element={<Suspense fallback={<PageLoader />}><FavoritesPage /></Suspense>} />
          <Route path="*"              element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

// ── App Shell ────────────────────────────────────────────────

function AppShell() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />

      <main id="main-content" style={{ flex: 1 }}>
        <ErrorBoundary>
          <AnimatedRoutes cartOpen={cartOpen} setCartOpen={setCartOpen} />
        </ErrorBoundary>
      </main>

      <Footer />
      <ClothzaToaster />
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
