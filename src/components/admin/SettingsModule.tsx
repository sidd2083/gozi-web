'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  UserPlus,
  Trash2,
  Shield,
  Crown,
  Loader2,
} from 'lucide-react';
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppConfig, AdminUser } from '@/types';
import { PRIMARY_OWNER_EMAIL } from '@/lib/adminAuth';

/* ------------------------------------------------------------------ */
/*  Settings Module                                                    */
/* ------------------------------------------------------------------ */

export const SettingsModule: React.FC = () => {
  // Store Settings
  const [_config, setConfig] = useState<AppConfig | null>(null);
  const [formDeliveryFee, setFormDeliveryFee] = useState(0);
  const [formFreeAbove, setFormFreeAbove] = useState(0);
  const [formMinOrder, setFormMinOrder] = useState(0);
  const [formEta, setFormEta] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Admin Access
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Listen to appConfig
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appConfig'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppConfig;
        setConfig(data);
        setFormDeliveryFee(data.deliveryFee || 0);
        setFormFreeAbove(data.freeDeliveryAbove || 0);
        setFormMinOrder(data.minOrderValue || 0);
        setFormEta(data.estimatedMinutesText || '');
      }
    });
    return () => unsub();
  }, []);

  // Fetch admins
  useEffect(() => {
    const fetchAdmins = async () => {
      const snap = await getDocs(collection(db, 'admins'));
      const list = snap.docs.map((d) => ({
        email: d.id,
        ...d.data(),
      })) as AdminUser[];
      setAdmins(list);
    };
    fetchAdmins();
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setConfigSaved(false);
    try {
      await updateDoc(doc(db, 'settings', 'appConfig'), {
        deliveryFee: Number(formDeliveryFee),
        freeDeliveryAbove: Number(formFreeAbove),
        minOrderValue: Number(formMinOrder),
        estimatedMinutesText: formEta.trim(),
        updatedAt: new Date().toISOString(),
      });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    } catch (e) {
      console.error('Error saving config:', e);
    }
    setSavingConfig(false);
  };

  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    setAddingAdmin(true);
    try {
      await setDoc(doc(db, 'admins', email), {
        email,
        role: 'admin',
        active: true,
        addedAt: new Date().toISOString(),
      });
      setAdmins((prev) => [
        ...prev,
        { email, role: 'admin', active: true, addedAt: new Date().toISOString() } as AdminUser,
      ]);
      setNewAdminEmail('');
    } catch (e) {
      console.error('Error adding admin:', e);
    }
    setAddingAdmin(false);
  };

  const handleRemoveAdmin = async (email: string) => {
    if (email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) return;
    if (!confirm(`Remove admin access for ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'admins', email));
      setAdmins((prev) => prev.filter((a) => a.email !== email));
    } catch (e) {
      console.error('Error removing admin:', e);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold text-gray-900">Store Settings</h2>

      {/* Delivery & Order Settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-gray-900">Delivery & Order Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Delivery Fee (Rs)
            </label>
            <input
              type="number"
              value={formDeliveryFee}
              onChange={(e) => setFormDeliveryFee(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Free Delivery Above (Rs)
            </label>
            <input
              type="number"
              value={formFreeAbove}
              onChange={(e) => setFormFreeAbove(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">Set to 0 to always charge delivery</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Minimum Order Value (Rs)
            </label>
            <input
              type="number"
              value={formMinOrder}
              onChange={(e) => setFormMinOrder(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Estimated Delivery Time
            </label>
            <input
              value={formEta}
              onChange={(e) => setFormEta(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="10-15 mins"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            {savingConfig ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Settings
          </button>
          {configSaved && (
            <span className="text-xs text-emerald-600 font-semibold">Saved successfully</span>
          )}
        </div>
      </div>

      {/* Admin Access Management */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-gray-900">Admin Access Management</h3>
        </div>

        {/* Current admins */}
        <div className="space-y-2">
          {admins.map((admin) => {
            const isOwner =
              admin.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase() ||
              admin.role === 'owner';
            return (
              <div
                key={admin.email}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOwner ? (
                    <Crown size={14} className="text-amber-500 shrink-0" />
                  ) : (
                    <Shield size={14} className="text-emerald-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {admin.email}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      {isOwner ? 'Owner (permanent)' : admin.role || 'Admin'}
                    </p>
                  </div>
                </div>
                {!isOwner && (
                  <button
                    onClick={() => handleRemoveAdmin(admin.email)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                    title="Remove admin"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add admin */}
        <div className="flex items-center gap-2">
          <input
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="new-admin@gmail.com"
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
          />
          <button
            onClick={handleAddAdmin}
            disabled={addingAdmin || !newAdminEmail.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            {addingAdmin ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserPlus size={14} />
            )}
            Add
          </button>
        </div>
        <p className="text-[10px] text-gray-400">
          Added admins can access the Gozi Admin Panel via Google Sign-In. Only the primary owner
          ({PRIMARY_OWNER_EMAIL}) has permanent, irrevocable access.
        </p>
      </div>
    </div>
  );
};
