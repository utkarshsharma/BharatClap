import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly client: Twilio;
  private readonly whatsappFrom: string;

  constructor(private readonly config: ConfigService) {
    const accountSid = this.config.get<string>('app.twilio.accountSid');
    const authToken = this.config.get<string>('app.twilio.authToken');
    this.whatsappFrom = this.config.get<string>('app.twilio.whatsappFrom', '');

    this.client = new Twilio(accountSid, authToken);
    this.logger.log('Twilio client initialized');
  }

  async sendWhatsApp(to: string, templateBody: string): Promise<boolean> {
    try {
      // Ensure the 'to' number has the whatsapp: prefix
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const formattedFrom = this.whatsappFrom.startsWith('whatsapp:')
        ? this.whatsappFrom
        : `whatsapp:${this.whatsappFrom}`;

      const message = await this.client.messages.create({
        body: templateBody,
        from: formattedFrom,
        to: formattedTo,
      });

      this.logger.log(`WhatsApp message sent successfully. SID: ${message.sid}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);

      // Handle specific error cases
      if (error.code === 21211) {
        this.logger.warn(`Invalid phone number: ${to}`);
      } else if (error.code === 21608) {
        this.logger.warn(`Phone number is not a WhatsApp number: ${to}`);
      }

      return false;
    }
  }
}
