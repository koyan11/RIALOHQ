import { NextResponse } from 'next/server';
import marketManager from '../../../lib/websocket';

/**
 * GET /api/market?symbol=BTCUSD
 * Returns the latest real-time price for a specific symbol.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.replace('USD', '');

  if (symbol) {
    const data = marketManager.getLatest(symbol.toUpperCase());
    if (!data) {
      return NextResponse.json({ error: 'Symbol not found or data not yet available' }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  // If no symbol, return all
  return NextResponse.json(marketManager.getAll());
}
