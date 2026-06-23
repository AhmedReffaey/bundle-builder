'use client';

import { useId } from 'react';
import type { Product } from '@/types';
import { useBundleStore } from '@/store/bundleStore';
import ProductImage from '@/components/ui/ProductImage';
import QuantityStepper from './QuantityStepper';
import VariantSelector from './VariantSelector';

interface ProductCardProps {
  product: Product;
  stepId: string;
  priority?: boolean;
  vertical?: boolean;
}

export default function ProductCard({ product, stepId, priority, vertical }: ProductCardProps) {
  const { setVariantQuantity, setProductQuantity, setActiveVariant } = useBundleStore();

  const activeVariantId = product.activeVariantId ?? product.variants?.[0]?.id;
  const activeVariant = product.variants?.find((v) => v.id === activeVariantId);
  const currentQty = product.variants ? (activeVariant?.quantity ?? 0) : (product.quantity ?? 0);
  const totalQty = product.variants
    ? product.variants.reduce((s, v) => s + v.quantity, 0)
    : (product.quantity ?? 0);
  const isSelected = totalQty > 0;

  const handleQty = (value: number) => {
    if (product.variants && activeVariantId) {
      setVariantQuantity(product.id, activeVariantId, value);
    } else {
      setProductQuantity(product.id, value);
    }
  };

  return (
    <div
      className={[
        'flex overflow-hidden transition-all duration-150 bg-white rounded-[10px]',
        vertical ? 'flex-col h-full' : '',
        isSelected
          ? 'border-2 border-brand-purple shadow-card-selected'
          : 'border-[1.5px] border-gray-200 shadow-card-base',
      ].join(' ')}
    >
      {/* ── Image ── */}
      <div
        className={[
          'relative flex-shrink-0 bg-gray-50/50',
          vertical ? 'h-[148px]' : 'w-[100px]',
        ].join(' ')}
      >
        {product.badge && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-white font-bold text-[10px] bg-badge-dark px-[7px] py-[2px] rounded-[3px] inline-block leading-tight">
              {product.badge}
            </span>
          </div>
        )}
        <div className="absolute inset-0 p-3">
          <ProductImage
            src={activeVariant?.image ?? product.image}
            alt={product.name}
            fill
            className="object-contain"
            priority={priority}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col p-3 min-w-0 gap-1">
        <h3 className="font-bold text-gray-900 leading-tight text-sm">
          {product.name}
        </h3>

        {product.rating != null && (
          <div className="flex items-center gap-1">
            <StarRating rating={product.rating} />
            <span className="text-[10px] text-gray-400 leading-none">
              ({product.reviewCount?.toLocaleString()})
            </span>
          </div>
        )}

        {product.description && (
          <p className="text-gray-500 leading-snug text-[11px]">
            {product.description}{' '}
            {product.learnMoreUrl && (
              <a
                href={product.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline text-brand-purple"
              >
                Learn More
              </a>
            )}
          </p>
        )}

        {product.variants && product.variants.length > 0 && (
          <div className="mt-0.5 min-w-0 overflow-hidden">
            <VariantSelector
              variants={product.variants}
              activeVariantId={activeVariantId ?? ''}
              onSelect={(id) => setActiveVariant(product.id, id)}
              compact={vertical}
            />
          </div>
        )}

        {/* Stepper/Radio + Price */}
        <div className="flex items-end justify-between mt-auto pt-2">
          {stepId === 'plan' ? (
            <button
              role="radio"
              aria-checked={currentQty > 0}
              onClick={() => handleQty(currentQty > 0 ? 0 : 1)}
              className="flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 rounded-[3px] py-1"
            >
              <div
                className={[
                  'flex items-center justify-center rounded-[3px] transition-all w-[18px] h-[18px] bg-white',
                  currentQty > 0 ? 'border-[5px] border-brand-purple' : 'border-2 border-gray-300',
                ].join(' ')}
              />
              <span className="font-bold text-gray-800 text-xs">
                {currentQty > 0 ? 'Selected' : 'Select'}
              </span>
            </button>
          ) : (
            <QuantityStepper value={currentQty} onChange={handleQty} max={product.maxQty} />
          )}

          <div className="text-right">
            {product.compareAtPrice != null && (
              <div className="text-red-500 font-normal text-sm leading-5 tracking-[0.0025em] line-through mb-[2px]">
                ${product.compareAtPrice.toFixed(2)}
              </div>
            )}
            <div className={`font-bold leading-tight text-sm ${product.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {product.price === 0 ? 'FREE' : `$${product.price.toFixed(2)}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const uid = useId();
  return (
    <div className="flex items-center gap-[1px]" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        const gradId = `${uid}-half-${star}`;
        return (
          <svg key={star} className="w-[10px] h-[10px]" viewBox="0 0 24 24" aria-hidden="true">
            {half ? (
              <>
                <defs>
                  <linearGradient id={gradId}>
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#D1D5DB" />
                  </linearGradient>
                </defs>
                <path fill={`url(#${gradId})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </>
            ) : (
              <path fill={filled ? '#F59E0B' : '#D1D5DB'} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            )}
          </svg>
        );
      })}
    </div>
  );
}
