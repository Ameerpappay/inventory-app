import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { SalesOrders } from "./pages/SalesOrders";
import { CreateSalesOrder } from "./pages/CreateSalesOrder";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { CreatePurchaseOrder } from "./pages/CreatePurchaseOrder";
import { Inventory } from "./pages/Inventory";
import { Suppliers } from "./pages/Suppliers";
import { Customers } from "./pages/Customers";
import { Reports } from "./pages/Reports";
import SupplierTest from "./components/SupplierTest";

function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  console.log("🏠 App render - User:", user, "Loading:", loading);

  if (loading) {
    console.log("⏳ App showing loading state");
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log("🚫 App showing auth page - no user");
    return <AuthPage />;
  }

  console.log("✅ App showing main app - user authenticated");

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="lg:ml-56 flex flex-col min-h-screen">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 bg-gray-50 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sales-orders" element={<SalesOrders />} />
              <Route
                path="/sales-orders/create"
                element={<CreateSalesOrder />}
              />
              <Route
                path="/sales-orders/edit/:id"
                element={<CreateSalesOrder />}
              />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route
                path="/purchase-orders/create"
                element={<CreatePurchaseOrder />}
              />
              <Route
                path="/purchase-orders/edit/:id"
                element={<CreatePurchaseOrder />}
              />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/test-suppliers" element={<SupplierTest />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
