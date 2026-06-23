'use client';

import { useState, useMemo } from 'react';
import { useBundleStore } from '@/store/bundleStore';
import { computeReviewItems, computeTotal } from '@/lib/bundleCalculations';
import { analytics } from '@/lib/analytics';
import dynamic from 'next/dynamic';

const CheckoutModal = dynamic(() => import('@/components/checkout/CheckoutModal'));

export default function MobileCartBar() {
  const steps = useBundleStore((s) => s.steps);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const items = useMemo(() => computeReviewItems(steps), [steps]);
  const { original, current, savings } = useMemo(() => computeTotal(items), [items]);

  const isEmpty = items.length === 0;

  if (isEmpty) return null;

  const handleCheckout = () => {
    analytics.checkoutStarted(current, items.length);
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <div data-testid="mobile-cart-bar" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        {/* Pricing */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            {savings > 0 && (
              <span className="line-through text-gray-400 text-xs">${original.toFixed(2)}</span>
            )}
            <span className="font-extrabold text-brand-deep-purple text-lg leading-none">${current.toFixed(2)}</span>
          </div>
          {savings > 0 && (
            <span className="text-brand-green font-semibold text-[10px] leading-tight">
              You&apos;re saving ${savings.toFixed(2)}
            </span>
          )}
        </div>

        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          className="flex-shrink-0 h-[44px] px-6 bg-brand-indigo text-white font-bold rounded-[3px] text-[14px] hover:opacity-90 active:opacity-80 transition-opacity"
        >
          Checkout
        </button>
      </div>

      {/* Spacer so content isn't hidden behind the bar */}
      <div className="lg:hidden h-[72px]" aria-hidden="true" />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={items}
        total={{ original, current, savings }}
      />
    </>
  );
}
