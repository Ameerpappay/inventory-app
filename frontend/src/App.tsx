import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Sidebar } from './components/Layout/Sidebar'
import { Header } from './components/Layout/Header'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { SalesOrders } from './pages/SalesOrders'
import { CreateSalesOrder } from './pages/CreateSalesOrder'
import { PurchaseOrders } from './pages/PurchaseOrders'
import { Inventory } from './pages/Inventory'
import { Reports } from './pages/Reports'

function App() {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 flex flex-col lg:ml-0">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 bg-gray-50 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sales-orders" element={<SalesOrders />} />
              <Route path="/sales-orders/create" element={<CreateSalesOrder />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App