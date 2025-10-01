"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import TrueSourceAPI from "@/lib/trueSourceApi";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CreateBatchModal from "@/components/modal/CreateBatchModal";
import AttestBatchModal, { AttestationStep } from "@/components/modal/AttestBatchModal";
import AttestationRecordsModal from "@/components/modal/AttestationRecordsModal";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";

const NFT_ABI = [
  "function mint(string memory metadataUri) public returns (uint256)",
  "function mintBatch(string memory metadataUri, uint256 quantity) public returns (uint256)",
  "event TokenMinted(uint256 indexed tokenId, address indexed to, string metadataUri)",
  "function attestNFT(uint256 tokenId, uint256 value, string memory note) public",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as any;

interface ProductAsset {
  id: number;
  url: string;
  view: string;
  type: string;
}

interface ProductAttr {
  id: number;
  name: string;
  value: string;
  type: string;
}

interface Product {
  id: number;
  title: string;
  brand: string;
  category: string;
  sub_category: string;
  description: string;
  plain_description: string;
  price: number;
  createdAt: string;
  product_assets: ProductAsset[];
  product_attrs: ProductAttr[];
}

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.productId as string;

  const [user, setUser] = useState<any>(null);
  const [batches, setBatches] = useState<any>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isAttestModalOpen, setIsAttestModalOpen] = useState(false);
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { account, signer } = useWallet();

  useEffect(() => {
    loadProduct();
    loadBatches();
  }, [productId]);

  useEffect(() => {
    if (!product?.product_assets?.length) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % product.product_assets.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [product]);

  const loadProduct = async () => {
    try {
      const productData = await TrueSourceAPI.getProductById(productId);

      if (productData?.success) {
        setProduct(productData.result);
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const batches = await TrueSourceAPI.getAllBatchesByProduct(productId);
      if (batches?.success) {
        setBatches(batches.result);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBatches = async (payload: any) => {
    const units = payload.total_units;
    let quantity = parseInt(units) || 1;
    const res = await TrueSourceAPI.createBatches(payload);
    if (res?.success) {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, signer);
      let tx;
      let metadataUrl = res.result.metadataUrl;
      if (quantity === 1) {
        tx = await contract.mint(metadataUrl, {});
      } else {
        tx = await contract.mintBatch(metadataUrl, quantity, {});
      }
      const receipt = await tx.wait(1);

      const mintedTokenIds = [];
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "TokenMinted") {
            mintedTokenIds.push(parsed.args.tokenId.toString());
          }
        } catch (e) {}
      }
      if (mintedTokenIds.length > 0) {
        try {
          await TrueSourceAPI.updateBatchNFT({
            nft_token_ids: mintedTokenIds,
            nft_transaction_hash: receipt.hash,
            batch_id: res.result.batch_id,
          });
          console.log("Batch NFT info updated successfully");
        } catch (error) {
          console.error("Error updating batch NFT info:", error);
        }
      }
      loadBatches();
    }
  };

  const handleOpenAttestModal = async (batch: any) => {
    const completedSteps = {
      manufacturer: !!batch.batch_block?.manufacturer_transaction_hash,
      distributor: !!batch.batch_block?.distributor_transaction_hash,
      retailer: !!batch.batch_block?.retailer_transaction_hash,
    };
    
    setSelectedBatch({ ...batch, completedSteps });
    setIsAttestModalOpen(true);
  };

  const handleOpenRecordsModal = (batch: any) => {
    setSelectedBatch(batch);
    setIsRecordsModalOpen(true);
  };

  const handleAttestStep = async (
    step: AttestationStep, 
    stepIndex: number, 
    onProgress?: (msg: string) => void
  ) => {
    if (!selectedBatch || !account || !signer) {
      throw new Error("Missing required data");
    }

    // Extract and parse NFT token IDs from batch_range_logs
    const rawTokenIds = selectedBatch.batch_range_logs?.map((log: any) => log.nft_token_id) || [];
    
    if (!rawTokenIds || rawTokenIds.length === 0) {
      throw new Error(
        `No NFT token IDs found for this batch. Batch ID: ${selectedBatch.id}`
      );
    }

    // Parse token IDs - handle hex strings, decimal numbers, etc.
    const tokenIds: string[] = [];
    const invalidIds: string[] = [];
    
    rawTokenIds.forEach((id: string) => {
      // Skip wallet addresses (40 hex chars = Ethereum address)
      if (id.startsWith('0x') && id.length === 42) {
        invalidIds.push(id);
        return;
      }
      
      // If it's already a valid number string, use it
      if (/^\d+$/.test(id)) {
        tokenIds.push(id);
        return;
      }
      
      // If it's a short hex string without 0x prefix, add it
      if (/^[0-9a-fA-F]+$/.test(id) && id.length <= 16) {
        tokenIds.push(`0x${id}`);
        return;
      }
      
      // If it's already prefixed with 0x and not an address, use it
      if (id.startsWith('0x') && id.length < 42) {
        tokenIds.push(id);
        return;
      }
      
      // Otherwise it's invalid
      invalidIds.push(id);
    });
    
    if (invalidIds.length > 0) {
      console.warn('Skipped invalid token IDs (likely wallet addresses):', invalidIds);
      if (onProgress) {
        onProgress(`Warning: Skipped ${invalidIds.length} invalid token ID(s)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (tokenIds.length === 0) {
      throw new Error(
        `No valid NFT token IDs found. Found ${invalidIds.length} invalid entries (wallet addresses). Please check your backend data.`
      );
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, signer);
    const accountAddress = String(account).toLowerCase();
    
    // Only use the first token ID
    const tokenId = tokenIds[0];
    
    if (onProgress) {
      onProgress(`Attesting NFT Token ID #${tokenId}...`);
    }
    
    // Verify ownership before attesting (only on first step)
    if (stepIndex === 0) {
      try {
        const owner = await contract.ownerOf(tokenId);
        const ownerAddress = String(owner).toLowerCase();
        if (ownerAddress !== accountAddress) {
          throw new Error(`You do not own NFT #${tokenId}`);
        }
      } catch (error: any) {
        throw new Error(`Failed to verify ownership of NFT #${tokenId}: ${error?.message || error}`);
      }
    }

    // Attest with this step
    try {
      const tx = await contract.attestNFT(
        tokenId, 
        parseInt(step.role), // role value (1-3)
        step.note
      );
      const receipt = await tx.wait(1);
      console.log(`Attested token ${tokenId} with step ${stepIndex + 1}`);
      
      // Save to database after successful attestation
      try {
        await TrueSourceAPI.saveBatchAttestationBlock({
          note: step.note,
          type: step.roleLabel,
          transaction_hash: receipt.hash,
          batch_id: selectedBatch.id,
        });
        console.log(`Saved attestation block for ${step.roleLabel}`);
      } catch (dbError: any) {
        console.error(`Warning: Failed to save attestation to DB:`, dbError);
        // Don't throw - blockchain attestation was successful
      }
    } catch (error: any) {
      throw new Error(`Failed to attest NFT #${tokenId} at step ${stepIndex + 1}: ${error?.message || error}`);
    }
  };

  const handleSaveAttestations = async (steps: AttestationStep[]) => {
    // All attestations already saved to DB during each step
    // Just close modal and reload batches
    loadBatches();
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

  if (!product) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-96 text-gray-500">
          Product not found
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
          <p className="text-gray-600 mt-1">{product.brand}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Carousel */}
          <div className="relative w-full h-96 overflow-hidden rounded-xl border border-gray-200">
            {product.product_assets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: index === activeIndex ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={asset.url}
                  alt={product.title}
                  fill
                  className="object-contain rounded-xl"
                />
              </motion.div>
            ))}

            {/* Carousel Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {product.product_assets.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-3 h-3 rounded-full ${
                    i === activeIndex ? "bg-emerald-600" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500">
                {product.category} • {product.sub_category}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                ${product.price.toFixed(2)}
              </h2>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">Description</h3>
              <p className="text-gray-600 mt-2">{product.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">Attributes</h3>
              <div className="mt-3 grid grid-cols-2 gap-4">
                {product.product_attrs.map((attr) => (
                  <div
                    key={attr.id}
                    className="bg-gray-50 border rounded-lg p-3"
                  >
                    <p className="text-sm text-gray-500">{attr.name}</p>
                    <p className="font-medium text-gray-900">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Created on {new Date(product.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-5 w-full flex-col mt-10">
        <div className="flex justify-between">
          <h2 className="text-md font-bold">Batches</h2>
          {account ? (
            <Button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white cursor-pointer"
            >
              Create Batches
            </Button>
          ) : (
            <Button
              disabled
              className="px-4 py-2 rounded-md bg-emerald-600 text-white cursor-pointer"
            >
              Connect Wallet to Create Batches
            </Button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-sm font-medium text-gray-600">UID</th>
                <th className="p-4 text-sm font-medium text-gray-600">Start</th>
                <th className="p-4 text-sm font-medium text-gray-600">End</th>
                <th className="p-4 text-sm font-medium text-gray-600">Units</th>
                <th className="p-4 text-sm font-medium text-gray-600">
                  NFT Status
                </th>
                <th className="p-4 text-sm font-medium text-gray-600">
                  Created
                </th>
                <th className="p-4 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {batches.length > 0 ? (
                batches.map((batch: any) => (
                  <tr
                    key={batch.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {batch.uid}
                    </td>
                    <td className="p-4 text-gray-600">{batch.start}</td>
                    <td className="p-4 text-gray-600">{batch.end}</td>
                    <td className="p-4">{batch.total_units}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          batch.nft_minting_status === "completed"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {batch.nft_minting_status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {batch.nft_minting_status === "completed" ? (
                        (() => {
                          // Check if all attestations are complete
                          const allComplete = 
                            batch.batch_block?.manufacturer_transaction_hash &&
                            batch.batch_block?.distributor_transaction_hash &&
                            batch.batch_block?.retailer_transaction_hash;
                          
                          if (allComplete) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenRecordsModal(batch)}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <span className="mr-1">✓</span> View Records
                              </Button>
                            );
                          }
                          
                          return account ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenAttestModal(batch)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Attest
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled
                              className="opacity-50"
                            >
                              Connect Wallet
                            </Button>
                          );
                        })()
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    No batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CreateBatchModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        productId={product?.id}
        onSubmit={(payload) => {
          console.log("Batch Payload:", payload);
          createBatches(payload);
          // call your API here
        }}
      />
      <AttestBatchModal
        open={isAttestModalOpen}
        onClose={() => {
          setIsAttestModalOpen(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
        onAttestStep={handleAttestStep}
        onSubmit={handleSaveAttestations}
      />
      <AttestationRecordsModal
        open={isRecordsModalOpen}
        onClose={() => {
          setIsRecordsModalOpen(false);
          setSelectedBatch(null);
        }}
        batch={selectedBatch}
      />
    </DashboardLayout>
  );
}
