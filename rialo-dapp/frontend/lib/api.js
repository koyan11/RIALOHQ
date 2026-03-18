const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const swapTokens = async (payload) => {
  await sleep(1500);
  return { txHash: '0xabc...def', status: 'success' };
};

export const bridgeTokens = async (payload) => {
  await sleep(1500);
  return { txHash: '0x123...456', status: 'success' };
};

export const stakeTokens = async (payload) => {
  await sleep(1500);
  return { txHash: '0x789...012', status: 'success' };
};

export const unstakeTokens = async (payload) => {
  await sleep(1500);
  return { txHash: '0x345...678', status: 'success' };
};

export const fetchRewards = async (userAddress) => ({
  totalEarned: '12482.50',
  claimable: '842.12',
  apy: '8.42',
});

export const claimRewards = async (payload) => {
  await sleep(1500);
  return { txHash: '0x999...000', status: 'success' };
};

export const fetchPools = async () => ({
  pools: [
    { id: 'rlo-eth', name: 'RLO/ETH', description: 'Stake Rialo paired with Ethereum liquidity', apy: '18.4%', totalStaked: '850M RLO', tvl: '$942M', minStake: '100 RLO' },
    { id: 'rlo-usdc', name: 'RLO/USDC', description: 'Stable liquidity provision for USDC pairs', apy: '12.1%', totalStaked: '120M RLO', tvl: '$133M', minStake: '50 RLO' },
    { id: 'rlo-single', name: 'RLO Single Stake', description: 'Pure RLO staking for protocol governance', apy: '8.7%', totalStaked: '450M RLO', tvl: '$499M', minStake: '10 RLO' },
  ]
});

export default {
  swapTokens,
  bridgeTokens,
  stakeTokens,
  unstakeTokens,
  fetchRewards,
  claimRewards,
  fetchPools
};
