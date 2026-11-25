import React from 'react';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata = {
  title: 'Refund & Cancellation Policy | Gozi Hetauda',
  description: 'Learn about order cancellations, refunds, and replacements for Gozi quick commerce in Hetauda, Nepal.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Customer Guarantee
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-3">
              Refund & Cancellation Policy
            </h1>
            <p className="text-sm text-gray-500 mt-2">Effective Date: November 25, 2026 • Location: Hetauda, Nepal</p>
          </div>

          <div className="prose prose-emerald max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">1. Overview</h2>
              <p>
                At <strong>Gozi</strong>, we are committed to delivering 100% fresh, hygienic, and intact groceries, snacks, cold drinks, and daily essentials across Hetauda within 10–20 minutes. If anything goes wrong with your order, this policy explains how replacements and refunds are handled promptly.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">2. Order Cancellation Rules</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Before Packing / Dispatch:</strong> You can request cancellation free of charge if the order status is currently in <code>placed</code> before our dark store team starts packing.
                </li>
                <li>
                  <strong>Once Dispatched (Out for Delivery):</strong> Due to our 10-minute instant delivery commitment and perishable nature of groceries, orders that have already been handed over to a rider (<code>handover</code>) cannot be cancelled midway.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">3. Damaged, Missing, or Expired Items</h2>
              <p>
                We inspect every product before it leaves our Hetauda dark store. However, if any of the following occur:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>An item arrived broken, torn, or leaked during transit.</li>
                <li>An item was missing from your delivery bag.</li>
                <li>A dairy or perishable item is past its expiration date or spoiled.</li>
                <li>An incorrect product variant was delivered.</li>
              </ul>
              <p>
                <strong>Immediate Resolution:</strong> Contact our Hetauda helpline at <strong>+977 9812345678</strong> within 2 hours of delivery. We will immediately arrange either a <strong>free replacement within 15 minutes</strong> or an immediate bill adjustment.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">4. Cash on Delivery (COD) Adjustments</h2>
              <p>
                Because Gozi operates primarily on Cash on Delivery, if you inspect an item upon arrival and reject it at your doorstep before payment, the delivery partner will immediately deduct that line item from your final bill, allowing you to pay only for the accepted items.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">5. Contact Support</h2>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="font-bold text-gray-900">Gozi Customer Resolutions Team</p>
                <p>Phone: +977 9812345678 / +977 057-520000</p>
                <p>Email: support@gozi.app</p>
                <p>Hours: Daily 6:00 AM – 1:00 AM Midnight</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
