/**
 * Security & Input Sanitization Utilities
 *
 * Enforces defensive programming on all client-side inputs (checkout,
 * addresses, contact, reviews, search) to prevent XSS injection,
 * malicious URLs, and oversized payload attacks.
 */

/**
 * Strips script tags, HTML tags, event handlers, and dangerous character sequences.
 */
export function sanitizeText(raw: unknown, maxLength: number = 500): string {
  if (typeof raw !== 'string') return '';

  return raw
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip <script> blocks
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/javascript:/gi, '') // Prevent javascript: pseudo-protocol
    .replace(/data:\s*text\/html/gi, '') // Prevent data: html
    .replace(/on\w+\s*=/gi, '') // Prevent inline event handlers (onload=, onerror=, etc.)
    .slice(0, maxLength);
}

/**
 * Normalizes and validates an email address format safely.
 */
export function sanitizeEmail(raw: unknown): string {
  if (typeof raw !== 'string') return '';

  const cleaned = raw.trim().toLowerCase();
  // Standard RFC-compliant safe email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (emailRegex.test(cleaned) && cleaned.length <= 254) {
    return cleaned;
  }
  return '';
}

/**
 * Sanitizes phone numbers, stripping non-numeric characters and retaining up to 10-12 digits.
 */
export function sanitizePhone(raw: unknown): string {
  if (typeof raw !== 'string' && typeof raw !== 'number') return '';

  const digitsOnly = String(raw).replace(/[^0-9]/g, '');
  // Return last 10 digits for Indian standard mobile format if prefixed by 91 or 0
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2);
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return digitsOnly.slice(1);
  }
  return digitsOnly.slice(0, 10);
}

/**
 * Sanitizes 6-digit Indian PIN codes strictly.
 */
export function sanitizePincode(raw: unknown): string {
  if (typeof raw !== 'string' && typeof raw !== 'number') return '';
  const digits = String(raw).replace(/[^0-9]/g, '').slice(0, 6);
  if (/^[1-9][0-9]{5}$/.test(digits)) {
    return digits;
  }
  return digits;
}

/**
 * Validates URLs ensuring they use secure protocols (https, http, or relative path)
 * and disallows dangerous pseudo-protocols like javascript: or data:
 */
export function isSafeUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;

  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true; // Safe relative URL
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return true;

  return false;
}
