'use client';

import { useBundleStore } from '@/store/bundleStore';
import AccordionStep from './AccordionStep';

export default function BuilderPanel() {
  const { steps } = useBundleStore();

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <AccordionStep
          key={step.id}
          step={step}
          totalSteps={steps.length}
          isLast={i === steps.length - 1}
        />
      ))}
    </div>
  );
}
