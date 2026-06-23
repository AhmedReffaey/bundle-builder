import type { Step } from '@/types';

interface BundleSnapshot {
  selections: Array<{
    stepId: string;
    productId: string;
    quantity?: number;
    activeVariantId?: string;
    variants?: Array<{ id: string; quantity: number }>;
  }>;
}

export function encodeBundle(steps: Step[]): string {
  const snapshot: BundleSnapshot = { selections: [] };

  for (const step of steps) {
    for (const product of step.products) {
      const hasSelection = product.variants
        ? product.variants.some((v) => v.quantity > 0)
        : (product.quantity ?? 0) > 0;

      if (hasSelection) {
        snapshot.selections.push({
          stepId: step.id,
          productId: product.id,
          quantity: product.quantity,
          activeVariantId: product.activeVariantId,
          variants: product.variants?.map((v) => ({ id: v.id, quantity: v.quantity })),
        });
      }
    }
  }

  return btoa(JSON.stringify(snapshot));
}

export function decodeBundle(encoded: string): BundleSnapshot | null {
  try {
    return JSON.parse(atob(encoded)) as BundleSnapshot;
  } catch {
    return null;
  }
}

export function applySnapshot(steps: Step[], snapshot: BundleSnapshot): Step[] {
  if (!Array.isArray(snapshot?.selections)) return steps;
  return steps.map((step) => ({
    ...step,
    products: step.products.map((product) => {
      const sel = snapshot.selections.find(
        (s) => s.stepId === step.id && s.productId === product.id
      );
      if (!sel) return product;
      return {
        ...product,
        quantity: sel.quantity ?? product.quantity,
        activeVariantId: sel.activeVariantId ?? product.activeVariantId,
        variants: product.variants?.map((v) => {
          const sv = sel.variants?.find((sv) => sv.id === v.id);
          return sv ? { ...v, quantity: sv.quantity } : v;
        }),
      };
    }),
  }));
}
