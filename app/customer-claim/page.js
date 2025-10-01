'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';

const CLAIM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const CLAIM_CONTRACT_ABI = [
  "function executeClaim(string memory claimCode, address customerAddress) external",
  "function checkClaim(string memory claimCode) external view returns (bool isValid, uint256 tokenId, address retailer, bool isClaimed)",
  "function getClaimInfo(string memory claimCode) external view returns (tuple(uint256 tokenId, address retailer, bool isClaimed, address claimedBy, uint256 claimedAt))"
];

const NFT_ABI = [
  "function tokenURI(uint256 tokenId) view returns (string)"
];

export default function CustomerClaim() {
  const { account, isCorrectNetwork } = useWallet();
  
  const [claimCode, setClaimCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [claimInfo, setClaimInfo] = useState(null);

  // Check if claim code is valid
  const checkClaimCode = async () => {
    if (!claimCode) {
      setError('Please enter a claim code');
      return;
    }

    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract not deployed. Please contact the administrator.');
      return;
    }

    setChecking(true);
    setError('');
    setSuccess('');
    setClaimInfo(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, CLAIM_CONTRACT_ABI, provider);

      const [isValid, tokenId, retailer, isClaimed] = await claimContract.checkClaim(claimCode);

      if (!isValid) {
        setError('❌ Invalid claim code. Please check and try again.');
        return;
      }

      if (isClaimed) {
        setError('❌ This claim code has already been used.');
        return;
      }

      // Try to fetch NFT metadata
      let metadata = null;
      try {
        const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
        const tokenURI = await nftContract.tokenURI(tokenId);
        
        if (tokenURI.startsWith('http')) {
          const response = await fetch(tokenURI);
          if (response.ok) {
            metadata = await response.json();
          }
        }
      } catch (err) {
        console.log('Could not fetch metadata:', err);
      }

      setClaimInfo({
        isValid,
        tokenId: tokenId.toString(),
        retailer,
        isClaimed,
        metadata
      });

      setSuccess('✅ Valid claim code! You can claim this NFT.');
    } catch (err) {
      console.error('Error checking claim:', err);
      setError('Failed to check claim: ' + (err.reason || err.message));
    } finally {
      setChecking(false);
    }
  };

  // Execute claim
  const executeClaim = async () => {
    if (!claimCode) {
      setError('Please enter a claim code');
      return;
    }

    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

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
      const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, CLAIM_CONTRACT_ABI, signer);

      const tx = await claimContract.executeClaim(claimCode, account);
      setSuccess('⏳ Claiming NFT... Please wait for confirmation.');
      
      await tx.wait();
      
      setSuccess(`🎉 Success! NFT claimed successfully!

Token ID: ${claimInfo?.tokenId}
Your wallet: ${account}

The NFT has been transferred to your wallet. You can view it in your NFT collection.`);
      
      setClaimInfo(null);
      setClaimCode('');
    } catch (err) {
      console.error('Error executing claim:', err);
      setError('Failed to claim NFT: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🎁 Claim Your NFT</h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to claim your NFT.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-blue-700 text-sm">
                💡 <strong>Tip:</strong> Make sure you have a small amount of Sepolia ETH for gas fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🎁 Claim Your NFT</h1>
            <p className="text-red-600">Please switch to Sepolia network.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎁 Claim Your NFT</h1>
          <p className="text-gray-600 mb-6">
            Enter your claim code to receive your NFT instantly!
          </p>

          {/* Claim Contract Not Deployed Warning */}
          {!CLAIM_CONTRACT_ADDRESS && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Claim System Not Available</h3>
              <p className="text-yellow-700 text-sm">
                The claim system is not currently available. Please contact the retailer for assistance.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">How to claim:</h3>
            <ol className="list-decimal list-inside space-y-1 text-green-700 text-sm">
              <li>Enter the claim code provided by the retailer</li>
              <li>Check that the NFT details are correct</li>
              <li>Click "Claim NFT" and confirm the transaction</li>
              <li>The NFT will be transferred to your wallet!</li>
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

          {/* Claim Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claim Code
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter your claim code (e.g., CLAIM-ABC123)"
                value={claimCode}
                onChange={(e) => {
                  setClaimCode(e.target.value.trim());
                  setClaimInfo(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              />
              <button
                onClick={checkClaimCode}
                disabled={checking || !claimCode}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {checking ? 'Checking...' : 'Verify Code'}
              </button>
            </div>
          </div>

          {/* Claim Info Display */}
          {claimInfo && (
            <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">NFT Details</h3>
              
              {claimInfo.metadata && claimInfo.metadata.image && (
                <div className="mb-4">
                  <img
                    src={claimInfo.metadata.image}
                    alt={claimInfo.metadata.name || 'NFT'}
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="space-y-2 text-sm">
                {claimInfo.metadata?.name && (
                  <div>
                    <span className="font-semibold text-gray-700">Name:</span>{' '}
                    <span className="text-gray-900">{claimInfo.metadata.name}</span>
                  </div>
                )}
                
                {claimInfo.metadata?.description && (
                  <div>
                    <span className="font-semibold text-gray-700">Description:</span>{' '}
                    <span className="text-gray-900">{claimInfo.metadata.description}</span>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-gray-700">Token ID:</span>{' '}
                  <span className="text-gray-900">{claimInfo.tokenId}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">From Retailer:</span>{' '}
                  <span className="text-gray-900 font-mono text-xs break-all">{claimInfo.retailer}</span>
                </div>
              </div>
            </div>
          )}

          {/* Claim Button */}
          {claimInfo && !claimInfo.isClaimed && (
            <button
              onClick={executeClaim}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg"
            >
              {loading ? '⏳ Claiming...' : '🎁 Claim NFT Now!'}
            </button>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">✨ What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">1️⃣</span>
                <span>Verify your claim code is valid</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2️⃣</span>
                <span>Review the NFT details</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3️⃣</span>
                <span>Click claim and approve transaction</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">4️⃣</span>
                <span>NFT arrives in your wallet instantly!</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-yellow-200">
            <h3 className="text-xl font-bold text-gray-800 mb-3">⚠️ Important Notes</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Each claim code works only once</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You need Sepolia ETH for gas fees</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Retailer doesn't need to be online</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Transaction is instant and secure</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Connected Wallet Info */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Connected Wallet</h3>
          <p className="text-sm text-gray-600 font-mono break-all">{account}</p>
          <p className="text-xs text-gray-500 mt-2">
            NFTs will be sent to this address
          </p>
        </div>
      </div>
    </div>
  );
} 