import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('app.firebase.projectId');
    const privateKey = this.configService.get<string>('app.firebase.privateKey');
    const clientEmail = this.configService.get<string>('app.firebase.clientEmail');

    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn('Firebase credentials not found in config. Firebase authentication will not work.');
      return;
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
      this.logger.log('Firebase Admin SDK initialized successfully');
    }
  }

  async verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      this.logger.error('Failed to verify Firebase token', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async login(firebaseIdToken: string) {
    const decodedToken = await this.verifyFirebaseToken(firebaseIdToken);

    const firebaseUid = decodedToken.uid;
    const phone = decodedToken.phone_number || '';

    if (!phone) {
      throw new BadRequestException('Phone number not found in Firebase token');
    }

    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        providerProfile: true,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          firebaseUid,
          phone,
          isActive: true,
        },
        include: {
          providerProfile: true,
        },
      });
      this.logger.log(`Created new user with firebaseUid: ${firebaseUid}`);
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.role || UserRole.CUSTOMER,
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async setRole(userId: string, role: 'CUSTOMER' | 'PROVIDER') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.role && user.role !== UserRole.CUSTOMER && user.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Cannot change role for this user');
    }

    if (user.role && user.role !== role) {
      throw new ForbiddenException('User role is already set and cannot be changed');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      include: {
        providerProfile: true,
      },
    });

    if (role === UserRole.PROVIDER && !updatedUser.providerProfile) {
      await this.prisma.providerProfile.create({
        data: {
          userId: updatedUser.id,
        },
      });
    }

    return updatedUser;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('app.jwt.secret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const tokens = await this.generateTokens(user.id, user.role || UserRole.CUSTOMER);

      return tokens;
    } catch (error) {
      this.logger.error('Failed to refresh token', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    this.logger.log(`User ${userId} logged out`);
    return { message: 'Logged out successfully' };
  }

  async loginDevMode(phone: string) {
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || process.env.NODE_ENV;
    if (nodeEnv !== 'development') {
      throw new ForbiddenException('Dev login is only available in development mode');
    }

    // Try exact match first, then try with/without +91 prefix
    const stripped = phone.replace(/^\+91/, '');
    const withPrefix = `+91${stripped}`;

    const user = await this.prisma.user.findFirst({
      where: { phone: { in: [phone, stripped, withPrefix] } },
      include: { providerProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException(`No user found with phone: ${phone}`);
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.role || UserRole.CUSTOMER,
    );

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(userId: string, role: UserRole) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.secret'),
      expiresIn: this.configService.get<string>('app.jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.secret'),
      expiresIn: this.configService.get<string>('app.jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }
}
