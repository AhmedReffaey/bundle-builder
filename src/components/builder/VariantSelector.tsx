'use client';

import Image from 'next/image';
import type { ProductVariant } from '@/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  activeVariantId: string;
  onSelect: (variantId: string) => void;
  compact?: boolean;
}

export default function VariantSelector({ variants, activeVariantId, onSelect, compact }: VariantSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {variants.map((variant) => {
        const isActive = variant.id === activeVariantId;
        const isWhite = variant.color === '#FFFFFF';

        return (
          <button
            key={variant.id}
            onClick={() => onSelect(variant.id)}
            title={variant.label}
            className={[
              'flex items-center flex-shrink-0 transition-all cursor-pointer rounded-[7px] bg-white',
              compact ? 'h-[22px] px-1.5 gap-0.5' : 'h-[26px] px-2 gap-1',
              isActive
                ? 'border-[1.5px] border-brand-deep-purple'
                : 'border border-gray-200',
            ].join(' ')}
          >
            {variant.image ? (
              <span className={[
                'flex-shrink-0 overflow-hidden rounded-[3px] bg-gray-100 relative',
                compact ? 'w-3 h-3' : 'w-4 h-4',
              ].join(' ')}>
                <Image src={variant.image} alt={variant.label} fill className="object-contain" unoptimized />
              </span>
            ) : (
              <span
                className={[
                  'rounded-full flex-shrink-0 [background-color:var(--swatch-color)]',
                  compact ? 'w-[8px] h-[8px]' : 'w-[10px] h-[10px]',
                  isWhite ? 'border border-gray-300' : '',
                ].join(' ')}
                style={{ '--swatch-color': variant.color } as React.CSSProperties}
              />
            )}
            <span className={[
              'font-semibold leading-none',
              compact ? 'text-[9px]' : 'text-[10px]',
              isActive ? 'text-brand-deep-purple' : 'text-brand-dark',
            ].join(' ')}>
              {variant.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
