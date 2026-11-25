'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ShoppingBag,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DailyAnalytics, GlobalAnalytics, SoldProductDailySummary } from '@/types';

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const FinanceModule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(formatDateInput(new Date()));
  const [dailyData, setDailyData] = useState<DailyAnalytics | null>(null);
  const [globalData, setGlobalData] = useState<GlobalAnalytics>({
    allTimeOrders: 0,
    allTimeDelivered: 0,
    allTimeRevenue: 0,
    allTimeProfit: 0,
    allTimePiecesSold: 0,
  });
  const [isLoadingDate, setIsLoadingDate] = useState(false);

  // 1. Fetch Global All-Time Analytics (Single document read)
  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const snap = await getDoc(doc(db, 'analytics', 'global'));
        if (snap.exists()) {
          setGlobalData(snap.data() as GlobalAnalytics);
        }
      } catch (err) {
        console.error('Error fetching global analytics:', err);
      }
    };
    fetchGlobal();
  }, []);

  // 2. Fetch Selected Date Analytics (Single document read from analytics/daily_{YYYY-MM-DD})
  useEffect(() => {
    const fetchDay = async () => {
      try {
        setIsLoadingDate(true);
        const snap = await getDoc(doc(db, 'analytics', `daily_${selectedDate}`));
        if (snap.exists()) {
          setDailyData(snap.data() as DailyAnalytics);
        } else {
          setDailyData({
            date: selectedDate,
            totalOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            totalRevenue: 0,
            totalDeliveryFees: 0,
            totalProfit: 0,
            totalPiecesSold: 0,
            productsSold: {},
          });
        }
        setIsLoadingDate(false);
      } catch (err) {
        console.error('Error fetching daily analytics:', err);
        setIsLoadingDate(false);
      }
    };
    fetchDay();
  }, [selectedDate]);

  // Quick Date Navigator (+1 day / -1 day)
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDateInput(current));
  };

  const productsList: SoldProductDailySummary[] = dailyData?.productsSold
    ? Object.values(dailyData.productsSold).sort((a, b) => b.qty - a.qty)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Finance & Date-Wise Analytics</h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time profit tracking, daily product breakdown & quota-safe single-read reporting
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 px-2">
            <Calendar size={14} className="text-emerald-700" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleShiftDate(1)}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Global All-Time Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lifetime Gross Revenue</span>
          <p className="text-2xl font-black text-gray-900">Rs. {globalData.allTimeRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500 font-medium">{globalData.allTimeDelivered} Delivered Orders</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Lifetime Net Profit</span>
          <p className="text-2xl font-black text-emerald-700">Rs. {globalData.allTimeProfit.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Calculated from item cost prices</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Pieces Sold</span>
          <p className="text-2xl font-black text-blue-600">{(globalData.allTimePiecesSold || 0).toLocaleString()} pcs</p>
          <p className="text-[11px] text-gray-500 font-medium">Across all grocery & snack categories</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hetauda Store Hub</span>
          <p className="text-2xl font-black text-gray-900">COD Active</p>
          <p className="text-[11px] text-gray-500 font-medium">Daily automated ledger sync</p>
        </div>
      </div>

      {/* Selected Day Inspector */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <span>Day Performance for</span>
              <span className="text-emerald-700 underline">{selectedDate}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Targeted snapshot summary (Cost: 1 Firestore Document Read)
            </p>
          </div>

          {isLoadingDate && <span className="text-xs text-emerald-600 font-bold animate-pulse">Loading day stats...</span>}
        </div>

        {/* Selected Date Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Orders Completed</span>
            <p className="text-xl font-black text-gray-900 mt-1">{dailyData?.deliveredOrders || 0}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Pieces Sold</span>
            <p className="text-xl font-black text-gray-900 mt-1">{dailyData?.totalPiecesSold || 0} pcs</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Gross Sales (Rs.)</span>
            <p className="text-xl font-black text-gray-900 mt-1">Rs. {(dailyData?.totalRevenue || 0).toLocaleString()}</p>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Net Profit (Rs.)</span>
            <p className="text-xl font-black text-emerald-700 mt-1">Rs. {(dailyData?.totalProfit || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Product-by-Product Breakdown Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={14} className="text-emerald-600" />
              <span>Product-by-Product Breakdown for {selectedDate}</span>
            </h4>
            <span className="text-xs text-gray-400 font-bold">{productsList.length} Unique Item(s) Sold</span>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                <tr>
                  <th className="py-2.5 px-4 text-left">Product ID</th>
                  <th className="py-2.5 px-4 text-left">Product Name</th>
                  <th className="py-2.5 px-4 text-left">Category</th>
                  <th className="py-2.5 px-4 text-center">Pieces Sold</th>
                  <th className="py-2.5 px-4 text-right">Revenue (Rs.)</th>
                  <th className="py-2.5 px-4 text-right">Profit Earned (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">
                      No delivered orders recorded on {selectedDate}.
                    </td>
                  </tr>
                ) : (
                  productsList.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/60 transition">
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-600">{p.productId}</td>
                      <td className="py-2.5 px-4 font-bold text-gray-900">{p.name}</td>
                      <td className="py-2.5 px-4 text-gray-500">{p.categoryName || 'General'}</td>
                      <td className="py-2.5 px-4 text-center font-black text-gray-900">{p.qty}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-gray-900">Rs. {p.revenue.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-700">Rs. {p.profit.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
