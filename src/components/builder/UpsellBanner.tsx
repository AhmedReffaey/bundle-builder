'use client';

interface UpsellBannerProps {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function UpsellBanner({ message, ctaLabel, onCta }: UpsellBannerProps) {
  return (
    <div role="alert" className={`flex items-center gap-3 rounded-[7px] border border-brand-purple/30 bg-purple-50 px-4 py-3 mb-4 ${ctaLabel ? 'justify-between' : ''}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <svg className="w-4 h-4 text-brand-purple flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-[12px] text-brand-deep-purple font-medium leading-snug">{message}</p>
      </div>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="flex-shrink-0 text-[11px] font-bold text-white bg-brand-purple px-3 py-1.5 rounded-[5px] hover:bg-brand-deep-purple transition-colors whitespace-nowrap"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
