import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto, RespondDisputeDto } from './dto/create-dispute.dto';
import { OverrideDisputeDto } from './dto/override-dispute.dto';
import { DisputeStatus, BookingStatus, UserRole } from '@prisma/client';

interface AiRulingResponse {
  inFavor: 'customer' | 'provider';
  reasoning: string;
  suggestedRefundPercentage: number;
}

@Injectable()
export class DisputesService {
  private readonly grokApiKey: string;
  private readonly grokApiUrl = 'https://api.x.ai/v1/chat/completions';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.grokApiKey = this.config.get<string>('app.xai.apiKey', '');
  }

  async openDispute(
    customerId: string,
    bookingId: string,
    dto: CreateDisputeDto,
  ) {
    // Validate booking exists and belongs to customer
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You can only dispute your own bookings');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be disputed');
    }

    // Check if dispute already exists
    const existingDispute = await this.prisma.dispute.findUnique({
      where: { bookingId },
    });

    if (existingDispute) {
      throw new BadRequestException('Dispute already exists for this booking');
    }

    // Create dispute
    const dispute = await this.prisma.dispute.create({
      data: {
        bookingId,
        customerId,
        providerId: booking.providerId!,
        status: DisputeStatus.OPEN,
        customerEvidenceText: dto.evidenceText,
        customerEvidencePhotos: dto.evidencePhotos || [],
      },
      include: {
        booking: {
          include: {
            customer: true,
            provider: true,
            service: true,
          },
        },
      },
    });

    return dispute;
  }

  async respondToDispute(
    providerId: string,
    disputeId: string,
    dto: RespondDisputeDto,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.providerId !== providerId) {
      throw new ForbiddenException('You can only respond to your own disputes');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Dispute is already processed');
    }

    // Update dispute with provider evidence
    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        providerEvidenceText: dto.evidenceText,
        providerEvidencePhotos: dto.evidencePhotos || [],
      },
      include: {
        booking: {
          include: {
            customer: true,
            provider: true,
            service: true,
            payment: true,
          },
        },
      },
    });

    // Both sides have submitted evidence, trigger AI ruling
    if (
      updatedDispute.customerEvidenceText &&
      updatedDispute.providerEvidenceText
    ) {
      // Trigger AI ruling asynchronously
      this.generateAiRuling(disputeId).catch((error) => {
        console.error('Failed to generate AI ruling:', error);
      });
    }

    return updatedDispute;
  }

  async generateAiRuling(disputeId: string): Promise<void> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            customer: true,
            provider: true,
            service: true,
            payment: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (!dispute.customerEvidenceText || !dispute.providerEvidenceText) {
      throw new BadRequestException('Both parties must submit evidence first');
    }

    // Prepare context for AI
    const context = {
      bookingId: dispute.bookingId,
      serviceName: dispute.booking.service.name,
      serviceCategory: dispute.booking.service.categoryId,
      bookingAmount: dispute.booking.amount,
      bookingDate: dispute.booking.scheduledDate,
      customerEvidence: {
        text: dispute.customerEvidenceText,
        photoCount: dispute.customerEvidencePhotos.length,
      },
      providerEvidence: {
        text: dispute.providerEvidenceText,
        photoCount: dispute.providerEvidencePhotos.length,
      },
    };

    const systemPrompt = `You are an AI arbitrator for a service marketplace dispute resolution system.
Your task is to analyze evidence from both the customer and service provider and make a fair ruling.

Consider:
- Quality and credibility of evidence
- Service terms and expectations
- Both parties' perspectives
- Fair resolution for both parties

You must respond with a JSON object containing:
{
  "inFavor": "customer" or "provider",
  "reasoning": "Detailed explanation of your decision",
  "suggestedRefundPercentage": number between 0-100
}`;

    const userPrompt = `Dispute Context:
Service: ${context.serviceName} (${context.serviceCategory})
Amount: ₹${(context.bookingAmount / 100).toFixed(2)}
Scheduled Date: ${context.bookingDate}

Customer Evidence:
${context.customerEvidence.text}
(${context.customerEvidence.photoCount} photo(s) provided)

Provider Evidence:
${context.providerEvidence.text}
(${context.providerEvidence.photoCount} photo(s) provided)

Please analyze and provide your ruling in JSON format.`;

    try {
      const response = await fetch(this.grokApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.grokApiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini-fast',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse AI response
      const ruling: AiRulingResponse = JSON.parse(aiResponse);

      // Calculate refund amount
      const refundAmount =
        ruling.inFavor === 'customer'
          ? Math.round(
              (dispute.booking.amount * ruling.suggestedRefundPercentage) /
                100,
            )
          : 0;

      // Update dispute with AI ruling
      await this.prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.AI_RULED,
          aiRuling: ruling.reasoning,
          aiRulingInFavor: ruling.inFavor,
          refundAmount,
        },
      });
    } catch (error) {
      console.error('Error generating AI ruling:', error);
      // Update dispute with error status
      await this.prisma.dispute.update({
        where: { id: disputeId },
        data: {
          aiRuling: `Failed to generate AI ruling: ${(error as Error).message}`,
        },
      });
      throw error;
    }
  }

  async getDispute(userId: string, disputeId: string, userRole?: UserRole) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            customer: true,
            provider: true,
            service: true,
            payment: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Check if user has access to this dispute
    const isAdmin = userRole === UserRole.ADMIN;
    const isCustomer = dispute.customerId === userId;
    const isProvider = dispute.providerId === userId;

    if (!isAdmin && !isCustomer && !isProvider) {
      throw new ForbiddenException('You do not have access to this dispute');
    }

    return dispute;
  }

  async adminOverride(disputeId: string, dto: OverrideDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute is already resolved');
    }

    // Update dispute with admin override
    const updatedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.ADMIN_OVERRIDDEN,
        adminOverrideRuling: dto.ruling,
        adminOverrideInFavor: dto.inFavor,
        refundAmount: dto.refundAmount !== undefined ? dto.refundAmount : dispute.refundAmount,
      },
      include: {
        booking: {
          include: {
            customer: true,
            provider: true,
            service: true,
          },
        },
      },
    });

    return updatedDispute;
  }

  async resolveDispute(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: { payment: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute is already resolved');
    }

    if (
      dispute.status !== DisputeStatus.AI_RULED &&
      dispute.status !== DisputeStatus.ADMIN_OVERRIDDEN
    ) {
      throw new BadRequestException('Dispute must be ruled before resolving');
    }

    // Update dispute status
    const resolvedDispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: {
        booking: {
          include: {
            customer: true,
            provider: true,
            service: true,
            payment: true,
          },
        },
      },
    });

    // TODO: Process refund if applicable
    // This would involve creating a refund transaction via payment gateway
    if (resolvedDispute.refundAmount && resolvedDispute.refundAmount > 0) {
      console.log(
        `Refund of ₹${(resolvedDispute.refundAmount / 100).toFixed(2)} to be processed for booking ${resolvedDispute.bookingId}`,
      );
    }

    return resolvedDispute;
  }

  async listDisputes(pagination: { page: number; limit: number }) {
    const skip = (pagination.page - 1) * pagination.limit;

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              customer: true,
              provider: true,
              service: true,
            },
          },
        },
      }),
      this.prisma.dispute.count(),
    ]);

    return {
      data: disputes,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
