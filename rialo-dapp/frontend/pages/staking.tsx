"use client";

import { useState, useEffect } from "react";
import { Droplet, Info, Route, Plus, Activity, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Path = {
  address: string;
  amount: number;
};

export default function Home() {
  const [rloAmount, setRloAmount] = useState<string>("1000");
  const [sfsFraction, setSfsFraction] = useState<number>(25);
  
  // Interactive States
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [isAddingPath, setIsAddingPath] = useState<boolean>(false);
  const [totalStaked, setTotalStaked] = useState<number>(1450200);
  
  const [sponsorAddress, setSponsorAddress] = useState<string>("");
  const [sponsorAmount, setSponsorAmount] = useState<string>("");
  const [sponsoredPaths, setSponsoredPaths] = useState<Path[]>([
    { address: "0x71C...9A4", amount: 5.00 }
  ]);

  // Toast
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const numRlo = parseFloat(rloAmount) || 0;
  const networkApy = 0.10; // 10%
  const totalYield = numRlo * networkApy;
  
  const rawYieldToServiceCredits = totalYield * (sfsFraction / 100);
  const yieldToWallet = totalYield - rawYieldToServiceCredits;

  const totalAllocated = sponsoredPaths.reduce((sum, path) => sum + path.amount, 0);
  const availableServiceCredits = Math.max(0, rawYieldToServiceCredits - totalAllocated);

  // Clear toast after 3s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleStake = () => {
    if (numRlo <= 0) {
      setToast({ message: "Please enter a valid RLO amount", type: "error" });
      return;
    }
    setIsStaking(true);
    setTimeout(() => {
      setTotalStaked(prev => prev + numRlo);
      setIsStaking(false);
      setToast({ message: `Successfully staked ${numRlo.toLocaleString()} RLO!`, type: "success" });
    }, 2000);
  };

  const handleAddSponsor = () => {
    if (!sponsorAddress) {
      setToast({ message: "Please enter a valid address", type: "error" });
      return;
    }
    const amountVal = parseFloat(sponsorAmount) || 0;
    if (amountVal <= 0) {
      setToast({ message: "Please enter a valid amount", type: "error" });
      return;
    }
    if (amountVal > availableServiceCredits) {
      setToast({ message: "Amount exceeds available Service Credits", type: "error" });
      return;
    }

    setIsAddingPath(true);
    setTimeout(() => {
      setSponsoredPaths(prev => [...prev, { address: sponsorAddress, amount: amountVal }]);
      setSponsorAddress("");
      setSponsorAmount("");
      setIsAddingPath(false);
      setToast({ message: "Sponsorship path added successfully!", type: "success" });
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500/30 pb-20 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all animate-in fade-in slide-in-from-top-5 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'} backdrop-blur-md`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <Droplet className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] fill-cyan-400/20" />
          <span className="font-bold text-xl tracking-wide">Rialo</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-1 text-sm font-medium text-slate-400">
          <button className="px-4 py-2 text-white bg-slate-800/80 rounded-lg shadow-inner border border-slate-700/50">Stake</button>
        </div>
        
        {/* Empty div for flex spacing since Connect Wallet is removed */}
        <div className="w-32 hidden md:block"></div>
      </nav>

      <div className="max-w-7xl mx-auto mt-12 md:mt-20 px-4">
        {/* Main Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT COLUMN: Stake RLO */}
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
            <div className="text-center mb-8">
              <h1 className="text-[2.5rem] md:text-[2.75rem] font-extrabold mb-3 tracking-tight text-white drop-shadow-sm">Stake RLO</h1>
              <p className="text-slate-400 text-sm md:text-base font-medium">Stake RLO, receive stRLO, and fund your transactions via SfS.</p>
            </div>

            <div className="bg-[#1E1E1E] rounded-3xl p-5 md:p-7 shadow-2xl border border-slate-800/80 mb-8 relative overflow-hidden backdrop-blur-xl group/card hover:border-slate-700/80 transition-colors duration-500">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 opacity-90"></div>

              <div className="bg-slate-950/60 rounded-2xl p-4 md:p-5 mb-5 border border-slate-800/80 flex items-center justify-between focus-within:ring-1 focus-within:ring-orange-500/50 transition-all shadow-inner">
                <div className="flex flex-col flex-grow">
                  <label className="text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">RLO amount</label>
                  <div className="flex items-center">
                    <Droplet className="w-6 h-6 text-orange-500 mr-2.5 drop-shadow-md fill-orange-500/20" />
                    <input
                      type="number"
                      value={rloAmount}
                      onChange={(e) => setRloAmount(e.target.value)}
                      className="bg-transparent text-2xl md:text-3xl font-bold text-white outline-none w-full placeholder-slate-700"
                      placeholder="0.0"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setRloAmount("10000")}
                  className="text-[11px] font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors ml-4 uppercase tracking-wider border border-orange-500/20"
                >
                  MAX
                </button>
              </div>

              <button 
                onClick={handleStake}
                disabled={isStaking}
                className={`w-full font-bold py-4 rounded-2xl mb-6 transition-all shadow-[0_4px_14px_0_rgba(0,163,255,0.39)] text-[1.05rem] flex justify-center items-center gap-2
                  ${isStaking ? 'bg-slate-700 text-slate-300 shadow-none cursor-not-allowed' : 'bg-[#00A3FF] hover:bg-[#0092E6] text-white hover:shadow-[0_6px_20px_rgba(0,163,255,0.23)] hover:-translate-y-0.5 active:translate-y-0'}`}
              >
                {isStaking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Staking...
                  </>
                ) : (
                  "Simulate Staking"
                )}
              </button>

              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl p-5 mb-6 border border-slate-700/60 text-sm shadow-inner relative overflow-hidden group">
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors duration-500"></div>
                
                <div className="flex justify-between items-center mb-2 relative z-10">
                  <span className="font-semibold text-slate-200 text-sm md:text-base">
                    SfS Routing Fraction (<span className="text-orange-400 italic font-serif text-lg leading-none align-baseline">ϕ</span>)
                  </span>
                  <span className="font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2.5 py-1 rounded-md text-xs shadow-sm shadow-orange-500/10">
                    {sfsFraction}%
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 mb-5 relative z-10 font-medium">
                  Route a percentage of your yield to the <span className="text-slate-300 font-semibold border-b border-dashed border-slate-500">ServicePaymaster</span> for gas costs.
                </p>
                
                <div className="relative z-10 px-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={sfsFraction} 
                    onChange={(e) => setSfsFraction(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-2.5 font-semibold tracking-wide">
                    <span>0% (All Wallet)</span>
                    <span>100% (All Gas)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 text-sm px-2">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 font-medium">You will receive</span>
                  <span className="font-semibold text-[15px]">{numRlo.toLocaleString()} stRLO</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 font-medium">Network APY</span>
                  <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded text-[13px]">10%</span>
                </div>
                
                <div className="h-px bg-slate-800/80 my-3 w-full"></div>
                
                <div className="flex justify-between text-slate-300 items-center">
                  <span className="text-slate-400 flex items-center group cursor-help font-medium">
                    Yield to Wallet
                    <Info className="w-3.5 h-3.5 ml-1.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </span>
                  <span className="font-semibold text-white tracking-wide">
                    {yieldToWallet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-slate-500 text-xs ml-0.5">RLO/yr</span>
                  </span>
                </div>
                
                <div className="flex justify-between text-slate-300 items-center">
                  <span className="text-slate-400 flex items-center group cursor-help font-medium">
                    Total Yield Router
                    <Info className="w-3.5 h-3.5 ml-1.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </span>
                  <span className="font-bold text-orange-400 tracking-wide drop-shadow-sm">
                    {rawYieldToServiceCredits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-orange-900/60 text-xs ml-0.5">Credits/yr</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SfS Router */}
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
            <div className="text-center mb-8">
              <h1 className="text-[2.5rem] md:text-[2.75rem] font-extrabold mb-3 tracking-tight text-white drop-shadow-sm flex items-center justify-center gap-3">
                <Route className="w-9 h-9 text-orange-500 drop-shadow-md" />
                SfS Router: Sponsorship
              </h1>
              <p className="text-slate-400 text-sm md:text-base font-medium">Manage your Service Credits and sponsor external addresses.</p>
            </div>

            <div className="bg-[#1E1E1E] rounded-3xl p-5 md:p-7 shadow-2xl border border-slate-800/80 relative overflow-hidden backdrop-blur-xl h-full flex flex-col group/card hover:border-slate-700/80 transition-colors duration-500">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-orange-400 via-orange-500 to-amber-500 opacity-90"></div>
              
              <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/20 rounded-2xl p-5 mb-7 border border-slate-800/80 flex items-center justify-between shadow-inner">
                <div>
                  <h3 className="text-slate-400 text-[13px] font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    Available Service Credits
                  </h3>
                  <div className="text-[1.75rem] font-bold text-orange-400 drop-shadow-sm flex items-baseline">
                    {availableServiceCredits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
                    <span className="text-orange-500/60 text-sm ml-2 font-medium">Credits/yr</span>
                  </div>
                </div>
                <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-orange-500/20 to-amber-500/5 rounded-full flex items-center justify-center border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)] transform rotate-12">
                  <Droplet className="w-6 h-6 text-orange-500 fill-orange-500/40" />
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <label className="text-sm font-semibold text-slate-300 block flex items-center justify-between">
                  <span>Create Sponsorship Path</span>
                  <span className="text-xs font-normal text-slate-500">Allocated: {totalAllocated.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    value={sponsorAddress}
                    onChange={(e) => setSponsorAddress(e.target.value)}
                    placeholder="Enter Wallet/Contract Address" 
                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all font-mono"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                     <input 
                      type="number" 
                      value={sponsorAmount}
                      onChange={(e) => setSponsorAmount(e.target.value)}
                      placeholder="Credits to allocate" 
                      className="w-full sm:w-1/3 bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all font-mono"
                    />
                    <button 
                      onClick={handleAddSponsor}
                      disabled={isAddingPath}
                      className={`flex-grow font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] text-sm whitespace-nowrap flex items-center justify-center gap-2
                        ${isAddingPath ? 'bg-orange-800 text-orange-200 shadow-none cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 active:translate-y-0'}`}
                    >
                      {isAddingPath ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add to Router Path
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-auto bg-slate-900/30 -mx-5 md:-mx-7 -mb-5 md:-mb-7 px-5 md:px-7 py-6 border-t border-slate-800/80">
                <h3 className="text-[13px] font-bold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Active Sponsored Paths
                </h3>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800/80 overflow-hidden flex flex-col max-h-[250px] overflow-y-auto">
                   {sponsoredPaths.length === 0 ? (
                     <div className="px-4 py-8 text-center text-slate-500 text-sm">No paths configured currently.</div>
                   ) : (
                     sponsoredPaths.map((path, index) => (
                       <div key={index} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-900/50 transition-colors border-b border-slate-800/50 last:border-0 group/item">
                         <div className="flex items-center gap-3 overflow-hidden">
                           <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center shrink-0">
                             <Route className="w-4 h-4 text-slate-400" />
                           </div>
                           <span className="font-mono text-slate-200 truncate">{path.address.length > 10 ? `${path.address.substring(0, 6)}...${path.address.substring(path.address.length - 4)}` : path.address}</span>
                         </div>
                         <span className="text-orange-400 font-medium bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/10 shrink-0 whitespace-nowrap ml-2">
                           {path.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} Credits/yr
                         </span>
                       </div>
                     ))
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Card (Shared, Full Width) */}
        <div className="mt-12 mb-8 max-w-7xl mx-auto drop-shadow-2xl">
          <div className="flex justify-between items-center px-4 mb-3">
            <h2 className="text-[1.1rem] font-bold text-slate-200 tracking-tight">Rialo Protocol Statistics</h2>
            <a href="#" className="text-xs text-[#00A3FF] hover:text-[#0092E6] font-semibold transition-colors">View on Explorer</a>
          </div>
          <div className="bg-[#1E1E1E] rounded-[1.25rem] p-5 md:p-6 shadow-xl border border-slate-800/80 backdrop-blur-xl transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
              <div className="flex flex-col items-center md:items-start group pt-4 md:pt-0">
                <span className="text-slate-400 border-b border-dashed border-slate-600 group-hover:border-slate-400 transition-colors cursor-help pb-0.5 font-medium mb-2">Total staked with Rialo</span>
                <span className="font-semibold text-slate-200 text-xl tracking-tight transition-all text-emerald-400">{totalStaked.toLocaleString()} <span className="text-slate-500 text-sm font-normal">RLO</span></span>
              </div>
              <div className="flex flex-col items-center md:items-start group md:pl-6 pt-4 md:pt-0">
                <span className="text-slate-400 border-b border-dashed border-slate-600 group-hover:border-slate-400 transition-colors cursor-help pb-0.5 font-medium mb-2">Active SfS Routers</span>
                <span className="font-semibold text-slate-200 text-xl tracking-tight">12,400</span>
              </div>
              <div className="flex flex-col items-center md:items-start group md:pl-6 pt-4 md:pt-0">
                <span className="text-slate-400 border-b border-dashed border-slate-600 group-hover:border-slate-400 transition-colors cursor-help pb-0.5 font-medium mb-2">Total Service Credits Minted</span>
                <span className="font-semibold text-slate-200 text-xl tracking-tight">350,000</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
