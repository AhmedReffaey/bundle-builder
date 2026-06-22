import { NextResponse } from 'next/server';
import bundleData from '@/data/products.json';

export async function GET() {
  return NextResponse.json(bundleData, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
