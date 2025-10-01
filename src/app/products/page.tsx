"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import TrueSourceAPI from "@/lib/trueSourceApi";

interface Product {
  id: string;
  title: string;
  sku: string;
  category: string;
  sub_category: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productData = await TrueSourceAPI.getAllProducts();
      console.log("product iss", productData);
      if (productData?.success) {
        setProducts(productData.result);
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

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage all your products here.</p>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-sm font-medium text-gray-600">Name</th>

                <th className="p-4 text-sm font-medium text-gray-600">
                  Category
                </th>
                <th className="p-4 text-sm font-medium text-gray-600">
                  Sub Category
                </th>
                <th className="p-4 text-sm font-medium text-gray-600">Price</th>

                <th className="p-4 text-sm font-medium text-gray-600">
                  Created
                </th>
                <th className="p-4 text-sm font-medium text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {product.title}
                    </td>

                    <td className="p-4 text-gray-600">{product.category}</td>
                    <td className="p-4 text-gray-600">
                      {product.sub_category || "nan"}
                    </td>
                    <td className="p-4 text-gray-900 font-medium">
                      ${product.price.toFixed(2)}
                    </td>

                    <td className="p-4 text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        style={{ cursor: "pointer" }}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    No products found.
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
