// =====================================================================
// GOZI QUICK-COMMERCE SCHEMA & TYPES (Production-Grade)
// =====================================================================

// Exact cross-app Order Lifecycle Statuses:
// pending -> ready_to_deliver -> handover -> on_the_way -> reached -> delivered | cancelled
export type OrderStatus =
  | 'pending'
  | 'ready_to_deliver'
  | 'handover'
  | 'on_the_way'
  | 'reached'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string; // e.g. "P-1001" or doc id
  name: string;
  unit: string;
  price: number; // Selling Price (Rs.)
  costPrice?: number; // Cost Price for profit calculation (Rs.)
  qty: number;
  imageUrl: string;
  categoryName?: string;
}

export interface OrderBill {
  itemTotal: number;
  deliveryFee: number;
  discountTotal?: number;
  grandTotal: number;
}

export interface RiderDetails {
  id: string; // e.g. "RIDER-01"
  name: string;
  phone: string;
  vehicleNumber?: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: string;
  orderNumber: string; // "G-1001", "G-1002", etc.
  userId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    fullAddress: string;
    landmark?: string;
    lat: number;
    lng: number;
  };
  items: OrderItem[];
  bill: OrderBill;
  paymentMethod: 'COD';
  status: OrderStatus;
  riderId: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  riderDetails?: RiderDetails | null;
  storeId?: string;
  cancelReason?: string;
  placedAt?: any;
  packedAt?: any;
  handoverAt?: any;
  deliveredAt?: any;
  deliveredDate?: string; // "YYYY-MM-DD" for targeted today/date queries
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Storefront Hierarchy: Sections -> Categories -> Products
// ---------------------------------------------------------------------

export interface StoreSection {
  id: string;
  name: string; // e.g. 'Grocery & Kitchen', 'Snacks & Drinks', 'Late Night Combos'
  slug: string;
  displayOrder: number; // Order in storefront (1, 2, 3...)
  isActive: boolean;
  isCuratedShelf?: boolean; // For 3-column product-only shelf like Late Night Combos, Frozen, Trending
  shelfType?: 'combos' | 'frozen' | 'trending' | 'standard';
  description?: string;
  iconName?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  sectionId: string; // Parent Section ID
  sectionName?: string; // Cached Section Name
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  productNumber?: string; // Sequential "P-1001", "P-1002"
  name: string;
  description: string;
  sectionId: string; // Parent Section
  sectionName?: string;
  categoryId: string; // Parent Category
  categoryName?: string;
  unit: string; // e.g. "500g", "1L", "1 Pack", "Combo Set"
  mrp: number; // MRP in Rs.
  sellingPrice: number; // Selling Price in Rs.
  costPrice?: number; // Cost Price in Rs. (for profit calculations)
  discountPercent?: number;
  images: string[];
  inStock: boolean;
  stockQuantity?: number | null; // null = unlimited/manual, number = auto-decrement
  trackStock?: boolean;
  isHidden?: boolean;
  
  // Shelf placement checkboxes & consumer feed psychology
  isTrending?: boolean;
  isCombo?: boolean;
  isFrozen?: boolean;
  feedPriority?: number; // Priority score for discovery feed (high-impulse items first: salt, oil, chocolates)
  
  // Performance metrics
  totalSold?: number; // Total pieces/units sold
  totalRevenue?: number; // Total Rs. revenue generated
  
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Riders Fleet & Payout Ledger
// ---------------------------------------------------------------------

export type RiderStatus = 'online' | 'busy' | 'offline';
export type CommissionType = 'fixed' | 'percentage';

export interface RiderPayoutRecord {
  id: string;
  amount: number;
  paymentMethod: 'Cash' | 'eSewa' | 'Khalti' | 'Bank Transfer';
  note?: string;
  recordedBy: string; // Admin email
  createdAt: string;
}

export interface Rider {
  id: string;
  riderNumber: string; // e.g. "RIDER-01", "RIDER-02"
  name: string;
  phone: string; // Nepali +977
  address: string; // Hetauda ward/area
  vehicleNumber: string; // e.g. "Na 45 Pa 6789"
  
  // Rider app login credentials
  loginId: string; // Unique login ID / username for Rider App
  loginPin: string; // Encrypted/hashed or masked 4-6 digit PIN/password
  
  // Payout Configuration
  commissionType: CommissionType; // 'fixed' Rs/order or 'percentage'
  commissionRate: number; // e.g. Rs. 35 per delivery or 10%
  baseAllowance?: number; // Daily base allowance in Rs.
  
  // Live Status & Tracking
  status: RiderStatus;
  isActive: boolean; // Active vs Suspended
  currentOrderId: string | null;
  lat?: number;
  lng?: number;
  
  // Performance Ledger
  todayDeliveries: number;
  todayEarnings: number;
  totalDeliveries: number;
  unpaidBalance: number; // Current unpaid balance due in Rs.
  totalEarnings: number; // Lifetime total earnings
  lastPayoutDate?: string;
  payoutHistory?: RiderPayoutRecord[];
  
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Store Configuration & Settings
// ---------------------------------------------------------------------

export interface AppConfig {
  isStoreOpen: boolean;
  deliveryFee: number;
  freeDeliveryAbove: number;
  minOrderValue: number;
  estimatedMinutesText: string;
  catalogVersion: number;
  sectionOrder?: string[]; // Array of Section IDs defining display order
  cloudinaryConfig?: {
    cloudName: string;
    uploadPreset: string;
    enabled: boolean;
  };
  storeCoordinates?: {
    lat: number;
    lng: number;
  };
  updatedAt?: string;
}

export interface AdminUser {
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'manager' | 'support';
  active: boolean;
  addedAt: string;
}

// ---------------------------------------------------------------------
// Daily & Global Finance / Product Breakdown Analytics
// ---------------------------------------------------------------------

export interface SoldProductDailySummary {
  productId: string;
  name: string;
  categoryName?: string;
  qty: number; // Pieces sold
  revenue: number; // Gross Rs.
  profit: number; // Net Rs. (sellingPrice - costPrice) * qty
}

export interface DailyAnalytics {
  date: string; // YYYY-MM-DD
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number; // Gross sales Rs.
  totalDeliveryFees: number; // Delivery fees Rs.
  totalProfit: number; // Net profit Rs.
  totalPiecesSold: number; // Total item units sold
  productsSold?: Record<string, SoldProductDailySummary>; // Product breakdown map
  updatedAt?: string;
}

export interface GlobalAnalytics {
  allTimeOrders: number;
  allTimeDelivered: number;
  allTimeRevenue: number;
  allTimeProfit: number;
  allTimePiecesSold: number;
  lastUpdated?: string;
}
