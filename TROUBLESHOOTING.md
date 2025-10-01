# Troubleshooting Alchemy Rate Limits

## The Problem

You're experiencing rate limit errors when:
- Deploying smart contracts
- Minting NFTs
- Updating attributes
- Fetching NFT data

## Root Cause Analysis

### 1. **CRITICAL: Invalid API Key** ⚠️

Your current API key `RLFOGodGCET-07wIcb2Qi` is **incomplete or invalid**.

**Valid Alchemy API keys look like:**
```
aB3dEfG7HiJkLmNoPqRsTuVwXyZ1234567890aBcD
```
(32+ characters, alphanumeric)

**How to get a proper API key:**

1. Go to https://dashboard.alchemy.com/
2. Sign up or log in
3. Click "Create App" or "+ Create new app"
4. Fill in:
   - Name: "Editable NFT Platform"
   - Chain: Ethereum
   - Network: Sepolia
5. Click the app name
6. Click "API KEY" button
7. Copy the **full API key** (32+ characters)
8. Update your `.env.local`:
   ```bash
   NEXT_PUBLIC_ALCHEMY_API_KEY=<paste_your_full_key_here>
   ```
9. Restart your dev server: `npm run dev`

### 2. Free Tier Limits

Alchemy free tier provides:
- **300 compute units per second (CU/s)**
- **300,000 CU per day**

**Compute Unit Consumption:**
| Operation | CU Cost | Example |
|-----------|---------|---------|
| Contract deployment | 1,000-5,000 | Deploying EditableNFT |
| Mint transaction | 100-300 | Minting 1 NFT |
| Transaction receipt | 50-100 | Waiting for confirmation |
| Read contract state | 20-50 | Fetching tokenURI |
| Gas estimation | 50-100 | Estimating gas (disabled in our code) |

**Example usage:**
- 1 contract deployment = ~3,000 CU
- 10 NFT mints = ~2,000 CU
- **Total = 5,000 CU** (well within daily limit)

### 3. What Causes Rate Limit Errors

❌ **Invalid API key** - Every failed request counts against your quota
❌ **Too many requests per second** - Burst of operations
❌ **Gas estimation enabled** - Extra API calls (we disabled this)
❌ **Multiple provider instances** - Can cause connection issues

## Solutions

### Immediate Fix: Get Valid API Key

```bash
# Step 1: Go to Alchemy Dashboard
https://dashboard.alchemy.com/apps

# Step 2: Create or select Sepolia app

# Step 3: Copy FULL API key (should be 32+ characters)

# Step 4: Update .env.local
NEXT_PUBLIC_ALCHEMY_API_KEY=your_real_32plus_character_key_here

# Step 5: Restart dev server
npm run dev
```

### Check Your Usage

1. Visit https://dashboard.alchemy.com/
2. Select your app
3. Go to "Metrics" tab
4. Check:
   - Requests per second
   - Daily compute units used
   - Error rate

### Upgrade If Needed

If you're deploying contracts frequently or have high usage:

**Growth Tier ($49/month):**
- 1,500 CU/s
- 3,000,000 CU/day
- Better for development/testing

**Scale Tier ($199/month):**
- 3,000 CU/s
- Unlimited daily CU
- Production-ready

### Code Optimizations (Already Implemented)

✅ **Fixed gas limits** - No gas estimation API calls
```javascript
const tx = await contract.mint(recipientAddress, metadataUrl, {
  gasLimit: 500000  // Pre-set, no estimation needed
});
```

✅ **Single provider instance** in WalletContext
✅ **Efficient event parsing** for token IDs
✅ **Minimal contract ABI** - Only needed functions

## Testing Without Hitting Limits

### 1. Use Public RPC (Fallback)

If you need to test without Alchemy, temporarily use public Sepolia RPC:

```javascript
// In hardhat.config.cjs
sepolia: {
  url: "https://rpc.sepolia.org",  // Public RPC (slower, less reliable)
  accounts: [process.env.PRIVATE_KEY]
}
```

⚠️ Not recommended for production - public RPCs are unreliable

### 2. Deploy Contract Once

Don't redeploy the contract repeatedly:
```bash
# Deploy once
npx hardhat run scripts/deploy-editable-nft.cjs --network sepolia

# Copy address to .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Your deployed contract

# Reuse for all testing
```

### 3. Batch Testing

Instead of testing one mint at a time:
- Plan your test scenarios
- Test UI/UX without blockchain first
- Do actual mints in batches when ready

## Monitoring

### Check if API key is working:

```bash
# Test your Alchemy connection
curl -X POST \
  https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x..." // Current block number
}
```

**Error response (invalid key):**
```json
{
  "error": {
    "message": "Invalid API key"
  }
}
```

## Common Error Messages

### "429 Too Many Requests"
- Check API key is valid (32+ chars)
- Check Alchemy dashboard for usage
- Wait 1 minute and retry
- Consider upgrading plan

### "Invalid API key"
- API key is too short or incorrect
- Get new key from dashboard
- Update `.env.local`
- Restart dev server

### "Network request failed"
- Check internet connection
- Verify Sepolia network is selected
- Check Alchemy status: https://status.alchemy.com/

## Best Practices

1. ✅ **Use one API key per project**
2. ✅ **Monitor usage in Alchemy dashboard**
3. ✅ **Keep API keys in `.env.local` (gitignored)**
4. ✅ **Deploy contracts once, reuse address**
5. ✅ **Use fixed gas limits (already done)**
6. ✅ **Cache contract data when possible**
7. ✅ **Test on testnet first**
8. ✅ **Upgrade to paid tier for production**

## Still Having Issues?

1. **Verify API key length**: Should be 32+ characters
2. **Check Alchemy dashboard**: See actual usage
3. **Restart dev server**: After changing `.env.local`
4. **Clear browser cache**: Sometimes helps with wallet connections
5. **Try different browser**: Rule out browser-specific issues
6. **Check Alchemy status**: https://status.alchemy.com/

## Contact Support

If issues persist after getting valid API key:
- Alchemy Support: https://www.alchemy.com/support
- Discord: https://discord.gg/alchemy 