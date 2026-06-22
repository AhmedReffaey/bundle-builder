export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center rounded-[3px] w-20 h-20 bg-gray-100 mx-auto mb-6">
          <svg className="w-9 h-9 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="font-extrabold text-gray-900 text-2xl mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 text-sm mb-6">
          No worries — your bundle is saved. Go back and complete your order whenever you&apos;re ready.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-brand-indigo text-white font-bold rounded-[3px] text-sm hover:opacity-90 transition-opacity"
        >
          Return to Builder
        </a>
      </div>
    </main>
  );
}
