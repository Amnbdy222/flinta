import type { HandlerEvent } from '@netlify/functions';

/**
 * Allowed storefront origins for strict CORS policy.
 */
const ALLOWED_ORIGINS = [
  'https://flintaindia.com',
  'https://www.flintaindia.com',
  'https://flint-a.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

const PREVIEW_DEPLOY_REGEX = /^https:\/\/[a-z0-9-]+--flint-a\.netlify\.app$/;

/**
 * Verify whether an incoming request Origin is trusted.
 */
export function isAllowedOrigin(origin: string | undefined | null): boolean {
  if (!origin) return false;
  const clean = origin.trim().toLowerCase();
  if (ALLOWED_ORIGINS.includes(clean)) return true;
  if (PREVIEW_DEPLOY_REGEX.test(clean)) return true;
  return false;
}

/**
 * Generate strict CORS and defense-in-depth security headers.
 */
export function getSecureCorsHeaders(event: HandlerEvent): Record<string, string> {
  const incomingOrigin = event.headers.origin || event.headers.Origin;
  const matchedOrigin = isAllowedOrigin(incomingOrigin) ? incomingOrigin! : 'https://flintaindia.com';

  return {
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

/**
 * Handle HTTP OPTIONS preflight request.
 */
export function handleCorsPreflight(event: HandlerEvent) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: getSecureCorsHeaders(event),
      body: '',
    };
  }
  return null;
}

/**
 * Resolve required environment variable with alternative fallback name.
 * Throws clean error if completely absent (no hardcoded credentials).
 */
export function getRequiredEnv(key: string, altKey?: string): string {
  const val = process.env[key] || (altKey ? process.env[altKey] : undefined);
  if (!val || val.trim() === '') {
    throw new Error(`Missing required server environment variable: ${key}${altKey ? ` or ${altKey}` : ''}`);
  }
  return val.trim();
}
