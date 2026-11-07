// ============================================================
// components/ui/Modal.tsx — Clothza v4.0
// Accessible, animated, portal-based modal
// Open:  scale(0.96)+opacity(0) → scale(1)+opacity(1) — 300ms spring
// Close: scale(0.96)+opacity(0) — 200ms fast
// ============================================================

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  title?:       string;
  description?: string;
  children:     React.ReactNode;
  footer?:      React.ReactNode;
  size?:        'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  hideClose?:   boolean;
  className?:   string;
}

const sizeStyles: Record<string, string> = {
  sm:   '400px',
  md:   '560px',
  lg:   '720px',
  xl:   '960px',
  full: '95vw',
};

// Framer Motion variants
const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale:   0.96,
    y:       8,
  },
  visible: {
    opacity: 1,
    scale:   1,
    y:       0,
    transition: {
      type:    'spring' as const,
      stiffness: 400,
      damping:   30,
      duration:  0.3,
    },
  },
  exit: {
    opacity: 0,
    scale:   0.96,
    y:       8,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as [number,number,number,number] },
  },
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  hideClose = false,
  className,
}: ModalProps) {
  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key to close
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

  const modalId    = 'modal-title';
  const descId     = 'modal-desc';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeOnOverlay ? onClose : undefined}
          role="presentation"
          style={{ zIndex: 'var(--z-modal)' }}
        >
          <motion.div
            className={clsx('modal-content', className)}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? modalId : undefined}
            aria-describedby={description ? descId : undefined}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: sizeStyles[size] }}
          >
            {/* Header */}
            {(title || !hideClose) && (
              <div className="modal-header">
                <div>
                  {title && (
                    <h2
                      id={modalId}
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize:   'var(--text-heading)',
                        fontWeight: 'var(--weight-semibold)',
                        color:      'var(--text-primary)',
                        lineHeight: 'var(--leading-tight)',
                      }}
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id={descId}
                      style={{
                        fontSize: 'var(--text-body)',
                        color:    'var(--text-secondary)',
                        marginTop: 4,
                      }}
                    >
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    style={{
                      background:   'none',
                      border:       'none',
                      cursor:       'pointer',
                      padding:      8,
                      borderRadius: 'var(--radius-md)',
                      color:        'var(--text-tertiary)',
                      display:      'flex',
                      alignItems:   'center',
                      transition:   'color var(--dur-fast) var(--spring), background var(--dur-fast) var(--spring)',
                      flexShrink:   0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color      = 'var(--text-primary)';
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color      = 'var(--text-tertiary)';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="modal-body">{children}</div>

            {/* Footer */}
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Confirm Modal ────────────────────────────────────────────

interface ConfirmModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onConfirm: () => void;
  title:    string;
  message:  string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?: 'danger' | 'accent';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'danger',
  isLoading    = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            className={`btn btn-${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      }
    >
      <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
        {message}
      </p>
    </Modal>
  );
}

export default Modal;
