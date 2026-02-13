# BharatClap Implementation Issues

Items that require external service setup and cannot be fully implemented without real API keys/accounts.

## 1. Supabase Realtime (Phase 1B)

**Status:** Implemented as polling fallback
**Reason:** Supabase Realtime requires a Supabase project with Realtime enabled and the `@supabase/supabase-js` client configured with project URL and anon key. The current backend uses Prisma with a direct PostgreSQL connection, not the Supabase client SDK.

**What was done:**
- `useRealtime` hook polls booking status every 10 seconds via React Query `refetchInterval`
- This provides functionally equivalent live updates without WebSocket infrastructure

**To upgrade to real Realtime:**
1. Install `@supabase/supabase-js` in both backend and mobile
2. Create `supabase-realtime.service.ts` that broadcasts booking status changes to channels
3. Update `useRealtime` hook to subscribe to Supabase channels instead of polling
4. Requires: `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables

## 2. Setu Aadhaar KYC (Phase 6B)

**Status:** Implemented with mock mode
**Reason:** Real Aadhaar e-KYC via Setu/DigiLocker requires a production Setu account, API keys, and regulatory compliance (UIDAI registration). Testing with real Aadhaar numbers requires sandbox access.

**What was done:**
- `setu-kyc.service.ts` created with full Setu API integration code
- Mock mode auto-verifies providers in development (3-second delay simulation)
- KYC endpoints: `POST /provider/kyc/initiate`, `GET /provider/kyc/status`, `POST /provider/kyc/callback`
- Mobile KYC screen shows status and simulated verification flow

**To enable real KYC:**
1. Register at Setu.co for DigiLocker/Aadhaar KYC API access
2. Set `SETU_API_KEY` environment variable
3. The service will automatically use real API when key is present

## 3. Google Maps Integration (Phase 7B)

**Status:** Not implemented
**Reason:** `react-native-maps` requires a dev build (expo-dev-client), not Expo Go. It also requires a Google Maps API key with Places and Maps SDK enabled. Adding it would break the ability to test via Expo Go.

**What was done:**
- Address input uses text fields (addressLine, city, pincode)
- Location detection uses `expo-location` for GPS coordinates
- Provider search uses Haversine distance calculation on backend

**To add Google Maps:**
1. Run `npx expo install react-native-maps`
2. Configure `expo-dev-client` for native builds
3. Add `GOOGLE_MAPS_API_KEY` to app.config
4. Add MapView to address screen for pin-drop
5. Add MapView to provider profile for service area visualization

## 4. Razorpay Route / Linked Accounts

**Status:** Implemented with dev-mode fallback
**Reason:** Razorpay Route requires providers to be registered as "linked accounts" on the platform's Razorpay dashboard. Each provider needs their own Razorpay account linked. In test mode, mock transfers are returned.

**What was done:**
- `createTransfer()` now makes real Razorpay API calls
- Falls back to mock transfer object in development mode
- `razorpayAccountId` field added to ProviderProfile schema
- Transfer auto-triggered on booking completion (80% to provider)

## 5. Firebase Push Notifications (Production)

**Status:** Implemented but requires project setup
**Reason:** Push notifications via `expo-notifications` work in development with Expo Push Token, but production deployment requires Firebase Cloud Messaging configuration with proper certificates (APNs for iOS, FCM for Android).

**What was done:**
- `useNotifications` hook registers for push and sends token to backend
- Backend `firebase.service.ts` handles sending notifications
- `notifications.controller.ts` manages device registration

## 6. Chat Messages (Phase 6C)

**Status:** Implemented with polling
**Reason:** Real-time chat ideally uses WebSockets (Supabase Realtime or Socket.IO). Without WebSocket infrastructure, chat uses polling.

**What was done:**
- Chat screens created for both customer and provider
- Messages exchanged via polling (refetch every 5 seconds)
- Backend endpoints for message send/receive exist in bookings module

**To upgrade:** Use Supabase Realtime channels for instant message delivery.

## 7. Grok AI — Search & Dispute Resolution (Phase 1C, Verification #5, #6)

**Status:** Implemented with fallback
**Reason:** Both AI-powered search and AI dispute resolution require an xAI/Grok API key (`XAI_API_KEY`). Without it, search falls back to text-based PostgreSQL matching (ILIKE), and dispute resolution skips the AI ruling step.

**What was done:**
- `grok.service.ts` calls xAI API to parse natural language queries like "fix my leaking tap tomorrow morning" into structured search filters (service type, date, time)
- `disputes.service.ts` calls Grok with both parties' evidence to generate a ruling and determine fault
- Both gracefully fall back when `XAI_API_KEY` is not set

**To enable:**
1. Get an API key from xAI (console.x.ai)
2. Set `XAI_API_KEY` environment variable
3. Both search and disputes will automatically use AI when the key is present

## 8. Twilio WhatsApp — Emergency Contact Notification (Verification #13)

**Status:** Implemented, requires Twilio credentials
**Reason:** WhatsApp Business API via Twilio requires a Twilio account with WhatsApp sandbox or production access, plus `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM` configured.

**What was done:**
- `bookings.service.ts` sends emergency contact notification when booking status changes to `IN_PROGRESS`
- Message includes customer name, address, provider name, Aadhaar verification status, and service name
- `twilio.service.ts` handles WhatsApp message sending

**To enable:**
1. Create Twilio account and enable WhatsApp sandbox
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
3. Emergency notifications will be sent automatically

## 9. Recurring Bookings Auto-Creation (Verification #7)

**Status:** Backend module exists, auto-creation requires cron job
**Reason:** The `recurring/` backend module handles CRUD for recurring booking schedules. Automatic creation of the next occurrence requires a scheduled cron job that isn't triggered in dev mode without explicit setup.

**What was done:**
- Recurring booking endpoints: create, list, update, cancel
- Mobile screens for listing and creating recurring bookings
- Backend recurring service with logic to calculate next occurrence dates

**To enable auto-creation:**
1. Ensure `@nestjs/schedule` is configured and the ScheduleModule is imported
2. The cron job in the recurring service should trigger daily to check for and create upcoming bookings
