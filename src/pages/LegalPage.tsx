// ============================================================
// pages/LegalPage.tsx — Clothza v5.0
// Privacy policy and terms, served at /privacy and /terms.
// Written to be honest about what this site actually does.
// ============================================================

import { Link } from 'react-router-dom';
import { PageTransition } from '@/components/layout/PageTransition';

const UPDATED = '20 November 2026';

function Shell({ title, intro, children }: {
  title: string; intro: string; children: React.ReactNode;
}) {
  return (
    <PageTransition>
      <section style={{ paddingTop: 88, paddingBottom: 56, borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 'var(--text-overline)', fontWeight: 600, letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 24, height: 1, background: 'var(--border-strong)' }} />
            Clothza · Kathmandu
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.015em',
            maxWidth: 700, marginBottom: 16,
          }}>
            {title}
          </h1>
          <p style={{ fontSize: 'var(--text-subtitle)', color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 'var(--leading-relaxed)' }}>
            {intro}
          </p>
        </div>
      </section>

      <section>
        <div className="container" style={{ padding: '48px 24px 80px', maxWidth: 720 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 'var(--text-body)', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
            {children}
          </div>
          <p style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
            Last updated {UPDATED}. Questions: <a href="mailto:hello@clothza.tech" style={{ color: 'var(--accent)' }}>hello@clothza.tech</a>
          </p>
        </div>
      </section>
    </PageTransition>
  );
}

function Block({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-serif)', fontSize: 'var(--text-heading)', fontWeight: 600,
        fontVariationSettings: "'opsz' 72, 'SOFT' 50", color: 'var(--text-primary)',
        marginBottom: 10,
      }}>
        {heading}
      </h2>
      {children}
    </div>
  );
}

export function PrivacyPage() {
  return (
    <Shell
      title="Privacy policy"
      intro="What Clothza collects, why, and how you can remove it. Written in plain language, not legal boilerplate."
    >
      <Block heading="What we collect">
        <p>When you create an account we hold your email address, a display name, and whether you signed up to shop or to sell. If you sign in with Google we receive your email address and profile name from Google — nothing else.</p>
        <p>When you shop we hold your orders: the pieces, the delivery address you give us, the payment method you chose, and an order status. When you message a boutique we hold that conversation so both sides can read it.</p>
      </Block>

      <Block heading="What we do not collect">
        <p>We never see or store your card number, your eSewa or Khalti credentials, or your bank details. Payment is completed on the provider's own page and we only receive confirmation that it succeeded.</p>
        <p>We do not run advertising trackers or sell data to third parties.</p>
      </Block>

      <Block heading="Where it lives">
        <p>Accounts, orders and messages are stored in Supabase, our database provider. Images shops upload are stored in Supabase Storage. Our site is served by Cloudflare. Both process data on our behalf under their own security terms.</p>
        <p>Access is enforced by row-level security: a customer can read their own orders, a shop owner can read their own shop's orders, and nobody can read another person's data through the API.</p>
      </Block>

      <Block heading="Cookies and local storage">
        <p>We use your browser's local storage for your cart, your favourites and your theme choice (light, dark or automatic). None of this leaves your device until you place an order or sign in.</p>
      </Block>

      <Block heading="Your choices">
        <p>You can delete your account at any time by emailing us; we remove your profile, orders and messages. Shops with outstanding orders should contact us first so those orders can be closed out.</p>
        <p>You can ask for a copy of everything we hold about you, and we will send it within 30 days.</p>
      </Block>

      <Block heading="Children">
        <p>Clothza is not intended for anyone under 16. We do not knowingly hold accounts for children.</p>
      </Block>

      <p style={{ marginTop: 8 }}>
        See also our <Link to="/terms" style={{ color: 'var(--accent)' }}>terms of service</Link>.
      </p>
    </Shell>
  );
}

export function TermsPage() {
  return (
    <Shell
      title="Terms of service"
      intro="The agreement between you and Clothza when you shop or sell here."
    >
      <Block heading="Who we are">
        <p>Clothza is an independent marketplace based in Kathmandu, Nepal. It connects customers with independent boutiques. Each boutique is its own business and is responsible for the pieces it sells, the condition of those pieces, and the accuracy of its listings.</p>
      </Block>

      <Block heading="Buying">
        <p>When you place an order you are entering a contract with that boutique, not with Clothza. Prices are shown in Nepali rupees and include applicable taxes. Delivery fees are shown at checkout before you pay.</p>
        <p>We accept eSewa, Khalti, FonePay and cards where available. Payment must clear before an order is dispatched.</p>
      </Block>

      <Block heading="Delivery and returns">
        <p>Estimated delivery is 3–5 working days within Nepal. If a piece arrives damaged or is not as described, contact the boutique within 7 days through the message feature and they will arrange a replacement or refund.</p>
      </Block>

      <Block heading="Selling">
        <p>A shop subscription is required to list on Clothza. By subscribing you confirm you have the right to sell the pieces you list, that your photographs are your own, and that you will honour the orders you accept.</p>
        <p>We may remove a listing or close a shop that misrepresents its goods, repeatedly fails to deliver, or sells counterfeit items. Subscriptions are non-transferable.</p>
      </Block>

      <Block heading="Your account">
        <p>Keep your password to yourself. You are responsible for what happens under your account. Tell us immediately if you believe someone else has access to it.</p>
        <p>Content you post — lookbooks, reviews, messages — must be yours to post and must not be abusive. We may remove content that breaks this.</p>
      </Block>

      <Block heading="Liability">
        <p>Clothza provides the marketplace and takes reasonable care to keep it running, but we do not guarantee uninterrupted service. We are not liable for a boutique's failure to fulfil an order beyond helping you resolve it.</p>
      </Block>

      <Block heading="Changes">
        <p>If these terms change materially we will tell you by email before the change takes effect.</p>
      </Block>

      <p style={{ marginTop: 8 }}>
        See also our <Link to="/privacy" style={{ color: 'var(--accent)' }}>privacy policy</Link>.
      </p>
    </Shell>
  );
}
