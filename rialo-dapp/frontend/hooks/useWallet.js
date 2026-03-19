import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const [balances, setBalances] = useState({
    'ETH': 1.24,
    'RIALO': 0,
    'USDC': 1000.00,
    'USDT': 500.00
  });
  const [stakedBalance, setStakedBalance] = useState(0);

  const updateBalance = useCallback((symbol, delta) => {
    setBalances(prev => ({
      ...prev,
      [symbol]: Math.max(0, (prev[symbol] || 0) + delta)
    }));
  }, []);

  const updateStakedBalance = useCallback((delta) => {
    setStakedBalance(prev => Math.max(0, prev + delta));
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    
    // Check for MetaMask
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await ethProvider.send('eth_requestAccounts', []);
        const network = await ethProvider.getNetwork();
        setProvider(ethProvider);
        setAddress(accounts[0]);
        setChainId(Number(network.chainId));
        setConnecting(false);
        return;
      } catch (err) {
        if (err.code !== 4001) {
          console.error('Wallet connection error:', err);
        } else {
          setError('Connection rejected by user.');
          setConnecting(false);
          return;
        }
      }
    }

    // Fallback: Simulate Connection for UI Demo
    console.log('MetaMask not found or connection failed. Using simulated wallet.');
    setTimeout(() => {
      setAddress('0x712a89c32b1e4f3583921092839213f3923f392');
      setChainId(1);
      setConnecting(false);
    }, 800);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setChainId(null);
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const onAccounts = (accounts) => {
      if (accounts.length === 0) disconnect();
      else setAddress(accounts[0]);
    };
    const onChain = (id) => setChainId(parseInt(id, 16));
    window.ethereum.on('accountsChanged', onAccounts);
    window.ethereum.on('chainChanged', onChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts);
      window.ethereum.removeListener('chainChanged', onChain);
    };
  }, [disconnect]);

  // Auto-reconnect if already connected
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) connect();
    });
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <WalletContext.Provider
      value={{ 
        address, 
        provider, 
        chainId, 
        connecting, 
        error, 
        connect, 
        disconnect, 
        shortAddress, 
        isConnected: !!address,
        balances,
        stakedBalance,
        updateBalance,
        updateStakedBalance
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
