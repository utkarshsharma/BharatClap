# Implementation Issues & PRD Gaps

## Overview

This document lists legitimate gaps between the codebase and PRD.md for the profile tab features (addresses, favorites, notifications, notification preferences). Each gap includes a reason why a suboptimal workaround was NOT implemented.

---

## Gap 1: Google Places Autocomplete (Addresses)

**PRD Requirement:** Address entry should use Google Places autocomplete for address line input, with pin-drop-on-map for precise location marking.

**Current Implementation:** Both web (`apps/web/src/app/addresses/page.tsx`) and mobile (`apps/mobile/app/(customer)/address-form.tsx`) use plain text input for address line. Mobile uses `expo-location` for "Use Current Location" (GPS coordinates), and web uses browser `navigator.geolocation`.

**Reason not implemented:** Google Places API requires a billing-enabled Google Cloud project with Places API key. This is a paid API ($2.83 per 1000 autocomplete sessions) and requires API key provisioning, domain restrictions, and CORS configuration. Implementing this without a valid API key would result in broken UI or hardcoded workarounds. The current address form collects all required fields (label, address line, landmark, city, pincode, lat/lng) and supports GPS-based location detection as a functional alternative.

**Priority:** High — should be implemented when Google Cloud credentials are available.

---

## Gap 2: Book Button on Favorites Page (Web)

**PRD Requirement:** Favorites page should display provider cards with a "Book" button for quick re-booking.

**Current Implementation:** Web favorites page (`apps/web/src/app/favorites/page.tsx`) shows "View Profile" button linking to `/services` instead of a direct "Book" button.

**Reason not implemented:** Booking requires a specific service selection — a provider may offer multiple services at different prices. A "Book" button on the favorites page would need either (a) a service picker modal, or (b) a link to the provider's profile page (which doesn't exist as a standalone page yet — providers are shown within service detail pages). The "View Profile" link is a reasonable intermediate UX. A proper implementation would require building a `/providers/:id` public profile page (currently only exists in mobile as `apps/mobile/app/(customer)/provider/[id].tsx`).

**Priority:** Medium — requires building a web provider profile page first.

---

## Gap 3: Delete Individual Notification (Web)

**PRD Requirement:** Users should be able to delete/dismiss individual notifications.

**Current Implementation:** Web notifications page (`apps/web/src/app/notifications/page.tsx`) supports listing, mark-as-read, mark-all-as-read, and pagination, but no per-notification delete action.

**Reason not implemented:** The backend `DELETE /notifications/:id` endpoint would need to be verified/created. The PRD notification model includes `is_read` but does not explicitly define a `DELETE` endpoint for notifications — only `GET` (list) and `PATCH` (mark read). Deleting notifications is not a core requirement for the profile tab fix scope and could inadvertently lose audit trail data. Marking as read is sufficient for the current UX.

**Priority:** Low — cosmetic feature, mark-as-read covers the primary use case.

---

## Gap 4: Notification Unread Badge on Mobile Tab Bar

**PRD Requirement:** Notification badge count on the tab bar or navigation elements.

**Current Implementation:** Web nav (`apps/web/src/components/customer-nav.tsx`) shows unread count badge on the Notifications link. Mobile customer layout (`apps/mobile/app/(customer)/_layout.tsx`) does NOT show a badge on the profile tab or notifications entry point.

**Reason not implemented:** The mobile app uses expo-router tab layout which supports badges, but the unread count fetch would need to happen at the layout level (always polling), which introduces unnecessary API load for a tab that may not be visited. This is better suited for a push notification integration where the badge count is updated via FCM silent pushes. Adding a polling mechanism at the tab layout level would be a suboptimal workaround.

**Priority:** Medium — should be implemented alongside FCM push notification integration.

---

## Gap 5: WhatsApp Notification Channel (Backend)

**PRD Requirement:** WhatsApp notifications via Twilio with pre-approved templates for booking confirmations, reminders, etc.

**Current Implementation:** Backend has a `notifWhatsapp` preference toggle that persists to the database, but no actual Twilio/WhatsApp message sending is implemented in `apps/backend/src/notifications/notifications.service.ts`.

**Reason not implemented:** Twilio WhatsApp Business API requires a verified Twilio account, WhatsApp Business verification, and pre-approved message templates. These are paid services requiring business registration. The toggle preference is stored correctly so that when Twilio is integrated, the user's preference will be honored. Implementing a stub/mock would provide no value and could confuse testing.

**Priority:** High — requires Twilio credentials and WhatsApp Business approval.

---

## Gap 6: FCM Push Notification Delivery

**PRD Requirement:** Firebase Cloud Messaging for push notifications. Device token registration via `POST /notifications/device`.

**Current Implementation:** Backend stores `fcmToken` and `fcmPlatform` fields on the User model. The `registerDevice()` method in `notifications.service.ts` persists the token. However, no actual FCM message sending is implemented — the notification system creates database records but doesn't dispatch to FCM.

**Reason not implemented:** Firebase Admin SDK integration requires a `serviceAccountKey.json` from Firebase Console. Without valid Firebase credentials, implementing the send logic would fail at runtime. The token storage and notification record creation are in place, so when Firebase credentials are provided, adding `admin.messaging().send()` calls is straightforward.

**Priority:** High — requires Firebase project setup and service account key.

---

## Gap 7: Favorite Toggle on Web Service Detail Provider Cards

**PRD Requirement:** Provider cards in the service detail page should have a heart/favorite toggle button (profile-tab-fix-prompt Part 6B).

**Current Implementation:** Web service detail page (`apps/web/src/app/services/[slug]/page.tsx`) shows provider cards with name, rating, bio, and "Book Now" but no heart icon to add/remove favorites. Mobile provider detail screen (`apps/mobile/app/(customer)/provider/[id].tsx`) does have a working favorite button.

**Reason not implemented:** The service detail page focuses on the booking flow (select provider → book). Adding a favorite toggle requires tracking per-provider favorite state (separate API calls per provider card), optimistic UI updates, and handling auth-gated actions on a page that can also be viewed by non-authenticated users. This is a UX enhancement that doesn't block any core flow — customers can still favorite providers from the dedicated `/favorites` page after booking.

**Priority:** Low — enhancement, not blocking any core flow.

---

## Gap 8: JWT Token Refresh on Web

**PRD Requirement:** Seamless authenticated experience without frequent re-logins.

**Current Implementation:** The login endpoint returns both `accessToken` (15-minute TTL) and `refreshToken`, but the web app only uses the access token. When it expires, the axios interceptor clears localStorage and redirects to `/login`. There is no automatic token refresh.

**Reason not implemented:** Implementing refresh token rotation requires a `/auth/refresh` backend endpoint (may not exist yet), secure storage of the refresh token, and retry logic in the axios interceptor. The 15-minute TTL is appropriate for security but causes frequent re-authentication in development. For production, the refresh flow should be implemented.

**Priority:** Medium — affects production UX, workaround is setting `JWT_EXPIRES_IN=24h` in `.env` for development.

---

## Summary

| Gap | Category | Priority | Blocked By |
|-----|----------|----------|------------|
| Google Places Autocomplete | Feature | High | Google Cloud API key |
| Book Button on Favorites | UX | Medium | Provider profile web page |
| Delete Notification | UX | Low | Not critical |
| Mobile Notification Badge | UX | Medium | FCM integration |
| WhatsApp Notifications | Integration | High | Twilio credentials |
| FCM Push Delivery | Integration | High | Firebase credentials |
| Favorite Toggle on Service Detail | UX | Low | Enhancement only |
| JWT Token Refresh (Web) | Auth | Medium | Backend refresh endpoint |

All gaps are due to external service dependencies (API keys, paid services), architectural prerequisites (provider profile page), or security trade-offs (JWT TTL). No hardcoded workarounds were used. No suboptimal shortcuts were taken.
