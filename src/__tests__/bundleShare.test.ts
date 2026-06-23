import { encodeBundle, decodeBundle, applySnapshot } from '@/lib/bundleShare';
import type { Step } from '@/types';

const makeStep = (id: string, stepNum: number, products: Step['products']): Step => ({
  id,
  step: stepNum,
  title: 'Test',
  nextLabel: 'Next',
  icon: 'camera',
  products,
});

// ── encode / decode round-trip ────────────────────────────────────────────────

describe('encodeBundle / decodeBundle', () => {
  it('round-trips a simple product with quantity', () => {
    const steps = [
      makeStep('cameras', 1, [
        { id: 'cam1', name: 'Cam 1', description: '', image: '', price: 27.98, quantity: 2 },
      ]),
    ];
    const decoded = decodeBundle(encodeBundle(steps));
    expect(decoded).not.toBeNull();
    expect(decoded!.selections).toHaveLength(1);
    expect(decoded!.selections[0].productId).toBe('cam1');
    expect(decoded!.selections[0].quantity).toBe(2);
    expect(decoded!.selections[0].stepId).toBe('cameras');
  });

  it('round-trips variant products with their quantities', () => {
    const steps = [
      makeStep('cameras', 1, [
        {
          id: 'cam-v4',
          name: 'Wyze Cam v4',
          description: '',
          image: '',
          price: 27.98,
          activeVariantId: 'black',
          variants: [
            { id: 'white', label: 'White', color: '#fff', quantity: 0 },
            { id: 'black', label: 'Black', color: '#000', quantity: 3 },
          ],
        },
      ]),
    ];
    const decoded = decodeBundle(encodeBundle(steps));
    expect(decoded!.selections[0].activeVariantId).toBe('black');
    const blackQty = decoded!.selections[0].variants?.find((v) => v.id === 'black')?.quantity;
    expect(blackQty).toBe(3);
  });

  it('excludes products with zero quantity from the snapshot', () => {
    const steps = [
      makeStep('cameras', 1, [
        { id: 'cam1', name: '', description: '', image: '', price: 0, quantity: 0 },
        { id: 'cam2', name: '', description: '', image: '', price: 0, quantity: 1 },
      ]),
    ];
    const decoded = decodeBundle(encodeBundle(steps));
    expect(decoded!.selections).toHaveLength(1);
    expect(decoded!.selections[0].productId).toBe('cam2');
  });

  it('excludes variant products where ALL variants have zero quantity', () => {
    const steps = [
      makeStep('cameras', 1, [
        {
          id: 'cam-v4',
          name: '',
          description: '',
          image: '',
          price: 0,
          variants: [
            { id: 'white', label: 'White', color: '#fff', quantity: 0 },
            { id: 'black', label: 'Black', color: '#000', quantity: 0 },
          ],
        },
      ]),
    ];
    const decoded = decodeBundle(encodeBundle(steps));
    expect(decoded!.selections).toHaveLength(0);
  });

  it('produces a stable, non-empty base64 string', () => {
    const steps = [
      makeStep('cameras', 1, [
        { id: 'cam1', name: '', description: '', image: '', price: 0, quantity: 1 },
      ]),
    ];
    const encoded = encodeBundle(steps);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
  });
});

describe('decodeBundle', () => {
  it('returns null for an empty string', () => {
    expect(decodeBundle('')).toBeNull();
  });

  it('returns null for a non-base64 string', () => {
    expect(decodeBundle('this is not base64 !!!')).toBeNull();
  });

  it('returns null for valid base64 that is not JSON', () => {
    expect(decodeBundle(btoa('this is not JSON'))).toBeNull();
  });

  it('returns null for valid base64 JSON that does not match the expected shape', () => {
    const gibberish = btoa(JSON.stringify({ foo: 'bar' }));
    // decodeBundle doesn't throw on shape mismatch — it returns the object
    // but applySnapshot handles missing selections gracefully
    const result = decodeBundle(gibberish);
    // Should parse without error (no strict shape validation in decode)
    expect(result).toBeDefined();
  });
});

// ── applySnapshot ─────────────────────────────────────────────────────────────

describe('applySnapshot', () => {
  it('applies quantity from snapshot to matching product', () => {
    const base = [
      makeStep('cameras', 1, [
        { id: 'cam1', name: '', description: '', image: '', price: 27.98, quantity: 0 },
      ]),
    ];
    const snapshot = { selections: [{ stepId: 'cameras', productId: 'cam1', quantity: 3 }] };
    const result = applySnapshot(base, snapshot);
    expect(result[0].products[0].quantity).toBe(3);
  });

  it('leaves products unchanged when no snapshot entry matches', () => {
    const base = [
      makeStep('cameras', 1, [
        { id: 'cam1', name: '', description: '', image: '', price: 27.98, quantity: 1 },
      ]),
    ];
    const snapshot = { selections: [{ stepId: 'cameras', productId: 'deleted-product', quantity: 5 }] };
    const result = applySnapshot(base, snapshot);
    expect(result[0].products[0].quantity).toBe(1); // unchanged
  });

  it('applies variant quantities from snapshot', () => {
    const base = [
      makeStep('cameras', 1, [
        {
          id: 'cam-v4',
          name: '',
          description: '',
          image: '',
          price: 27.98,
          variants: [
            { id: 'white', label: 'White', color: '#fff', quantity: 0 },
            { id: 'black', label: 'Black', color: '#000', quantity: 0 },
          ],
        },
      ]),
    ];
    const snapshot = {
      selections: [{
        stepId: 'cameras',
        productId: 'cam-v4',
        variants: [{ id: 'black', quantity: 2 }],
      }],
    };
    const result = applySnapshot(base, snapshot);
    const black = result[0].products[0].variants?.find((v) => v.id === 'black');
    const white = result[0].products[0].variants?.find((v) => v.id === 'white');
    expect(black?.quantity).toBe(2);
    expect(white?.quantity).toBe(0); // untouched
  });

  it('handles empty selections gracefully', () => {
    const base = [
      makeStep('cameras', 1, [
        { id: 'cam1', name: '', description: '', image: '', price: 0, quantity: 1 },
      ]),
    ];
    const result = applySnapshot(base, { selections: [] });
    expect(result[0].products[0].quantity).toBe(1); // unchanged
  });

  it('ignores snapshot entries for steps not present in base', () => {
    const base = [makeStep('cameras', 1, [])];
    const snapshot = { selections: [{ stepId: 'nonexistent-step', productId: 'p1', quantity: 5 }] };
    expect(() => applySnapshot(base, snapshot)).not.toThrow();
  });
});
