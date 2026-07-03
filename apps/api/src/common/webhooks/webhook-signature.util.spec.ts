import { hmacSignature, verifyHmacSignature } from './webhook-signature.util';

describe('webhook-signature.util', () => {
  const secret = 'test-secret';
  const payload = 'evt-1.tx-1.CONFIRMED';

  it('accepts a signature it produced', () => {
    const sig = hmacSignature(secret, payload);
    expect(verifyHmacSignature(secret, payload, sig)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const sig = hmacSignature(secret, payload);
    expect(verifyHmacSignature(secret, 'evt-1.tx-1.REFUSED', sig)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    const sig = hmacSignature(secret, payload);
    expect(verifyHmacSignature('other-secret', payload, sig)).toBe(false);
  });

  it('rejects a missing signature', () => {
    expect(verifyHmacSignature(secret, payload, undefined)).toBe(false);
  });

  it('rejects a malformed/short signature without throwing', () => {
    expect(verifyHmacSignature(secret, payload, 'abc')).toBe(false);
  });
});
