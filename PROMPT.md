# BharatClap — Implementation Prompt

You are building BharatClap, a home services marketplace. The complete PRD is at `./PRD.md` — read it thoroughly on your first iteration.

All credentials are in `./.env`. Real keys, tested and working.

## Rules

- **Read PRD.md first** every iteration if you haven't internalized it yet.
- **Check what exists** before doing anything. Run `ls`, `find`, check `package.json` files, check if the backend compiles, if the mobile app runs, etc.
- **Pick up where you left off.** Look at git log, file system state, and PROGRESS.md to determine what's done and what's next.
- **Update PROGRESS.md** at the end of every iteration with what you completed and what's next.
- **Git commit** after every meaningful chunk of work (a completed step, a working module, etc.). Use descriptive commit messages.
- **Fix errors before moving on.** If something doesn't compile or a migration fails, fix it in the same iteration.
- **Use the real credentials from .env** — never use placeholder/dummy values.
- **Follow the PRD exactly** — the file structure, the tech stack, the API design, the database schema. Don't deviate.

## Phase Sequence

Work through these phases in order. Complete each phase fully before moving to the next.

### Phase 1: Foundation

**Step 1.1 — Turborepo + Backend Scaffold**
- Init Turborepo monorepo at project root with `apps/backend`, `apps/mobile`, `apps/web`, `packages/shared-types` workspaces
- Scaffold NestJS backend in `apps/backend` with TypeScript strict mode
- Configure `nest-cli.json`, `tsconfig.json`, root `turbo.json`, root `package.json`
- Add health endpoint at `GET /api/v1/health`
- Verify: `npm install` at root works, `npm run start:dev` in backend starts on port 3000

**Step 1.2 — Prisma Schema + Database**
- Write complete Prisma schema (`apps/backend/prisma/schema.prisma`) — all 16 models, 7 enums from PRD Section 5
- Configure Supabase connection (construct DATABASE_URL from .env credentials)
- Run `npx prisma migrate dev` successfully
- Verify: all tables created in Supabase

**Step 1.3 — Seed Data**
- Write `apps/backend/prisma/seed.ts` — 8 categories, 50+ services (6-8 per category), 20-30 demo providers with realistic Indian names/data, sample bookings, reviews
- Run `npx prisma db seed` successfully
- Verify: query data in Supabase Studio

**Step 1.4 — Backend Common Infrastructure**
- Build: JwtAuthGuard, RolesGuard, @CurrentUser, @Roles, @Public decorators, ValidationPipe, HttpExceptionFilter, TransformInterceptor, PaginationDto
- Configure: Prisma module/service, configuration module (env vars), Swagger at `/api/docs`
- Verify: Swagger UI accessible at `/api/docs`

**Step 1.5 — Shared Types Package**
- Create `packages/shared-types` with all TypeScript types/enums matching Prisma schema
- Verify: importable from backend

**Step 1.6 — Mobile App Scaffold**
- Create Expo app (SDK 52+) in `apps/mobile` with Expo Router, expo-dev-client
- Configure NativeWind, TanStack React Query, Zustand stores (auth + booking)
- Build UI component library: Button, Input, Card, Badge, Avatar, BottomSheet, LoadingSpinner, Skeleton, EmptyState, StarRating, OtpInput
- Set up theme (#FF6B00 orange primary), API service layer (Axios + JWT interceptor), navigation shell (auth/customer/provider tab layouts)
- Set up i18n with English strings
- Verify: `npx expo start` runs, navigation works

**Step 1.7 — Web App Scaffold**
- Create Next.js 15 app in `apps/web` with App Router, Tailwind, shadcn/ui
- Set up admin layout with sidebar navigation
- Verify: `npm run dev` serves web app

### Phase 2: Backend API Modules

**Step 2.1 — Auth + Users**
- Auth module: Firebase Admin SDK, JWT strategy, login/set-role/refresh/logout endpoints
- Users module: GET/PATCH/DELETE /users/me, data-export
- Addresses module: full CRUD
- Verify: auth flow works end-to-end via Swagger

**Step 2.2 — Catalog + Search**
- Catalog module: categories tree, services by category, service detail
- Search module: Postgres FTS + Grok API natural language parsing
- Verify: search "fix my leaking tap" returns plumbing services

**Step 2.3 — Providers**
- Provider self-management: profile, services+custom prices, availability, portfolio, KYC (Setu), bank details, earnings, payouts
- Customer-facing: list/filter providers, provider profile, favorites
- Verify: all provider endpoints work

**Step 2.4 — Bookings (CORE)**
- Create booking with validation, list with pagination, detail
- Full state machine: all status transitions with validation + logging
- OTP generation/verification, auto-complete (BullMQ), provider timeout (BullMQ)
- Recurring bookings: create/manage, auto-generate via cron, confirm/skip
- Verify: complete booking lifecycle works via API

**Step 2.5 — Payments**
- Razorpay: order creation, webhook handler (signature verification, idempotent), commission calc (20/80)
- Refund processing per cancellation policy
- Verify: test mode payment flow works

**Step 2.6 — Reviews + Disputes + Notifications + Admin**
- Reviews: 4-dimension ratings, aggregate updates
- Disputes: open/respond, Grok API analysis, AI ruling
- Notifications: FCM push (Firebase Admin), Twilio WhatsApp, BullMQ job processing
- Admin: dashboard stats, bookings/providers/payments/disputes management, batch payouts
- Verify: all endpoints functional

### Phase 3: Mobile Screens + Web

**Step 3.1 — Mobile Auth Screens**
- Welcome walkthrough (3 screens), login (phone), OTP verification, role selection, location permission
- Integrate Firebase Auth + backend JWT
- Verify: can login and reach home screen

**Step 3.2 — Customer Screens**
- Home, search, category, service detail, provider selection, provider profile
- Booking flow: schedule, address (Google Places), summary, Razorpay checkout, confirmation
- Booking detail, review screen, my bookings, favorites, notifications, help, profile
- Verify: full customer booking flow works on simulator

**Step 3.3 — Provider Screens**
- Dashboard, bookings list/detail (accept/reject/OTP/complete)
- Onboarding: services+prices, availability, portfolio, bank
- Earnings, KYC, profile
- Common: edit profile, city select, dispute, settings
- Verify: provider can accept and complete a booking

**Step 3.4 — Web Admin + Marketing**
- Admin dashboard (Recharts), bookings table (TanStack Table), providers (approve/suspend), payments (batch payout), disputes (override)
- Marketing landing page, privacy policy, terms of service
- Verify: admin panel shows real data from API

### Phase 4: Polish + Testing

**Step 4.1 — Tests**
- Unit tests: booking state machine, payment service, auth service
- Integration tests: all API endpoints via Supertest
- E2E: full booking flow
- Verify: `npm run test` passes

**Step 4.2 — Security + Compliance**
- Helmet, CORS, rate limiting (Redis-backed), input sanitization
- DPDP: consent screen, data deletion, data export
- i18n: Hindi, Marathi, Kannada translations
- Verify: security headers present, rate limits work

**Step 4.3 — CI/CD + Deployment**
- GitHub Actions workflows
- Dockerfile for backend
- EAS build profiles
- Verify: CI pipeline runs

## Completion

When ALL phases are complete — backend running, mobile app functional, web admin working, tests passing — output:

<promise>BHARATCLAP COMPLETE</promise>
