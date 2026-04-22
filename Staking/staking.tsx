"use client";

import { useState, useEffect } from "react";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useWallet } from '../hooks/useWallet';
import { useRLO } from '../hooks/useRLO';
import { useStaking } from '../hooks/useStaking';
import { useRouter } from 'next/router';
import { Droplet, Info, Route, Plus, Activity, Loader2, CheckCircle2, AlertCircle, CreditCard, Landmark, Building2, ArrowRight, ArrowUpDown, Flame } from "lucide-react";

type Path = {
  address: string;
  amount: number;
};

type AssetType = 'solo_rlo' | 'pair' | 'solo_eth';
type PayoutType = 'rlo' | 'rwa';

export default function Home() {
  const router = useRouter();
  const { isConnected, address, provider, connect, balances: walletBalances, addTransaction, fetchEthBalance, updateBalance } = useWallet();
  const { balance: rloBal, fetchBalance: fetchRloBalance } = useRLO();
  const { 
    stakedBalance: stakedBalStr, 
    stakedEthBalance: stakedEthBalStr,
    pendingRewards: pendingRewStr, 
    totalStaked: totalProtStakedStr, 
    sfsFraction: contractSfsFraction,
    rwaAllocation: contractRwaAllocation,
    rwaTarget: contractRwaTarget,
    loading: stakingLoading, 
    stakeRlo,
    stakeEth,
    stakePair,
    withdraw, 
    withdrawAmount,
    claimRewards: claimAction,
    updateSfsFraction,
    updateRwaAllocation,
    fetchStakingData
  } = useStaking();

  const { sessionActive, activateSession, seedSession, showToast: walletToast } = useWallet();

  const [rloAmount, setRloAmount] = useState<string>("");
  const [ethAmount, setEthAmount] = useState<string>("0");
  const [assetType, setAssetType] = useState<AssetType>('solo_rlo');
  const [payoutType, setPayoutType] = useState<PayoutType>('rlo');
  const [sfsFraction, setSfsFraction] = useState<number>(50);
  const [lockDuration, setLockDuration] = useState<number>(1);
  const [isStaking, setIsStaking] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'stake' | 'rwa'>('stake');
  const [rwaRouter, setRwaRouter] = useState<number>(0);
  const [rwaTarget, setRwaTarget] = useState<string>('treasury');
  const [selectedRwaTarget, setSelectedRwaTarget] = useState('treasuries');
  const [rwaStats, setRwaStats] = useState({ total: 0, apy: 0 });
  const [isSavingRoute, setIsSavingRoute] = useState<boolean>(false);
  const [routeSaved, setRouteSaved] = useState<boolean>(false);
  
  // Real values mapping
  const realStakedBalance = parseFloat(stakedBalStr || '0');
  const realPendingRewards = parseFloat(pendingRewStr || '0');
  const realTotalProtocolStaked = parseFloat(totalProtStakedStr || '1450200');

  useEffect(() => {
    if (contractSfsFraction > 0) {
      setSfsFraction(contractSfsFraction * 100);
    }
  }, [contractSfsFraction]);

  // Deep linking logic for RWA Hub
  useEffect(() => {
    if (router.query.view === 'rwa') {
      setActiveView('rwa');
    } else if (router.query.view === 'stake') {
      setActiveView('stake');
    }
  }, [router.query.view]);

  // Enforce Solo ETH constraints
  useEffect(() => {
    if (assetType === 'solo_eth') {
      setPayoutType('rlo');
    }
  }, [assetType]);
  
  // Interactive States
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const totalStaked = realTotalProtocolStaked;

  // RWA LIVE PRICES STATE
  const [rwaPrices, setRwaPrices] = useState({
    gold: 2340.50,
    goldChange: 1.2,
    treasury: 1.02,
    treasuryChange: 0.01,
    realEstate: 50.25,
    realEstateChange: 0.4
  });

  const realStakedEthBalance = parseFloat(stakedEthBalStr || '0');

  useEffect(() => {
    if (contractRwaAllocation > 0) {
      setRwaRouter(contractRwaAllocation * 100);
      if (contractRwaTarget) {
        setRwaTarget(contractRwaTarget);
      }
    }
  }, [contractRwaAllocation, contractRwaTarget]);

  // Simplify Actions State
  const [isExploringRwa, setIsExploringRwa] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Clear toast after 3s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleStake = async () => {
    if (!isConnected) { connect(); return; }
    
    setIsSimulating(true);
    try {
      if (isStaking) {
        if (assetType === 'solo_rlo') {
            if (numRlo < 10) { setToast({ message: "Min 10 RLO", type: "error" }); setIsSimulating(false); return; }
            const hash = await stakeRlo(numRlo.toString(), lockDuration);
            addTransaction({ type: 'Stake', amount: `${numRlo.toLocaleString('en-US')} RLO`, details: 'Staked RLO (Solo)', txHash: hash });
            setToast({ message: `Successfully staked ${numRlo.toLocaleString('en-US')} RLO!`, type: "success", txHash: hash });
        } else if (assetType === 'solo_eth') {
            if (numEth <= 0) { setToast({ message: "Invalid ETH Amount", type: "error" }); setIsSimulating(false); return; }
            const hash = await stakeEth(numEth.toString(), lockDuration);
            addTransaction({ type: 'Stake', amount: `${numEth} ETH`, details: 'Staked ETH (Solo)', txHash: hash });
            setToast({ message: `Successfully staked ${numEth} ETH!`, type: "success", txHash: hash });
        } else if (assetType === 'pair') {
            if (numRlo < 10 || numEth <= 0) { setToast({ message: "Invalid Pair Amount", type: "error" }); setIsSimulating(false); return; }
            const hash = await stakePair(numRlo.toString(), numEth.toString(), lockDuration);
            addTransaction({ type: 'Stake', amount: 'LP Pair', details: `Staked ${numRlo} RLO + ${numEth} ETH`, txHash: hash });
            setToast({ message: `Successfully staked Pair!`, type: "success", txHash: hash });
        }
        setRloAmount("");
        setEthAmount("0");
      } else {
        if (realStakedBalance <= 0 && realStakedEthBalance <= 0) {
          setToast({ message: "No assets staked", type: "error" });
          setIsSimulating(false);
          return;
        }
        const hash = await withdraw();
        addTransaction({ type: 'Unstake', amount: 'All Assets', details: 'Unstaked RLO/ETH', txHash: hash });
        setToast({ message: `Successfully unstaked!`, type: "success", txHash: hash });
      }
      
      if (address && provider) {
        fetchEthBalance(address, provider);
        fetchRloBalance();
        fetchStakingData();
      }
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes('user rejected') || msg.includes('4001')) {
        setToast({ message: "Transaction rejected in MetaMask.", type: "error" });
      } else {
        setToast({ message: `${isStaking ? 'Staking' : 'Unstaking'} failed. ${msg.slice(0, 60)}${msg.length > 60 ? '...' : ''}`, type: "error" });
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleUpdateRwa = async () => {
    if (!isConnected) { connect(); return; }
    setIsSavingRoute(true);
    try {
      await updateRwaAllocation(rwaTarget, rwaRouter / 100);
      setToast({ message: `RWA Yield routing saved!`, type: "success" });
      setRouteSaved(true);
    } catch(e) {
      setToast({ message: `Failed to save RWA route.`, type: "error" });
    } finally {
      setIsSavingRoute(false);
    }
  };

  const handleClaim = async () => {
    if (!isConnected) { connect(); return; }
    if (realPendingRewards <= 0) {
      setToast({ message: "No rewards to claim", type: "error" });
      return;
    }
    try {
      const hash = await claimAction();
      setToast({ message: "Rewards claimed successfully!", type: "success", txHash: hash });
      if (address && provider) {
        fetchEthBalance(address, provider);
        fetchRloBalance();
        fetchStakingData();
      }
    } catch (e) {
      setToast({ message: "Claim failed", type: "error" });
    }
  };

  const handleConfigureAI = async () => {
    if (!isConnected) { connect(); return; }
    try {
      setToast({ message: "Activating AI Session...", type: "info" });
      await activateSession(24); // 24 hour session
      setToast({ message: "AI Agent Session Active!", type: "success" });
    } catch (e) {
      setToast({ message: "Failed to activate AI session", type: "error" });
    }
  };

  const handleExploreRwa = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setActiveView('rwa');
  };

  const numRlo = parseFloat(rloAmount) || 0;
  const numEth = parseFloat(ethAmount) || 0;
  const ethToRloRatio = 2000;
  
  let effectivePrincipal = numRlo;
  if (assetType === 'pair') effectivePrincipal = numRlo + (numEth * ethToRloRatio);
  else if (assetType === 'solo_eth') effectivePrincipal = numEth * ethToRloRatio;

  const baseApy = payoutType === 'rwa' ? 0.08 : 0.12;
  
  let assetMultiplier = 1; let creditsMultiplier = 1;
  if (assetType === 'solo_rlo') { assetMultiplier = 1; creditsMultiplier = 1; } 
  else if (assetType === 'pair') { assetMultiplier = 0.75; creditsMultiplier = 0.6; } 
  else if (assetType === 'solo_eth') { assetMultiplier = 0.3; creditsMultiplier = 0.2; }

  const networkApy = (baseApy + ((lockDuration - 1) / 47) * 0.10) * assetMultiplier;
  const totalYield = (effectivePrincipal * networkApy) * (lockDuration / 12);
  
  const yieldAllocatedToSfS = totalYield * (sfsFraction / 100) * creditsMultiplier;
  const rawYieldToServiceCredits = yieldAllocatedToSfS * 1000;
  const yieldToWallet = totalYield - yieldAllocatedToSfS;
  const availableServiceCredits = Math.max(0, rawYieldToServiceCredits);

  return (
    <main className="min-h-screen bg-white text-black font-body antialiased flex flex-col relative">
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <Navbar />



      <div className="max-w-7xl mx-auto flex-grow w-full mt-10 md:mt-16 px-4">
        {activeView === 'stake' ? (
          <>
            {/* Centered Single Column Layout */}
            <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
              
              {/* Header 1 (Stake Assets) */}
              <div className="text-center mb-6 lg:mb-12 min-h-[auto] lg:min-h-[120px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100 w-full">
                <h1 className="text-5xl font-headline font-extrabold mb-4 tracking-tighter text-black">Stake Assets</h1>
                <p className="text-gray-600 max-w-xl mx-auto font-medium">Stake RLO or ETH to mint yield-bearing assets and auto-generate credits for a completely gasless experience.</p>
              </div>

              {/* Card (Stake Assets) */}
              <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 mb-12 lg:mb-0">
                <div className="bg-[#0c0c0c] rounded-3xl border border-gray-800 p-6 md:p-8 text-white relative overflow-hidden group/card transition-all duration-500 h-full min-h-[650px] flex flex-col shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-90"></div>

              {/* Tab Toggle Container */}
              <div className="flex bg-[#161616] rounded-2xl p-1 mb-8 border border-white/5 shadow-inner relative">
                <button 
                  onClick={() => setIsStaking(true)} 
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all z-10 ${isStaking ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                >
                  Stake
                </button>
                <button 
                  onClick={() => setIsStaking(false)} 
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all z-10 ${!isStaking ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                >
                  Unstake
                </button>
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#222222] border border-white/10 rounded-xl transition-transform duration-300 ease-out shadow-md ${isStaking ? 'left-1 translate-x-0' : 'left-1 translate-x-full ml-1'}`}></div>
              </div>

              {isStaking ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Asset Selection */}
                  <div className="mb-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label mb-3 block">Select Asset Tier</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Card 1 */}
                      <button 
                        onClick={() => setAssetType('solo_rlo')}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-1.5 ${assetType === 'solo_rlo' ? 'bg-[#161616] border-white/20 shadow-inner' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                      >
                        <span className={`font-bold text-sm ${assetType === 'solo_rlo' ? 'text-white' : 'text-white/40'}`}>Single RLO</span>
                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Max Yield</span>
                      </button>
                      
                      {/* Card 2 */}
                      <button 
                        onClick={() => setAssetType('pair')}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-1.5 ${assetType === 'pair' ? 'bg-[#161616] border-white/20 shadow-inner' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                      >
                        <span className={`font-bold text-sm ${assetType === 'pair' ? 'text-white' : 'text-white/40'}`}>Pair (RLO+ETH)</span>
                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Balanced</span>
                      </button>
 
                      {/* Card 3 */}
                      <button 
                        onClick={() => setAssetType('solo_eth')}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-1.5 ${assetType === 'solo_eth' ? 'bg-[#161616] border-white/20 shadow-inner' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                      >
                        <span className={`font-bold text-sm ${assetType === 'solo_eth' ? 'text-white' : 'text-white/40'}`}>Single ETH</span>
                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Base Tier</span>
                      </button>
                    </div>
                  </div>

                  {/* Amount Inputs */}
                  <div className={`grid gap-3 mb-6 ${assetType === 'pair' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {assetType !== 'solo_eth' && (
                      <div className="bg-[#161616] rounded-2xl p-5 border border-white/5 shadow-inner transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label">RLO Amount</span>
                          <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">Balance: {parseFloat(rloBal || '0').toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3">
                          <div className="w-full">
                            <input
                              type="number"
                              value={rloAmount}
                              onChange={(e) => setRloAmount(e.target.value)}
                              className="bg-transparent text-2xl md:text-3xl font-bold text-white outline-none w-full placeholder-slate-700"
                              placeholder="0.0"
                            />
                            <div className="text-[11px] text-white/50 font-medium mt-1">≈ ${((parseFloat(rloAmount) || 0) * 1).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {assetType === 'solo_rlo' && (
                              <button 
                                onClick={() => setRloAmount(rloBal || "0")} 
                                className="text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md border border-white/20"
                              >
                                MAX
                              </button>
                            )}
                            <div className="flex items-center gap-1.5 bg-[#111111] rounded-lg px-2.5 py-1.5 border border-white/20 shadow-sm">
                              <Droplet className="w-4 h-4 text-white fill-white/20" />
                              <span className="font-bold text-sm text-white/90">RLO</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {assetType !== 'solo_rlo' && (
                      <div className="bg-[#161616] rounded-2xl p-5 border border-white/5 shadow-inner transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label">ETH Amount</span>
                          <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">Balance: {walletBalances['ETH']?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3">
                          <div className="w-full">
                            <input
                              type="number"
                              value={ethAmount}
                              onChange={(e) => setEthAmount(e.target.value)}
                              className="bg-transparent text-3xl font-headline font-bold text-white outline-none w-full placeholder:text-white/5"
                              placeholder="0.0"
                            />
                            <div className="text-[10px] text-white/20 font-bold uppercase tracking-wider mt-1">≈ ${((parseFloat(ethAmount) || 0) * 2000).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-[#111111] rounded-lg px-2.5 py-1.5 border border-white/20 shadow-sm">
                              <div className="w-4 h-4 rounded-full bg-white/20 border border-white/50 flex items-center justify-center text-white text-[9px] font-bold">Ξ</div>
                              <span className="font-bold text-sm text-white/90">ETH</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lock Duration Slider */}
                  <div className="bg-[#161616] rounded-2xl p-6 mb-6 border border-white/5 shadow-inner relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label">
                        Lock Duration (Multiplier)
                      </span>
                      <span className="font-headline font-bold text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-md text-xs">
                        {lockDuration} Month{lockDuration > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="relative z-10 px-1">
                      <input 
                        type="range" 
                        min="1" 
                        max="48" 
                        value={lockDuration} 
                        onChange={(e) => setLockDuration(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                      />
                      <div className="flex justify-between text-[10px] text-white/20 mt-3 font-bold uppercase tracking-wider">
                        <span>1M</span>
                        <span>48M (Max Boost)</span>
                      </div>
                    </div>
                  </div>

                  {/* Yield Payout Selection */}
                  <div className="mb-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label mb-3 block">Yield Payout Preference</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                      {assetType === 'solo_eth' && false && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center border border-white/5">
                          <span className="bg-white/5 border border-white/10 text-white/40 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                            RWA Selection Locked
                          </span>
                        </div>
                      )}
                      <button 
                        onClick={() => setPayoutType('rlo')}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-1.5 ${payoutType === 'rlo' && assetType !== 'solo_eth' ? 'bg-[#161616] border-white/20 shadow-inner' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-white text-sm">Payout in RLO</span>
                          <span className="text-white text-[10px] font-bold bg-white/10 border border-white/20 px-2 py-0.5 rounded uppercase tracking-wider">High APY</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => {
                          if (assetType !== 'solo_eth') setPayoutType('rwa');
                        }}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-1.5 ${payoutType === 'rwa' && assetType !== 'solo_eth' ? 'bg-[#161616] border-white/20 shadow-inner' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-white text-sm">Payout in RWA</span>
                          <span className="text-white text-[10px] font-bold bg-white/10 border border-white/20 px-2 py-0.5 rounded uppercase tracking-wider">Stable</span>
                        </div>
                      </button>
                    </div>
                    {payoutType === 'rwa' && assetType !== 'solo_eth' && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-sm text-white/60 mb-2 block">Select Target Asset:</label>
                        <div className="flex flex-row flex-wrap gap-3 mb-3">
                          <button
                            disabled
                            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border bg-transparent border-white/10 text-white/40 opacity-50 cursor-not-allowed pointer-events-none flex items-center gap-1.5"
                          >
                            🏛️ Treasuries
                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Coming Soon</span>
                          </button>
                          <button
                            disabled
                            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border bg-transparent border-white/10 text-white/40 opacity-50 cursor-not-allowed pointer-events-none flex items-center gap-1.5"
                          >
                            🏢 Real Estate
                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Coming Soon</span>
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); setRwaTarget('gold'); router.push('/staking?view=rwa'); }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${rwaTarget === 'gold' ? 'bg-[#222222]/50 border-white text-white shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-transparent border-white/20/80 text-white/60 hover:border-slate-500'}`}
                          >
                            🪙 Gold
                          </button>
                        </div>
                        <p className="text-[11px] text-white/80 flex items-start gap-1.5 leading-snug font-medium bg-white/5 p-2.5 rounded-lg border border-white/10">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white" />
                          Note: RWA Yield is projected based on locked-in protocol revenue share, ensuring sustainable asset conversion.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <button 
                      onClick={handleStake}
                      disabled={isSimulating}
                      className="w-full bg-white text-black py-5 rounded-2xl font-headline font-extrabold text-lg tracking-tight hover:bg-white/90 active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" /> Simulating...
                        </span>
                      ) : (
                        "Stake"
                      )}
                    </button>
                  </div>


                  <div className="bg-[#161616] rounded-2xl p-6 mb-8 border border-white/5 shadow-inner relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label">
                        SfS Routing Fraction
                      </span>
                      <span className="font-headline font-bold text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-md text-xs">
                        {sfsFraction}%
                      </span>
                    </div>
                    
                    <div className="relative z-10 px-1">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={sfsFraction} 
                        onChange={(e) => setSfsFraction(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                      />
                      <div className="flex justify-between text-[10px] text-white/20 mt-3 font-bold uppercase tracking-wider">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-sm px-2">
                    <div className="flex justify-between items-start text-white/80">
                      <span className="text-white/60 font-medium">You will receive</span>
                      <div className="flex flex-col items-end gap-1">
                        {assetType !== 'solo_eth' && <span className="font-semibold text-[14px] bg-[#111111] px-2 py-0.5 rounded border border-white/10">{numRlo.toLocaleString('en-US')} stRLO</span>}
                        {assetType !== 'solo_rlo' && <span className="font-semibold text-[14px] text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">{numEth.toLocaleString('en-US')} stETH</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-white/80">
                      <span className="text-white/60 font-medium">Estimated APY</span>
                      <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-[13px]">{ (networkApy * 100).toFixed(2).replace(/\.00$/, '') }%</span>
                    </div>
                    
                    <div className="h-px bg-[#222222]/80 my-3 w-full"></div>
                    
                    <div className="flex justify-between text-white/80 items-center">
                      <span className="text-white/60 flex items-center group cursor-help font-medium">
                        Yield to Wallet
                        <Info className="w-3.5 h-3.5 ml-1.5 text-white/40 group-hover:text-white/60 transition-colors" />
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-white tracking-wide flex items-center">
                          {payoutType === 'rwa' ? '$' : ''}{yieldToWallet.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-white/50 text-xs ml-1 mr-1.5">{payoutType === 'rwa' ? 'USD (RWA)' : (assetType === 'solo_eth' ? 'ETH' : 'RLO')}</span>
                          {payoutType !== 'rwa' && (
                             <span className="text-white/50 font-medium text-[11px]">(≈ ${(assetType === 'solo_eth' ? yieldToWallet * 2000 : yieldToWallet * 1).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                          )}
                        </span>
                        <span className="text-white/50 text-[10px] mt-0.5">(Total over {lockDuration} month{lockDuration > 1 ? 's' : ''})</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-white/80 items-center">
                      <span className="text-white/60 flex items-center group cursor-help font-medium">
                        Total Yield Router
                        <Info className="w-3.5 h-3.5 ml-1.5 text-white/40 group-hover:text-white/60 transition-colors" />
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-white tracking-wide drop-shadow-sm">
                          {rawYieldToServiceCredits.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-white/60 text-xs ml-0.5">Credits</span>
                        </span>
                        <span className="text-white/50 text-[10px] mt-0.5">(Total over {lockDuration} month{lockDuration > 1 ? 's' : ''})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center min-h-[500px]">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <p className="text-white/60 font-medium">Your Locked Balance</p>
                    <button
                      onClick={() => fetchStakingData()}
                      title="Refresh balance"
                      className="text-white/30 hover:text-white transition-colors"
                    >
                      <Loader2 className={`w-4 h-4 ${stakingLoading ? 'animate-spin text-white' : ''}`} />
                    </button>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-sm tracking-tight">
                    {realStakedBalance.toLocaleString('en-US')} <span className="text-xl text-white/50 font-bold ml-1">RLO</span>
                  </h2>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 drop-shadow-sm tracking-tight">
                    {realStakedEthBalance.toLocaleString('en-US')} <span className="text-xl text-white/50 font-bold ml-1">ETH</span>
                  </h2>
                  
                  <div className="inline-flex items-center gap-2 bg-[#161616] border border-white/10 px-5 py-2.5 rounded-xl mb-12 shadow-inner">
                    <AlertCircle className="w-4 h-4 text-white/60" />
                    <span className="text-sm font-semibold text-white/60">
                      {lockDuration > 0 ? 'Unlock Status: 🔒 Locked (Duration not met)' : 'Unlock Status: 🔓 Flexible (Ready to Unstake)'}
                    </span>
                  </div>

                  <div className="w-full mt-auto">
                    <button 
                      onClick={handleStake}
                      disabled={isSimulating || lockDuration > 0}
                      className={`w-full font-bold py-4 rounded-2xl transition-all border border-transparent text-[1.05rem] flex justify-center items-center gap-2 ${
                        lockDuration > 0 
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                          : 'shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] bg-slate-900 hover:bg-slate-800 text-white hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                    >
                      {isSimulating ? <Loader2 className="w-5 h-5 animate-spin" /> : (lockDuration > 0 ? 'Assets Locked' : 'Initiate Unstaking')}
                    </button>
                    <p className="text-center text-[11.5px] font-medium text-white/70 mt-3 animate-in fade-in">
                      Note: Withdrawals revert if lock duration has not ended.
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </>
        ) : (
          <div className="bg-white text-black py-16 md:py-24 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300 w-full rounded-b-3xl">
            
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-headline font-extrabold mb-4 tracking-tighter text-black">RWA Hub 🌍</h1>
              <p className="text-gray-600 max-w-xl mx-auto font-medium px-4">Automatically diversify your yield into stable, institutional-grade real-world assets.</p>
              <button 
                onClick={() => router.push('/rewards')}
                className="mt-6 px-5 py-2.5 bg-white text-black border border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded-xl transition-all font-medium flex items-center justify-center gap-2 mx-auto shadow-sm text-sm"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Return to Reward
              </button>
            </div>

            <div className="w-full max-w-3xl flex flex-col gap-6 px-4">
              
              {/* Top Stats Card */}
              <div className="bg-[#0c0c0c] text-white rounded-2xl p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-10 justify-between items-center w-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[100px] opacity-50"></div>
                <div className="flex flex-col flex-1 shrink-0 z-10 w-full text-center md:text-left">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label mb-3">Total Portfolio Value</span>
                  <div className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter">
                    ${rwaStats.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="flex flex-col flex-1 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-10 w-full z-10 text-center md:text-left">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 font-label mb-3">Average Yield</span>
                  <div className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter">
                    {rwaStats.apy.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Asset List (Stack Vertical) */}
              <div className="space-y-4 w-full mt-4">
                {/* US Treasuries */}
                <div className="cursor-not-allowed bg-gray-50 rounded-2xl p-6 border border-gray-200 flex items-center justify-between gap-4 w-full opacity-60">
                   <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-400">
                       <Landmark className="w-6 h-6" />
                     </div>
                     <div>
                       <h3 className="font-headline font-bold text-gray-400 text-lg tracking-tight">
                         US Treasuries <span className="text-[10px] text-gray-400/60 ml-2 uppercase tracking-widest">tBILL</span>
                       </h3>
                     </div>
                   </div>
                   <div>
                     <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider bg-gray-200 px-3 py-1 rounded-md">Coming Soon</span>
                   </div>
                </div>

                {/* Real Estate */}
                <div className="cursor-not-allowed bg-gray-50 rounded-2xl p-6 border border-gray-200 flex items-center justify-between gap-4 w-full opacity-60">
                   <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-400">
                       <Building2 className="w-6 h-6" />
                     </div>
                     <div>
                       <h3 className="font-headline font-bold text-gray-400 text-lg tracking-tight">
                         Real Estate <span className="text-[10px] text-gray-400/60 ml-2 uppercase tracking-widest">rEST</span>
                       </h3>
                     </div>
                   </div>
                   <div>
                     <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider bg-gray-200 px-3 py-1 rounded-md">Coming Soon</span>
                   </div>
                </div>

                {/* Tokenized Gold XAUt */}
                <div className="cursor-pointer transition-all duration-300 bg-[#0c0c0c] rounded-2xl p-6 border border-black shadow-2xl flex items-center justify-between gap-4 w-full transform md:scale-[1.02]">
                   <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-yellow-400 bg-yellow-500/10">
                       <Flame className="w-6 h-6" />
                     </div>
                     <div>
                       <h3 className="font-headline font-bold text-white text-lg tracking-tight">
                         Tokenized Gold <span className="text-[10px] text-white/50 ml-2 uppercase tracking-widest">XAUt</span>
                       </h3>
                       <div className="flex items-center mt-2">
                         <span className="text-black font-bold text-[10px] uppercase tracking-wider bg-white px-2 py-0.5 rounded">Safe Haven</span>
                       </div>
                     </div>
                   </div>
                   <div className="w-6 h-6 shrink-0 rounded-full border flex items-center justify-center transition-all border-white bg-white shadow-xl">
                     <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                   </div>
                </div>
              </div>

              {/* Allocation Card */}
              <div className="bg-[#0c0c0c] rounded-2xl p-8 md:p-10 mt-6 border border-black shadow-2xl flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 font-label">
                    Allocation Amount
                  </span>
                  <span className="font-headline font-bold text-black bg-white px-3 py-1.5 rounded-lg text-sm">
                    {rwaRouter}%
                  </span>
                </div>
                
                <div className="w-full px-1 mb-10">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={rwaRouter} 
                    onChange={(e) => setRwaRouter(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 mt-4 font-bold uppercase tracking-wider">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="w-full">
                  <button 
                    onClick={handleUpdateRwa}
                    disabled={isSavingRoute || routeSaved}
                    className="w-full bg-white text-black py-4 md:py-5 rounded-xl font-headline font-extrabold text-base tracking-tight hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-80"
                  >
                    {isSavingRoute ? 'Confirming...' : routeSaved ? 'Portfolio Fully Allocated ✓' : 'Confirm Allocation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
