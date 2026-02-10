# BharatClap Web App

This is the Next.js 15 web application for BharatClap, featuring both the marketing landing page and admin dashboard.

## Features

### Marketing Website
- Attractive landing page with service categories
- Privacy policy and terms of service pages (DPDP Act compliant)
- Responsive design with Tailwind CSS
- SEO-optimized metadata

### Admin Dashboard
- Dashboard with statistics and charts
- Bookings management with filtering and pagination
- Service providers management with KYC verification
- Payments overview with transaction tracking
- AI-powered disputes management with override capabilities

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, Tailwind CSS
- **Components**: shadcn/ui-inspired design system
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **TypeScript**: Full type safety

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/       # Marketing pages (privacy, terms)
│   ├── admin/             # Admin dashboard pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/
│   └── ui/                # Reusable UI components
├── lib/
│   ├── api.ts             # Axios instance with auth
│   └── utils.ts           # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Admin Dashboard

The admin dashboard includes:

1. **Dashboard** (`/admin`)
   - Key metrics (bookings, revenue, providers, KYC)
   - Charts (bookings over time, revenue over time)
   - Recent bookings table

2. **Bookings** (`/admin/bookings`)
   - Advanced filtering (status, date, city, search)
   - Pagination
   - Detailed booking information

3. **Providers** (`/admin/providers`)
   - KYC status management
   - Provider ratings and jobs
   - Approve/suspend actions

4. **Payments** (`/admin/payments`)
   - Revenue and commission tracking
   - Payment method breakdown
   - Batch payout functionality

5. **Disputes** (`/admin/disputes`)
   - AI-powered dispute analysis
   - Evidence review (photos, chat messages)
   - Override AI decisions

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: http://localhost:3000/api)

## Design System

The app uses a custom design system inspired by shadcn/ui with BharatClap branding:

- **Primary Color**: Orange (#FF6B00)
- **Components**: Button, Card, Badge, Input, Table
- **Utilities**: `cn()` for className merging
- **Formatting**: Currency (INR), Date/Time

## Notes

- The admin panel currently has a placeholder authentication check
- All data is mocked for demonstration purposes
- The app is designed to work with the BharatClap backend API
- Charts and tables are fully interactive with real-time updates

## License

Proprietary - BharatClap Private Limited
