import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Step, Product, ReviewItem } from '@/types';
import { computeReviewItems, computeTotal } from '@/lib/bundleCalculations';
import { analytics } from '@/lib/analytics';
import { decodeBundle, applySnapshot } from '@/lib/bundleShare';
import bundleData from '@/data/products.json';

interface StepState {
  steps: Step[];
  activeStep: number;
  savedAt?: number;
}

interface BundleStore extends StepState {
  setActiveStep: (step: number) => void;
  setVariantQuantity: (productId: string, variantId: string, quantity: number) => void;
  setProductQuantity: (productId: string, quantity: number) => void;
  setActiveVariant: (productId: string, variantId: string) => void;
  getTotalSelectedCount: (stepId: string) => number;
  getReviewItems: () => ReviewItem[];
  getTotal: () => { original: number; current: number; savings: number };
  saveSystem: () => void;
  trackOrderConfirmed: (orderId: string) => void;
  showHubToast: boolean;
  dismissHubToast: () => void;
}

export type { ReviewItem };

function getInitialSteps(): Step[] {
  const base = bundleData.steps as Step[];
  if (typeof window === 'undefined') return base;
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('bundle');
  if (!encoded) return base;
  const snapshot = decodeBundle(encoded);
  if (!snapshot) return base;
  // Clear the ?bundle= param from the URL without a navigation
  const url = new URL(window.location.href);
  url.searchParams.delete('bundle');
  window.history.replaceState(null, '', url.toString());
  return applySnapshot(base, snapshot);
}

const initialSteps = getInitialSteps();

export const useBundleStore = create<BundleStore>()(
  persist(
    (set, get) => ({
      steps: initialSteps,
      activeStep: 1,
      showHubToast: false,
      dismissHubToast: () => set({ showHubToast: false }),

      setActiveStep: (step) => {
        const prev = get().activeStep;
        set({ activeStep: step });
        if (step > prev) {
          const completedStep = get().steps.find((s) => s.step === prev);
          if (completedStep) analytics.stepCompleted(completedStep.id, prev);
        }
      },

      setVariantQuantity: (productId, variantId, quantity) => {
        const prevQty = (() => {
          const product = get().steps.flatMap((s) => s.products).find((p) => p.id === productId);
          return product?.variants?.find((v) => v.id === variantId)?.quantity ?? 0;
        })();
        set((state) => ({
          steps: state.steps.map((step) => ({
            ...step,
            products: step.products.map((product) => {
              if (product.id !== productId) return product;
              return {
                ...product,
                variants: product.variants?.map((v) =>
                  v.id === variantId ? { ...v, quantity: Math.max(0, quantity) } : v
                ),
              };
            }),
          })),
        }));
        const newQty = Math.max(0, quantity);
        if (newQty > prevQty) {
          const product = get().steps.flatMap((s) => s.products).find((p) => p.id === productId);
          if (product) analytics.productAdded(productId, product.name, product.price, newQty - prevQty);
        } else if (newQty === 0 && prevQty > 0) {
          const product = get().steps.flatMap((s) => s.products).find((p) => p.id === productId);
          if (product) analytics.productRemoved(productId, product.name);
        }
      },

      setProductQuantity: (productId, quantity) => {
        const prevProduct = get().steps.flatMap((s) => s.products).find((p) => p.id === productId);
        const prevQty = prevProduct?.quantity ?? 0;

        // Capture the currently-selected plan before the exclusive-selection wipes it
        const prevSelectedPlan = (() => {
          const planStep = get().steps.find((s) => s.id === 'plan');
          if (!planStep) return null;
          const isTargetInPlan = planStep.products.some((p) => p.id === productId);
          if (!isTargetInPlan) return null;
          return planStep.products.find((p) => p.id !== productId && (p.quantity ?? 0) > 0) ?? null;
        })();

        set((state) => {
          const isPlanStepProduct = state.steps.some(
            (step) => step.id === 'plan' && step.products.some((p) => p.id === productId)
          );
          const isSensorStepProduct = state.steps.some(
            (step) => step.id === 'sensors' && step.products.some((p) => p.id === productId)
          );

          const updatedSteps = state.steps.map((step) => {
            if (step.id === 'plan' && isPlanStepProduct) {
              return {
                ...step,
                products: step.products.map((product) => ({
                  ...product,
                  quantity: product.id === productId ? Math.min(1, Math.max(0, quantity)) : 0,
                })),
              };
            }
            return {
              ...step,
              products: step.products.map((product) => {
                if (product.id !== productId) return product;
                const max = product.maxQty;
                const clamped = max !== undefined
                  ? Math.min(max, Math.max(0, quantity))
                  : Math.max(0, quantity);
                return { ...product, quantity: clamped };
              }),
            };
          });

          // Auto-manage Hub: if any non-hub sensor gets qty > 0 add hub; if all are 0, remove hub
          if (isSensorStepProduct && productId !== 'sense-hub') {
            const newQty = Math.max(0, quantity);
            const sensorsStep = updatedSteps.find((s) => s.id === 'sensors');
            const anyNonHubSensor = sensorsStep?.products.some(
              (p) => p.id !== 'sense-hub' && (p.id === productId ? newQty > 0 : (p.quantity ?? 0) > 0)
            );
            const prevHubQty = state.steps.find((s) => s.id === 'sensors')?.products.find((p) => p.id === 'sense-hub')?.quantity ?? 0;
            const nextHubQty = anyNonHubSensor ? 1 : 0;
            return {
              steps: updatedSteps.map((step) => {
                if (step.id !== 'sensors') return step;
                return {
                  ...step,
                  products: step.products.map((p) =>
                    p.id === 'sense-hub' ? { ...p, quantity: nextHubQty } : p
                  ),
                };
              }),
              showHubToast: nextHubQty === 1 && prevHubQty === 0,
            };
          }

          return { steps: updatedSteps };
        });

        // Fire analytics for the target product only (hub is auto-managed, skip it)
        if (productId !== 'sense-hub') {
          const newProduct = get().steps.flatMap((s) => s.products).find((p) => p.id === productId);
          const newQty = newProduct?.quantity ?? 0;
          if (newQty > prevQty) {
            if (newProduct) analytics.productAdded(productId, newProduct.name, newProduct.price, newQty - prevQty);
          } else if (newQty === 0 && prevQty > 0) {
            if (prevProduct) analytics.productRemoved(productId, prevProduct.name);
          }
        }

        // Fire productRemoved for the plan that was silently deselected by exclusive-selection logic
        if (prevSelectedPlan) {
          analytics.productRemoved(prevSelectedPlan.id, prevSelectedPlan.name);
        }
      },

      setActiveVariant: (productId, variantId) => {
        set((state) => ({
          steps: state.steps.map((step) => ({
            ...step,
            products: step.products.map((product) => {
              if (product.id !== productId) return product;
              return { ...product, activeVariantId: variantId };
            }),
          })),
        }));
      },

      getTotalSelectedCount: (stepId) => {
        const step = get().steps.find((s) => s.id === stepId);
        if (!step) return 0;
        let count = 0;
        for (const product of step.products) {
          if (product.variants) {
            const hasAny = product.variants.some((v) => v.quantity > 0);
            if (hasAny) count++;
          } else {
            if ((product.quantity ?? 0) > 0) count++;
          }
        }
        return count;
      },

      getReviewItems: () => computeReviewItems(get().steps),

      getTotal: () => computeTotal(get().getReviewItems()),

      saveSystem: () => set({ savedAt: Date.now() }),

      // called from CheckoutModal on order confirm
      trackOrderConfirmed: (orderId: string) => {
        const { current } = computeTotal(computeReviewItems(get().steps));
        analytics.orderConfirmed(orderId, current);
      },
    }),
    {
      name: 'wyze-bundle',
      // Always use fresh product data from JSON; only restore user selections (qty, activeVariant)
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<StepState> | null;
        if (!p?.steps) return current;

        const mergedSteps = current.steps.map((step) => ({
          ...step,
          products: step.products.map((product) => {
            const pStep = p.steps!.find((s) => s.id === step.id);
            const pProd = pStep?.products.find((pr) => pr.id === product.id);
            if (!pProd) return product;
            return {
              ...product,
              quantity: pProd.quantity,
              activeVariantId: pProd.activeVariantId ?? product.activeVariantId,
              variants: product.variants?.map((v) => {
                const pVar = pProd.variants?.find((pv) => pv.id === v.id);
                return pVar ? { ...v, quantity: pVar.quantity } : v;
              }),
            };
          }),
        }));

        return {
          ...current,
          steps: mergedSteps,
          activeStep: p.activeStep ?? current.activeStep,
          savedAt: p.savedAt,
        };
      },
      partialize: (state) => ({
        steps: state.steps,
        activeStep: state.activeStep,
        savedAt: state.savedAt,
      }),
    }
  )
);

export function findProduct(steps: Step[], productId: string): Product | undefined {
  for (const step of steps) {
    const found = step.products.find((p) => p.id === productId);
    if (found) return found;
  }
}
