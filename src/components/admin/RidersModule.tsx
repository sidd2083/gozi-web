'use client';

import React, { useState, useEffect } from 'react';
import {
  Bike,
  Plus,
  Phone,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  User,
  MapPin,
  ExternalLink,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Rider, RiderStatus, CommissionType, RiderPayoutRecord, Order } from '@/types';
import { getNextRiderNumber } from '@/services/counterService';

interface RidersModuleProps {
  onOnlineCountChange?: (count: number) => void;
}

export const RidersModule: React.FC<RidersModuleProps> = ({ onOnlineCountChange }) => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [riderDeliveries, setRiderDeliveries] = useState<Order[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

  // Modals
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmountInput, setPayoutAmountInput] = useState<number>(0);
  const [payoutMethodInput, setPayoutMethodInput] = useState<'Cash' | 'eSewa' | 'Khalti' | 'Bank Transfer'>('Cash');
  const [payoutNoteInput, setPayoutNoteInput] = useState('');

  // Form Fields
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');
  const [loginIdInput, setLoginIdInput] = useState('');
  const [loginPinInput, setLoginPinInput] = useState('');
  const [commissionTypeInput, setCommissionTypeInput] = useState<CommissionType>('fixed');
  const [commissionRateInput, setCommissionRateInput] = useState<number>(35); // Default Rs. 35/order in Hetauda
  const [baseAllowanceInput, setBaseAllowanceInput] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'busy' | 'offline'>('all');
  const [showPin, setShowPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Subscribe to Riders collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'riders'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Rider[];
      list.sort((a, b) => (b.todayDeliveries || 0) - (a.todayDeliveries || 0));
      setRiders(list);

      const onlineCount = list.filter((r) => r.status === 'online' && r.isActive).length;
      if (onOnlineCountChange) onOnlineCountChange(onlineCount);
    });
    return () => unsub();
  }, [onOnlineCountChange]);

  // 2. Fetch Deliveries when a rider drawer is opened
  useEffect(() => {
    if (!selectedRider) return;

    const fetchDeliveries = async () => {
      try {
        setIsLoadingDeliveries(true);
        const q = query(
          collection(db, 'orders'),
          where('riderId', '==', selectedRider.id),
          where('status', '==', 'delivered'),
          limit(20)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
        list.sort((a, b) => new Date(b.deliveredAt || b.createdAt || 0).getTime() - new Date(a.deliveredAt || a.createdAt || 0).getTime());
        setRiderDeliveries(list);
        setIsLoadingDeliveries(false);
      } catch (err) {
        console.error('Error fetching rider deliveries:', err);
        setIsLoadingDeliveries(false);
      }
    };

    fetchDeliveries();
  }, [selectedRider]);

  // Open Add Rider Form
  const handleOpenAdd = () => {
    setEditingRider(null);
    setNameInput('');
    setPhoneInput('+977 98');
    setAddressInput('Hetauda, Makwanpur');
    setVehicleNumberInput('Na 45 Pa ');
    setLoginIdInput(`rider_${Math.floor(100 + Math.random() * 900)}`);
    setLoginPinInput('1234');
    setCommissionTypeInput('fixed');
    setCommissionRateInput(35);
    setBaseAllowanceInput(0);
    setShowRiderModal(true);
  };

  // Open Edit Rider Form
  const handleOpenEdit = (r: Rider) => {
    setEditingRider(r);
    setNameInput(r.name);
    setPhoneInput(r.phone);
    setAddressInput(r.address || 'Hetauda');
    setVehicleNumberInput(r.vehicleNumber || '');
    setLoginIdInput(r.loginId || '');
    setLoginPinInput(r.loginPin || '');
    setCommissionTypeInput(r.commissionType || 'fixed');
    setCommissionRateInput(r.commissionRate || 35);
    setBaseAllowanceInput(r.baseAllowance || 0);
    setShowRiderModal(true);
  };

  // Save / Update Rider
  const handleSaveRider = async () => {
    if (!nameInput.trim() || !phoneInput.trim()) return;

    try {
      setIsSaving(true);
      const now = new Date().toISOString();

      if (editingRider) {
        await updateDoc(doc(db, 'riders', editingRider.id), {
          name: nameInput.trim(),
          phone: phoneInput.trim(),
          address: addressInput.trim(),
          vehicleNumber: vehicleNumberInput.trim(),
          loginId: loginIdInput.trim(),
          loginPin: loginPinInput.trim(),
          commissionType: commissionTypeInput,
          commissionRate: Number(commissionRateInput),
          baseAllowance: Number(baseAllowanceInput),
          updatedAt: now,
        });
      } else {
        const nextRiderNum = await getNextRiderNumber();
        const newRef = doc(collection(db, 'riders'));
        const newRider: Rider = {
          id: newRef.id,
          riderNumber: nextRiderNum,
          name: nameInput.trim(),
          phone: phoneInput.trim(),
          address: addressInput.trim(),
          vehicleNumber: vehicleNumberInput.trim(),
          loginId: loginIdInput.trim() || `gozi_${nextRiderNum.toLowerCase()}`,
          loginPin: loginPinInput.trim() || '1234',
          commissionType: commissionTypeInput,
          commissionRate: Number(commissionRateInput),
          baseAllowance: Number(baseAllowanceInput),
          status: 'offline',
          isActive: true,
          currentOrderId: null,
          todayDeliveries: 0,
          todayEarnings: 0,
          totalDeliveries: 0,
          unpaidBalance: 0,
          totalEarnings: 0,
          payoutHistory: [],
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(newRef, newRider);
      }

      setShowRiderModal(false);
      setIsSaving(false);
    } catch (err) {
      console.error('Failed to save rider:', err);
      setIsSaving(false);
    }
  };

  // Fast Status Toggle (Online / Offline)
  const handleToggleRiderStatus = async (r: Rider) => {
    const nextStatus: RiderStatus = r.status === 'offline' ? 'online' : 'offline';
    await updateDoc(doc(db, 'riders', r.id), {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // Record Payout in Ledger
  const handleRecordPayout = async () => {
    if (!selectedRider || payoutAmountInput <= 0) return;

    try {
      setIsSaving(true);
      const now = new Date().toISOString();
      const payoutRecord: RiderPayoutRecord = {
        id: `PAY-${Date.now()}`,
        amount: Number(payoutAmountInput),
        paymentMethod: payoutMethodInput,
        note: payoutNoteInput.trim(),
        recordedBy: 'admin',
        createdAt: now,
      };

      const existingPayouts = selectedRider.payoutHistory || [];
      const newUnpaid = Math.max(0, (selectedRider.unpaidBalance || 0) - payoutAmountInput);

      await updateDoc(doc(db, 'riders', selectedRider.id), {
        unpaidBalance: newUnpaid,
        lastPayoutDate: now,
        payoutHistory: [payoutRecord, ...existingPayouts],
        updatedAt: now,
      });

      setSelectedRider((prev) =>
        prev
          ? {
              ...prev,
              unpaidBalance: newUnpaid,
              lastPayoutDate: now,
              payoutHistory: [payoutRecord, ...existingPayouts],
            }
          : null
      );

      setShowPayoutModal(false);
      setPayoutAmountInput(0);
      setPayoutNoteInput('');
      setIsSaving(false);
    } catch (err) {
      console.error('Failed to record payout:', err);
      setIsSaving(false);
    }
  };

  const filteredRiders = riders.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span>Delivery Riders & Fleet Ledger</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700">
              {riders.length} Fleet
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Rider login IDs/PINs for Rider App, live tracking, and commission settlement ledger
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Plus size={16} />
          <span>Add New Rider</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Fleet ({riders.length})
        </button>
        <button
          onClick={() => setStatusFilter('online')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            statusFilter === 'online' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border border-gray-200 hover:bg-emerald-50'
          }`}
        >
          <span>Online Ready</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded-full text-[10px]">
            {riders.filter((r) => r.status === 'online').length}
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('busy')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            statusFilter === 'busy' ? 'bg-amber-500 text-white' : 'bg-white text-amber-800 border border-gray-200 hover:bg-amber-50'
          }`}
        >
          <span>Busy on Delivery</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full text-[10px]">
            {riders.filter((r) => r.status === 'busy').length}
          </span>
        </button>
        <button
          onClick={() => setStatusFilter('offline')}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            statusFilter === 'offline' ? 'bg-gray-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Offline ({riders.filter((r) => r.status === 'offline').length})
        </button>
      </div>

      {/* Riders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRiders.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-3xl border border-gray-200 text-center text-gray-400 text-xs">
            No riders registered matching this filter.
          </div>
        ) : (
          filteredRiders.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-purple-50 text-purple-800 px-2 py-0.5 rounded-lg border border-purple-200">
                      {r.riderNumber || 'RIDER-??'}
                    </span>
                    <h3 className="font-black text-gray-900 text-base">{r.name}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      r.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.status === 'busy'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Phone size={13} className="text-gray-400" />
                    <a href={`tel:${r.phone}`} className="text-emerald-700 font-bold hover:underline">
                      {r.phone}
                    </a>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-gray-500">
                    <Bike size={13} className="text-gray-400" />
                    <span>{r.vehicleNumber || 'No bike added'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-gray-500">
                    <MapPin size={13} className="text-gray-400" />
                    <span>{r.address || 'Hetauda, Nepal'}</span>
                  </p>
                </div>
              </div>

              {/* Performance Cards */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl text-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Today</span>
                  <p className="text-sm font-black text-gray-900 mt-0.5">{r.todayDeliveries || 0} orders</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Lifetime</span>
                  <p className="text-sm font-black text-gray-900 mt-0.5">{r.totalDeliveries || 0} orders</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Unpaid</span>
                  <p className="text-sm font-black text-amber-800 mt-0.5">Rs. {r.unpaidBalance || 0}</p>
                </div>
              </div>

              {/* Rider App Credentials Badge */}
              <div className="bg-purple-50/70 border border-purple-100 p-2.5 rounded-xl text-[11px] flex items-center justify-between">
                <div>
                  <span className="text-purple-600 font-bold">Rider App ID:</span>{' '}
                  <code className="font-bold text-purple-950">{r.loginId}</code>
                </div>
                <div>
                  <span className="text-purple-600 font-bold">PIN:</span>{' '}
                  <code className="font-bold text-purple-950">{r.loginPin || '1234'}</code>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <button
                  onClick={() => handleToggleRiderStatus(r)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    r.status === 'offline'
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {r.status === 'offline' ? 'Set Online' : 'Set Offline'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(r)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
                    title="Edit Rider"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => setSelectedRider(r)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm"
                  >
                    <span>Ledger</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIDER PROFILE & PAYOUT SETTLEMENT DRAWER                      */}
      {/* ------------------------------------------------------------- */}
      {selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-purple-700">{selectedRider.riderNumber}</span>
                <h3 className="text-xl font-black text-gray-900">{selectedRider.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vehicle: {selectedRider.vehicleNumber} • Phone: {selectedRider.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedRider(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Financial Ledger Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/80 border border-purple-200/80 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase">Current Unpaid Balance</span>
                <p className="text-2xl font-black text-purple-950 mt-1">Rs. {selectedRider.unpaidBalance || 0}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase">Lifetime Total Earned</span>
                <p className="text-2xl font-black text-gray-900 mt-1">Rs. {selectedRider.totalEarnings || 0}</p>
              </div>

              <div className="flex items-center sm:justify-end">
                <button
                  onClick={() => {
                    setPayoutAmountInput(selectedRider.unpaidBalance || 0);
                    setShowPayoutModal(true);
                  }}
                  disabled={!selectedRider.unpaidBalance || selectedRider.unpaidBalance <= 0}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Record Payout
                </button>
              </div>
            </div>

            {/* Payout History Ledger */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Payout Settlements</h4>
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Date</th>
                      <th className="py-2.5 px-3 text-left">Payment Method</th>
                      <th className="py-2.5 px-3 text-left">Note</th>
                      <th className="py-2.5 px-3 text-right">Amount Settled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedRider.payoutHistory || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400">
                          No previous payout records.
                        </td>
                      </tr>
                    ) : (
                      (selectedRider.payoutHistory || []).map((pay, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-3 text-gray-600">
                            {new Date(pay.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{pay.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-gray-500">{pay.note || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700">Rs. {pay.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Recent Delivered Orders
                </h4>
                {isLoadingDeliveries && <span className="text-xs text-gray-400">Loading history...</span>}
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Order #</th>
                      <th className="py-2.5 px-3 text-left">Customer</th>
                      <th className="py-2.5 px-3 text-left">Location</th>
                      <th className="py-2.5 px-3 text-right">Bill Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {riderDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400">
                          No deliveries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      riderDeliveries.map((ord, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{ord.orderNumber}</td>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{ord.customerName}</td>
                          <td className="py-2.5 px-3 text-gray-500 truncate max-w-xs">
                            {ord.deliveryAddress?.fullAddress}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            Rs. {ord.bill?.grandTotal || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedRider(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RECORD PAYOUT MODAL                                           */}
      {/* ------------------------------------------------------------- */}
      {showPayoutModal && selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900">
              Record Payout for {selectedRider.name}
            </h3>
            <p className="text-xs text-gray-500">
              Current Unpaid Due: <strong className="text-emerald-700">Rs. {selectedRider.unpaidBalance || 0}</strong>
            </p>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Amount to Settle (Rs.) *</label>
              <input
                type="number"
                value={payoutAmountInput}
                onChange={(e) => setPayoutAmountInput(Number(e.target.value))}
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Payment Method</label>
              <select
                value={payoutMethodInput}
                onChange={(e: any) => setPayoutMethodInput(e.target.value)}
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Cash">Cash (Physical Handover)</option>
                <option value="eSewa">eSewa Mobile Wallet</option>
                <option value="Khalti">Khalti Mobile Wallet</option>
                <option value="Bank Transfer">Bank Transfer (Hetauda Branch)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase">Audit Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Cleared week 46 cash deliveries"
                value={payoutNoteInput}
                onChange={(e) => setPayoutNoteInput(e.target.value)}
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayout}
                disabled={isSaving || payoutAmountInput <= 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT RIDER MODAL                                        */}
      {/* ------------------------------------------------------------- */}
      {showRiderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-gray-900 border-b pb-3">
              {editingRider ? `Edit ${editingRider.riderNumber}` : 'Register New Fleet Rider'}
            </h3>

            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Rider Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Shrestha"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Nepali Phone Number *</label>
                <input
                  type="text"
                  placeholder="+977 98XXXXXXXX"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Address & Bike */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Address / Ward</label>
                <input
                  type="text"
                  placeholder="e.g. Hetauda-4, School Road"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 uppercase">Bike / Vehicle Number</label>
                <input
                  type="text"
                  placeholder="e.g. Na 45 Pa 6789"
                  value={vehicleNumberInput}
                  onChange={(e) => setVehicleNumberInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Rider App Login Credentials */}
            <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                Rider App Login Credentials (Used in Rider App)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-purple-700 uppercase">Login ID / Username *</label>
                  <input
                    type="text"
                    value={loginIdInput}
                    onChange={(e) => setLoginIdInput(e.target.value)}
                    className="w-full mt-1 p-2 bg-white border border-purple-200 rounded-xl text-xs font-black text-purple-950 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-purple-700 uppercase">PIN / Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-[10px] text-purple-600 font-bold"
                    >
                      {showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={loginPinInput}
                    onChange={(e) => setLoginPinInput(e.target.value)}
                    className="w-full mt-1 p-2 bg-white border border-purple-200 rounded-xl text-xs font-black text-purple-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payout & Commission Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Commission Type</label>
                <select
                  value={commissionTypeInput}
                  onChange={(e: any) => setCommissionTypeInput(e.target.value)}
                  className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="fixed">Fixed Rs. per order</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  Payout Rate ({commissionTypeInput === 'fixed' ? 'Rs.' : '%'})
                </label>
                <input
                  type="number"
                  value={commissionRateInput}
                  onChange={(e) => setCommissionRateInput(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowRiderModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRider}
                disabled={isSaving || !nameInput.trim()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Rider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
