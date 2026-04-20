import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Deploy script for RialoGold (XAUt) contract.
 *
 * Usage:
 *   npx hardhat run scripts/deployXAUt.js --network sepolia
 *
 * After deployment, the contract address and ABI are automatically merged into
 * frontend/lib/contracts/deployedContracts.json so the frontend can pick them up
 * without any manual copy-paste.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying RialoGold (XAUt) with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  // ── Deploy RialoGold ──────────────────────────────────────────────────────
  const RialoGold = await ethers.getContractFactory("RialoGold");

  // Pass deployer as initialOwner (matches constructor signature)
  const xaut = await RialoGold.deploy(deployer.address);
  await xaut.waitForDeployment();

  const xautAddress = await xaut.getAddress();
  console.log("✅ RialoGold (XAUt) deployed to:", xautAddress);

  // ── Update frontend/lib/contracts/deployedContracts.json ─────────────────
  const contractsDir = path.join(__dirname, "../../frontend/lib/contracts");
  const contractsFile = path.join(contractsDir, "deployedContracts.json");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Read existing file so we don't overwrite RLO / Staking addresses
  let contractData = { address: {}, abi: {} };
  if (fs.existsSync(contractsFile)) {
    try {
      contractData = JSON.parse(fs.readFileSync(contractsFile, "utf8"));
    } catch {
      console.warn("Could not parse existing deployedContracts.json — starting fresh.");
    }
  }

  // Merge XAUt entry
  const xautArtifact = await pkg.artifacts.readArtifact("RialoGold");

  contractData.address.XAUt = xautAddress;
  contractData.abi.XAUt = xautArtifact.abi;

  fs.writeFileSync(contractsFile, JSON.stringify(contractData, null, 2));

  console.log("📄 Contract address and ABI merged into:");
  console.log("  ", contractsFile);
  console.log("\n─────────────────────────────────────────");
  console.log("XAUt Contract Address :", xautAddress);
  console.log("Owner (deployer)       :", deployer.address);
  console.log("─────────────────────────────────────────");
  console.log("\nNext step — verify on Etherscan:");
  console.log(
    `  npx hardhat verify --network sepolia ${xautAddress} "${deployer.address}"`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
