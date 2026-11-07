// ============================================================
// lib/constants.ts — Clothza v4.0
// All app-wide constants: routes, categories, provinces, tiers
// ============================================================

// ── Routes ──────────────────────────────────────────────────
export const ROUTES = {
  HOME:            '/',
  STORES:          '/stores',
  STORE:           '/store/:slug',
  PRODUCT:         '/product/:id',
  LOOKBOOKS:       '/lookbooks',
  STYLE_STUDIO:    '/studio',
  CHECKOUT:        '/checkout',
  DASHBOARD:       '/dashboard',
  ADMIN:           '/admin',
  CUSTOMER_ORDERS: '/orders',
  PRIVACY:         '/privacy',
  TERMS:           '/terms',
  NOT_FOUND:       '*',
} as const;

// ── Product Categories ───────────────────────────────────────
export const PRODUCT_CATEGORIES = [
  'Men',
  'Women',
  'Accessories',
  'Footwear',
  'Kids',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// ── Store Themes ─────────────────────────────────────────────
export const STORE_THEMES = [
  'minimalist',
  'streetwear',
  'boho',
  'luxury',
] as const;

export type StoreTheme = typeof STORE_THEMES[number];

// ── User Roles ───────────────────────────────────────────────
export const USER_ROLES = ['customer', 'seller', 'admin'] as const;
export type Role = typeof USER_ROLES[number];

// ── Subscription Tiers ───────────────────────────────────────
export const SUBSCRIPTION_TIERS = ['free', 'bronze', 'silver', 'gold'] as const;
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number];

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free:   'Free',
  bronze: 'Bronze',
  silver: 'Silver',
  gold:   'Gold',
};

export const TIER_LIMITS: Record<SubscriptionTier, { products: number; analytics: boolean; priority: boolean }> = {
  free:   { products: 10,   analytics: false, priority: false },
  bronze: { products: 50,   analytics: true,  priority: false },
  silver: { products: 200,  analytics: true,  priority: false },
  gold:   { products: 9999, analytics: true,  priority: true  },
};

// ── Order Status ─────────────────────────────────────────────
export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'Pending',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending:    'warning',
  processing: 'accent',
  shipped:    'accent',
  delivered:  'success',
  cancelled:  'danger',
};

// ── Payment Methods ──────────────────────────────────────────
export const PAYMENT_METHODS = ['esewa', 'khalti', 'fonepay', 'card'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  esewa:   'eSewa',
  khalti:  'Khalti',
  fonepay: 'Fonepay',
  card:    'Credit / Debit Card',
};

// ── Nepal Provinces ──────────────────────────────────────────
export const NEPAL_PROVINCES = [
  { value: 'province-1',  label: 'Koshi Province (Province No. 1)' },
  { value: 'province-2',  label: 'Madhesh Province (Province No. 2)' },
  { value: 'province-3',  label: 'Bagmati Province (Province No. 3)' },
  { value: 'province-4',  label: 'Gandaki Province (Province No. 4)' },
  { value: 'province-5',  label: 'Lumbini Province (Province No. 5)' },
  { value: 'province-6',  label: 'Karnali Province (Province No. 6)' },
  { value: 'province-7',  label: 'Sudurpashchim Province (Province No. 7)' },
] as const;

/**
 * Flat string array of Nepal province names — used in Select options.
 */
export const NP_PROVINCES: string[] = [
  'Koshi Province',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province',
];

// ── Nepal Cities ─────────────────────────────────────────────
export const NEPAL_CITIES = [
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar',
  'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Bharatpur',
  'Janakpur', 'Itahari', 'Nepalgunj', 'Dhangadhi', 'Tulsipur',
] as const;

// ── Currency ─────────────────────────────────────────────────
export const CURRENCY = {
  code:   'NPR',
  symbol: 'रू',
  name:   'Nepali Rupee',
} as const;

// ── Delivery ─────────────────────────────────────────────────
export const DELIVERY = {
  feeFlat:      150,   // NPR — flat delivery fee
  freeThreshold: 5000, // NPR — free delivery above this
  estimatedDays: '3–5 business days',
} as const;

// ── Admin Security ───────────────────────────────────────────
export const ADMIN_SECURITY = {
  maxAttempts:      5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  localStorageKeyAttempts:   'clothza_admin_attempts',
  localStorageKeyLockedUntil: 'clothza_admin_locked_until',
} as const;

// ── Debounce Delays ──────────────────────────────────────────
export const DEBOUNCE = {
  search:  300,
  resize:  150,
  scroll:  50,
  input:   200,
} as const;

// ── Pagination ───────────────────────────────────────────────
export const PAGINATION = {
  productsPerPage:  12,
  storesPerPage:    9,
  ordersPerPage:    10,
  lookbooksPerPage: 12,
  messagesPerPage:  20,
} as const;

// ── Style Studio ─────────────────────────────────────────────
export const STUDIO_BACKDROPS = [
  {
    id:    'minimal',
    label: 'Minimal',
    class: 'backdrop-minimal',
    description: 'Clean ivory + dot-grid overlay',
  },
  {
    id:    'runway',
    label: 'Runway',
    class: 'backdrop-runway',
    description: 'Deep charcoal + spotlight glow',
  },
  {
    id:    'street',
    label: 'Street',
    class: 'backdrop-street',
    description: 'Urban concrete texture',
  },
  {
    id:    'cafe',
    label: 'Café',
    class: 'backdrop-cafe',
    description: 'Warm golden bokeh',
  },
] as const;

export const STUDIO_PRESETS = [
  {
    id:    'streetwear',
    label: 'Streetwear Drop',
    emoji: '🧢',
    description: 'Hoodie + Cargo Pants',
    categoryHints: ['Men', 'Women'],
  },
  {
    id:    'brunch',
    label: 'Sunday Brunch',
    emoji: '☀️',
    description: 'Linen Shirt + Pleated Trousers',
    categoryHints: ['Men', 'Women'],
  },
  {
    id:    'gala',
    label: 'Black Tie Gala',
    emoji: '🎩',
    description: 'Blazer + Accessories',
    categoryHints: ['Men', 'Women', 'Accessories'],
  },
] as const;

// ── SEO Defaults ─────────────────────────────────────────────
export const SEO = {
  siteName:    'Clothza',
  tagline:     'Where designers meet tastemakers.',
  description: 'Discover independent fashion boutiques, curate your style, and shop the finest pieces from South Asia\'s most discerning brands.',
  url:         'https://clothza.com',
  locale:      'en_NP',
  currency:    'NPR',
} as const;

// ── Stats (displayed on homepage) ───────────────────────────
export const PLATFORM_STATS = [
  { label: 'Boutiques',     value: 1200,  suffix: '+', prefix: '' },
  { label: 'Products',      value: 48000, suffix: '+', prefix: '' },
  { label: 'Styled Looks',  value: 12000, suffix: '+', prefix: '' },
  { label: 'Happy Clients', value: 32000, suffix: '+', prefix: '' },
] as const;

// ── Demo Credentials ─────────────────────────────────────────
export const DEMO_CREDENTIALS = {
  customer: { email: 'demo@clothza.com', password: 'demo1234' },
  admin:    { passcode: 'clothzaadmin2026' },
} as const;

// ── Tracking ID Prefix ───────────────────────────────────────
export const TRACKING_PREFIX = 'CLZ-2026-' as const;

// ── Empty State Messages ─────────────────────────────────────
export const EMPTY_STATE_MESSAGES = {
  favorites: {
    icon: 'Heart',
    title: 'Nothing saved yet',
    description: 'Heart a boutique or product to save it here.',
    cta: 'Browse Collections',
    ctaLink: ROUTES.HOME,
  },
  leaderboard: {
    icon: 'Trophy',
    title: 'No stylist rankings yet',
    description: 'Be the first stylist to publish a Lookbook!',
    cta: 'Open Style Studio',
    ctaLink: ROUTES.STYLE_STUDIO,
  },
  lookbooks: {
    icon: 'Search',
    title: 'No lookbooks found',
    description: "No lookbooks match your filter. Try 'All Portfolios'.",
    cta: 'View All',
    ctaLink: ROUTES.LOOKBOOKS,
  },
  storeEmpty: {
    icon: 'Package',
    title: 'No pieces listed yet',
    description: "This boutique hasn't listed any pieces yet. Check back soon.",
    cta: 'Browse Other Stores',
    ctaLink: ROUTES.HOME,
  },
  customerOrders: {
    icon: 'ShoppingBag',
    title: 'No orders yet',
    description: "You haven't placed any orders yet. Start exploring.",
    cta: 'Browse Collections',
    ctaLink: ROUTES.HOME,
  },
  messages: {
    icon: 'MessageCircle',
    title: 'No inquiries yet',
    description: 'Customers will reach you here when they have questions.',
    cta: null,
    ctaLink: null,
  },
  cart: {
    icon: 'ShoppingCart',
    title: 'Your cart is empty',
    description: 'Time to discover something beautiful.',
    cta: 'Browse Collections',
    ctaLink: ROUTES.HOME,
  },
  search: {
    icon: 'SearchX',
    title: 'No results found',
    description: 'No stores or products matched your search. Try a different term.',
    cta: null,
    ctaLink: null,
  },
} as const;
