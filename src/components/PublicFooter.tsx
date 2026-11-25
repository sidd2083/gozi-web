import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Lock } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-emerald-500/30">
                <Image
                  src="/gozi-logo.png"
                  alt="Gozi Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">gozi</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Hetauda&apos;s lightning-fast 10–20 minute delivery platform. Groceries, fresh snacks, cold drinks, beverages & smokes, late-night combos, and personal care right to your doorstep.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck size={14} />
              <span>100% Quality Inspected</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">About Gozi</Link>
              </li>
              <li>
                <a href="#categories" className="hover:text-emerald-400 transition-colors">What We Deliver</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Policies & Terms</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/refund-policy" className="hover:text-emerald-400 transition-colors">Refund & Cancellation Policy</Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Hetauda Store Hub</h4>
            <div className="flex items-start gap-3 text-sm text-gray-300">
              <MapPin size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>School Road, Ward 4, Hetauda, Makwanpur, Bagmati Province, Nepal</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Phone size={18} className="text-emerald-500 shrink-0" />
              <span>+977 9812345678 / +977 057-520000</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Mail size={18} className="text-emerald-500 shrink-0" />
              <span>support@gozi.app</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Clock size={18} className="text-emerald-500 shrink-0" />
              <span>Open Daily: 6:00 AM – 1:00 AM</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar with subtle Admin link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Gozi Quick Commerce. All rights reserved. Made for Hetauda, Nepal.</p>
          <div className="flex items-center gap-6">
            <span>Prices in NPR (Rs.) • Cash on Delivery</span>
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-emerald-400 transition-colors py-1 px-2.5 rounded-md hover:bg-gray-800"
            >
              <Lock size={12} />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
