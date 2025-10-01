'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';

const CLAIM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const CLAIM_CONTRACT_ABI = [
  "function executeClaim(string memory claimCode, address customerAddress) external",
  "function checkClaim(string memory claimCode) external view returns (bool isValid, uint256 tokenId, address retailer, bool isClaimed)"
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

  const checkClaimCode = async () => {
    if (!claimCode) {
      setError('Please enter a claim code');
      return;
    }

    if (!CLAIM_CONTRACT_ADDRESS) {
      setError('Claim contract not deployed');
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
        setError('❌ Invalid claim code');
        return;
      }

      if (isClaimed) {
        setError('❌ This code has already been used');
        return;
      }

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

      setSuccess('✅ Valid claim code!');
    } catch (err) {
      console.error('Error checking claim:', err);
      setError('Failed to check claim: ' + (err.reason || err.message));
    } finally {
      setChecking(false);
    }
  };

  const executeClaim = async () => {
    if (!claimCode || !account) {
      setError('Please connect wallet and enter claim code');
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
      setSuccess('⏳ Claiming NFT...');
      
      await tx.wait();
      
      setSuccess(`🎉 Success! NFT #${claimInfo?.tokenId} claimed to your wallet!`);
      setClaimInfo(null);
      setClaimCode('');
    } catch (err) {
      console.error('Error claiming:', err);
      setError('Failed to claim: ' + (err.reason || err.message));
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
            <p className="text-gray-600">Please connect your wallet to claim.</p>
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎁 Claim Your NFT</h1>
          <p className="text-gray-600 mb-6">
            Enter your claim code to receive your NFT
          </p>

          {!CLAIM_CONTRACT_ADDRESS && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <p className="text-yellow-700 text-sm">⚠️ Claim system not available</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Claim Code</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter claim code"
                value={claimCode}
                onChange={(e) => {
                  setClaimCode(e.target.value.trim());
                  setClaimInfo(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
              <button
                onClick={checkClaimCode}
                disabled={checking || !claimCode}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {checking ? 'Checking...' : 'Verify'}
              </button>
            </div>
          </div>

          {claimInfo && (
            <div className="mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">NFT Details</h3>
                
                {claimInfo.metadata?.image && (
                  <div className="mb-4">
                    <img
                      src={claimInfo.metadata.image}
                      alt={claimInfo.metadata.name || 'NFT'}
                      className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
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
                </div>
              </div>

              <button
                onClick={executeClaim}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg"
              >
                {loading ? '⏳ Claiming...' : '🎁 Claim NFT'}
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">Connected: <span className="font-mono text-gray-700">{account.slice(0, 6)}...{account.slice(-4)}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
} 