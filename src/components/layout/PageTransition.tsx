// ============================================================
// components/layout/PageTransition.tsx — Clothza v4.0
// Framer Motion AnimatePresence page wrapper
// Enter: staggered slide-up 50ms between sections
// Exit:  opacity(0) 150ms instant
// ============================================================

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  key?:     string;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: {
    opacity: 1,
    y:       0,
    transition: {
      duration:   0.35,
      ease:       [0.16, 1, 0.3, 1] as [number, number, number, number],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

export const sectionVariants = {
  initial: { opacity: 0, y: 20 },
  enter: {
    opacity: 1,
    y:       0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
}

// ── Section reveal wrapper — stagger children ────────────────

export function SectionReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
