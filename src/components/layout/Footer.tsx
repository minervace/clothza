// ============================================================
// components/layout/Footer.tsx — Clothza v4.0
// Editorial footer with brand, links, newsletter, socials
// ============================================================

import { Link } from 'react-router-dom';
import { AtSign, MessageCircle, Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const FOOTER_LINKS = {
  Explore: [
    { label: 'Browse Boutiques', to: '/'         },
    { label: 'Lookbooks',        to: '/lookbooks' },
    { label: 'Style Studio',     to: '/studio'    },
    { label: 'New Arrivals',     to: '/'          },
    { label: 'Best Sellers',     to: '/'          },
  ],
  Sell: [
    { label: 'Start Selling',    to: '/dashboard' },
    { label: 'Seller Dashboard', to: '/dashboard' },
    { label: 'Subscription Plans', to: '/'        },
    { label: 'Analytics',        to: '/dashboard' },
  ],
  Company: [
    { label: 'About Clothza',   to: '/'          },
    { label: 'Privacy Policy',  to: '/privacy'   },
    { label: 'Terms of Service', to: '/terms'    },
    { label: 'Contact Us',      to: '/'          },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        {/* Main grid */}
        <div className="footer-grid">
          {/* Brand column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="footer-brand text-gradient">Clothza</div>
              <div className="footer-tagline">"Where designers meet tastemakers."</div>
            </div>
            <p
              style={{
                fontSize:   'var(--text-body)',
                color:      'var(--text-tertiary)',
                lineHeight: 'var(--leading-relaxed)',
                maxWidth:   240,
              }}
            >
              The premium multi-vendor fashion marketplace for South Asia's most discerning boutiques and buyers.
            </p>
            {/* Socials */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: AtSign,         label: 'Instagram', href: 'https://instagram.com' },
                { icon: MessageCircle,  label: 'WhatsApp',  href: 'https://wa.me'         },
                { icon: Mail,           label: 'Email',     href: 'mailto:hello@clothza.com' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="btn btn-outline btn-icon btn-sm"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3
                style={{
                  fontFamily:    'var(--font-sans)',
                  fontSize:      'var(--text-overline)',
                  fontWeight:    'var(--weight-semibold)',
                  letterSpacing: 'var(--tracking-widest)',
                  textTransform: 'uppercase',
                  color:         'var(--text-tertiary)',
                  marginBottom:  4,
                }}
              >
                {heading}
              </h3>
              {links.map(link => (
                <Link key={link.label} to={link.to} className="footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Newsletter + bottom bar */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            paddingTop:     32,
            gap:            32,
            flexWrap:       'wrap',
          }}
        >
          {/* Newsletter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>
              Stay in the edit.
            </p>
            {subscribed ? (
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--success)' }}>
                ✓ You're on the list. Welcome to the edit.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  aria-label="Newsletter email"
                  className="input-base"
                  style={{ width: 240 }}
                />
                <button type="submit" className="btn btn-accent" aria-label="Subscribe">
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>

          {/* Copyright */}
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} Clothza. All rights reserved.
            {' '}Built with ❤️ in Kathmandu.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
