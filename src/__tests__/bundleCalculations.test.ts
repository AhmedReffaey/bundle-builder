import { computeReviewItems, computeTotal } from '../lib/bundleCalculations';
import type { Step } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

const makeStep = (id: string, stepNum: number, products: Step['products'] = []): Step => ({
  id,
  step: stepNum,
  title: `Step ${stepNum}`,
  nextLabel: 'Next',
  icon: 'camera',
  products,
});

const cam = (overrides = {}) => ({
  id: 'cam-v4',
  name: 'Wyze Cam v4',
  description: 'A camera',
  image: '/cam.jpg',
  price: 27.98,
  quantity: 0,
  ...overrides,
});

// ── computeReviewItems ────────────────────────────────────────────────────────

describe('computeReviewItems', () => {
  it('returns empty array when no products are selected', () => {
    const steps = [makeStep('cameras', 1, [cam({ quantity: 0 })])];
    expect(computeReviewItems(steps)).toEqual([]);
  });

  it('includes a product with quantity > 0', () => {
    const steps = [makeStep('cameras', 1, [cam({ quantity: 2 })])];
    const items = computeReviewItems(steps);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].price).toBeCloseTo(55.96); // 27.98 × 2
  });

  it('multiplies compareAtPrice by quantity', () => {
    const steps = [makeStep('cameras', 1, [cam({ quantity: 1, compareAtPrice: 35.98 })])];
    const [item] = computeReviewItems(steps);
    expect(item.compareAtPrice).toBeCloseTo(35.98);
  });

  it('handles variant-based products — only includes variants with qty > 0', () => {
    const steps = [
      makeStep('cameras', 1, [
        {
          id: 'cam-pan',
          name: 'Cam Pan v3',
          description: '',
          image: '/pan.jpg',
          price: 34.98,
          variants: [
            { id: 'white', label: 'White', color: '#FFF', quantity: 2 },
            { id: 'black', label: 'Black', color: '#000', quantity: 0 },
          ],
        },
      ]),
    ];
    const items = computeReviewItems(steps);
    expect(items).toHaveLength(1);
    expect(items[0].variantId).toBe('white');
    expect(items[0].price).toBeCloseTo(69.96); // 34.98 × 2
  });

  it('marks plan-step items as isMonthly', () => {
    const steps = [
      makeStep('plan', 2, [cam({ id: 'plus', name: 'Cam Plus', price: 2.99, quantity: 1 })]),
    ];
    const [item] = computeReviewItems(steps);
    expect(item.isMonthly).toBe(true);
  });

  it('marks free products with isFree: true', () => {
    const steps = [
      makeStep('sensors', 3, [cam({ id: 'hub', name: 'Sense Hub', price: 0, quantity: 1 })]),
    ];
    const [item] = computeReviewItems(steps);
    expect(item.isFree).toBe(true);
    expect(item.price).toBe(0);
  });

  it('maps plan step to HOME MONITORING PLAN category', () => {
    const steps = [
      makeStep('plan', 2, [cam({ id: 'plus', price: 2.99, quantity: 1 })]),
    ];
    const [item] = computeReviewItems(steps);
    expect(item.category).toBe('HOME MONITORING PLAN');
  });

  it('maps cameras step to CAMERAS category', () => {
    const steps = [makeStep('cameras', 1, [cam({ quantity: 1 })])];
    const [item] = computeReviewItems(steps);
    expect(item.category).toBe('CAMERAS');
  });
});

// ── computeTotal ─────────────────────────────────────────────────────────────

describe('computeTotal', () => {
  it('returns zeros for an empty items array', () => {
    expect(computeTotal([])).toEqual({ original: 0, current: 0, savings: 0 });
  });

  it('calculates savings correctly', () => {
    const items = [
      {
        productId: 'x',
        name: 'X',
        image: '',
        price: 27.98,
        compareAtPrice: 35.98,
        quantity: 1,
        category: 'CAMERAS',
        isMonthly: false,
      },
    ];
    const { current, original, savings } = computeTotal(items);
    expect(current).toBeCloseTo(27.98);
    expect(original).toBeCloseTo(35.98);
    expect(savings).toBeCloseTo(8.0);
  });

  it('excludes monthly items from the one-time total', () => {
    const items = [
      {
        productId: 'cam',
        name: 'Cam',
        image: '',
        price: 27.98,
        quantity: 1,
        category: 'CAMERAS',
        isMonthly: false,
      },
      {
        productId: 'plan',
        name: 'Plan',
        image: '',
        price: 9.99,
        quantity: 1,
        category: 'HOME MONITORING PLAN',
        isMonthly: true,
      },
    ];
    const { current } = computeTotal(items);
    expect(current).toBeCloseTo(27.98); // plan must be excluded
  });

  it('uses price as original when compareAtPrice is missing', () => {
    const items = [
      {
        productId: 'x',
        name: 'X',
        image: '',
        price: 20,
        quantity: 1,
        category: 'CAMERAS',
        isMonthly: false,
      },
    ];
    const { savings } = computeTotal(items);
    expect(savings).toBe(0);
  });
});
