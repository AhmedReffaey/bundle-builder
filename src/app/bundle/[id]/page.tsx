import fs from 'fs/promises';
import path from 'path';
import type { Step } from '@/types';
import { encodeBundle } from '@/lib/bundleShare';

interface SavedBundle { id: string; email: string; steps: Step[]; savedAt: string; }

async function getBundle(id: string): Promise<SavedBundle | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'src', 'data', 'saved-bundles.json'), 'utf-8');
    const bundles: SavedBundle[] = JSON.parse(raw);
    return bundles.find((b) => b.id === id) ?? null;
  } catch { return null; }
}

export default async function BundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getBundle(id);

  if (!bundle) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <h1 className="font-bold text-gray-900 text-xl mb-2">Bundle not found</h1>
          <p className="text-gray-500 text-sm mb-4">This link may have expired or been removed.</p>
          <a href="/" className="text-brand-purple font-semibold hover:underline text-sm">Build a new bundle →</a>
        </div>
      </main>
    );
  }

  const encoded = encodeBundle(bundle.steps);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-sm">
        <h1 className="font-extrabold text-gray-900 text-xl mb-2">Your saved bundle</h1>
        <p className="text-gray-500 text-sm mb-6">
          Saved on {new Date(bundle.savedAt).toLocaleDateString()}
        </p>
        <a
          href={`/?bundle=${encodeURIComponent(encoded)}`}
          className="inline-block px-6 py-3 bg-brand-indigo text-white font-bold rounded-[3px] text-sm hover:opacity-90 transition-opacity"
        >
          Restore my bundle →
        </a>
      </div>
    </main>
  );
}
