import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { Step } from '@/types';
import { checkRateLimit } from '@/lib/rateLimit';

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PAYLOAD_BYTES = 500_000; // 500 KB

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  if (!checkRateLimit(`save:${ip}`)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const { email, steps }: { email: string; steps: Step[] } = await req.json();

  if (!email || !steps || !Array.isArray(steps)) {
    return NextResponse.json({ error: 'Missing email or steps' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const id = randomUUID();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002';

  const bundles = await readDB();
  bundles.push({ id, email, steps, savedAt: new Date().toISOString() });
  await writeDB(bundles);

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: 'Wyze Bundle Builder <bundles@wyze.com>',
      to: email.trim(),
      subject: 'Your Wyze security bundle — saved for later',
      html: `<p>Hi there,</p>
<p>Your Wyze security bundle is saved! Click the link below to restore it on any device:</p>
<p><a href="${baseUrl}/bundle/${id}" style="color:#7C3AED;font-weight:bold;">Restore my bundle →</a></p>
<p style="color:#6b7280;font-size:12px;">This link never expires.</p>`,
    }).catch((err: unknown) => {
      console.error('Resend email failed:', err);
    });
  }

  return NextResponse.json({ id, url: `${baseUrl}/bundle/${id}` });
}
