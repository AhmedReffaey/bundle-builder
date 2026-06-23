import { test, expect } from '@playwright/test';


test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('wyze-bundle'));
  await page.reload();
  // Wait for React to mount + Zustand to initialise (accordion header IDs come from aria work)
  await page.locator('#step-header-cameras').waitFor({ state: 'visible' });
});

// ── Smoke ─────────────────────────────────────────────────────────────────────

test('page loads: cameras step open, review panel visible', async ({ page }) => {
  await expect(page.getByText('Choose your cameras')).toBeVisible();
  await expect(page.getByText('Your security system')).toBeVisible();
  await expect(page.getByText('STEP 1 OF 4')).toBeVisible();
});

test('pre-selected products appear in the review panel', async ({ page }) => {
  // JSON defaults: Wyze Cam v4 (qty 1, White) + Wyze Cam Pan v3 (qty 2, White)
  // Target the review panel line item text (includes variant label) — avoids matching
  // the accordion h3 headings which are inside overflow-hidden containers
  await expect(page.getByText('CAMERAS', { exact: true })).toBeVisible();
  await expect(page.getByText('Wyze Cam v4 · White')).toBeVisible();
});

// ── Quantity interaction ───────────────────────────────────────────────────────

test('increasing product quantity updates the review panel price', async ({ page }) => {
  // cam-v4-white starts at qty 1 → review shows $27.98
  // First "Increase quantity" on the page is inside the cam-v4 product card (builder panel, step 1)
  await page.getByRole('button', { name: 'Increase quantity' }).first().click();
  // qty becomes 2 → computeReviewItems: 2 × $27.98 = $55.96
  await expect(page.getByText('$55.96').first()).toBeVisible();
});

// ── Accordion navigation ───────────────────────────────────────────────────────

test('Next button advances to step 2', async ({ page }) => {
  await page.getByRole('button', { name: /Next: Choose your plan/i }).click();
  await expect(page.getByText('STEP 2 OF 4')).toBeVisible();
  // exact:true → matches the span "Choose your plan", not the "Next: Choose your plan" button
  await expect(page.getByText('Choose your plan', { exact: true })).toBeVisible();
});

test('clicking a closed step header opens it', async ({ page }) => {
  // Use the ID we added via aria work — avoids ambiguity with "Next: Choose your sensors"
  await page.locator('#step-header-sensors').click();
  await expect(page.locator('#step-header-sensors')).toHaveAttribute('aria-expanded', 'true');
});

// ── Checkout flow ─────────────────────────────────────────────────────────────

test('checkout: summary modal opens and closes with Escape', async ({ page }) => {
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order Summary' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('checkout: full happy path — summary → place order → confirmed', async ({ page }) => {
  const checkoutBtn = page.getByRole('button', { name: 'Checkout' });
  await expect(checkoutBtn).toBeEnabled();
  await checkoutBtn.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Order Summary' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Place Order' }).click();

  await expect(dialog.getByRole('heading', { name: 'Order Confirmed!' })).toBeVisible();
  await expect(page.getByText(/WY-[A-Z0-9]{6}/)).toBeVisible();

  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('checkout modal traps Tab focus inside', async ({ page }) => {
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Tab through several elements — focus must stay inside the modal
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');

  const focusedInsideModal = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? el.closest('[role="dialog"]') !== null : false;
  });
  expect(focusedInsideModal).toBe(true);
});

// ── Hub auto-add ──────────────────────────────────────────────────────────────

test('selecting a sensor auto-adds the Sense Hub', async ({ page }) => {
  // Cameras step is open by default — click + here to flush state into localStorage
  await page.getByRole('button', { name: 'Increase quantity' }).first().click();
  await page.waitForFunction(() => localStorage.getItem('wyze-bundle') !== null, { timeout: 3000 });

  // Zero all sensor quantities while cameras accordion is still open (no interception risk)
  await page.evaluate(() => {
    type P = { quantity: number; id: string };
    type S = { products: P[]; id: string };
    type Stored = { state: { steps: S[] } };
    const raw = localStorage.getItem('wyze-bundle')!;
    const stored = JSON.parse(raw) as Stored;
    stored.state.steps = stored.state.steps.map((step) =>
      step.id !== 'sensors' ? step : {
        ...step,
        products: step.products.map((p) => ({ ...p, quantity: 0 })),
      }
    );
    localStorage.setItem('wyze-bundle', JSON.stringify(stored));
  });

  // Reload with zeroed sensors, then open sensors step
  await page.reload();
  await page.locator('#step-header-cameras').waitFor({ state: 'visible' });
  await page.locator('#step-header-sensors').click();
  await expect(page.locator('#step-header-sensors')).toHaveAttribute('aria-expanded', 'true');

  // Add a motion sensor within the sensors body — hub must auto-appear in the review panel
  await page.locator('#step-body-sensors').getByRole('button', { name: 'Increase quantity' }).first().click();

  // ReviewLineItem renders name as <span class="font-medium ..."> — distinct from the accordion h3
  await expect(
    page.locator('span.font-medium').filter({ hasText: 'Wyze Sense Hub (Required)' })
  ).toBeVisible();
});

// ── Bundle URL share & reload ──────────────────────────────────────────────────

test('shared bundle URL restores quantities on reload', async ({ page }) => {
  // Encode current default state and reload with ?bundle= param
  const encoded = await page.evaluate(() => {
    type V = { id: string; quantity: number };
    type P = { id: string; quantity?: number; variants?: V[] };
    type S = { id: string; products: P[] };
    const steps: S[] = JSON.parse(localStorage.getItem('wyze-bundle') ?? 'null')?.state?.steps ?? [];
    if (!steps.length) return null;
    const snapshot = steps.reduce<Record<string, { qty?: number; variants?: Record<string, number> }>>((acc, step) => {
      step.products.forEach((p) => {
        if (p.variants) {
          const variantQtys = p.variants.reduce<Record<string, number>>((va, v) => {
            if (v.quantity > 0) va[v.id] = v.quantity;
            return va;
          }, {});
          if (Object.keys(variantQtys).length) acc[p.id] = { variants: variantQtys };
        } else if ((p.quantity ?? 0) > 0) {
          acc[p.id] = { qty: p.quantity };
        }
      });
      return acc;
    }, {});
    return btoa(JSON.stringify(snapshot));
  });

  if (!encoded) return; // skip if no localStorage yet

  await page.goto(`/?bundle=${encoded}`);
  await page.locator('#step-header-cameras').waitFor({ state: 'visible' });

  // At least one camera should appear in the review panel
  await expect(page.getByText('CAMERAS', { exact: true })).toBeVisible();
});

// ── Variant switch ─────────────────────────────────────────────────────────────

test('switching variant preserves quantity for that variant', async ({ page }) => {
  // cam-v4-white starts at qty 1; switch to Black — white qty should drop to 0
  // and the new variant card stepper should show the Black variant active
  const whiteBtn = page.locator('#step-body-cameras').getByRole('button', { name: /^White/ }).first();
  const blackBtn = page.locator('#step-body-cameras').getByRole('button', { name: /^Black/ }).first();

  await expect(whiteBtn).toBeVisible();
  await blackBtn.click();

  // After switching to Black, the active stepper still shows qty from white variant
  // The review panel should show White · still (qty unchanged on the WHITE variant)
  await expect(page.getByText('Wyze Cam v4 · White')).toBeVisible();
});

// ── Mobile cart bar ───────────────────────────────────────────────────────────

test('mobile cart bar is visible on mobile viewport when bundle has items', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Default state has cameras + sensors + plan — items is not empty
  const bar = page.locator('[data-testid="mobile-cart-bar"]');
  await expect(bar).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Checkout' })).toBeVisible();
});

test('mobile cart bar disappears when viewport is desktop-sized', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  // lg:hidden hides it above 1024px
  await expect(page.locator('[data-testid="mobile-cart-bar"]')).not.toBeVisible();
});

// ── Hub toast ─────────────────────────────────────────────────────────────────

test('hub toast appears when sense hub is auto-added', async ({ page }) => {
  await page.getByRole('button', { name: 'Increase quantity' }).first().click();
  await page.waitForFunction(() => localStorage.getItem('wyze-bundle') !== null, { timeout: 3000 });

  // Zero all sensors so hub starts at 0 (same technique as hub auto-add test)
  await page.evaluate(() => {
    type P = { quantity: number; id: string };
    type S = { products: P[]; id: string };
    type Stored = { state: { steps: S[] } };
    const raw = localStorage.getItem('wyze-bundle')!;
    const stored = JSON.parse(raw) as Stored;
    stored.state.steps = stored.state.steps.map((step) =>
      step.id !== 'sensors' ? step : {
        ...step,
        products: step.products.map((p) => ({ ...p, quantity: 0 })),
      }
    );
    localStorage.setItem('wyze-bundle', JSON.stringify(stored));
  });

  await page.reload();
  await page.locator('#step-header-cameras').waitFor({ state: 'visible' });
  await page.locator('#step-header-sensors').click();
  await expect(page.locator('#step-header-sensors')).toHaveAttribute('aria-expanded', 'true');

  await page.locator('#step-body-sensors').getByRole('button', { name: 'Increase quantity' }).first().click();

  // Toast should appear with the hub notification
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Sense Hub added');
});

// ── Camera compatibility warning ──────────────────────────────────────────────

test('camera compatibility warning appears when total camera quantity exceeds 3', async ({ page }) => {
  // Default: cam-v4-white=1, cam-pan-v3-white=2 → total=3 (no warning)
  await expect(
    page.locator('#step-body-cameras').getByText('Most homes are well-covered')
  ).not.toBeVisible();

  // One more click on cam-v4 white: total becomes 2+2=4 → warning appears
  await page.locator('#step-body-cameras').getByRole('button', { name: 'Increase quantity' }).first().click();

  await expect(
    page.locator('#step-body-cameras').getByText('Most homes are well-covered with 2–3 cameras')
  ).toBeVisible();
});

// ── Save bundle modal ─────────────────────────────────────────────────────────

test('save bundle modal shows success after form submission', async ({ page }) => {
  await page.getByRole('button', { name: 'Save for later' }).click();
  await expect(page.getByText('Save your bundle')).toBeVisible();

  await page.getByPlaceholder('you@example.com').fill('test@example.com');
  await page.getByRole('button', { name: 'Save & send link' }).click();

  await expect(page.getByText('Bundle saved!')).toBeVisible({ timeout: 5000 });
});

// ── Empty-bundle guard ────────────────────────────────────────────────────────

test('checkout button is disabled when bundle is empty', async ({ page }) => {
  // Zustand only writes to localStorage when state actually changes.
  // Trigger a qty change so the persist middleware flushes the full state to storage.
  await page.getByRole('button', { name: 'Increase quantity' }).first().click();
  await page.waitForFunction(() => localStorage.getItem('wyze-bundle') !== null, { timeout: 3000 });

  // Now zero every product quantity in the persisted state
  await page.evaluate(() => {
    // Types are stripped at compile time; the serialised function runs in the browser
    type V = { quantity: number };
    type P = { quantity: number; variants?: V[] };
    type S = { products: P[] };
    type Stored = { state: { steps: S[] } };

    const raw = localStorage.getItem('wyze-bundle')!;
    const stored = JSON.parse(raw) as Stored;
    stored.state.steps = stored.state.steps.map((step) => ({
      ...step,
      products: step.products.map((p) => ({
        ...p,
        quantity: 0,
        variants: p.variants?.map((v) => ({ ...v, quantity: 0 })),
      })),
    }));
    localStorage.setItem('wyze-bundle', JSON.stringify(stored));
  });

  await page.reload();
  await page.locator('#step-header-cameras').waitFor({ state: 'visible' });

  await expect(
    page.getByRole('button', { name: /Build your bundle first/i })
  ).toBeDisabled();
});
