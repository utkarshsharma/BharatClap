import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private readonly app: admin.app.App;

  constructor(private readonly config: ConfigService) {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      const projectId = this.config.get<string>('app.firebase.projectId');
      const clientEmail = this.config.get<string>('app.firebase.clientEmail');
      const privateKey = this.config
        .get<string>('app.firebase.privateKey', '')
        .replace(/\\n/g, '\n');

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      this.logger.log('Firebase Admin SDK initialized');
    } else {
      this.app = admin.apps[0]!;
      this.logger.log('Using existing Firebase Admin SDK instance');
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent successfully: ${response}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send push notification: ${error.message}`);

      // Handle specific error cases
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(`Invalid FCM token: ${fcmToken}`);
      }

      return false;
    }
  }

  async sendMulticastPush(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Multicast push sent. Success: ${response.successCount}, Failure: ${response.failureCount}`,
      );

      // Log failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            this.logger.warn(
              `Failed to send to token ${tokens[idx]}: ${resp.error?.message}`,
            );
          }
        });
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send multicast push: ${error.message}`);
      return { successCount: 0, failureCount: tokens.length };
    }
  }
}
