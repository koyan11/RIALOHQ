import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useWallet } from '../hooks/useWallet';
import { fetchRewards, claimRewards } from '../lib/api';

const HISTORY = [
  { amount: '+240.15 RIALO', date: 'Nov 24, 2024', status: 'Success' },
  { amount: '+189.40 RIALO', date: 'Oct 31, 2024', status: 'Success' },
  { amount: '+412.57 RIALO', date: 'Sep 30, 2024', status: 'Success' },
];

export default function RewardsPage() {
  const { isConnected, address, connect, updateBalance } = useWallet();
  const [rewards, setRewards] = useState({ totalEarned: '12,482.50', claimable: '842.12', apy: 8.42 });
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeRange, setActiveRange] = useState('30D');

  const loadRewards = useCallback(async () => {
    if (!isConnected || !address) return;
    setLoading(true);
    try {
      const data = await fetchRewards(address);
      setRewards({
        totalEarned: parseFloat(data.totalEarned).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        claimable: parseFloat(data.claimable).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        apy: parseFloat(data.apy).toFixed(2),
      });
    } catch (err) {
      // Use default values on error (e.g. contract not deployed)
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Fetch rewards on wallet connect + auto-refresh every 30s
  useEffect(() => {
    loadRewards();
    const interval = setInterval(loadRewards, 30000);
    return () => clearInterval(interval);
  }, [loadRewards]);

  const handleClaim = async () => {
    if (!isConnected) { connect(); return; }
    setClaiming(true);
    setToast({ message: 'Claiming rewards…', type: 'loading' });
    try {
      const res = await claimRewards({ userAddress: address });
      setToast({ message: `Rewards claimed successfully!`, type: 'success', txHash: res.txHash });
      // Update balance (simulated)
      updateBalance('RIALO', parseFloat(rewards.claimable.replace(/,/g, '')));
      // Refresh
      setTimeout(loadRewards, 2000);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Claim failed';
      setToast({ message: msg, type: 'error' });
    } finally {
      setClaiming(false);
    }
  };

  // Bar chart heights for chart visual
  const barData = {
    '7D': [15, 30, 22, 45, 40, 65, 90],
    '30D': [20, 35, 25, 50, 45, 70, 90],
    'ALL': [5, 12, 20, 35, 50, 72, 90],
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased selection:bg-primary-container selection:text-white">
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-8 py-16">
        {/* Header */}
        <header className="mb-16">
          <h1 className="font-headline text-[3.5rem] font-extrabold text-primary leading-none tracking-tight mb-4">
            Ecosystem Rewards
          </h1>
          <p className="font-body text-on-surface/70 max-w-2xl">
            Precision-engineered value distribution. Track your accumulated earnings from the Rialo Layer 1 architecture and claim your architectural yield.
          </p>
        </header>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Total Earned */}
          <div className="bg-[#0c0c0c] rounded-2xl p-10 flex flex-col justify-between min-h-[260px] border border-white/5 shadow-2xl">
            <div>
              <span className="font-label text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-6 block">Total Cumulative Earned</span>
              <h2 className="font-headline text-[3.5rem] font-extrabold text-white leading-none">
                {loading ? <span className="animate-pulse">—</span> : rewards.totalEarned}{' '}
                <span className="text-white/10 text-2xl tracking-tighter block mt-2 font-body font-normal">RIALO</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+12.4% vs last month</span>
            </div>
          </div>

          {/* Claim Card */}
          <div className="bg-white rounded-2xl p-10 flex flex-col justify-between min-h-[260px] text-black shadow-2xl transition-transform hover:scale-[1.02]">
            <div>
              <span className="font-label text-[10px] text-black/40 uppercase tracking-[0.2em] font-bold mb-6 block">Available to Claim</span>
              <h2 className="font-headline text-[3.5rem] font-extrabold leading-none">
                {loading ? <span className="animate-pulse">—</span> : rewards.claimable}{' '}
                <span className="text-black/20 text-2xl tracking-tighter block mt-2 font-body font-normal">RIALO</span>
              </h2>
            </div>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-black text-white font-headline font-bold py-5 rounded-2xl hover:bg-black/90 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {claiming ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">autorenew</span>
                  Claiming…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  {isConnected ? 'Claim Rewards' : 'Connect Wallet'}
                </>
              )}
            </button>
          </div>

          {/* APY */}
          <div className="bg-[#0c0c0c] rounded-2xl p-10 flex flex-col justify-between min-h-[260px] border border-white/5 shadow-2xl">
            <div>
              <span className="font-label text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-6 block">Network Yield (APY)</span>
              <h2 className="font-headline text-[3.5rem] font-extrabold text-white leading-none">
                {loading ? <span className="animate-pulse">—</span> : `${rewards.apy}%`}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.4)]"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Node Status: Active</span>
            </div>
          </div>
        </div>

        {/* Charts + History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="font-headline font-bold text-primary text-lg">Earnings Trajectory</h3>
                <div className="flex gap-2">
                  {['7D', '30D', 'ALL'].map(r => (
                    <button
                      key={r}
                      onClick={() => setActiveRange(r)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase transition-colors ${
                        activeRange === r
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative h-[240px] w-full flex items-end gap-2">
                {(barData[activeRange] || barData['30D']).map((h, i) => (
                  <div
                    key={i}
                    className="rounded-t-lg transition-all duration-500 w-full cursor-pointer group relative"
                    style={{ height: `${h}%`, backgroundColor: `rgba(0,0,0,${0.05 + (h / 100) * 0.95})` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {(h * 10).toFixed(1)} RIALO
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">
                <span>Phase 01</span>
                <span>Phase 02</span>
                <span>Phase 03</span>
                <span>Current</span>
              </div>
            </div>
          </div>

          {/* Claim History */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-headline font-bold text-primary text-lg">Claim History</h3>
              <button onClick={loadRewards} className="text-on-surface/40 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
            <div className="space-y-4">
              {isConnected ? HISTORY.map((row, i) => (
                <div key={i} className="bg-surface-container-lowest p-5 rounded-xl flex items-center justify-between border border-outline-variant/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">download</span>
                    </div>
                    <div>
                      <p className="font-body font-semibold text-sm">Reward Claim</p>
                      <p className="font-body text-[10px] text-on-surface/50">{row.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-headline font-bold text-sm">{row.amount}</p>
                    <p className="font-body text-[10px] text-primary/60">{row.status}</p>
                  </div>
                </div>
              )) : (
                <div className="bg-surface-container-lowest p-8 rounded-xl text-center border border-outline-variant/5">
                  <span className="material-symbols-outlined text-on-surface/20 text-4xl mb-2 block">account_balance_wallet</span>
                  <p className="text-sm text-on-surface/40">Connect wallet to see claim history</p>
                  <button onClick={connect} className="mt-4 text-xs font-bold uppercase tracking-widest underline underline-offset-4 text-primary hover:opacity-70 transition-opacity">
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
