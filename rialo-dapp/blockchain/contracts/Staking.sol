// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is Ownable, ReentrancyGuard {
    IERC20 public stakingToken;
    uint256 public rewardRate = 184; // 18.4% APY represented as (rewardRate / 1000)

    struct Stake {
        uint256 amount;
        uint256 lastUpdate;
        uint256 rewardsAccumulated;
    }

    mapping(address => Stake) public stakes;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address _stakingToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
    }

    function calculateRewards(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];
        if (userStake.amount == 0) return userStake.rewardsAccumulated;

        uint256 timeElapsed = block.timestamp - userStake.lastUpdate;
        // rewards = amount * rate * time / (365 days * 1000)
        uint256 pending = (userStake.amount * rewardRate * timeElapsed) / (365 days * 1000);
        return userStake.rewardsAccumulated + pending;
    }

    uint256 public minStake = 10 * 1e18; // 10 RLO minimum

    function stake(uint256 amount) external nonReentrant {
        require(amount >= minStake, "Below minimum stake");
        
        stakes[msg.sender].rewardsAccumulated = calculateRewards(msg.sender);
        stakes[msg.sender].lastUpdate = block.timestamp;
        
        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");

        stakes[msg.sender].rewardsAccumulated = calculateRewards(msg.sender);
        stakes[msg.sender].lastUpdate = block.timestamp;

        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        stakingToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        uint256 reward = calculateRewards(msg.sender);
        require(reward > 0, "No rewards to claim");

        stakes[msg.sender].rewardsAccumulated = 0;
        stakes[msg.sender].lastUpdate = block.timestamp;

        // Note: For simplicity, the staking contract must have enough RLO to payout rewards.
        // Or RLO token could allow this contract to mint.
        stakingToken.transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward);
    }
}
