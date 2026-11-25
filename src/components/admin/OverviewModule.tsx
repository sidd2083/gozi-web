'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  Bike, 
  Store, 
  Power,
  Package,
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppConfig, DailyAnalytics } from '@/types';

interface OverviewModuleProps {
  activeOrdersCount: number;
  onlineRidersCount: number;
  onNavigateTab: (tab: 'orders' | 'products' | 'riders' | 'sections' | 'finance') => void;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  activeOrdersCount,
  onlineRidersCount,
  onNavigateTab,
}) => {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [analytics, setAnalytics] = useState<DailyAnalytics>({
    date: new Date().toISOString().split('T')[0],
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalDeliveryFees: 0,
    totalProfit: 0,
    totalPiecesSold: 0,
  });
  const [togglingStore, setTogglingStore] = useState(false);

  // Subscribe to settings/appConfig
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appConfig'), (snap) => {
      if (snap.exists()) {
        setAppConfig(snap.data() as AppConfig);
      } else {
        const initialConfig: AppConfig = {
          deliveryFee: 30,
          freeDeliveryAbove: 500,
          minOrderValue: 99,
          estimatedMinutesText: '10–15 mins',
          isStoreOpen: true,
          catalogVersion: 1,
        };
        setDoc(doc(db, 'settings', 'appConfig'), initialConfig);
        setAppConfig(initialConfig);
      }
    });
    return () => unsub();
  }, []);

  // Read lightweight daily analytics summary document (Quota-Safe)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const unsub = onSnapshot(doc(db, 'analytics', `daily_${today}`), (snap) => {
      if (snap.exists()) {
        setAnalytics(snap.data() as DailyAnalytics);
      }
    });
    return () => unsub();
  }, []);

  const handleToggleStoreStatus = async () => {
    if (!appConfig) return;
    try {
      setTogglingStore(true);
      const newStatus = !appConfig.isStoreOpen;
      await updateDoc(doc(db, 'settings', 'appConfig'), {
        isStoreOpen: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setTogglingStore(false);
    } catch (e) {
      console.error('Failed to toggle store status:', e);
      setTogglingStore(false);
    }
  };

  const isStoreOpen = appConfig ? appConfig.isStoreOpen : true;

  return (
    <div className="space-y-6">
      {/* Top Banner / Store Master Status */}
      <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm ${
        isStoreOpen 
          ? 'bg-emerald-50/80 border-emerald-200' 
          : 'bg-red-50/80 border-red-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
            isStoreOpen ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
            <Store size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-gray-900">Gozi Hetauda Dark Store</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase ${
                isStoreOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {isStoreOpen ? 'LIVE & ACCEPTING ORDERS' : 'STORE CURRENTLY CLOSED'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Doorstep Delivery: <strong className="text-gray-900">{appConfig?.estimatedMinutesText || '10–15 mins'}</strong> • Active Fee: <strong className="text-emerald-700">Rs. {appConfig?.deliveryFee ?? 30}</strong> (Free above Rs. {appConfig?.freeDeliveryAbove ?? 500})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStoreStatus}
            disabled={togglingStore}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 text-white shadow-sm ${
              isStoreOpen 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Power size={16} />
            <span>{isStoreOpen ? 'Close Store' : 'Open Store'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Performance Indicators (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Revenue */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today&apos;s Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">Rs. {analytics.totalRevenue.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-semibold">{analytics.deliveredOrders} delivered</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium">
            Net Profit: <strong className="text-emerald-700">Rs. {(analytics.totalProfit || 0).toLocaleString()}</strong>
          </div>
        </div>

        {/* Today's Orders & Pieces Sold */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today&apos;s Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{analytics.totalOrders || activeOrdersCount}</span>
            <span className="text-xs text-blue-600 font-semibold">{analytics.totalPiecesSold || 0} pieces sold</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium">
            Cancelled: <strong className="text-red-500">{analytics.cancelledOrders || 0}</strong>
          </div>
        </div>

        {/* Live Active Orders */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm relative overflow-hidden cursor-pointer hover:border-amber-300 transition" onClick={() => onNavigateTab('orders')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Active Orders</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{activeOrdersCount}</span>
            <span className="text-xs text-amber-600 font-semibold">in dispatch pipeline</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-semibold flex items-center gap-1">
            <span>View Live Orders</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Available Riders */}
        <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm relative overflow-hidden cursor-pointer hover:border-purple-300 transition" onClick={() => onNavigateTab('riders')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Online Riders</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bike size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{onlineRidersCount}</span>
            <span className="text-xs text-purple-600 font-semibold">ready for pickup</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-600 font-semibold flex items-center gap-1">
            <span>Manage Riders</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('orders')}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Live Orders Pipeline</p>
              <p className="text-xs text-gray-500">Dispatch & pack incoming orders</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-gray-400" />
        </button>

        <button
          onClick={() => onNavigateTab('products')}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Add / Manage Product</p>
              <p className="text-xs text-gray-500">Catalog, stock toggle & prices</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-gray-400" />
        </button>

        <button
          onClick={() => onNavigateTab('riders')}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bike size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Add / Settle Rider</p>
              <p className="text-xs text-gray-500">Fleet ledger, commission & PINs</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Operational Playbook Advice */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-3xl space-y-2">
        <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle size={16} className="text-emerald-700" />
          <span>Gozi Hetauda Quick Commerce Playbook</span>
        </h3>
        <p className="text-xs text-emerald-800 leading-relaxed font-medium">
          Keep the <strong>Live Orders</strong> tab open during store hours. When a new customer order arrives, an exact 5-second buzzer sounds once. Pack items within 120 seconds, mark <strong>Ready to Deliver</strong>, and assign an online rider for rapid doorstep delivery.
        </p>
      </div>
    </div>
  );
};
