import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Download } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-full overflow-hidden shadow-sm border border-emerald-100 group-hover:scale-105 transition-transform">
            <Image
              src="/gozi-logo.png"
              alt="Gozi Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1">
              gozi
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase -mt-1">
              Hetauda, Nepal
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors">
            Home
          </Link>
          <Link href="/about" className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors">
            About
          </Link>
          <Link href="/refund-policy" className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors">
            Refunds
          </Link>
          <Link href="/privacy-policy" className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors">
            Terms
          </Link>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <a
            href="#download-app"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm shadow-emerald-600/30 hover:shadow-md transition-all active:scale-95"
          >
            <Download size={16} />
            <span>Download App</span>
          </a>
        </div>
      </div>
    </header>
  );
};
