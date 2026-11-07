// ============================================================
// components/ui/Toast.tsx — Clothza v4.0
// Custom react-hot-toast renderer with Pantheon design tokens
// Slide-in from bottom-right, accessible aria-live region
// ============================================================

import { Toaster, toast as hotToast, type Toast as HotToastType } from 'react-hot-toast';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

// ── Custom Renderer ──────────────────────────────────────────

interface CustomToastProps {
  t:        HotToastType;
  message:  string;
  type:     'success' | 'error' | 'warning' | 'info';
}

function CustomToastItem({ t, message, type }: CustomToastProps) {
  const icons = {
    success: <CheckCircle2  size={18} color="var(--success)" />,
    error:   <XCircle       size={18} color="var(--danger)"  />,
    warning: <AlertTriangle size={18} color="var(--warning)" />,
    info:    <Info          size={18} color="var(--accent)"  />,
  };

  const borderColors = {
    success: 'var(--success)',
    error:   'var(--danger)',
    warning: 'var(--warning)',
    info:    'var(--accent)',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '14px 18px',
        background:    'var(--bg-card)',
        border:        `1px solid var(--border)`,
        borderLeft:    `3px solid ${borderColors[type]}`,
        borderRadius:  'var(--radius-lg)',
        boxShadow:     'var(--shadow-elevated)',
        fontFamily:    'var(--font-sans)',
        fontSize:      'var(--text-body)',
        fontWeight:    'var(--weight-medium)',
        color:         'var(--text-primary)',
        minWidth:      280,
        maxWidth:      380,
        opacity:       t.visible ? 1 : 0,
        transform:     t.visible ? 'translateX(0)' : 'translateX(100%)',
        transition:    'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'all',
      }}
    >
      <span style={{ flexShrink: 0 }}>{icons[type]}</span>
      <span style={{ flex: 1, lineHeight: 'var(--leading-normal)' }}>{message}</span>
      <button
        onClick={() => hotToast.dismiss(t.id)}
        aria-label="Dismiss notification"
        style={{
          background:    'none',
          border:        'none',
          cursor:        'pointer',
          padding:       4,
          borderRadius:  'var(--radius-sm)',
          color:         'var(--text-tertiary)',
          display:       'flex',
          flexShrink:    0,
          transition:    'color var(--dur-fast) var(--spring)',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Toaster Component ────────────────────────────────────────

export function ClothzaToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: { background: 'transparent', boxShadow: 'none', padding: 0 },
      }}
    >
      {(t) => {
        const type =
          t.type === 'success' ? 'success'
          : t.type === 'error' ? 'error'
          : (t.type as string) === 'warning' ? 'warning'
          : 'info';
        const message = typeof t.message === 'string' ? t.message : '';
        return <CustomToastItem t={t} message={message} type={type} />;
      }}
    </Toaster>
  );
}

export default ClothzaToaster;
