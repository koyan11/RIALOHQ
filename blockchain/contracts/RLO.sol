// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RialoToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18;
    uint256 public constant COOLDOWN_TIME = 24 hours;

    mapping(address => uint256) public lastFaucetClaim;

    constructor() ERC20("Rialo", "RLO") Ownable(msg.sender) {
        _mint(msg.sender, 1000000000 * 10**18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Faucet logic
    function claimFaucet() public {
        require(block.timestamp >= lastFaucetClaim[msg.sender] + COOLDOWN_TIME, "Faucet: Cooldown in progress");
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    // Bridge logic (Simulated)
    // bridgeOut: user burns their tokens on Sepolia
    function bridgeOut(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // bridgeIn: owner (relayer) mints tokens back after delay
    function bridgeIn(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
