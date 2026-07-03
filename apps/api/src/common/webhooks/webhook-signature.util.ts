import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Deterministic HMAC-SHA256 over a canonical payload string. Providers sign a
 * dot-joined field string (e.g. `${eventId}.${externalId}.${status}`) with a
 * shared secret; we recompute and compare in constant time. Using explicit
 * fields instead of a re-stringified body avoids JSON key-ordering ambiguity.
 */
export function hmacSignature(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHmacSignature(
  secret: string,
  payload: string,
  provided: string | undefined,
): boolean {
  if (!provided) return false;
  const expected = hmacSignature(secret, payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
