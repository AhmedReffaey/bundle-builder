import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { Step } from '@/types';

// Simple file-based store. Replace with a real database (Supabase, PlanetScale, etc.) in production.
const DB_PATH = path.join(process.cwd(), 'src', 'data', 'saved-bundles.json');

interface SavedBundle {
  id: string;
  email: string;
  steps: Step[];
  savedAt: string;
}

async function readDB(): Promise<SavedBundle[]> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw) as SavedBundle[];
  } catch {
    return [];
  }
}

async function writeDB(bundles: SavedBundle[]): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(bundles, null, 2));
}

export async function POST(req: NextRequest) {
  const { email, steps }: { email: string; steps: Step[] } = await req.json();

  if (!email || !steps) {
    return NextResponse.json({ error: 'Missing email or steps' }, { status: 400 });
  }

  const id = randomUUID();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002';

  const bundles = await readDB();
  bundles.push({ id, email, steps, savedAt: new Date().toISOString() });
  await writeDB(bundles);

  // In production: send email via Resend / SendGrid with the bundle URL
  // e.g. await sendEmail({ to: email, bundleUrl: `${baseUrl}/bundle/${id}` })

  return NextResponse.json({ id, url: `${baseUrl}/bundle/${id}` });
}
