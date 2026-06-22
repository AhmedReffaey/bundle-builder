export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center rounded-[3px] w-20 h-20 bg-green-100 mx-auto mb-6">
          <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none">
            <path d="M8 18l7 7 13-14" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-extrabold text-gray-900 text-2xl mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your Wyze security system is on its way. You&apos;ll receive a confirmation email within 24 hours.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-brand-indigo text-white font-bold rounded-[3px] text-sm hover:opacity-90 transition-opacity"
        >
          Back to Home
        </a>
      </div>
    </main>
  );
}
