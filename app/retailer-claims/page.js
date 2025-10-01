'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';

const CLAIM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)"
];

const CLAIM_CONTRACT_ABI = [
  "function createClaim(string memory claimCode, uint256 tokenId) external",
  "function createClaimBatch(string[] memory claimCodes, uint256[] memory tokenIds) external",
  "function cancelClaim(string memory claimCode) external",
  "function checkClaim(string memory claimCode) external view returns (bool isValid, uint256 tokenId, address retailer, bool isClaimed)",
  "function nftContract() view returns (address)"
];

export default function RetailerClaims() {
  const { account, isCorrectNetwork } = useWallet();
  
  // Check approval for all on mount
  useEffect(() => {
    if (account && CLAIM_CONTRACT_ADDRESS) {
      checkApprovalForAll();
    }
  }, [account]);
  
  const [tokenId, setTokenId] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  
  // Batch operations state
  const [batchTokenIds, setBatchTokenIds] = useState('');
  const [batchClaimCodes, setBatchClaimCodes] = useState('');
  const [isApprovedForAll, setIsApprovedForAll] = useState(false);
  const [codePrefix, setCodePrefix] = useState('PRODUCT');
  const [findingTokens, setFindingTokens] = useState(false);
  const [myTokenIds, setMyTokenIds] = useState([]);

  // Generate a random claim code
  const generateClaimCode = () => {
    const code = 'CLAIM-' + Math.random().toString(36).substring(2, 15).toUpperCase();
    setGeneratedCode(code);
    setClaimCode(code);
  };

  // Find all token IDs owned by the user
  const findMyTokenIds = async () => {
    setFindingTokens(true);
    setError('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      
      // Get total supply
      const totalSupply = await nftContract.totalSupply ? await nftContract.totalSupply() : 100;
      
      const myTokens = [];
      
      setSuccess(`🔍 Scanning tokens 1 to ${totalSupply}...`);
      
      // Check each token (up to 100 for performance)
      const maxToCheck = Math.min(parseInt(totalSupply.toString()), 100);
      for (let i = 1; i <= maxToCheck; i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            myTokens.push(i);
          }
        } catch (err) {
          // Token doesn't exist or other error, skip
        }
      }
      
      setMyTokenIds(myTokens);
      
      if (myTokens.length === 0) {
        setError('No NFTs found! Mint some NFTs first.');
      } else {
        setBatchTokenIds(myTokens.join(', '));
        setSuccess(`✅ Found ${myTokens.length} NFTs you own: ${myTokens.join(', ')}`);
      }
    } catch (err) {
      console.error('Error finding tokens:', err);
      setError('Failed to find your tokens: ' + err.message);
    } finally {
      setFindingTokens(false);
    }
  };

  // Auto-generate batch codes based on token IDs
  const autoGenerateBatchCodes = () => {
    if (!batchTokenIds) {
      setError('Please enter token IDs first');
      return;
    }

    try {
      const tokenIds = batchTokenIds.split(',').map(id => id.trim()).filter(id => id);
      
      if (tokenIds.length === 0) {
        setError('No valid token IDs found');
        return;
      }

      if (tokenIds.length > 100) {
        setError('Maximum 100 claims per batch');
        return;
      }

      // Generate codes with format: PREFIX-TOKENID-RANDOM
      const codes = tokenIds.map(tokenId => {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${codePrefix}-${tokenId}-${randomPart}`;
      });

      setBatchClaimCodes(codes.join('\n'));
      setSuccess(`✅ Generated ${codes.length} unique claim codes!`);
      setError('');
    } catch (err) {
      setError('Failed to generate codes: ' + err.message);
    }
  };

  // Check if NFT is approved
  const checkApproval = async () => {
    if (!tokenId) {
      setError('Please enter a token ID');
      return;
    }

    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract not deployed. Please deploy it first using: npx hardhat run scripts/deploy-claim-contract.cjs --network sepolia');
      return;
    }

    setCheckingApproval(true);
    setError('');
    setSuccess('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      
      const approvedAddress = await nftContract.getApproved(tokenId);
      const approved = approvedAddress.toLowerCase() === CLAIM_CONTRACT_ADDRESS.toLowerCase();
      
      setIsApproved(approved);
      
      if (approved) {
        setSuccess('✅ This NFT is approved for claims!');
      } else {
        setError('⚠️ This NFT needs approval first');
      }
    } catch (err) {
      console.error('Error checking approval:', err);
      setError('Failed to check approval: ' + (err.reason || err.message));
    } finally {
      setCheckingApproval(false);
    }
  };

  // Approve the claim contract for a specific NFT
  const approveNFT = async () => {
    if (!tokenId) {
      setError('Please enter a token ID');
      return;
    }

    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract not deployed. Please deploy it first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);

      // Check ownership
      const owner = await nftContract.ownerOf(tokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('You do not own this NFT');
      }

      // Approve the claim contract
      const tx = await nftContract.approve(CLAIM_CONTRACT_ADDRESS, tokenId);
      setSuccess('⏳ Approving NFT... Please wait for confirmation.');
      
      await tx.wait();
      
      setSuccess('✅ NFT approved successfully! You can now create a claim code.');
      setIsApproved(true);
    } catch (err) {
      console.error('Error approving NFT:', err);
      setError('Failed to approve NFT: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Create a claim code
  const createClaim = async () => {
    if (!tokenId || !claimCode) {
      setError('Please enter both token ID and claim code');
      return;
    }

    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract not deployed. Please deploy it first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, CLAIM_CONTRACT_ABI, signer);

      const tx = await claimContract.createClaim(claimCode, tokenId);
      setSuccess('⏳ Creating claim code... Please wait for confirmation.');
      
      await tx.wait();
      
      setSuccess(`✅ Claim created successfully! 
      
Claim Code: ${claimCode}
Token ID: ${tokenId}

Share this code with your customer. They can use it to claim the NFT.`);
    } catch (err) {
      console.error('Error creating claim:', err);
      setError('Failed to create claim: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cancel a claim
  const cancelClaim = async () => {
    if (!claimCode) {
      setError('Please enter a claim code to cancel');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, CLAIM_CONTRACT_ABI, signer);

      const tx = await claimContract.cancelClaim(claimCode);
      setSuccess('⏳ Cancelling claim... Please wait for confirmation.');
      
      await tx.wait();
      
      setSuccess('✅ Claim cancelled successfully!');
      setClaimCode('');
      setGeneratedCode('');
    } catch (err) {
      console.error('Error cancelling claim:', err);
      setError('Failed to cancel claim: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Check if approved for all
  const checkApprovalForAll = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      
      const approved = await nftContract.isApprovedForAll(account, CLAIM_CONTRACT_ADDRESS);
      setIsApprovedForAll(approved);
      
      if (approved) {
        setSuccess('✅ All your NFTs are approved for claims!');
      }
      
      return approved;
    } catch (err) {
      console.error('Error checking approval for all:', err);
      return false;
    }
  };

  // Approve ALL NFTs at once
  const approveAllNFTs = async () => {
    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract not deployed. Please deploy it first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);

      const tx = await nftContract.setApprovalForAll(CLAIM_CONTRACT_ADDRESS, true);
      setSuccess('⏳ Approving all NFTs... Please wait for confirmation.');
      
      await tx.wait();
      
      setSuccess('✅ All your NFTs are now approved for claims! You can create claim codes for any NFT you own.');
      setIsApprovedForAll(true);
    } catch (err) {
      console.error('Error approving all NFTs:', err);
      setError('Failed to approve all NFTs: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Create batch claims
  const createBatchClaims = async () => {
    if (!batchTokenIds || !batchClaimCodes) {
      setError('Please enter both token IDs and claim codes');
      return;
    }

    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract not deployed. Please deploy it first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Parse input
      const tokenIds = batchTokenIds.split(',').map(id => id.trim()).filter(id => id);
      const claimCodes = batchClaimCodes.split('\n').map(code => code.trim()).filter(code => code);

      if (tokenIds.length !== claimCodes.length) {
        throw new Error(`Mismatch: ${tokenIds.length} token IDs but ${claimCodes.length} claim codes`);
      }

      if (tokenIds.length === 0) {
        throw new Error('No token IDs provided');
      }

      if (tokenIds.length > 100) {
        throw new Error('Maximum 100 claims per batch');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, CLAIM_CONTRACT_ABI, signer);

      // PRE-VALIDATE: Check ownership and approval for each NFT
      setSuccess(`🔍 Validating ${tokenIds.length} NFTs...`);
      
      const validationErrors = [];
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        
        try {
          // Check if token exists and who owns it
          const owner = await nftContract.ownerOf(tokenId);
          
          if (owner.toLowerCase() !== account.toLowerCase()) {
            validationErrors.push(`Token ${tokenId}: You don't own this NFT (owned by ${owner.slice(0, 8)}...)`);
            continue;
          }

          // Check if approved
          const approvedAddress = await nftContract.getApproved(tokenId);
          const isApprovedForAll = await nftContract.isApprovedForAll(account, CLAIM_CONTRACT_ADDRESS);
          
          if (approvedAddress.toLowerCase() !== CLAIM_CONTRACT_ADDRESS.toLowerCase() && !isApprovedForAll) {
            validationErrors.push(`Token ${tokenId}: Not approved. Use "Approve All NFTs" first.`);
          }
        } catch (err) {
          validationErrors.push(`Token ${tokenId}: ${err.message}`);
        }
      }

      // If there are validation errors, show them
      if (validationErrors.length > 0) {
        throw new Error(`❌ Validation failed:\n\n${validationErrors.join('\n')}\n\n💡 Solution: Click "⚡ Approve All NFTs at Once" above first!`);
      }

      // All validated! Proceed with batch creation
      setSuccess(`✅ Validation passed! Creating ${tokenIds.length} claims...`);

      const tx = await claimContract.createClaimBatch(claimCodes, tokenIds);
      setSuccess(`⏳ Transaction submitted! Creating ${tokenIds.length} claims... Please wait for confirmation.`);
      
      await tx.wait();
      
      setSuccess(`✅ Batch created successfully! 

${tokenIds.length} claims created:
${claimCodes.map((code, i) => `Token ${tokenIds[i]}: ${code}`).join('\n')}

Share these codes with your customers.`);
      
      setBatchTokenIds('');
      setBatchClaimCodes('');
    } catch (err) {
      console.error('Error creating batch claims:', err);
      setError(err.message || 'Failed to create batch claims: ' + (err.reason || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Retailer Claims Management</h1>
            <p className="text-gray-600">Please connect your wallet to manage NFT claims.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Retailer Claims Management</h1>
            <p className="text-red-600">Please switch to Sepolia network.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏪 Retailer Claims Management</h1>
          <p className="text-gray-600 mb-6">
            Approve your NFTs and create claim codes for customers. No need to sign every transfer!
          </p>

          {/* Claim Contract Not Deployed Warning */}
          {!CLAIM_CONTRACT_ADDRESS && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Claim Contract Not Deployed</h3>
              <p className="text-yellow-700 text-sm mb-2">
                The claim contract hasn't been deployed yet. Deploy it first to use this feature.
              </p>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded block mt-2">
                npx hardhat run scripts/deploy-claim-contract.cjs --network sepolia
              </code>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
              <li>Approve the Claim Contract to manage your NFT (one-time action)</li>
              <li>Generate and create a unique claim code for the NFT</li>
              <li>Share the code with your customer</li>
              <li>Customer claims the NFT using the code (no signature needed from you!)</li>
            </ol>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 whitespace-pre-line">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700 whitespace-pre-line">{success}</p>
            </div>
          )}

          {/* Step 1: Enter Token ID */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Step 1: Enter Token ID</h2>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Token ID"
                value={tokenId}
                onChange={(e) => {
                  setTokenId(e.target.value);
                  setIsApproved(false);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={checkApproval}
                disabled={checkingApproval || !tokenId}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {checkingApproval ? 'Checking...' : 'Check Approval'}
              </button>
            </div>
          </div>

          {/* Step 2: Approve NFT */}
          {tokenId && !isApproved && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Step 2: Approve NFT</h2>
              <button
                onClick={approveNFT}
                disabled={loading}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Approving...' : '✓ Approve NFT for Claims'}
              </button>
            </div>
          )}

          {/* Step 3: Create Claim Code */}
          {tokenId && isApproved && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Step 3: Create Claim Code</h2>
              
              <div className="mb-4">
                <button
                  onClick={generateClaimCode}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  🎲 Generate Random Code
                </button>
              </div>

              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Claim Code (e.g., CLAIM-ABC123)"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                onClick={createClaim}
                disabled={loading || !claimCode}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Creating...' : '✓ Create Claim Code'}
              </button>
            </div>
          )}

          {/* Batch Operations Section */}
          <div className="border-t-2 border-gray-200 pt-8 mt-8">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                ⚡ Batch Operations
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-semibold">FASTER</span>
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Process multiple NFTs at once! Much more efficient for large quantities.
              </p>

              {/* Approve All NFTs */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Option 1: Approve ALL Your NFTs (Recommended)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sign once to approve ALL NFTs you own. Then create claims for any NFT without individual approvals.
                </p>
                <button
                  onClick={approveAllNFTs}
                  disabled={loading || isApprovedForAll}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {loading ? 'Approving...' : isApprovedForAll ? '✅ All NFTs Approved' : '⚡ Approve All NFTs at Once'}
                </button>
              </div>

              {/* Batch Create Claims */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Option 2: Batch Create Claims</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create up to 100 claim codes in a single transaction. Must be approved first.
                </p>
                
                <div className="space-y-4">
                  {/* Token IDs Input */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Token IDs (comma-separated):
                      </label>
                      <button
                        onClick={findMyTokenIds}
                        disabled={findingTokens}
                        className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                      >
                        {findingTokens ? '🔍 Finding...' : '🔍 Find My NFTs'}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="1, 2, 3, 4, 5 (or click 'Find My NFTs')"
                      value={batchTokenIds}
                      onChange={(e) => setBatchTokenIds(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {myTokenIds.length > 0 
                        ? `✅ Found ${myTokenIds.length} NFTs you own` 
                        : "Click 'Find My NFTs' to auto-fill, or enter manually (max 100)"
                      }
                    </p>
                  </div>

                  {/* Auto-Generate Section */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">🎲 Auto-Generate Claim Codes</h4>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Code Prefix:
                        </label>
                        <input
                          type="text"
                          placeholder="PRODUCT"
                          value={codePrefix}
                          onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Will generate: {codePrefix}-[TokenID]-[Random]
                        </p>
                      </div>
                      <button
                        onClick={autoGenerateBatchCodes}
                        disabled={!batchTokenIds}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Generate Codes
                      </button>
                    </div>
                  </div>

                  {/* Claim Codes Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Claim Codes (one per line):
                    </label>
                    <textarea
                      placeholder="Use 'Generate Codes' above or enter manually:&#10;PRODUCT-001&#10;PRODUCT-002&#10;PRODUCT-003"
                      value={batchClaimCodes}
                      onChange={(e) => setBatchClaimCodes(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:outline-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ✨ Use auto-generate above, or enter manually (one per line). Must match token IDs count.
                    </p>
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={createBatchClaims}
                    disabled={loading || !batchTokenIds || !batchClaimCodes}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    {loading ? 'Creating Batch...' : '⚡ Create Batch Claims'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Claim Section */}
          <div className="border-t-2 border-gray-200 pt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cancel a Claim</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Cancel an unused claim code to revoke access. You'll regain control of the NFT.
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Claim Code to Cancel"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={cancelClaim}
                disabled={loading || !claimCode}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Cancelling...' : 'Cancel Claim'}
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">🔐 Security Benefits</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>One-time approval:</strong> Sign once to enable unlimited claims</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>No private key exposure:</strong> Never share your private key with customers</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Automatic transfers:</strong> Claim contract handles transfers securely</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Unique codes:</strong> Each code works only once and for one specific NFT</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 