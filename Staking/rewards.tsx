"use client";

import { useState, useEffect } from "react";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useWallet } from '../hooks/useWallet';
import { useStaking } from '../hooks/useStaking';
import { useRouter } from 'next/router';
import { Droplet, Activity, Loader2, CheckCircle2, AlertCircle, Route, Flame, X, Gem } from "lucide-react";

export default function Rewards() {
  const router = useRouter();
  const { isConnected, address, provider, connect, addTransaction } = useWallet();
  const {
    pendingRewards: pendingRewStr,
    loading: stakingLoading,
    claimRewards: claimAction,
    fetchStakingData,
    globalRwaYieldUsd,
  } = useStaking();

  const [toast, setToast] = useState(null);
  const [claimingUSDC, setClaimingUSDC] = useState(false);
  const realPendingRewards = parseFloat(pendingRewStr || '0');

  // Redeem XAUt Modal State
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const XAUT_PRICE_USD = 2340.50;
  const redeemAmountNum = parseFloat(redeemAmount) || 0;
  // Max XAUt = globalRwaYieldUsd / XAUT_PRICE_USD (jika ada)
  const maxXautAmount = globalRwaYieldUsd > 0 ? (globalRwaYieldUsd / XAUT_PRICE_USD) : 0;
  const estimatedUsdc = redeemAmountNum * XAUT_PRICE_USD;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleClaim = async () => {
    if (!isConnected) { connect(); return; }
    if (realPendingRewards <= 0) {
      setToast({ message: "No rewards to claim", type: "error" });
      return;
    }
    try {
      const hash = await claimAction();
      addTransaction({ type: 'Claim', amount: `${realPendingRewards.toFixed(2)} RLO`, details: 'Claimed Staking Rewards', txHash: hash });
      setToast({ message: "Rewards claimed successfully!", type: "success", txHash: hash });
      if (address && provider) {
        fetchStakingData();
      }
    } catch (e) {
      setToast({ message: "Claim failed", type: "error" });
    }
  };

  const handleClaimUSDC = async () => {
    if (!isConnected) { connect(); return; }
    setClaimingUSDC(true);
    try {
      const signer = await provider.getSigner();
      const rwaAmount = globalRwaYieldUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const message = `Sign to claim $${rwaAmount} USDC to your wallet.`;
      const signature = await signer.signMessage(message);
      addTransaction({ type: 'Claim', amount: `${rwaAmount} USDC`, details: 'Claimed RWA Upfront Payout', txHash: signature.slice(0, 66) });
      setToast({ message: "USDC successfully claimed to wallet!", type: "success" });
    } catch (e: any) {
      if (e?.code === 4001 || e?.code === 'ACTION_REJECTED') {
        setToast({ message: "Signature rejected by user.", type: "error" });
      } else {
        setToast({ message: "USDC claim failed. Please try again.", type: "error" });
      }
    } finally {
      setClaimingUSDC(false);
    }
  };

  const handleRedeemSubmit = async () => {
    if (redeemAmountNum <= 0) {
      setToast({ message: 'Enter a valid XAUt amount to redeem.', type: 'error' });
      return;
    }
    setIsRedeeming(true);
    setTimeout(() => {
      setToast({ message: `Successfully burned ${redeemAmountNum.toFixed(6)} XAUt and claimed ~$${estimatedUsdc.toFixed(2)} USDC!`, type: 'success' });
      // Reset global RWA yield setelah redeem
      if (typeof (window as any).__setGlobalRwaYieldUsd === 'function') {
        (window as any).__setGlobalRwaYieldUsd(0);
      }
      setIsRedeeming(false);
      setIsRedeemModalOpen(false);
      setRedeemAmount('');
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-white text-black font-body antialiased selection:bg-primary/30 flex flex-col relative">

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <Navbar />

      <div className="max-w-5xl mx-auto flex-grow w-full mt-10 md:mt-24 px-4">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="text-center mb-16">
            <h1 className="text-5xl font-headline font-extrabold mb-4 tracking-tighter text-black">Ecosystem Rewards</h1>
            <p className="text-gray-600 max-w-xl mx-auto font-medium">Manage and claim your generated yield and SfS Service Credits.</p>
          </div>

          {/* Top Cards Grid: 3 Columns — order: Yield | RWA | Credits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-8">

            {/* Card 1: Available Yield (RLO) */}
            <div className="bg-[#0c0c0c] rounded-2xl p-8 shadow-2xl border border-white/5 relative overflow-hidden group transition-all duration-500 flex flex-col h-full min-h-[260px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
              <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] font-label mb-6">
                Available Yield
              </h3>
              <div className="flex flex-col mt-auto mb-8">
                <div className="flex flex-row items-baseline gap-2 text-5xl md:text-6xl font-headline font-extrabold text-white leading-none tracking-tighter">
                  {realPendingRewards.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xl md:text-2xl text-white/20 font-bold">stRLO</span>
                </div>
                <div className="text-white/20 font-bold uppercase tracking-widest text-[10px] mt-4">
                  ≈ ${(realPendingRewards * 3).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
              </div>
              <button
                onClick={handleClaim}
                disabled={stakingLoading}
                className="w-full mt-auto bg-white text-black py-5 rounded-2xl font-headline font-extrabold text-lg tracking-tight hover:bg-white/90 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50"
              >
                {stakingLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Claim to Wallet'}
              </button>
            </div>

            {/* Card 2: RWA Portfolio — Simplified */}
            <div className="bg-[#0c0c0c] rounded-2xl p-8 shadow-2xl border border-emerald-500/10 relative overflow-hidden group transition-all duration-500 flex flex-col h-full min-h-[260px]">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-60 pointer-events-none"></div>

              {/* Header label */}
              <h3 className="text-emerald-500/50 text-[10px] font-bold uppercase tracking-[0.2em] font-label mb-6">
                RWA Portfolio
              </h3>

              {/* Main number */}
              <div className="flex flex-col mt-auto mb-8">
                <div className="text-5xl md:text-6xl font-headline font-extrabold text-white leading-none tracking-tighter">
                  ${globalRwaYieldUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xl md:text-2xl text-white/20 font-bold ml-1">USD</span>
                </div>
                <div className="text-emerald-500/40 font-bold uppercase tracking-widest text-[10px] mt-4">
                  Upfront Payout · USDC
                </div>
              </div>

              {/* Dual Action Buttons */}
              <div className="flex gap-3 mt-auto">
                {/* Tombol Kiri: Explore RWA Hub */}
                <button
                  onClick={() => router.push('/staking?view=rwa')}
                  className="flex-1 py-4 rounded-2xl font-headline font-extrabold text-sm tracking-tight bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
                >
                  Explore RWA Hub
                </button>

                {/* Tombol Kanan: Redeem XAUt */}
                <button
                  onClick={() => setIsRedeemModalOpen(true)}
                  disabled={globalRwaYieldUsd <= 0}
                  className={`flex-1 py-4 rounded-2xl font-headline font-extrabold text-sm tracking-tight border active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 ${
                    globalRwaYieldUsd > 0
                      ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400'
                      : 'border-white/10 text-white/20 cursor-not-allowed'
                  }`}
                >
                  <Gem className="w-4 h-4" />
                  Redeem XAUt
                </button>
              </div>
            </div>

            {/* Card 3: Accumulated Credits */}
            <div className="bg-[#0c0c0c] rounded-2xl p-8 shadow-2xl border border-white/5 relative overflow-hidden group transition-all duration-500 flex flex-col h-full min-h-[260px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
              <h3 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] font-label mb-6">
                Accumulated Credits
              </h3>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-5xl md:text-6xl font-headline font-extrabold text-white leading-none tracking-tighter">
                  1,250.00
                </div>
                <div className="text-white/20 font-bold uppercase tracking-widest text-[10px] mt-4">
                  Ready for Zero-Gas Transactions
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Section: Yield Breakdown Table */}
          <div className="mt-12 bg-[#0c0c0c] rounded-2xl border border-white/10 overflow-hidden text-white">
            <div className="p-8 border-b border-white/5">
              <h2 className="text-xl font-headline font-extrabold tracking-tighter text-white">Yield Breakdown</h2>
            </div>
            <div className="flex flex-col divide-y divide-white/5">

              <div className="flex items-center justify-between p-6 hover:bg-white/3 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 font-label">Single RLO Staking</span>
                <span className="font-headline font-extrabold text-lg text-primary">+80.00 RLO</span>
              </div>

              <div className="flex items-center justify-between p-6 hover:bg-white/3 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 font-label">Pair (RLO + ETH)</span>
                <span className="font-headline font-extrabold text-lg text-primary">+45.50 RLO</span>
              </div>

              <div className="flex items-center justify-between p-6 hover:bg-white/3 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 font-label">Upfront RWA Payout</span>
                <span className="font-headline font-extrabold text-lg text-emerald-400">+${globalRwaYieldUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
              </div>

              <div className="flex items-center justify-between p-6 hover:bg-white/3 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 font-label">SfS Routing Fee</span>
                <span className="font-headline font-extrabold text-lg text-red-400">-550.00 Credits</span>
              </div>
            </div>
          </div>

          {/* RWA Hub Banner */}
          <div className="mt-8 bg-[#0c0c0c] rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24 blur-[80px] opacity-60 pointer-events-none"></div>
            <div className="flex-1 space-y-2 text-center md:text-left relative z-10">
              <h2 className="text-2xl md:text-3xl font-headline font-extrabold tracking-tighter text-white leading-tight">
                RWA Hub 🌍
              </h2>
              <p className="text-white/40 text-sm font-medium max-w-xl">
                Diversify your remaining RLO staking yield into Real-World Assets. Zero exposure to crypto volatility with institutional-grade stability.
              </p>
            </div>
            <div className="shrink-0 relative z-10">
              <button
                onClick={() => router.push('/staking?view=rwa')}
                className="bg-white text-black px-8 py-4 rounded-2xl font-headline font-extrabold text-base tracking-tight hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl"
              >
                Explore RWA
              </button>
            </div>
          </div>

          <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-[0.2em] py-20">
            Note: All yield is calculated in real-time on Sepolia Testnet. Payouts are subject to staking tiers and selected lock-ups.
          </p>

        </div>
      </div>

      <Footer />

      {/* ── Redeem XAUt Modal ──────────────────────────────────────────── */}
      {isRedeemModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsRedeemModalOpen(false); }}
        >
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-headline font-extrabold text-white tracking-tight">Redeem XAUt</h2>
                <p className="text-white/30 text-xs font-medium mt-0.5">Burn XAUt · Receive USDC</p>
              </div>
              <button
                onClick={() => setIsRedeemModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rate Info */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
              <span className="text-yellow-400/70 text-[11px] font-bold uppercase tracking-wider">Current Rate</span>
              <span className="text-yellow-400 font-headline font-bold text-sm">1 XAUt = $2,340.50 USDC</span>
            </div>

            {/* Input Field */}
            <div className="mb-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label mb-2 block">Amount to Redeem</label>
              <div className="bg-[#161616] rounded-2xl px-5 py-4 border border-white/5 flex items-center gap-3">
                <input
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="0.000000"
                  min="0"
                  step="0.000001"
                  className="bg-transparent text-2xl font-bold text-white outline-none w-full placeholder-white/10"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRedeemAmount(maxXautAmount.toFixed(6))}
                    className="text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/20 transition-all"
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1.5 bg-[#111111] rounded-lg px-2.5 py-1.5 border border-yellow-500/20">
                    <Gem className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-sm text-yellow-400/90">XAUt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* USDC Estimate */}
            <div className="text-right mb-6">
              {redeemAmountNum > 0 ? (
                <span className="text-white/60 text-sm font-medium">
                  You will receive: <span className="text-emerald-400 font-bold">
                    ~${estimatedUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </span>
                </span>
              ) : (
                <span className="text-white/20 text-xs font-medium">Enter amount to see USDC estimate</span>
              )}
            </div>

            {/* Portfolio Balance Info */}
            <div className="bg-white/3 rounded-xl px-4 py-3 mb-6 flex justify-between items-center">
              <span className="text-white/30 text-[11px] font-medium">Your XAUt Balance</span>
              <span className="text-white/60 font-bold text-sm">{maxXautAmount.toFixed(6)} XAUt</span>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleRedeemSubmit}
              disabled={isRedeeming || redeemAmountNum <= 0 || redeemAmountNum > maxXautAmount + 0.0001}
              className="w-full py-5 rounded-2xl font-headline font-extrabold text-lg tracking-tight bg-gradient-to-r from-yellow-500 to-amber-400 text-black hover:from-yellow-400 hover:to-amber-300 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRedeeming ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing Burn..></>
              ) : (
                <><Flame className="w-5 h-5" /> Burn XAUt &amp; Claim USDC</>
              )}
            </button>

            <p className="text-center text-white/20 text-[10px] font-medium mt-4">
              This action is irreversible. XAUt will be permanently burned.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
