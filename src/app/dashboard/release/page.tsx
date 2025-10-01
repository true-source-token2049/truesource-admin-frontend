"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import APISDK from "@/lib/APISDK";
import {
  Rocket,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  Key,
  FileSignature,
} from "lucide-react";

const CLAIM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId)",
];

const CLAIM_CONTRACT_ABI = [
  "function createClaimBatch(string[] memory claimCodes, uint256[] memory tokenIds) external",
];

export default function NFTReleasePage() {
  const { account, isCorrectNetwork } = useWallet();

  const [nftIds, setNftIds] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<any[]>([]);
  const [releasedNFTs, setReleasedNFTs] = useState<any[]>([]);

  const generateCodes = () => {
    if (!nftIds.trim()) {
      setError("Please enter NFT IDs");
      return;
    }

    const tokenIds = nftIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);

    if (tokenIds.length === 0) {
      setError("No valid NFT IDs found");
      return;
    }

    setError("");
    setSuccess("");
    
    // Generate 8-digit random codes for each NFT
    const codes = tokenIds.map((tokenId) => {
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, '0')
      return {
        tokenId,
        secretCode: randomCode,
        claimCode: `FREE-${tokenId}-${randomCode.substring(0, 6)}`,
      };
    });

    setGeneratedCodes(codes);
    setSuccess(`✅ Generated ${codes.length} secret codes. Review and click Release when ready.`);
  };

  const releaseNFTs = async () => {
    if (generatedCodes.length === 0) {
      setError("Please generate secret codes first");
      return;
    }

    if (!account) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setReleasedNFTs([]);

    try {
      if (!NFT_CONTRACT_ADDRESS || !CLAIM_CONTRACT_ADDRESS) {
        setError("Contract addresses not configured");
        setLoading(false);
        return;
      }

      setSuccess(`🔐 Processing ${generatedCodes.length} NFTs for release...`);

      if (typeof window !== "undefined" && !(window as any).ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        provider
      );

      const released = [];
      const errors = [];

      for (let i = 0; i < generatedCodes.length; i++) {
        const { tokenId, claimCode, secretCode } = generatedCodes[i];

        try {
          setSuccess(`🔍 Processing NFT #${tokenId}...`);

          // Check ownership
          const owner = await nftContract.ownerOf(tokenId);

          if (owner.toLowerCase() !== (account as string).toLowerCase()) {
            errors.push({
              tokenId,
              error: `You don't own NFT #${tokenId}`,
            });
            continue;
          }

          // Check if already approved
          const isApproved = await nftContract.isApprovedForAll(
            account,
            CLAIM_CONTRACT_ADDRESS
          );

          if (!isApproved) {
            setSuccess(`✍️ Signing approval for NFT #${tokenId}...`);
            const nftContractWithSigner = new ethers.Contract(
              NFT_CONTRACT_ADDRESS,
              NFT_ABI,
              signer
            );
            const approveTx = await nftContractWithSigner.setApprovalForAll(
              CLAIM_CONTRACT_ADDRESS,
              true
            );
            await approveTx.wait();
          }

          released.push({
            tokenId,
            claimCode,
            secretCode,
            owner: account,
            status: "approved",
          });

          setSuccess(`✅ NFT #${tokenId} ready for market`);
        } catch (err: any) {
          console.error(`Error processing NFT #${tokenId}:`, err);
          errors.push({
            tokenId,
            error: err.message || "Unknown error",
          });
        }
      }

      setReleasedNFTs(released);

      if (released.length > 0) {
        // Create claim batch
        try {
          setSuccess(`📝 Creating claim batch for ${released.length} NFTs...`);

          const signer = await provider.getSigner();
          const claimContract = new ethers.Contract(
            CLAIM_CONTRACT_ADDRESS,
            CLAIM_CONTRACT_ABI,
            signer
          );

          const claimCodes = released.map((r) => r.claimCode);
          const tokenIdsArray = released.map((r) => r.tokenId);

          const tx = await claimContract.createClaimBatch(
            claimCodes,
            tokenIdsArray
          );
          await tx.wait();

          // Register tokens in backend
          try {
            setSuccess(`📡 Registering tokens in backend...`);

            const tokenPayload = released.map((r) => ({
              random_key: r.claimCode,
              token: r.tokenId,
            }));

            await APISDK.postWithAuth(
              `${APISDK.API_BASE_URL}/admin/batches/token/random`,
              tokenPayload,
              {
                origin:
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "localhost:3000",
              },
              true
            );

            setSuccess(
              `🎉 Success! Released ${released.length} NFTs to the market${
                errors.length > 0 ? ` (${errors.length} failed)` : ""
              }`
            );
          } catch (apiError: any) {
            console.error("Backend registration error:", apiError);
            setSuccess(
              `✅ NFTs released on blockchain, but backend registration failed: ${
                apiError.message || apiError
              }`
            );
          }
        } catch (batchError: any) {
          console.error("Batch creation error:", batchError);
          setSuccess(
            `✅ Signed ${released.length} NFTs, but batch creation failed: ${batchError.message}`
          );
        }
      }

      if (errors.length > 0 && released.length === 0) {
        setError(
          `Failed to release any NFTs:\n${errors
            .map((e) => `NFT #${e.tokenId}: ${e.error}`)
            .join("\n")}`
        );
      } else if (errors.length > 0) {
        setError(
          `${errors.length} NFTs failed:\n${errors
            .map((e) => `NFT #${e.tokenId}: ${e.error}`)
            .join("\n")}`
        );
      }
    } catch (err: any) {
      console.error("Release error:", err);
      setError(`Failed to release NFTs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    releaseNFTs();
  };

  if (!account) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              🚀 Release NFTs
            </h1>
            <p className="text-gray-600">
              Please connect your wallet to release NFTs.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              🚀 Release NFTs
            </h1>
            <p className="text-red-600">Please switch to Sepolia network.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Rocket className="w-8 h-8 text-emerald-600" />
            Release NFTs to Market
          </h1>
          <p className="text-gray-600 mt-1">
            Generate random 8-digit secret codes and release NFTs for free market use with claim codes.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NFT IDs Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                NFT Token IDs (comma-separated)
              </label>
              <textarea
                placeholder="1, 2, 3, 4, 5"
                value={nftIds}
                onChange={(e) => setNftIds(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the token IDs you want to release. Random 8-digit secret codes will be generated for each NFT.
              </p>
            </div>

            {/* Generate Secret Codes Button */}
            <button
              type="button"
              onClick={generateCodes}
              disabled={!nftIds || generatedCodes.length > 0}
              className={`w-full px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                !nftIds || generatedCodes.length > 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg"
              }`}
            >
              <Key className="w-5 h-5" />
              {generatedCodes.length > 0 ? "✅ Secret Codes Generated" : "Generate Secret Codes"}
            </button>

            {/* Generated Codes Display */}
            {generatedCodes.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Generated Secret Codes
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {generatedCodes.map((code, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        NFT #{code.tokenId}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Claim Code:</p>
                          <code className="text-xs text-purple-800 font-mono bg-purple-50 px-2 py-1 rounded block break-all">
                            {code.claimCode}
                          </code>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Secret Code (8-digit):</p>
                          <code className="text-xs text-orange-800 font-mono bg-orange-50 px-2 py-1 rounded block break-all">
                            {code.secretCode}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-800 mt-3">
                  💡 These codes will be used for claiming. Review and click Release when ready.
                </p>
              </div>
            )}

            {/* Release Button */}
            <button
              type="submit"
              disabled={loading || generatedCodes.length === 0}
              className={`w-full px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                loading || generatedCodes.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileSignature className="w-5 h-5" />
                  Release NFTs to Market
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="text-sm whitespace-pre-line mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-6 bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Status</p>
                <p className="text-sm whitespace-pre-line mt-1">{success}</p>
              </div>
            </div>
          )}
        </div>

        {/* Released NFTs Display */}
        {releasedNFTs.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Released NFTs ({releasedNFTs.length})
            </h2>
            <div className="space-y-3">
              {releasedNFTs.map((nft, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      NFT #{nft.tokenId}
                    </span>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                      {nft.status}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600">
                      <span className="font-medium">Claim Code (Secret Token):</span>{" "}
                      <code className="text-purple-600 font-mono bg-purple-50 px-2 py-0.5 rounded">
                        {nft.claimCode}
                      </code>
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Owner:</span>{" "}
                      <code className="text-gray-800 font-mono text-xs">
                        {nft.owner}
                      </code>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
