export type DepartmentName =
  | 'Grocery & Kitchen'
  | 'Snacks & Drinks'
  | 'Beverages & Smokes'
  | 'Late Night Craving Combo'
  | 'Beauty & Personal Care';

export interface AppConfig {
  deliveryFee: number;
  freeDeliveryAbove: number;
  minOrderValue?: number;
  estimatedMinutesText?: string;
  isStoreOpen: boolean;
  catalogVersion?: number;
  storeCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AdminUser {
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'manager' | 'support';
  active: boolean;
  addedAt: string;
}

export type OrderStatus = 'placed' | 'packing' | 'handover' | 'reached' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  imageUrl: string;
}

export interface OrderBill {
  itemTotal: number;
  deliveryFee: number;
  grandTotal: number;
}

export interface RiderDetails {
  name: string;
  phone: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
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
  riderDetails: RiderDetails | null;
  storeId?: string;
  cancelReason?: string;
  createdAt: string;
  deliveredAt?: string;
  updatedAt: string;
}

export type RiderStatus = 'online' | 'busy' | 'offline';
export type CommissionType = 'fixed' | 'percentage';

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  commissionType: CommissionType;
  commissionRate: number; // e.g. 30 (for Rs. 30/order) or 10 (for 10%)
  isActive: boolean; // active vs suspended
  status: RiderStatus; // online, busy, offline
  currentOrderId: string | null;
  todayDeliveries: number;
  allTimeDeliveries: number;
  unpaidCommission: number;
  totalCommissionEarned: number;
  lastPayoutDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  department: DepartmentName;
  priorityOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  department: DepartmentName;
  unit: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  images: string[];
  inStock: boolean;
  isHidden: boolean;
  isTrending: boolean;
  isCombo?: boolean;
  storeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyAnalytics {
  date: string; // YYYY-MM-DD
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}
