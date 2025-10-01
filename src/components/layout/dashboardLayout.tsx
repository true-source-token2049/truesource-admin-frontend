"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Plus,
  FileText,
  ShieldCheck,
  Users,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Bell,
  Search,
  User as UserIcon,
  TrendingUp,
} from "lucide-react";
import store from "store";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";

interface User {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface DashboardLayoutProps {
  user?: User;
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const {
    account,
    connectWallet,
    disconnectWallet,
    isMetaMaskInstalled,
    isMetaMaskConnected,
    isCorrectNetwork,
    error,
    isLoading,
  } = useWallet();

  const router = useRouter();

  const handleLogout = () => {
    store.remove("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-1.5">
                <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              TrueSource
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </a>

          {/* Products - Expandable */}
          <div>
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5" />
                <span className="font-medium">Products</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  productsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Products Submenu */}
            {productsOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                <a
                  href="/products"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>All Products</span>
                </a>
                <a
                  href="/products/create"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Product</span>
                </a>
                <a
                  href="/product"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Batches</span>
                </a>
                <a
                  href="/dashboard/trail"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Product Trail</span>
                </a>
              </div>
            )}
          </div>
          <a
            href="/dashboard/users"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </a>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          {/*Wallet*/}
          <span className="font-medium">
            {typeof account === "string"
              ? `${(account as string).slice(0, 6)}...${(
                  account as string
                ).slice(-6)}`
              : ""}
          </span>
          <div>
            {account ? (
              <div className="flex my-4 items-center gap-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <button
                  onClick={disconnectWallet}
                  className="font-medium cursor-pointer px-3 py-2.5 flex items-center gap-3"
                >
                  <LogOut className="w-5 h-5" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex my-4 items-center gap-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <button
                  onClick={connectWallet}
                  disabled={!isMetaMaskInstalled || isLoading}
                  className="font-medium cursor-pointer px-3 py-2.5 flex items-center gap-3"
                >
                  <UserIcon className="w-5 h-5" />
                  {isLoading ? "Connecting..." : "Connect Wallet"}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, batches..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Side - Notifications & User */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <a
                  href="/dashboard/profile"
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || "Administrator"}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
