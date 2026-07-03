import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Deterministic HMAC-SHA256 signature over the meaningful webhook fields.
 * Providers sign `${eventId}.${externalId}.${status}` with a shared secret;
 * we recompute and compare in constant time. Using explicit fields (instead of
 * a re-stringified body) avoids JSON key-ordering ambiguity.
 */
export function computeWebhookSignature(
  secret: string,
  parts: { eventId: string; externalId: string; status: string },
): string {
  return createHmac('sha256', secret)
    .update(`${parts.eventId}.${parts.externalId}.${parts.status}`)
    .digest('hex');
}

export function verifyWebhookSignature(
  secret: string,
  parts: { eventId: string; externalId: string; status: string },
  provided: string | undefined,
): boolean {
  if (!provided) return false;
  const expected = computeWebhookSignature(secret, parts);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
