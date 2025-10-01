"use client";
import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import Link from 'next/link';

export default function NFTHistoryPage() {
  const { connectWallet, isMetaMaskConnected, isCorrectNetwork, error: walletError } = useWallet();
  const [tokenId, setTokenId] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!tokenId) return;
    
    setIsLoading(true);
    setError('');
    setHistoryData(null);
    
    try {
      const response = await fetch(`/api/nft-history?tokenId=${tokenId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch NFT history');
      }
      
      setHistoryData(data);
    } catch (err) {
      setError('Failed to fetch NFT history: ' + err.message);
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
          <p className="text-gray-600 mb-6">Please connect your wallet to view NFT history</p>
          <button onClick={connectWallet} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">📜 NFT Ownership History</h1>
          
          <p className="text-gray-600 mb-6">
            Enter a Token ID to see its current and previous owners.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token ID
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchHistory()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter NFT token ID"
              />
              <button
                onClick={fetchHistory}
                disabled={!tokenId || isLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                {isLoading ? 'Loading...' : 'View History'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {historyData && (
            <div className="space-y-6">
              {/* Current Owner */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">👑</span> Current Owner
                </h2>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-mono text-sm text-gray-800 break-all">
                    {historyData.currentOwner}
                  </p>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Token ID: <span className="font-bold">#{historyData.tokenId}</span>
                  {historyData.totalTransfers > 0 && (
                    <span className="ml-4">Total Transfers: <span className="font-bold">{historyData.totalTransfers}</span></span>
                  )}
                </div>
              </div>

              {/* Previous Owners */}
              {historyData.previousOwners && historyData.previousOwners.length > 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📋</span> Previous Owners
                    <span className="ml-2 bg-gray-500 text-white text-sm font-semibold px-2 py-1 rounded-full">
                      {historyData.previousOwners.length}
                    </span>
                  </h2>
                  <div className="space-y-2">
                    {historyData.previousOwners.map((owner, index) => (
                      <div key={index} className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 mr-3 min-w-[30px]">
                          {index + 1}.
                        </span>
                        <span className="font-mono text-sm text-gray-800 break-all">
                          {owner}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                  <p className="font-semibold">No previous owners</p>
                  <p className="text-sm">This NFT has only had one owner (current owner).</p>
                </div>
              )}

              {/* Transfers */}
              {historyData.transfers && historyData.transfers.length > 0 && (
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Details</h2>
                  <div className="space-y-3">
                    {historyData.transfers.map((transfer, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600">Transfer #{index + 1}</span>
                          <span className="text-xs text-gray-500">Block: {transfer.blockNumber}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-600">From:</span>
                            <span className="font-mono text-xs ml-2">
                              {transfer.from === '0x0000000000000000000000000000000000000000' ? '🌟 Minted' : transfer.from}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">To:</span>
                            <span className="font-mono text-xs ml-2">{transfer.to}</span>
                          </div>
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${transfer.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                        >
                          View on Etherscan →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {historyData.note && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  ℹ️ {historyData.note}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 