"use client";
import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import Link from 'next/link';

export default function NFTViewerPage() {
  const { account, connectWallet, isMetaMaskConnected, isCorrectNetwork, error: walletError } = useWallet();
  const [tokenId, setTokenId] = useState('');
  const [nftData, setNftData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNFTData = async () => {
    if (!tokenId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch metadata from the contract
      const response = await fetch(`/api/nft-metadata?tokenId=${tokenId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch NFT data');
      }
      
      setNftData(data);
    } catch (err) {
      setError('Failed to fetch NFT data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };



  if (walletError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Wallet Error</h1>
          <p className="text-gray-600 mb-6">{walletError}</p>
          <button onClick={connectWallet} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isMetaMaskConnected || !isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to view and edit NFTs</p>
          <button onClick={connectWallet} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">NFT Viewer & Editor</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Connected Account: <span className="font-mono bg-gray-200 p-1 rounded">{account}</span>
            </p>
          </div>

          {/* Token ID Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Token ID
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter NFT token ID"
              />
              <button
                onClick={fetchNFTData}
                disabled={!tokenId || isLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : 'Fetch NFT'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {nftData && (
            <div className="max-w-2xl mx-auto">
              {/* NFT Display */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">NFT Details</h2>
                <div className="space-y-4">
                  <div>
                    <img
                      src={nftData.image}
                      alt={nftData.name}
                      className="w-full h-96 object-cover rounded-lg border"
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-2xl font-semibold mb-2">{nftData.name}</h3>
                    <p className="text-gray-600 mb-4">{nftData.description}</p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">
                        <strong>Token ID:</strong> {tokenId}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Owner:</strong> {nftData.owner}
                      </p>
                    </div>
                  </div>
                  {nftData.attributes && nftData.attributes.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Attributes</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {nftData.attributes.map((attr, index) => (
                          <div key={index} className="bg-white p-2 rounded border">
                            <div className="text-xs text-gray-500">{attr.trait_type}</div>
                            <div className="font-medium">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
