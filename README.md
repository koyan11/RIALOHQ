# Rialo dApp — Web3 Full Stack

A fully functional Web3 dApp for the **Rialo Layer 1** ecosystem.
Built with **Next.js** (frontend) + **Express.js** (backend) + **ethers.js** (blockchain).

---

## Project Structure

```
rialo-dapp/
├── backend/              # Express.js API + ethers.js blockchain layer
│   ├── server.js         # All API endpoints
│   ├── abi/              # Smart contract ABIs
│   │   ├── staking.json
│   │   ├── swap.json
│   │   ├── bridge.json
│   │   └── rewards.json
│   ├── .env.example      # Environment variables template
│   └── package.json
│
└── frontend/             # Next.js app (UI unchanged)
    ├── pages/
    │   ├── index.js      # Home
    │   ├── swap.js       # Swap page
    │   ├── bridge.js     # Bridge page
    │   ├── staking.js    # Staking page
    │   ├── rewards.js    # Rewards page
    │   └── learn.js      # Learn page
    ├── components/
    │   ├── Navbar.js     # Wallet connect button
    │   ├── Footer.js     # Dark footer
    │   └── Toast.js      # Success/error/loading notifications
    ├── hooks/
    │   └── useWallet.js  # MetaMask connection context
    ├── lib/
    │   └── api.js        # Axios API client
    └── package.json
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your real values (see below)
npm start
```

Backend runs on: `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## Environment Variables (backend/.env)

```env
PORT=3001

# Ethereum RPC (get from Infura or Alchemy)
RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# Hot wallet private key (never use your main wallet)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Deployed smart contract addresses
STAKING_CONTRACT=0xYourStakingContractAddress
SWAP_CONTRACT=0xYourSwapContractAddress
BRIDGE_CONTRACT=0xYourBridgeContractAddress
REWARD_CONTRACT=0xYourRewardContractAddress
```

---

## API Endpoints

| Method | Route            | Description                        |
|--------|------------------|------------------------------------|
| POST   | /api/swap        | Execute token swap                 |
| POST   | /api/bridge      | Bridge assets cross-chain          |
| POST   | /api/stake       | Stake tokens in a pool             |
| POST   | /api/unstake     | Unstake tokens from a pool         |
| GET    | /api/rewards     | Fetch user rewards (totalEarned, claimable, APY) |
| POST   | /api/claim       | Claim pending rewards              |
| GET    | /api/pools       | Get staking pool metadata          |
| GET    | /api/health      | Health check                       |

### Request Examples

**Swap:**
```json
POST /api/swap
{
  "amount": "0.5",
  "fromToken": "ETH",
  "toToken": "RIALO",
  "userAddress": "0xYourWalletAddress"
}
```

**Bridge:**
```json
POST /api/bridge
{
  "amount": "1.0",
  "fromChain": "Ethereum",
  "toChain": "Rialo",
  "userAddress": "0xYourWalletAddress"
}
```

**Stake:**
```json
POST /api/stake
{
  "amount": "100",
  "pool": "rlo-eth",
  "userAddress": "0xYourWalletAddress"
}
```

**Unstake:**
```json
POST /api/unstake
{
  "amount": "50",
  "pool": "rlo-eth",
  "userAddress": "0xYourWalletAddress"
}
```

**Get Rewards:**
```
GET /api/rewards?userAddress=0xYourWalletAddress
```

**Claim:**
```json
POST /api/claim
{
  "userAddress": "0xYourWalletAddress"
}
```

---

## Smart Contract ABIs

The `backend/abi/` folder contains ABI definitions for:

- **staking.json** — `stake()`, `unstake()`, `getStakedBalance()` + events
- **swap.json** — `swap()`, `getQuote()` + events
- **bridge.json** — `bridge()`, `estimateFee()` + events
- **rewards.json** — `totalEarned()`, `claimable()`, `getAPY()`, `claimRewards()` + events

Replace these ABIs with your actual deployed contract ABIs.

---

## Wallet Connection

The app uses **MetaMask** via `ethers.BrowserProvider`.

- Auto-reconnects on page load if already connected
- Listens for account and chain changes
- Shows short address in navbar when connected
- All pages redirect to `connect()` if wallet not connected

---

## Security Features

- ✅ Amount validation (must be > 0)
- ✅ Ethereum address validation via `ethers.isAddress()`
- ✅ fromChain ≠ toChain check for bridge
- ✅ Error handling for rejected transactions
- ✅ Error handling for contract reverts
- ✅ Transaction loading states on all buttons
- ✅ Success/error toast notifications with Etherscan links

---

## Features Implemented

| Feature | Status |
|---------|--------|
| MetaMask wallet connect | ✅ |
| Token swap (ETH ↔ RIALO ↔ USDC) | ✅ |
| Cross-chain bridge | ✅ |
| Stake tokens | ✅ |
| Unstake tokens | ✅ |
| Fetch live rewards | ✅ |
| Claim rewards | ✅ |
| Loading states | ✅ |
| Success notifications + tx hash | ✅ |
| Error handling | ✅ |
| Auto-refresh rewards (30s) | ✅ |
| Account change listener | ✅ |
| Chain change listener | ✅ |
| Staking event success listener | ✅ |
