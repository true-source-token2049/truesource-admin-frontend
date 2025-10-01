const hre = require("hardhat");

async function main() {
  console.log("Deploying EditableNFT contract (optimized)...");
  console.log("Network:", hre.network.name);
  
  const EditableNFT = await hre.ethers.getContractFactory("EditableNFT");
  
  console.log("Deploying with fixed gas limit...");
  const editableNFT = await EditableNFT.deploy({
    gasLimit: 3000000
  });
  
  console.log("Waiting for deployment transaction...");
  await editableNFT.waitForDeployment();
  
  const contractAddress = await editableNFT.getAddress();
  
  console.log("\n✅ SUCCESS!");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Ethereum Sepolia");
  console.log("View on Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log("\n📝 UPDATE YOUR .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\nFeatures:");
  console.log("✓ Anyone can mint NFTs");
  console.log("✓ Batch mint up to 100 NFTs in one transaction");
  console.log("✓ Gas-optimized minting");
  console.log("✓ NFT owners can attest with value and notes");
  
  console.log("\n⚠️  Skipping Etherscan verification to save API calls");
  console.log("You can verify manually later if needed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
