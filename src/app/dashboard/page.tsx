"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboardLayout";
import TrueSourceAPI from "@/lib/trueSourceApi";
import {
  Package,
  ShieldCheck,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  totalVerifications: number;
  activeUsers: number;
  revenue: number;
  productsChange: number;
  verificationsChange: number;
  usersChange: number;
  revenueChange: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalVerifications: 0,
    activeUsers: 0,
    revenue: 0,
    productsChange: 0,
    verificationsChange: 0,
    usersChange: 0,
    revenueChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get current user
      const userData = await TrueSourceAPI.getCurrentUser();

      console.log("userdata iss", userData);
      if (userData?.success) {
        setUser(userData?.result);
      }

      // Get dashboard stats
      //   const statsData = await TrueSourceAPI.getDashboardStats();
      //   if (statsData) {
      //     setStats(statsData);
      //   }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("user iss", user);

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    change: number;
    icon: any;
    color: string;
  }) => {
    const isPositive = change >= 0;

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name || "Admin"}! Here's what's happening
            today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            change={stats.productsChange}
            icon={Package}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Verifications"
            value={stats.totalVerifications.toLocaleString()}
            change={stats.verificationsChange}
            icon={ShieldCheck}
            color="from-emerald-500 to-teal-600"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers.toLocaleString()}
            change={stats.usersChange}
            icon={Users}
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            title="Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            change={stats.revenueChange}
            icon={TrendingUp}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Products
              </h2>
              <a
                href="/product"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View All
              </a>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg"></div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Product Name {item}
                    </h3>
                    <p className="text-sm text-gray-500">SKU-{1000 + item}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    $99.99
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Verifications */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Verifications
              </h2>
              <a
                href="/dashboard/verification"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View All
              </a>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Verification #{item}
                    </h3>
                    <p className="text-sm text-gray-500">2 minutes ago</p>
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/product/create"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors rounded-lg p-4 text-center"
            >
              <Package className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">Add Product</p>
            </a>
            <a
              href="/products/batches"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors rounded-lg p-4 text-center"
            >
              <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">Create Batch</p>
            </a>
            <a
              href="/dashboard/verification"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors rounded-lg p-4 text-center"
            >
              <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">Verify Product</p>
            </a>
            <a
              href="/dashboard/users"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors rounded-lg p-4 text-center"
            >
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">Manage Users</p>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
