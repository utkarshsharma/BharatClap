import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { KycStatus } from '@prisma/client';

@Injectable()
export class SetuKycService {
  private readonly logger = new Logger(SetuKycService.name);
  private readonly setuApiKey: string;
  private readonly setuBaseUrl: string;
  private readonly isMockMode: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.setuApiKey = this.config.get<string>('app.setu.apiKey', '');
    this.setuBaseUrl = this.config.get<string>(
      'app.setu.baseUrl',
      'https://dg-sandbox.setu.co',
    );
    const nodeEnv = this.config.get<string>('app.nodeEnv') || process.env.NODE_ENV;
    this.isMockMode = !this.setuApiKey || nodeEnv === 'development';
  }

  /**
   * Initiate Aadhaar e-KYC verification for a provider
   */
  async initiateKyc(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('Provider profile not found');
    }

    if (profile.kycStatus === KycStatus.VERIFIED) {
      throw new BadRequestException('KYC is already verified');
    }

    if (profile.kycStatus === KycStatus.PENDING) {
      throw new BadRequestException('KYC verification is already in progress');
    }

    // Update status to PENDING
    await this.prisma.providerProfile.update({
      where: { userId },
      data: { kycStatus: KycStatus.PENDING },
    });

    if (this.isMockMode) {
      this.logger.warn('Running in mock KYC mode — auto-verifying in 3 seconds');

      // In mock mode, auto-verify after a short delay
      setTimeout(async () => {
        try {
          await this.prisma.providerProfile.update({
            where: { userId },
            data: {
              kycStatus: KycStatus.VERIFIED,
              aadhaarVerified: true,
              aadhaarLast4: '1234',
            },
          });
          this.logger.log(`Mock KYC verified for user ${userId}`);
        } catch (err: any) {
          this.logger.error(`Mock KYC verification failed: ${err.message}`);
        }
      }, 3000);

      return {
        status: 'PENDING',
        message: 'KYC verification initiated (mock mode — will auto-verify)',
        redirectUrl: null,
      };
    }

    // Real Setu API integration
    try {
      const response = await fetch(
        `${this.setuBaseUrl}/api/digilocker/initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': this.setuApiKey,
            'x-product-instance-id': this.setuApiKey,
          },
          body: JSON.stringify({
            redirectUrl: `${this.config.get('app.frontendUrl', 'https://bharatclap.in')}/kyc/callback`,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Setu API error: ${response.statusText}`);
      }

      const data = await response.json();

      this.logger.log(`Setu KYC initiated for user ${userId}: ${data.id}`);

      return {
        status: 'PENDING',
        message: 'KYC verification initiated. Please complete the Aadhaar verification.',
        redirectUrl: data.url || null,
        requestId: data.id,
      };
    } catch (error: any) {
      this.logger.error(`Setu KYC initiation failed: ${error.message}`);

      // Revert status on failure
      await this.prisma.providerProfile.update({
        where: { userId },
        data: { kycStatus: KycStatus.NOT_STARTED },
      });

      throw new BadRequestException(
        `KYC verification failed to initiate: ${error.message}`,
      );
    }
  }

  /**
   * Check KYC status for a provider
   */
  async getKycStatus(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        kycStatus: true,
        aadhaarVerified: true,
        aadhaarLast4: true,
      },
    });

    if (!profile) {
      throw new BadRequestException('Provider profile not found');
    }

    return {
      status: profile.kycStatus,
      isVerified: profile.aadhaarVerified,
      aadhaarLast4: profile.aadhaarLast4,
    };
  }

  /**
   * Handle Setu webhook callback
   */
  async handleSetuCallback(payload: any) {
    const { requestId, status, aadhaarData } = payload;

    this.logger.log(`Setu callback received: ${requestId}, status: ${status}`);

    if (status === 'complete' && aadhaarData) {
      // Find the provider by some means (request ID mapping needed in production)
      // For now, this is a placeholder for webhook handling
      this.logger.log('Setu KYC verification completed via webhook');
    }

    return { received: true };
  }
}
