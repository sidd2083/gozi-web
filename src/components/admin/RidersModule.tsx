'use client';

import React, { useState } from 'react';
import {
  Bike,
  Plus,
  Edit2,
  Phone,
  Banknote,
  X,
} from 'lucide-react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Rider, CommissionType } from '@/types';

/* ------------------------------------------------------------------ */
/*  Rider Form Modal                                                   */
/* ------------------------------------------------------------------ */

interface RiderFormData {
  name: string;
  phone: string;
  vehicleNumber: string;
  commissionType: CommissionType;
  commissionRate: number;
  isActive: boolean;
}

const EMPTY_FORM: RiderFormData = {
  name: '',
  phone: '',
  vehicleNumber: '',
  commissionType: 'fixed',
  commissionRate: 30,
  isActive: true,
};

interface RiderModalProps {
  rider?: Rider | null;
  onClose: () => void;
  onSaved: () => void;
}

const RiderModal: React.FC<RiderModalProps> = ({ rider, onClose, onSaved }) => {
  const isEdit = !!rider;
  const [form, setForm] = useState<RiderFormData>(
    rider
      ? {
          name: rider.name,
          phone: rider.phone,
          vehicleNumber: rider.vehicleNumber,
          commissionType: rider.commissionType,
          commissionRate: rider.commissionRate,
          isActive: rider.isActive,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);

    const now = new Date().toISOString();
    try {
      if (isEdit && rider) {
        await updateDoc(doc(db, 'riders', rider.id), {
          name: form.name.trim(),
          phone: form.phone.trim(),
          vehicleNumber: form.vehicleNumber.trim(),
          commissionType: form.commissionType,
          commissionRate: Number(form.commissionRate),
          isActive: form.isActive,
          updatedAt: now,
        });
      } else {
        await addDoc(collection(db, 'riders'), {
          name: form.name.trim(),
          phone: form.phone.trim(),
          vehicleNumber: form.vehicleNumber.trim(),
          commissionType: form.commissionType,
          commissionRate: Number(form.commissionRate),
          isActive: form.isActive,
          status: 'offline',
          currentOrderId: null,
          todayDeliveries: 0,
          allTimeDeliveries: 0,
          unpaidCommission: 0,
          totalCommissionEarned: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error('Error saving rider:', e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Rider' : 'Add New Rider'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Rider name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="+977 98XXXXXXXX"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Vehicle Number</label>
            <input
              value={form.vehicleNumber}
              onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="BA 1234"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Commission Type</label>
              <select
                value={form.commissionType}
                onChange={(e) =>
                  setForm({ ...form, commissionType: e.target.value as CommissionType })
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="fixed">Fixed (Rs/order)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Rate</label>
              <input
                type="number"
                value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label className="text-sm text-gray-700">Active (can receive orders)</label>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.phone.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add Rider'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Payout Confirmation Modal                                          */
/* ------------------------------------------------------------------ */

interface PayoutModalProps {
  rider: Rider;
  onClose: () => void;
  onConfirm: () => void;
}

const PayoutModal: React.FC<PayoutModalProps> = ({ rider, onClose, onConfirm }) => {
  const [processing, setProcessing] = useState(false);

  const handlePayout = async () => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'riders', rider.id), {
        totalCommissionEarned: (rider.totalCommissionEarned || 0) + (rider.unpaidCommission || 0),
        unpaidCommission: 0,
        lastPayoutDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onConfirm();
      onClose();
    } catch (e) {
      console.error('Payout error:', e);
    }
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900">Settle Payout</h3>
        <p className="text-sm text-gray-600">
          Pay <strong>Rs. {rider.unpaidCommission || 0}</strong> to{' '}
          <strong>{rider.name}</strong> and reset their unpaid balance?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePayout}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Confirm Payout'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Riders Module                                                      */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  online: { label: 'Online', color: 'bg-emerald-100 text-emerald-700' },
  busy: { label: 'Busy', color: 'bg-amber-100 text-amber-700' },
  offline: { label: 'Offline', color: 'bg-gray-100 text-gray-500' },
};

interface RidersModuleProps {
  riders: Rider[];
  onRidersUpdate: () => void;
}

export const RidersModule: React.FC<RidersModuleProps> = ({ riders, onRidersUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [payoutRider, setPayoutRider] = useState<Rider | null>(null);

  const handleEdit = (rider: Rider) => {
    setEditingRider(rider);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingRider(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Riders Fleet</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {riders.length} riders · {riders.filter((r) => r.status === 'online').length} online
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
        >
          <Plus size={14} /> Add Rider
        </button>
      </div>

      {/* Rider Cards */}
      {riders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bike size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No riders yet</p>
          <p className="text-xs mt-1">Add your first delivery rider</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {riders.map((rider) => {
            const badge = STATUS_BADGE[rider.status] || STATUS_BADGE.offline;
            return (
              <div
                key={rider.id}
                className={`border rounded-2xl p-5 transition ${
                  rider.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {rider.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{rider.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {rider.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <button
                      onClick={() => handleEdit(rider)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <Edit2 size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-50 rounded-xl py-2">
                    <p className="font-bold text-gray-900">{rider.vehicleNumber || '-'}</p>
                    <p className="text-gray-400 mt-0.5">Vehicle</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2">
                    <p className="font-bold text-gray-900">{rider.todayDeliveries || 0}</p>
                    <p className="text-gray-400 mt-0.5">Today</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2">
                    <p className="font-bold text-gray-900">{rider.allTimeDeliveries || 0}</p>
                    <p className="text-gray-400 mt-0.5">All Time</p>
                  </div>
                </div>

                {/* Commission & Payout */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-gray-500">
                    Commission:{' '}
                    <strong className="text-gray-800">
                      {rider.commissionType === 'fixed'
                        ? `Rs. ${rider.commissionRate}/order`
                        : `${rider.commissionRate}%`}
                    </strong>
                  </div>
                  {(rider.unpaidCommission || 0) > 0 && (
                    <button
                      onClick={() => setPayoutRider(rider)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold hover:bg-emerald-100 transition"
                    >
                      <Banknote size={12} /> Pay Rs. {rider.unpaidCommission}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <RiderModal
          rider={editingRider}
          onClose={() => setShowModal(false)}
          onSaved={onRidersUpdate}
        />
      )}
      {payoutRider && (
        <PayoutModal
          rider={payoutRider}
          onClose={() => setPayoutRider(null)}
          onConfirm={onRidersUpdate}
        />
      )}
    </div>
  );
};
