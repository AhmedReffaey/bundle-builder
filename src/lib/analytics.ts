// Analytics event helpers.
// By default events go to window.gtag (Google Analytics 4).
// To switch to Mixpanel/Segment: replace the `push` calls below.
// Add your GA4 Measurement ID to .env.local: NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
// Then add <GoogleAnalytics id={process.env.NEXT_PUBLIC_GA_ID} /> in layout.tsx

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function push(eventName: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
  // Fallback: log in dev
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[analytics] ${eventName}`, params);
  }
}

export const analytics = {
  stepCompleted(stepId: string, stepNumber: number) {
    push('step_completed', { step_id: stepId, step_number: stepNumber });
  },

  productAdded(productId: string, productName: string, price: number, quantity: number) {
    push('add_to_cart', {
      currency: 'USD',
      value: price * quantity,
      items: [{ item_id: productId, item_name: productName, price, quantity }],
    });
  },

  productRemoved(productId: string, productName: string) {
    push('remove_from_cart', { item_id: productId, item_name: productName });
  },

  checkoutStarted(total: number, itemCount: number) {
    push('begin_checkout', { currency: 'USD', value: total, item_count: itemCount });
  },

  orderConfirmed(orderId: string, total: number) {
    push('purchase', { transaction_id: orderId, currency: 'USD', value: total });
  },

  bundleSaved(email: string) {
    push('bundle_saved', { email_domain: email.split('@')[1] ?? 'unknown' });
  },

  bundleShared() {
    push('bundle_shared', {});
  },

  bundleSaveFailed() {
    push('bundle_save_failed', {});
  },
};
