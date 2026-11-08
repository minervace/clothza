// ============================================================
// context/MarketplaceContext.tsx — Clothza v4.0
// Complete state manager: seed data, cart, favorites,
// orders, reviews, messages + Supabase realtime subscriptions
// ============================================================

import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import { fetchCatalog } from '@/lib/supabaseData';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  getSessionUser,
  onAuthStateChange,
  type AuthResult,
} from '@/lib/supabaseAuth';
import { generateId, generateTrackingId } from '@/lib/crypto';
import { calcOrderTotal, applyCoupon } from '@/lib/formatters';
import { optimizeImageUrl } from '@/lib/formatters';

// ── Type Definitions ─────────────────────────────────────────

export type Role             = 'customer' | 'seller' | 'admin';
export type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold';
export type OrderStatus      = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod    = 'esewa' | 'khalti' | 'fonepay' | 'card';
export type StoreTheme       = 'minimalist' | 'streetwear' | 'boho' | 'luxury';
export type ProductCategory  = 'Men' | 'Women' | 'Accessories' | 'Footwear' | 'Kids';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  storeId?: string;
  subscriptionTier: SubscriptionTier;
  totalSpent: number;
  joinedAt: string;
  adminRequest?: 'pending' | 'approved' | 'rejected';
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  location: string;
  instagram?: string;
  whatsapp?: string;
  theme: StoreTheme;
  isFeatured: boolean;
  isSponsored: boolean;
  views: number;
  clicks: number;
  rating: number;
  reviewCount: number;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: string;
  createdAt: string;
}

export interface ProductVariant {
  size: string;
  color: string;
  stock: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: ProductCategory;
  tags: string[];
  images: string[];
  variants: ProductVariant[];
  isBestSeller: boolean;
  isTrending: boolean;
  isSponsored: boolean;
  views: number;
  clicks: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
}

export interface Order {
  id: string;
  userId: string;
  storeId: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryAddress: DeliveryAddress;
  status: OrderStatus;
  trackingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LookbookItem {
  productId: string;
  selectedSize: string;
  selectedColor: string;
}

export interface Lookbook {
  id: string;
  storeId: string;
  creatorName: string;
  name: string;
  description: string;
  coverImage?: string;
  items: LookbookItem[];
  isOfficial: boolean;
  likes: number;
  views: number;
  createdAt: string;
}

export interface Message {
  id: string;
  storeId: string;
  customerId: string;
  customerName: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  storeId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usageCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface Favorites {
  products: string[];
  stores: string[];
}

// ── Seed Data ─────────────────────────────────────────────────

const BASE_STORES: Store[] = [
  {
    id: 'store-atelier-noir',
    ownerId: 'user-seller-1',
    name: 'Atelier Noir',
    slug: 'atelier-noir',
    description:
      'A temple of minimalist fashion from the boulevards of Paris. Atelier Noir believes that restraint is the ultimate luxury — every stitch purposeful, every silhouette architectural. We work exclusively with structured wool, merino, and double-faced cashmere sourced from heritage mills in Northern France. No prints, no excess, only form.',
    logo:   optimizeImageUrl('https://images.unsplash.com/photo-1558769132-cb1aea458c5e', 200, 200),
    banner: optimizeImageUrl('https://images.unsplash.com/photo-1445205170230-053b83016050', 1200, 400),
    location: 'Paris, France',
    instagram: '@ateliernoir',
    whatsapp: '+33123456789',
    theme: 'minimalist',
    isFeatured: true,
    isSponsored: true,
    views: 48200,
    clicks: 3890,
    rating: 4.8,
    reviewCount: 214,
    subscriptionTier: 'gold',
    subscriptionExpiresAt: '2027-01-01T00:00:00Z',
    createdAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'store-maison-blanc',
    ownerId: 'user-seller-2',
    name: 'Maison Blanc',
    slug: 'maison-blanc',
    description:
      'Born from the sun-drenched coast of the Amalfi, Maison Blanc is an ode to effortless living. Every garment breathes — sculpted from deadstock Belgian linen, organic cotton, and Tencel. Our design language is coastal minimalism meets Mediterranean warmth. Floaty silhouettes, natural dyes, and textures that soften with every wash.',
    logo:   optimizeImageUrl('https://images.unsplash.com/photo-1441986300917-64674bd600d8', 200, 200),
    banner: optimizeImageUrl('https://images.unsplash.com/photo-1469334031218-e382a71b716b', 1200, 400),
    location: 'Milano, Italy',
    instagram: '@maisonblanc',
    whatsapp: '+39123456789',
    theme: 'boho',
    isFeatured: true,
    isSponsored: false,
    views: 31500,
    clicks: 2740,
    rating: 4.6,
    reviewCount: 178,
    subscriptionTier: 'silver',
    subscriptionExpiresAt: '2026-09-01T00:00:00Z',
    createdAt: '2025-03-10T08:00:00Z',
  },
  {
    id: 'store-aura-studio',
    ownerId: 'user-seller-3',
    name: 'Aura Studio',
    slug: 'aura-studio',
    description:
      'Aura Studio was born in the neon-lit backstreets of Shibuya. We are the pulse of Tokyo streetwear — gender-neutral silhouettes, tactical cargo constructions, and oversized proportions that command presence. Every drop is limited. Every piece is a statement. Aura exists for those who lead trends, not follow them.',
    logo:   optimizeImageUrl('https://images.unsplash.com/photo-1523381210434-271e8be1f52b', 200, 200),
    banner: optimizeImageUrl('https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 1200, 400),
    location: 'Tokyo, Japan',
    instagram: '@aurastudio.tok',
    whatsapp: '+81312345678',
    theme: 'streetwear',
    isFeatured: true,
    isSponsored: false,
    views: 27800,
    clicks: 2120,
    rating: 4.7,
    reviewCount: 143,
    subscriptionTier: 'gold',
    subscriptionExpiresAt: '2026-12-01T00:00:00Z',
    createdAt: '2025-02-20T08:00:00Z',
  },
  {
    id: 'store-sol-luna',
    ownerId: 'user-seller-4',
    name: 'Sol & Luna',
    slug: 'sol-luna',
    description:
      'From the workshops of Barcelona\'s El Born district, Sol & Luna is an artisan leather house specialising in handmade sculptural accessories and luxury ready-to-wear. Each piece is constructed by a single artisan from start to finish. We use only vegetable-tanned, traceable hides. Beauty that deepens with age — the anti-disposable luxury.',
    logo:   optimizeImageUrl('https://images.unsplash.com/photo-1543163521-1bf539c55dd2', 200, 200),
    banner: optimizeImageUrl('https://images.unsplash.com/photo-1490481651871-ab68de25d43d', 1200, 400),
    location: 'Barcelona, Spain',
    instagram: '@solylunabcn',
    whatsapp: '+34912345678',
    theme: 'luxury',
    isFeatured: false,
    isSponsored: true,
    views: 19300,
    clicks: 1650,
    rating: 4.9,
    reviewCount: 97,
    subscriptionTier: 'bronze',
    subscriptionExpiresAt: '2026-07-01T00:00:00Z',
    createdAt: '2025-05-08T08:00:00Z',
  },
];

const BASE_PRODUCTS: Product[] = [
  // ── Atelier Noir (3 products) ────────────────────────────
  {
    id: 'prod-an-001',
    storeId: 'store-atelier-noir',
    name: 'Double-Faced Wool Overcoat',
    description:
      'The cornerstone of Atelier Noir\'s winter collection, this double-faced wool overcoat is cut from a single-layer of heritage Loro Piana fabric — dense enough to eliminate the need for lining. The silhouette is deliberately architectural: dropped shoulders, a cocoon back, and a clean notch lapel that closes with a single polished horn button. Worn open or closed, it transforms every outfit beneath it. A coat built not for a season, but for a decade. Available in Obsidian Black and Chalk White.',
    price: 48500,
    compareAtPrice: 58200,
    category: 'Men',
    tags: ['wool', 'overcoat', 'minimalist', 'winter', 'luxury'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1539533113208-f6df8cc8b543', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1520975916090-3105956dac38', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1516257984-b1b4d707412e', 600, 800),
    ],
    variants: [
      { size: 'XS', color: 'Obsidian Black', stock: 4 },
      { size: 'S',  color: 'Obsidian Black', stock: 8 },
      { size: 'M',  color: 'Obsidian Black', stock: 12 },
      { size: 'L',  color: 'Obsidian Black', stock: 6 },
      { size: 'S',  color: 'Chalk White',    stock: 3 },
      { size: 'M',  color: 'Chalk White',    stock: 5 },
      { size: 'L',  color: 'Chalk White',    stock: 2 },
    ],
    isBestSeller: true,
    isTrending: true,
    isSponsored: true,
    views: 8920,
    clicks: 743,
    rating: 4.9,
    reviewCount: 67,
    createdAt: '2025-10-01T08:00:00Z',
  },
  {
    id: 'prod-an-002',
    storeId: 'store-atelier-noir',
    name: 'Merino Turtleneck Ribbed Sweater',
    description:
      'Spun from extra-fine 17.5-micron merino sourced directly from Australian Merino farms, this ribbed turtleneck represents Atelier Noir\'s commitment to textile excellence. The tight-knit rib construction creates a self-supporting structure that holds its shape wash after wash. The extended turtleneck can be worn upright for a sculptural effect or folded back for a classical look. Anti-pilling treatment ensures pristine appearance through hundreds of wears. The ideal layer — worn alone or beneath the Wool Overcoat.',
    price: 18500,
    compareAtPrice: 22200,
    category: 'Men',
    tags: ['merino', 'knitwear', 'turtleneck', 'minimalist'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1576566588028-4147f3842f27', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1614786269829-d24616faf56d', 600, 800),
    ],
    variants: [
      { size: 'XS', color: 'Ivory',         stock: 6 },
      { size: 'S',  color: 'Ivory',         stock: 14 },
      { size: 'M',  color: 'Ivory',         stock: 18 },
      { size: 'L',  color: 'Ivory',         stock: 10 },
      { size: 'XL', color: 'Ivory',         stock: 4 },
      { size: 'S',  color: 'Charcoal Grey', stock: 8 },
      { size: 'M',  color: 'Charcoal Grey', stock: 12 },
      { size: 'L',  color: 'Charcoal Grey', stock: 7 },
    ],
    isBestSeller: true,
    isTrending: false,
    isSponsored: false,
    views: 6140,
    clicks: 512,
    rating: 4.8,
    reviewCount: 88,
    createdAt: '2025-10-15T08:00:00Z',
  },
  {
    id: 'prod-an-003',
    storeId: 'store-atelier-noir',
    name: 'Structured Wide-Leg Trousers',
    description:
      'Atelier Noir\'s signature wide-leg trouser is the product of eighteen months of pattern development. Cut from a mid-weight Japanese wool-polyester blend with just 2% elastane for comfort retention, the silhouette is a deliberate study in geometry. A high rise with a deep pleat at the front creates dramatic drape at the thigh, narrowing to a clean break above the shoe. Paired with the Merino Turtleneck, the ensemble becomes a complete editorial statement. Belt loops accommodate up to 4cm belts. Dry clean recommended.',
    price: 22000,
    compareAtPrice: 26400,
    category: 'Women',
    tags: ['trousers', 'wide-leg', 'minimalist', 'tailored'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1506629082955-511b1aa562c8', 600, 800),
    ],
    variants: [
      { size: '24', color: 'Black',    stock: 5 },
      { size: '26', color: 'Black',    stock: 9 },
      { size: '28', color: 'Black',    stock: 11 },
      { size: '30', color: 'Black',    stock: 6 },
      { size: '32', color: 'Black',    stock: 3 },
      { size: '26', color: 'Ecru',     stock: 4 },
      { size: '28', color: 'Ecru',     stock: 7 },
    ],
    isBestSeller: false,
    isTrending: true,
    isSponsored: false,
    views: 4200,
    clicks: 380,
    rating: 4.7,
    reviewCount: 41,
    createdAt: '2025-11-01T08:00:00Z',
  },

  // ── Maison Blanc (3 products) ────────────────────────────
  {
    id: 'prod-mb-001',
    storeId: 'store-maison-blanc',
    name: 'Washed Linen Overshirt',
    description:
      'Made from 100% enzyme-washed Belgian linen — a process that pre-softens the fibres to eliminate the stiff break-in period. The result is a garment that feels worn-in from the very first wear. Generous patch pockets, a relaxed boxy cut, and mother-of-pearl buttons characterise this cornerstone Maison Blanc piece. The overshirt transitions effortlessly from beach cover-up to urban weekend casual. Machine washable, it softens further with every cycle. Available in five natural, plant-derived dye colorways.',
    price: 12800,
    compareAtPrice: 15360,
    category: 'Women',
    tags: ['linen', 'overshirt', 'boho', 'coastal', 'summer'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1434389677669-e08b4cac3105', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1496747611176-843222e1e57c', 600, 800),
    ],
    variants: [
      { size: 'XS', color: 'Natural Sand',    stock: 7 },
      { size: 'S',  color: 'Natural Sand',    stock: 15 },
      { size: 'M',  color: 'Natural Sand',    stock: 20 },
      { size: 'L',  color: 'Natural Sand',    stock: 8 },
      { size: 'S',  color: 'Sage Green',      stock: 6 },
      { size: 'M',  color: 'Sage Green',      stock: 10 },
      { size: 'M',  color: 'Dusty Rose',      stock: 5 },
    ],
    isBestSeller: true,
    isTrending: true,
    isSponsored: false,
    views: 7340,
    clicks: 621,
    rating: 4.6,
    reviewCount: 93,
    createdAt: '2025-08-01T08:00:00Z',
  },
  {
    id: 'prod-mb-002',
    storeId: 'store-maison-blanc',
    name: 'Organic Cotton Wrap Dress',
    description:
      'The quintessential Maison Blanc silhouette — a wrap construction in GOTS-certified organic cotton voile. The lightweight fabric catches every breeze, creating a natural, fluttering drape around the body. An adjustable self-tie wrap accommodates a range of body proportions, while the v-neckline creates an elegant, universally flattering frame. Hand-block printed in natural indigo using a traditional Rajasthani technique by our partner artisan cooperative. Each piece carries slight variations in print — a mark of authentic handwork rather than a flaw.',
    price: 15500,
    compareAtPrice: 18600,
    category: 'Women',
    tags: ['organic', 'cotton', 'dress', 'boho', 'sustainable'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1572804013427-4d7ca7268217', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1539109136881-3be0616acf4b', 600, 800),
    ],
    variants: [
      { size: 'XS', color: 'Indigo Print', stock: 3 },
      { size: 'S',  color: 'Indigo Print', stock: 8 },
      { size: 'M',  color: 'Indigo Print', stock: 12 },
      { size: 'L',  color: 'Indigo Print', stock: 7 },
      { size: 'XL', color: 'Indigo Print', stock: 2 },
      { size: 'S',  color: 'Terra Block',  stock: 4 },
      { size: 'M',  color: 'Terra Block',  stock: 6 },
    ],
    isBestSeller: false,
    isTrending: true,
    isSponsored: false,
    views: 5100,
    clicks: 440,
    rating: 4.5,
    reviewCount: 56,
    createdAt: '2025-09-01T08:00:00Z',
  },
  {
    id: 'prod-mb-003',
    storeId: 'store-maison-blanc',
    name: 'Linen Pleated Wide-Leg Pants',
    description:
      'The companion bottom to the Washed Linen Overshirt, these wide-leg trousers share the same enzyme-washed Belgian linen for a unified, effortlessly coastal aesthetic. Deep knife pleats at the front create architectural movement as you walk, while an elasticated back waistband provides all-day comfort without visible hardware. The palazzo-width leg creates a dramatic silhouette that is equally at home on a Capri terrace or a Thamel rooftop. Our bestselling bottom — size-inclusive with an adjustable tie at the waist.',
    price: 13200,
    compareAtPrice: 15840,
    category: 'Women',
    tags: ['linen', 'wide-leg', 'boho', 'resort', 'coastal'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1509631179647-0177331693ae', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1578587018452-892bacefd3f2', 600, 800),
    ],
    variants: [
      { size: 'XS', color: 'Natural',   stock: 5 },
      { size: 'S',  color: 'Natural',   stock: 12 },
      { size: 'M',  color: 'Natural',   stock: 16 },
      { size: 'L',  color: 'Natural',   stock: 9 },
      { size: 'XL', color: 'Natural',   stock: 4 },
      { size: 'M',  color: 'Clay',      stock: 6 },
      { size: 'L',  color: 'Clay',      stock: 4 },
    ],
    isBestSeller: true,
    isTrending: false,
    isSponsored: false,
    views: 4890,
    clicks: 398,
    rating: 4.7,
    reviewCount: 71,
    createdAt: '2025-09-15T08:00:00Z',
  },

  // ── Aura Studio (3 products) ─────────────────────────────
  {
    id: 'prod-as-001',
    storeId: 'store-aura-studio',
    name: 'Technical Cargo Wide-Leg Pants',
    description:
      'Aura Studio\'s flagship cargo — a technical masterpiece built for the streets of Shibuya. Cut from a 4-way stretch nylon-cotton ripstop blend, these wide-leg cargos feature eleven utility pockets (including two concealed zippered cargo pockets along the thigh), an articulated gusset crotch for unrestricted movement, and adjustable drawstring ankle cuffs. The dropped crotch construction and oversized silhouette are quintessentially Tokyo. Gender-neutral pattern, designed to fit a broad range of body types. Limited to 200 units per colorway — numbered inside the waistband.',
    price: 16800,
    compareAtPrice: 20160,
    category: 'Men',
    tags: ['cargo', 'streetwear', 'technical', 'gender-neutral', 'limited'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1578932750294-f5075e85f44a', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1548126032-079a0fb0099d', 600, 800),
    ],
    variants: [
      { size: 'XS', color: 'Olive Drab',    stock: 8 },
      { size: 'S',  color: 'Olive Drab',    stock: 18 },
      { size: 'M',  color: 'Olive Drab',    stock: 22 },
      { size: 'L',  color: 'Olive Drab',    stock: 14 },
      { size: 'XL', color: 'Olive Drab',    stock: 6 },
      { size: 'S',  color: 'Jet Black',     stock: 12 },
      { size: 'M',  color: 'Jet Black',     stock: 16 },
      { size: 'L',  color: 'Jet Black',     stock: 9 },
    ],
    isBestSeller: true,
    isTrending: true,
    isSponsored: true,
    views: 9200,
    clicks: 812,
    rating: 4.8,
    reviewCount: 104,
    createdAt: '2025-07-01T08:00:00Z',
  },
  {
    id: 'prod-as-002',
    storeId: 'store-aura-studio',
    name: 'Oversized Graphic Hoodie',
    description:
      'The Aura Studio Hoodie is a drop that sells out within hours of release. Constructed from a heavyweight 420gsm French terry cotton with a brushed interior for exceptional warmth, it wears like a second skin. The graphic — a generative art print created in collaboration with Tokyo digital artist Kenji Mori — is screen-printed using water-based inks on the back, running from hem to neckline. The silhouette is deliberately oversized: boxy body, dropped shoulders, and a wide kangaroo pocket. A drawcord-adjustable hood with large ribbed eyelets completes the construction. One size fits XS–XL.',
    price: 11500,
    compareAtPrice: 13800,
    category: 'Women',
    tags: ['hoodie', 'oversized', 'streetwear', 'graphic', 'gender-neutral'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1614786269829-d24616faf56d', 600, 800),
    ],
    variants: [
      { size: 'One Size', color: 'Ash Grey',  stock: 30 },
      { size: 'One Size', color: 'Bone White', stock: 15 },
      { size: 'One Size', color: 'Washed Navy', stock: 20 },
    ],
    isBestSeller: true,
    isTrending: true,
    isSponsored: false,
    views: 11200,
    clicks: 967,
    rating: 4.7,
    reviewCount: 139,
    createdAt: '2025-06-15T08:00:00Z',
  },
  {
    id: 'prod-as-003',
    storeId: 'store-aura-studio',
    name: 'Utility Tactical Vest',
    description:
      'The Aura Studio Tactical Vest was born from a collaboration with a Tokyo workwear manufacturer. Six exterior pockets — two large cargo, two slim front, two internal zippered — provide functional storage in a garment that makes a bold visual statement. The body is constructed from a ripstop poly-nylon blend with a DWR (Durable Water Repellent) finish. Adjustable side buckle closures allow for a custom fit from XS to XL in a single size. Designed to layer over the Oversized Hoodie or wear alone over a longline base. A defining piece of the Aura aesthetic.',
    price: 9800,
    compareAtPrice: 11760,
    category: 'Accessories',
    tags: ['vest', 'tactical', 'utility', 'streetwear', 'layering'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1520975916090-3105956dac38', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1620799140408-edc6dcb6d633', 600, 800),
    ],
    variants: [
      { size: 'One Size', color: 'Ranger Green', stock: 12 },
      { size: 'One Size', color: 'All Black',    stock: 18 },
      { size: 'One Size', color: 'Sand Tan',     stock: 8 },
    ],
    isBestSeller: false,
    isTrending: true,
    isSponsored: false,
    views: 6380,
    clicks: 554,
    rating: 4.6,
    reviewCount: 62,
    createdAt: '2025-07-15T08:00:00Z',
  },

  // ── Sol & Luna (3 products) ──────────────────────────────
  {
    id: 'prod-sl-001',
    storeId: 'store-sol-luna',
    name: 'Handcrafted Sculptural Tote',
    description:
      'Each Sol & Luna Sculptural Tote is a unique object — handbuilt by a single artisan in Barcelona\'s El Born workshop from a single piece of Hermès-grade vegetable-tanned calf leather. The construction method is traditional saddlery: hand-stitched with waxed linen thread at 12 stitches per inch, with a tension so precise it requires a single artisan\'s entire day to complete one bag. The sculptural curved base — the signature Sol & Luna form — is achieved by wet-moulding and hand-shaping the leather over a wooden last. Zero hardware. Zero glue. Only leather and thread. Develops a rich, personal patina over years of use.',
    price: 85000,
    compareAtPrice: 102000,
    category: 'Accessories',
    tags: ['leather', 'handmade', 'tote', 'luxury', 'artisan', 'sculptural'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1548036328-c9fa89d128fa', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1591561954557-26941169b49e', 600, 800),
    ],
    variants: [
      { size: 'One Size', color: 'Natural Tan',    stock: 4 },
      { size: 'One Size', color: 'Espresso Brown',  stock: 3 },
      { size: 'One Size', color: 'Midnight Black',  stock: 2 },
    ],
    isBestSeller: false,
    isTrending: true,
    isSponsored: true,
    views: 7800,
    clicks: 620,
    rating: 5.0,
    reviewCount: 29,
    createdAt: '2025-05-20T08:00:00Z',
  },
  {
    id: 'prod-sl-002',
    storeId: 'store-sol-luna',
    name: 'Leather Ballet Flat — Archive Edition',
    description:
      'Reissued from the Sol & Luna Archive (2019 debut season), the Ballet Flat remains the studio\'s most beloved silhouette. Constructed entirely by hand from a single piece of butter-soft Nappa calf leather — no seams at the toe box — the shoe moulds precisely to the wearer\'s foot within one week of daily wear. A hand-sewn leather sole with a hidden 5mm cork midsole provides surprising cushioning without compromise to the silhouette. The elasticated back gore is hidden beneath a leather wrap. Unlined for breathability. Re-soling service available at the Barcelona workshop.',
    price: 32000,
    compareAtPrice: 38400,
    category: 'Footwear',
    tags: ['leather', 'flats', 'handmade', 'luxury', 'ballet'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1543163521-1bf539c55dd2', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa', 600, 800),
    ],
    variants: [
      { size: '35', color: 'Nude Nappa',   stock: 3 },
      { size: '36', color: 'Nude Nappa',   stock: 5 },
      { size: '37', color: 'Nude Nappa',   stock: 7 },
      { size: '38', color: 'Nude Nappa',   stock: 6 },
      { size: '39', color: 'Nude Nappa',   stock: 4 },
      { size: '40', color: 'Nude Nappa',   stock: 2 },
      { size: '37', color: 'Cherry Red',   stock: 3 },
      { size: '38', color: 'Cherry Red',   stock: 4 },
      { size: '39', color: 'Cherry Red',   stock: 2 },
    ],
    isBestSeller: true,
    isTrending: false,
    isSponsored: false,
    views: 9200,
    clicks: 780,
    rating: 4.9,
    reviewCount: 53,
    createdAt: '2025-06-01T08:00:00Z',
  },
  {
    id: 'prod-sl-003',
    storeId: 'store-sol-luna',
    name: 'Leather Slim Bifold Wallet',
    description:
      'The Sol & Luna Slim Bifold is proof that the most considered object is often the smallest. Constructed from a single piece of vegetable-tanned Florentine calf leather from Conceria Walpier — the same tannery that supplies the world\'s finest luxury houses — the wallet holds 6 cards, cash, and a folded receipt in a profile that sits barely 4mm thick. All edges are hand-bevelled and burnished with bone. The stitch — 8 saddle stitches in waxed linen — is functional, never decorative. This wallet will outlast its owner if cared for properly. A lifetime product, not a seasonal one.',
    price: 14500,
    compareAtPrice: 17400,
    category: 'Accessories',
    tags: ['leather', 'wallet', 'handmade', 'luxury', 'minimalist'],
    images: [
      optimizeImageUrl('https://images.unsplash.com/photo-1627123424574-724758594e93', 600, 800),
      optimizeImageUrl('https://images.unsplash.com/photo-1553062407-98eeb64c6a62', 600, 800),
    ],
    variants: [
      { size: 'One Size', color: 'Natural Tan',    stock: 12 },
      { size: 'One Size', color: 'Espresso Brown',  stock: 8 },
      { size: 'One Size', color: 'Midnight Black',  stock: 10 },
    ],
    isBestSeller: true,
    isTrending: false,
    isSponsored: false,
    views: 5420,
    clicks: 466,
    rating: 4.9,
    reviewCount: 44,
    createdAt: '2025-07-01T08:00:00Z',
  },
];

const BASE_USERS: User[] = [
  {
    id: 'user-customer-demo',
    name: 'Demo Customer',
    email: 'demo@clothza.com',
    avatarUrl: optimizeImageUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', 100, 100),
    role: 'customer',
    subscriptionTier: 'free',
    totalSpent: 0,
    joinedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-seller-1',
    name: 'Isabelle Morel',
    email: 'isabelle@ateliernoir.fr',
    avatarUrl: optimizeImageUrl('https://images.unsplash.com/photo-1494790108377-be9c29b29330', 100, 100),
    role: 'seller',
    storeId: 'store-atelier-noir',
    subscriptionTier: 'gold',
    totalSpent: 0,
    joinedAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'user-seller-2',
    name: 'Marco Ferretti',
    email: 'marco@maisonblanc.it',
    avatarUrl: optimizeImageUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 100, 100),
    role: 'seller',
    storeId: 'store-maison-blanc',
    subscriptionTier: 'silver',
    totalSpent: 0,
    joinedAt: '2025-03-10T08:00:00Z',
  },
  {
    id: 'user-seller-3',
    name: 'Yuki Tanaka',
    email: 'yuki@aurastudio.jp',
    avatarUrl: optimizeImageUrl('https://images.unsplash.com/photo-1552058544-f2b08422138a', 100, 100),
    role: 'seller',
    storeId: 'store-aura-studio',
    subscriptionTier: 'gold',
    totalSpent: 0,
    joinedAt: '2025-02-20T08:00:00Z',
  },
  {
    id: 'user-seller-4',
    name: 'Carmen Vega',
    email: 'carmen@solluna.es',
    avatarUrl: optimizeImageUrl('https://images.unsplash.com/photo-1438761681033-6461ffad8d80', 100, 100),
    role: 'seller',
    storeId: 'store-sol-luna',
    subscriptionTier: 'bronze',
    totalSpent: 0,
    joinedAt: '2025-05-08T08:00:00Z',
  },
];

const BASE_LOOKBOOKS: Lookbook[] = [
  // Aiden Chen — Rank #1 (2 lookbooks)
  {
    id: 'lb-ac-001',
    storeId: 'store-aura-studio',
    creatorName: 'Aiden Chen',
    name: 'Tokyo After Dark',
    description: 'A nocturnal walk through Shimokitazawa — layered utilitarian silhouettes under the glow of vintage vinyl shop signs. This look is about texture tension: raw ripstop against brushed French terry, matte against reflective.',
    coverImage: optimizeImageUrl('https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 600, 800),
    items: [
      { productId: 'prod-as-001', selectedSize: 'M',        selectedColor: 'Jet Black' },
      { productId: 'prod-as-002', selectedSize: 'One Size',  selectedColor: 'Ash Grey' },
      { productId: 'prod-as-003', selectedSize: 'One Size',  selectedColor: 'All Black' },
    ],
    isOfficial: false,
    likes: 2847,
    views: 19400,
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'lb-ac-002',
    storeId: 'store-aura-studio',
    creatorName: 'Aiden Chen',
    name: 'Monochrome Ōmotesandō',
    description: 'An all-black uniform for the gallery walk. Every element is black, but never the same black — flat matte, brushed nylon, and washed cotton coexist in a symphony of darkness. Style is in the details.',
    coverImage: optimizeImageUrl('https://images.unsplash.com/photo-1524504388940-b1c1722653e1', 600, 800),
    items: [
      { productId: 'prod-as-003', selectedSize: 'One Size', selectedColor: 'All Black' },
      { productId: 'prod-an-001', selectedSize: 'M',        selectedColor: 'Obsidian Black' },
    ],
    isOfficial: false,
    likes: 2103,
    views: 14800,
    createdAt: '2026-04-10T08:00:00Z',
  },
  // Sophia Laurent — Rank #2 (2 lookbooks)
  {
    id: 'lb-sl-001',
    storeId: 'store-maison-blanc',
    creatorName: 'Sophia Laurent',
    name: 'Côte d\'Azur Morning',
    description: 'Golden light, warm stone, and the faint smell of lavender. This lookbook captures the eternal French Riviera morning — effortless linen, bare skin, and a coffee held in both hands. Femininity without effort.',
    coverImage: optimizeImageUrl('https://images.unsplash.com/photo-1469334031218-e382a71b716b', 600, 800),
    items: [
      { productId: 'prod-mb-001', selectedSize: 'S', selectedColor: 'Sage Green' },
      { productId: 'prod-mb-003', selectedSize: 'S', selectedColor: 'Natural' },
    ],
    isOfficial: true,
    likes: 1968,
    views: 12700,
    createdAt: '2026-02-14T08:00:00Z',
  },
  {
    id: 'lb-sl-002',
    storeId: 'store-maison-blanc',
    creatorName: 'Sophia Laurent',
    name: 'The Art Basel Edit',
    description: 'For the opening night vernissage — comfortable enough for 6 hours on your feet, distinctive enough to be remembered. Organic cotton drape meets handmade leather sculpture in the ultimate gallery-to-dinner look.',
    coverImage: optimizeImageUrl('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f', 600, 800),
    items: [
      { productId: 'prod-mb-002', selectedSize: 'M', selectedColor: 'Indigo Print' },
      { productId: 'prod-sl-001', selectedSize: 'One Size', selectedColor: 'Natural Tan' },
    ],
    isOfficial: false,
    likes: 1642,
    views: 9300,
    createdAt: '2026-05-01T08:00:00Z',
  },
  // Mia Reyes — Rank #3 (1 lookbook)
  {
    id: 'lb-mr-001',
    storeId: 'store-sol-luna',
    creatorName: 'Mia Reyes',
    name: 'The Barcelona Edit',
    description: 'Born in the light of Gaudí — a study in material craft and Catalan soul. Vegetable-tanned leather as a lifestyle, not a luxury. The Ballet Flat and Sculptural Tote become armor for the modern woman who moves through the world with intention and craft.',
    coverImage: optimizeImageUrl('https://images.unsplash.com/photo-1490481651871-ab68de25d43d', 600, 800),
    items: [
      { productId: 'prod-sl-002', selectedSize: '38', selectedColor: 'Nude Nappa' },
      { productId: 'prod-sl-001', selectedSize: 'One Size', selectedColor: 'Espresso Brown' },
      { productId: 'prod-an-003', selectedSize: '28', selectedColor: 'Ecru' },
    ],
    isOfficial: false,
    likes: 1284,
    views: 7900,
    createdAt: '2026-01-20T08:00:00Z',
  },
];

const BASE_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    productId: 'prod-an-001',
    userId: 'user-customer-demo',
    userName: 'Priya S.',
    rating: 5,
    comment: 'This coat is genuinely extraordinary. I\'ve worn designer coats before but the weight and drape of this Loro Piana wool is on another level. Worth every paisa.',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'rev-002',
    productId: 'prod-an-001',
    userId: 'user-customer-2',
    userName: 'Amir K.',
    rating: 5,
    comment: 'The architectural silhouette is exactly as photographed. The horn button is a beautiful touch. Atelier Noir understands that restraint is the highest form of design.',
    createdAt: '2026-02-20T14:00:00Z',
  },
  {
    id: 'rev-003',
    productId: 'prod-as-002',
    userId: 'user-customer-3',
    userName: 'Sara M.',
    rating: 5,
    comment: 'I was in Shibuya when this dropped and bought it in-person at the pop-up. The graphic print is STUNNING in real life. The 420gsm weight is incredibly premium.',
    createdAt: '2026-03-05T09:00:00Z',
  },
  {
    id: 'rev-004',
    productId: 'prod-sl-001',
    userId: 'user-customer-4',
    userName: 'Elena V.',
    rating: 5,
    comment: 'A perfect object. I watched the artisan make it over video call — 8 hours for one bag. The patina after 3 months of daily use is developing beautifully.',
    createdAt: '2026-03-15T16:00:00Z',
  },
  {
    id: 'rev-005',
    productId: 'prod-mb-001',
    userId: 'user-customer-5',
    userName: 'Riya T.',
    rating: 4,
    comment: 'The linen is exactly as described — immediately soft, no break-in required. The sage green is even more beautiful in person. Sizing runs slightly large.',
    createdAt: '2026-04-10T11:00:00Z',
  },
];

const BASE_MESSAGES: Message[] = [
  {
    id: 'msg-001',
    storeId: 'store-atelier-noir',
    customerId: 'user-customer-demo',
    customerName: 'Demo Customer',
    senderId: 'user-customer-demo',
    content: 'Hello, I am interested in the Double-Faced Wool Overcoat. Do you ship to Nepal?',
    createdAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'msg-002',
    storeId: 'store-atelier-noir',
    customerId: 'user-customer-demo',
    customerName: 'Demo Customer',
    senderId: 'user-seller-1',
    content: 'Bonjour! Yes, we ship worldwide via DHL Express. Delivery to Nepal takes 5–7 business days. Would you like to proceed?',
    createdAt: '2026-07-01T14:30:00Z',
  },
];

const BASE_COUPONS: Coupon[] = [
  {
    id: 'coupon-001',
    storeId: 'store-atelier-noir',
    code: 'NOIR20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 10000,
    maxUses: 100,
    usageCount: 43,
    isActive: true,
  },
  {
    id: 'coupon-002',
    storeId: 'store-aura-studio',
    code: 'AURA500',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 5000,
    maxUses: 200,
    usageCount: 87,
    isActive: true,
  },
];

// ── State Shape ──────────────────────────────────────────────

interface MarketplaceState {
  // Auth
  currentUser: User | null;
  users: User[];

  // Data
  stores: Store[];
  products: Product[];
  lookbooks: Lookbook[];
  orders: Order[];
  reviews: Review[];
  messages: Message[];
  coupons: Coupon[];

  // UI State
  cart: CartItem[];
  favorites: Favorites;

  // Loading / Error
  isLoading: boolean;
  error: string | null;
}

// ── Action Types ─────────────────────────────────────────────

type Action =
  // Auth
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_USER'; payload: Partial<User> }

  // Cart
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string; size: string; color: string } }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; size: string; color: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartItem[] }

  // Favorites
  | { type: 'TOGGLE_FAVORITE_PRODUCT'; payload: string }
  | { type: 'TOGGLE_FAVORITE_STORE'; payload: string }
  | { type: 'SET_FAVORITES'; payload: Favorites }

  // Orders
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus } }

  // Products
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Partial<Product> & { id: string } }
  | { type: 'DELETE_PRODUCT'; payload: string }

  // Stores
  | { type: 'UPDATE_STORE'; payload: Partial<Store> & { id: string } }

  // Catalog (loaded from Supabase)
  | { type: 'HYDRATE_CATALOG'; payload: { stores: Store[]; products: Product[]; lookbooks: Lookbook[] } }

  // Lookbooks
  | { type: 'ADD_LOOKBOOK'; payload: Lookbook }
  | { type: 'LIKE_LOOKBOOK'; payload: string }

  // Reviews
  | { type: 'ADD_REVIEW'; payload: Review }

  // Messages
  | { type: 'ADD_MESSAGE'; payload: Message }

  // Coupons
  | { type: 'ADD_COUPON'; payload: Coupon }
  | { type: 'UPDATE_COUPON'; payload: Partial<Coupon> & { id: string } }
  | { type: 'DELETE_COUPON'; payload: string }

  // Users (Admin)
  | { type: 'UPDATE_USER_ROLE'; payload: { id: string; role: Role } }
  | { type: 'DELETE_USER'; payload: string }

  // UI
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// ── Reducer ──────────────────────────────────────────────────

function reducer(state: MarketplaceState, action: Action): MarketplaceState {
  switch (action.type) {
    case 'HYDRATE_CATALOG':
      return {
        ...state,
        stores: action.payload.stores,
        products: action.payload.products,
        lookbooks: action.payload.lookbooks,
      };

    case 'SET_USER':
      return { ...state, currentUser: action.payload };

    case 'UPDATE_USER':
      return {
        ...state,
        currentUser: state.currentUser
          ? { ...state.currentUser, ...action.payload }
          : null,
        users: state.users.map(u =>
          u.id === state.currentUser?.id ? { ...u, ...action.payload } : u
        ),
      };

    case 'ADD_TO_CART': {
      const existing = state.cart.find(
        item =>
          item.productId === action.payload.productId &&
          item.size === action.payload.size &&
          item.color === action.payload.color
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.productId === action.payload.productId &&
            item.size === action.payload.size &&
            item.color === action.payload.color
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(
          item =>
            !(
              item.productId === action.payload.productId &&
              item.size === action.payload.size &&
              item.color === action.payload.color
            )
        ),
      };

    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.productId === action.payload.productId &&
          item.size === action.payload.size &&
          item.color === action.payload.color
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_CART':
      return { ...state, cart: action.payload };

    case 'TOGGLE_FAVORITE_PRODUCT': {
      const productId = action.payload;
      const isAlreadyFav = state.favorites.products.includes(productId);
      return {
        ...state,
        favorites: {
          ...state.favorites,
          products: isAlreadyFav
            ? state.favorites.products.filter(id => id !== productId)
            : [...state.favorites.products, productId],
        },
      };
    }

    case 'TOGGLE_FAVORITE_STORE': {
      const storeId = action.payload;
      const isAlreadyFav = state.favorites.stores.includes(storeId);
      return {
        ...state,
        favorites: {
          ...state.favorites,
          stores: isAlreadyFav
            ? state.favorites.stores.filter(id => id !== storeId)
            : [...state.favorites.stores, storeId],
        },
      };
    }

    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload };

    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };

    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.id
            ? { ...o, status: action.payload.status, updatedAt: new Date().toISOString() }
            : o
        ),
      };

    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };

    case 'UPDATE_STORE':
      return {
        ...state,
        stores: state.stores.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };

    case 'ADD_LOOKBOOK':
      return { ...state, lookbooks: [action.payload, ...state.lookbooks] };

    case 'LIKE_LOOKBOOK':
      return {
        ...state,
        lookbooks: state.lookbooks.map(lb =>
          lb.id === action.payload ? { ...lb, likes: lb.likes + 1 } : lb
        ),
      };

    case 'ADD_REVIEW':
      return { ...state, reviews: [action.payload, ...state.reviews] };

    case 'ADD_MESSAGE':
      // Guard against duplicate Supabase events
      if (state.messages.some(m => m.id === action.payload.id)) return state;
      return { ...state, messages: [...state.messages, action.payload] };

    case 'ADD_COUPON':
      return { ...state, coupons: [action.payload, ...state.coupons] };

    case 'UPDATE_COUPON':
      return {
        ...state,
        coupons: state.coupons.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };

    case 'DELETE_COUPON':
      return { ...state, coupons: state.coupons.filter(c => c.id !== action.payload) };

    case 'UPDATE_USER_ROLE':
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.payload.id ? { ...u, role: action.payload.role } : u
        ),
      };

    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// ── Initial State ────────────────────────────────────────────

const initialState: MarketplaceState = {
  currentUser: null,
  users:     BASE_USERS,
  stores:    BASE_STORES,
  products:  BASE_PRODUCTS,
  lookbooks: BASE_LOOKBOOKS,
  orders:    [],
  reviews:   BASE_REVIEWS,
  messages:  BASE_MESSAGES,
  coupons:   BASE_COUPONS,
  cart:      [],
  favorites: { products: [], stores: [] },
  isLoading: false,
  error:     null,
};

// ── Context Shape ────────────────────────────────────────────

export interface MarketplaceContextValue {
  // State
  state: MarketplaceState;

  // Theme
  theme: string;
  themePreference: ThemePreference;
  isDark: boolean;
  isSystemTheme: boolean;
  toggleTheme: () => void;
  cycleTheme: () => void;

  // Auth Actions
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  logout: () => void;

  // Cart Actions
  addToCart:          (productId: string, size: string, color: string, quantity?: number) => void;
  removeFromCart:     (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart:          () => void;
  cartCount:          number;
  cartSubtotal:       number;

  // Favorites Actions
  toggleFavoriteProduct: (productId: string) => void;
  toggleFavoriteStore:   (storeId: string) => void;
  isFavoriteProduct:     (productId: string) => boolean;
  isFavoriteStore:       (storeId: string) => boolean;

  // Order Actions
  placeOrder: (
    items: CartItem[],
    deliveryAddress: DeliveryAddress,
    paymentMethod: PaymentMethod,
    couponCode?: string
  ) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;

  // Product Actions
  addProduct:    (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (product: Partial<Product> & { id: string }) => void;
  deleteProduct: (id: string) => void;

  // Store Actions
  updateStore: (store: Partial<Store> & { id: string }) => void;

  // Lookbook Actions
  addLookbook:  (lookbook: Omit<Lookbook, 'id' | 'createdAt' | 'likes' | 'views'>) => void;
  likeLookbook: (id: string) => void;

  // Review Actions
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;

  // Message Actions
  sendMessage: (storeId: string, content: string) => void;

  // Coupon Actions
  addCoupon:    (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  updateCoupon: (coupon: Partial<Coupon> & { id: string }) => void;
  deleteCoupon: (id: string) => void;
  applyCouponCode: (code: string, storeId: string, subtotal: number) => { discount: number; coupon: Coupon } | null;

  // Admin Actions
  updateUserRole: (userId: string, role: Role) => void;
  deleteUser:     (userId: string) => void;
  updateUserById: (userId: string, updates: Partial<User>) => void;

  // Computed
  getProduct:          (id: string) => Product | undefined;
  getStore:            (idOrSlug: string) => Store | undefined;
  getStoreProducts:    (storeId: string) => Product[];
  getProductReviews:   (productId: string) => Review[];
  getStoreMessages:    (storeId: string) => Message[];
  getStoreOrders:      (storeId: string) => Order[];
  getUserOrders:       (userId: string) => Order[];
  getStylistRankings:  () => Array<{ creator: string; totalLikes: number; lookbooks: Lookbook[] }>;
  getBestSellers:      () => Product[];
  getTrendingProducts: () => Product[];
  getFeaturedStores:   () => Store[];
  searchAll:           (query: string) => { stores: Store[]; products: Product[] };
}

// ── Context ──────────────────────────────────────────────────

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    theme, preference: themePreference, isDark, isSystem: isSystemTheme,
    toggleTheme, cycleTheme,
  } = useTheme();

  // Persist cart and favorites to localStorage
  const [savedCart, setSavedCart] = useLocalStorage<CartItem[]>('clothza_cart', []);
  const [savedFavorites, setSavedFavorites] = useLocalStorage<Favorites>(
    'clothza_favorites',
    { products: [], stores: [] }
  );
  const [savedUser, setSavedUser] = useLocalStorage<User | null>('clothza_user', null);

  // Load the catalog from Supabase when configured; keep seed data otherwise
  useEffect(() => {
    let cancelled = false;

    void fetchCatalog().then(catalog => {
      if (cancelled || !catalog) return;
      const { stores, products, lookbooks } = catalog;
      if (stores.length === 0 && products.length === 0 && lookbooks.length === 0) return;
      dispatch({ type: 'HYDRATE_CATALOG', payload: catalog });
    });

    return () => { cancelled = true; };
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (savedCart.length > 0) dispatch({ type: 'SET_CART', payload: savedCart });
    if (savedFavorites.products.length > 0 || savedFavorites.stores.length > 0) {
      dispatch({ type: 'SET_FAVORITES', payload: savedFavorites });
    }
    if (savedUser) dispatch({ type: 'SET_USER', payload: savedUser });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    setSavedCart(state.cart);
  }, [state.cart, setSavedCart]);

  // Sync favorites to localStorage
  useEffect(() => {
    setSavedFavorites(state.favorites);
  }, [state.favorites, setSavedFavorites]);

  // Sync user to localStorage
  useEffect(() => {
    setSavedUser(state.currentUser);
  }, [state.currentUser, setSavedUser]);

  // ── Supabase Realtime Subscriptions ─────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Messages realtime
    const messagesChannel = supabase
      .channel('realtime:messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          dispatch({ type: 'ADD_MESSAGE', payload: newMsg });
        }
      )
      .subscribe();

    // Orders realtime
    const ordersChannel = supabase
      .channel('realtime:orders')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as Order;
          dispatch({
            type: 'UPDATE_ORDER_STATUS',
            payload: { id: updated.id, status: updated.status },
          });
        }
      )
      .subscribe();

    // Lookbooks realtime
    const lookbooksChannel = supabase
      .channel('realtime:lookbooks')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lookbooks' },
        (payload) => {
          const newLb = payload.new as Lookbook;
          dispatch({ type: 'ADD_LOOKBOOK', payload: newLb });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(lookbooksChannel);
    };
  }, []);

  // ── Auth Actions ─────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Real auth when Supabase is configured
    if (isSupabaseConfigured) {
      const result = await authSignIn(email, password);
      if (!result.ok) return false;
      const profile = await getSessionUser();
      if (profile) dispatch({ type: 'SET_USER', payload: profile });
      return Boolean(profile);
    }

    // Demo mode — no backend configured
    if (email === 'demo@clothza.com' && password === 'demo1234') {
      const user = BASE_USERS.find(u => u.email === email);
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        return true;
      }
    }
    const user = BASE_USERS.find(u => u.email === email);
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
      return true;
    }
    return false;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Accounts are unavailable in demo mode.' };
    }

    const result = await authSignUp(email, password, name);
    if (result.ok && !result.needsConfirmation) {
      const profile = await getSessionUser();
      if (profile) dispatch({ type: 'SET_USER', payload: profile });
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'SET_USER', payload: null });
    if (isSupabaseConfigured) void authSignOut();
  }, []);

  // Restore and follow the Supabase session
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void getSessionUser().then(user => {
      if (user) dispatch({ type: 'SET_USER', payload: user });
    });

    return onAuthStateChange(user => {
      dispatch({ type: 'SET_USER', payload: user });
    });
  }, []);

  // ── Cart Actions ─────────────────────────────────────────

  const addToCart = useCallback((
    productId: string,
    size: string,
    color: string,
    quantity: number = 1
  ) => {
    dispatch({ type: 'ADD_TO_CART', payload: { productId, size, color, quantity } });
  }, []);

  const removeFromCart = useCallback((productId: string, size: string, color: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId, size, color } });
  }, []);

  const updateCartQuantity = useCallback((
    productId: string,
    size: string,
    color: string,
    quantity: number
  ) => {
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, size, color, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const cartCount = useMemo(
    () => state.cart.reduce((sum, item) => sum + item.quantity, 0),
    [state.cart]
  );

  const cartSubtotal = useMemo(() => {
    return state.cart.reduce((sum, item) => {
      const product = state.products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [state.cart, state.products]);

  // ── Favorites Actions ────────────────────────────────────

  const toggleFavoriteProduct = useCallback((productId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE_PRODUCT', payload: productId });
  }, []);

  const toggleFavoriteStore = useCallback((storeId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE_STORE', payload: storeId });
  }, []);

  const isFavoriteProduct = useCallback(
    (productId: string) => state.favorites.products.includes(productId),
    [state.favorites.products]
  );

  const isFavoriteStore = useCallback(
    (storeId: string) => state.favorites.stores.includes(storeId),
    [state.favorites.stores]
  );

  // ── Order Actions ────────────────────────────────────────

  const placeOrder = useCallback((
    items: CartItem[],
    deliveryAddress: DeliveryAddress,
    paymentMethod: PaymentMethod,
    couponCode?: string
  ): Order => {
    const subtotal = items.reduce((sum, item) => {
      const product = state.products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    let discountAmount = 0;
    if (couponCode) {
      const coupon = state.coupons.find(
        c => c.code === couponCode && c.isActive && subtotal >= c.minOrderAmount
      );
      if (coupon) {
        discountAmount = applyCoupon(subtotal, coupon.discountType, coupon.discountValue);
      }
    }

    const { deliveryFee, total } = calcOrderTotal(subtotal, discountAmount);
    const storeId = state.products.find(p => p.id === items[0]?.productId)?.storeId ?? '';

    const order: Order = {
      id:              generateId(),
      userId:          state.currentUser?.id ?? 'guest',
      storeId,
      items,
      subtotal,
      discountAmount,
      deliveryFee,
      total,
      couponCode,
      paymentMethod,
      paymentStatus:   'paid',
      deliveryAddress,
      status:          'pending',
      trackingId:      generateTrackingId(),
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    dispatch({ type: 'ADD_ORDER', payload: order });
    dispatch({ type: 'CLEAR_CART' });
    return order;
  }, [state.products, state.coupons, state.currentUser]);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status } });
  }, []);

  // ── Product Actions ──────────────────────────────────────

  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id:        generateId(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
  }, []);

  const updateProduct = useCallback((product: Partial<Product> & { id: string }) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: product });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  }, []);

  // ── Store Actions ────────────────────────────────────────

  const updateStore = useCallback((store: Partial<Store> & { id: string }) => {
    dispatch({ type: 'UPDATE_STORE', payload: store });
  }, []);

  // ── Lookbook Actions ─────────────────────────────────────

  const addLookbook = useCallback((lookbook: Omit<Lookbook, 'id' | 'createdAt' | 'likes' | 'views'>) => {
    const newLookbook: Lookbook = {
      ...lookbook,
      id:        generateId(),
      likes:     0,
      views:     0,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_LOOKBOOK', payload: newLookbook });
  }, []);

  const likeLookbook = useCallback((id: string) => {
    dispatch({ type: 'LIKE_LOOKBOOK', payload: id });
  }, []);

  // ── Review Actions ───────────────────────────────────────

  const addReview = useCallback((review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id:        generateId(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_REVIEW', payload: newReview });
  }, []);

  // ── Message Actions ──────────────────────────────────────

  const sendMessage = useCallback((storeId: string, content: string) => {
    if (!state.currentUser) return;
    const newMsg: Message = {
      id:           generateId(),
      storeId,
      customerId:   state.currentUser.id,
      customerName: state.currentUser.name,
      senderId:     state.currentUser.id,
      content,
      createdAt:    new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: newMsg });
  }, [state.currentUser]);

  // ── Coupon Actions ───────────────────────────────────────

  const addCoupon = useCallback((coupon: Omit<Coupon, 'id' | 'usageCount'>) => {
    dispatch({
      type: 'ADD_COUPON',
      payload: { ...coupon, id: generateId(), usageCount: 0 },
    });
  }, []);

  const updateCoupon = useCallback((coupon: Partial<Coupon> & { id: string }) => {
    dispatch({ type: 'UPDATE_COUPON', payload: coupon });
  }, []);

  const deleteCoupon = useCallback((id: string) => {
    dispatch({ type: 'DELETE_COUPON', payload: id });
  }, []);

  const applyCouponCode = useCallback((
    code: string,
    storeId: string,
    subtotal: number
  ): { discount: number; coupon: Coupon } | null => {
    const coupon = state.coupons.find(
      c =>
        c.code === code &&
        c.storeId === storeId &&
        c.isActive &&
        subtotal >= c.minOrderAmount &&
        c.usageCount < c.maxUses
    );
    if (!coupon) return null;
    const discount = applyCoupon(subtotal, coupon.discountType, coupon.discountValue);
    return { discount, coupon };
  }, [state.coupons]);

  // ── Admin Actions ────────────────────────────────────────

  const updateUserRole = useCallback((userId: string, role: Role) => {
    dispatch({ type: 'UPDATE_USER_ROLE', payload: { id: userId, role } });
  }, []);

  const deleteUser = useCallback((userId: string) => {
    dispatch({ type: 'DELETE_USER', payload: userId });
  }, []);

  const updateUserById = useCallback((userId: string, updates: Partial<User>) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: { ...updates, id: userId } as Partial<User>,
    });
  }, []);

  // ── Computed Selectors ───────────────────────────────────

  const getProduct = useCallback(
    (id: string) => state.products.find(p => p.id === id),
    [state.products]
  );

  const getStore = useCallback(
    (idOrSlug: string) =>
      state.stores.find(s => s.id === idOrSlug || s.slug === idOrSlug),
    [state.stores]
  );

  const getStoreProducts = useCallback(
    (storeId: string) => state.products.filter(p => p.storeId === storeId),
    [state.products]
  );

  const getProductReviews = useCallback(
    (productId: string) => state.reviews.filter(r => r.productId === productId),
    [state.reviews]
  );

  const getStoreMessages = useCallback(
    (storeId: string) => state.messages.filter(m => m.storeId === storeId),
    [state.messages]
  );

  const getStoreOrders = useCallback(
    (storeId: string) => state.orders.filter(o => o.storeId === storeId),
    [state.orders]
  );

  const getUserOrders = useCallback(
    (userId: string) => state.orders.filter(o => o.userId === userId),
    [state.orders]
  );

  const getStylistRankings = useCallback(() => {
    const creatorMap = new Map<string, { totalLikes: number; lookbooks: Lookbook[] }>();
    for (const lb of state.lookbooks) {
      const existing = creatorMap.get(lb.creatorName);
      if (existing) {
        existing.totalLikes += lb.likes;
        existing.lookbooks.push(lb);
      } else {
        creatorMap.set(lb.creatorName, { totalLikes: lb.likes, lookbooks: [lb] });
      }
    }
    return Array.from(creatorMap.entries())
      .map(([creator, data]) => ({ creator, ...data }))
      .sort((a, b) => b.totalLikes - a.totalLikes);
  }, [state.lookbooks]);

  const getBestSellers = useCallback(
    () => state.products.filter(p => p.isBestSeller).slice(0, 8),
    [state.products]
  );

  const getTrendingProducts = useCallback(
    () => state.products.filter(p => p.isTrending).slice(0, 8),
    [state.products]
  );

  const getFeaturedStores = useCallback(
    () => state.stores.filter(s => s.isFeatured),
    [state.stores]
  );

  const searchAll = useCallback((query: string): { stores: Store[]; products: Product[] } => {
    if (!query.trim()) return { stores: [], products: [] };
    const q = query.toLowerCase();
    return {
      stores: state.stores.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      ),
      products: state.products.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
      ),
    };
  }, [state.stores, state.products]);

  // ── Context Value ────────────────────────────────────────

  const value = useMemo<MarketplaceContextValue>(() => ({
    state,
    theme,
    themePreference,
    isDark,
    isSystemTheme,
    toggleTheme,
    cycleTheme,
    login,
    signUp,
    logout,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartCount,
    cartSubtotal,
    toggleFavoriteProduct,
    toggleFavoriteStore,
    isFavoriteProduct,
    isFavoriteStore,
    placeOrder,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStore,
    addLookbook,
    likeLookbook,
    addReview,
    sendMessage,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    applyCouponCode,
    updateUserRole,
    deleteUser,
    updateUserById,
    getProduct,
    getStore,
    getStoreProducts,
    getProductReviews,
    getStoreMessages,
    getStoreOrders,
    getUserOrders,
    getStylistRankings,
    getBestSellers,
    getTrendingProducts,
    getFeaturedStores,
    searchAll,
  }), [
    state, theme, themePreference, isDark, isSystemTheme, toggleTheme, cycleTheme,
    login, signUp, logout,
    addToCart, removeFromCart, updateCartQuantity, clearCart, cartCount, cartSubtotal,
    toggleFavoriteProduct, toggleFavoriteStore, isFavoriteProduct, isFavoriteStore,
    placeOrder, updateOrderStatus,
    addProduct, updateProduct, deleteProduct,
    updateStore,
    addLookbook, likeLookbook,
    addReview,
    sendMessage,
    addCoupon, updateCoupon, deleteCoupon, applyCouponCode,
    updateUserRole, deleteUser, updateUserById,
    getProduct, getStore, getStoreProducts, getProductReviews,
    getStoreMessages, getStoreOrders, getUserOrders,
    getStylistRankings, getBestSellers, getTrendingProducts, getFeaturedStores, searchAll,
  ]);

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export default MarketplaceContext;
