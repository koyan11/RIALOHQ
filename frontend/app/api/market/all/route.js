import { NextResponse } from 'next/server';
import marketManager from '../../../../lib/websocket';

/**
 * GET /api/market/all
 * Returns latest prices for all tracked assets.
 */
export async function GET() {
  const data = marketManager.getAll();
  return NextResponse.json(data);
}
