"use client";
import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import Link from 'next/link';

export default function SimpleMintPage() {
  const { account, connectWallet, isMetaMaskConnected, isCorrectNetwork, error: walletError } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleMint = async () => {
    if (!isMetaMaskConnected || !isCorrectNetwork) {
      setError('Please connect your wallet and switch to Sepolia network');
      return;
    }

    setIsMinting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/simple-mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientAddress: account,
          metadataUri: 'https://example.com/metadata.json'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mint NFT');
      }

      setSuccess(`NFT minted successfully! Token ID: ${data.tokenId}, Transaction: ${data.transactionHash}`);
    } catch (err) {
      setError('Failed to mint NFT: ' + err.message);
    } finally {
      setIsMinting(false);
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
          <p className="text-gray-600 mb-6">Please connect your wallet to mint NFTs</p>
          <button onClick={connectWallet} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Simple NFT Minting</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Connected Account: <span className="font-mono bg-gray-200 p-1 rounded">{account}</span>
            </p>
            <p className="text-sm text-gray-500">
              This is a simplified minting system that avoids rate limiting issues.
            </p>
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

          <button
            onClick={handleMint}
            disabled={isMinting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isMinting ? 'Minting...' : 'Mint Simple NFT'}
          </button>

          <div className="mt-6 text-sm text-gray-500">
            <p>This will mint a simple NFT with basic metadata to your connected wallet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
