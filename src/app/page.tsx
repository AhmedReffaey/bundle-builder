'use client';

import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import BuilderSkeleton from '@/components/builder/BuilderSkeleton';
import ReviewSkeleton  from '@/components/review/ReviewSkeleton';

const BuilderPanel = dynamic(() => import('@/components/builder/BuilderPanel'), {
  ssr: false,
  loading: () => <BuilderSkeleton />,
});
const ReviewPanel = dynamic(() => import('@/components/review/ReviewPanel'), {
  ssr: false,
  loading: () => <ReviewSkeleton />,
});

export default function Home() {
  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 lg:py-8 lg:px-8 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Builder */}
          <div className="w-full lg:flex-1 min-w-0">
            <ErrorBoundary>
              <BuilderPanel />
            </ErrorBoundary>
          </div>

          {/* Review */}
          <div className="w-full lg:w-[380px] xl:w-[400px] flex-shrink-0">
            <p className="font-bold tracking-[0.14em] text-gray-400 uppercase mb-2 text-[10px]">
              REVIEW
            </p>
            <ErrorBoundary>
              <ReviewPanel />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </main>
  );
}
