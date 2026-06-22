// Drop-in error tracking abstraction.
// To enable Sentry: npm install @sentry/nextjs && run npx @sentry/wizard@latest -i nextjs
// Then replace the stubs below with real Sentry calls.

type ErrorContext = Record<string, unknown>;

export function captureException(error: Error, context?: ErrorContext): void {
  if (process.env.NODE_ENV === 'production') {
    // Replace with: Sentry.captureException(error, { extra: context });
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message, stack: error.stack, context }),
    }).catch(() => {});
  } else {
    console.error('[BundleBuilder]', error, context);
  }
}

export function captureMessage(message: string, context?: ErrorContext): void {
  if (process.env.NODE_ENV === 'production') {
    // Replace with: Sentry.captureMessage(message, { extra: context });
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    }).catch(() => {});
  } else {
    console.warn('[BundleBuilder]', message, context);
  }
}
