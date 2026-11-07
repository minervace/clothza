// ============================================================
// hooks/useClickOutside.ts — Clothza v4.0
// Dismiss dropdowns, modals, and drawers on outside click
// ============================================================

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Fires a callback when the user clicks or touches outside the
 * referenced element. Useful for closing dropdowns, menus, and modals.
 *
 * @param callback - Function to call on outside click
 * @returns ref - Attach this to the element to monitor
 *
 * Usage:
 *   const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
 *   return <div ref={ref}>...</div>;
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handleEvent = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      if (!element) return;

      const target = event.target as Node;
      if (!element.contains(target)) {
        callback();
      }
    };

    // Use mousedown/touchstart for immediate response (before click)
    document.addEventListener('mousedown', handleEvent);
    document.addEventListener('touchstart', handleEvent, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleEvent);
      document.removeEventListener('touchstart', handleEvent);
    };
  }, [callback]);

  return ref;
}

/**
 * Variant: attach multiple refs to the same outside-click handler.
 * Useful when a trigger button + its dropdown panel should both be
 * considered "inside".
 */
export function useClickOutsideMultiple(
  refs: RefObject<HTMLElement | null>[],
  callback: () => void
): void {
  useEffect(() => {
    const handleEvent = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isOutside = refs.every(ref => !ref.current?.contains(target));
      if (isOutside) callback();
    };

    document.addEventListener('mousedown', handleEvent);
    document.addEventListener('touchstart', handleEvent, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleEvent);
      document.removeEventListener('touchstart', handleEvent);
    };
  }, [refs, callback]);
}
