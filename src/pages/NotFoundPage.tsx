// ============================================================
// pages/NotFoundPage.tsx — Clothza v4.0
// 404 page — editorial, branded, animated
// ============================================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <PageTransition>
      <div
        style={{
          minHeight:      '100vh',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          textAlign:      'center',
          padding:        'var(--space-8)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
        >
          {/* Giant 404 */}
          <motion.div
            animate={{ rotate: [0, -2, 2, -1, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontFamily:    'var(--font-serif)',
              fontSize:      'clamp(80px, 20vw, 180px)',
              fontWeight:    700,
              lineHeight:    1,
              background:    'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.04em',
              userSelect:    'none',
            }}
          >
            404
          </motion.div>

          <Compass size={40} color="var(--text-tertiary)" strokeWidth={1.25} />

          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize:   'var(--text-display)',
                fontWeight: 700,
                color:      'var(--text-primary)',
                marginBottom: 12,
              }}
            >
              Lost in the collection.
            </h1>
            <p
              style={{
                fontSize:   'var(--text-subtitle)',
                color:      'var(--text-secondary)',
                maxWidth:   400,
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              This page doesn't exist — but our collections do.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/" className="btn btn-accent btn-pill btn-lg">
              <ArrowLeft size={16} /> Explore Collections
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
