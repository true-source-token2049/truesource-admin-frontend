"use client";
import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import Link from 'next/link';
import { ethers } from 'ethers';

export default function NFTAttestPage() {
  const { account, connectWallet, isMetaMaskConnected, isCorrectNetwork, error: walletError } = useWallet();
  const [tokenId, setTokenId] = useState('');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attestations, setAttestations] = useState([]);
  const [isLoadingAttestations, setIsLoadingAttestations] = useState(false);

  const fetchAttestations = async (id) => {
    if (!id) return;
    
    setIsLoadingAttestations(true);
    try {
      const response = await fetch(`/api/attest-nft?tokenId=${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attestations');
      }
      
      setAttestations(data.attestations || []);
    } catch (err) {
      console.error('Failed to fetch attestations:', err);
      setAttestations([]);
    } finally {
      setIsLoadingAttestations(false);
    }
  };

  useEffect(() => {
    if (tokenId) {
      fetchAttestations(tokenId);
    }
  }, [tokenId]);

  const handleAttest = async (e) => {
    e.preventDefault();
    
    if (!tokenId || !value || !note) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const abi = [
        "function attestNFT(uint256 tokenId, uint256 value, string memory note) public",
        "function ownerOf(uint256 tokenId) public view returns (address)"
      ];
      
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      const owner = await contract.ownerOf(tokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        setError('You do not own this NFT');
        setIsAttesting(false);
        return;
      }

      const tx = await contract.attestNFT(tokenId, value, note);
      setSuccess('Transaction submitted! Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      setSuccess(`Successfully attested NFT #${tokenId}! Transaction: ${receipt.hash}`);
      
      setValue('');
      setNote('');
      
      fetchAttestations(tokenId);
      
    } catch (err) {
      console.error('Error attesting NFT:', err);
      setError('Failed to attest NFT: ' + err.message);
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
          <p className="text-gray-600 mb-6">Please connect your wallet to attest NFTs</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Attest NFT</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Connected Account: <span className="font-mono bg-gray-200 p-1 rounded text-sm">{account}</span>
            </p>
            <p className="text-sm text-gray-500">
              Only NFT owners can attest their NFTs with a value and note. The attestation will be permanently stored on the blockchain.
            </p>
          </div>

          <form onSubmit={handleAttest} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID *
              </label>
              <input
                type="number"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter NFT token ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value *
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter attestation value (e.g., 100)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter a numeric value for this attestation</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note *
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter attestation note or description"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Provide details about this attestation</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? 'Attesting...' : 'Attest NFT'}
            </button>
          </form>

          {tokenId && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Existing Attestations</h2>
              
              {isLoadingAttestations ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <p className="text-gray-600 mt-2">Loading attestations...</p>
                </div>
              ) : attestations.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200 mb-4">
                    <p className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="mr-2">🏆</span>
                      Found {attestations.length} attestation{attestations.length !== 1 ? 's' : ''} for Token #{tokenId}
                    </p>
                  </div>
                  {attestations.map((attestation, index) => (
                    <div key={index} className="bg-white p-5 rounded-lg border-2 border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-gray-100">
                        <div className="flex items-center space-x-2">
                          <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded">
                            VALUE: {attestation.value}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          📅 {attestation.date}
                        </p>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Attested by:</p>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs font-mono text-gray-700 break-all">{attestation.attester}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Attestation Note:</p>
                        <div className="bg-gradient-to-br from-gray-50 to-orange-50 p-3 rounded-lg border border-orange-100">
                          <p className="text-sm text-gray-700 italic">"{attestation.note}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gradient-to-br from-gray-50 to-orange-50 rounded-lg border-2 border-dashed border-orange-200">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="text-gray-600 font-medium mb-1">No attestations found for this token</p>
                  <p className="text-sm text-gray-500">Be the first to attest this NFT!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 