'use client';

import { useState, useEffect, useRef } from 'react';
import type { Step } from '@/types';
import { analytics } from '@/lib/analytics';

interface SaveBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: Step[];
}

export default function SaveBundleModal({ isOpen, onClose, steps }: SaveBundleModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [shareUrl, setShareUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setEmail('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    try {
      const res = await fetch('/api/bundles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, steps }),
      });
      const data = await res.json();
      if (data.url) {
        setShareUrl(data.url);
        setStatus('success');
        analytics.bundleSaved(email);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-[400px] rounded-t-[3px] sm:rounded-[3px] shadow-modal animate-modal-slide-up p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {status !== 'success' ? (
          <>
            <h2 className="font-extrabold text-gray-900 text-[18px] mb-1">Save your bundle</h2>
            <p className="text-gray-500 text-[13px] mb-5">
              Enter your email and we&apos;ll send you a link to restore your bundle on any device.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-300 rounded-[3px] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-purple transition-colors"
              />
              {status === 'error' && (
                <p className="text-red-500 text-xs">Something went wrong. Please try again.</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-brand-indigo text-white font-bold rounded-[3px] text-[14px] hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Saving…
                  </>
                ) : 'Save & send link'}
              </button>
              <button type="button" onClick={onClose} className="w-full text-gray-400 text-xs hover:text-gray-600 transition-colors">
                Cancel
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-[3px] bg-green-50 mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-extrabold text-gray-900 text-[18px] mb-1">Bundle saved!</h2>
            <p className="text-gray-500 text-[13px] mb-4">
              We&apos;ve sent a link to <b className="text-gray-900">{email}</b>. Use it to restore your bundle anytime.
            </p>
            {shareUrl && (
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); }}
                className="w-full border border-gray-200 rounded-[3px] py-2 text-xs text-gray-500 hover:border-brand-purple hover:text-brand-purple transition-colors font-mono truncate px-2 mb-3"
              >
                {shareUrl}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 bg-brand-indigo text-white font-bold rounded-[3px] text-[14px] hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
