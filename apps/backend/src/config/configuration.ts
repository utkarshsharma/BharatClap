import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  frontend: {
    url: process.env.FRONTEND_URL,
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  payu: {
    merchantKey: process.env.PAYU_MERCHANT_KEY,
    salt: process.env.PAYU_SALT,
    env: process.env.PAYU_ENV || 'TEST',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  xai: {
    apiKey: process.env.XAI_API_KEY,
  },

  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
  },

  setu: {
    clientId: process.env.SETU_CLIENT_ID,
    clientSecret: process.env.SETU_CLIENT_SECRET,
    productInstanceId: process.env.SETU_PRODUCT_INSTANCE_ID,
  },
}));
