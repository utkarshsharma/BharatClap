import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

// Mock firebase-admin before importing the service
jest.mock('firebase-admin', () => {
  const mockVerifyIdToken = jest.fn();
  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    auth: jest.fn(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
    __mockVerifyIdToken: mockVerifyIdToken,
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const firebaseAdmin = require('firebase-admin');
const mockVerifyIdToken = firebaseAdmin.__mockVerifyIdToken;

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  providerProfile: {
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'app.jwt.secret': 'test-jwt-secret',
      'app.jwt.expiresIn': '15m',
      'app.jwt.refreshExpiresIn': '7d',
      'app.firebase.projectId': 'test-project',
      'app.firebase.privateKey': 'test-key',
      'app.firebase.clientEmail': 'test@test.iam.gserviceaccount.com',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    // Restore default config mock behavior after clearAllMocks
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        'app.jwt.secret': 'test-jwt-secret',
        'app.jwt.expiresIn': '15m',
        'app.jwt.refreshExpiresIn': '7d',
        'app.firebase.projectId': 'test-project',
        'app.firebase.privateKey': 'test-key',
        'app.firebase.clientEmail': 'test@test.iam.gserviceaccount.com',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    const firebaseIdToken = 'valid-firebase-token';

    it('should create new user if not found and return tokens', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-1',
        phone_number: '+919876543210',
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        firebaseUid: 'firebase-uid-1',
        phone: '+919876543210',
        role: null,
        isActive: true,
        providerProfile: null,
      });
      mockJwtService.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-456');

      const result = await service.login(firebaseIdToken);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('user-1');
      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-456');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firebaseUid: 'firebase-uid-1',
            phone: '+919876543210',
            isActive: true,
          }),
        }),
      );
    });

    it('should return existing user and tokens if found', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-1',
        phone_number: '+919876543210',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        firebaseUid: 'firebase-uid-1',
        phone: '+919876543210',
        role: UserRole.CUSTOMER,
        isActive: true,
        providerProfile: null,
      });
      mockJwtService.sign
        .mockReturnValueOnce('access-token-789')
        .mockReturnValueOnce('refresh-token-012');

      const result = await service.login(firebaseIdToken);

      expect(result.user.id).toBe('user-1');
      expect(result.accessToken).toBe('access-token-789');
      expect(result.refreshToken).toBe('refresh-token-012');
      // Should NOT create a new user
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if no phone in Firebase token', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-1',
        phone_number: '', // Empty phone
      });

      await expect(service.login(firebaseIdToken)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(firebaseIdToken)).rejects.toThrow(
        'Phone number not found in Firebase token',
      );
    });

    it('should throw UnauthorizedException if Firebase token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.login('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── setRole ──────────────────────────────────────────────────────────────

  describe('setRole', () => {
    const userId = 'user-1';

    it('should set CUSTOMER role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: null,
        isActive: true,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        role: UserRole.CUSTOMER,
        isActive: true,
        providerProfile: null,
      });

      const result = await service.setRole(userId, 'CUSTOMER');

      expect(result.role).toBe(UserRole.CUSTOMER);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { role: 'CUSTOMER' },
        }),
      );
      // Should NOT create providerProfile for customer
      expect(mockPrismaService.providerProfile.create).not.toHaveBeenCalled();
    });

    it('should set PROVIDER role and create providerProfile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: null,
        isActive: true,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        role: UserRole.PROVIDER,
        isActive: true,
        providerProfile: null, // No profile yet
      });
      mockPrismaService.providerProfile.create.mockResolvedValue({
        id: 'profile-1',
        userId,
      });

      const result = await service.setRole(userId, 'PROVIDER');

      expect(result.role).toBe(UserRole.PROVIDER);
      expect(mockPrismaService.providerProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
          }),
        }),
      );
    });

    it('should NOT create providerProfile if one already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: null,
        isActive: true,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        role: UserRole.PROVIDER,
        isActive: true,
        providerProfile: { id: 'existing-profile' }, // Already has profile
      });

      await service.setRole(userId, 'PROVIDER');

      expect(mockPrismaService.providerProfile.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.setRole(userId, 'CUSTOMER'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.setRole(userId, 'CUSTOMER'),
      ).rejects.toThrow('User not found');
    });

    it('should throw ForbiddenException if role already set differently', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: UserRole.CUSTOMER,
        isActive: true,
      });

      await expect(
        service.setRole(userId, 'PROVIDER'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.setRole(userId, 'PROVIDER'),
      ).rejects.toThrow('User role is already set and cannot be changed');
    });

    it('should succeed if setting the same role that is already set', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        role: UserRole.CUSTOMER,
        isActive: true,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        role: UserRole.CUSTOMER,
        isActive: true,
        providerProfile: null,
      });

      const result = await service.setRole(userId, 'CUSTOMER');

      expect(result.role).toBe(UserRole.CUSTOMER);
    });
  });

  // ─── refreshToken ─────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        role: UserRole.CUSTOMER,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: UserRole.CUSTOMER,
        isActive: true,
      });
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-jwt-secret',
      });
    });

    it('should throw UnauthorizedException for invalid/expired token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        service.refreshToken('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-nonexistent',
        role: UserRole.CUSTOMER,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken('valid-token-no-user'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not active', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-1',
        role: UserRole.CUSTOMER,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: UserRole.CUSTOMER,
        isActive: false, // Inactive user
      });

      await expect(
        service.refreshToken('valid-token-inactive-user'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── generateTokens ──────────────────────────────────────────────────────

  describe('generateTokens', () => {
    it('should generate accessToken and refreshToken', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('generated-access-token')
        .mockReturnValueOnce('generated-refresh-token');

      const result = await service.generateTokens('user-1', UserRole.CUSTOMER);

      expect(result.accessToken).toBe('generated-access-token');
      expect(result.refreshToken).toBe('generated-refresh-token');

      // Verify sign was called twice - once for access, once for refresh
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);

      // Access token call
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: 'user-1', role: UserRole.CUSTOMER },
        expect.objectContaining({
          secret: 'test-jwt-secret',
          expiresIn: '15m',
        }),
      );

      // Refresh token call
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: 'user-1', role: UserRole.CUSTOMER },
        expect.objectContaining({
          secret: 'test-jwt-secret',
          expiresIn: '7d',
        }),
      );
    });

    it('should generate tokens for PROVIDER role', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('provider-access-token')
        .mockReturnValueOnce('provider-refresh-token');

      const result = await service.generateTokens('provider-1', UserRole.PROVIDER);

      expect(result.accessToken).toBe('provider-access-token');
      expect(result.refreshToken).toBe('provider-refresh-token');

      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: 'provider-1', role: UserRole.PROVIDER },
        expect.objectContaining({
          secret: 'test-jwt-secret',
        }),
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should return success message', async () => {
      const result = await service.logout('user-1');

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});
