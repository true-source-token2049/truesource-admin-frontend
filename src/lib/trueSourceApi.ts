// src/lib/TrueSourceAPI.ts

import APISDK from "./APISDK";
import store from "store";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sku?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortType?: string;
  sortItem?: string;
}

export default class TrueSourceAPI extends APISDK {
  // ==================== AUTH ENDPOINTS ====================

  /**
   * Login admin user
   */
  static login = async (payload: LoginPayload, headers = {}) => {
    const result = await this.postWithApiKey(
      `${this.API_BASE_URL}/admin/login`,
      payload,
      headers,
      true
    );

    if (result.success && result.token) {
      store.set("token", result.token);
      cookieStore.set("token", result.token);
      store.set("user", result.user);
    }

    return result;
  };

  /**
   * Logout admin user
   */
  static logout = async (headers = {}) => {
    const result = await this.postWithAuth(
      `${this.API_BASE_URL}/auth/logout`,
      {},
      headers
    );

    // Clear store
    store.remove("token");
    store.remove("user");

    return result;
  };

  /**
   * Get current admin user details
   */
  static getCurrentUser = async (headers = {}) => {
    return this.getWithAuth(`${this.API_BASE_URL}/admin`, headers, true);
  };

  /**
   * Refresh token
   */
  static refreshToken = async (headers = {}) => {
    return this.postWithAuth(
      `${this.API_BASE_URL}/auth/refresh`,
      {},
      headers,
      true
    );
  };

  // ==================== PRODUCT ENDPOINTS ====================

  /**
   * Get all products with filters
   */
  static getAllProducts = async (filters?: ProductFilters, headers = {}) => {
    let query = new URLSearchParams();

    if (filters?.search) query.append("search", filters.search);
    if (filters?.category) query.append("category", filters.category);
    if (filters?.minPrice)
      query.append("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice)
      query.append("maxPrice", filters.maxPrice.toString());
    if (filters?.page) query.append("page", filters.page.toString());
    if (filters?.limit) query.append("limit", filters.limit.toString());
    if (filters?.sortType && filters?.sortItem) {
      query.append("sortType", filters.sortType);
      query.append("sortItem", filters.sortItem);
    }

    return this.getWithAuth(
      `${this.API_BASE_URL}/admin/products?${query.toString()}`,
      headers,
      true
    );
  };

  static getAllBatchesByProduct = async (productId: string, headers = {}) => {
    let query = new URLSearchParams();

    return this.getWithAuth(
      `${this.API_BASE_URL}/admin/batches/${productId}`,
      headers,
      true
    );
  };

  /**
   * Get product by ID
   */
  static getProductById = async (id: string, headers = {}) => {
    return this.getWithAuth(
      `${this.API_BASE_URL}/admin/product/${id}`,
      headers,
      true
    );
  };

  /**
   * Get product by SKU
   */
  static getProductBySku = async (sku: string, headers = {}) => {
    return this.getWithAuth(
      `${this.API_BASE_URL}/products/sku/${sku}`,
      headers,
      true
    );
  };

  /**
   * Create new product
   */
  static createProduct = async (
    payload: Omit<Product, "id" | "createdAt" | "updatedAt">,
    headers = {}
  ) => {
    return this.postWithAuth(
      `${this.API_BASE_URL}/admin/product`,
      payload,
      headers,
      true
    );
  };

  static createBatches = async (payload: any, headers = {}) => {
    return this.postWithAuth(
      `${this.API_BASE_URL}/admin/batches`,
      payload,
      headers,
      true
    );
  };

  /**
   * Update product
   */
  static updateProduct = async (
    id: string,
    payload: Partial<Product>,
    headers = {}
  ) => {
    return this.putWithAuth(
      `${this.API_BASE_URL}/products/${id}`,
      payload,
      headers,
      true
    );
  };

  /**
   * Delete product
   */
  static deleteProduct = async (id: string, headers = {}) => {
    return this.DeleteWithAuth(
      `${this.API_BASE_URL}/products/${id}`,
      {},
      headers
    );
  };

  /**
   * Bulk delete products
   */
  static bulkDeleteProducts = async (ids: string[], headers = {}) => {
    return this.postWithAuth(
      `${this.API_BASE_URL}/products/bulk-delete`,
      { ids },
      headers,
      true
    );
  };

  /**
   * Upload product image
   */
  static uploadProductImage = async (
    productId: string,
    file: File[],
    headers = {}
  ) => {
    return this.fileUploadWithAuth(
      `${this.API_BASE_URL}/products/${productId}/image`,
      file,
      "image"
    );
  };

  /**
   * Upload multiple product images
   */
  static uploadProductImages = async (productId: string, files: File[]) => {
    return this.multipleFileUpload(
      `${this.API_BASE_URL}/products/${productId}/images`,
      files
    );
  };

  // ==================== VERIFICATION ENDPOINTS ====================

  /**
   * Verify product authenticity
   */
  static verifyProduct = async (
    authCode: string,
    payload: any = {},
    headers = {}
  ) => {
    return this.postWithAuth(
      `${this.API_BASE_URL}/verify/product/${authCode}`,
      payload,
      headers,
      true
    );
  };

  /**
   * Get verification history
   */
  static getVerificationHistory = async (
    filters?: { productId?: string; page?: number; limit?: number },
    headers = {}
  ) => {
    let query = new URLSearchParams();

    if (filters?.productId) query.append("productId", filters.productId);
    if (filters?.page) query.append("page", filters.page.toString());
    if (filters?.limit) query.append("limit", filters.limit.toString());

    return this.getWithAuth(
      `${this.API_BASE_URL}/verify/history?${query.toString()}`,
      headers,
      true
    );
  };

  // ==================== CATEGORY ENDPOINTS ====================

  /**
   * Get all categories
   */
  static getAllCategories = async (headers = {}) => {
    return this.getWithAuth(`${this.API_BASE_URL}/categories`, headers, true);
  };

  /**
   * Create category
   */
  static createCategory = async (
    payload: { name: string; description?: string },
    headers = {}
  ) => {
    return this.postWithAuth(
      `${this.API_BASE_URL}/categories`,
      payload,
      headers,
      true
    );
  };

  /**
   * Update category
   */
  static updateCategory = async (
    id: string,
    payload: { name?: string; description?: string },
    headers = {}
  ) => {
    return this.putWithAuth(
      `${this.API_BASE_URL}/categories/${id}`,
      payload,
      headers,
      true
    );
  };

  /**
   * Delete category
   */
  static deleteCategory = async (id: string, headers = {}) => {
    return this.DeleteWithAuth(
      `${this.API_BASE_URL}/categories/${id}`,
      {},
      headers
    );
  };

  // ==================== ANALYTICS ENDPOINTS ====================

  /**
   * Get dashboard stats
   */
  static getDashboardStats = async (headers = {}) => {
    return this.getWithAuth(
      `${this.API_BASE_URL}/analytics/dashboard`,
      headers,
      true
    );
  };

  /**
   * Get product analytics
   */
  static getProductAnalytics = async (
    productId: string,
    filters?: { startDate?: string; endDate?: string },
    headers = {}
  ) => {
    let query = new URLSearchParams();

    if (filters?.startDate) query.append("startDate", filters.startDate);
    if (filters?.endDate) query.append("endDate", filters.endDate);

    return this.getWithAuth(
      `${
        this.API_BASE_URL
      }/analytics/products/${productId}?${query.toString()}`,
      headers,
      true
    );
  };

  /**
   * Get verification analytics
   */
  static getVerificationAnalytics = async (
    filters?: { startDate?: string; endDate?: string },
    headers = {}
  ) => {
    let query = new URLSearchParams();

    if (filters?.startDate) query.append("startDate", filters.startDate);
    if (filters?.endDate) query.append("endDate", filters.endDate);

    return this.getWithAuth(
      `${this.API_BASE_URL}/analytics/verifications?${query.toString()}`,
      headers,
      true
    );
  };

  // ==================== USER MANAGEMENT ENDPOINTS ====================

  /**
   * Get all admin users
   */
  static getAllAdminUsers = async (
    filters?: { page?: number; limit?: number },
    headers = {}
  ) => {
    let query = new URLSearchParams();

    if (filters?.page) query.append("page", filters.page.toString());
    if (filters?.limit) query.append("limit", filters.limit.toString());

    return this.getWithAuth(
      `${this.API_BASE_URL}/users/admins?${query.toString()}`,
      headers,
      true
    );
  };

  /**
   * Create admin user
   */
  static createAdminUser = async (
    payload: { email: string; name: string; password: string; role: string },
    headers = {}
  ) => {
    return this.postWithAuth(
      `${this.API_BASE_URL}/users/admins`,
      payload,
      headers,
      true
    );
  };

  /**
   * Update admin user
   */
  static updateAdminUser = async (
    id: string,
    payload: Partial<{ email: string; name: string; role: string }>,
    headers = {}
  ) => {
    return this.putWithAuth(
      `${this.API_BASE_URL}/users/admins/${id}`,
      payload,
      headers,
      true
    );
  };

  /**
   * Delete admin user
   */
  static deleteAdminUser = async (id: string, headers = {}) => {
    return this.DeleteWithAuth(
      `${this.API_BASE_URL}/users/admins/${id}`,
      {},
      headers
    );
  };

  // ==================== FILE UPLOAD ENDPOINTS ====================

  /**
   * Upload generic file
   */
  static uploadFile = async (file: File[], fileType = "file") => {
    return this.fileUploadWithAuth(
      `${this.API_BASE_URL}/upload`,
      file,
      fileType
    );
  };

  /**
   * Upload multiple files
   */
  static uploadMultipleFiles = async (files: File[]) => {
    return this.multipleFileUpload(
      `${this.API_BASE_URL}/upload/multiple`,
      files
    );
  };

  // ==================== SETTINGS ENDPOINTS ====================

  /**
   * Get app settings
   */
  static getSettings = async (headers = {}) => {
    return this.getWithAuth(`${this.API_BASE_URL}/settings`, headers, true);
  };

  /**
   * Update settings
   */
  static updateSettings = async (payload: any, headers = {}) => {
    return this.putWithAuth(
      `${this.API_BASE_URL}/settings`,
      payload,
      headers,
      true
    );
  };
}
