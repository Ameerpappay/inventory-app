import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Download, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users } from 'lucide-react'

export function Reports() {
  const [dateRange, setDateRange] = useState('30')
  const [reportType, setReportType] = useState('overview')

  const salesData = [
    { month: 'Jan', sales: 45000, orders: 120, customers: 85 },
    { month: 'Feb', sales: 52000, orders: 145, customers: 92 },
    { month: 'Mar', sales: 48000, orders: 132, customers: 88 },
    { month: 'Apr', sales: 61000, orders: 168, customers: 110 },
    { month: 'May', sales: 55000, orders: 155, customers: 105 },
    { month: 'Jun', sales: 67000, orders: 180, customers: 125 },
  ]

  const categoryData = [
    { name: 'Electronics', value: 35, amount: 125000, color: '#3b82f6' },
    { name: 'Clothing', value: 28, amount: 89000, color: '#10b981' },
    { name: 'Books', value: 15, amount: 45000, color: '#f59e0b' },
    { name: 'Home & Garden', value: 12, amount: 38000, color: '#8b5cf6' },
    { name: 'Sports', value: 10, amount: 32000, color: '#ef4444' },
  ]

  const inventoryTurnover = [
    { product: 'Widget A', turnover: 8.5, revenue: 45000 },
    { product: 'Gadget B', turnover: 6.2, revenue: 32000 },
    { product: 'Tool C', turnover: 4.8, revenue: 28000 },
    { product: 'Device D', turnover: 3.9, revenue: 22000 },
    { product: 'Item E', turnover: 2.1, revenue: 15000 },
  ]

  const profitData = [
    { month: 'Jan', revenue: 45000, cost: 32000, profit: 13000 },
    { month: 'Feb', revenue: 52000, cost: 36000, profit: 16000 },
    { month: 'Mar', revenue: 48000, cost: 34000, profit: 14000 },
    { month: 'Apr', revenue: 61000, cost: 42000, profit: 19000 },
    { month: 'May', revenue: 55000, cost: 38000, profit: 17000 },
    { month: 'Jun', revenue: 67000, cost: 45000, profit: 22000 },
  ]

  const topMetrics = [
    {
      title: 'Total Revenue',
      value: '$328,000',
      change: '+12.5%',
      trending: true,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: '900',
      change: '+8.2%',
      trending: true,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Inventory Value',
      value: '$89,500',
      change: '-2.1%',
      trending: false,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Active Customers',
      value: '605',
      change: '+15.8%',
      trending: true,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'sales', name: 'Sales Analysis', icon: ShoppingCart },
              { id: 'inventory', name: 'Inventory Report', icon: Package },
              { id: 'profit', name: 'Profit & Loss', icon: DollarSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`${
                  reportType === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {reportType === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topMetrics.map((metric, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                        <div className="flex items-center mt-2">
                          {metric.trending ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            metric.trending ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.change}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-full ${metric.bg}`}>
                        <metric.icon className={`h-6 w-6 ${metric.color}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {reportType === 'sales' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales Performance</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#3b82f6" name="Sales ($)" />
                    <Bar dataKey="orders" fill="#10b981" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories by Revenue</h3>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: category.color }} />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">${category.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{category.value}% of total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {reportType === 'inventory' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Turnover Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Product</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Turnover Rate</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Revenue</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryTurnover.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-4 text-sm font-medium text-gray-900">{item.product}</td>
                          <td className="py-4 text-sm text-gray-600">{item.turnover}x</td>
                          <td className="py-4 text-sm text-gray-600">${item.revenue.toLocaleString()}</td>
                          <td className="py-4">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-3" style={{ width: '100px' }}>
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min((item.turnover / 10) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {item.turnover >= 5 ? 'Excellent' : item.turnover >= 3 ? 'Good' : 'Needs Attention'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {reportType === 'profit' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Statement</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} name="Revenue" />
                    <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={3} name="Cost" />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">Total Revenue</h4>
                  <p className="text-3xl font-bold text-blue-600">$328,000</p>
                  <p className="text-sm text-blue-700 mt-1">+12.5% from last period</p>
                </div>
                <div className="bg-red-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-red-900 mb-2">Total Costs</h4>
                  <p className="text-3xl font-bold text-red-600">$227,000</p>
                  <p className="text-sm text-red-700 mt-1">+8.3% from last period</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-2">Net Profit</h4>
                  <p className="text-3xl font-bold text-green-600">$101,000</p>
                  <p className="text-sm text-green-700 mt-1">+24.7% from last period</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}