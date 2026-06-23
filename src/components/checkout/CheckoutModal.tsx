'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReviewItem } from '@/store/bundleStore';
import { useBundleStore } from '@/store/bundleStore';
import { analytics } from '@/lib/analytics';
import ProductImage from '@/components/ui/ProductImage';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReviewItem[];
  total: { original: number; current: number; savings: number };
}

type Phase = 'summary' | 'success';

export default function CheckoutModal({ isOpen, onClose, items, total }: CheckoutModalProps) {
  const [phase, setPhase] = useState<Phase>('summary');
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const trackOrderConfirmed = useBundleStore((s) => s.trackOrderConfirmed);

  const handleClose = useCallback(() => {
    abortControllerRef.current?.abort();
    setPhase('summary');
    setOrderNumber('');
    returnFocusRef.current?.focus();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement;
    } else {
      returnFocusRef.current?.focus();
    }
  }, [isOpen]);

  const getFocusable = useCallback(() => {
    if (!modalRef.current) return [];
    return Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => getFocusable()[0]?.focus(), 30);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'Tab') {
        const els = getFocusable();
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => { clearTimeout(id); document.removeEventListener('keydown', handler); };
  }, [isOpen, handleClose, phase, getFocusable]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const oneTimeItems = items.filter((i) => !i.isMonthly);
  const monthlyItems = items.filter((i) => i.isMonthly);

  const makeOrderId = () => {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const buf = new Uint8Array(6);
    crypto.getRandomValues(buf);
    return `WY-${Array.from(buf, (b) => charset[b % charset.length]).join('')}`;
  };

  const handlePlaceOrder = async () => {
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total: total.current }),
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.mode === 'stripe' && data.url) {
        window.location.href = data.url;
        return;
      }

      // mock / dev mode — show in-app success
      const orderId = makeOrderId();
      setOrderNumber(orderId);
      setPhase('success');
      trackOrderConfirmed(orderId); // fires analytics.orderConfirmed internally
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      analytics.checkoutFailed();
      setErrorMsg('Checkout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/[0.55] backdrop-blur"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        className={[
          'bg-white w-full sm:max-w-[440px] flex flex-col max-h-[92vh] shadow-modal animate-modal-slide-up',
          phase === 'success' ? 'rounded-[3px]' : 'rounded-t-[3px]',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === 'summary' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 id="checkout-modal-title" className="font-extrabold text-gray-900 text-[19px]">
                  Order Summary
                </h2>
                <p className="text-gray-400 mt-0.5 text-xs">
                  Review before placing your order
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="flex items-center justify-center rounded-[3px] hover:bg-gray-100 transition-colors flex-shrink-0 w-8 h-8"
              >
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items (scrollable) */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {oneTimeItems.length > 0 && (
                <div className="mb-4">
                  <p className="font-bold tracking-widest text-gray-400 uppercase mb-2 text-[10px]">
                    One-Time Purchase
                  </p>
                  {oneTimeItems.map((item) => (
                    <ModalLineItem key={`${item.productId}-${item.variantId ?? 'base'}`} item={item} />
                  ))}
                </div>
              )}

              {monthlyItems.length > 0 && (
                <div className="mb-4">
                  <p className="font-bold tracking-widest text-gray-400 uppercase mb-2 text-[10px]">
                    Monthly Plan
                  </p>
                  {monthlyItems.map((item) => (
                    <ModalLineItem key={`${item.productId}-${item.variantId ?? 'base'}`} item={item} isMonthly />
                  ))}
                </div>
              )}

              {/* Shipping */}
              <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                <span className="text-gray-600 text-[13px]">Shipping</span>
                <div className="flex items-center gap-1.5">
                  <span className="line-through text-gray-400 text-xs">$5.99</span>
                  <span className="font-bold text-green-600 text-[13px]">FREE</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <span className="font-bold text-gray-900 text-[15px]">Total</span>
                <div className="text-right">
                  {total.savings > 0 && (
                    <div className="line-through text-gray-400 text-xs">
                      ${total.original.toFixed(2)}
                    </div>
                  )}
                  <span className="font-extrabold text-gray-900 text-2xl leading-none">
                    ${total.current.toFixed(2)}
                  </span>
                </div>
              </div>

              {total.savings > 0 && (
                <p className="text-center font-semibold -mt-1 pb-1 text-xs text-brand-green">
                  You&apos;re saving ${total.savings.toFixed(2)} on this order!
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-gray-100 flex-shrink-0">
              {errorMsg && (
                <p className="text-red-500 text-xs text-center mb-3">{errorMsg}</p>
              )}
              <button
                onClick={handlePlaceOrder}
                disabled={isLoading}
                className="w-full py-3.5 text-white font-bold rounded-[3px] transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 text-[15px] bg-brand-indigo flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Processing…
                  </>
                ) : 'Place Order'}
              </button>
              <button
                onClick={handleClose}
                className="w-full mt-2.5 text-gray-400 hover:text-gray-600 transition-colors text-[13px]"
              >
                Continue editing
              </button>
            </div>
          </>
        ) : (
          <SuccessPhase orderNumber={orderNumber} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

function ModalLineItem({ item, isMonthly = false }: { item: ReviewItem; isMonthly?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="relative flex-shrink-0 rounded-[3px] overflow-hidden bg-gray-50 w-11 h-11">
        <ProductImage src={item.image} alt={item.name} fill className="object-contain p-1" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 leading-tight truncate text-[13px]">
          {item.name}
          {item.variantLabel && (
            <span className="font-normal text-gray-400"> · {item.variantLabel}</span>
          )}
        </p>
        <p className="text-gray-400 text-[11px]">Qty: {item.quantity}</p>
      </div>
      <div className="text-right flex-shrink-0">
        {item.compareAtPrice != null && item.compareAtPrice > item.price && (
          <p className="line-through text-gray-400 text-[11px]">
            ${item.compareAtPrice.toFixed(2)}{isMonthly ? '/mo' : ''}
          </p>
        )}
        <p className="font-bold text-gray-900 text-[13px]">
          ${item.price.toFixed(2)}{isMonthly ? '/mo' : ''}
        </p>
      </div>
    </div>
  );
}

function SuccessPhase({ orderNumber, onClose }: { orderNumber: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-10 rounded-[3px]">
      {/* Animated checkmark */}
      <div className="relative flex items-center justify-center mb-6 animate-scale-in">
        <div className="absolute rounded-[3px] w-24 h-24 bg-green-100 animate-ping-once" />
        <div className="relative flex items-center justify-center rounded-[3px] w-20 h-20 bg-green-100">
          <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
            <path
              d="M8 18l7 7 13-14"
              stroke="#16A34A"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-check-draw"
            />
          </svg>
        </div>
      </div>

      <h2 id="checkout-modal-title" className="font-extrabold text-gray-900 mb-1 text-[22px]">
        Order Confirmed!
      </h2>
      <p className="text-gray-500 mb-3 text-sm">
        Your security system is on its way.
      </p>

      <div className="font-bold mb-6 text-[13px] text-brand-purple bg-purple-50 px-[14px] py-[5px] rounded-[3px]">
        {orderNumber}
      </div>

      <p className="text-gray-400 leading-relaxed mb-8 text-[13px]">
        You&apos;ll receive a confirmation email with tracking details within 24 hours.
      </p>

      <button
        onClick={onClose}
        className="w-full py-3.5 text-white font-bold rounded-[3px] transition-opacity hover:opacity-90 text-[15px] bg-brand-indigo"
      >
        Done
      </button>
    </div>
  );
}
