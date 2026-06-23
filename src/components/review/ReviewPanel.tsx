'use client';

import { useId, useMemo, useState } from 'react';
import { useBundleStore } from '@/store/bundleStore';
import { computeReviewItems, computeTotal } from '@/lib/bundleCalculations';
import { analytics } from '@/lib/analytics';
import { encodeBundle } from '@/lib/bundleShare';
import ReviewLineItem from './ReviewLineItem';
import CheckoutModal from '@/components/checkout/CheckoutModal';
import SaveBundleModal from './SaveBundleModal';

const CATEGORY_ORDER = ['CAMERAS', 'SENSORS', 'ACCESSORIES', 'HOME MONITORING PLAN'];

export default function ReviewPanel() {
  const steps = useBundleStore((s) => s.steps);
  const saveSystem = useBundleStore((s) => s.saveSystem);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const items = useMemo(() => computeReviewItems(steps), [steps]);
  const { original, current, savings } = useMemo(() => computeTotal(items), [items]);

  const isEmpty = items.length === 0;

  const monthlyTotal = useMemo(
    () => items.filter((i) => i.isMonthly).reduce((s, i) => s + i.price, 0),
    [items]
  );
  const hardwareTotal = useMemo(
    () => items.filter((i) => !i.isMonthly).reduce((s, i) => s + i.price, 0),
    [items]
  );
  const asLowAs = !isEmpty ? monthlyTotal + hardwareTotal / 24 : null;

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.reduce<Record<string, typeof items>>((acc, cat) => {
        const catItems = items.filter((i) => i.category === cat);
        if (catItems.length > 0) acc[cat] = catItems;
        return acc;
      }, {}),
    [items]
  );

  const handleCheckout = () => {
    if (!isEmpty) {
      analytics.checkoutStarted(current, items.length);
      setIsCheckoutOpen(true);
    }
  };

  const handleSave = () => setIsSaveOpen(true);

  const handleShare = () => {
    const encoded = encodeBundle(steps);
    const url = `${window.location.origin}/?bundle=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      analytics.bundleShared();
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-review-border shadow-card bg-review-bg">

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-extrabold text-gray-900 leading-tight text-xl">
            Your security system
          </h2>
          <p className="text-gray-500 mt-1 leading-snug text-xs">
            Review your personalized protection system designed to keep what matters most safe.
          </p>
        </div>

        {/* Items */}
        <div className="px-5">
          {isEmpty ? (
            <div className="flex flex-col items-center py-8 text-center">
              <svg className="w-12 h-12 text-gray-200 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <p className="font-semibold text-gray-400 text-[13px]">Your bundle is empty</p>
              <p className="text-gray-300 mt-0.5 text-xs">Add products from the left to get started</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, catItems]) => (
              <div key={category} className="mb-3">
                <p className="font-bold tracking-[0.1em] text-gray-400 uppercase mb-1 text-[10px]">
                  {category === 'HOME MONITORING PLAN' ? 'PLAN' : category}
                </p>
                <div className="divide-y divide-gray-50">
                  {catItems.map((item) => (
                    <ReviewLineItem key={`${item.productId}-${item.variantId ?? 'base'}`} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Shipping */}
          <div className="flex items-center justify-between py-1.5 border-t border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0 rounded-[3px] w-8 h-8 bg-green-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <span className="font-medium text-gray-700 text-xs">Fast Shipping</span>
            </div>
            <div className="text-right">
              <div className="line-through text-xs text-gray-400">$5.99</div>
              <div className="font-bold text-xs text-brand-deep-purple">FREE</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-blue-100 bg-review-footer">
          {/* Seal + Pricing */}
          <div className="flex items-center justify-between gap-3">
            <GuaranteeSeal />
            <div className="flex flex-col items-end gap-1">
              {asLowAs !== null && (
                <span className="font-semibold text-white text-[10px] bg-brand-purple px-2 py-[3px] rounded-[3px] inline-block">
                  as low as ${asLowAs.toFixed(2)}/mo over 24 months
                </span>
              )}
              <div className="flex items-baseline gap-2">
                {savings > 0 && (
                  <span className="line-through text-[24px] font-normal leading-none tracking-[0.4px] text-compare-gray">
                    ${original.toFixed(2)}
                  </span>
                )}
                <span className="text-[24px] font-extrabold leading-none tracking-[0.4px] text-brand-deep-purple">
                  ${current.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {savings > 0 && (
            <p className="text-center font-semibold mt-3 mb-1 text-[12px] leading-none tracking-[-0.06px] text-brand-green">
              Congrats! You&apos;re saving ${savings.toFixed(2)} on your security bundle!
            </p>
          )}

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={isEmpty}
            className="w-full mt-3 py-3 text-white font-bold rounded-[3px] transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed text-[15px] bg-brand-indigo"
          >
            {isEmpty ? 'Build your bundle first' : 'Checkout'}
          </button>

          {/* Save link + toast */}
          <div className="flex items-center gap-3 mt-2 justify-center">
            <button
              onClick={handleSave}
              className="text-gray-900 underline transition-colors hover:text-gray-600 text-xs italic"
            >
              Save for later
            </button>
            <span className="text-gray-300 text-xs">·</span>
            <button
              onClick={handleShare}
              disabled={isEmpty}
              className="flex items-center gap-1 text-brand-purple hover:text-brand-deep-purple disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              {copied ? 'Copied!' : 'Share bundle'}
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={items}
        total={{ original, current, savings }}
      />
      <SaveBundleModal
        isOpen={isSaveOpen}
        onClose={() => setIsSaveOpen(false)}
        steps={steps}
      />
    </>
  );
}

function GuaranteeSeal() {
  const uid = useId();
  const textPathId = `${uid}-outerTextPath`;
  return (
    <div className="flex-shrink-0 w-[76px] h-[76px]">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id={textPathId} d="M 32 32 m -23 0 a 23 23 0 1 1 46 0 a 23 23 0 1 1 -46 0" />
        </defs>
        <path d="M 29.55,7.8 Q 32,5 34.45,7.8 Q 36.9,10.6 40.05,9 Q 43.2,7.4 44.45,11.1 Q 45.7,14.8 49.4,15 Q 53.1,15.2 52.5,18.9 Q 51.9,22.6 55.1,24.25 Q 58.3,25.9 56.15,28.95 Q 54,32 56.15,35 Q 58.3,38 55.1,39.7 Q 51.9,41.4 52.5,45.1 Q 53.1,48.8 49.4,49 Q 45.7,49.2 44.45,52.9 Q 43.2,56.6 40.05,55 Q 36.9,53.4 34.45,56.2 Q 32,59 29.55,56.2 Q 27.1,53.4 23.95,55 Q 20.8,56.6 19.55,52.9 Q 18.3,49.2 14.6,49 Q 10.9,48.8 11.5,45.1 Q 12.1,41.4 8.9,39.7 Q 5.7,38 7.85,35 Q 10,32 7.85,28.95 Q 5.7,25.9 8.9,24.25 Q 12.1,22.6 11.5,18.9 Q 10.9,15.2 14.6,15 Q 18.3,14.8 19.55,11.1 Q 20.8,7.4 23.95,9 Q 27.1,10.6 29.55,7.8 Z" fill="#6D28D9" />
        <circle cx="32" cy="32" r="19.5" fill="#4C1D95" />
        <text x="32" y="27" textAnchor="middle" fill="white" fontSize="12" fontWeight="800" fontFamily="system-ui, sans-serif" letterSpacing="-0.5">100%</text>
        <line x1="21" y1="29.5" x2="43" y2="29.5" stroke="white" strokeWidth="0.9" opacity="0.55" />
        <text x="32" y="36" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="system-ui, sans-serif">Wyze</text>
        <text x="32" y="42" textAnchor="middle" fill="#DDD6FE" fontSize="5.2" fontFamily="system-ui, sans-serif">satisfaction</text>
        <text x="32" y="47.5" textAnchor="middle" fill="#DDD6FE" fontSize="5.2" fontFamily="system-ui, sans-serif">guarantee</text>
        <text fill="white" fontSize="3.8" fontFamily="system-ui, sans-serif" opacity="0.75">
          <textPath href={`#${textPathId}`} startOffset="2%">
            ~ Try worry-free for 30 days ~ Try worry-free for 30 days ~
          </textPath>
        </text>
      </svg>
    </div>
  );
}
