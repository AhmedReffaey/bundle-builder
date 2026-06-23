'use client';

import { useEffect } from 'react';
import { useBundleStore } from '@/store/bundleStore';

export default function HubToast() {
  const showHubToast = useBundleStore((s) => s.showHubToast);
  const dismissHubToast = useBundleStore((s) => s.dismissHubToast);

  useEffect(() => {
    if (!showHubToast) return;
    const id = setTimeout(dismissHubToast, 3500);
    return () => clearTimeout(id);
  }, [showHubToast, dismissHubToast]);

  if (!showHubToast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-gray-900 text-white text-[13px] font-medium px-4 py-2.5 rounded-[7px] shadow-lg animate-modal-slide-up whitespace-nowrap"
    >
      <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      Sense Hub added — required for all sensors
    </div>
  );
}
