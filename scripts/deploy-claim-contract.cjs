const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFTClaimContract...\n");

  // Get the NFT contract address from environment
  const nftContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  
  if (!nftContractAddress) {
    throw new Error("❌ NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env.local");
  }

  console.log("📋 NFT Contract Address:", nftContractAddress);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying from account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const NFTClaimContract = await ethers.getContractFactory("NFTClaimContract");
  const claimContract = await NFTClaimContract.deploy(nftContractAddress);

  await claimContract.waitForDeployment();

  const claimContractAddress = await claimContract.getAddress();

  console.log("✅ NFTClaimContract deployed successfully!");
  console.log("📍 Contract Address:", claimContractAddress);
  console.log("\n📝 Next steps:");
  console.log("1. Add this to your .env.local file:");
  console.log(`   NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS=${claimContractAddress}`);
  console.log("\n2. Retailers need to approve this contract for their NFTs:");
  console.log("   - Go to the 'Manage Claims' page");
  console.log("   - Click 'Approve NFT' for each token they want to make claimable");
  console.log("\n3. Verify contract on Etherscan (optional):");
  console.log(`   npx hardhat verify --network sepolia ${claimContractAddress} ${nftContractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 