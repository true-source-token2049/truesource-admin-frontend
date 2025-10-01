# Quick Start: Testing the NFT Claim System

This guide will walk you through testing the approval-based NFT claim system from start to finish.

## Prerequisites

- MetaMask installed and connected to Sepolia testnet
- Sepolia ETH in your wallet (get from https://sepoliafaucet.com)
- Contracts deployed (EditableNFT and NFTClaimContract)
- Environment variables configured in `.env.local`

## Step-by-Step Testing Guide

### Phase 1: Setup (5 minutes)

#### 1. Deploy Contracts
```bash
# Deploy NFT contract
npx hardhat run scripts/deploy-editable-nft.cjs --network sepolia

# Copy the contract address and add to .env.local
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Deploy claim contract
npx hardhat run scripts/deploy-claim-contract.cjs --network sepolia

# Copy the claim contract address and add to .env.local
# NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS=0x...
```

#### 2. Start the App
```bash
npm run dev
```

Visit http://localhost:3000

### Phase 2: Retailer Setup (10 minutes)

#### 3. Connect as Retailer
- Open MetaMask
- Connect to the app on Sepolia network
- This wallet will act as the "retailer"

#### 4. Mint an NFT
- Go to "Mint New NFT" page
- Upload an image (try a product photo)
- Enter name: "Test Product NFT"
- Enter description: "This NFT proves ownership of Product #123"
- Set quantity: 1
- Click "Mint NFT" and confirm in MetaMask
- **Note the Token ID** (e.g., Token ID: 1)

#### 5. Approve the NFT for Claims
- Go to "Retailer Claims Management" page
- Enter the Token ID you just minted (e.g., 1)
- Click "Check Approval" - should show "⚠️ This NFT needs approval first"
- Click "✓ Approve NFT for Claims"
- Confirm the transaction in MetaMask
- Wait for confirmation
- You should see: "✅ NFT approved successfully!"

#### 6. Create a Claim Code
- Click "🎲 Generate Random Code" (e.g., CLAIM-ABC123XYZ)
- Or enter your own code
- Click "✓ Create Claim Code"
- Confirm the transaction in MetaMask
- Wait for confirmation
- **Copy the claim code** - you'll share this with the customer

### Phase 3: Customer Claims (5 minutes)

#### 7. Switch to Customer Wallet
You have two options:

**Option A: Use a different wallet**
- Create a new MetaMask account
- Get some Sepolia ETH for gas

**Option B: Use the same wallet (for testing)**
- Just continue with the same wallet
- In production, this would be a different person's wallet

#### 8. Claim the NFT
- Go to "Claim Your NFT" page
- Connect wallet (as the customer)
- Enter the claim code you copied earlier
- Click "Verify Code"
- You should see:
  - ✅ Valid claim code!
  - NFT details (image, name, description, token ID)
- Click "🎁 Claim NFT Now!"
- Confirm the transaction in MetaMask
- Wait for confirmation
- You should see: "🎉 Success! NFT claimed successfully!"

#### 9. Verify the Transfer
- Go to "View & Edit NFTs" page
- Enter the Token ID
- Check the owner address - it should now be the customer's wallet!
- View the NFT history page to see the transfer event

### Phase 4: Test Edge Cases (5 minutes)

#### 10. Try Using the Same Code Again
- Go back to "Claim Your NFT"
- Enter the same claim code
- Click "Verify Code"
- You should see: "❌ This claim code has already been used"
- This proves each code works only once!

#### 11. Test Canceling a Claim
- As the retailer, mint another NFT (Token ID: 2)
- Approve it for claims
- Create a claim code (e.g., CLAIM-TEST456)
- **Before anyone claims it**, go to the "Cancel a Claim" section
- Enter the claim code
- Click "Cancel Claim"
- Confirm in MetaMask
- Now try to claim with that code - should fail!

#### 12. Test Invalid Code
- Go to "Claim Your NFT"
- Enter a random code like "INVALID-CODE"
- Click "Verify Code"
- You should see: "❌ Invalid claim code"

## Testing Checklist

Use this checklist to ensure everything works:

- [ ] NFT contract deployed
- [ ] Claim contract deployed
- [ ] Environment variables configured
- [ ] App running on localhost:3000
- [ ] Connected wallet to Sepolia
- [ ] Minted at least one NFT
- [ ] Approved NFT for claim contract
- [ ] Created claim code
- [ ] Shared code (or copied for testing)
- [ ] Customer claimed NFT successfully
- [ ] NFT transferred to customer wallet
- [ ] Tried using same code again (should fail)
- [ ] Tested canceling a claim
- [ ] Tested invalid claim code

## Expected Results

### ✅ Success Indicators
- Retailer approves NFT with one signature
- Claim code created on-chain
- Customer claims without retailer involvement
- NFT transfers instantly to customer
- Used codes can't be claimed again
- Canceled codes can't be claimed
- Invalid codes are rejected

### ❌ Common Issues

**Issue: "Contract not approved for this NFT"**
- Solution: Make sure you clicked "Approve NFT for Claims" first

**Issue: "Claim code already exists"**
- Solution: Each code must be unique. Generate a new one.

**Issue: "You don't own this NFT"**
- Solution: Make sure you're using the retailer's wallet that owns the NFT

**Issue: "Invalid claim code"**
- Solution: Double-check the claim code. It's case-sensitive.

**Issue: "Please switch to Sepolia network"**
- Solution: Open MetaMask and switch to Sepolia testnet

**Issue: Transaction fails**
- Solution: Ensure you have enough Sepolia ETH for gas fees

## Real-World Simulation

### Scenario: Sneaker Store with NFT Authenticity Certificates

1. **Retailer (Sneaker Store)**
   - Mints 10 NFTs, one for each pair of limited edition sneakers
   - Approves all 10 NFTs for the claim contract (10 transactions)
   - Creates 10 unique claim codes (10 transactions)
   - Prints QR codes with claim codes on shoe boxes

2. **Customer 1 buys Sneaker #1**
   - Scans QR code to get claim code
   - Goes to claim portal
   - Claims NFT instantly (no waiting for retailer!)

3. **Customers 2-10 buy remaining sneakers**
   - Each scans their QR code
   - Each claims their NFT instantly
   - All happen simultaneously - no bottleneck!

4. **Result**
   - Retailer signed: 20 transactions total (10 approvals + 10 claim codes)
   - Without claim system: Would need 30 transactions (10 mints + 10 approvals + 10 transfers)
   - More importantly: Transfers happen instantly without retailer being online!

## Next Steps

After successful testing:

1. **For Development:**
   - Integrate claim code generation with your existing order system
   - Add QR code generation for claim codes
   - Set up email notifications with claim codes
   - Add claim code analytics dashboard

2. **For Production:**
   - Deploy contracts to mainnet
   - Update environment variables
   - Test thoroughly on mainnet
   - Implement additional security measures (rate limiting, etc.)
   - Set up monitoring and alerts

3. **For Users:**
   - Create customer-facing documentation
   - Design claim code delivery method (email, QR, etc.)
   - Set up customer support for claim issues
   - Monitor claim success rates

## Troubleshooting

### Check Contract Deployment
```bash
# Verify contracts are deployed
npx hardhat verify --network sepolia <NFT_CONTRACT_ADDRESS>
npx hardhat verify --network sepolia <CLAIM_CONTRACT_ADDRESS> <NFT_CONTRACT_ADDRESS>
```

### Check Approval Status
```javascript
// In browser console
const provider = new ethers.BrowserProvider(window.ethereum);
const nft = new ethers.Contract(NFT_ADDRESS, ['function getApproved(uint256) view returns (address)'], provider);
const approved = await nft.getApproved(tokenId);
console.log('Approved address:', approved);
```

### Check Claim Status
```javascript
// In browser console
const provider = new ethers.BrowserProvider(window.ethereum);
const claim = new ethers.Contract(CLAIM_ADDRESS, ['function checkClaim(string) view returns (bool, uint256, address, bool)'], provider);
const [isValid, tokenId, retailer, isClaimed] = await claim.checkClaim('CLAIM-ABC123');
console.log({ isValid, tokenId: tokenId.toString(), retailer, isClaimed });
```

## Success! 🎉

If you've completed all the steps, you've successfully:
- ✅ Deployed an approval-based NFT claim system
- ✅ Approved NFTs for automated transfers
- ✅ Created secure, one-time claim codes
- ✅ Enabled customers to claim NFTs instantly
- ✅ Eliminated the need for retailers to sign each transfer
- ✅ Built a scalable NFT distribution system

## Learn More

- Read `CLAIM_SYSTEM.md` for detailed architecture documentation
- Check `README.md` for full platform features
- Explore the smart contracts in `contracts/` directory
- Review the frontend code in `app/retailer-claims/` and `app/customer-claim/`

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your MetaMask is on Sepolia network
3. Ensure you have Sepolia ETH for gas
4. Check that both contracts are deployed
5. Verify environment variables are set correctly

Happy claiming! 🎁 