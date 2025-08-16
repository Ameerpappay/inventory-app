import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package2,
  FileBarChart as FileBarChart3,
  Package,
  Users,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { signOut } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sales Orders", href: "/sales-orders", icon: ShoppingCart },
    { name: "Purchase Orders", href: "/purchase-orders", icon: Package2 },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Suppliers", href: "/suppliers", icon: Users },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Reports", href: "/reports", icon: FileBarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 z-50 h-screen w-56 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold">Business App</h1>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto">
          <div className="px-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`
                }
              >
                <item.icon className="mr-2.5 h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-2 border-t border-slate-700">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut className="mr-2.5 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
