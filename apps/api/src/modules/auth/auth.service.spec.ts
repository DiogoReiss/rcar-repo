import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { TokenBlacklistService } from './token-blacklist.service.js';

// Minimal mocks
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  passwordResetToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

const mockConfig = {
  get: jest.fn().mockImplementation((key: string, fallback?: string) => fallback ?? ''),
};

const mockBlacklist = {
  revoke: jest.fn(),
  isRevoked: jest.fn().mockReturnValue(false),
};

const mockMail = {
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'PrismaService', useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
        { provide: TokenBlacklistService, useValue: mockBlacklist },
        { provide: 'MailService', useValue: mockMail },
      ],
    })
      .overrideProvider(AuthService)
      .useFactory({
        factory: () =>
          new (AuthService as any)(
            mockPrisma,
            mockJwtService,
            mockConfig,
            mockBlacklist,
            mockMail,
          ),
      })
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException for inactive user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const mockRes: any = { cookie: jest.fn() };
      await expect(
        service.login({ email: 'x@x.com', senha: 'pass' }, mockRes),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException for invalid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('bad-token', 'newpass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: '1',
        userId: 'u1',
        token: 'tok',
        expiresAt: new Date(Date.now() - 1000), // expired
        usedAt: null,
      });
      await expect(service.resetPassword('tok', 'newpass')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('TokenBlacklistService', () => {
    it('should revoke and detect revoked tokens', () => {
      const blacklist = new TokenBlacklistService();
      blacklist.revoke('token-abc');
      expect(blacklist.isRevoked('token-abc')).toBe(true);
      expect(blacklist.isRevoked('token-xyz')).toBe(false);
    });
  });
});

