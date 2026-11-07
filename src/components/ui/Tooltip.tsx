// ============================================================
// components/ui/Tooltip.tsx — Clothza v4.0
// Hover tooltip with Framer Motion fade, 4 placement sides
// ============================================================

import React, { useState, useRef, useId } from 'react';
import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content:  React.ReactNode;
  children: React.ReactElement;
  side?:    TooltipSide;
  delay?:   number;
}

const OFFSET = 8;

const sideStyles: Record<TooltipSide, React.CSSProperties> = {
  top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: OFFSET },
  bottom: { top:    '100%', left: '50%', transform: 'translateX(-50%)', marginTop:    OFFSET },
  left:   { right:  '100%', top:  '50%', transform: 'translateY(-50%)', marginRight:  OFFSET },
  right:  { left:   '100%', top:  '50%', transform: 'translateY(-50%)', marginLeft:   OFFSET },
};

const initialMap: Record<TooltipSide, TargetAndTransition> = {
  top:    { opacity: 0, y: 4  },
  bottom: { opacity: 0, y: -4 },
  left:   { opacity: 0, x: 4  },
  right:  { opacity: 0, x: -4 },
};

const animateMap: Record<TooltipSide, TargetAndTransition> = {
  top:    { opacity: 1, y: 0 },
  bottom: { opacity: 1, y: 0 },
  left:   { opacity: 1, x: 0 },
  right:  { opacity: 1, x: 0 },
};

export function Tooltip({
  content,
  children,
  side  = 'top',
  delay = 300,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={initialMap[side]}
            animate={animateMap[side]}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
            style={{
              position:      'absolute',
              zIndex:        9999,
              pointerEvents: 'none',
              whiteSpace:    'nowrap',
              ...sideStyles[side],
            }}
          >
            <div
              style={{
                background:   'var(--text-primary)',
                color:        'var(--bg-primary)',
                fontSize:     'var(--text-caption)',
                fontFamily:   'var(--font-sans)',
                fontWeight:   'var(--weight-medium)',
                padding:      '6px 10px',
                borderRadius: 'var(--radius-sm)',
                boxShadow:    'var(--shadow-elevated)',
                lineHeight:   'var(--leading-normal)',
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default Tooltip;
