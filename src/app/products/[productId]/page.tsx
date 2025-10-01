"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import TrueSourceAPI from "@/lib/trueSourceApi";
import Image from "next/image";
import { motion } from "framer-motion";

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
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadProduct();
    loadBatches();
  }, [productId]);

  useEffect(() => {
    if (!product?.product_assets?.length) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % product.product_assets.length);
    }, 3000); // 3s autoplay
    return () => clearInterval(interval);
  }, [product]);

  const loadProduct = async () => {
    try {
      const productData = await TrueSourceAPI.getProductById(productId);

      console.log("productData is", productData);
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
      console.log("product iss", batches);
      if (batches?.success) {
        setBatches(batches.result);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
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
        <h2 className="text-md font-bold">Batches</h2>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
