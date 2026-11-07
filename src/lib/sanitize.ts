// ============================================================
// lib/sanitize.ts — Clothza v4.0
// XSS Prevention: sanitize ALL user-generated content
// RULE: Never use dangerouslySetInnerHTML without sanitizing first
// ============================================================

/**
 * Escapes HTML special characters to prevent XSS.
 * Use on ALL user-generated content before rendering:
 * - Review comments
 * - Store descriptions (user-editable)
 * - Message content
 * - Product names from forms
 * - Coupon codes
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize an object's string fields recursively.
 * Useful for sanitizing entire form submission objects.
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
};

/**
 * Strip ALL HTML tags from a string (for plain text display).
 */
export const stripHtml = (input: string): string => {
  return input.replace(/<[^>]*>/g, '');
};

/**
 * Truncate a sanitized string to a max length with ellipsis.
 */
export const truncateSafe = (input: string, maxLength: number): string => {
  const sanitized = sanitizeInput(input);
  if (sanitized.length <= maxLength) return sanitized;
  return sanitized.slice(0, maxLength - 3) + '...';
};

/**
 * Validate that a string contains no script-injection patterns.
 * Returns true if the string is safe.
 */
export const isSafe = (input: string): boolean => {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];
  return !dangerousPatterns.some(pattern => pattern.test(input));
};
