import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
} from "lucide-react";
import { apiClient } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  inventoryItems: number;
  lowStockItems: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchases: 0,
    inventoryItems: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);

  const salesData = [
    { month: "Jan", sales: 4000, purchases: 2400 },
    { month: "Feb", sales: 3000, purchases: 1398 },
    { month: "Mar", sales: 2000, purchases: 9800 },
    { month: "Apr", sales: 2780, purchases: 3908 },
    { month: "May", sales: 1890, purchases: 4800 },
    { month: "Jun", sales: 2390, purchases: 3800 },
  ];

  const orderStatusData = [
    { name: "Pending", value: 35, color: "#f59e0b" },
    { name: "Processing", value: 25, color: "#3b82f6" },
    { name: "Shipped", value: 30, color: "#10b981" },
    { name: "Delivered", value: 10, color: "#8b5cf6" },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch sales orders
        const salesOrdersResponse = await apiClient.getSalesOrders();
        const salesOrders = salesOrdersResponse.data || [];

        // Fetch purchase orders
        const purchaseOrdersResponse = await apiClient.getPurchaseOrders();
        const purchaseOrders = purchaseOrdersResponse.data || [];

        // Fetch inventory items
        const inventoryResponse = await apiClient.getInventory();
        const inventoryItems = inventoryResponse.data || [];

        // Calculate low stock items
        const lowStockCount = inventoryItems.filter(
          (item: any) => item.quantity <= item.reorderLevel
        ).length;

        setStats({
          totalSales: salesOrders.length,
          totalPurchases: purchaseOrders.length,
          inventoryItems: inventoryItems.length,
          lowStockItems: lowStockCount,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const statCards = [
    {
      title: "Total Sales Orders",
      value: stats.totalSales,
      icon: ShoppingCart,
      color: "bg-blue-500",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Total Purchases",
      value: stats.totalPurchases,
      icon: Package,
      color: "bg-green-500",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Inventory Items",
      value: stats.inventoryItems,
      icon: Users,
      color: "bg-purple-500",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: DollarSign,
      color: "bg-red-500",
      trend: "-5%",
      trendUp: false,
    },
  ];

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Welcome back! Here's what's happening with your business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                </p>
                <div className="flex items-center mt-1">
                  {card.trendUp ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      card.trendUp ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {card.trend}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    vs last month
                  </span>
                </div>
              </div>
              <div className={`p-2 rounded-full ${card.color}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales & Purchases Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-md font-semibold text-gray-900 mb-3">
            Sales vs Purchases
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
              <Bar dataKey="purchases" fill="#10b981" name="Purchases" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-md font-semibold text-gray-900 mb-3">
            Order Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-md font-semibold text-gray-900">
            Recent Activity
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {[
              {
                action: "New sales order #SO-001 created",
                time: "2 hours ago",
                type: "sale",
              },
              {
                action: "Purchase order #PO-005 approved",
                time: "4 hours ago",
                type: "purchase",
              },
              {
                action: 'Inventory item "Widget A" updated',
                time: "6 hours ago",
                type: "inventory",
              },
              {
                action: "Sales order #SO-002 shipped",
                time: "1 day ago",
                type: "sale",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    activity.type === "sale"
                      ? "bg-blue-500"
                      : activity.type === "purchase"
                      ? "bg-green-500"
                      : "bg-purple-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
