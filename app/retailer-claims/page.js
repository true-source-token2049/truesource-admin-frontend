'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';

const CLAIM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function totalSupply() view returns (uint256)"
];

const CLAIM_CONTRACT_ABI = [
  "function createClaimBatch(string[] memory claimCodes, uint256[] memory tokenIds) external",
  "function checkClaim(string memory claimCode) external view returns (bool isValid, uint256 tokenId, address retailer, bool isClaimed)"
];

export default function RetailerClaims() {
  const { account, isCorrectNetwork } = useWallet();
  
  const [batchTokenIds, setBatchTokenIds] = useState('');
  const [generatedBatches, setGeneratedBatches] = useState([]);
  const [codePrefix, setCodePrefix] = useState('PRODUCT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isApprovedForAll, setIsApprovedForAll] = useState(false);
  const [findingTokens, setFindingTokens] = useState(false);

  useEffect(() => {
    if (account && CLAIM_CONTRACT_ADDRESS) {
      checkApprovalForAll();
    }
  }, [account]);

  const findMyTokenIds = async () => {
    setFindingTokens(true);
    setError('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      
      const totalSupply = await nftContract.totalSupply ? await nftContract.totalSupply() : 100;
      const myTokens = [];
      
      setSuccess(`🔍 Scanning tokens 1 to ${totalSupply}...`);
      
      const maxToCheck = Math.min(parseInt(totalSupply.toString()), 100);
      for (let i = 1; i <= maxToCheck; i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            myTokens.push(i);
          }
        } catch (err) {}
      }
      
      if (myTokens.length === 0) {
        setError('No NFTs found! Mint some NFTs first.');
      } else {
        setBatchTokenIds(myTokens.join(', '));
        setSuccess(`✅ Found ${myTokens.length} NFTs: ${myTokens.join(', ')}`);
      }
    } catch (err) {
      console.error('Error finding tokens:', err);
      setError('Failed to find your tokens: ' + err.message);
    } finally {
      setFindingTokens(false);
    }
  };

  const generateBatchCodes = () => {
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

      const batches = tokenIds.map(tokenId => {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return {
          tokenId,
          claimCode: `${codePrefix}-${tokenId}-${randomPart}`
        };
      });

      setGeneratedBatches(batches);
      setSuccess(`✅ Generated ${batches.length} claim codes!`);
      setError('');
    } catch (err) {
      setError('Failed to generate codes: ' + err.message);
    }
  };

  const checkApprovalForAll = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      
      const approved = await nftContract.isApprovedForAll(account, CLAIM_CONTRACT_ADDRESS);
      setIsApprovedForAll(approved);
      
      return approved;
    } catch (err) {
      console.error('Error checking approval:', err);
      return false;
    }
  };

  const approveAllNFTs = async () => {
    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract not deployed');
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
      setSuccess('⏳ Approving all NFTs...');
      
      await tx.wait();
      
      setSuccess('✅ All NFTs approved for claims!');
      setIsApprovedForAll(true);
    } catch (err) {
      console.error('Error approving:', err);
      setError('Failed to approve: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const createBatchClaims = async () => {
    if (generatedBatches.length === 0) {
      setError('Please generate codes first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tokenIds = generatedBatches.map(b => b.tokenId);
      const claimCodes = generatedBatches.map(b => b.claimCode);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
      const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, CLAIM_CONTRACT_ABI, signer);

      setSuccess(`🔍 Validating ${tokenIds.length} NFTs...`);
      
      const validationErrors = [];
      const validTokenIds = [];
      const validClaimCodes = [];
      
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const claimCode = claimCodes[i];
        
        try {
          const owner = await nftContract.ownerOf(tokenId);
          
          if (owner.toLowerCase() !== account.toLowerCase()) {
            validationErrors.push(`Token ${tokenId}: You don't own this NFT`);
            continue;
          }

          const isApprovedForAll = await nftContract.isApprovedForAll(account, CLAIM_CONTRACT_ADDRESS);
          
          if (!isApprovedForAll) {
            validationErrors.push(`Token ${tokenId}: Not approved. Click "Approve All NFTs" first.`);
            continue;
          }

          try {
            const [isValid, , ,] = await claimContract.checkClaim(claimCode);
            if (isValid) {
              validationErrors.push(`Token ${tokenId}: Already has an active claim. Cancel it first or skip this token.`);
              continue;
            }
          } catch (err) {}

          validTokenIds.push(tokenId);
          validClaimCodes.push(claimCode);
        } catch (err) {
          validationErrors.push(`Token ${tokenId}: ${err.message}`);
        }
      }

      if (validTokenIds.length === 0) {
        throw new Error(`No valid tokens to create claims for.\n\n${validationErrors.join('\n')}`);
      }

      if (validationErrors.length > 0) {
        setSuccess(`⚠️ Skipping ${validationErrors.length} tokens with issues. Proceeding with ${validTokenIds.length} valid tokens...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setSuccess(`✅ Creating ${validTokenIds.length} claims...`);

      const tx = await claimContract.createClaimBatch(validClaimCodes, validTokenIds);
      setSuccess(`⏳ Transaction submitted! Please wait...`);
      
      await tx.wait();
      
      const finalBatches = validTokenIds.map((tid, idx) => ({
        tokenId: tid,
        claimCode: validClaimCodes[idx]
      }));
      
      setGeneratedBatches(finalBatches);
      setSuccess(`✅ Success! ${validTokenIds.length} claims created${validationErrors.length > 0 ? ` (${validationErrors.length} tokens skipped)` : ''}. Share the codes below with customers.`);
    } catch (err) {
      console.error('Error creating batch:', err);
      setError(err.message || 'Failed to create batch claims: ' + (err.reason || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🏪 Retailer Claims</h1>
            <p className="text-gray-600">Please connect your wallet.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🏪 Retailer Claims</h1>
            <p className="text-red-600">Please switch to Sepolia network.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏪 Retailer Claims</h1>
          <p className="text-gray-600 mb-6">
            Create claim codes for your NFTs in batches
          </p>

          {!CLAIM_CONTRACT_ADDRESS && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <p className="text-yellow-700 text-sm">
                ⚠️ Claim contract not deployed. Run: <code className="bg-yellow-100 px-2 py-1 rounded">npx hardhat run scripts/deploy-claim-contract.cjs --network sepolia</code>
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 whitespace-pre-line text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700 whitespace-pre-line text-sm">{success}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Step 1: Approve All NFTs</h2>
            <button
              onClick={approveAllNFTs}
              disabled={loading || isApprovedForAll}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Approving...' : isApprovedForAll ? '✅ All NFTs Approved' : 'Approve All NFTs'}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Step 2: Enter Token IDs</h2>
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                placeholder="1, 2, 3, 4, 5"
                value={batchTokenIds}
                onChange={(e) => setBatchTokenIds(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={findMyTokenIds}
                disabled={findingTokens}
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
              >
                {findingTokens ? '🔍 Finding...' : '🔍 Find My NFTs'}
              </button>
            </div>
            
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Code Prefix:</label>
                <input
                  type="text"
                  placeholder="PRODUCT"
                  value={codePrefix}
                  onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <button
                onClick={generateBatchCodes}
                disabled={!batchTokenIds}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Generate Codes
              </button>
            </div>
          </div>

          {generatedBatches.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Step 3: Review & Create Claims</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {generatedBatches.map((batch, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-white p-3 rounded border border-gray-200">
                      <span className="font-medium text-gray-700">Token {batch.tokenId}</span>
                      <code className="text-purple-600 font-mono">{batch.claimCode}</code>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={createBatchClaims}
                disabled={loading || !isApprovedForAll}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Creating...' : `✓ Create ${generatedBatches.length} Claims`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 