"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import { useWallet } from "@/contexts/WalletContext";
import APISDK from "@/lib/APISDK";
import {
  Search,
  Loader2,
  AlertCircle,
  Package,
  ExternalLink,
  Crown,
  Clock,
  TrendingUp,
  Key,
} from "lucide-react";

export default function ProductsTrailPage() {
  const {
    connectWallet,
    isMetaMaskConnected,
    isCorrectNetwork,
    error: walletError,
  } = useWallet();
  const [authCode, setAuthCode] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [historyData, setHistoryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTokenIdFromAuthCode = async (code: string) => {
    try {
      const response = await fetch(
        `${APISDK.API_BASE_URL}/user/token/${code}`,
        {
          method: "GET",
          headers: {
            origin: window.location.origin,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch token ID");
      }

      return data.result.id;
    } catch (err: any) {
      throw new Error("Failed to fetch token from auth code: " + err.message);
    }
  };

  const fetchHistory = async () => {
    if (!authCode) {
      setError("Please enter an auth code");
      return;
    }

    setIsLoading(true);
    setError("");
    setHistoryData(null);
    setTokenId("");

    try {
      // Step 1: Get token ID from auth code
      const fetchedTokenId = await fetchTokenIdFromAuthCode(authCode);

      if (!fetchedTokenId) {
        throw new Error("No token ID found for this auth code");
      }

      setTokenId(fetchedTokenId);

      // Step 2: Fetch NFT history using token ID
      const response = await fetch(
        `/api/nft-history?tokenId=${fetchedTokenId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch NFT history");
      }

      setHistoryData(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch NFT history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Products Trail 🔍
          </h1>
          <p className="text-gray-600 mt-1">
            Track the complete history and ownership trail of any NFT
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                Product Auth Code
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter product auth code..."
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono"
                />
                <button
                  type="submit"
                  disabled={isLoading || !authCode}
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isLoading || !authCode
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Track Product
                    </>
                  )}
                </button>
              </div>
              {tokenId && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  NFT Token ID: <span className="font-semibold">#{tokenId}</span>
                </p>
              )}
            </div>

            {/* Wallet Warning */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">How it works:</span> Enter the
                  product's auth code to view its complete ownership trail and
                  transfer history on the blockchain.
                </p>
              </div>
            </div>

            {walletError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{walletError}</p>
              </div>
            )}
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* History Data Display */}
        {historyData && (
          <div className="space-y-6">
            {/* Current Owner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <Crown className="w-6 h-6 mr-2 text-emerald-600" />
                Current Owner
              </h2>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-mono text-sm text-gray-800 break-all">
                  {historyData.currentOwner}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>
                    Token ID:{" "}
                    <span className="font-bold">#{historyData.tokenId}</span>
                  </span>
                </div>
                {historyData.totalTransfers > 0 && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>
                      Total Transfers:{" "}
                      <span className="font-bold">
                        {historyData.totalTransfers}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Owners */}
            {historyData.previousOwners &&
            historyData.previousOwners.length > 0 ? (
              <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-gray-600" />
                  Previous Owners
                  <span className="ml-3 bg-gray-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {historyData.previousOwners.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {historyData.previousOwners.map((owner: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center bg-white p-4 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-600 mr-4 min-w-[40px] text-center bg-gray-100 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="font-mono text-sm text-gray-800 break-all">
                        {owner}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-6 py-4 rounded-lg">
                <p className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    No previous owners found.
                  </span>
                </p>
                <p className="text-sm mt-1 ml-7">
                  This NFT may have been recently minted or has not been
                  transferred yet.
                </p>
              </div>
            )}

            {/* Transfer Details */}
            {historyData.transfers && historyData.transfers.length > 0 && (
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-gray-600" />
                  Transfer Details
                </h2>
                <div className="space-y-3">
                  {historyData.transfers.map((transfer: any, index: number) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700 bg-emerald-100 px-3 py-1 rounded-full">
                          Transfer #{index + 1}
                        </span>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                          Block: {transfer.blockNumber}
                        </span>
                      </div>
                      <div className="text-sm space-y-2">
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <span className="text-gray-600 font-medium">
                            From:
                          </span>
                          <span className="font-mono text-xs ml-2 block mt-1 break-all">
                            {transfer.from ===
                            "0x0000000000000000000000000000000000000000" ? (
                              <span className="text-emerald-600 font-semibold">
                                🌟 Minted
                              </span>
                            ) : (
                              transfer.from
                            )}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <span className="text-gray-600 font-medium">To:</span>
                          <span className="font-mono text-xs ml-2 block mt-1 break-all">
                            {transfer.to}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${transfer.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:text-emerald-800 font-medium mt-3 inline-flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        View on Etherscan
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {historyData.note && (
              <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Note</p>
                  <p className="text-sm mt-1">{historyData.note}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!historyData && !error && !isLoading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-4">
              <Search className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Track Product History
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter a product auth code above to view the complete ownership
              history and transfer trail on the blockchain.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 