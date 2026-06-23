'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '@/lib/errorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, { componentStack: info.componentStack ?? undefined });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[3px] border border-gray-200"
          >
            <svg
              className="w-10 h-10 text-red-400 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p className="font-semibold text-gray-700 text-sm">
              Something went wrong
            </p>
            <p className="text-gray-400 mt-1 mb-4 text-[13px]">
              Please try refreshing the page
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-[3px] font-semibold text-white transition-opacity hover:opacity-90 bg-brand-purple text-[13px]"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
