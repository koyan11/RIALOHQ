/**
 * Market Data Manager (CoinGecko Version)
 * Handles real-time market data fetching using CoinGecko REST API.
 */
class MarketDataManager {
  constructor() {
    this.apiKey = process.env.COINGECKO_API_KEY || 'CG-vg5m6nnVU6EsxaAwAKy7TQPv';
    this.prices = new Map();
    this.subscribers = new Set();
    this.symbolsMap = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      'ripple': 'XRP',
      'cardano': 'ADA'
    };
    this.reverseSymbolsMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano'
    };
    
    if (typeof window === 'undefined') {
      this.startPolling();
    }
  }

  async startPolling() {
    console.log('Starting CoinGecko Market Data polling...');
    // Initial fetch
    await this.fetchPrices();
    
    // Poll every 30 seconds (CoinGecko demo key limits)
    setInterval(() => this.fetchPrices(), 30000);
  }

  async fetchPrices() {
    try {
      const ids = Object.keys(this.symbolsMap).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=${this.apiKey}`;
      
      const resp = await fetch(url);
      if (!resp.ok) {
        console.error(`CoinGecko API error: ${resp.status}`);
        return;
      }
      
      const data = await resp.json();
      
      Object.entries(data).forEach(([id, info]) => {
        const symbol = this.symbolsMap[id];
        if (symbol) {
          this.updatePrice(symbol, info.usd, info.usd_24h_change);
        }
      });
    } catch (err) {
      console.error('CoinGecko fetch error:', err);
    }
  }

  updatePrice(symbol, price, change) {
    const data = {
      symbol,
      price,
      change: change ? change.toFixed(2) : "0.00",
      type: 'crypto',
      timestamp: Date.now()
    };
    
    this.prices.set(symbol, data);
    this.broadcast(data);
  }

  broadcast(data) {
    this.subscribers.forEach(cb => cb(data));
  }

  onUpdate(cb) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  getLatest(symbol) {
    // Try by symbol first
    let data = this.prices.get(symbol.toUpperCase());
    if (data) return data;
    
    // Try mapping name to symbol
    const mappedSymbol = this.reverseSymbolsMap[symbol.toUpperCase()];
    if (mappedSymbol) return this.prices.get(this.symbolsMap[mappedSymbol]);
    
    return null;
  }

  getAll() {
    return Array.from(this.prices.values());
  }
}

// Singleton instance
const marketManager = new MarketDataManager();

export default marketManager;
