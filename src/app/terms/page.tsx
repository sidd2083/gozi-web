import React from 'react';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata = {
  title: 'Terms & Conditions | Gozi Quick Commerce Hetauda',
  description: 'Terms of service and customer conditions for Gozi quick commerce delivery in Hetauda, Nepal.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              User Agreement
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-3">
              Terms & Conditions
            </h1>
            <p className="text-sm text-gray-500 mt-2">Effective Date: November 25, 2026 • Governing Law: Nepal</p>
          </div>

          <div className="prose prose-emerald max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              <p>
                By accessing, downloading, or placing an order through the <strong>Gozi Consumer App</strong> or web portal, you agree to comply with and be bound by these Terms and Conditions. These terms govern all quick-commerce retail transactions conducted by Gozi within Hetauda, Makwanpur, Nepal.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">2. Service Scope & Geographic Boundaries</h2>
              <p>
                Gozi provides 10–20 minute rapid delivery of groceries, snacks, cold drinks, beverages & smokes, late-night combos, and personal care products solely within serviceable zones of <strong>Hetauda, Makwanpur, Nepal</strong>. If an address falls outside our active delivery radius, the system will notify you before checkout.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">3. Account & Phone Verification</h2>
              <p>
                To place an order, customers must provide a valid 10-digit Nepali mobile number (`+977`, starting with `98` or `97`) and complete one-time password (OTP) verification. You are responsible for ensuring your account details and delivery pins are accurate.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">4. Pricing & Delivery Fees</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All prices are quoted in <strong>Nepalese Rupees (NPR / Rs.)</strong> inclusive of applicable local taxes.</li>
                <li>Delivery fees are shown clearly in the bill summary prior to order placement (currently set to <strong>Rs. 0 / Free Delivery Launch Offer</strong>).</li>
                <li>Gozi reserves the right to adjust delivery charges dynamically in response to severe weather or late-night operations.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">5. Payment Method (Cash on Delivery)</h2>
              <p>
                Orders are fulfilled via <strong>Cash on Delivery (COD)</strong>. Customers agree to pay the exact bill amount in cash to the delivery partner upon arrival at the doorstep.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">6. Age Restrictions (Beverages & Smokes)</h2>
              <p>
                Certain categories, including tobacco rolling papers and adult products, are restricted to individuals aged 18 years and older in accordance with the laws of Nepal. Gozi riders may request age verification prior to physical handover.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">7. Governing Law & Dispute Jurisdiction</h2>
              <p>
                These terms are governed by and construed in accordance with the prevailing laws of Nepal. Any disputes arising in connection with Gozi services shall be subject to the exclusive jurisdiction of the district courts of Makwanpur, Nepal.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
