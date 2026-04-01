import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '../lib/ethers';
import { useWallet } from './useWallet';

export function useStaking() {
  const { address, provider, isConnected } = useWallet();
  const [stakedBalance, setStakedBalance] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [sfsFraction, setSfsFraction] = useState(0);
  const [sponsorshipPaths, setSponsorshipPaths] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStakingData = useCallback(async () => {
    try {
      const contract = getContract('Staking', provider);
      
      const total = await contract.totalStaked();
      setTotalStaked(ethers.formatEther(total));

      if (address) {
        const checksummed = ethers.getAddress(address);
        const stakeInfo = await contract.stakes(checksummed);
        
        // Ethers v6 Result parsing - more robust check
        let rawAmount = 0n;
        let rawSfsFraction = 0n;

        if (stakeInfo && typeof stakeInfo === 'object') {
          rawAmount = stakeInfo.amount ?? stakeInfo[0] ?? 0n;
          rawSfsFraction = stakeInfo.sfsFraction ?? stakeInfo[3] ?? 0n;
        }

        const formattedStaked = ethers.formatEther(rawAmount);
        console.log(`[Staking Debug] User: ${checksummed}, Raw: ${rawAmount}, Staked: ${formattedStaked}, Sfs: ${rawSfsFraction}`);
        
        setStakedBalance(formattedStaked);
        setSfsFraction(Number(rawSfsFraction) / 100); 
        
        const rewards = await contract.calculateRewards(checksummed);
        setPendingRewards(ethers.formatEther(rewards));

        const paths = await contract.getSponsorshipPaths(checksummed);
        setSponsorshipPaths(paths.map(p => ({
            address: p.destination,
            amount: parseFloat(ethers.formatEther(p.amount))
        })));
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

  const updateSfsFraction = useCallback(async (percentage) => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const staking = getContract('Staking', signer);
      const fraction = Math.round(percentage * 100); // 50% -> 5000 bps
      const tx = await staking.setSfsFraction(fraction);
      await tx.wait();
      await fetchStakingData();
      return tx.hash;
    } catch (error) {
      console.error('Update SfS fraction error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, fetchStakingData]);

  const addSponsorshipPath = useCallback(async (dest, amount) => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const staking = getContract('Staking', signer);
      const tx = await staking.addSponsorshipPath(dest, ethers.parseEther(amount.toString()));
      await tx.wait();
      await fetchStakingData();
      return tx.hash;
    } catch (error) {
      console.error('Add sponsorship path error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected, provider, fetchStakingData]);

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

  return { 
    stakedBalance, 
    pendingRewards, 
    totalStaked, 
    sfsFraction, 
    sponsorshipPaths, 
    loading, 
    stake, 
    withdraw, 
    claimRewards, 
    updateSfsFraction, 
    addSponsorshipPath, 
    fetchStakingData 
  };
}
