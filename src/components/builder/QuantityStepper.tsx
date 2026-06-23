'use client';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function QuantityStepper({ value, onChange, min = 0, max, size = 'md' }: QuantityStepperProps) {
  const isSmall = size === 'sm';
  const atMax = max !== undefined && value >= max;

  const btnCls = [
    'flex items-center justify-center rounded-[3px] font-medium transition-colors select-none bg-white',
    isSmall ? 'w-[18px] h-[18px] text-[10px]' : 'w-[22px] h-[22px] text-xs',
  ].join(' ');

  const numCls = [
    'font-semibold text-center text-gray-800 select-none leading-none',
    isSmall ? 'w-4 text-[10px]' : 'w-5 text-xs',
  ].join(' ');

  return (
    <div
      className="flex items-center gap-0.5"
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault();
          if (!atMax) onChange(value + 1);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault();
          if (value > min) onChange(Math.max(min, value - 1));
        }
      }}
    >
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={[
          btnCls,
          value <= min
            ? 'border border-gray-200 text-gray-300 cursor-not-allowed'
            : 'border border-gray-300 text-gray-500 cursor-pointer',
        ].join(' ')}
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span className={numCls}>{value}</span>

      <button
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        className={[
          btnCls,
          atMax
            ? 'border border-gray-200 text-gray-300 cursor-not-allowed'
            : 'border border-gray-300 text-gray-500 cursor-pointer hover:border-brand-purple hover:text-brand-purple',
        ].join(' ')}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
