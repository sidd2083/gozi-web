import React from 'react';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata = {
  title: 'Privacy Policy | Gozi Quick Commerce Hetauda',
  description: 'How Gozi collects, protects, and uses customer information for grocery and quick-commerce delivery in Hetauda, Nepal.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Legal & Transparency
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-3">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500 mt-2">Effective Date: November 25, 2026 • Location: Hetauda, Nepal</p>
          </div>

          <div className="prose prose-emerald max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
              <p>
                At <strong>Gozi</strong>, accessible via our consumer mobile application and web portal in Hetauda, Makwanpur, Nepal, your privacy is paramount. This Privacy Policy details the types of personal data we collect, how it is processed to complete your 10-minute grocery and essential drops, and the strict safeguards protecting your information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">2. Information We Collect</h2>
              <p>To fulfill orders quickly and accurately to your doorstep, we collect:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Identity & Contact Details:</strong> Full Name and Nepali mobile phone number (`+977`).</li>
                <li><strong>Doorstep Delivery Address & GPS Coordinates:</strong> Real-time latitude and longitude coordinates picked via map pin, house/flat numbers, street/tole names, and nearby landmarks in Hetauda.</li>
                <li><strong>Order History & Receipts:</strong> Items purchased, quantities, pricing totals in NPR (Rs.), payment mode (Cash on Delivery), and order status progression.</li>
                <li><strong>Device Information:</strong> Device model, OS version, and app push notification tokens (for dispatch notifications).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">3. How Your Information Is Used</h2>
              <p>We use customer data strictly for legitimate operational purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Processing, picking, bagging, and dispatching orders from the Hetauda dark store.</li>
                <li>Guiding assigned Gozi delivery riders to your doorstep via GPS mapping.</li>
                <li>Sending SMS OTP verification and real-time push notifications regarding order progress.</li>
                <li>Providing customer support regarding replacements, refunds, or delivery queries.</li>
              </ul>
              <p><strong>We never sell, rent, or trade your personal information</strong> to third-party advertisers or data brokers.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">4. Secure Data Storage & Infrastructure</h2>
              <p>
                All user profiles, delivery coordinates, and order records are securely hosted on <strong>Google Firebase (Cloud Firestore & Firebase Authentication)</strong> with enterprise-grade encryption in transit (HTTPS/TLS) and at rest. Access is strictly governed by authenticated security rules.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">5. Rider Access Boundaries</h2>
              <p>
                Gozi delivery riders are only granted access to your customer name, phone number, and delivery pin for the duration of an active order. Once marked `delivered`, contact details are hidden from the rider&apos;s active screen.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">6. Contact & Data Deletion Inquiries</h2>
              <p>
                To request an update or full deletion of your Gozi account and saved address records, email our data privacy team at:
              </p>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="font-bold text-gray-900">Gozi Privacy Officer</p>
                <p>Email: privacy@gozi.app / support@gozi.app</p>
                <p>Address: School Road, Ward 4, Hetauda, Makwanpur, Nepal</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
