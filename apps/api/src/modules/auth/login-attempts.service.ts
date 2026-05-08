import { Injectable } from '@nestjs/common';

interface AttemptRecord {
  count: number;
  lockedUntil?: Date;
}

/**
 * S11: In-process per-account login attempt tracking.
 * Locks an account for 15 minutes after 10 failed attempts.
 * Note: In a multi-instance deployment, replace with Redis.
 */
@Injectable()
export class LoginAttemptsService {
  private readonly store = new Map<string, AttemptRecord>();
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min

  isLocked(email: string): boolean {
    const record = this.store.get(email);
    if (!record?.lockedUntil) return false;
    if (record.lockedUntil > new Date()) return true;
    // Lock expired — clear it
    this.store.delete(email);
    return false;
  }

  recordFailure(email: string): void {
    const record = this.store.get(email) ?? { count: 0 };
    record.count++;
    if (record.count >= LoginAttemptsService.MAX_ATTEMPTS) {
      record.lockedUntil = new Date(
        Date.now() + LoginAttemptsService.LOCK_DURATION_MS,
      );
    }
    this.store.set(email, record);
  }

  clearAttempts(email: string): void {
    this.store.delete(email);
  }

  getRemainingLockMs(email: string): number {
    const record = this.store.get(email);
    if (!record?.lockedUntil) return 0;
    return Math.max(0, record.lockedUntil.getTime() - Date.now());
  }
}
