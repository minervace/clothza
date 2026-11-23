import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { MarketplaceProvider } from './context/MarketplaceContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <MarketplaceProvider>
      <App />
    </MarketplaceProvider>
  </StrictMode>
);

// Register the service worker so the site installs and works offline.
// Skipped in dev to avoid stale assets while working.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration is an enhancement; ignore failures.
    });
  });
}
