# Wyze Bundle Builder

A multi-step security system bundle builder built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production build

```bash
npm run build
npm start
```

## Testing

### Unit tests (Jest + ts-jest)

```bash
npm test
```

12 tests covering `computeReviewItems` and `computeTotal` — the pure calculation functions that power the review panel. Running in the Node environment (no jsdom needed) makes them fast and deterministic.

### E2E tests (Playwright)

```bash
# Install browsers once
npx playwright install

# Run against the dev server (starts automatically on port 3002)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

9 tests covering: page load, product quantity interaction, accordion navigation, checkout happy path (summary → place order → confirmed), focus trap verification, and the empty-bundle guard.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Zustand v5** — state management + localStorage persistence
- **Jest + ts-jest** — unit tests
- **Playwright** — E2E tests

## Architecture

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── builder/          # Left-column accordion builder
│   │   ├── BuilderPanel.tsx
│   │   ├── AccordionStep.tsx
│   │   ├── ProductCard.tsx
│   │   ├── VariantSelector.tsx
│   │   ├── QuantityStepper.tsx
│   │   └── StepIcon.tsx
│   ├── checkout/
│   │   └── CheckoutModal.tsx   # Two-phase modal: summary → animated success
│   ├── review/           # Right-column live review panel
│   │   ├── ReviewPanel.tsx
│   │   └── ReviewLineItem.tsx
│   └── ui/
│       ├── ProductImage.tsx    # Next.js Image wrapper with error fallback
│       └── ErrorBoundary.tsx   # Class component catches render errors
├── data/
│   └── products.json     # All product data (single source of truth)
├── lib/
│   └── bundleCalculations.ts   # Pure functions: computeReviewItems, computeTotal
├── store/
│   └── bundleStore.ts    # Zustand store with localStorage persistence
└── types/
    └── index.ts
e2e/
└── bundle.spec.ts        # Playwright E2E tests
```

## Key Decisions

### State management: Zustand
Chosen for minimal boilerplate and first-class `persist` middleware that handles localStorage serialization out of the box. `skipHydration: true` prevents server/client mismatch — `rehydrate()` is called explicitly inside a `useEffect` in `BuilderPanel`.

### Pure calculation functions
`computeReviewItems` and `computeTotal` in `lib/bundleCalculations.ts` are pure functions with no store dependency. This makes them independently unit-testable and allows `useMemo` memoization in the review panel with no extra abstraction.

### Variant-per-quantity model
Each color variant tracks its own `quantity` independently. The card stepper is bound to the `activeVariantId` — switching colors shows that variant's count without losing the other variant's quantity. The review panel renders a separate line for every variant with quantity > 0.

### CSS Grid accordion animation
The expand/collapse animation uses `grid-template-rows: 0fr → 1fr` transition. No JS height measurement, no `requestAnimationFrame` workarounds — pure CSS, works on first render.

### Data-driven from JSON
All product data lives in `src/data/products.json`. The initial state seeds cameras and sensors as pre-selected so the app loads with a populated bundle matching the design.

### Persistence + merge strategy
Zustand's `persist` middleware writes step state to `localStorage` under `wyze-bundle`. On return visits, a custom `merge` function restores only user selections (quantities, active variants) while always pulling fresh product data (names, prices, images) from the JSON source.

## Tradeoffs / not finished

- **No backend API** — data is a local JSON import. Adding a Route Handler (`/api/products`) is a small lift.
- **Plan step** — plans render as product cards (additive quantity). A single-select radio model would be more accurate to the typical "choose one plan" UX.
- **Mobile review** — renders below the accordion steps on mobile. A slide-up drawer would be more polished.
