import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy RialoToken
  const RialoToken = await ethers.getContractFactory("RialoToken");
  const rlo = await RialoToken.deploy();
  await rlo.waitForDeployment();
  const rloAddress = await rlo.getAddress();
  console.log("RialoToken deployed to:", rloAddress);

  // 2. Deploy Staking
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(rloAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("Staking deployed to:", stakingAddress);

  // 3. Save addresses and ABIs for frontend
  const contractsDir = path.join(__dirname, "../../frontend/lib/contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const rloArtifact = await pkg.artifacts.readArtifact("RialoToken");
  const stakingArtifact = await pkg.artifacts.readArtifact("Staking");

  const contractData = {
    address: {
      RLO: rloAddress,
      Staking: stakingAddress,
    },
    abi: {
      RLO: rloArtifact.abi,
      Staking: stakingArtifact.abi,
    },
  };

  fs.writeFileSync(
    path.join(contractsDir, "deployedContracts.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract addresses and ABIs saved to frontend/lib/contracts/deployedContracts.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
