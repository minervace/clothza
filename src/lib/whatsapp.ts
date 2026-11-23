// ============================================================
// lib/whatsapp.ts — Clothza v5.0
// wa.me click-to-chat links. Works with no API, no approval and no
// token: the sender's own WhatsApp opens with the message prefilled.
// Used as the instant fallback until the Meta Cloud API is connected.
// ============================================================

export interface OrderLike {
  trackingId: string;
  total:        number;
  items:        Array<{ productId: string; size: string; color: string; quantity: number }>;
  deliveryAddress: { fullName: string; city: string; address: string; phone: string };
  paymentMethod: string;
}

/** Strips formatting and keeps digits, so +977 98-1234 becomes 977981234. */
const digits = (raw: string): string => (raw ?? '').replace(/\D/g, '');

/**
 * Builds a wa.me link for a phone number, prefilling the order summary.
 * Returns null when there is no usable number.
 */
export function sellerOrderLink(rawPhone: string | undefined, order: OrderLike, productName?: (id: string) => string): string | null {
  const phone = digits(rawPhone ?? '');
  if (phone.length < 8) return null;

  const lines = [
    `New order ${order.trackingId}`,
    '',
    ...order.items.map(i => {
      const name = productName?.(i.productId) ?? i.productId;
      return `• ${name} — ${i.size}/${i.color} × ${i.quantity}`;
    }),
    '',
    `Total: ${order.total} NPR`,
    `Payment: ${order.paymentMethod}`,
    '',
    `Deliver to: ${order.deliveryAddress.fullName}`,
    `${order.deliveryAddress.address}, ${order.deliveryAddress.city}`,
    `Phone: ${order.deliveryAddress.phone}`,
  ];

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
