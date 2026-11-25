# PROJECT_HISTORY.md — Gozi Web (Admin + Public Website)

## Overview
**Gozi** is a hyperlocal quick-commerce delivery platform in **Hetauda, Makwanpur, Nepal**.  
This codebase is the **web application**: a public business website + a protected `/admin` operations panel.

| Property | Value |
|---|---|
| **Stack** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| **Backend** | Firebase (Auth + Cloud Firestore) |
| **Firebase Project** | `gozi-4d81e` |
| **Primary Owner** | `raghurl.202@gmail.com` |
| **Icons** | `lucide-react` (zero emojis) |
| **Brand Colors** | White `#FFFFFF` surfaces, Gozi green `#16A34A`/`#15803D` accents |

---

## Architecture

```
gozi-web/
├── public/
│   └── gozi-logo.png              # Brand logo asset
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Geist fonts, global CSS)
│   │   ├── page.tsx                # Public home page (/)
│   │   ├── about/page.tsx          # /about
│   │   ├── privacy-policy/page.tsx # /privacy-policy
│   │   ├── refund-policy/page.tsx  # /refund-policy
│   │   ├── terms/page.tsx          # /terms
│   │   └── admin/page.tsx          # /admin — Protected admin dashboard
│   ├── components/
│   │   ├── PublicHeader.tsx         # Navbar for public pages
│   │   ├── PublicFooter.tsx         # Footer with Hetauda info
│   │   └── admin/
│   │       ├── AdminLogin.tsx       # Google SSO login screen
│   │       ├── OverviewModule.tsx   # Module 1: KPIs, store toggle, analytics
│   │       ├── LiveOrdersModule.tsx # Module 2: Real-time order dispatch
│   │       ├── RidersModule.tsx     # Module 3: Fleet management & payouts
│   │       ├── CatalogModule.tsx    # Module 4: Categories & products CRUD
│   │       ├── OrderHistoryModule.tsx # Module 5: Paginated past orders
│   │       └── SettingsModule.tsx   # Module 6: Store config & admin access
│   ├── lib/
│   │   ├── firebase.ts             # Firebase Web SDK init
│   │   ├── adminAuth.ts            # Google Auth + Firestore admin verification
│   │   ├── AdminAuthContext.tsx     # React context for admin session
│   │   └── soundAlert.ts           # Web Audio API order chime
│   └── types/
│       └── index.ts                # Shared TypeScript types
├── .env.local                      # Firebase env vars
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Firestore Schema

### `settings/appConfig`
| Field | Type | Description |
|---|---|---|
| `isStoreOpen` | boolean | Master store open/closed toggle |
| `deliveryFee` | number | Delivery fee in NPR |
| `freeDeliveryAbove` | number | Free delivery threshold (0 = always charged) |
| `minOrderValue` | number | Minimum order value |
| `estimatedMinutesText` | string | Display text ("10-15 mins") |
| `catalogVersion` | number | Incremented on any catalog change |

### `admins/{email}`
| Field | Type | Description |
|---|---|---|
| `email` | string | Admin email (lowercase) |
| `role` | string | `owner` or `admin` |
| `active` | boolean | Whether access is active |
| `addedAt` | string | ISO timestamp |

### `orders/{orderId}`
| Field | Type | Description |
|---|---|---|
| `orderNumber` | string | Display order number |
| `userId` | string | Customer UID |
| `customerName` | string | Customer full name |
| `customerPhone` | string | +977 phone number |
| `deliveryAddress` | object | `{fullAddress, landmark?, lat, lng}` |
| `items` | array | `[{productId, name, unit, price, qty, imageUrl}]` |
| `bill` | object | `{itemTotal, deliveryFee, grandTotal}` |
| `paymentMethod` | string | `COD` |
| `status` | string | `placed → packing → handover → reached → delivered` or `cancelled` |
| `riderId` | string? | Assigned rider document ID |
| `riderDetails` | object? | `{name, phone}` |
| `cancelReason` | string? | Reason if cancelled |
| `createdAt` | string | ISO timestamp |
| `deliveredAt` | string? | ISO timestamp when delivered |
| `updatedAt` | string | ISO timestamp |

### `riders/{riderId}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Rider name |
| `phone` | string | Phone number |
| `vehicleNumber` | string | Vehicle plate |
| `commissionType` | string | `fixed` or `percentage` |
| `commissionRate` | number | Rs per order or % |
| `isActive` | boolean | Active vs suspended |
| `status` | string | `online`, `busy`, `offline` |
| `currentOrderId` | string? | Currently assigned order |
| `todayDeliveries` | number | Today's count |
| `allTimeDeliveries` | number | Lifetime count |
| `unpaidCommission` | number | Pending payout in Rs |
| `totalCommissionEarned` | number | Lifetime earned |
| `lastPayoutDate` | string? | Last payout timestamp |

### `categories/{categoryId}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Category name |
| `imageUrl` | string | Category thumbnail |
| `department` | string | One of 5 departments |
| `priorityOrder` | number | Sort order |
| `isActive` | boolean | Visible in app |

### `products/{productId}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Product name |
| `description` | string | Description |
| `categoryId` | string | Parent category |
| `department` | string | Department |
| `unit` | string | "1 kg", "500 ml", etc. |
| `mrp` | number | MRP in Rs |
| `sellingPrice` | number | Selling price |
| `discountPercent` | number | Discount % |
| `images` | string[] | Image URLs |
| `inStock` | boolean | Stock toggle |
| `isHidden` | boolean | Hidden from customers |
| `isTrending` | boolean | Trending flag |
| `isCombo` | boolean? | Combo flag |

### `analytics/daily_{YYYY-MM-DD}`
| Field | Type | Description |
|---|---|---|
| `date` | string | Date key |
| `totalOrders` | number | Total orders placed |
| `deliveredOrders` | number | Successfully delivered |
| `cancelledOrders` | number | Cancelled count |
| `totalRevenue` | number | Revenue from delivered orders |

---

## Admin Modules

### Module 1: Overview
- KPI cards: active orders, today's orders, revenue, online riders
- Store open/close toggle
- Daily analytics from `analytics/daily_{date}`

### Module 2: Live Orders (Default Landing)
- Real-time `onSnapshot` on orders with status `in [placed, packing, handover, reached]`
- Repeating Web Audio chime alarm for `placed` orders
- Order dispatch flow: `placed → packing → handover (assign rider) → reached → delivered`
- Cancel at any stage
- Atomically updates `analytics` on delivery/cancellation
- Frees rider when order is delivered/cancelled

### Module 3: Riders
- Add/edit rider modal (name, phone, vehicle, commission setup)
- Online/Busy/Offline status badges (live from Firestore)
- Today's deliveries and all-time stats
- Payout settlement: resets `unpaidCommission` and records payout

### Module 4: Catalog Manager
- Two sub-tabs: Categories | Products
- Categories grouped by department (5 departments)
- Products: search, filter by department/stock, sortable table
- 1-click in-stock/out-of-stock toggle
- Trending and combo flags
- Every mutation bumps `catalogVersion` in `settings/appConfig`

### Module 5: Order History
- Paginated on-demand query (`limit(25)`) for `delivered` and `cancelled` orders
- Filter by status (all / delivered / cancelled)
- Client-side search by order ID, name, or phone
- Expandable order detail card with itemized table

### Module 6: Store Settings
- Delivery fee, free-delivery threshold, min order value, ETA text
- Admin access management (add/remove emails)
- Primary owner `raghurl.202@gmail.com` has permanent irrevocable access

---

## Public Pages
1. **Home (`/`)**: Hero, 3-step "How It Works", category overview, download CTA
2. **About (`/about`)**: Hetauda story, mission, operational hours
3. **Privacy Policy (`/privacy-policy`)**: Firebase + Nepal compliance
4. **Refund Policy (`/refund-policy`)**: Cancellation rules, COD adjustments
5. **Terms (`/terms`)**: Legal terms for Hetauda delivery, NPR pricing

---

## Auth Flow
1. Admin visits `/admin` → sees Google Sign-In screen
2. Signs in via Google popup
3. If email is `raghurl.202@gmail.com` → unconditional owner access
4. Otherwise checks `admins/{email}` in Firestore for `active: true`
5. Unauthorized accounts are immediately signed out

---

## Quota-Safe Design
- Active orders: real-time listener only on `status in [placed, packing, handover, reached]`
- History orders: paginated on-demand query (`limit(25)`)
- Analytics: single lightweight document per day (`analytics/daily_{date}`)
- Catalog changes bump `catalogVersion` so mobile app cache stays in sync

---

## Build & Run
```bash
npm install
npm run dev    # Development server
npm run build  # Production build
npm start      # Production server
```

---

*Last updated: 2026-11-25*
