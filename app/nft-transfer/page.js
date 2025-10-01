"use client";
import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import Link from 'next/link';
import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function transferFrom(address from, address to, uint256 tokenId) public",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) public"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function NFTTransferPage() {
  const { account, signer, connectWallet, isMetaMaskConnected, isCorrectNetwork, error: walletError } = useWallet();
  const [tokenId, setTokenId] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleTransfer = async () => {
    if (!isMetaMaskConnected || !isCorrectNetwork) {
      setError('Please connect your wallet and switch to Sepolia network');
      return;
    }

    if (!tokenId || !recipientAddress) {
      setError('Please enter both token ID and recipient address');
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      setError('Invalid recipient address. Please enter a valid Ethereum address.');
      return;
    }

    if (recipientAddress.toLowerCase() === account.toLowerCase()) {
      setError('Cannot transfer NFT to yourself');
      return;
    }

    if (!signer) {
      setError('Wallet signer not available. Please reconnect your wallet.');
      return;
    }

    setIsTransferring(true);
    setError('');
    setSuccess('');

    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      try {
        const owner = await contract.ownerOf(tokenId);
        if (owner.toLowerCase() !== account.toLowerCase()) {
          throw new Error(`You don't own this NFT. Current owner: ${owner}`);
        }
      } catch (err) {
        if (err.message.includes("don't own")) {
          throw err;
        }
        throw new Error('NFT does not exist or error checking ownership');
      }

      const tx = await contract.safeTransferFrom(account, recipientAddress, tokenId);
      
      setSuccess('Transaction submitted! Waiting for confirmation...');
      
      const receipt = await tx.wait();

      setSuccess(`NFT transferred successfully! Transaction: ${receipt.hash}`);
      setTokenId('');
      setRecipientAddress('');
    } catch (err) {
      console.error('Transfer error:', err);
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by user');
      } else {
        setError('Failed to transfer NFT: ' + (err.reason || err.message));
      }
    } finally {
      setIsTransferring(false);
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
          <p className="text-gray-600 mb-6">Please connect your wallet to transfer NFTs</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Transfer NFT</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Connected Account: <span className="font-mono bg-gray-200 p-1 rounded">{account}</span>
            </p>
            <p className="text-sm text-gray-500">
              Transfer your NFT to another address. Make sure you own the NFT before attempting to transfer.
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

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID *
              </label>
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the NFT token ID"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address *
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="0x..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the Ethereum address where you want to send this NFT
              </p>
            </div>

            <button
              onClick={handleTransfer}
              disabled={isTransferring || !tokenId || !recipientAddress}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isTransferring ? 'Transferring...' : 'Transfer NFT'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• You must be the owner of the NFT to transfer it</li>
              <li>• Double-check the recipient address - transfers cannot be undone</li>
              <li>• You will be asked to confirm the transaction in MetaMask</li>
              <li>• Ensure you have enough ETH in your wallet for gas fees</li>
              <li>• The transfer uses safeTransferFrom for added security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 