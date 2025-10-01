# Batch Operations Guide

## Overview

Process multiple NFTs efficiently with batch operations! Instead of signing 100 separate transactions, sign just 1 or 2.

## Two Powerful Options

### Option 1: Approve ALL NFTs at Once (Recommended) ⚡

**What it does:**
- Gives the claim contract permission to manage **ALL** your current and future NFTs
- Sign **once**, works forever (until you revoke)
- Most gas-efficient for ongoing operations

**Use when:**
- You have many NFTs to make claimable
- You'll be creating claims regularly
- You want maximum convenience

**How it works:**
```solidity
// Single transaction approves everything
nftContract.setApprovalForAll(claimContractAddress, true)
```

**Cost:** ~45,000 gas (one time)

**Steps:**
1. Go to Retailer Claims page
2. Scroll to "Batch Operations"
3. Click "⚡ Approve All NFTs at Once"
4. Confirm in MetaMask
5. Done! Now create claims for any NFT without additional approvals

---

### Option 2: Batch Create Claims ⚡

**What it does:**
- Creates up to 100 claim codes in a single transaction
- Must be approved first (individually or via "Approve All")

**Use when:**
- You have multiple NFTs ready to distribute
- You've already approved them
- You want to create many claims at once

**How it works:**
```solidity
// One transaction creates multiple claims
claimContract.createClaimBatch(
  ["CODE-1", "CODE-2", "CODE-3"],
  [tokenId1, tokenId2, tokenId3]
)
```

**Cost:** ~80,000 gas + (~30,000 gas × number of claims)

**Steps:**
1. Ensure NFTs are approved (use Option 1 or individual approvals)
2. Enter token IDs: `1, 2, 3, 4, 5`
3. Enter claim codes (one per line):
   ```
   PRODUCT-001
   PRODUCT-002
   PRODUCT-003
   PRODUCT-004
   PRODUCT-005
   ```
4. Click "⚡ Create Batch Claims"
5. Confirm in MetaMask
6. All claims created!

---

## Comparison: Single vs Batch

### Single NFT Workflow:
```
For 10 NFTs:
- Approve NFT #1 → Sign transaction
- Create claim for #1 → Sign transaction
- Approve NFT #2 → Sign transaction
- Create claim for #2 → Sign transaction
... repeat 8 more times ...

Total: 20 transactions! 😓
```

### Batch Workflow (Option 1):
```
For 10 NFTs:
- Approve ALL NFTs → Sign ONCE
- Create 10 claims in batch → Sign ONCE

Total: 2 transactions! 🎉
```

### Batch Workflow (Option 2):
```
For 10 NFTs (already approved):
- Create 10 claims in batch → Sign ONCE

Total: 1 transaction! ⚡
```

---

## Gas Cost Comparison

| Method | # of NFTs | Transactions | Approx Gas Cost |
|--------|-----------|--------------|-----------------|
| Single | 10 | 20 | ~1,300,000 gas |
| Batch (Option 1 + 2) | 10 | 2 | ~345,000 gas |
| **Savings** | | **18 fewer** | **~73% less!** |

---

## Example Use Cases

### Scenario 1: Sneaker Store with 100 Pairs

**Without Batch:**
- 100 approvals = 100 transactions
- 100 claim codes = 100 transactions
- **Total: 200 transactions** 😱
- Time: ~50 minutes (15s per tx)

**With Batch:**
- 1 "Approve All" = 1 transaction
- 1 batch create (100 codes) = 1 transaction
- **Total: 2 transactions** 🎉
- Time: ~30 seconds

---

### Scenario 2: Art Gallery with 50 Pieces

**Workflow:**
1. Click "Approve All NFTs" → Done ✅
2. Prepare claim codes in spreadsheet
3. Copy token IDs: `1,2,3,...,50`
4. Copy claim codes (one per line)
5. Click "Create Batch Claims" → Done ✅

**Result:** 50 NFTs ready for claiming in 2 transactions!

---

## Input Format Examples

### Token IDs (comma-separated):
```
1, 2, 3, 4, 5
```
or
```
1,2,3,4,5
```
or
```
100, 101, 102, 103, 104, 105
```

### Claim Codes (one per line):
```
SNEAKER-AIR-001
SNEAKER-AIR-002
SNEAKER-AIR-003
SNEAKER-AIR-004
SNEAKER-AIR-005
```

or custom format:
```
ORDER-12345-NFT
ORDER-12346-NFT
ORDER-12347-NFT
ORDER-12348-NFT
ORDER-12349-NFT
```

---

## Best Practices

### ✅ Do:
- Use "Approve All" if you're creating claims regularly
- Keep claim codes organized (spreadsheet, database)
- Test with 2-3 NFTs first before doing 100
- Verify token IDs match claim codes (same order)

### ❌ Don't:
- Mix up the order of token IDs and claim codes
- Exceed 100 claims per batch (smart contract limit)
- Forget to approve NFTs first (Option 2 requires approval)
- Use duplicate claim codes (each must be unique)

---

## Security Notes

### "Approve All" Safety:
- ✅ You can revoke anytime by calling `setApprovalForAll(contract, false)`
- ✅ Contract is non-custodial (doesn't hold your NFTs)
- ✅ Only works with the specific claim contract address
- ✅ Claim contract is open-source and auditable

### What "Approve All" Does NOT Do:
- ❌ Doesn't transfer your NFTs
- ❌ Doesn't let others create claims (only you can)
- ❌ Doesn't give unlimited access to anyone
- ❌ Doesn't affect other contracts or NFTs

---

## Troubleshooting

**Error: "Arrays length mismatch"**
- Ensure token IDs count matches claim codes count
- Check for extra commas or empty lines

**Error: "Contract not approved"**
- Use "Approve All NFTs" first
- Or approve each NFT individually

**Error: "Max 100 claims per batch"**
- Split into multiple batches
- Process 100 at a time

**Error: "Claim code already exists"**
- All codes must be unique
- Use different codes for each NFT

---

## Technical Details

### Smart Contract Function:
```solidity
function createClaimBatch(
    string[] memory claimCodes, 
    uint256[] memory tokenIds
) external nonReentrant {
    require(claimCodes.length == tokenIds.length, "Mismatch");
    require(claimCodes.length > 0 && claimCodes.length <= 100, "Invalid length");
    
    for (uint256 i = 0; i < claimCodes.length; i++) {
        _createClaim(claimCodes[i], tokenIds[i]);
    }
}
```

### Gas Formula:
```
Total Gas ≈ 80,000 (base) + (30,000 × number_of_claims)

Examples:
- 1 claim:   ~110,000 gas
- 10 claims: ~380,000 gas
- 50 claims: ~1,580,000 gas
- 100 claims: ~3,080,000 gas
```

---

## FAQ

**Q: Do I need to re-approve after creating claims?**  
A: No! Once approved (especially with "Approve All"), you can create unlimited claims.

**Q: Can I mix batch and single operations?**  
A: Yes! Use batch for bulk operations and single for one-off claims.

**Q: What happens if one NFT in the batch isn't approved?**  
A: The entire transaction fails. All must be approved.

**Q: Can I approve some NFTs but not all?**  
A: Yes, use individual `approve()` calls instead of `setApprovalForAll()`.

**Q: Is there a limit to how many NFTs I can approve at once?**  
A: No limit with "Approve All" - it covers all current and future NFTs.

**Q: How do I revoke "Approve All"?**  
A: Call `setApprovalForAll(claimContractAddress, false)` on the NFT contract.

---

## Quick Reference

| Task | Method | Transactions | Gas |
|------|--------|--------------|-----|
| Make 1 NFT claimable | Single | 2 | ~130k |
| Make 10 NFTs claimable | Batch | 2 | ~345k |
| Make 100 NFTs claimable | Batch | 2 | ~3.1M |
| Ongoing operations | Approve All | 1 (once) | ~45k |

**Bottom Line:** Batch operations save time, money, and hassle! ⚡ 