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
  Cloud,
  CheckCircle2
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

export const SettingsModule: React.FC = () => {
  // Store Settings
  const [formDeliveryFee, setFormDeliveryFee] = useState(30);
  const [formFreeAbove, setFormFreeAbove] = useState(500);
  const [formMinOrder, setFormMinOrder] = useState(99);
  const [formEta, setFormEta] = useState('10-15 mins');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Cloudinary Settings
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState('');
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);

  // Admin Access
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Listen to appConfig
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'appConfig'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppConfig;
        setFormDeliveryFee(data.deliveryFee ?? 30);
        setFormFreeAbove(data.freeDeliveryAbove ?? 500);
        setFormMinOrder(data.minOrderValue ?? 99);
        setFormEta(data.estimatedMinutesText || '10-15 mins');

        if (data.cloudinaryConfig) {
          setCloudinaryCloudName(data.cloudinaryConfig.cloudName || '');
          setCloudinaryUploadPreset(data.cloudinaryConfig.uploadPreset || '');
          setCloudinaryEnabled(!!data.cloudinaryConfig.enabled);
        }
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
        cloudinaryConfig: {
          cloudName: cloudinaryCloudName.trim(),
          uploadPreset: cloudinaryUploadPreset.trim(),
          enabled: cloudinaryEnabled,
        },
        updatedAt: new Date().toISOString(),
      });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
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
    const normalized = email.toLowerCase();
    if (normalized === 'raghurl.2072@gmail.com' || normalized === 'raghurl.202@gmail.com') {
      alert('Cannot remove primary permanent store owner.');
      return;
    }
    if (!confirm(`Remove admin access for ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'admins', normalized));
      setAdmins((prev) => prev.filter((a) => a.email.toLowerCase() !== normalized));
    } catch (e) {
      console.error('Error removing admin:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900">Store Settings & Access</h2>
        <p className="text-xs text-gray-500 mt-1">
          Hetauda store delivery pricing, Cloudinary/Storage switch & admin allowlist
        </p>
      </div>

      {/* Delivery & Order Settings */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-emerald-600" />
          <h3 className="text-sm font-black text-gray-900">Delivery & Store Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Delivery Fee (Rs.)
            </label>
            <input
              type="number"
              value={formDeliveryFee}
              onChange={(e) => setFormDeliveryFee(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Free Delivery Above (Rs.)
            </label>
            <input
              type="number"
              value={formFreeAbove}
              onChange={(e) => setFormFreeAbove(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">0 = Always charge fee</p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Minimum Order Value (Rs.)
            </label>
            <input
              type="number"
              value={formMinOrder}
              onChange={(e) => setFormMinOrder(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              Estimated Delivery Time
            </label>
            <input
              value={formEta}
              onChange={(e) => setFormEta(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="10-15 mins"
            />
          </div>
        </div>

        {/* Cloudinary Integration Box */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud size={16} className="text-blue-600" />
              <span className="text-xs font-black text-gray-900">Cloudinary Integration (Optional)</span>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={cloudinaryEnabled}
                onChange={(e) => setCloudinaryEnabled(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Enable Cloudinary</span>
            </label>
          </div>

          <p className="text-[11px] text-gray-500">
            When enabled, direct image uploads route through your Cloudinary account. If disabled, uploads use your built-in Firebase Storage bucket automatically with client-side compression.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Cloud Name</label>
              <input
                type="text"
                placeholder="e.g. gozi-cloud"
                value={cloudinaryCloudName}
                onChange={(e) => setCloudinaryCloudName(e.target.value)}
                className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Upload Preset (Unsigned)</label>
              <input
                type="text"
                placeholder="e.g. gozi_preset"
                value={cloudinaryUploadPreset}
                onChange={(e) => setCloudinaryUploadPreset(e.target.value)}
                className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {savingConfig ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save Configuration</span>
          </button>
          {configSaved && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-pulse">
              <CheckCircle2 size={14} />
              <span>Saved successfully</span>
            </span>
          )}
        </div>
      </div>

      {/* Admin Access Management */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-emerald-600" />
          <h3 className="text-sm font-black text-gray-900">Admin Allowlist Management</h3>
        </div>

        {/* Current admins */}
        <div className="space-y-2">
          {/* Permanent Owner Row */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <Crown size={16} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-black text-gray-900">raghurl.2072@gmail.com</p>
                <p className="text-[10px] text-emerald-800 uppercase font-black">
                  Primary Store Owner (Permanent & Irrevocable)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              OWNER
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <Crown size={16} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-black text-gray-900">raghurl.202@gmail.com</p>
                <p className="text-[10px] text-emerald-800 uppercase font-black">
                  Secondary Store Owner (Permanent & Irrevocable)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              OWNER
            </span>
          </div>

          {/* Dynamic admins */}
          {admins
            .filter(
              (a) =>
                a.email.toLowerCase() !== 'raghurl.2072@gmail.com' &&
                a.email.toLowerCase() !== 'raghurl.202@gmail.com'
            )
            .map((admin) => (
              <div
                key={admin.email}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{admin.email}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">
                      {admin.role || 'Admin'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveAdmin(admin.email)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                  title="Remove admin"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>

        {/* Add admin */}
        <div className="flex items-center gap-2">
          <input
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="add-new-manager@gmail.com"
            className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
          />
          <button
            onClick={handleAddAdmin}
            disabled={addingAdmin || !newAdminEmail.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            {addingAdmin ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            <span>Grant Access</span>
          </button>
        </div>
      </div>
    </div>
  );
};
