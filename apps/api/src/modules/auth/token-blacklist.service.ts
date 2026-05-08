import { Injectable } from '@nestjs/common';

/**
 * S4: In-memory refresh token blacklist.
 * Tokens are added on logout and expire naturally with the token TTL.
 * For production with multiple instances, replace with a Redis SET.
 */
@Injectable()
export class TokenBlacklistService {
  private readonly blacklist = new Set<string>();

  revoke(token: string): void {
    this.blacklist.add(token);
  }

  isRevoked(token: string): boolean {
    return this.blacklist.has(token);
  }
}
