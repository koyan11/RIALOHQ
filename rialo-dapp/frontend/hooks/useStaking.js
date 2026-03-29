import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../lib/ethers';
import { useWallet } from './useWallet';

export function useStaking() {
  const { address, provider, isConnected } = useWallet();
  const [stakedBalance, setStakedBalance] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [loading, setLoading] = useState(false);

  const fetchStakingData = useCallback(async () => {
    try {
      const contract = getContract('Staking', provider);
      
      const total = await contract.totalStaked();
      setTotalStaked(ethers.formatEther(total));

      if (address) {
        const stakeInfo = await contract.stakes(address);
        setStakedBalance(ethers.formatEther(stakeInfo.amount));
        
        const rewards = await contract.calculateRewards(address);
        setPendingRewards(ethers.formatEther(rewards));
      }
    } catch (error) {
      console.error('Error fetching staking data:', error);
    }
  }, [address, provider]);

  useEffect(() => {
    fetchStakingData();
    const interval = setInterval(fetchStakingData, 15000);
    return () => clearInterval(interval);
  }, [fetchStakingData]);

  const stake = useCallback(async (amount) => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const rlo = getContract('RLO', signer);
      const staking = getContract('Staking', signer);

      const parsedAmount = ethers.parseEther(amount);
      
      // Approve first
      const allowance = await rlo.allowance(address, await staking.getAddress());
      if (allowance < parsedAmount) {
        const approveTx = await rlo.approve(await staking.getAddress(), parsedAmount);
        await approveTx.wait();
      }

      const tx = await staking.stake(parsedAmount);
      await tx.wait();
      await fetchStakingData();
      return tx.hash;
    } catch (error) {
      console.error('Stake error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, address, fetchStakingData]);

  const withdraw = useCallback(async (amount) => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const staking = getContract('Staking', signer);
      const tx = await staking.withdraw(ethers.parseEther(amount));
      await tx.wait();
      await fetchStakingData();
      return tx.hash;
    } catch (error) {
      console.error('Withdraw error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, fetchStakingData]);

  const claimRewards = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const staking = getContract('Staking', signer);
      const tx = await staking.claimRewards();
      await tx.wait();
      await fetchStakingData();
      return tx.hash;
    } catch (error) {
      console.error('Claim rewards error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, fetchStakingData]);

  return { stakedBalance, pendingRewards, totalStaked, loading, stake, withdraw, claimRewards, fetchStakingData };
}
