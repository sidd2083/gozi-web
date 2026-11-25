'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Bike,
  Store,
  Power,
  AlertCircle,
} from 'lucide-react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppConfig, DailyAnalytics } from '@/types';

interface OverviewModuleProps {
  activeOrdersCount: number;
  onlineRidersCount: number;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  activeOrdersCount,
  onlineRidersCount,
}) => {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [analytics, setAnalytics] = useState<DailyAnalytics>({
    date: new Date().toISOString().split('T')[0],
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });
  const [togglingStore, setTogglingStore] = useState(false);

  // Subscribe to settings/appConfig
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appConfig'), (snap) => {
      if (snap.exists()) {
        setAppConfig(snap.data() as AppConfig);
      } else {
        const initialConfig: AppConfig = {
          deliveryFee: 0,
          freeDeliveryAbove: 0,
          minOrderValue: 0,
          estimatedMinutesText: '10-15 mins',
          isStoreOpen: true,
          catalogVersion: 1,
        };
        setDoc(doc(db, 'settings', 'appConfig'), initialConfig);
        setAppConfig(initialConfig);
      }
    });
    return () => unsub();
  }, []);

  // Read lightweight daily analytics summary document
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
    } catch (e) {
      console.error('Failed to toggle store status:', e);
    }
    setTogglingStore(false);
  };

  const isStoreOpen = appConfig ? appConfig.isStoreOpen : true;

  return (
    <div className="space-y-6">
      {/* Store Master Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
          isStoreOpen
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow ${
              isStoreOpen ? 'bg-emerald-600' : 'bg-red-500'
            }`}
          >
            <Store size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">
                Gozi Hetauda Store
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  isStoreOpen
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {isStoreOpen ? 'LIVE' : 'CLOSED'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              ETA:{' '}
              <strong className="text-gray-800">
                {appConfig?.estimatedMinutesText || '10-15 mins'}
              </strong>{' '}
              · Delivery Fee:{' '}
              <strong className="text-emerald-700">
                Rs. {appConfig?.deliveryFee || 0}
              </strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleStoreStatus}
          disabled={togglingStore}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-white shadow-sm ${
            isStoreOpen
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <Power size={14} />
          {isStoreOpen ? 'Close Store' : 'Open Store'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Active Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {activeOrdersCount}
            </span>
            <span className="text-xs text-amber-600 font-medium">in pipeline</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Today&apos;s Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {analytics.totalOrders || activeOrdersCount}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {analytics.deliveredOrders} delivered
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              Rs. {analytics.totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 font-medium">today</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Riders Online
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <Bike size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {onlineRidersCount}
            </span>
            <span className="text-xs text-purple-500 font-medium">ready</span>
          </div>
        </div>
      </div>

      {/* Quick Tip */}
      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
          <AlertCircle size={14} />
          Quick Commerce Tip
        </h3>
        <p className="text-xs text-emerald-700 mt-2 leading-relaxed">
          Keep the <strong>Live Orders</strong> tab open during store hours. A
          repeating chime sounds when a new order arrives. Accept within 2 minutes,
          pack the bag, and assign an online rider for doorstep dispatch.
        </p>
      </div>
    </div>
  );
};
