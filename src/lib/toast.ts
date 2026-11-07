// ============================================================
// lib/toast.ts — Clothza v4.0
// Toast helpers shared across the app. The renderer lives in
// components/ui/Toast.tsx; this module holds the imperative API.
// ============================================================

import { toast as hotToast } from 'react-hot-toast';

export const toast = {
  success: (msg: string) =>
    hotToast.success(msg, { duration: 3500 }),

  error: (msg: string) =>
    hotToast.error(msg, { duration: 5000 }),

  warning: (msg: string) =>
    hotToast(msg, {
      duration: 4000,
      icon:     '⚠️',
    }),

  info: (msg: string) =>
    hotToast(msg, { duration: 3500 }),

  loading: (msg: string) =>
    hotToast.loading(msg),

  dismiss: (id?: string) =>
    hotToast.dismiss(id),

  promise: <T,>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ) =>
    hotToast.promise(promise, msgs),
};
