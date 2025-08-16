import { Menu, Bell, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900 lg:ml-0">
            Business Management
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors rounded-md">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gray-100 rounded-full">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
