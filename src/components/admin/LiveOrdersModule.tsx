'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, Rider } from '@/types';
import {
  startContinuousOrderAlert,
  stopContinuousOrderAlert,
} from '@/lib/soundAlert';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'New Order',
  packing: 'Packing',
  handover: 'Out for Delivery',
  reached: 'Reached Customer',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: 'bg-amber-500',
  packing: 'bg-blue-500',
  handover: 'bg-purple-500',
  reached: 'bg-emerald-500',
  delivered: 'bg-green-700',
  cancelled: 'bg-red-600',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/* ------------------------------------------------------------------ */
/*  Rider Assign Modal                                                 */
/* ------------------------------------------------------------------ */

interface RiderPickerProps {
  riders: Rider[];
  onSelect: (rider: Rider) => void;
  onClose: () => void;
}

const RiderPicker: React.FC<RiderPickerProps> = ({ riders, onSelect, onClose }) => {
  const available = riders.filter((r) => r.isActive && r.status === 'online');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Assign Rider</h3>
          <p className="text-xs text-gray-500 mt-1">Select an online rider to dispatch</p>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
          {available.length === 0 && (
            <p className="p-6 text-center text-sm text-gray-400">No riders online</p>
          )}
          {available.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-emerald-50 transition text-left"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {r.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                <p className="text-xs text-gray-500">{r.phone} · {r.vehicleNumber}</p>
              </div>
              <Bike size={16} className="text-emerald-500 shrink-0" />
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Single Order Card                                                  */
/* ------------------------------------------------------------------ */

interface OrderCardProps {
  order: Order;
  riders: Rider[];
  onStatusChange: (orderId: string, newStatus: OrderStatus, rider?: Rider) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, riders, onStatusChange }) => {
  const [expanded, setExpanded] = useState(order.status === 'placed');
  const [showRiderPicker, setShowRiderPicker] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleAction = async (newStatus: OrderStatus, rider?: Rider) => {
    setUpdating(true);
    await onStatusChange(order.id, newStatus, rider);
    setUpdating(false);
    setShowRiderPicker(false);
  };

  return (
    <>
      <div
        className={`border rounded-2xl overflow-hidden transition-shadow ${
          order.status === 'placed'
            ? 'border-amber-300 bg-amber-50 shadow-md shadow-amber-100'
            : 'border-gray-200 bg-white shadow-sm'
        }`}
      >
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[order.status]} ${
                order.status === 'placed' ? 'animate-pulse' : ''
              }`}
            />
            <div className="text-left min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                #{order.orderNumber} · {order.customerName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Clock size={12} />
                {timeAgo(order.createdAt)} · Rs. {order.bill.grandTotal}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide text-white ${STATUS_COLORS[order.status]}`}
            >
              {STATUS_LABELS[order.status]}
            </span>
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </button>

        {/* Body */}
        {expanded && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            {/* Customer Info */}
            <div className="flex flex-wrap gap-3 text-xs">
              <a
                href={`tel:${order.customerPhone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium hover:bg-blue-100 transition"
              >
                <Phone size={12} /> {order.customerPhone}
              </a>
              <a
                href={`https://maps.google.com/?q=${order.deliveryAddress.lat},${order.deliveryAddress.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-medium hover:bg-emerald-100 transition"
              >
                <MapPin size={12} /> Map
                <ExternalLink size={10} />
              </a>
            </div>

            {/* Address */}
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Deliver to:</strong> {order.deliveryAddress.fullAddress}
              {order.deliveryAddress.landmark && ` (${order.deliveryAddress.landmark})`}
            </p>

            {/* Item Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Item</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600">Qty</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-800">{item.name} <span className="text-gray-400">({item.unit})</span></td>
                      <td className="px-3 py-2 text-center text-gray-700">{item.qty}</td>
                      <td className="px-3 py-2 text-right text-gray-900 font-medium">Rs. {item.price * item.qty}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold text-gray-900">
                  <tr>
                    <td className="px-3 py-2" colSpan={2}>Items: Rs. {order.bill.itemTotal} · Delivery: Rs. {order.bill.deliveryFee}</td>
                    <td className="px-3 py-2 text-right">Rs. {order.bill.grandTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Rider Info (if assigned) */}
            {order.riderDetails && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl text-xs text-purple-800">
                <Bike size={14} />
                <span className="font-semibold">{order.riderDetails.name}</span>
                <span className="text-purple-500">({order.riderDetails.phone})</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {order.status === 'placed' && (
                <button
                  disabled={updating}
                  onClick={() => handleAction('packing')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  <Package size={14} /> Accept & Pack
                </button>
              )}
              {order.status === 'packing' && (
                <button
                  disabled={updating}
                  onClick={() => setShowRiderPicker(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  <Bike size={14} /> Assign Rider & Handover
                </button>
              )}
              {order.status === 'handover' && (
                <button
                  disabled={updating}
                  onClick={() => handleAction('reached')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  <MapPin size={14} /> Mark Reached
                </button>
              )}
              {order.status === 'reached' && (
                <button
                  disabled={updating}
                  onClick={() => handleAction('delivered')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Mark Delivered
                </button>
              )}
              {['placed', 'packing', 'handover', 'reached'].includes(order.status) && (
                <button
                  disabled={updating}
                  onClick={() => handleAction('cancelled')}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-gray-200 transition disabled:opacity-50"
                >
                  <XCircle size={14} /> Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showRiderPicker && (
        <RiderPicker
          riders={riders}
          onSelect={(rider) => handleAction('handover', rider)}
          onClose={() => setShowRiderPicker(false)}
        />
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Live Orders Module                                                 */
/* ------------------------------------------------------------------ */

interface LiveOrdersModuleProps {
  onOrdersUpdate: (count: number) => void;
  riders: Rider[];
}

export const LiveOrdersModule: React.FC<LiveOrdersModuleProps> = ({
  onOrdersUpdate,
  riders,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Real-time listener on active orders
  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['placed', 'packing', 'handover', 'reached'])
    );

    const unsub = onSnapshot(q, (snap) => {
      const liveOrders: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];

      // Sort: placed first (newest on top), then packing, handover, reached
      const statusPriority: Record<string, number> = {
        placed: 0,
        packing: 1,
        handover: 2,
        reached: 3,
      };
      liveOrders.sort(
        (a, b) =>
          statusPriority[a.status] - statusPriority[b.status] ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(liveOrders);
      onOrdersUpdate(liveOrders.length);

      // Trigger alarm if any order has status === 'placed'
      const hasPlaced = liveOrders.some((o) => o.status === 'placed');
      if (hasPlaced) {
        startContinuousOrderAlert();
      } else {
        stopContinuousOrderAlert();
      }
    });

    return () => {
      unsub();
      stopContinuousOrderAlert();
    };
  }, [onOrdersUpdate]);

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: OrderStatus, rider?: Rider) => {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      if (newStatus === 'handover' && rider) {
        updateData.riderId = rider.id;
        updateData.riderDetails = {
          name: rider.name,
          phone: rider.phone,
        };
        // Mark rider as busy
        await updateDoc(doc(db, 'riders', rider.id), {
          status: 'busy',
          currentOrderId: orderId,
          updatedAt: new Date().toISOString(),
        });
      }

      if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date().toISOString();

        // Find the order to get bill details for analytics
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          const analyticsRef = doc(db, 'analytics', `daily_${todayKey()}`);
          const analyticsSnap = await getDoc(analyticsRef);
          if (analyticsSnap.exists()) {
            await updateDoc(analyticsRef, {
              deliveredOrders: increment(1),
              totalRevenue: increment(order.bill.grandTotal),
            });
          } else {
            await setDoc(analyticsRef, {
              date: todayKey(),
              totalOrders: 1,
              deliveredOrders: 1,
              cancelledOrders: 0,
              totalRevenue: order.bill.grandTotal,
            });
          }

          // Free up rider
          if (order.riderId) {
            await updateDoc(doc(db, 'riders', order.riderId), {
              status: 'online',
              currentOrderId: null,
              todayDeliveries: increment(1),
              allTimeDeliveries: increment(1),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      if (newStatus === 'cancelled') {
        const analyticsRef = doc(db, 'analytics', `daily_${todayKey()}`);
        const analyticsSnap = await getDoc(analyticsRef);
        if (analyticsSnap.exists()) {
          await updateDoc(analyticsRef, {
            cancelledOrders: increment(1),
          });
        } else {
          await setDoc(analyticsRef, {
            date: todayKey(),
            totalOrders: 1,
            deliveredOrders: 0,
            cancelledOrders: 1,
            totalRevenue: 0,
          });
        }

        // Free rider if assigned
        const order = orders.find((o) => o.id === orderId);
        if (order?.riderId) {
          await updateDoc(doc(db, 'riders', order.riderId), {
            status: 'online',
            currentOrderId: null,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);
    },
    [orders]
  );

  const placedCount = orders.filter((o) => o.status === 'placed').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Live Orders</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {orders.length} active · {placedCount} awaiting acceptance
          </p>
        </div>
        {placedCount > 0 && (
          <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold animate-pulse">
            {placedCount} NEW
          </span>
        )}
      </div>

      {/* Order Cards */}
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No active orders right now</p>
          <p className="text-xs mt-1">New orders will appear here instantly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              riders={riders}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
