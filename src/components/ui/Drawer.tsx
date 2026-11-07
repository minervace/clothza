// ============================================================
// components/ui/Drawer.tsx — Clothza v4.0
// Side-sliding panel + swipe-to-close (Framer Motion)
// Mobile: swipe right-to-left to close
// ============================================================

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface DrawerProps {
  isOpen:    boolean;
  onClose:   () => void;
  title?:    string;
  children:  React.ReactNode;
  footer?:   React.ReactNode;
  side?:     'left' | 'right';
  width?:    string;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  side    = 'right',
  width   = '420px',
  className,
}: DrawerProps) {
  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const panelVariants: Variants = {
    hidden:  { x: side === 'right' ? '100%' : '-100%', opacity: 0 },
    visible: {
      x:       0,
      opacity: 1,
      transition: {
        type:      'spring' as const,
        stiffness: 350,
        damping:   35,
      },
    },
    exit: {
      x:       side === 'right' ? '100%' : '-100%',
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as [number,number,number,number] },
    },
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            onClick={onClose}
            style={{ zIndex: 'var(--z-overlay)' }}
          />

          {/* Panel */}
          <motion.div
            className={clsx('drawer-panel', className)}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Drawer'}
            style={{
              [side === 'right' ? 'right' : 'left']: 0,
              maxWidth: width,
              zIndex: 'var(--z-overlay)',
            }}
            // Swipe-to-close on mobile
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              const threshold = side === 'right' ? 100 : -100;
              if (
                (side === 'right' && info.offset.x > threshold) ||
                (side === 'left'  && info.offset.x < threshold)
              ) {
                onClose();
              }
            }}
          >
            {/* Header */}
            <div className="drawer-header">
              {title ? (
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize:   'var(--text-subtitle)',
                    fontWeight: 'var(--weight-semibold)',
                    color:      'var(--text-primary)',
                  }}
                >
                  {title}
                </h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                aria-label="Close drawer"
                style={{
                  background:   'none',
                  border:       'none',
                  cursor:       'pointer',
                  padding:      8,
                  borderRadius: 'var(--radius-md)',
                  color:        'var(--text-tertiary)',
                  display:      'flex',
                  transition:   'all var(--dur-fast) var(--spring)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.color      = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color      = 'var(--text-tertiary)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="drawer-body">{children}</div>

            {/* Footer */}
            {footer && <div className="drawer-footer">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Drawer;
