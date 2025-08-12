import React from 'react'
import { Menu, Bell, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="ml-2 text-xl font-semibold text-gray-900 lg:ml-0">
            Business Management
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors rounded-md">
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-full">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}