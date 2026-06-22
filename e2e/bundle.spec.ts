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
  // JSON defaults: Wyze Cam v4 (qty 1) + Wyze Cam Pan v3 (qty 2)
  // exact:true avoids the strict-mode violation — "CAMERAS" is a substring of several elements
  await expect(page.getByText('CAMERAS', { exact: true })).toBeVisible();
  await expect(page.getByText('Wyze Cam v4').first()).toBeVisible();
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
