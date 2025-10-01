require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '.env.local' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      // Optimize to reduce API calls
      timeout: 120000,
      // Skip gas estimation to save API calls
      gas: 5000000, // Fixed gas limit
      gasPrice: undefined // Let network decide
    }
  }
};
