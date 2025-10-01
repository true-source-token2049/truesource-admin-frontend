# NFT Claim System - Approval-Based Transfer Architecture

## Overview

This document explains how the approval-based NFT claim system works, enabling retailers to authorize NFT transfers without exposing their private keys for every customer transaction.

## The Problem

In a traditional NFT distribution model, a retailer would need to:
1. Use their private key to sign every transfer transaction
2. Be online and available when a customer wants to claim
3. Manually process each transfer, creating a bottleneck
4. Potentially expose their private key through repeated use

This is **operationally inefficient** and **security-risky**.

## The Solution: Approval-Based Claims

Our system uses the ERC-721 standard's built-in `approve()` mechanism to enable **one-time authorization** that allows a smart contract to transfer NFTs on behalf of the retailer.

### How It Works

#### 1. The Power of "Approval" in the Smart Contract

The ERC-721 NFT standard includes an **approval mechanism** that allows NFT owners to delegate transfer authority to another address or smart contract.

**Retailer's Initial Action (One-Time Setup):**
Before the sale, or when the product is ready for distribution, the retailer executes a **single, signed transaction** using their private key to approve the Claim Contract.

**The Code:**
```solidity
// In the NFT contract (EditableNFT.sol)
function approve(address to, uint256 tokenId) public virtual
```

The retailer calls:
```javascript
nftContract.approve(claimContractAddress, tokenId)
```

**The Result:**
This action gives the Claim Contract the authority to move that specific NFT from the retailer's wallet on their behalf, but **only when certain conditions are met**.

#### 2. Creating a Claim Code

After approval, the retailer creates a claim code:

```solidity
// In NFTClaimContract.sol
function createClaim(string memory claimCode, uint256 tokenId) external
```

This function:
- Verifies the retailer owns the NFT
- Verifies the Claim Contract has approval
- Creates a unique claim entry linking the code to the NFT
- Stores the claim on-chain (hashed for security)

**Key Security Features:**
- Claim codes are **hashed** before storage (keccak256)
- Each code can only be used **once**
- Each code is tied to a **specific token ID**
- Only the **retailer who created it** can cancel it

#### 3. The Customer Claims the NFT

When the customer goes to the claim portal:

**Step 1: Customer Trigger**
- The customer submits the unique, one-time claim code
- The customer connects their wallet (this is the only private key involved in the final transfer)

**Step 2: Claim Contract Logic**
The claim system's backend calls the `executeClaim()` function:

```solidity
function executeClaim(string memory claimCode, address customerAddress) external
```

**Step 3: Conditions Check**
The Claim Contract automatically checks:

1. **Is this unique claim code valid and has it not been used before?**
   ```solidity
   require(claim.retailer != address(0), "Invalid claim code");
   require(!claim.isClaimed, "Claim already used");
   ```

2. **Does the contract have the right to move this specific NFT?**
   ```solidity
   address approvedAddress = nftContract.getApproved(claim.tokenId);
   require(
       approvedAddress == address(this) || 
       nftContract.isApprovedForAll(claim.retailer, address(this)),
       "Contract not approved"
   );
   ```

3. **Is the customer's wallet address valid?**
   ```solidity
   require(customerAddress != address(0), "Invalid customer address");
   ```

**Step 4: Automatic Transfer**
If all checks pass, the Claim Contract executes the final transfer:

```solidity
// Mark as claimed first (prevents reentrancy)
claim.isClaimed = true;
claim.claimedBy = customerAddress;
claim.claimedAt = block.timestamp;

// Transfer using pre-granted authority
nftContract.transferFrom(claim.retailer, customerAddress, claim.tokenId);
```

**Crucially**, this final transfer is executed by the **Claim Contract's logic**, using the **pre-granted authority** from the retailer—**not by a new transaction signed with the retailer's private key**.

## Security Benefits

### 1. One-Time Approval
✅ Retailer signs **once** to approve the NFT for claims  
✅ No need to sign again for the actual transfer  
✅ Approval is revocable by canceling the claim or transferring the NFT elsewhere

### 2. No Private Key Exposure
✅ Retailer never shares their private key  
✅ Retailer doesn't need to be online when customer claims  
✅ No manual intervention required for each claim

### 3. Automatic & Trustless Transfers
✅ Smart contract enforces all rules automatically  
✅ Each claim code works exactly once  
✅ No way to claim someone else's NFT  
✅ Retailer maintains ownership until the claim is executed

### 4. Unique & Hashed Codes
✅ Claim codes are hashed using keccak256  
✅ Cannot be guessed or brute-forced  
✅ Each code is unique and single-use  
✅ Stored on-chain for transparency

## Technical Flow

```
1. Retailer owns NFT (Token ID: 123)
   │
   ↓
2. Retailer approves Claim Contract
   │  nftContract.approve(claimContractAddress, 123)
   │  → Signs ONE transaction with private key
   │
   ↓
3. Retailer creates claim code
   │  claimContract.createClaim("CLAIM-ABC123", 123)
   │  → Claim code is hashed and stored on-chain
   │
   ↓
4. Retailer shares code with customer
   │  → "CLAIM-ABC123" sent via email, QR code, etc.
   │
   ↓
5. Customer connects wallet and enters code
   │  → Customer's wallet address: 0xCustomer...
   │
   ↓
6. Customer clicks "Claim NFT"
   │  claimContract.executeClaim("CLAIM-ABC123", 0xCustomer...)
   │  
   │  Contract checks:
   │  ✓ Code is valid
   │  ✓ Code not used before
   │  ✓ Retailer still owns NFT
   │  ✓ Contract still has approval
   │
   ↓
7. Automatic transfer executed
   │  nftContract.transferFrom(retailer, customer, 123)
   │  → Uses pre-approved authority (no retailer signature needed!)
   │
   ↓
8. Customer receives NFT in their wallet 🎉
   │  → Claim marked as used
   │  → Cannot be claimed again
```

## Code Examples

### Retailer: Approve NFT
```javascript
// Connect to NFT contract
const nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, signer);

// Approve the claim contract for a specific token
const tx = await nftContract.approve(CLAIM_CONTRACT_ADDRESS, tokenId);
await tx.wait();

console.log(`NFT ${tokenId} approved for claims!`);
```

### Retailer: Create Claim Code
```javascript
// Connect to claim contract
const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, CLAIM_ABI, signer);

// Create a claim code
const claimCode = "CLAIM-" + generateRandomString();
const tx = await claimContract.createClaim(claimCode, tokenId);
await tx.wait();

console.log(`Claim code created: ${claimCode}`);
// Share this code with customer
```

### Customer: Claim NFT
```javascript
// Connect to claim contract (customer's wallet)
const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, CLAIM_ABI, customerSigner);

// Execute the claim
const tx = await claimContract.executeClaim(claimCode, customerAddress);
await tx.wait();

console.log(`NFT claimed successfully!`);
```

## Smart Contract Architecture

### EditableNFT.sol
- Standard ERC-721 implementation
- Inherits from OpenZeppelin's contracts
- Includes built-in `approve()` function
- Supports `transferFrom()` for delegated transfers

### NFTClaimContract.sol
- Manages claim codes and NFT claims
- Stores claim data: code hash, token ID, retailer, status
- Validates claims before executing transfers
- Uses reentrancy guard for security
- Emits events for transparency

## Deployment & Setup

### 1. Deploy Contracts
```bash
# Deploy NFT contract first
npx hardhat run scripts/deploy-editable-nft.cjs --network sepolia

# Deploy claim contract (pass NFT contract address)
npx hardhat run scripts/deploy-claim-contract.cjs --network sepolia
```

### 2. Configure Environment
```bash
# .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...          # NFT contract
NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS=0x...    # Claim contract
```

### 3. Retailer Workflow
1. Mint NFTs or identify existing NFTs to make claimable
2. Go to "Retailer Claims Management" page
3. Approve each NFT for the claim contract
4. Generate unique claim codes
5. Share codes with customers

### 4. Customer Workflow
1. Receive claim code from retailer
2. Go to "Claim Your NFT" page
3. Connect wallet
4. Enter claim code
5. Verify NFT details
6. Click "Claim NFT" and confirm transaction
7. Receive NFT instantly!

## Benefits Summary

| Traditional Method | Approval-Based Claims |
|-------------------|----------------------|
| ❌ Retailer signs every transfer | ✅ Retailer signs once to approve |
| ❌ Retailer must be online | ✅ Automatic, 24/7 availability |
| ❌ Manual processing bottleneck | ✅ Instant, automated claims |
| ❌ Private key repeatedly exposed | ✅ No key exposure after initial approval |
| ❌ Scalability issues | ✅ Scales to unlimited claims |
| ❌ High operational overhead | ✅ Minimal ongoing work |

## Frequently Asked Questions

**Q: Does the retailer need to use their private key for every customer claim?**  
**A:** No! The retailer only signs once to approve the Claim Contract. After that, customers can claim without any action from the retailer.

**Q: What if the retailer wants to revoke a claim?**  
**A:** The retailer can call `cancelClaim(claimCode)` to revoke an unused claim code, or simply transfer/sell the NFT to revoke approval.

**Q: Can someone guess a claim code?**  
**A:** No. Claim codes are hashed using keccak256 and stored on-chain. They're also designed to be long and random, making brute-force attacks infeasible.

**Q: What happens if someone tries to use a claim code twice?**  
**A:** The smart contract checks if the code has been used and will reject any subsequent attempts. Each code works exactly once.

**Q: Does the customer need to pay gas fees?**  
**A:** Yes, the customer pays gas fees for the claim transaction. The retailer only pays gas for the initial approval and claim code creation.

**Q: Can the claim contract be used for multiple NFT contracts?**  
**A:** Each claim contract instance is tied to one NFT contract (set during deployment). You'd need separate claim contracts for different NFT contracts.

## Security Considerations

1. **Reentrancy Protection**: Uses OpenZeppelin's `ReentrancyGuard`
2. **State Before Interaction**: Marks claims as used before executing transfers
3. **Hash-Based Storage**: Claim codes are hashed, not stored in plain text
4. **Ownership Verification**: Checks retailer still owns NFT before transfer
5. **Approval Validation**: Verifies contract still has approval before transfer
6. **Single-Use Codes**: Each code can only be claimed once
7. **Access Control**: Only retailers can cancel their own claims

## Conclusion

The approval-based claim system is a **secure, efficient, and scalable** solution for NFT distribution. It leverages the ERC-721 standard's built-in approval mechanism to enable trustless, automated transfers without requiring retailers to expose their private keys or manually process each claim.

This architecture is ideal for:
- 🏪 Retail stores distributing product-linked NFTs
- 🎁 Gift card or voucher programs
- 🎟️ Event tickets and access passes
- 🎮 Gaming item distributions
- 📦 Supply chain authenticity certificates

The system eliminates operational bottlenecks while maintaining security and transparency through smart contract automation. 