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
} from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/lib/AdminAuthContext';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { OverviewModule } from '@/components/admin/OverviewModule';
import { LiveOrdersModule } from '@/components/admin/LiveOrdersModule';
import { RidersModule } from '@/components/admin/RidersModule';
import { CatalogModule } from '@/components/admin/CatalogModule';
import { OrderHistoryModule } from '@/components/admin/OrderHistoryModule';
import { SettingsModule } from '@/components/admin/SettingsModule';
import { setAudioMuted } from '@/lib/soundAlert';
import { Rider } from '@/types';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

type TabId = 'orders' | 'overview' | 'riders' | 'catalog' | 'history' | 'settings';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  { id: 'orders', label: 'Live Orders', icon: <ShoppingBag size={18} /> },
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'riders', label: 'Riders', icon: <Bike size={18} /> },
  { id: 'catalog', label: 'Catalog', icon: <Grid3X3 size={18} /> },
  { id: 'history', label: 'History', icon: <Clock size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

/* ------------------------------------------------------------------ */
/*  Inner Admin Dashboard                                              */
/* ------------------------------------------------------------------ */

const AdminDashboard: React.FC = () => {
  const { adminStatus, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  // Shared state
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);

  // Listen to riders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'riders'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Rider[];
      list.sort((a, b) => a.name.localeCompare(b.name));
      setRiders(list);
    });
    return () => unsub();
  }, []);

  // Listen to store status
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appConfig'), (snap) => {
      if (snap.exists()) {
        setStoreOpen(snap.data().isStoreOpen ?? true);
      }
    });
    return () => unsub();
  }, []);

  const onlineRidersCount = riders.filter((r) => r.status === 'online' && r.isActive).length;

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    setAudioMuted(newMuted);
  };

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const handleOrdersUpdate = useCallback((count: number) => {
    setActiveOrdersCount(count);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0">
              <Image src="/gozi-logo.png" alt="Gozi" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Gozi Admin</h1>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${storeOpen ? 'bg-emerald-500' : 'bg-red-500'}`}
                />
                <span className="text-[10px] text-gray-500 font-medium">
                  {storeOpen ? 'Store Open' : 'Store Closed'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span
                className={
                  activeTab === tab.id ? 'text-emerald-600' : 'text-gray-400'
                }
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.id === 'orders' && activeOrdersCount > 0 && (
                <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                  {activeOrdersCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              muted
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            Sound: {muted ? 'OFF' : 'ON'}
          </button>

          {/* User & Logout */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {adminStatus?.email}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">
                {adminStatus?.role}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {/* Top Bar (mobile) */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} className="text-gray-700" />
          </button>
          <h2 className="text-sm font-bold text-gray-900">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            {muted ? (
              <VolumeX size={18} className="text-red-500" />
            ) : (
              <Volume2 size={18} className="text-emerald-600" />
            )}
          </button>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
          {activeTab === 'overview' && (
            <OverviewModule
              activeOrdersCount={activeOrdersCount}
              onlineRidersCount={onlineRidersCount}
            />
          )}
          {activeTab === 'orders' && (
            <LiveOrdersModule
              onOrdersUpdate={handleOrdersUpdate}
              riders={riders}
            />
          )}
          {activeTab === 'riders' && (
            <RidersModule
              riders={riders}
              onRidersUpdate={() => {
                /* handled by live listener */
              }}
            />
          )}
          {activeTab === 'catalog' && <CatalogModule />}
          {activeTab === 'history' && <OrderHistoryModule />}
          {activeTab === 'settings' && <SettingsModule />}
        </div>
      </main>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Admin Page (Root Wrapper)                                          */
/* ------------------------------------------------------------------ */

const AdminPageInner: React.FC = () => {
  const { user, adminStatus, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !adminStatus?.authorized) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          /* Auth state change triggers re-render via context */
        }}
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
