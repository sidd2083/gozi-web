import React from 'react';
import { Clock, ShieldCheck, Zap, HeartHandshake } from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata = {
  title: 'About Gozi | Fast 10-Minute Delivery in Hetauda, Nepal',
  description: 'Learn about Gozi, Hetauda\'s leading quick-commerce delivery platform for groceries, snacks, cold drinks, and essentials.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Our Story
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              About Gozi
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Transforming everyday retail and grocery shopping for families, students, and businesses in Hetauda, Makwanpur, Nepal.
            </p>
          </div>

          {/* Mission Card */}
          <div className="p-8 rounded-3xl bg-emerald-50/60 border border-emerald-100 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <Zap className="text-emerald-600" />
              <span>Who We Are</span>
            </h2>
            <p className="text-gray-700 leading-relaxed text-base">
              Gozi is a hyperlocal dark-store quick-commerce delivery platform built specifically for the community of <strong>Hetauda, Makwanpur, Nepal</strong>. We eliminate the frustration of stepping out in hot weather, rain, or late nights just to pick up everyday groceries, pantry staples, sodas, and munchies.
            </p>
            <p className="text-gray-700 leading-relaxed text-base">
              By managing centrally located dark store hubs with high-frequency stock and an electric local rider fleet, Gozi packs and drops orders directly to customer doorsteps in <strong>10 to 20 minutes</strong>.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Clock size={20} />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Extreme Speed</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Packers bag your order within 2 minutes of checkout, and riders deliver within 10–20 minutes.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-lg text-gray-900">100% Inspected</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                All daily staples, dairy, eggs, and packaged products undergo strict freshness and hygiene inspections.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <HeartHandshake size={20} />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Local Commitment</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Built by and for Hetauda. We empower local delivery partners with fair, transparent commissions.
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-200 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Hetauda Operating Hours & Contacts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700">
              <div className="space-y-1">
                <span className="font-bold text-gray-900 block">Hub Location</span>
                <span>School Road, Ward 4, Hetauda, Makwanpur, Bagmati Province, Nepal</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-gray-900 block">Operating Hours</span>
                <span>Daily from 6:00 AM to 1:00 AM Midnight</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-gray-900 block">Customer Care Hotline</span>
                <span>+977 9812345678 / +977 057-520000</span>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-gray-900 block">Email Support</span>
                <span>support@gozi.app</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
