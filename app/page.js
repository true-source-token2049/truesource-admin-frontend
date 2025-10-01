"use client";
import { useWallet } from './contexts/WalletContext';
import Link from 'next/link';

export default function HomePage() {
  const { account, connectWallet, disconnectWallet, isMetaMaskInstalled, isMetaMaskConnected, isCorrectNetwork, error, isLoading } = useWallet();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Editable NFT Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isMetaMaskConnected && isCorrectNetwork ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={!isMetaMaskInstalled || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Simple NFT Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Create and mint NFTs with custom metadata on Ethereum Sepolia
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
                {error}
              </div>
            )}

            {!isMetaMaskInstalled && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
                Please install MetaMask to use this platform
              </div>
            )}

            {isMetaMaskConnected && isCorrectNetwork ? (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg max-w-md mx-auto">
                  ✅ Wallet connected to Sepolia network
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Mint NFT</h2>
                    <p className="text-gray-600 mb-6">
                      Create and mint NFTs with custom image, metadata, and attributes. 
                      Mint single or multiple copies of the same NFT. 
                      Images and metadata are stored on IPFS via Pinata.
                    </p>
                    <Link
                      href="/nft-mint"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full text-center"
                    >
                      Mint New NFT
                    </Link>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">View NFTs</h2>
                    <p className="text-gray-600 mb-6">
                      View your minted NFTs and their details including metadata 
                      and attributes stored on IPFS.
                    </p>
                    <Link
                      href="/nft-viewer"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full text-center"
                    >
                      View NFTs
                    </Link>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Transfer NFT</h2>
                    <p className="text-gray-600 mb-6">
                      Transfer your NFTs to another address. Simply enter the token ID 
                      and recipient address to send your NFT.
                    </p>
                    <Link
                      href="/nft-transfer"
                      className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full text-center"
                    >
                      Transfer NFT
                    </Link>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Attest NFT</h2>
                    <p className="text-gray-600 mb-6">
                      Attest your owned NFTs with a value and note. 
                      Attestations are stored permanently on the blockchain along with your address.
                    </p>
                    <Link
                      href="/nft-attest"
                      className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full text-center"
                    >
                      Attest NFT
                    </Link>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">📜 NFT History</h2>
                    <p className="text-gray-600 mb-6">
                      Track the complete ownership history of any NFT. 
                      View all previous owners and transfer events on the blockchain.
                    </p>
                    <Link
                      href="/nft-history"
                      className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full text-center"
                    >
                      View History
                    </Link>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-yellow-300">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">🏪 Retailer Claims</h2>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">NEW</span>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Approve NFTs and create claim codes for customers. 
                      Enable customers to claim NFTs without needing your signature for each transfer!
                    </p>
                    <Link
                      href="/retailer-claims"
                      className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full text-center"
                    >
                      Manage Claims
                    </Link>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-300">
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">🎁 Claim NFT</h2>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">NEW</span>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Got a claim code from a retailer? 
                      Enter it here to instantly receive your NFT without waiting for manual transfers!
                    </p>
                    <Link
                      href="/customer-claim"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full text-center"
                    >
                      Claim Your NFT
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
                  <ul className="text-left text-gray-600 space-y-2">
                    <li>✅ Upload images to IPFS via Pinata</li>
                    <li>✅ Create custom metadata with attributes</li>
                    <li>✅ Mint NFTs directly to your connected wallet</li>
                    <li>✅ <strong>Bulk mint multiple copies of the same NFT</strong></li>
                    <li>✅ <strong>Transfer NFTs to any Ethereum address</strong></li>
                    <li>✅ <strong>Attest owned NFTs with value and notes</strong></li>
                    <li>✅ <strong>Track complete ownership history via blockchain events</strong></li>
                    <li>🎁 <strong className="text-yellow-600">NEW: Approval-based claim system for retailers</strong></li>
                    <li>🎁 <strong className="text-green-600">NEW: One-time claim codes for customers</strong></li>
                    <li>✅ Anyone can mint as many NFTs as they want</li>
                    <li>✅ Built on Ethereum Sepolia testnet</li>
                    <li>✅ OpenZeppelin ERC721URIStorage standard</li>
                  </ul>
                </div>
              </div>
            ) : isMetaMaskInstalled ? (
              <div className="space-y-4">
                <p className="text-gray-600">Connect your wallet to start minting and editing NFTs</p>
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">Please install MetaMask to continue</p>
                <a
                  href="https://metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Install MetaMask
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
