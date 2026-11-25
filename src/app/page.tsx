import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Zap, 
  Clock, 
  MapPin, 
  ShoppingBag, 
  ShieldCheck, 
  Download, 
  ArrowRight,
  Flame,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export default function HomePage() {
  const departments = [
    {
      title: 'Grocery & Kitchen',
      desc: 'Rice, daal, pure mustard oil, chakki atta, spices & pantry staples.',
      badge: 'Daily Morning',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Snacks & Drinks',
      desc: 'Wai Wai noodles, Current 2X, Lay\'s, Dark Fantasy, and Dairy Milk.',
      badge: 'Quick Munch',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Beverages & Smokes',
      desc: 'Chilled Coke, Sprite, Red Bull cans, Ilam tea, rolls & accessories.',
      badge: 'Ice Cold Cans',
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Late Night Craving Combos',
      desc: 'Curated midnight packs: Gamer Combo, Movie Munch Set, & Party Packs.',
      badge: 'Curated Sets',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
    },
    {
      title: 'Beauty & Personal Care',
      desc: 'Nivea creams, Dettol handwash, Head & Shoulders, soaps & cleaners.',
      badge: 'Hygiene & Glow',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-white py-16 lg:py-24 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Location Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide">
                  <MapPin size={14} className="text-emerald-700" />
                  <span>Now Live in Hetauda, Makwanpur</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.12]">
                  Groceries & Daily Essentials delivered in{' '}
                  <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy decoration-2">
                    10–20 Minutes
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 max-w-2xl font-normal leading-relaxed">
                  From your morning milk and farm-fresh staples to late-night craving combos, cold soda cans, and snacks—Gozi delivers straight to your doorstep across Hetauda.
                </p>

                {/* Key Points */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm font-semibold text-gray-700 pt-2">
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                    <Zap size={15} className="text-emerald-600" />
                    <span>Free Delivery Launch Offer</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                    <Clock size={15} className="text-emerald-600" />
                    <span>Open till 1:00 AM Midnight</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                    <ShieldCheck size={15} className="text-emerald-600" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <a
                    href="#download-app"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all active:scale-95"
                  >
                    <Smartphone size={20} />
                    <span>Download Mobile App</span>
                  </a>
                  <a
                    href="#categories"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-base transition-colors"
                  >
                    <span>Browse What We Deliver</span>
                    <ArrowRight size={18} />
                  </a>
                </div>
              </div>

              {/* Right Visual Card */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 relative">
                  {/* Floating Delivery Tag */}
                  <div className="absolute -top-4 -right-4 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
                    <Zap size={14} className="fill-white" />
                    <span>10 MIN DELIVERY</span>
                  </div>

                  <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full overflow-hidden relative border border-emerald-100 shadow-sm">
                      <Image src="/gozi-logo.png" alt="Gozi" fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Hetauda Dark Store Hub</h3>
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                        Accepting & Dispatching Orders
                      </p>
                    </div>
                  </div>

                  {/* Highlights list */}
                  <div className="space-y-3 py-5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                      <div className="flex items-center gap-2.5 font-bold text-gray-800">
                        <ShoppingBag size={16} className="text-emerald-600" />
                        <span>Daily Staples & Groceries</span>
                      </div>
                      <span className="text-emerald-700 font-extrabold">In Stock</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                      <div className="flex items-center gap-2.5 font-bold text-gray-800">
                        <Flame size={16} className="text-orange-500" />
                        <span>Late-Night Craving Combos</span>
                      </div>
                      <span className="text-emerald-700 font-extrabold">Till 1 AM</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                      <div className="flex items-center gap-2.5 font-bold text-gray-800">
                        <Sparkles size={16} className="text-blue-500" />
                        <span>Chilled Sodas & Cold Drinks</span>
                      </div>
                      <span className="text-emerald-700 font-extrabold">Ice Cold</span>
                    </div>
                  </div>

                  <div className="pt-2 text-center text-xs text-gray-500 font-medium">
                    Order via Gozi mobile app for real-time live map rider tracking.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <section id="how-it-works" className="py-20 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                Simple & Lightning Fast
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                How Gozi Works in Hetauda
              </h2>
              <p className="text-gray-600 text-base">
                Get fresh groceries, cravings, and essentials delivered in 3 simple steps without leaving your home.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm relative space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/30">
                  1
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Pin Your Hetauda Location</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Open the Gozi App and auto-detect your GPS coordinates, or drag the map pin right to your doorstep or building gate.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm relative space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/30">
                  2
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Choose Essentials & Combos</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Browse authentic Nepali pantry staples, late-night instant noodle combos, chilled sodas, chocolates, and body care items.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm relative space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/30">
                  3
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Doorstep Drop & Pay Cash</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our fast local rider team picks, bags, and delivers to your doorstep in 10–20 minutes. Pay easily via Cash on Delivery (COD).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE DELIVER (CATEGORIES) */}
        <section id="categories" className="py-20 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                Product Catalog
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                What We Deliver Across Hetauda
              </h2>
              <p className="text-gray-600 text-base">
                Curated departments stocked directly in our local dark store for immediate dispatch.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {departments.map((dept, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl border border-gray-200 overflow-hidden bg-white hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    <Image
                      src={dept.image}
                      alt={dept.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                      {dept.badge}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {dept.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {dept.desc}
                      </p>
                    </div>
                    <div className="pt-2 flex items-center text-xs font-bold text-emerald-600 gap-1">
                      <span>Available on Gozi App</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DOWNLOAD APP SECTION */}
        <section id="download-app" className="py-20 bg-gradient-to-br from-emerald-900 via-gray-900 to-gray-950 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-800/60 px-4 py-1.5 rounded-full border border-emerald-600/40">
              Get Started Today
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto">
              Ready for 10-Minute Doorstep Delivery in Hetauda?
            </h2>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Install the Gozi consumer mobile app to enjoy live order tracking, instant cart steppers, zero delivery fee launch specials, and Cash on Delivery.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#download-app"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-base shadow-xl transition-all active:scale-95"
              >
                <Download size={20} />
                <span>Download for Android (.APK)</span>
              </a>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-base transition-colors"
              >
                <span>Learn More About Us</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
