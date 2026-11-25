'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Package,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Bike,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  Volume2,
  VolumeX,
  AlertTriangle,
  User,
  DollarSign
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  setDoc,
  getDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, Rider, DailyAnalytics, GlobalAnalytics } from '@/types';
import {
  playFiveSecondBuzzAlert,
  unlockAudio,
  setAudioMuted,
  isAudioMuted,
} from '@/lib/soundAlert';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Pending (New)',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
  },
  ready_to_deliver: {
    label: 'Ready to Deliver',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
  },
  handover: {
    label: 'Handover to Rider',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
  },
  on_the_way: {
    label: 'On The Way',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
  },
  reached: {
    label: 'Reached Doorstep',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
  },
};

interface LiveOrdersModuleProps {
  riders: Rider[];
  onActiveCountChange: (count: number) => void;
}

export const LiveOrdersModule: React.FC<LiveOrdersModuleProps> = ({
  riders,
  onActiveCountChange,
}) => {
  // Tabs: all, pending, ready_to_deliver, handover, delivered (today)
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'ready_to_deliver' | 'handover' | 'delivered'
  >('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [todayDelivered, setTodayDelivered] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assigningRiderOrder, setAssigningRiderOrder] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Track seen order IDs so initial page load does NOT false-buzz
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // 1. Quota-Safe Real-Time Listener on Non-Terminal Orders
  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['pending', 'ready_to_deliver', 'handover', 'on_the_way', 'reached'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveOrders: Order[] = [];
        let hasNewPendingOrder = false;

        snapshot.docs.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as Order;
          liveOrders.push(data);

          // If this is a pending order we haven't seen yet and not initial page load
          if (
            !initialLoadRef.current &&
            data.status === 'pending' &&
            !seenOrderIdsRef.current.has(data.id)
          ) {
            hasNewPendingOrder = true;
          }
          seenOrderIdsRef.current.add(data.id);
        });

        // Trigger exact 5-second single buzz if new pending order arrived
        if (hasNewPendingOrder && soundEnabled) {
          playFiveSecondBuzzAlert();
        }

        // Sort: pending first, then ready, then handover, then by createdAt desc
        const priority: Record<string, number> = {
          pending: 1,
          ready_to_deliver: 2,
          handover: 3,
          on_the_way: 4,
          reached: 5,
        };
        liveOrders.sort((a, b) => {
          const pA = priority[a.status] || 99;
          const pB = priority[b.status] || 99;
          if (pA !== pB) return pA - pB;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        setOrders(liveOrders);
        onActiveCountChange(liveOrders.length);
        initialLoadRef.current = false;
      },
      (error) => {
        console.error('Live orders snapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [soundEnabled, onActiveCountChange]);

  // 2. Targeted Query for Today's Delivered Orders (Saves reads, no global scan)
  useEffect(() => {
    const todayStr = todayKey();
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'delivered'),
      where('deliveredDate', '==', todayStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deliveredList: Order[] = [];
      snapshot.docs.forEach((docSnap) => {
        deliveredList.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      deliveredList.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setTodayDelivered(deliveredList);
    });

    return () => unsubscribe();
  }, []);

  // Filtered orders list
  const getDisplayOrders = () => {
    let baseList = orders;
    if (activeTab === 'pending') {
      baseList = orders.filter((o) => o.status === 'pending');
    } else if (activeTab === 'ready_to_deliver') {
      baseList = orders.filter((o) => o.status === 'ready_to_deliver');
    } else if (activeTab === 'handover') {
      baseList = orders.filter((o) => ['handover', 'on_the_way', 'reached'].includes(o.status));
    } else if (activeTab === 'delivered') {
      baseList = todayDelivered;
    }

    if (!searchQuery.trim()) return baseList;

    const term = searchQuery.toLowerCase().trim();
    return baseList.filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.customerPhone && o.customerPhone.includes(term))
    );
  };

  // Step 2: Mark Order Packed (pending -> ready_to_deliver)
  const handleMarkPacked = async (orderId: string) => {
    try {
      setIsProcessing(true);
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'ready_to_deliver',
        packedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to mark packed:', err);
      setIsProcessing(false);
    }
  };

  // Step 3: Assign Rider & Handover (ready_to_deliver -> handover)
  const handleAssignRiderAndHandover = async (orderId: string, rider: Rider) => {
    try {
      setIsProcessing(true);
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'handover',
        riderId: rider.id,
        riderName: rider.name,
        riderPhone: rider.phone,
        riderDetails: {
          id: rider.riderNumber || rider.id,
          name: rider.name,
          phone: rider.phone,
          vehicleNumber: rider.vehicleNumber,
        },
        handoverAt: now,
        updatedAt: now,
      });

      // Mark rider busy
      await updateDoc(doc(db, 'riders', rider.id), {
        status: 'busy',
        currentOrderId: orderId,
        updatedAt: now,
      });

      setAssigningRiderOrder(null);
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to assign rider:', err);
      setIsProcessing(false);
    }
  };

  // Step 4: Status Transition (on_the_way / reached)
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setIsProcessing(true);
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to update status:', err);
      setIsProcessing(false);
    }
  };

  // Step 5: Mark Order Delivered
  const handleMarkDelivered = async (order: Order) => {
    try {
      setIsProcessing(true);
      const todayStr = todayKey();
      const now = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', order.id);
        const dailyAnalyticsRef = doc(db, 'analytics', `daily_${todayStr}`);
        const globalAnalyticsRef = doc(db, 'analytics', 'global');

        // Read daily analytics
        const dailySnap = await transaction.get(dailyAnalyticsRef);
        const globalSnap = await transaction.get(globalAnalyticsRef);

        // Calculate order financials
        const grandTotal = order.bill?.grandTotal || 0;
        const deliveryFee = order.bill?.deliveryFee || 0;

        let totalPieces = 0;
        let totalCost = 0;
        const itemsBreakdown: Record<string, any> = {};

        if (order.items && order.items.length > 0) {
          order.items.forEach((item) => {
            const qty = item.qty || 1;
            const price = item.price || 0;
            const cost = item.costPrice || price * 0.8; // Fallback 20% margin if cost not set
            const itemRevenue = price * qty;
            const itemProfit = (price - cost) * qty;

            totalPieces += qty;
            totalCost += cost * qty;

            itemsBreakdown[item.productId || item.name] = {
              productId: item.productId || 'UNKNOWN',
              name: item.name,
              categoryName: item.categoryName || 'General',
              qty,
              revenue: itemRevenue,
              profit: itemProfit,
            };
          });
        }

        const orderProfit = grandTotal - totalCost;

        // 1. Update Order
        transaction.update(orderRef, {
          status: 'delivered',
          deliveredAt: now,
          deliveredDate: todayStr,
          updatedAt: now,
        });

        // 2. Update Daily Analytics
        let currentDaily = {
          date: todayStr,
          totalOrders: 1,
          deliveredOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          totalDeliveryFees: 0,
          totalProfit: 0,
          totalPiecesSold: 0,
          productsSold: {} as Record<string, any>,
        };

        if (dailySnap.exists()) {
          const dData = dailySnap.data();
          currentDaily = {
            ...currentDaily,
            ...dData,
            productsSold: dData.productsSold || {},
          };
        }

        // Merge product counts
        const mergedProducts = { ...currentDaily.productsSold };
        Object.keys(itemsBreakdown).forEach((pId) => {
          const item = itemsBreakdown[pId];
          if (mergedProducts[pId]) {
            mergedProducts[pId].qty += item.qty;
            mergedProducts[pId].revenue += item.revenue;
            mergedProducts[pId].profit += item.profit;
          } else {
            mergedProducts[pId] = item;
          }
        });

        transaction.set(
          dailyAnalyticsRef,
          {
            date: todayStr,
            deliveredOrders: (currentDaily.deliveredOrders || 0) + 1,
            totalRevenue: (currentDaily.totalRevenue || 0) + grandTotal,
            totalDeliveryFees: (currentDaily.totalDeliveryFees || 0) + deliveryFee,
            totalProfit: (currentDaily.totalProfit || 0) + orderProfit,
            totalPiecesSold: (currentDaily.totalPiecesSold || 0) + totalPieces,
            productsSold: mergedProducts,
            updatedAt: now,
          },
          { merge: true }
        );

        // 3. Update Global Analytics
        let currentGlobal = {
          allTimeOrders: 1,
          allTimeDelivered: 0,
          allTimeRevenue: 0,
          allTimeProfit: 0,
          allTimePiecesSold: 0,
        };
        if (globalSnap.exists()) {
          currentGlobal = { ...currentGlobal, ...globalSnap.data() };
        }

        transaction.set(
          globalAnalyticsRef,
          {
            allTimeDelivered: (currentGlobal.allTimeDelivered || 0) + 1,
            allTimeRevenue: (currentGlobal.allTimeRevenue || 0) + grandTotal,
            allTimeProfit: (currentGlobal.allTimeProfit || 0) + orderProfit,
            allTimePiecesSold: (currentGlobal.allTimePiecesSold || 0) + totalPieces,
            lastUpdated: now,
          },
          { merge: true }
        );

        // 4. Update Rider deliveries & commission if assigned
        if (order.riderId) {
          const riderRef = doc(db, 'riders', order.riderId);
          transaction.update(riderRef, {
            status: 'online',
            currentOrderId: null,
            todayDeliveries: increment(1),
            totalDeliveries: increment(1),
            todayEarnings: increment(35), // Default per-delivery commission
            unpaidBalance: increment(35),
            totalEarnings: increment(35),
            updatedAt: now,
          });
        }
      });

      setSelectedOrder(null);
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to mark delivered:', err);
      setIsProcessing(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = async () => {
    if (!cancelModalOrder || !cancelReasonText.trim()) return;
    try {
      setIsProcessing(true);
      const now = new Date().toISOString();
      const todayStr = todayKey();

      await updateDoc(doc(db, 'orders', cancelModalOrder.id), {
        status: 'cancelled',
        cancelReason: cancelReasonText.trim(),
        updatedAt: now,
      });

      // Free rider if one was assigned
      if (cancelModalOrder.riderId) {
        await updateDoc(doc(db, 'riders', cancelModalOrder.riderId), {
          status: 'online',
          currentOrderId: null,
          updatedAt: now,
        });
      }

      // Record in daily analytics
      const dailyRef = doc(db, 'analytics', `daily_${todayStr}`);
      const dailySnap = await getDoc(dailyRef);
      if (dailySnap.exists()) {
        await updateDoc(dailyRef, {
          cancelledOrders: increment(1),
          updatedAt: now,
        });
      } else {
        await setDoc(dailyRef, {
          date: todayStr,
          totalOrders: 1,
          deliveredOrders: 0,
          cancelledOrders: 1,
          totalRevenue: 0,
          totalDeliveryFees: 0,
          totalProfit: 0,
          totalPiecesSold: 0,
          updatedAt: now,
        });
      }

      setCancelModalOrder(null);
      setCancelReasonText('');
      setSelectedOrder(null);
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setIsProcessing(false);
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const readyCount = orders.filter((o) => o.status === 'ready_to_deliver').length;
  const handoverCount = orders.filter((o) => ['handover', 'on_the_way', 'reached'].includes(o.status)).length;
  const deliveredTodayCount = todayDelivered.length;

  const displayList = getDisplayOrders();

  return (
    <div className="space-y-6">
      {/* Top Header Bar with Sound Unlock and Live Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span>Live Orders Dispatch</span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                {pendingCount} NEW
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time pipeline syncing with Customer App & Rider App • Hetauda Hub
          </p>
        </div>

        {/* Audio Test & Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              unlockAudio();
              setSoundEnabled(!soundEnabled);
              setAudioMuted(!soundEnabled);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Buzzer Active (5s Alert)' : 'Buzzer Muted'}</span>
          </button>

          <button
            onClick={() => {
              unlockAudio();
              playFiveSecondBuzzAlert();
            }}
            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
            title="Test exact 5-second buzzer chime"
          >
            Test 5s Buzz
          </button>
        </div>
      </div>

      {/* Pipeline Tabs & Live Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Active ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
            }`}
          >
            <span>Pending</span>
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full text-[10px]">
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ready_to_deliver')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ready_to_deliver'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
            }`}
          >
            <span>Ready to Deliver</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded-full text-[10px]">
              {readyCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('handover')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'handover'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'
            }`}
          >
            <span>Handover to Rider</span>
            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 rounded-full text-[10px]">
              {handoverCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'delivered'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200'
            }`}
          >
            <span>Delivered Today</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded-full text-[10px]">
              {deliveredTodayCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search G-1001, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {displayList.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
            <Package size={30} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Orders in this view</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            New customer orders placed in the mobile app will automatically trigger the 5-second buzzer and appear here instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.qty || 1), 0);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border ${cfg.border} p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
              >
                {/* Order Card Header */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-gray-900 tracking-tight">
                      {order.orderNumber || 'G-????'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                    <User size={13} className="text-gray-400 shrink-0" />
                    <span className="font-bold text-gray-900 truncate">{order.customerName}</span>
                    <span>•</span>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-emerald-700 font-semibold hover:underline"
                    >
                      {order.customerPhone}
                    </a>
                  </div>

                  <div className="mt-1 text-xs text-gray-500 flex items-start gap-1.5 font-medium">
                    <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                    <span className="truncate">{order.deliveryAddress?.fullAddress || 'Hetauda, Nepal'}</span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="bg-gray-50 rounded-2xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-gray-500 text-[11px] font-semibold">
                    <span>{itemsCount} Pieces • COD</span>
                    <span className="text-gray-900 font-bold text-xs">
                      Rs. {order.bill?.grandTotal || 0}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(order.items || []).slice(0, 2).map((item, idx) => (
                      <p key={idx} className="text-gray-700 truncate">
                        • {item.qty}x {item.name} ({item.unit})
                      </p>
                    ))}
                    {(order.items || []).length > 2 && (
                      <p className="text-[10px] text-gray-500 font-semibold">
                        + {(order.items || []).length - 2} more item(s)...
                      </p>
                    )}
                  </div>
                </div>

                {/* Assigned Rider Banner (if any) */}
                {order.riderName && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 text-purple-900 text-xs font-semibold">
                    <Bike size={15} className="text-purple-600" />
                    <span className="truncate">Rider: {order.riderName} ({order.riderPhone})</span>
                  </div>
                )}

                {/* Action Buttons based on status */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleMarkPacked(order.id)}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition shadow-sm"
                    >
                      Confirm & Mark Order Packed
                    </button>
                  )}

                  {order.status === 'ready_to_deliver' && (
                    <button
                      onClick={() => setAssigningRiderOrder(order)}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Bike size={15} />
                      <span>Assign Rider & Handover</span>
                    </button>
                  )}

                  {order.status === 'handover' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'on_the_way')}
                        disabled={isProcessing}
                        className="py-2 px-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs rounded-xl transition"
                      >
                        On The Way
                      </button>
                      <button
                        onClick={() => handleMarkDelivered(order)}
                        disabled={isProcessing}
                        className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  )}

                  {['on_the_way', 'reached'].includes(order.status) && (
                    <button
                      onClick={() => handleMarkDelivered(order)}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={15} />
                      <span>Mark Delivered (COD Collected)</span>
                    </button>
                  )}

                  {/* View Details & Cancel row */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs font-bold text-gray-700 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <span>Full Details</span>
                      <ChevronDown size={14} />
                    </button>

                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          setCancelModalOrder(order);
                          setCancelReasonText('');
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FULL ORDER DETAIL DRAWER / MODAL                             */}
      {/* ------------------------------------------------------------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-gray-900">{selectedOrder.orderNumber}</h3>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                      STATUS_CONFIG[selectedOrder.status]?.bg
                    } ${STATUS_CONFIG[selectedOrder.status]?.color}`}
                  >
                    {STATUS_CONFIG[selectedOrder.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Customer & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-xs">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Customer Details</span>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedOrder.customerName}</p>
                <a
                  href={`tel:${selectedOrder.customerPhone}`}
                  className="text-emerald-700 font-bold mt-1 inline-flex items-center gap-1"
                >
                  <Phone size={12} />
                  <span>{selectedOrder.customerPhone}</span>
                </a>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Delivery Address</span>
                <p className="text-gray-800 font-medium mt-1">
                  {selectedOrder.deliveryAddress?.fullAddress}
                  {selectedOrder.deliveryAddress?.landmark && ` (${selectedOrder.deliveryAddress.landmark})`}
                </p>
                {selectedOrder.deliveryAddress?.lat && selectedOrder.deliveryAddress?.lng && (
                  <a
                    href={`https://maps.google.com/?q=${selectedOrder.deliveryAddress.lat},${selectedOrder.deliveryAddress.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold mt-1 inline-flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink size={12} />
                    <span>Open in Google Maps</span>
                  </a>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Itemized Breakdown</h4>
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Product</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Selling</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-semibold text-gray-900">{item.name}</td>
                        <td className="py-2.5 px-3 text-center text-gray-500">{item.unit}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-900">{item.qty}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">Rs. {item.price}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                          Rs. {item.price * item.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Calculation */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span>Rs. {selectedOrder.bill?.itemTotal || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee:</span>
                <span>Rs. {selectedOrder.bill?.deliveryFee || 0}</span>
              </div>
              <div className="flex justify-between font-black text-base text-gray-900 border-t border-emerald-200/60 pt-2">
                <span>Grand Total (COD):</span>
                <span className="text-emerald-700">Rs. {selectedOrder.bill?.grandTotal || 0}</span>
              </div>
            </div>

            {/* Assigned Rider Info */}
            {selectedOrder.riderName && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-1">
                <span className="text-purple-600 font-bold uppercase text-[10px]">Assigned Delivery Rider</span>
                <p className="text-sm font-bold text-purple-950">{selectedOrder.riderName}</p>
                <p className="text-purple-800">Phone: {selectedOrder.riderPhone}</p>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t">
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' ? (
                <button
                  onClick={() => handleMarkDelivered(selectedOrder)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Mark Order Delivered
                </button>
              ) : (
                <span className="text-xs font-bold text-gray-500">Order is {selectedOrder.status}</span>
              )}

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ASSIGN RIDER MODAL                                           */}
      {/* ------------------------------------------------------------- */}
      {assigningRiderOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-gray-900">
                Assign Rider to {assigningRiderOrder.orderNumber}
              </h3>
              <button
                onClick={() => setAssigningRiderOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Select an active delivery rider currently in Hetauda to handover this bag.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {riders.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No riders registered in fleet yet.</p>
              ) : (
                riders.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleAssignRiderAndHandover(assigningRiderOrder.id, r)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 transition text-left"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{r.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {r.phone} • {r.vehicleNumber}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        r.status === 'online'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setAssigningRiderOrder(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CANCEL ORDER MODAL                                            */}
      {/* ------------------------------------------------------------- */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              <h3 className="text-base font-black text-gray-900">
                Cancel {cancelModalOrder.orderNumber}?
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Please enter a reason for cancellation. This will be visible on the customer audit record.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Out of stock, customer requested cancellation, invalid address..."
              value={cancelReasonText}
              onChange={(e) => setCancelReasonText(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isProcessing || !cancelReasonText.trim()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
