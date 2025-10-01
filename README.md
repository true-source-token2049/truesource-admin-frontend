# Editable NFT Platform

A Next.js app for creating, minting, and editing NFTs with customizable attributes on Ethereum Sepolia.

## Features

- 🎨 Upload images to IPFS via Pinata
- 🪙 Mint NFTs to connected wallets (single or batch up to 100)
- ✏️ Edit NFT attributes (anyone can update)
- 🏆 Attest NFTs with value and notes (owners only)
- 🔄 Transfer NFTs to other addresses
- 🔗 Built on Ethereum Sepolia testnet
- 🛡️ OpenZeppelin ERC721 standard

## Prerequisites

1. **MetaMask** - Install from https://metamask.io
2. **Alchemy Account** - Get API key from https://alchemy.com
   - ⚠️ **IMPORTANT**: Your API key should be 32+ characters long
   - Free tier: 300 CU/s, 300k CU/day (sufficient for testing)
   - Paid tier recommended for production
3. **Pinata Account** - Get credentials from https://pinata.cloud
4. **Sepolia ETH** - Get testnet ETH from https://sepoliafaucet.com

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Alchemy API Key (MUST be 32+ characters)
# Get from: https://dashboard.alchemy.com/apps
NEXT_PUBLIC_ALCHEMY_API_KEY=your_full_alchemy_api_key_here

# Your deployed EditableNFT contract address
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Private key for minting transactions (without 0x prefix)
# ⚠️ Never commit this to git!
PRIVATE_KEY=your_private_key_here

# Pinata credentials
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
PINATA_ACCESS_TOKEN=your_pinata_jwt_token
```

### 3. Deploy Smart Contract

**Option A: Use existing contract**
If you already have a deployed contract, just update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`

**Option B: Deploy new contract**
```bash
# Make sure you have Sepolia ETH in your deployer wallet
npx hardhat run scripts/deploy-editable-nft.cjs --network sepolia
```

After deployment, copy the contract address to `.env.local`

### 4. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Usage

### Minting NFTs
1. Connect your MetaMask wallet
2. Switch to Sepolia network
3. Go to "Mint New NFT"
4. Upload an image
5. Enter name, description, and attributes
6. **Set quantity** (1-100) - mint multiple copies of the same NFT
7. Click "Mint NFT" - all copies will be sent to your connected wallet
8. **Confirm just ONE transaction in MetaMask** - all NFTs mint at once! ⚡

### Viewing & Editing NFTs
1. Go to "View & Edit NFTs"
2. Enter a token ID
3. View NFT details
4. Add/remove attributes
5. Update attributes (anyone can do this!)

### Attesting NFTs
1. Go to "Attest NFT"
2. Enter the token ID of an NFT you own
3. Enter a numeric value (e.g., quality rating, price estimate, etc.)
4. Add a descriptive note explaining the attestation
5. Click "Attest NFT" and confirm in MetaMask
6. View all attestations on the page - each attestation records:
   - The attester's wallet address
   - The value provided
   - The note/description
   - The timestamp of attestation

**Note:** Only the owner of an NFT can attest it. Attestations are permanently stored on the blockchain.

### Transferring NFTs
1. Go to "Transfer NFT"
2. Enter the token ID you want to transfer
3. Enter the recipient's Ethereum address
4. Click "Transfer NFT" and confirm in MetaMask

## Troubleshooting

### "Rate limit exceeded" or API errors
- ✅ Verify your Alchemy API key is complete (32+ characters)
- ✅ Check your Alchemy dashboard for quota usage
- ✅ Free tier limits: 300 CU/s, 300k CU/day
- ✅ Contract deployment uses ~1000-5000 CU
- ✅ Each mint uses ~100-300 CU
- ✅ Consider upgrading to paid tier if deploying frequently

### "Invalid API key"
- Your API key in `.env.local` must match your Alchemy dashboard
- Don't include quotes or extra spaces
- Restart the dev server after changing `.env.local`

### "Please switch to Sepolia network"
- Open MetaMask
- Click network dropdown
- Select "Sepolia" testnet
- If not visible, enable "Show test networks" in MetaMask settings

### Transaction fails
- Ensure you have Sepolia ETH in your wallet
- Check gas prices aren't too low
- Verify contract address is correct

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── mint-nft/     # Mint NFT endpoint
│   │   ├── attest-nft/   # Attest NFT endpoint
│   │   ├── transfer-nft/ # Transfer NFT endpoint
│   │   ├── update-attributes/  # Update attributes endpoint
│   │   └── nft-metadata/ # Fetch NFT data endpoint
│   ├── contexts/         # React contexts
│   │   └── WalletContext.js  # Wallet connection logic
│   ├── services/         # External services
│   │   └── pinata.js     # IPFS/Pinata integration
│   ├── nft-mint/        # Minting page
│   ├── nft-viewer/      # View/Edit page
│   ├── nft-attest/      # Attestation page
│   ├── nft-transfer/    # Transfer page
│   └── page.js          # Home page
├── contracts/
│   └── EditableNFT.sol  # Smart contract
├── scripts/
│   └── deploy-editable-nft.cjs  # Deployment script
└── .env.local           # Environment variables (not committed)
```

## Smart Contract Details

The `EditableNFT` contract allows:
- **Anyone** can mint NFTs (single or batch up to 100)
- **Anyone** can update attributes on existing NFTs
- **NFT owners** can attest their NFTs with value and notes
- Metadata stored on IPFS via Pinata
- Attributes stored on-chain and updatable
- Attestations stored permanently on-chain with attester address, value, note, and timestamp

## Security Notes

- ⚠️ Never commit `.env.local` or expose private keys
- ⚠️ This is a testnet app - don't use mainnet keys
- ⚠️ The contract allows anyone to update attributes (by design)
- ⚠️ For production, add access controls as needed

## License

MIT
