"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import { useWallet } from "@/contexts/WalletContext";
import TrueSourceAPI from "@/lib/trueSourceApi";
import { QRCodeSVG } from "qrcode.react";
import { ethers } from "ethers";
import {
  Copy,
  Check,
  Wallet,
  Network,
  Link as LinkIcon,
  Send,
  QrCode,
  User,
  Mail,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

const CONTRACT_ABI = [
  "function transferFrom(address from, address to, uint256 tokenId) public",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) public",
];

// Set your NFT contract address here
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5f4Bfc15c99034096f959FdC72BCa1e883C90A77";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const [tokenId, setTokenId] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    account,
    networkName,
    isCorrectNetwork,
    signer,
    isMetaMaskConnected,
  } = useWallet();

  useEffect(() => {
    loadUserData();
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await TrueSourceAPI.getCurrentUser();
      if (userData?.success) {
        setUser(userData?.result);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleTransfer = async () => {
    // Clear previous messages
    setError("");
    setSuccess("");

    // Validation checks
    if (!isMetaMaskConnected || !isCorrectNetwork) {
      setError("Please connect your wallet and switch to Sepolia network");
      return;
    }

    if (!tokenId || !recipientAddress) {
      setError("Please enter both token ID and recipient address");
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      setError(
        "Invalid recipient address. Please enter a valid Ethereum address."
      );
      return;
    }

    if (recipientAddress.toLowerCase() === String(account).toLowerCase()) {
      setError("Cannot transfer NFT to yourself");
      return;
    }

    if (!signer) {
      setError("Wallet signer not available. Please reconnect your wallet.");
      return;
    }

    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x") {
      setError(
        "Contract address not configured. Please contact administrator."
      );
      return;
    }

    setIsTransferring(true);

    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Check ownership
      try {
        const owner = await contract.ownerOf(tokenId);
        if (owner.toLowerCase() !== String(account).toLowerCase()) {
          throw new Error(
            `You don't own this NFT. Owner: ${owner.slice(
              0,
              6
            )}...${owner.slice(-4)}`
          );
        }
      } catch (err: any) {
        if (err.message.includes("don't own")) {
          throw err;
        }
        throw new Error("NFT does not exist or error checking ownership");
      }

      // Execute transfer
      const tx = await contract.safeTransferFrom(
        account,
        recipientAddress,
        tokenId
      );

      setSuccess("Transaction submitted! Waiting for confirmation...");

      const receipt = await tx.wait();

      setSuccess(
        `✅ NFT transferred successfully! Tx: ${receipt.hash.slice(0, 10)}...`
      );

      // Clear form
      setTokenId("");
      setRecipientAddress("");

      // Clear success message after 10 seconds
      setTimeout(() => setSuccess(""), 10000);
    } catch (err: any) {
      console.error("Transfer error:", err);
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setError("❌ Transaction was rejected by user");
      } else if (err.message) {
        setError("❌ " + err.message);
      } else {
        setError("❌ Failed to transfer NFT. Please try again.");
      }
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your profile, wallet, and transfers
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Box 1: User Profile Data */}
          <div className="lg:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white/30">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">
                  {user?.name || "Admin User"}
                </h2>
                <p className="text-emerald-50 text-sm">
                  {user?.role || "Administrator"}
                </p>
              </div>

              <div className="w-full pt-4 border-t border-white/20 space-y-3">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <Mail className="w-5 h-5 text-emerald-100" />
                  <div className="text-left flex-1">
                    <p className="text-xs text-emerald-100">Email</p>
                    <p className="text-sm font-medium">
                      {user?.email || "admin@truesource.com"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <Shield className="w-5 h-5 text-emerald-100" />
                  <div className="text-left flex-1">
                    <p className="text-xs text-emerald-100">Role</p>
                    <p className="text-sm font-medium">
                      {user?.role || "Administrator"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <User className="w-5 h-5 text-emerald-100" />
                  <div className="text-left flex-1">
                    <p className="text-xs text-emerald-100">Status</p>
                    <p className="text-sm font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Wallet Information */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
            </div>

            {account ? (
              <div className="space-y-4">
                {/* Network Status */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Network className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Network</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {networkName
                          ? String(networkName).charAt(0).toUpperCase() +
                            String(networkName).slice(1)
                          : "Unknown"}
                      </p>
                      {isCorrectNetwork ? (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          ✓
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          ⚠
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wallet Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Wallet Address
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <code className="flex-1 text-xs font-mono text-gray-900 break-all">
                      {account
                        ? `${String(account).slice(0, 8)}...${String(
                            account
                          ).slice(-8)}`
                        : ""}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowQRModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <QrCode className="w-5 h-5" />
                  Receive Funds
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No wallet connected</p>
                <p className="text-xs text-gray-500">
                  Connect your wallet from the sidebar
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Send className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Transfer NFT</h2>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleTransfer();
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NFT Token ID
                </label>
                <input
                  type="text"
                  placeholder="Enter token ID (e.g., 1, 2, 3...)"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!account || isTransferring}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!account || isTransferring}
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 break-all">{success}</p>
                </div>
              )}
              {!account ? (
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Connect Wallet:</span>{" "}
                    Connect your MetaMask wallet to transfer NFTs.
                  </p>
                </div>
              ) : !isCorrectNetwork ? (
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Wrong Network:</span> Please
                    switch to Sepolia network in MetaMask.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-start gap-2">
                  <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-800">
                    <span className="font-semibold">Ready to Transfer:</span>{" "}
                    Make sure you own the NFT before attempting transfer.
                  </p>
                </div>
              )}
              <button
                type="submit"
                disabled={
                  !account ||
                  !isCorrectNetwork ||
                  isTransferring ||
                  !tokenId ||
                  !recipientAddress
                }
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  !account ||
                  !isCorrectNetwork ||
                  isTransferring ||
                  !tokenId ||
                  !recipientAddress
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                }`}
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Transfer NFT
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Security Best Practices
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Always verify wallet addresses before sending funds or NFTs
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Keep your seed phrase secure and never share it with anyone
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Use the correct network (Sepolia) for all transactions
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {showQRModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <QrCode className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Receive Funds
                </h3>
              </div>

              <p className="text-sm text-gray-600">
                Scan this QR code to send funds to your wallet
              </p>
              <div className="flex justify-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <QRCodeSVG
                    value={account || ""}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  Your Wallet Address
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-gray-900 break-all">
                    {account}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                ⚠️ Only send funds on the {networkName} network
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
