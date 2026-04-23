import { useState, useEffect } from 'react';

/**
 * useMarket Hook
 * Fetches and maintains real-time market data from internal API.
 */
export function useMarket(symbol = null) {
  const [data, setData] = useState(symbol ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const url = symbol 
          ? `/api/market?symbol=${symbol}` 
          : '/api/market/all';
        
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Market data unavailable');
        
        const json = await resp.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMarket();

    // Fast polling for "real-time" feel (every 2 seconds)
    const interval = setInterval(fetchMarket, 2000);

    return () => clearInterval(interval);
  }, [symbol]);

  return { data, loading, error };
}
