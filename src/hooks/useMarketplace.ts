// ============================================================
// hooks/useMarketplace.ts — Clothza v4.0
// Access the marketplace store from any component inside the
// provider. Kept out of the context module so Fast Refresh
// works while editing the provider.
// ============================================================

import { useContext } from 'react';
import MarketplaceContext, { type MarketplaceContextValue } from '@/context/MarketplaceContext';

export function useMarketplace(): MarketplaceContextValue {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) {
    throw new Error('useMarketplace must be used within a <MarketplaceProvider>');
  }
  return ctx;
}
