'use client';

import type { Step } from '@/types';
import { useBundleStore } from '@/store/bundleStore';
import ProductCard from './ProductCard';
import StepIcon from './StepIcon';
import UpsellBanner from './UpsellBanner';

interface AccordionStepProps {
  step: Step;
  totalSteps: number;
  isLast: boolean;
}

export default function AccordionStep({ step, totalSteps, isLast }: AccordionStepProps) {
  const { activeStep, setActiveStep, getTotalSelectedCount, steps } = useBundleStore();
  const isOpen = activeStep === step.step;
  const selectedCount = getTotalSelectedCount(step.id);
  const isCompleted = activeStep > step.step && selectedCount > 0;

  // Compute upsell suggestions for this step
  const upsell = (() => {
    if (step.id === 'cameras') {
      const totalCameraQty = step.products.reduce((total, p) => {
        if (p.variants) return total + p.variants.reduce((s, v) => s + v.quantity, 0);
        return total + (p.quantity ?? 0);
      }, 0);
      if (totalCameraQty > 3) {
        return {
          message: 'Most homes are well-covered with 2–3 cameras. Adding more may require a higher internet bandwidth plan.',
          ctaLabel: 'Learn about bandwidth',
          onCta: () => {},
        };
      }
    }
    if (step.id === 'sensors') {
      const camerasSelected = getTotalSelectedCount('cameras') > 0;
      const sensorsSelected = selectedCount > 0;
      if (camerasSelected && !sensorsSelected) {
        return {
          message: 'Sensors complete your camera setup — detect motion before cameras even record.',
          ctaLabel: 'Add sensors',
          onCta: () => {},
        };
      }
    }
    if (step.id === 'extras') {
      const camerasSelected = getTotalSelectedCount('cameras') > 0;
      const extrasStep = steps.find((s) => s.id === 'extras');
      const hasSD = extrasStep?.products.find((p) => p.id === 'sd-card-256');
      const sdQty = hasSD?.quantity ?? 0;
      if (camerasSelected && sdQty === 0) {
        return {
          message: 'No SD card yet — without one, cameras only save to the cloud (needs a plan).',
          ctaLabel: 'Add SD card',
          onCta: () => {},
        };
      }
    }
    return null;
  })();

  const handleToggle = () => setActiveStep(isOpen ? 0 : step.step);
  const handleNext = () => {
    if (step.step < totalSteps) setActiveStep(step.step + 1);
  };

  return (
    <div className={isOpen ? 'mb-4' : ''}>
      {/* STEP X OF Y */}
      <p className="font-semibold tracking-[0.12em] uppercase text-gray-400 mb-2 text-[10px]">
        STEP {step.step} OF {totalSteps}
      </p>

      {/* Card container */}
      <div
        className={[
          'rounded-xl transition-[background-color,border-color,box-shadow] duration-200 ease-in-out',
          isOpen
            ? 'bg-review-bg border border-gray-200 shadow-step'
            : 'bg-transparent border border-transparent shadow-none',
        ].join(' ')}
      >
        {/* Header button */}
        <button
          onClick={handleToggle}
          id={`step-header-${step.id}`}
          aria-expanded={isOpen}
          aria-controls={`step-body-${step.id}`}
          className={[
            'w-full flex items-center justify-between text-left transition-colors',
            isOpen
              ? 'px-5 py-4 hover:bg-blue-100/30 rounded-t-xl'
              : 'px-1 py-3 hover:bg-blue-50/60 rounded-xl',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="relative flex-shrink-0">
              {isOpen ? (
                <div className="flex items-center justify-center w-7 h-7 border border-gray-300 rounded-[3px] bg-gray-50">
                  <StepIcon icon={step.icon} className="w-4 h-4 text-gray-600" />
                </div>
              ) : (
                <>
                  <StepIcon icon={step.icon} className="w-5 h-5 text-gray-500" />
                  {isCompleted && (
                    <div className="absolute flex items-center justify-center rounded-[3px] bg-green-500 w-3 h-3 -top-1 -right-1">
                      <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none" stroke="white" strokeWidth="2">
                        <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </>
              )}
            </div>

            <span className={`font-bold text-gray-900 ${isOpen ? 'text-lg' : 'text-[17px]'}`}>
              {step.title}
            </span>
          </div>

          {/* Right: count + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedCount > 0 && (
              <span className="flex items-center gap-1 font-semibold text-[13px] text-brand-green">
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {selectedCount} selected
              </span>
            )}
            <svg
              className={[
                'w-4 h-4 flex-shrink-0 text-brand-purple',
                'transition-transform duration-300 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]',
                isOpen ? 'rotate-180' : 'rotate-0',
              ].join(' ')}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* ── Animated body (CSS Grid expand/collapse) ── */}
        <div
          id={`step-body-${step.id}`}
          role="region"
          aria-labelledby={`step-header-${step.id}`}
          className={[
            'grid [transition:grid-template-rows_0.35s_cubic-bezier(0.4,0,0.2,1)]',
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          ].join(' ')}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="h-px bg-gray-100" />

            <div className="px-5 py-5">
              {/* Upsell suggestion banner */}
              {upsell && (
                <UpsellBanner
                  message={upsell.message}
                  ctaLabel={upsell.ctaLabel}
                  onCta={upsell.onCta}
                />
              )}
              {/* Mobile (< sm): single-column stack */}
              <div className="flex flex-col gap-3 sm:hidden">
                {step.products.map((p) => (
                  <ProductCard key={p.id} product={p} stepId={step.id} priority={step.step === 1} />
                ))}
              </div>

              {/* Tablet (sm → lg): horizontal snap scroll */}
              <div className="hidden sm:flex lg:hidden items-stretch gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-5 px-5">
                {step.products.map((p) => (
                  <div key={p.id} className="flex flex-col flex-shrink-0 snap-start w-[210px]">
                    <ProductCard product={p} stepId={step.id} priority={step.step === 1} vertical />
                  </div>
                ))}
                <div className="flex-shrink-0 w-5" aria-hidden="true" />
              </div>

              {/* Desktop (lg+): 2-column grid */}
              {step.products.length % 2 !== 0 ? (
                <div className="hidden lg:block">
                  <div className="grid grid-cols-2 gap-3">
                    {step.products.slice(0, -1).map((p) => (
                      <ProductCard key={p.id} product={p} stepId={step.id} priority={step.step === 1} />
                    ))}
                  </div>
                  <div className="flex justify-center mt-3">
                    <div className="w-[calc(50%-6px)]">
                      <ProductCard
                        product={step.products[step.products.length - 1]}
                        stepId={step.id}
                        priority={step.step === 1}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden lg:grid grid-cols-2 gap-3">
                  {step.products.map((p) => (
                    <ProductCard key={p.id} product={p} stepId={step.id} priority={step.step === 1} />
                  ))}
                </div>
              )}

              {/* Next button */}
              {step.step < totalSteps && (
                <div className="flex justify-center mt-5">
                  <button
                    onClick={handleNext}
                    className="w-full sm:w-1/2 h-[39px] px-6 py-[5px] text-brand-deep-purple font-bold rounded-[7px] transition-opacity hover:opacity-80 active:opacity-60 text-[15px] bg-transparent border border-brand-deep-purple"
                  >
                    Next: {step.nextLabel}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Separator between closed steps */}
      {!isOpen && !isLast && (
        <div className="h-px bg-gray-200 mb-1" />
      )}
    </div>
  );
}
