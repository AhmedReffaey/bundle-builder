import type { Step, ReviewItem } from '@/types';

const CATEGORY_MAP: Record<string, string> = {
  cameras: 'CAMERAS',
  plan: 'HOME MONITORING PLAN',
  sensors: 'SENSORS',
  extras: 'ACCESSORIES',
};

export function computeReviewItems(steps: Step[]): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const step of steps) {
    const category = CATEGORY_MAP[step.id] ?? step.id.toUpperCase();

    for (const product of step.products) {
      if (product.variants) {
        for (const variant of product.variants) {
          if (variant.quantity > 0) {
            items.push({
              productId: product.id,
              variantId: variant.id,
              name: product.name,
              variantLabel: variant.label,
              image: product.image,
              compareAtPrice: product.compareAtPrice
                ? product.compareAtPrice * variant.quantity
                : undefined,
              price: product.price * variant.quantity,
              quantity: variant.quantity,
              category,
              isMonthly: step.id === 'plan',
            });
          }
        }
      } else {
        const qty = product.quantity ?? 0;
        if (qty > 0) {
          items.push({
            productId: product.id,
            name: product.name,
            image: product.image,
            compareAtPrice: product.compareAtPrice
              ? product.compareAtPrice * qty
              : undefined,
            price: product.price * qty,
            quantity: qty,
            category,
            isFree: product.price === 0,
            isMonthly: step.id === 'plan',
          });
        }
      }
    }
  }

  return items;
}

export function computeTotal(items: ReviewItem[]): {
  original: number;
  current: number;
  savings: number;
} {
  let original = 0;
  let current = 0;

  for (const item of items) {
    if (!item.isMonthly) {
      current += item.price;
      original += item.compareAtPrice ?? item.price;
    }
  }

  return { original, current, savings: original - current };
}
