'use client';

import type { ReviewItem } from '@/store/bundleStore';
import { useBundleStore } from '@/store/bundleStore';
import ProductImage from '@/components/ui/ProductImage';
import QuantityStepper from '@/components/builder/QuantityStepper';

interface ReviewLineItemProps {
  item: ReviewItem;
}

export default function ReviewLineItem({ item }: ReviewLineItemProps) {
  const { setVariantQuantity, setProductQuantity } = useBundleStore();

  const handleQtyChange = (value: number) => {
    if (item.variantId) {
      setVariantQuantity(item.productId, item.variantId, value);
    } else {
      setProductQuantity(item.productId, value);
    }
  };

  const isPlan = item.isMonthly === true;
  const suffix = isPlan ? '/mo' : '';

  /* Price column — shared by all variants */
  const renderPrice = () => {
    if (item.isFree) {
      return (
        <div className="text-right">
          {item.compareAtPrice != null && (
            <span className="block text-sm font-normal leading-4 tracking-[0.005em] text-right line-through text-compare-muted">
              ${item.compareAtPrice.toFixed(2)}{suffix}
            </span>
          )}
          <div className="font-bold text-sm text-brand-green">FREE</div>
        </div>
      );
    }
    return (
      <div className="text-right">
        {item.compareAtPrice != null && item.compareAtPrice > item.price && (
          <span className="block text-sm font-normal leading-4 tracking-[0.005em] text-right line-through text-compare-muted">
            ${item.compareAtPrice.toFixed(2)}{suffix}
          </span>
        )}
        <div className="font-bold text-sm text-brand-purple">
          ${item.price.toFixed(2)}{suffix}
        </div>
      </div>
    );
  };

  /* ── Plan item: image + "Cam [Unlimited]" + prices ── */
  if (isPlan) {
    const parts = item.name.split(' ');
    const prefix = parts[0];
    const tier = parts.slice(1).join(' ');

    return (
      <div className="flex items-center gap-2.5 py-1.5">
        <div className="relative flex-shrink-0 rounded-[3px] overflow-hidden bg-gray-50 w-8 h-8">
          <ProductImage src={item.image} alt={item.name} fill className="object-contain p-1" />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <span className="font-semibold text-[13px] text-brand-dark">
            {prefix}{' '}
            <span className="text-brand-purple font-bold">{tier}</span>
          </span>
        </div>
        {renderPrice()}
      </div>
    );
  }

  /* ── Regular item ── */
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="relative flex-shrink-0 rounded-[3px] overflow-hidden bg-gray-50 w-8 h-8">
        <ProductImage src={item.image} alt={item.name} fill className="object-contain p-0.5" />
      </div>
      <div className="flex-1 min-w-0 leading-tight">
        <span className="font-medium text-gray-800 text-xs">
          {item.name}
          {item.variantLabel && (
            <span className="text-gray-400 text-[11px]"> · {item.variantLabel}</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <QuantityStepper value={item.quantity} onChange={handleQtyChange} size="sm" min={item.required ? 1 : 0} />
        {renderPrice()}
      </div>
    </div>
  );
}
