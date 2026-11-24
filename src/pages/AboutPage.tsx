// ============================================================
// pages/AboutPage.tsx — Clothza v5.0
// What Clothza is, and what a buyer and a seller can each do.
// ============================================================

import { Link } from 'react-router-dom';
import {
  ShoppingBag, Store, Truck, MessageCircle, Camera, LayoutGrid,
  Sparkles, ShieldCheck, Heart, ArrowRight,
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';

function Section({ eyebrow, title, children }: {
  eyebrow: string; title: string; children: React.ReactNode;
}) {
  return (
    <section style={{ borderTop: '1px solid var(--border)', padding: '56px 0' }}>
      <div className="container">
        <div className="text-overline" style={{ color: 'var(--text-tertiary)', marginBottom: 10 }}>
          {eyebrow}
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 3vw, 34px)',
          fontWeight: 500, fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
          lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 24, maxWidth: 620,
        }}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Capability({ icon: Icon, title, children }: {
  icon: typeof ShoppingBag; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <Icon size={18} style={{ marginTop: 3, flexShrink: 0, color: 'var(--accent)' }} strokeWidth={1.6} />
      <div>
        <div style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
          {title}
        </div>
        <div style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <PageTransition>
      {/* Hero */}
      <section style={{ paddingTop: 96, paddingBottom: 56, borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 'var(--text-overline)', fontWeight: 600, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 24, height: 1, background: 'var(--border-strong)' }} />
            About Clothza
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
            fontSize: 'clamp(36px, 4.6vw, 56px)',
            fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.015em',
            maxWidth: 760, marginBottom: 24,
          }}>
            A marketplace for clothes made by{' '}
            <span className="text-gradient">people with names.</span>
          </h1>
          <p style={{ fontSize: 'var(--text-subtitle)', color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.65 }}>
            Clothza is an independent fashion marketplace, built in Kathmandu for buyers and makers across Nepal and South Asia. It is not one big shop. It is a street of small boutiques, each run by its own owner, gathered under one roof so you can find them.
          </p>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.7, marginTop: 14 }}>
            Every piece you see belongs to a real boutique with a workshop, a location and a person who answers messages. When you buy, the money goes to that maker — Clothza provides the shopfront, the ordering, and the delivery arrangements.
          </p>
        </div>
      </section>

      {/* Buyers */}
      <Section eyebrow="01 — For buyers" title="Browse, compare and order from many boutiques at once">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24, maxWidth: 900 }}>
          <Capability icon={LayoutGrid} title="Browse by boutique or by piece">
            Every boutique has its own page with its story, location and full catalogue. Search, filter by category or price, and sort by newest, rating or popularity.
          </Capability>
          <Capability icon={ShoppingBag} title="One cart, one checkout">
            Add pieces from several shops to a single cart. Checkout is three steps: review the cart, enter delivery, choose how to pay.
          </Capability>
          <Capability icon={Truck} title="Delivery arranged for you">
            Delivery is calculated at checkout and free above a threshold. Orders arrive in an estimated 3–5 working days within Nepal, with a tracking ID you can follow.
          </Capability>
          <Capability icon={MessageCircle} title="Talk to the maker">
            Message any boutique directly from its page. Their reply arrives in your account — asks about sizing, fabric, or a custom piece.
          </Capability>
          <Capability icon={Heart} title="Save what you love">
            Favourite boutiques and pieces to keep them in one place, so you can come back when you are ready.
          </Capability>
          <Capability icon={Sparkles} title="Style your own lookbook">
            Build a look in the Style Studio by mixing pieces from different boutiques, then save it and share it with the community.
          </Capability>
        </div>
      </Section>

      {/* Sellers */}
      <Section eyebrow="02 — For sellers" title="Everything a small boutique needs to sell online">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24, maxWidth: 900 }}>
          <Capability icon={Store} title="Your own boutique page">
            A page with your name, location, story, logo, banner and social links. Yours to edit whenever you like, no developer needed.
          </Capability>
          <Capability icon={LayoutGrid} title="Inventory down to size and colour">
            Every product carries a stock grid — sizes against colours, each combination with its own count. Low stock and sold-out variants are flagged, so you never oversell.
          </Capability>
          <Capability icon={Camera} title="Upload your own photographs">
            Images upload straight to your shop from your phone or computer. No links to paste, no external hosting to pay for.
          </Capability>
          <Capability icon={ShoppingBag} title="Orders in one dashboard">
            See each order as it is placed with the customer's details and what they bought. Update the status as you work: pending, processing, shipped, delivered.
          </Capability>
          <Capability icon={Truck} title="Shipping and fulfilment">
            You pack and dispatch; the customer follows the tracking ID. Cash-on-delivery orders are marked unpaid until you collect the cash, so your books stay accurate.
          </Capability>
          <Capability icon={MessageCircle} title="Customer messages, answered">
            Every customer who writes to your shop appears in your inbox. Read the thread and reply in the same window.
          </Capability>
        </div>
      </Section>

      {/* How it works */}
      <Section eyebrow="03 — How selling works" title="A shop subscription, reviewed by a person">
        <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Selling on Clothza requires a shop subscription — monthly or yearly. You apply from the selling page, we confirm payment, and your account is switched to shop owner with a renewal date. Nothing is charged automatically, and you can cancel whenever you like.
          </p>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Subscriptions carry different limits: a smaller plan suits a shop testing the market, a larger one lifts the product limit and adds priority placement. When a subscription lapses the shop stays intact, but listing is paused until it is renewed.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <Link to="/sell" className="btn btn-primary">See selling plans <ArrowRight size={15} /></Link>
            <Link to="/signin" className="btn btn-outline">Create an account</Link>
          </div>
        </div>
      </Section>

      {/* Trust */}
      <Section eyebrow="04 — How we handle your data" title="Boring, careful, and written down">
        <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <ShieldCheck size={18} style={{ marginTop: 3, flexShrink: 0, color: 'var(--accent)' }} strokeWidth={1.6} />
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Card numbers never reach us. Payments are made on the provider's own page, and we only receive confirmation that a payment succeeded. Your delivery details are visible only to you and the boutique fulfilling the order, enforced at the database level rather than by hiding buttons.
            </p>
          </div>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            The full detail is in our <Link to="/privacy" style={{ color: 'var(--accent)' }}>privacy policy</Link> and <Link to="/terms" style={{ color: 'var(--accent)' }}>terms of service</Link>.
          </p>
        </div>
      </Section>

      {/* Closing */}
      <section style={{ padding: '56px 0 88px', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 500, fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1", lineHeight: 1.3, maxWidth: 680, color: 'var(--text-primary)' }}>
            If you make things with your hands, there is room for you here. If you wear things with care, they are waiting to be found.
          </p>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', marginTop: 20 }}>
            Clothza · Kathmandu, Nepal · <a href="mailto:hello@clothza.tech" style={{ color: 'var(--accent)' }}>hello@clothza.tech</a>
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
