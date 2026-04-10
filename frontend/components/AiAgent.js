import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';

// Mock logic matching the system prompt
const getAiResponse = (input, globalRates) => {
  const lower = input.toLowerCase();
  
  // Scheduling detection (e.g., "in 5 minutes", "dalam 2 jam")
  const delayMatch = lower.match(/(?:in|dalam)\s+([\d.]+)\s+(minute|minutes|menit|hour|hours|jam)/i);
  let delaySec = 0;
  if (delayMatch) {
    const val = parseFloat(delayMatch[1]);
    const unit = delayMatch[2].toLowerCase();
    if (unit.startsWith('m')) delaySec = val * 60;
    else if (unit.startsWith('h') || unit.startsWith('j')) delaySec = val * 3600;
  }

  // Direct swap execution (e.g., "swap 100 rialo to eth" or "buy 10 eth for usdc at 2500")
  const swapMatch = lower.match(/(?:swap|tukar|buy|sell|beli|jual)\s+([\d.]+)\s+([a-z0-9]+)\s+(?:to|ke|for)\s+([a-z0-9]+)/i);
  if (swapMatch) {
    const amount = swapMatch[1];
    let fromToken = swapMatch[2].toUpperCase();
    let toToken = swapMatch[3].toUpperCase();

    // Fuzzy matching for common typos
    if (fromToken === 'ROALO' || fromToken === 'RIALO' || fromToken === 'RLO') fromToken = 'RIALO';
    if (toToken === 'ROALO' || toToken === 'RIALO' || toToken === 'RLO') toToken = 'RIALO';
    
    // Check for trigger order
    const triggerMatch = lower.match(/(?:at|when|if|saat|jika)\s*(?:price|harga)?\s*(?:hits|is|reaches|<=|>=|<|>|=|menyentuh|-)?\s*([\d.]+)/i);
    const targetPrice = triggerMatch ? parseFloat(triggerMatch[1]) : 0;

    if (targetPrice > 0) {
      return {
        insight: `Trigger condition recognized for ${amount} ${fromToken} to ${toToken} at target price ${targetPrice}.`,
        options: ["1. Limit Order (Pending Execution)"],
        recommendation: "System will automatically execute the swap when the price target is met.",
        action: `Trigger Order Placed: ${amount} ${fromToken} -> ${toToken} at ${targetPrice}`,
        targetPrice: targetPrice,
        fromToken: fromToken,
        toToken: toToken,
        amount: amount
      };
    }

    return {
      insight: `Optimal route found for ${amount} ${fromToken} to ${toToken}.${delaySec ? ` (Scheduled for ${delayMatch[1]} ${delayMatch[2]})` : ''}`,
      options: ["1. Aggregator Route (Executed)"],
      recommendation: delaySec ? "Transaction will be processed automatically." : "Swap has been optimized and processed.",
      action: delaySec ? `Scheduled: ${amount} ${fromToken} -> ${toToken}` : `Transaction successful. ${amount} ${fromToken} -> ${toToken} has been completed.`,
      delaySec: delaySec
    };
  }

  // Direct bridge execution (ETH <-> RIALO)
  const bridgeMatch = lower.match(/(?:bridge|kirim)\s+([\d.]+)\s+([a-z0-9]+)\s+(?:to|ke)\s+([a-z0-9]+)/i);
  if (bridgeMatch && lower.includes('bridge')) {
    const amount = parseFloat(bridgeMatch[1]);
    const fromToken = bridgeMatch[2].toUpperCase();
    const toToken = bridgeMatch[3].toUpperCase();

    if ((fromToken === 'ETH' && toToken === 'RIALO') || (fromToken === 'RIALO' && toToken === 'ETH')) {
      if (amount < 0.01) {
        return {
          insight: "Bridge requirements not met.",
          options: ["1. Increase amount to 0.01 ETH or more"],
          recommendation: "Minimal bridge amount is 0.01 ETH.",
          action: "Failed: Minimal bridge is 0.01 ETH."
        };
      }
      const dir = fromToken === 'ETH' ? 'ETH -> Rialo L1' : 'Rialo L1 -> ETH';
      return {
        insight: `Rialo Bridge is clear. ${dir} migration processed.${delaySec ? ` (Scheduled in ${delayMatch[1]} ${delayMatch[2]})` : ''}`,
        options: [`1. Native Rialo Bridge (${fromToken} to ${toToken})`],
        recommendation: "Bridge protocol initiated successfully.",
        action: delaySec ? `Scheduled: ${amount} ${dir}` : `Transaction successful. ${amount} ${dir} has been completed.`,
        delaySec: delaySec
      };
    }
  }

  // Direct stake execution (e.g., "stake 1000 rialo")
  const stakeMatch = lower.match(/(?:stake|staking)\s+([\d.]+)\s+([a-z0-9]+)/i);
  if (stakeMatch) {
    const amount = stakeMatch[1];
    const token = stakeMatch[2].toUpperCase();
    return {
      insight: `${token} staking pool processed.${delaySec ? ` (Scheduled in ${delayMatch[1]} ${delayMatch[2]})` : ''}`,
      options: ["1. Standard Staking Pool (Active)"],
      recommendation: "Funds are now earning rewards.",
      action: delaySec ? `Scheduled Stake: ${amount} ${token}` : `Transaction successful. Staking ${amount} ${token} is now active.`,
      delaySec: delaySec
    };
  }

  // Price Inquiry
  if (lower.includes('price') || lower.includes('harga') || lower.includes('berapa') || lower.includes('how much')) {
    // Attempt to parse out the token name
    let token = null;
    let target = 'USDC';
    
    const priceMatchParams = lower.match(/(?:price of|harga|berapa harga)\s+([a-z0-9]+)(?:\s+(?:in|dalam|ke)\s+([a-z0-9]+))?/i);
    const shortMatch = lower.match(/([a-z0-9]+)\s+price/i) || lower.match(/price\s+([a-z0-9]+)/i);

    if (priceMatchParams) {
      token = priceMatchParams[1].toUpperCase();
      if (priceMatchParams[2]) target = priceMatchParams[2].toUpperCase();
    } else if (shortMatch) {
      token = shortMatch[1].toUpperCase();
    }

    // Ignore if it's a swap/buy/sell command
    if (token && !lower.includes('swap') && !lower.includes('buy') && !lower.includes('sell') && !lower.includes('stake') && !lower.includes('bridge')) {
       
       if (token === 'USDC' || token === 'USDT') target = 'ETH';

       let rate = 0;
       if (globalRates && globalRates[token] && globalRates[token][target]) {
          rate = globalRates[token][target];
       } else {
          // Generate a deterministic pseudo-random price for ANY unknown token
          let hash = 0;
          for (let i = 0; i < token.length; i++) {
             hash = token.charCodeAt(i) + ((hash << 5) - hash);
          }
          // Simple pseudo-random formula
          let pseudoRandom = Math.abs(Math.sin(hash)) * 1000;
          if (pseudoRandom < 0.01) pseudoRandom += 0.5; // Avoid zero

          // If the target is specified and in globalRates, adjust it
          if (target !== 'USDC' && globalRates && globalRates[target] && globalRates[target]['USDC']) {
             rate = pseudoRandom / globalRates[target]['USDC'];
          } else {
             rate = pseudoRandom;
             target = 'USDC'; // Fallback to USDC
          }
       }
       
       const formatted = rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4);
       
       return {
         insight: `Real-time oracle data retrieved for ${token}/${target} market.`,
         options: [`Current Rate: 1 ${token} ≈ ${formatted} ${target}`],
         recommendation: `You can directly swap or set a Limit Order for ${token} here.`,
         action: `Price Checked: 1 ${token} is ${formatted} ${target}`
       };
    }
  }

  // Generic Swap
  if (lower.includes('swap') || lower.includes('tukar')) {
    return {
      insight: "Liquidity is strong and gas is currently reasonable on Layer 2s.",
      options: ["1. Swap on Ethereum mainnet (higher gas, deeper liquidity)", "2. Swap via Arbitrum (lower fees)"],
      recommendation: "Use Arbitrum for lower fees unless you're swapping a large amount.",
      action: "Provide amount and preferred tokens (e.g., 'swap 100 RIALO to ETH')."
    };
  }
  
  // Generic Bridge
  if (lower.includes('bridge') || lower.includes('kirim')) {
    return {
      insight: "Rialo Bridge is optimized for liquidity migration from Ethereum.",
      options: ["1. ETH to RIALO (Standard Route)"],
      recommendation: "Currently, only ETH to RIALO bridging is supported for maximum safety.",
      action: "Specify your amount (e.g., 'bridge 0.5 ETH to RIALO')."
    };
  }

  // Generic Stake
  if (lower.includes('stake') || lower.includes('yield') || lower.includes('staking')) {
    return {
      insight: "Several stable pools currently offer strong APY with moderate risk.",
      options: ["1. Stablecoin pool (lower risk)", "2. ETH staking (moderate risk, long-term)"],
      recommendation: "Start with a stable pool if you want safer yield.",
      action: "Specify your details (e.g., 'stake 1000 RIALO')."
    };
  }

  // Rialo General Knowledge Base Matches
  if (lower.includes('what is rialo') || lower.includes('about rialo') || lower.includes('who are you') || lower.includes('apa itu') || lower.includes('tentang')) {
    return {
      insight: "Rialo is a blockchain built for the real world.",
      options: ["Rialo Omni Account", "Rialo Execution Engine", "Rialo VM"],
      recommendation: "Rialo enables event-driven execution, native real-world data streams (without traditional oracles), and gas-less transactions with 50ms block times.",
      action: "I can help you utilize Rialo's DeFi ecosystem. Try 'swap', 'bridge', or 'stake'."
    };
  }

  // Expanded Knowledge Base
  const broadKnowledge = {
    'build': 'You can build on Rialo using our custom Rust-based engine. We provide a resilient infrastructure designed for 10x performance compared to traditional EVM chains. Check our docs for SDK details.',
    'dev': 'Developers are the core of our ecosystem. Rialo provides a unified hub for builders to deploy high-frequency financial applications with sub-second finality.',
    'consensus': 'Rialo uses a high-throughput parallel execution consensus, achieving 50ms block times and nanosecond latency without compromising security.',
    'node': 'Rialo supports thousands of validator nodes globally. Our network is designed to be permissionless and decentralized, ensuring no single entity holds governing power.',
    'fee': 'Rialo is engineered for a zero-friction experience, which includes near-zero fees for most operations. We prioritize accessibility for all users.',
    'security': 'The Rialo Sentinel protocol provides a multi-layered security shield, protecting every transaction against malicious actors and front-running.',
    'roadmap': 'We are currently focused on the "Unified Hub" phase, integrating swapping, bridging, and staking into a single, intuitive experience. Ecosystem expansion is next!',
    'hello': 'Hello! I am your Rialo AI Assistant. I can help you trade, bridge assets, or answer questions about our underlying technology. How can I assist you?',
    'help': 'I can help with commands like "swap 10 ETH to RIALO", "bridge 0.1 ETH to RIALO", or "stake 500 RIALO". I can also answer questions about our tech!',
  };

  for (const [key, val] of Object.entries(broadKnowledge)) {
    if (lower.includes(key)) {
      return { raw: val };
    }
  }

  // Dynamic Fallback for off-topic or unknown queries
  return {
    raw: `That's an interesting question about "${input}". As a specialized Rialo AI, I'm constantly evolving. While this specific query is outside my current DeFi optimization parameters, I can tell you that Rialo's "Architectural Void" is designed for exactly this kind of innovation. Is there a specific part of our ecosystem—like swapping or staking—I can help you optimize today?`
  };
};

export default function AiAgent() {
  const { isConnected, provider, executeAiTransaction, addTriggerOrder, globalRates, scheduledTxs, addScheduledTx, removeScheduledTx, toast, showToast, sessionActive, sessionExpiry, sessionSigner, activateSession, deactivateSession, seedSession, aiMessages: messages, addAiMessage } = useWallet();
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [showAiWalletPanel, setShowAiWalletPanel] = useState(false);
  const [sessionBalance, setSessionBalance] = useState('0');
  const [sessionDuration, setSessionDuration] = useState(1);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [schedData, setSchedData] = useState({ type: 'Swap', amount: '10', fromToken: 'USDC', toToken: 'RIALO', timeVal: '5', timeUnit: 'minutes' });
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scheduledTxs.map(tx => tx.id).join(',')]); 

  // PERSISTENT BALANCE TRACKING
  useEffect(() => {
    if (sessionActive && sessionSigner && provider) {
      const fetchBal = async () => {
        try {
          const bal = await provider.getBalance(sessionSigner.address);
          setSessionBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
        } catch (e) {
          console.error("Balance fetch error:", e);
        }
      };
      fetchBal();
      const interval = setInterval(fetchBal, 3000); // Fast polling for snappy UI
      return () => clearInterval(interval);
    }
  }, [sessionActive, sessionSigner, provider]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    addAiMessage({ role: 'user', content: { raw: userMsg } });
    setInput('');
    setIsThinking(true);

    // Simulate network delay
    setTimeout(() => {
      const response = getAiResponse(userMsg, globalRates);
      addAiMessage({ role: 'ai', content: response });
      setIsThinking(false);
      
      // If successful transaction, trigger toast or schedule
      if (response.action?.includes('successful') || response.action?.includes('active') || response.action?.includes('Scheduled') || response.action?.includes('Trigger Order Placed')) {
        let type = "Swap";
        if (userMsg.toLowerCase().includes('bridge')) type = "Bridge";
        if (userMsg.toLowerCase().includes('stake')) type = "Stake";
        if (response.action?.includes('Trigger Order')) type = "Trigger";
        
        // Extract symbols or just show successful
        const detail = response.action.replace('Transaction successful. ', '').replace(' has been completed.', '').replace(' is now active.', '').replace('Scheduled: ', '').replace('Scheduled Stake: ', '').replace('Trigger Order Placed: ', '');
        
        if (type === "Trigger") {
          const currentRate = globalRates[response.fromToken]?.[response.toToken] || 1;
          const condition = response.targetPrice >= currentRate ? '>=' : '<=';
          addTriggerOrder({
            fromToken: response.fromToken,
            toToken: response.toToken,
            amountIn: response.amount,
            targetPrice: response.targetPrice,
            condition: condition,
            expiration: '1 Day'
          });
          showToast({
            message: `Limit Order Placed!`,
            detail: detail
          });
        } else if (response.delaySec > 0) {
          // SCHEDULE IT (global — persists on navigation)
          addScheduledTx({
            type: type,
            userMsg: userMsg,
            detail: detail,
            remainingSec: response.delaySec
          });
          showToast({
            message: `Scheduled ${type}!`,
            detail: detail
          });
        } else {
          // EXECUTE ON-CHAIN
          const statusMsg = sessionActive 
            ? `🤖 **Session Key Active**: Automating **${type}** on-chain without popups...` 
            : `🔄 Initiating **${type}** on-chain. Please confirm the transaction in your wallet.`;
          
          addAiMessage({ role: 'ai', content: { raw: statusMsg } });

          executeAiTransaction(type, userMsg, detail).then(res => {
            showToast({
              message: `${type} successful!`,
              detail: res.detail,
              txHash: res.hash
            });
             addAiMessage({ role: 'ai', content: { raw: `✅ **${type}** execution successful!` } });
          }).catch(err => {
            const errorMsg = err.reason || err.message || 'Transaction failed';
            showToast({ message: `${type} failed`, detail: errorMsg, type: 'error' });
            addAiMessage({ role: 'ai', content: { raw: `❌ **${type}** failed: ${errorMsg}` } });
          });
        }
      }
    }, 600);
  };

  const submitScheduledForm = (e) => {
    e.preventDefault();
    let cmd = "";
    if (schedData.type === 'Swap') {
      cmd = `swap ${schedData.amount} ${schedData.fromToken} to ${schedData.toToken} in ${schedData.timeVal} ${schedData.timeUnit}`;
    } else if (schedData.type === 'Bridge') {
      cmd = `bridge ${schedData.amount} ETH to RIALO in ${schedData.timeVal} ${schedData.timeUnit}`;
    } else {
      cmd = `stake ${schedData.amount} ${schedData.fromToken} in ${schedData.timeVal} ${schedData.timeUnit}`;
    }
    setInput(cmd);
    setShowSchedulePanel(false);
  };

  return (
    <>

      <div className="ai-widget">
        <div className="ai-window">
          <div className="ai-header">
            <div className="ai-title">
              <span className="ai-status-dot"></span>
              Rialo AI Assistant
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={`automation-badge ${sessionActive ? 'active' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  {sessionActive ? 'bolt' : 'front_hand'}
                </span>
                {sessionActive ? 'SESSION ACTIVE' : 'MANUAL APPROVAL'}
              </div>
              <button 
                className="ai-settings-btn"
                onClick={() => setShowAiWalletPanel(!showAiWalletPanel)}
                title="Session Control"
              >
                <span className="material-symbols-outlined">{sessionActive ? 'shield_person' : 'lock_open'}</span>
              </button>
            </div>
          </div>
          
          <div className="ai-body">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.role === 'user' ? (
                  m.content.raw
                ) : m.content.raw ? (
                  <div className="ai-raw">{m.content.raw}</div>
                ) : (
                  <div className="ai-structured">
                    {m.content.insight && (
                      <div>
                        <div className="ai-section-title">Insight</div>
                        <div className="ai-section-content">{m.content.insight}</div>
                      </div>
                    )}
                    {m.content.options && (
                      <div>
                        <div className="ai-section-title">Options</div>
                        <ul className="ai-options ai-section-content">
                          {m.content.options.map((opt, idx) => (
                            <li key={idx}>{opt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {m.content.recommendation && (
                      <div>
                        <div className="ai-section-title">Recommendation</div>
                        <div className="ai-section-content ai-recommendation">{m.content.recommendation}</div>
                      </div>
                    )}
                    {m.content.action && (
                      <div>
                        <div className="ai-section-title">Action</div>
                        <div className="ai-section-content">{m.content.action}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {scheduledTxs.length > 0 && (
              <div className="ai-scheduled-list">
                {scheduledTxs.map(tx => (
                  <div key={tx.id} className="ai-scheduled-item">
                    <div className="ai-scheduled-timer">
                      {tx.remainingSec > 60 ? `${Math.ceil(tx.remainingSec/60)}m` : `${tx.remainingSec}s`}
                    </div>
                    <div className="ai-scheduled-info">
                      <div className="ai-scheduled-title">Scheduled {tx.type}</div>
                      <div className="ai-scheduled-detail">{tx.detail}</div>
                    </div>
                    <button 
                      onClick={() => removeScheduledTx(tx.id)}
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isThinking && (
              <div className="ai-msg ai">
                <div className="ai-raw italic opacity-50 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  Rialo AI is thinking...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-footer">
            {showSchedulePanel && (
              <div className="ai-sched-panel">
                <form onSubmit={submitScheduledForm}>
                  <div className="ai-sched-grid">
                    <div className="ai-sched-field">
                      <label className="ai-sched-label">Action</label>
                      <select 
                        className="ai-sched-select"
                        value={schedData.type}
                        onChange={e => setSchedData({...schedData, type: e.target.value})}
                      >
                        <option>Swap</option>
                        <option>Bridge</option>
                        <option>Stake</option>
                      </select>
                    </div>
                    <div className="ai-sched-field">
                      <label className="ai-sched-label">Amount</label>
                      <input 
                        type="number" 
                        className="ai-sched-input" 
                        value={schedData.amount}
                        onChange={e => setSchedData({...schedData, amount: e.target.value})}
                      />
                    </div>
                    {schedData.type !== 'Bridge' && (
                      <div className="ai-sched-field">
                        <label className="ai-sched-label">Token</label>
                        <select 
                          className="ai-sched-select"
                          value={schedData.fromToken}
                          onChange={e => setSchedData({...schedData, fromToken: e.target.value})}
                        >
                          <option>RIALO</option>
                          <option>USDC</option>
                          <option>USDT</option>
                          <option>ETH</option>
                        </select>
                      </div>
                    )}
                    {schedData.type === 'Swap' && (
                      <div className="ai-sched-field">
                        <label className="ai-sched-label">To Token</label>
                        <select 
                          className="ai-sched-select"
                          value={schedData.toToken}
                          onChange={e => setSchedData({...schedData, toToken: e.target.value})}
                        >
                          <option>RIALO</option>
                          <option>ETH</option>
                          <option>USDC</option>
                          <option>USDT</option>
                        </select>
                      </div>
                    )}
                    <div className="ai-sched-field">
                      <label className="ai-sched-label">Time Value</label>
                      <input 
                        type="number" 
                        className="ai-sched-input" 
                        value={schedData.timeVal}
                        onChange={e => setSchedData({...schedData, timeVal: e.target.value})}
                      />
                    </div>
                    <div className="ai-sched-field">
                      <label className="ai-sched-label">Unit</label>
                      <select 
                        className="ai-sched-select"
                        value={schedData.timeUnit}
                        onChange={e => setSchedData({...schedData, timeUnit: e.target.value})}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="ai-sched-btn">Generate Command</button>
                </form>
              </div>
            )}

            {showAiWalletPanel && (
              <div className="ai-wallet-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="ai-sched-label" style={{ margin: 0 }}>Session Control (EIP-7702)</h3>
                  <button onClick={() => setShowAiWalletPanel(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                  {sessionActive 
                    ? `Your session is ACTIVE. AI can execute swaps, bridges, and stakes without further popups.` 
                    : `Start a temporary session to allow the AI Agent to execute transactions "from the inside." This only requires ONE initial signature.`
                  }
                </p>
                
                {sessionActive ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase' }}>Expires In</div>
                        <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700' }}>
                          {sessionExpiry ? Math.max(0, Math.ceil((sessionExpiry - Date.now()) / (60 * 1000))) : 0} Min
                        </div>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                          Gas Balance
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(sessionSigner?.address || "");
                              showToast({ message: "Address Copied!", detail: (sessionSigner?.address || "").slice(0, 10) + '...' });
                            }}
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, opacity: 0.5 }}
                            title="Copy Wallet Address"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>content_copy</span>
                          </button>
                        </div>
                        <div style={{ fontSize: '18px', color: '#fff', fontWeight: '700' }}>
                          {sessionBalance} ETH
                        </div>
                      </div>
                    </div>

                    {parseFloat(sessionBalance) < 0.005 && (
                      <button 
                        className="ai-sched-btn"
                        disabled={isSeeding}
                        onClick={async () => {
                          setIsSeeding(true);
                          try {
                            await seedSession('0.01');
                            showToast({ message: "AI Wallet Seeded!", detail: "0.01 ETH transferred for gas." });
                            if (provider && sessionSigner) {
                               const bal = await provider.getBalance(sessionSigner.address);
                               setSessionBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
                            }
                          } catch (e) {
                            showToast({ message: "Seeding Failed", detail: e.message, type: 'error' });
                          } finally {
                            setIsSeeding(false);
                          }
                        }}
                        style={{ background: '#10b981', color: '#000' }}
                      >
                        {isSeeding ? 'Seeding...' : 'Seed AI Wallet (0.01 ETH)'}
                      </button>
                    )}

                    <button 
                      className="ai-sched-btn" 
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      disabled={isRevoking}
                      onClick={async () => {
                        setIsRevoking(true);
                        try {
                          await deactivateSession();
                          showToast({ message: "Session Terminated", detail: "Funds returned to main wallet", type: 'error' });
                        } catch (e) {
                          showToast({ message: "Revoke Failed", detail: e.message, type: 'error' });
                        } finally {
                          setIsRevoking(false);
                        }
                      }}
                    >
                      {isRevoking ? 'Returning Funds...' : 'Revoke Session'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Session Duration</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="range" 
                          min="1" 
                          max="24" 
                          value={sessionDuration}
                          onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                          style={{ accentColor: '#10b981', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '800', minWidth: '45px' }}>{sessionDuration}H</span>
                      </div>
                    </div>
                    <button 
                      className="ai-sched-btn" 
                      onClick={async () => {
                        try {
                          await activateSession(sessionDuration);
                          setShowAiWalletPanel(false);
                          showToast({ message: "Session Started!", detail: `Zero-popup automation active for ${sessionDuration} hour(s).` });
                        } catch (e) {
                          showToast({ message: "Activation Failed", detail: e.message, type: 'error' });
                        }
                      }}
                    >
                      Authorize {sessionDuration}-Hour Session
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="ai-quick-commands">

              <button 
                onClick={() => setShowSchedulePanel(!showSchedulePanel)} 
                className={`ai-command-chip ${showSchedulePanel ? 'border-[#ffa500] text-[#ffa500]' : ''}`}
                style={{ background: showSchedulePanel ? 'rgba(255,165,0,0.1)' : '' }}
              >
                <span className="material-symbols-outlined text-[12px] align-middle mr-1">schedule</span>
                Advanced Schedule
              </button>
              <button onClick={() => setInput("swap 1 ETH to USDC at 2500")} className="ai-command-chip">Auto Buy/Sell</button>
            </div>
            <form className="ai-form" onSubmit={handleSend}>
              <input 
                type="text" 
                className="ai-input" 
                placeholder="Ask about swaps, bridging, or staking..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="ai-send">Send</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
