# BharatClap — Complete Product Requirements Document & Technical Specification

---

## 1. CONTEXT & VISION

### Problem
India's home services market (~$15B+) remains fragmented. Customers face a trust deficit (no way to verify providers), quality inconsistency (no standardized pricing or outcomes), and discovery friction (word-of-mouth networks break down in urban migration).

### Solution
**BharatClap** is a private-venture home services marketplace that connects Aadhaar-verified service providers with customers. It competes with Urban Company (2.2M orders/month, $2.5B valuation) and Snabbit ($180M valuation) by integrating deeply with India's government identity infrastructure as a Day 1 trust differentiator.

### Business Model
- **Revenue**: Commission per booking (20% platform cut)
- **Launch cities**: Delhi NCR, Mumbai, Bangalore (metro first)
- **Entity**: Private Limited company (to be incorporated)
- **Pricing**: Provider-set custom prices per service

### Differentiation
- Government-grade identity verification (Aadhaar/DigiLocker) badges
- AI-powered natural language service discovery (Grok API)
- AI-mediated dispute resolution (both sides upload evidence, AI rules)
- Modern, vibrant UX (orange primary brand, Swiggy-tier design quality)

---

## 2. TARGET USERS

### Customer Personas

| Persona | Profile | Primary Need | Key Behavior |
|---------|---------|-------------|-------------|
| **Priya (28)** | Working professional, lives alone in Bangalore, 2BHK | Safety-first: wants verified providers, scheduled slots around work hours | Books via mobile, pays UPI, reads reviews carefully |
| **Sharma Ji (55)** | Family head in Delhi NCR, joint family, manages household maintenance | Reliability and fair pricing, wants invoices | Compares providers, prefers calling, values punctuality |
| **Meera (35)** | Young mother in Mumbai, two kids under 5 | Convenience: book from phone, track arrival, repeat bookings | Uses recurring bookings, saves favorite providers |

### Provider Personas

| Persona | Profile | Primary Need | Key Behavior |
|---------|---------|-------------|-------------|
| **Raju (32)** | Self-employed plumber in Delhi NCR, earns 15-25K/month | Steady work pipeline, digital payments, professional identity | Accepts bookings promptly, prefers nearby jobs |
| **Sunita (28)** | Trained beautician in Mumbai, works from home | Expand customer base, flexible hours, fair commission | Sets specific availability, builds repeat clientele |
| **Vikram (40)** | Experienced electrician with small team in Bangalore | Grow business, manage team, get high-ticket jobs | Sets premium prices, wants portfolio visibility |

---

## 3. COMPLETE TECH STACK

### 3.1 Frontend — Mobile (iOS + Android)

| Component | Technology | Version/Details |
|-----------|-----------|-----------------|
| **Framework** | React Native (Expo) | SDK 52+, Managed workflow |
| **Navigation** | Expo Router | File-based routing, layout groups |
| **Styling** | NativeWind | Tailwind CSS for React Native |
| **UI Components** | React Native Reusables (shadcn for RN) | Pre-built components matching shadcn/ui API |
| **State (client)** | Zustand | Auth tokens, in-progress booking, UI preferences |
| **State (server)** | TanStack React Query | Caching, refetching, optimistic updates, pagination |
| **Forms** | React Hook Form + Zod | Validation, controlled inputs |
| **Lists** | @shopify/flash-list | Performant virtualized lists |
| **Maps** | react-native-maps + Google Maps | Address autocomplete, pin drop, provider location |
| **Calendar** | react-native-calendars | Date picker for booking |
| **Payments** | react-native-razorpay | Razorpay checkout integration |
| **Push** | expo-notifications + FCM | Push notification handling |
| **Images** | expo-image | Fast image loading with caching |
| **Storage** | expo-secure-store | JWT token storage (encrypted) |
| **Camera** | expo-image-picker | Profile photos, portfolio uploads, review photos |
| **Video** | expo-video | Provider introduction videos (30s) |
| **Location** | expo-location | GPS permissions, current location |
| **Build** | EAS Build | Cloud builds for iOS + Android |
| **OTA Updates** | EAS Update | Over-the-air JS bundle updates |
| **Dev Build** | expo-dev-client | Required for native modules (Razorpay) |

### 3.2 Frontend — Web (Admin + Customer Landing)

| Component | Technology | Details |
|-----------|-----------|---------|
| **Framework** | Next.js 15 | App Router, Server Components |
| **Styling** | Tailwind CSS | Utility-first, same vocabulary as mobile |
| **UI Components** | shadcn/ui | Pre-built, accessible, customizable |
| **State** | TanStack React Query | Server state management |
| **Charts** | Recharts | Admin dashboard charts |
| **Tables** | TanStack Table | Admin data tables with sorting/filtering |
| **Forms** | React Hook Form + Zod | Consistent with mobile |
| **Auth** | NextAuth.js | Admin session management |
| **Deployment** | Vercel | Auto-deploy, edge functions |

### 3.3 Backend

| Component | Technology | Details |
|-----------|-----------|---------|
| **Framework** | NestJS | v10+, TypeScript, modular monolith |
| **Runtime** | Node.js | v20 LTS |
| **Language** | TypeScript | Strict mode |
| **ORM** | Prisma | v5+, type-safe queries, migrations |
| **Validation** | class-validator + class-transformer | DTO validation with decorators |
| **Auth** | @nestjs/passport + @nestjs/jwt | JWT strategy, Firebase Admin SDK |
| **Queue** | BullMQ + @nestjs/bullmq | Background jobs (notifications, payouts, AI) |
| **Cache** | @nestjs/cache-manager + Redis | API response caching, rate limiting |
| **Rate Limiting** | @nestjs/throttler | IP-based (1000/min) + user-based (100/min) |
| **File Upload** | @nestjs/platform-express + multer | Image/video uploads to Supabase Storage |
| **Swagger** | @nestjs/swagger | Auto-generated API documentation |
| **Testing** | Jest + Supertest | Unit + integration + E2E tests |
| **Logging** | @nestjs/common Logger | Structured logging |
| **Security** | helmet, cors, csrf protection | HTTP security headers |

### 3.4 Database & Storage

| Component | Technology | Details |
|-----------|-----------|---------|
| **Primary Database** | PostgreSQL via Supabase | Mumbai region, managed, free tier |
| **ORM** | Prisma | Schema-first, auto-generated types |
| **Real-time** | Supabase Realtime | Booking status updates, chat messages |
| **File Storage** | Supabase Storage | Profile photos, portfolios, KYC docs, service images |
| **Cache** | Upstash Redis (Serverless) | Mumbai region, free tier, OTP rate limits, sessions, catalog cache |
| **Search** | PostgreSQL full-text search (tsvector) | Service and provider search, upgradeable to Elasticsearch later |

### 3.5 External Services

| Service | Provider | Purpose |
|---------|----------|---------|
| **Auth/OTP** | Firebase Auth | Phone+OTP authentication, OTP delivery |
| **Payments** | Razorpay (Standard + Route) | UPI + Cards, marketplace commission splits |
| **Push Notifications** | Firebase Cloud Messaging | iOS (APNs) + Android push |
| **WhatsApp** | Twilio | Booking confirmations, reminders, status updates |
| **Maps** | Google Maps Platform | Places API (autocomplete), Geocoding, Distance Matrix |
| **KYC** | Setu | Aadhaar e-KYC, DigiLocker integration |
| **AI (Search)** | Grok API (xAI) — grok-4.1-fast | Natural language query parsing for service discovery |
| **AI (Disputes)** | Grok API (xAI) — grok-4.1-fast | Dispute evidence analysis and ruling generation |
| **Crash Reporting** | Firebase Crashlytics | Mobile crash reports |
| **Analytics** | Firebase Analytics | Screen views, user engagement |
| **Uptime** | UptimeRobot | Health check monitoring, alerts |

### 3.6 Infrastructure & DevOps

| Component | Technology | Details |
|-----------|-----------|---------|
| **Backend Hosting** | Render | Single instance, auto-restart, auto-deploy from Git, zero-downtime deploys |
| **Web Hosting** | Vercel | Auto-deploy Next.js, edge functions |
| **Mobile Builds** | EAS Build (Expo) | Cloud builds for iOS + Android |
| **CI/CD** | GitHub Actions | Backend: lint + test + deploy. Mobile: trigger EAS builds. |
| **Repository** | GitHub | Turborepo monorepo |
| **Environments** | Production only (MVP) | Razorpay test mode during development |
| **Monitoring** | UptimeRobot + Firebase Crashlytics | Health endpoint ping every 5 min + crash reporting |

---

## 4. MONOREPO STRUCTURE (Turborepo)

```
BharatClap/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml              # Lint + test + deploy to Render
│       ├── web-deploy.yml              # Auto via Vercel (no action needed)
│       └── mobile-build.yml            # Trigger EAS Build
├── turbo.json                          # Turborepo pipeline config
├── package.json                        # Root workspace config
├── .gitignore
├── .env.example                        # Root env template
│
├── apps/
│   ├── backend/                        # NestJS API server
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   ├── roles.decorator.ts
│   │   │   │   │   └── public.decorator.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── pipes/
│   │   │   │   │   └── validation.pipe.ts
│   │   │   │   └── dto/
│   │   │   │       └── pagination.dto.ts
│   │   │   ├── config/
│   │   │   │   └── configuration.ts
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── set-role.dto.ts
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── dto/update-user.dto.ts
│   │   │   ├── catalog/
│   │   │   │   ├── catalog.module.ts
│   │   │   │   ├── categories.controller.ts
│   │   │   │   ├── services.controller.ts
│   │   │   │   ├── catalog.service.ts
│   │   │   │   └── dto/service-query.dto.ts
│   │   │   ├── bookings/
│   │   │   │   ├── bookings.module.ts
│   │   │   │   ├── bookings.controller.ts
│   │   │   │   ├── bookings.service.ts      # CORE: booking state machine
│   │   │   │   └── dto/
│   │   │   │       ├── create-booking.dto.ts
│   │   │   │       └── update-status.dto.ts
│   │   │   ├── providers/
│   │   │   │   ├── providers.module.ts
│   │   │   │   ├── providers.controller.ts
│   │   │   │   ├── providers.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── update-provider.dto.ts
│   │   │   │       ├── provider-service.dto.ts
│   │   │   │       └── availability.dto.ts
│   │   │   ├── payments/
│   │   │   │   ├── payments.module.ts
│   │   │   │   ├── payments.controller.ts
│   │   │   │   ├── payments.service.ts
│   │   │   │   ├── razorpay.service.ts       # CORE: order creation, webhooks, refunds
│   │   │   │   └── webhooks.controller.ts
│   │   │   ├── reviews/
│   │   │   │   ├── reviews.module.ts
│   │   │   │   ├── reviews.controller.ts
│   │   │   │   ├── reviews.service.ts
│   │   │   │   └── dto/create-review.dto.ts
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.module.ts
│   │   │   │   ├── notifications.controller.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── firebase.service.ts       # FCM push
│   │   │   │   └── twilio.service.ts         # WhatsApp via Twilio
│   │   │   ├── search/
│   │   │   │   ├── search.module.ts
│   │   │   │   ├── search.controller.ts
│   │   │   │   ├── search.service.ts         # Postgres FTS + Grok NL parsing
│   │   │   │   └── grok.service.ts          # Grok API (xAI) integration
│   │   │   ├── disputes/
│   │   │   │   ├── disputes.module.ts
│   │   │   │   ├── disputes.controller.ts
│   │   │   │   └── disputes.service.ts       # AI-mediated dispute resolution
│   │   │   ├── recurring/
│   │   │   │   ├── recurring.module.ts
│   │   │   │   └── recurring.service.ts      # Auto-create + confirm recurring bookings
│   │   │   └── admin/
│   │   │       ├── admin.module.ts
│   │   │       ├── admin.controller.ts
│   │   │       └── admin.service.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma                 # SOURCE OF TRUTH
│   │   │   ├── migrations/
│   │   │   └── seed.ts                       # 8 categories, 50+ services, 20-30 demo providers
│   │   ├── test/
│   │   │   ├── auth.e2e-spec.ts
│   │   │   ├── bookings.e2e-spec.ts
│   │   │   └── payments.e2e-spec.ts
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── mobile/                             # React Native (Expo) — ONE app, role-based
│   │   ├── app/
│   │   │   ├── _layout.tsx                 # Root: auth provider, fonts, React Query, theme
│   │   │   ├── index.tsx                   # Entry: check auth → redirect
│   │   │   ├── (auth)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── welcome.tsx             # 3-screen walkthrough (first launch only)
│   │   │   │   ├── login.tsx               # Phone number input
│   │   │   │   ├── otp.tsx                 # OTP verification
│   │   │   │   ├── role-select.tsx         # Choose customer/provider
│   │   │   │   └── location.tsx            # Location permission + city detection
│   │   │   ├── (customer)/
│   │   │   │   ├── _layout.tsx             # Customer tab bar
│   │   │   │   ├── (tabs)/
│   │   │   │   │   ├── _layout.tsx         # Tab navigator (Home, Bookings, Profile)
│   │   │   │   │   ├── index.tsx           # Home: categories grid, search bar, featured
│   │   │   │   │   ├── bookings.tsx        # My bookings list (upcoming + past)
│   │   │   │   │   └── profile.tsx         # Profile, addresses, favorites, settings
│   │   │   │   ├── search.tsx              # AI-powered search (natural language)
│   │   │   │   ├── category/[slug].tsx     # Services in category
│   │   │   │   ├── service/[slug].tsx      # Service detail (photos, reviews, providers)
│   │   │   │   ├── provider/[id].tsx       # Provider profile (portfolio, certs, reviews)
│   │   │   │   ├── booking/
│   │   │   │   │   ├── select-provider.tsx # Browse & choose provider
│   │   │   │   │   ├── schedule.tsx        # Date + hourly time slot picker
│   │   │   │   │   ├── address.tsx         # Select/add address (Google Places)
│   │   │   │   │   ├── summary.tsx         # Summary + Razorpay pay
│   │   │   │   │   └── confirmation.tsx    # Booking confirmed
│   │   │   │   ├── booking/[id].tsx        # Booking detail + status + OTP + share
│   │   │   │   ├── review/[bookingId].tsx  # Multi-dimensional rating + photos
│   │   │   │   ├── favorites.tsx           # Saved providers
│   │   │   │   ├── help.tsx               # FAQ + support tickets
│   │   │   │   └── notifications.tsx       # Notification list
│   │   │   ├── (provider)/
│   │   │   │   ├── _layout.tsx             # Provider tab bar
│   │   │   │   ├── (tabs)/
│   │   │   │   │   ├── _layout.tsx         # Tab navigator (Dashboard, Bookings, Profile)
│   │   │   │   │   ├── dashboard.tsx       # Incoming bookings, today's calendar, earnings stats
│   │   │   │   │   ├── bookings.tsx        # All bookings history
│   │   │   │   │   └── profile.tsx         # Provider profile, KYC, earnings, portfolio
│   │   │   │   ├── booking/[id].tsx        # Booking detail (accept/reject/OTP/complete)
│   │   │   │   ├── onboarding/
│   │   │   │   │   ├── services.tsx        # Select services + set custom prices
│   │   │   │   │   ├── availability.tsx    # Set working days/hours per day
│   │   │   │   │   ├── portfolio.tsx       # Upload work photos + videos
│   │   │   │   │   └── bank.tsx            # Bank account / UPI for payouts
│   │   │   │   ├── earnings.tsx            # Earnings breakdown, payout history, withdrawal
│   │   │   │   ├── kyc.tsx                 # Aadhaar e-KYC via Setu
│   │   │   │   └── notifications.tsx
│   │   │   └── (common)/
│   │   │       ├── edit-profile.tsx
│   │   │       ├── city-select.tsx         # Manual city override
│   │   │       ├── dispute/[bookingId].tsx # Dispute upload (images + text)
│   │   │       └── settings.tsx            # Language, notifications, delete account
│   │   ├── components/
│   │   │   ├── ui/                         # NativeWind + RN Reusables design system
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── BottomSheet.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── StarRating.tsx
│   │   │   │   └── OtpInput.tsx
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── BookingCard.tsx
│   │   │   ├── ProviderCard.tsx
│   │   │   ├── AddressCard.tsx
│   │   │   ├── TimeSlotPicker.tsx          # Hourly slot grid
│   │   │   ├── VerificationBadge.tsx       # "Aadhaar Verified" badge
│   │   │   ├── ReviewCard.tsx              # Multi-dimensional review display
│   │   │   └── PortfolioGallery.tsx        # Photo/video grid for provider portfolio
│   │   ├── services/
│   │   │   ├── api.ts                      # Axios instance, JWT interceptor, refresh logic
│   │   │   ├── auth.ts
│   │   │   ├── catalog.ts
│   │   │   ├── bookings.ts
│   │   │   ├── providers.ts
│   │   │   ├── payments.ts
│   │   │   ├── reviews.ts
│   │   │   ├── search.ts
│   │   │   ├── notifications.ts
│   │   │   └── disputes.ts
│   │   ├── store/
│   │   │   ├── authStore.ts                # User, tokens, role, city
│   │   │   └── bookingStore.ts             # In-progress booking wizard state
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useLocation.ts
│   │   │   ├── useNotifications.ts
│   │   │   └── useRealtime.ts              # Supabase Realtime subscription
│   │   ├── constants/
│   │   │   ├── theme.ts                    # Orange primary: #FF6B00, white bg, dark text
│   │   │   ├── config.ts                   # API URL, keys
│   │   │   └── timeSlots.ts                # Hourly slots: 8am, 9am, ... 9pm
│   │   ├── utils/
│   │   │   ├── format.ts                   # Currency (₹), date, time formatting
│   │   │   └── validation.ts               # Phone number (10-digit Indian), OTP
│   │   ├── i18n/
│   │   │   ├── en.json                     # English strings
│   │   │   ├── hi.json                     # Hindi strings
│   │   │   ├── mr.json                     # Marathi strings (Mumbai)
│   │   │   └── kn.json                     # Kannada strings (Bangalore)
│   │   ├── app.json
│   │   ├── eas.json
│   │   ├── babel.config.js
│   │   ├── tailwind.config.js
│   │   ├── metro.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                                # Next.js (admin + marketing + customer web)
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx              # Root layout
│       │   │   ├── page.tsx                # Marketing landing page
│       │   │   ├── (marketing)/
│       │   │   │   ├── about/page.tsx
│       │   │   │   ├── privacy/page.tsx    # Privacy policy (DPDP compliance)
│       │   │   │   └── terms/page.tsx      # Terms of service
│       │   │   ├── (customer)/
│       │   │   │   ├── services/page.tsx   # Browse services (web)
│       │   │   │   └── booking/page.tsx    # Web booking flow
│       │   │   └── admin/
│       │   │       ├── layout.tsx          # Admin sidebar layout
│       │   │       ├── page.tsx            # Dashboard: bookings, revenue, providers, customers
│       │   │       ├── bookings/page.tsx   # All bookings table with filters
│       │   │       ├── providers/page.tsx  # Providers list (KYC status, approve/suspend)
│       │   │       ├── providers/[id]/page.tsx
│       │   │       ├── payments/page.tsx   # Payment overview, pending payouts
│       │   │       ├── disputes/page.tsx   # Active disputes, AI rulings
│       │   │       └── settings/page.tsx   # Platform settings
│       │   ├── components/ui/              # shadcn/ui components
│       │   └── lib/
│       │       ├── api.ts
│       │       └── utils.ts
│       ├── tailwind.config.ts
│       ├── next.config.js
│       ├── package.json
│       └── tsconfig.json
│
└── packages/
    └── shared-types/                       # Shared TypeScript types
        ├── src/
        │   ├── booking.ts                  # BookingStatus, CreateBookingDTO, etc.
        │   ├── user.ts                     # UserRole, UserProfile, etc.
        │   ├── service.ts                  # Service, Category, etc.
        │   ├── payment.ts                  # PaymentStatus, PayoutStatus, etc.
        │   └── review.ts                   # ReviewDimension, CreateReviewDTO
        ├── package.json
        └── tsconfig.json
```

---

## 5. DATABASE SCHEMA (Complete Prisma)

### 5.1 Enums

```
UserRole:        CUSTOMER | PROVIDER | ADMIN
BookingStatus:   PENDING_PAYMENT | CONFIRMED | PROVIDER_ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED | REFUNDED
PaymentStatus:   PENDING | CAPTURED | FAILED | REFUNDED
PayoutStatus:    PENDING | PROCESSING | COMPLETED | FAILED
KycStatus:       NOT_STARTED | PENDING | VERIFIED | REJECTED
DisputeStatus:   OPEN | AI_RULED | ADMIN_OVERRIDDEN | RESOLVED
RecurringFreq:   WEEKLY | BIWEEKLY | MONTHLY
```

### 5.2 Models

**users**
- id (uuid PK), phone (unique), name, email, role (UserRole), avatar_url, firebase_uid (unique), preferred_language (default 'en'), city, is_active, created_at, updated_at
- Relations: provider_profile (1:1), addresses (1:N), bookings_as_customer, bookings_as_provider, reviews_given, reviews_received, notifications, favorite_providers, disputes

**provider_profiles**
- id (uuid PK), user_id (FK unique), bio, kyc_status (KycStatus), aadhaar_verified (bool), aadhaar_last4 (string, 4 chars), base_latitude, base_longitude, service_radius_km (default 10), avg_rating (float), avg_punctuality (float), avg_quality (float), avg_behavior (float), avg_value (float), total_jobs (int), total_earnings (int, paise), wallet_balance (int, paise for pending payouts), bank_account_no, bank_ifsc, upi_id, is_available (bool), years_experience (int), certifications (string[]), languages_spoken (string[]), video_intro_url, created_at
- Relations: user, provider_services (1:N), availability (1:N), portfolio_items (1:N)

**provider_portfolio**
- id, provider_id (FK), media_url, media_type ('image' | 'video'), caption, sort_order, created_at

**categories**
- id (uuid PK), name, name_hi (Hindi), name_mr (Marathi), name_kn (Kannada), slug (unique), icon_url, image_url, parent_id (self-ref FK), sort_order, is_active

**services**
- id (uuid PK), category_id (FK), name, name_hi, name_mr, name_kn, slug (unique), description, base_price (int, paise — used as reference/minimum), duration_min, image_url, inclusions (string[]), exclusions (string[]), is_active, sort_order, search_vector (tsvector — for full-text search), created_at

**provider_services**
- id (uuid PK), provider_id (FK), service_id (FK), custom_price (int, paise — provider's price), is_active
- Unique constraint: (provider_id, service_id)

**addresses**
- id, user_id (FK), label ('Home'|'Office'|'Other'), address_line, landmark, city, pincode, latitude, longitude, is_default

**bookings**
- id (uuid PK), customer_id (FK), provider_id (FK, nullable until assigned), service_id (FK), address_id (FK), status (BookingStatus), scheduled_date (date), scheduled_hour (int, 0-23 — e.g., 14 = 2:00 PM), amount (int, paise — provider's custom price), otp_code (string, 4-digit, generated on PROVIDER_ASSIGNED), customer_notes, cancel_reason, completed_at, emergency_contact_phone, emergency_contact_name, recurring_booking_id (FK nullable), created_at, updated_at
- Indexes: (customer_id, status), (provider_id, status), (scheduled_date), (status)

**booking_status_log**
- id, booking_id (FK), status (BookingStatus), changed_by (FK to user), notes, created_at

**payments**
- id (uuid PK), booking_id (FK unique), razorpay_order_id (unique), razorpay_payment_id, amount (paise), currency ('INR'), status (PaymentStatus), commission (paise — 20% of amount), provider_payout (paise — 80% of amount), payout_status (PayoutStatus), razorpay_transfer_id, refund_id, refund_amount, created_at, updated_at

**reviews**
- id (uuid PK), booking_id (FK unique), customer_id (FK), provider_id (FK), rating_overall (int, 1-5, computed average), rating_punctuality (int, 1-5), rating_quality (int, 1-5), rating_behavior (int, 1-5), rating_value (int, 1-5), comment (text), photos (string[] — URLs), created_at

**notifications**
- id, user_id (FK), title, body, data (json), channel ('push'|'whatsapp'|'both'), is_read, created_at
- Index: (user_id, is_read)

**provider_availability**
- id, provider_id (FK), day_of_week (0-6, 0=Sunday), start_hour (int, 0-23), end_hour (int, 0-23), is_active
- Unique: (provider_id, day_of_week)

**favorite_providers**
- id, customer_id (FK), provider_id (FK), created_at
- Unique: (customer_id, provider_id)

**recurring_bookings**
- id (uuid PK), customer_id (FK), provider_id (FK), service_id (FK), address_id (FK), frequency (RecurringFreq), day_of_week (int), preferred_hour (int), is_active, next_booking_date, created_at
- Note: System auto-creates next booking and sends confirmation notification 24h before. Customer can cancel/modify.

**disputes**
- id (uuid PK), booking_id (FK unique), customer_id (FK), provider_id (FK), status (DisputeStatus), customer_evidence_text, customer_evidence_photos (string[]), provider_evidence_text, provider_evidence_photos (string[]), ai_ruling (text — Grok's analysis), ai_ruling_in_favor ('customer'|'provider'), admin_override_ruling (text, nullable), admin_override_in_favor ('customer'|'provider', nullable), refund_amount (int, paise, nullable), created_at, resolved_at

**support_tickets**
- id, user_id (FK), booking_id (FK nullable), subject, description, status ('open'|'in_progress'|'resolved'), created_at, updated_at

**chat_messages** (for per-booking chat via Supabase Realtime)
- id, booking_id (FK), sender_id (FK), message (text), media_url (nullable), is_read, created_at
- Index: (booking_id, created_at)

---

## 6. COMPLETE API DESIGN

### 6.1 Auth

```
POST   /api/v1/auth/login              # Exchange Firebase ID token for app JWT
POST   /api/v1/auth/refresh             # Refresh access token
POST   /api/v1/auth/logout              # Invalidate refresh token
POST   /api/v1/auth/set-role            # Set role after first login {role: 'customer'|'provider'}
```

### 6.2 Users

```
GET    /api/v1/users/me                 # Current user profile
PATCH  /api/v1/users/me                 # Update name, email, avatar, preferred_language, city
DELETE /api/v1/users/me                 # Delete account + PII (DPDP compliance)
GET    /api/v1/users/me/data-export     # Export all personal data as JSON (DPDP)
```

### 6.3 Addresses

```
GET    /api/v1/addresses                # List saved addresses
POST   /api/v1/addresses               # Add new address {label, address_line, landmark, city, pincode, lat, lng}
PATCH  /api/v1/addresses/:id           # Update address
DELETE /api/v1/addresses/:id           # Delete address
```

### 6.4 Catalog (Public)

```
GET    /api/v1/categories               # All categories (tree with children)
GET    /api/v1/categories/:slug         # Category detail + services
GET    /api/v1/services                 # Services (filterable: ?category=&city=&sort=price)
GET    /api/v1/services/:slug           # Service detail (inclusions, exclusions, photos, reviews)
```

### 6.5 Search

```
POST   /api/v1/search                   # AI-powered search {query: "fix my leaking tap tomorrow 3pm"}
                                        # Grok parses → returns matched services + extracted intent
GET    /api/v1/search/text?q=           # Simple text search (Postgres FTS fallback)
```

### 6.6 Providers (Customer-facing)

```
GET    /api/v1/providers                # List providers for a service (?service_id=&lat=&lng=&sort=rating|distance|price)
GET    /api/v1/providers/:id            # Provider public profile (bio, portfolio, certs, reviews, services+prices)
POST   /api/v1/providers/:id/favorite   # Add to favorites
DELETE /api/v1/providers/:id/favorite   # Remove from favorites
GET    /api/v1/favorites                # List favorite providers
```

### 6.7 Provider Self-Management

```
GET    /api/v1/provider/profile         # Own provider profile
PATCH  /api/v1/provider/profile         # Update bio, base location, radius, languages, experience
POST   /api/v1/provider/services        # Add service to profile {service_id, custom_price}
PATCH  /api/v1/provider/services/:id    # Update custom price
DELETE /api/v1/provider/services/:id    # Remove service
GET    /api/v1/provider/availability    # Get weekly availability
PUT    /api/v1/provider/availability    # Set full weekly availability [{day, start_hour, end_hour}]
POST   /api/v1/provider/portfolio       # Upload portfolio item (photo/video)
DELETE /api/v1/provider/portfolio/:id   # Remove portfolio item
POST   /api/v1/provider/kyc/initiate    # Start Aadhaar e-KYC via Setu
GET    /api/v1/provider/kyc/status      # Check KYC status
PATCH  /api/v1/provider/bank            # Update bank/UPI details
GET    /api/v1/provider/earnings        # Earnings summary (total, pending, by period)
GET    /api/v1/provider/payouts         # Payout history
POST   /api/v1/provider/withdraw        # Request instant withdrawal
```

### 6.8 Bookings

```
POST   /api/v1/bookings                 # Create booking {service_id, provider_id, address_id, date, hour, notes, emergency_contact}
GET    /api/v1/bookings                 # List my bookings (?status=&page=&limit=)
GET    /api/v1/bookings/:id             # Booking detail (full info + payment + review + status log)
PATCH  /api/v1/bookings/:id/accept      # Provider accepts
PATCH  /api/v1/bookings/:id/reject      # Provider rejects {reason}
POST   /api/v1/bookings/:id/verify-otp  # Provider enters OTP to start service
PATCH  /api/v1/bookings/:id/complete    # Provider marks complete
POST   /api/v1/bookings/:id/cancel      # Cancel booking {reason} — refund per policy
POST   /api/v1/bookings/:id/rebook      # Re-book same service+provider (pre-fill)
```

### 6.9 Recurring Bookings

```
POST   /api/v1/recurring                # Create recurring {service_id, provider_id, address_id, frequency, day_of_week, hour}
GET    /api/v1/recurring                # List my recurring bookings
PATCH  /api/v1/recurring/:id            # Modify recurring (frequency, day, hour)
DELETE /api/v1/recurring/:id            # Cancel recurring
POST   /api/v1/recurring/:id/confirm    # Confirm next occurrence (triggered by 24h reminder)
POST   /api/v1/recurring/:id/skip       # Skip next occurrence
```

### 6.10 Payments

```
GET    /api/v1/payments/:bookingId      # Payment details for a booking
POST   /api/v1/webhooks/razorpay        # Razorpay webhook (signature verified, IP whitelisted)
```

### 6.11 Reviews

```
POST   /api/v1/bookings/:id/review      # Submit review {punctuality, quality, behavior, value, comment, photos}
GET    /api/v1/reviews/provider/:id     # Provider's reviews (paginated)
```

### 6.12 Disputes

```
POST   /api/v1/bookings/:id/dispute     # Open dispute {evidence_text, evidence_photos}
GET    /api/v1/disputes/:id             # Dispute detail (both sides + AI ruling)
POST   /api/v1/disputes/:id/respond     # Provider responds {evidence_text, evidence_photos}
```

### 6.13 Notifications

```
GET    /api/v1/notifications            # List (paginated, unread first)
PATCH  /api/v1/notifications/:id/read   # Mark as read
POST   /api/v1/notifications/device     # Register FCM device token
```

### 6.14 Support

```
POST   /api/v1/support/tickets          # Create support ticket {subject, description, booking_id?}
GET    /api/v1/support/tickets          # My tickets
GET    /api/v1/support/faq              # FAQ list
```

### 6.15 Admin

```
GET    /api/v1/admin/dashboard          # Key metrics (total bookings, revenue, active providers, pending KYC)
GET    /api/v1/admin/bookings           # All bookings (filterable by status, city, date range)
GET    /api/v1/admin/providers          # All providers (filterable by KYC, city, rating)
PATCH  /api/v1/admin/providers/:id/approve
PATCH  /api/v1/admin/providers/:id/suspend
GET    /api/v1/admin/payments           # Payment/payout overview
POST   /api/v1/admin/payouts/batch      # Trigger batch payout for all pending
GET    /api/v1/admin/disputes           # All disputes
PATCH  /api/v1/admin/disputes/:id/override  # Admin overrides AI ruling {ruling, in_favor, refund_amount}
```

---

## 7. BUSINESS RULES & SPECIFICATIONS

### 7.1 Booking Rules

- **Hourly time slots**: 8am, 9am, 10am, ... 9pm (customer picks exact hour)
- **Advance booking**: Minimum 2 hours ahead, maximum 30 days ahead
- **Booking confirmation**: Booking enters `PENDING_PAYMENT` → payment succeeds → `CONFIRMED`
- **Provider response timeout**: If provider doesn't respond in 2 hours, send 2 reminder pushes (at 30min and 90min). Auto-cancel + refund after 2 hours. Customer is notified to rebook.
- **Service-start OTP**: 4-digit OTP generated when booking reaches `PROVIDER_ASSIGNED`. Customer sees OTP in app. Provider enters OTP to start service (proves both present).
- **Auto-complete**: If provider doesn't mark complete, auto-complete 4 hours after scheduled time.

### 7.2 Cancellation Policy

| Timing | Customer Refund | Provider Penalty |
|--------|----------------|-----------------|
| 4+ hours before scheduled time | 100% refund | None |
| 1-4 hours before | 50% refund | None |
| Less than 1 hour / after provider dispatched | No refund | None |
| Provider cancels anytime | 100% refund to customer | Warning, affects quality score |
| Provider no-show | 100% refund + ₹100 credit | Suspension warning |

### 7.3 Pricing

- **Provider-set prices**: Each provider sets their own price per service. Base price is reference only.
- **Customer sees**: Provider's custom price on their profile card when browsing providers for a service
- **Commission**: 20% of booking amount to platform. 80% to provider.
- **Soft radius warning**: If customer's address is outside provider's radius, show: "This provider is outside their usual area. They may charge extra travel fee or decline."
- **GST**: 18% on platform commission (₹X.XX included in commission, not extra to customer)

### 7.4 Provider Payouts

- **Auto payout**: Weekly batch payouts every Monday for completed bookings from the previous week
- **Instant withdrawal**: Provider can request instant withdrawal of wallet balance anytime. Small fee (₹10 or 2%, whichever is higher) for instant. Processed within 24 hours.
- **Earnings display**: Provider sees: total earned, pending balance, last payout, next scheduled payout, earnings chart over time

### 7.5 Multi-dimensional Reviews

After booking completion, customer rates on 4 dimensions:
1. **Punctuality** (1-5 stars): Was the provider on time?
2. **Quality** (1-5 stars): Was the work quality good?
3. **Behavior** (1-5 stars): Was the provider professional and polite?
4. **Value** (1-5 stars): Was it worth the price?

Plus: optional text comment + up to 5 photos (before/after) + optional 30s video.
Overall rating = average of 4 dimensions (rounded to 1 decimal).
Provider's aggregate ratings update in real-time.

### 7.6 AI-Powered Search

User types: "I need someone to fix my leaking tap tomorrow morning"
Grok API extracts:
```json
{
  "service_category": "plumber",
  "service_type": "tap repair",
  "date_preference": "tomorrow",
  "time_preference": "morning (8am-12pm)",
  "urgency": "normal"
}
```
Backend maps to: service slug "tap-repair", category "plumber", filters by date availability.
Returns: matched services + available providers, sorted by rating and distance.

### 7.7 AI Dispute Resolution

1. Customer opens dispute → uploads text description + photos
2. Provider gets notified → uploads their evidence (text + photos)
3. After both sides submit (or 48h timeout), Grok API analyzes:
   - Customer's claim + photos
   - Provider's defense + photos
   - Booking details (service type, amount, time)
   - Review if exists
4. Grok generates ruling: who's at fault, recommended resolution, refund amount
5. Both parties see AI ruling. Either can appeal to human admin.
6. Admin can override AI ruling from admin dashboard.

### 7.8 Recurring Bookings

1. Customer sets up: "Weekly cleaning, every Saturday at 10am, with provider Sunita"
2. System auto-creates next booking 48 hours before scheduled time
3. 24 hours before: customer gets confirmation notification "Your weekly cleaning with Sunita is tomorrow at 10am. Confirm or skip?"
4. Customer confirms → payment charged → normal booking flow
5. Customer skips → no charge, next occurrence auto-scheduled
6. If customer doesn't respond → auto-cancel that occurrence, schedule next

### 7.9 Safety Features

- **Service-start OTP**: 4-digit code prevents fake completions
- **Emergency contact sharing**: Customer optionally enters emergency contact name + phone. When booking starts, contact receives WhatsApp message: "Priya has a home service booking at [address] with provider [name] (Aadhaar verified). Service: AC Repair. Scheduled: 2pm-3pm."
- **Provider phone revealed**: Only after provider accepts the booking

### 7.10 Rate Limiting

| Endpoint Type | IP Limit | User Limit |
|---------------|---------|------------|
| Read APIs (catalog, listings) | 1000/min | 200/min |
| Write APIs (bookings, reviews) | 500/min | 50/min |
| Auth/OTP | 100/min | 5 OTP requests/phone/hour |
| Search (AI) | 200/min | 30/min |
| Webhooks (Razorpay) | Unlimited (IP whitelist) | N/A |
| File uploads | 100/min | 20/min |

---

## 8. NOTIFICATION SPECIFICATIONS

### 8.1 Notification Events

| Event | Customer Channel | Provider Channel | Message Template |
|-------|-----------------|-----------------|-----------------|
| Booking created | Push + WhatsApp | — | "Your booking for {service} on {date} at {time} is confirmed!" |
| Provider assigned | Push + WhatsApp | Push | C: "{provider} will serve you on {date}." P: "New booking: {service} at {address} on {date}" |
| Booking reminder (1h before) | Push | Push | "Reminder: {provider} arrives in 1 hour for {service}" |
| Provider en route | Push | — | "{provider} is on the way to your location" |
| Service started (OTP verified) | Push | — | "Service has started. OTP verified." |
| Service completed | Push + WhatsApp | Push | C: "Service complete! Rate your experience." P: "Job complete! ₹{payout} earned." |
| Payment received | Push + WhatsApp | — | "Payment of ₹{amount} received for {service}" |
| Provider payout | — | Push + WhatsApp | "₹{amount} transferred to your bank account" |
| Booking cancelled | Push + WhatsApp | Push | "Booking cancelled. Refund of ₹{amount} initiated." |
| Provider no-response (30min) | — | Push | "You have a pending booking! Accept before it expires." |
| Provider no-response (90min) | — | Push | "Last chance! Booking will be cancelled in 30 minutes." |
| Recurring confirmation (24h) | Push + WhatsApp | Push | "Your weekly {service} is tomorrow at {time}. Confirm or skip?" |
| Dispute opened | Push | Push | "A dispute has been filed for booking #{id}" |
| Dispute ruled | Push + WhatsApp | Push + WhatsApp | "Dispute resolved: {ruling_summary}" |
| Review received | — | Push | "You received a {rating}-star review from {customer}" |
| KYC approved | — | Push + WhatsApp | "Your Aadhaar verification is complete! You now have a verified badge." |

### 8.2 WhatsApp Templates (Twilio)

Pre-approved template messages (required by WhatsApp Business API):
- `booking_confirmation`: "Hi {{1}}! Your {{2}} booking is confirmed for {{3}} at {{4}}. Provider: {{5}}. Booking ID: {{6}}"
- `payment_receipt`: "Payment of ₹{{1}} received for {{2}}. Transaction ID: {{3}}"
- `booking_reminder`: "Reminder: Your {{1}} is in 1 hour. Provider {{2}} will arrive at {{3}}."
- `provider_payout`: "Hi {{1}}! ₹{{2}} has been transferred to your account for completed services."
- `recurring_confirm`: "Your weekly {{1}} with {{2}} is scheduled for tomorrow at {{3}}. Reply CONFIRM or SKIP."

---

## 9. USER FLOWS (Detailed)

### 9.1 First-Time Customer Onboarding

```
[App Launch — first time]
    ↓
[Welcome Walkthrough — 3 screens]
    Screen 1: "Browse 100+ services" (categories illustration)
    Screen 2: "Book with confidence" (Aadhaar verified badge illustration)
    Screen 3: "Pay securely" (UPI/card illustration)
    [Get Started button]
    ↓
[Login — Phone Number]
    Enter 10-digit Indian phone number
    [Send OTP]
    ↓
[OTP Verification]
    Enter 6-digit OTP (Firebase Auth)
    Auto-read OTP on Android
    ↓
[Role Selection]
    "I need services" → CUSTOMER
    "I provide services" → PROVIDER
    ↓
[Location Permission]
    "Allow BharatClap to access your location?"
    If granted: auto-detect city
    If denied: manual city selection (Delhi NCR, Mumbai, Bangalore)
    ↓
[Customer Home Screen]
    City selector (top), Search bar, Categories grid, Featured services
```

### 9.2 Customer Booking Flow

```
[Home → Tap "AC & Appliance" category]
    ↓
[Category Page — list of services]
    AC Service (Split) — from ₹499
    AC Service (Window) — from ₹399
    AC Gas Refill — from ₹1999
    ...
    [Tap "AC Service (Split)"]
    ↓
[Service Detail Page]
    Hero image, description, duration (60 min)
    What's included: Gas check, filter clean, jet spray
    What's not included: Spare parts, gas refill
    Customer reviews for this service (with photos)
    [View Available Providers] button
    ↓
[Provider Selection Page]
    List of providers offering "AC Service (Split)" in customer's area
    Each card shows: photo, name, ✓ Aadhaar Verified badge, rating (4.8 ★),
                     total jobs (234), price (₹599), distance (2.3 km)
    Sorted by: Rating (default) | Distance | Price
    Soft radius warning if applicable: "⚠ Outside provider's usual area"
    [Tap provider card to see full profile, or tap "Book" directly]
    ↓
[Schedule — Date + Time]
    Calendar: next 30 days, disabled past dates
    Time: hourly slots (8am, 9am, 10am, ... 9pm)
    Only shows hours where provider is available (per their availability settings)
    ↓
[Select Address]
    Saved addresses list (Home, Office)
    [+ Add New Address] → Google Places autocomplete + pin drop on map
    ↓
[Booking Summary]
    Service: AC Service (Split)
    Provider: Raju (4.8 ★, Aadhaar Verified)
    Date: Feb 20, 2026 | Time: 2:00 PM
    Address: 123 MG Road, Bangalore
    Amount: ₹599
    Optional: Add customer notes
    Optional: Add emergency contact (name + phone)
    [Pay ₹599] button
    ↓
[Razorpay Checkout]
    UPI (default, expanded) | Cards | Netbanking
    ↓
[Payment Success → Booking Confirmation]
    ✓ Booking Confirmed!
    Booking ID: BC-2026-XXXXX
    Provider: Raju | Date: Feb 20 | Time: 2:00 PM
    "Raju will confirm shortly."
    [WhatsApp confirmation sent]
    [Push notification sent]
```

### 9.3 Provider Onboarding Flow

```
[Role Selection → "I provide services"]
    ↓
[Provider Profile Setup]
    Name (pre-filled from auth)
    Profile photo (camera + gallery)
    Short bio (max 300 chars)
    City
    Years of experience
    Languages spoken (multi-select: English, Hindi, Marathi, Kannada)
    ↓
[Select Services]
    Browse categories → select services you offer
    For each service: set your custom price (minimum = base price)
    Example: AC Service (Split) — Base: ₹499, Your price: [₹599]
    ↓
[Upload Portfolio]
    Add photos of past work (up to 20 photos)
    Optional: upload 30-second video introduction
    ↓
[Set Availability]
    For each day of week:
      Toggle ON/OFF
      If ON: set start hour + end hour
    Example: Mon-Sat: 8am - 7pm, Sunday: OFF
    ↓
[Set Service Area]
    Pin your base location on map
    Set radius: 5km / 10km / 15km / 20km slider
    ↓
[Bank/UPI Details]
    Option A: Bank account (number + IFSC)
    Option B: UPI ID
    ↓
[KYC — Aadhaar Verification]
    "Verify your identity with Aadhaar"
    Redirects to Setu → DigiLocker flow
    OTP sent to Aadhaar-linked phone
    On success: ✓ Aadhaar Verified badge
    On skip: "You can verify later from your profile"
    ↓
[Provider Dashboard — Ready to receive bookings]
```

---

## 10. SEED DATA SPECIFICATION

### 10.1 Categories (8)

| # | Name | Slug | Hindi Name | Icon |
|---|------|------|------------|------|
| 1 | Salon for Women | salon-women | महिलाओं के लिए सैलून | 💇‍♀️ |
| 2 | Salon for Men | salon-men | पुरुषों के लिए सैलून | 💈 |
| 3 | AC & Appliance Repair | ac-appliance | AC और उपकरण मरम्मत | ❄️ |
| 4 | Home Cleaning | cleaning | घर की सफाई | 🧹 |
| 5 | Electrician | electrician | इलेक्ट्रीशियन | ⚡ |
| 6 | Plumber | plumber | प्लंबर | 🔧 |
| 7 | Painter | painter | पेंटर | 🎨 |
| 8 | Pest Control | pest-control | कीट नियंत्रण | 🐛 |

### 10.2 Services per Category (Example: Salon for Women)

| Service | Base Price (₹) | Duration | Inclusions |
|---------|----------------|----------|------------|
| Haircut & Styling | 499 | 45 min | Wash, cut, blow dry |
| Classic Facial | 699 | 60 min | Cleansing, scrub, massage, pack |
| Full Body Waxing | 1299 | 90 min | Arms, legs, underarms |
| Manicure & Pedicure | 899 | 75 min | Soak, scrub, shape, polish |
| Bridal Makeup | 4999 | 120 min | HD makeup, hairstyling, draping |
| Threading (Full Face) | 199 | 20 min | Eyebrows, upper lip, forehead |
| Hair Color | 1499 | 90 min | Global color, L'Oreal products |
| Head Massage | 349 | 30 min | Oil massage, relaxation |

### 10.3 Demo Providers (20-30)

Realistic Indian provider profiles with:
- Names, bios, cities (distributed across Delhi NCR, Mumbai, Bangalore)
- Multiple services with custom prices (varying from base)
- Ratings (3.5 - 4.9 range, with dimension breakdowns)
- Job counts (10 - 500 range)
- Availability (realistic working hours)
- Some marked as Aadhaar verified, others pending
- Portfolio images (placeholder URLs)

---

## 11. ENVIRONMENT VARIABLES

```env
# Backend (.env)
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

FIREBASE_PROJECT_ID=bharatclap
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@bharatclap.iam.gserviceaccount.com

JWT_SECRET=<random-256-bit-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

REDIS_URL=redis://default:xxx@xxx.upstash.io:6379

GOOGLE_MAPS_API_KEY=AIza...

SETU_CLIENT_ID=xxx
SETU_CLIENT_SECRET=xxx

XAI_API_KEY=xai-xxx            # Grok API (xAI) for search + disputes

TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:8081
```

```env
# Mobile (app.config.js / .env)
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bharatclap.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bharatclap
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 12. INDIA COMPLIANCE CHECKLIST

| # | Requirement | Implementation | Priority |
|---|-------------|----------------|----------|
| 1 | DPDP Act — Consent before data collection | Consent screen on first launch with granular toggles (location, contacts, notifications, Aadhaar). Separate Aadhaar consent. | P0 |
| 2 | DPDP Act — Right to erasure | `DELETE /users/me` purges all PII. Anonymize bookings/reviews for analytics. | P0 |
| 3 | DPDP Act — Right to data portability | `GET /users/me/data-export` returns JSON with all personal data | P1 |
| 4 | DPDP Act — Data minimization | Store only verification status + last 4 digits of Aadhaar. Delete KYC docs after verification. | P0 |
| 5 | DPDP Act — Breach notification | 72-hour notification to Data Protection Board. Incident response plan documented. | P1 |
| 6 | RBI Data Localization | Razorpay handles payment data (RBI compliant). We store only order IDs. Supabase Mumbai region for all data. | P0 |
| 7 | Aadhaar Compliance | Use Setu (licensed KYC aggregator). Never store raw Aadhaar number. | P0 |
| 8 | GST | 18% on platform commission. TCS 1% on net supplies. Auto-invoicing deferred post-launch. | P2 |
| 9 | Gig Worker Regulations | Transparent earnings breakdown in provider dashboard. Insurance planned post-launch. | P1 |
| 10 | Consumer Protection Rules | Display total price prominently. Clear cancellation policy. No dark patterns. | P0 |
| 11 | IT Act — Intermediary guidelines | Terms of service define prohibited services. Grievance officer appointment (email). | P1 |
| 12 | Privacy Policy | Detailed privacy policy page at bharatclap.com/privacy. Linked in app. | P0 |
| 13 | Terms of Service | Terms page at bharatclap.com/terms. Acceptance required at signup. | P0 |

---

## 13. TESTING STRATEGY

### 13.1 Backend Tests (Jest + Supertest)

| Test Type | Coverage | Priority |
|-----------|----------|----------|
| **Unit — Booking state machine** | All valid/invalid transitions, edge cases | P0 |
| **Unit — Payment service** | Commission calculation, refund logic | P0 |
| **Unit — Auth service** | Firebase token verification, JWT generation | P0 |
| **Unit — Search service** | Grok response parsing, FTS query building | P1 |
| **Integration — Auth endpoints** | Login flow, token refresh, role setting | P0 |
| **Integration — Booking endpoints** | Create, accept, reject, complete, cancel | P0 |
| **Integration — Payment webhook** | Valid signature, invalid signature, idempotency | P0 |
| **Integration — Provider endpoints** | Profile, services, availability, KYC | P1 |
| **E2E — Full booking flow** | Create booking → pay → accept → complete → review | P0 |

### 13.2 Mobile Tests

| Test Type | Coverage | Priority |
|-----------|----------|----------|
| **Component — OTP Input** | Digit entry, auto-advance, paste handling | P1 |
| **Component — TimeSlotPicker** | Slot selection, disabled slots, availability | P1 |
| **Component — StarRating** | Tap to rate, display mode, multi-dimension | P1 |
| **Component — BookingCard** | Status badge rendering, all statuses | P1 |

---

## 14. CRITICAL IMPLEMENTATION NOTES

1. **Use `expo-dev-client` from Day 1** — Razorpay RN SDK and react-native-maps require native modules. Do NOT use Expo Go. Set up development builds immediately: `npx expo install expo-dev-client` + `eas build --profile development`.

2. **Prisma schema is THE source of truth** — Define completely on Day 1. Every API endpoint, every screen, every type derives from this. The seed script is critical for making the app feel real during development.

3. **Booking state machine is the hardest part** — Every status transition must be validated and logged. Invalid transitions should throw 400 errors with clear messages. Test exhaustively.

4. **Trust Razorpay webhooks, not client callbacks** — Client redirect after payment is for UX only. Always confirm payment from webhook. Make webhook handler idempotent (check if already processed).

5. **Supabase Realtime for real-time** — Subscribe to booking status changes and chat messages. No additional WebSocket server needed. Free tier: 200 concurrent connections, enough for MVP.

6. **BullMQ for ALL background jobs** — Send push notifications, send WhatsApp messages, process AI search queries, generate AI dispute rulings, create recurring bookings. Never block the API response for side effects.

7. **One city, one locality first** — Seed for Delhi NCR initially. Manually onboard 20-30 real providers for soft launch. Perfect the loop before expanding.

8. **80/20 rule** — Ship functional over beautiful. AI agents handle UI via NativeWind + shadcn. Polish comes after user validation.

9. **Provider phone number after confirmation** — No in-app calling/masking for MVP. Reveal provider's phone number once they accept the booking. Direct coordination via phone/WhatsApp.

10. **Use Supabase Studio as admin panel Weeks 1-5** — Build real admin in Week 6. Supabase Studio lets you view/edit all data directly.

11. **Entity incorporation needed before Razorpay live mode** — Razorpay requires a registered business entity for live payments. Start Private Limited registration early. Use test mode during development.

12. **EAS Build credits** — Free tier: 30 builds/month. Be deliberate about triggering builds. Use OTA updates (EAS Update) for JS-only changes.
