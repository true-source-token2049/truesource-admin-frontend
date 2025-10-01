"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import {
  Gift,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

const CLAIM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const CLAIM_CONTRACT_ABI = [
  "function executeClaim(string memory claimCode, address customerAddress) external",
  "function checkClaim(string memory claimCode) external view returns (bool isValid, uint256 tokenId, address retailer, bool isClaimed)",
];

export default function ClaimNFTPage() {
  const { account, connectWallet, isCorrectNetwork, isMetaMaskInstalled } = useWallet();
  
  const [claimCode, setClaimCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [claimInfo, setClaimInfo] = useState<any>(null);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (claimCode.trim().length > 5) {
      checkClaimCode();
    } else {
      setClaimInfo(null);
    }
  }, [claimCode]);

  const checkClaimCode = async () => {
    if (!claimCode.trim()) return;

    setChecking(true);
    setError("");
    setClaimInfo(null);

    try {
      if (typeof window !== 'undefined' && !(window as any).ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const claimContract = new ethers.Contract(
        CLAIM_CONTRACT_ADDRESS!,
        CLAIM_CONTRACT_ABI,
        provider
      );

      const [isValid, tokenId, retailer, isClaimed] = await claimContract.checkClaim(claimCode.trim());

      if (!isValid) {
        setError("❌ Invalid claim code");
        return;
      }

      if (isClaimed) {
        setError("❌ This claim code has already been used");
        return;
      }

      setClaimInfo({
        tokenId: tokenId.toString(),
        retailer,
        isValid,
        isClaimed,
      });

    } catch (err: any) {
      console.error("Error checking claim:", err);
      setError("Failed to verify claim code: " + (err.message || "Unknown error"));
    } finally {
      setChecking(false);
    }
  };

  const handleClaim = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isCorrectNetwork) {
      setError("Please switch to Sepolia network");
      return;
    }

    if (!claimCode.trim()) {
      setError("Please enter a claim code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setTxHash("");

    try {
      if (typeof window !== 'undefined' && !(window as any).ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const claimContract = new ethers.Contract(
        CLAIM_CONTRACT_ADDRESS!,
        CLAIM_CONTRACT_ABI,
        signer
      );

      setSuccess("📝 Claiming NFT...");

      const tx = await claimContract.executeClaim(claimCode.trim(), account);
      setSuccess("⏳ Transaction submitted! Waiting for confirmation...");
      
      const receipt = await tx.wait();
      setTxHash(receipt.hash);

      setSuccess(`🎉 Success! NFT #${claimInfo?.tokenId} claimed to your wallet!`);
      setClaimCode("");
      setClaimInfo(null);

    } catch (err: any) {
      console.error("Claim error:", err);
      
      let errorMsg = "Failed to claim NFT: ";
      if (err.message.includes("user rejected")) {
        errorMsg += "Transaction rejected";
      } else if (err.reason) {
        errorMsg += err.reason;
      } else {
        errorMsg += err.message || "Unknown error";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-2">
                <Gift className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                TrueSource
              </h1>
              <p className="text-xs text-gray-600">NFT Claim Portal</p>
            </div>
          </div>

          {/* Wallet Connection */}
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={!isMetaMaskInstalled}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-4 h-4" />
              {!isMetaMaskInstalled ? "Install MetaMask" : "Connect Wallet"}
            </button>
          ) : (
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-900">
                {(account as string).substring(0, 6)}...{(account as string).substring(38)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Claim Your NFT
          </h2>
          <p className="text-lg text-gray-600">
            Enter your claim code below to receive your exclusive NFT
          </p>
        </div>

        {/* Claim Form */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
          <div className="space-y-6">
            {/* Claim Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claim Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="FREE-123-ABCDEF"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-lg text-center uppercase"
                  disabled={loading}
                />
                {checking && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the claim code you received from the retailer
              </p>
            </div>

            {/* Claim Info Display */}
            {claimInfo && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-900 mb-2">
                      ✨ Valid Claim Code!
                    </p>
                    <div className="text-sm text-emerald-800 space-y-1">
                      <p>
                        <span className="font-medium">NFT Token ID:</span> #{claimInfo.tokenId}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span> Ready to claim
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Success</p>
                  <p className="text-sm text-green-800 mt-1">{success}</p>
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            {txHash && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Transaction Hash:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-blue-800 font-mono bg-blue-100 px-3 py-2 rounded overflow-x-auto">
                    {txHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(txHash)}
                    className="p-2 hover:bg-blue-100 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-blue-100 rounded transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
              </div>
            )}

            {/* Claim Button */}
            <button
              onClick={handleClaim}
              disabled={loading || !claimCode.trim() || !claimInfo || !account || !isCorrectNetwork}
              className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                loading || !claimCode.trim() || !claimInfo || !account || !isCorrectNetwork
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 via-emerald-500 to-teal-500 text-white hover:from-purple-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Claiming...
                </>
              ) : !account ? (
                <>
                  <Wallet className="w-6 h-6" />
                  Connect Wallet to Claim
                </>
              ) : !isCorrectNetwork ? (
                <>
                  <AlertCircle className="w-6 h-6" />
                  Switch to Sepolia Network
                </>
              ) : (
                <>
                  <Gift className="w-6 h-6" />
                  Claim NFT
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            How to Claim
          </h3>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Connect your MetaMask wallet (Sepolia network)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Enter your claim code in the field above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Wait for validation, then click "Claim NFT"</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Confirm the transaction in MetaMask</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                5
              </span>
              <span>Wait for confirmation - your NFT will appear in your wallet!</span>
            </li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-500">
        <p>© 2025 TrueSource. Powered by Ethereum blockchain.</p>
      </footer>
    </div>
  );
} 