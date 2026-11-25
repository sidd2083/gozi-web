'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus } from '@/types';

/* ------------------------------------------------------------------ */
/*  Single History Card                                                */
/* ------------------------------------------------------------------ */

const HistoryCard: React.FC<{ order: Order }> = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  const isDelivered = order.status === 'delivered';
  const statusColor = isDelivered ? 'text-green-600' : 'text-red-500';
  const StatusIcon = isDelivered ? CheckCircle : XCircle;

  return (
    <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon size={18} className={statusColor} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              #{order.orderNumber} · {order.customerName}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <Clock size={11} />
              {new Date(order.createdAt).toLocaleString('en-NP', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              {' · '}Rs. {order.bill.grandTotal}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
              isDelivered
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {order.status}
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href={`tel:${order.customerPhone}`}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium"
            >
              <Phone size={11} /> {order.customerPhone}
            </a>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full">
              <MapPin size={11} /> {order.deliveryAddress.fullAddress}
            </span>
          </div>

          {/* Items */}
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
                    <td className="px-3 py-2 text-gray-800">{item.name}</td>
                    <td className="px-3 py-2 text-center text-gray-700">{item.qty}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      Rs. {item.price * item.qty}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold text-gray-900">
                <tr>
                  <td className="px-3 py-2" colSpan={2}>
                    Subtotal: Rs. {order.bill.itemTotal} · Delivery: Rs. {order.bill.deliveryFee}
                  </td>
                  <td className="px-3 py-2 text-right">Rs. {order.bill.grandTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.riderDetails && (
            <p className="text-xs text-gray-500">
              Rider: <strong>{order.riderDetails.name}</strong> ({order.riderDetails.phone})
            </p>
          )}
          {order.cancelReason && (
            <p className="text-xs text-red-500">
              Cancel reason: {order.cancelReason}
            </p>
          )}
          {order.deliveredAt && (
            <p className="text-xs text-green-600">
              Delivered at:{' '}
              {new Date(order.deliveredAt).toLocaleString('en-NP', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Order History Module                                               */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 25;

export const OrderHistoryModule: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [_initialized, setInitialized] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const statuses: OrderStatus[] =
          statusFilter === 'all'
            ? ['delivered', 'cancelled']
            : [statusFilter];

        let q;
        if (reset || !lastDoc) {
          q = query(
            collection(db, 'orders'),
            where('status', 'in', statuses),
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE)
          );
        } else {
          q = query(
            collection(db, 'orders'),
            where('status', 'in', statuses),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(PAGE_SIZE)
          );
        }

        const snap = await getDocs(q);
        const fetched = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Order[];

        if (reset) {
          setOrders(fetched);
        } else {
          setOrders((prev) => [...prev, ...fetched]);
        }

        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === PAGE_SIZE);
        setInitialized(true);
      } catch (e) {
        console.error('Error fetching order history:', e);
      }
      setLoading(false);
    },
    [statusFilter, lastDoc]
  );

  // Initial load on first render or filter change
  const handleFilterChange = (status: 'all' | 'delivered' | 'cancelled') => {
    setStatusFilter(status);
    setLastDoc(null);
    setOrders([]);
    setHasMore(true);
    // Will re-fetch via the effect below
  };

  // Auto-fetch when status filter changes
  React.useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Client-side search filter
  const displayedOrders = searchTerm
    ? orders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customerPhone?.includes(searchTerm) ||
          o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orders;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Order History</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Past delivered and cancelled orders (paginated)
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID, name, or phone..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        {(['all', 'delivered', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange(s)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition capitalize ${
              statusFilter === s
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'All History' : s}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-400">
          <Clock size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No orders found</p>
          <p className="text-xs mt-1">
            {searchTerm ? 'Try a different search term' : 'Past orders will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((order) => (
            <HistoryCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !searchTerm && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchOrders(false)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Loading...
              </>
            ) : (
              <>
                Load More <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
