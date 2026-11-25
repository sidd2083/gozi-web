'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShoppingBag,
  Bike,
  Grid3X3,
  Clock,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  Menu,
  X,
  Store,
  DollarSign,
  Layers,
  Package
} from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/lib/AdminAuthContext';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { OverviewModule } from '@/components/admin/OverviewModule';
import { LiveOrdersModule } from '@/components/admin/LiveOrdersModule';
import { SectionsModule } from '@/components/admin/SectionsModule';
import { ProductsModule } from '@/components/admin/ProductsModule';
import { FinanceModule } from '@/components/admin/FinanceModule';
import { RidersModule } from '@/components/admin/RidersModule';
import { OrderHistoryModule } from '@/components/admin/OrderHistoryModule';
import { SettingsModule } from '@/components/admin/SettingsModule';
import { setAudioMuted, isAudioMuted, unlockAudio } from '@/lib/soundAlert';
import { Rider } from '@/types';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { seedDefaultGoziCatalog } from '@/services/catalogSeeder';

type TabId =
  | 'orders'
  | 'overview'
  | 'sections'
  | 'products'
  | 'finance'
  | 'riders'
  | 'history'
  | 'settings';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  { id: 'orders', label: 'Live Orders', icon: <ShoppingBag size={18} /> },
  { id: 'overview', label: 'Executive Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'sections', label: 'Sections & Categories', icon: <Layers size={18} /> },
  { id: 'products', label: 'Products & Stock', icon: <Package size={18} /> },
  { id: 'finance', label: 'Finance & Profit', icon: <DollarSign size={18} /> },
  { id: 'riders', label: 'Riders & Ledger', icon: <Bike size={18} /> },
  { id: 'history', label: 'Order History', icon: <Clock size={18} /> },
  { id: 'settings', label: 'Store Settings', icon: <Settings size={18} /> },
];

const AdminDashboard: React.FC = () => {
  const { adminStatus, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  // Global counts
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [onlineRidersCount, setOnlineRidersCount] = useState(0);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);

  // 1. Subscribe to Riders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'riders'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Rider[];
      setRiders(list);
      setOnlineRidersCount(list.filter((r) => r.status === 'online' && r.isActive).length);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to store settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appConfig'), (snap) => {
      if (snap.exists()) {
        setStoreOpen(snap.data().isStoreOpen ?? true);
      }
    });
    return () => unsub();
  }, []);

  // Auto-seed default catalog on initial login if empty
  useEffect(() => {
    seedDefaultGoziCatalog(false).catch((err) =>
      console.warn('Auto-seed check complete:', err)
    );
  }, []);

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    setAudioMuted(newMuted);
    if (!newMuted) {
      unlockAudio();
    }
  };

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Navigation */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-white border-r border-gray-200/80 flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden relative shrink-0 shadow-sm border border-emerald-500/20">
              <Image src="/gozi-logo.png" alt="Gozi" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 tracking-tight">Gozi Operations</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${storeOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {storeOpen ? 'Hetauda Hub Live' : 'Store Closed'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 lg:hidden text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-white' : 'text-gray-400'}>
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
              {tab.id === 'orders' && activeOrdersCount > 0 && (
                <span
                  className={`ml-auto px-2 py-0.5 text-[10px] font-black rounded-full ${
                    activeTab === 'orders'
                      ? 'bg-white text-emerald-700'
                      : 'bg-amber-500 text-white animate-pulse'
                  }`}
                >
                  {activeOrdersCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/50">
          {/* Sound Alarm Quick Toggle */}
          <button
            onClick={handleToggleMute}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs ${
              muted
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>5s Buzzer Alert</span>
            </span>
            <span className="text-[10px] uppercase font-black">{muted ? 'Muted' : 'Active'}</span>
          </button>

          {/* User Email & Sign Out */}
          <div className="flex items-center justify-between pt-1">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-gray-900 truncate">{adminStatus?.email}</p>
              <p className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">
                {adminStatus?.role || 'Admin'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between lg:hidden shadow-xs">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-700"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-gray-900">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-emerald-600"
          >
            {muted ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} />}
          </button>
        </header>

        {/* Dynamic Page Component */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'orders' && (
            <LiveOrdersModule
              riders={riders}
              onActiveCountChange={setActiveOrdersCount}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewModule
              activeOrdersCount={activeOrdersCount}
              onlineRidersCount={onlineRidersCount}
              onNavigateTab={(tab) => {
                if (tab === 'orders') setActiveTab('orders');
                else if (tab === 'products') setActiveTab('products');
                else if (tab === 'riders') setActiveTab('riders');
                else if (tab === 'sections') setActiveTab('sections');
                else if (tab === 'finance') setActiveTab('finance');
              }}
            />
          )}

          {activeTab === 'sections' && <SectionsModule />}

          {activeTab === 'products' && <ProductsModule />}

          {activeTab === 'finance' && <FinanceModule />}

          {activeTab === 'riders' && (
            <RidersModule onOnlineCountChange={setOnlineRidersCount} />
          )}

          {activeTab === 'history' && <OrderHistoryModule />}

          {activeTab === 'settings' && <SettingsModule />}
        </div>
      </main>
    </div>
  );
};

const AdminPageInner: React.FC = () => {
  const { user, adminStatus, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            Authenticating Gozi Admin...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !adminStatus?.authorized) {
    return (
      <AdminLogin
        onLoginSuccess={() => {}}
        initialError={adminStatus?.error}
      />
    );
  }

  return <AdminDashboard />;
};

export default function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminPageInner />
    </AdminAuthProvider>
  );
}
