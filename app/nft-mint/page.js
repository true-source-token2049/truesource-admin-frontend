"use client";
import { useState, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import Link from 'next/link';

// Simplified contract ABI
const NFT_ABI = [
  "function mint(string memory metadataUri) public returns (uint256)",
  "function mintBatch(string memory metadataUri, uint256 quantity) public returns (uint256)",
  "event TokenMinted(uint256 indexed tokenId, address indexed to, string metadataUri)"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function NFTMintPage() {
  const { account, signer, connectWallet, isMetaMaskConnected, isCorrectNetwork, error: walletError } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    attributes: [],
    quantity: 1
  });
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const addAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setFormData(prev => ({
        ...prev,
        attributes: [...prev.attributes, { ...newAttribute }]
      }));
      setNewAttribute({ trait_type: '', value: '' });
    }
  };

  const removeAttribute = (index) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleMint = async () => {
    if (!isMetaMaskConnected || !isCorrectNetwork) {
      setError('Please connect your wallet and switch to Sepolia network');
      return;
    }

    if (!formData.name || !formData.description || !formData.image) {
      setError('Please fill in all required fields');
      return;
    }

    if (!signer) {
      setError('Wallet not properly connected');
      return;
    }

    setIsMinting(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Upload image and metadata to IPFS
      setSuccess('Uploading to IPFS...');
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('image', formData.image);
      data.append('attributes', JSON.stringify(formData.attributes));

      const response = await fetch('/api/mint-nft', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload to IPFS');
      }

      const metadataUrl = result.metadataUrl;

      // Step 2: Mint NFT(s) using MetaMask
      const quantity = parseInt(formData.quantity) || 1;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, signer);
      
      setSuccess(`Minting ${quantity} NFT${quantity > 1 ? 's' : ''}... Please confirm transaction in MetaMask`);
      
      let tx;
      // Estimate gas using MetaMask provider, not Alchemy
      const gasEstimate = quantity === 1 ? 150000 : 150000 * quantity + 50000;
      
      if (quantity === 1) {
        // Single mint
        tx = await contract.mint(metadataUrl, {
          gasLimit: gasEstimate
        });
      } else {
        // Batch mint - all in one transaction!
        tx = await contract.mintBatch(metadataUrl, quantity, {
          gasLimit: gasEstimate
        });
      }
      
      setSuccess('Transaction submitted! Waiting for confirmation...');
      const receipt = await tx.wait(1); // Wait for 1 confirmation only
      
      // Get all token IDs from events
      const mintedTokenIds = [];
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'TokenMinted') {
            mintedTokenIds.push(parsed.args.tokenId.toString());
          }
        } catch (e) {
          // Continue if parsing fails
        }
      }

      setSuccess(`🎉 ${quantity} NFT${quantity > 1 ? 's' : ''} minted successfully! Token IDs: ${mintedTokenIds.join(', ')}`);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        image: null,
        attributes: [],
        quantity: 1
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction rejected by user');
      } else {
        setError('Failed to mint NFT: ' + (err.message || err));
      }
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Mint Your NFT</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Connected Account: <span className="font-mono bg-gray-200 p-1 rounded">{account}</span>
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
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter NFT name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max="100"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How many to mint"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Mint 1-100 copies with same metadata</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter NFT description"
                  required
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* Attributes */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Attributes</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Trait Type"
                    value={newAttribute.trait_type}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, trait_type: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newAttribute.value}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
                
                {formData.attributes.length > 0 && (
                  <div className="space-y-2">
                    {formData.attributes.map((attr, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">
                          <strong>{attr.trait_type}:</strong> {attr.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mint Button */}
            <button
              onClick={handleMint}
              disabled={isMinting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isMinting ? 'Minting...' : `Mint ${formData.quantity || 1} NFT${formData.quantity > 1 ? 's' : ''}`}
            </button>
            {formData.quantity > 1 && (
              <p className="text-sm text-green-600 text-center mt-2">
                ✅ All {formData.quantity} NFTs will be minted in a single transaction!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
